import express, { json } from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = 5000;
const resultsFilePath = path.join(__dirname, 'data', 'results.json');
const patientsFilePath = path.join(__dirname, 'data', 'patients.json');
const uploadedResultsFilePath = path.join(__dirname, 'data', 'uploaded-results.json');

const requiredAuthSettings = ['ADMIN_USERNAME', 'ADMIN_PASSWORD_HASH', 'JWT_SECRET'];
const missingAuthSettings = requiredAuthSettings.filter((setting) => !process.env[setting]);
if (missingAuthSettings.length > 0) {
  console.warn(`Admin authentication is not configured. Missing: ${missingAuthSettings.join(', ')}`);
}

app.use(cors());
app.use(express.json());

const resultsUploadDir = path.join(__dirname, 'uploads', 'result-pdfs');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      fs.mkdirSync(resultsUploadDir, { recursive: true });
      cb(null, resultsUploadDir);
    } catch (error) {
      cb(error);
    }
    },
    filename:(req, file, cb) =>
    {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`;
        cb(null, uniqueName);
    },
});
const uploadPdf = multer({
    storage,
    limits: {
        fileSize: 10 * 1024* 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error ("Only PDF files are allowed"));
        }
    },
});

const patientLookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many result lookup attempts. Please try again in 15 minutes.',
  },
});

function saveResults(results) {
  fs.mkdirSync(path.dirname(resultsFilePath), { recursive: true });
  fs.writeFileSync(resultsFilePath, JSON.stringify(results, null, 2));
}

function readResults() {
  if (!fs.existsSync(resultsFilePath)) {
    saveResults([]);
    return [];
  }

  const data = fs.readFileSync(resultsFilePath, 'utf-8').trim();
  return data ? JSON.parse(data) : [];
}

function savePatients(patients) {
  fs.mkdirSync(path.dirname(patientsFilePath), { recursive: true });
  fs.writeFileSync(patientsFilePath, JSON.stringify(patients, null, 2));
}

function readPatients() {
  if (!fs.existsSync(patientsFilePath)) {
    savePatients([]);
    return [];
  }

  const data = fs.readFileSync(patientsFilePath, 'utf-8').trim();
  return data ? JSON.parse(data) : [];
}

function requireAdmin(req, res, next) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';

  if (!token) {
    return res.status(401).json({ message: 'Admin login is required.' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access is required.' });
    }
    req.admin = user;
    return next();
  } catch {
    return res.status(401).json({ message: 'Your session has expired. Please log in again.' });
  }
}

function requireRoles(...roles) {
  return (req, res, next) => {
    const authorization = req.headers.authorization || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';

    if (!token) {
      return res.status(401).json({ message: 'A valid login is required.' });
    }

    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);
      if (!roles.includes(user.role) && user.role !== 'admin') {
        return res.status(403).json({ message: 'You do not have permission to access this resource.' });
      }
      req.user = user;
      return next();
    } catch {
      return res.status(401).json({ message: 'Your session has expired. Please log in again.' });
    }
  };
}

const requireSecretary = requireRoles('secretary');
const requireScientist = requireRoles('scientist', 'secretary');
const requirePatient = requireRoles('patient');

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.post("/api/admin/login", async (req, res) => {
    try{
        const { username, password } = req.body;
        // check that credentials were provided
        if (!username || !password) {
          return res.status(400).json({
                message: "Username and password required.",
          });
        }
        // check that environment variables are configured
         if(
            !process.env.ADMIN_USERNAME ||
            !process.env.ADMIN_PASSWORD_HASH || !process.env.JWT_SECRET) {
                console.error("Admin authentication settings are missing.");
                return res.status(500).json({
                    message:"Authentication is not configured."
                });
            }
            // verify username
            if (username !== process.env.ADMIN_USERNAME){
              return res.status(401).json({
                    message:"Invalid username or password.",
              });
            }
            //verify passwprd against its stored hash

            const passwordIsValid = await bcrypt.compare(
                password,
                process.env.ADMIN_PASSWORD_HASH
            );
         if (!passwordIsValid) {
            return res.status(401).json({
                message: "Invalid username or passwprd"
            });
         }
         // create authentication token
         const token = jwt.sign({
            username: process.env.ADMIN_USERNAME,
            role:"admin",
         },
         process.env.JWT_SECRET,
         {
            expiresIn: "30m"
         }
        );
        return res.json({
            message: "login successful.",
            token, 
            user:{
                username: process.env.ADMIN_USERNAME,
                role: "admin",
            },
        });
         
} catch (error){
    console.error("Admin login failed.");
    return res.status(500).json({
        message: "unable to complete login.",
    });

}
});

app.post('/api/staff/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const staffAccounts = [
      {
        username: process.env.ADMIN_USERNAME,
        passwordHash: process.env.ADMIN_PASSWORD_HASH,
        role: 'admin',
      },
      {
        username: process.env.SECRETARY_USERNAME,
        passwordHash: process.env.SECRETARY_PASSWORD_HASH,
        role: 'secretary',
      },
      {
        username: process.env.SCIENTIST_USERNAME,
        passwordHash: process.env.SCIENTIST_PASSWORD_HASH,
        role: 'scientist',
      },
    ].filter((account) => account.username && account.passwordHash);

    for (const account of staffAccounts) {
      if (username === account.username && await bcrypt.compare(password, account.passwordHash)) {
        const token = jwt.sign(
          { username: account.username, role: account.role },
          process.env.JWT_SECRET,
          { expiresIn: '8h' }
        );
        return res.json({
          message: 'Login successful.',
          token,
          user: { username: account.username, role: account.role },
        });
      }
    }

    return res.status(401).json({ message: 'Invalid username or password.' });
  } catch (error) {
    console.error('Staff login failed.', error);
    return res.status(500).json({ message: 'Unable to complete login.' });
  }
});

app.post('/api/patient/login', async (req, res) => {
  try {
    const { patientId, pin } = req.body;
    if (!patientId?.trim() || !pin) {
      return res.status(400).json({ message: 'Patient ID and PIN are required.' });
    }

    const patient = readPatients().find((item) => item.patientId === patientId.trim().toUpperCase());
    if (!patient?.pinHash || !await bcrypt.compare(String(pin), patient.pinHash)) {
      return res.status(401).json({ message: 'Invalid patient ID or PIN.' });
    }

    const token = jwt.sign(
      { patientId: patient.patientId, role: 'patient' },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      message: 'Login successful.',
      token,
      patient: { patientId: patient.patientId, fullName: patient.fullName },
    });
  } catch (error) {
    console.error('Patient login failed.', error);
    return res.status(500).json({ message: 'Unable to complete login.' });
  }
});

app.post('/api/patients', requireSecretary, async (req, res) => {
  try {
    const { fullName, dateOfBirth, sex, phone, email = '', address = '' } = req.body;

    if (!fullName?.trim() || !dateOfBirth || !sex || !phone?.trim()) {
      return res.status(400).json({
        message: 'Full name, date of birth, sex, and phone are required.',
      });
    }

    const patients = readPatients();
    const year = new Date().getFullYear();
    const idPrefix = `RML-P-${year}-`;
    const largestSequence = patients.reduce((largest, patient) => {
      if (!patient.patientId?.startsWith(idPrefix)) return largest;
      const sequence = Number(patient.patientId.slice(idPrefix.length));
      return Number.isInteger(sequence) ? Math.max(largest, sequence) : largest;
    }, 0);

    const patient = {
      patientId: `${idPrefix}${String(largestSequence + 1).padStart(5, '0')}`,
      fullName: fullName.trim(),
      dateOfBirth,
      sex,
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      registeredAt: new Date().toISOString(),
    };

    patients.push(patient);
    savePatients(patients);

    return res.status(201).json({
      message: 'Patient registered successfully.',
      patient: {
        patientId: patient.patientId,
        fullName: patient.fullName,
        dateOfBirth: patient.dateOfBirth,
        sex: patient.sex,
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        registeredAt: patient.registeredAt,
      },
    });
  } catch (error) {
    console.error('Patient registration failed.', error);
    return res.status(500).json({ message: 'Unable to register patient.' });
  }
});

app.get('/api/patients', requireSecretary, (req, res) => {
  try {
    const patients = readPatients().map(({ pinHash, ...patient }) => patient);
    return res.json(patients);
  } catch (error) {
    console.error('Patient list retrieval failed.', error);
    return res.status(500).json({ message: 'Unable to retrieve patients.' });
  }
});

app.get('/api/patient/results', requirePatient, (req, res) => {
  try {
    const approvedResults = fs.existsSync(uploadedResultsFilePath)
      ? JSON.parse(fs.readFileSync(uploadedResultsFilePath, 'utf8') || '[]')
      : [];
    const patientHistory = approvedResults
      .filter((item) => item.patientId === req.user.patientId && item.status === 'Approved')
      .sort((left, right) => new Date(right.testDate || right.uploadedAt) - new Date(left.testDate || left.uploadedAt));

    return res.json(patientHistory);
  } catch (error) {
    console.error('Patient result history retrieval failed.', error);
    return res.status(500).json({ message: 'Unable to retrieve your approved results.' });
  }
});

app.get('/api/staff/results', requireSecretary, (req, res) => {
  try {
    const uploadedResults = fs.existsSync(uploadedResultsFilePath)
      ? JSON.parse(fs.readFileSync(uploadedResultsFilePath, 'utf8') || '[]')
      : [];
    return res.json(uploadedResults);
  } catch (error) {
    console.error('Uploaded result list retrieval failed.', error);
    return res.status(500).json({ message: 'Unable to retrieve uploaded results.' });
  }
});

app.get('/api/scientist/results/pending', requireScientist, (req, res) => {
  try {
    const uploadedResults = fs.existsSync(uploadedResultsFilePath)
      ? JSON.parse(fs.readFileSync(uploadedResultsFilePath, 'utf8') || '[]')
      : [];
    return res.json(uploadedResults.filter((item) => item.status === 'Pending Approval'));
  } catch (error) {
    console.error('Pending result retrieval failed.', error);
    return res.status(500).json({ message: 'Unable to retrieve pending results.' });
  }
});

app.patch('/api/scientist/results/:id/review', requireScientist, (req, res) => {
  try {
    const { decision, reason = '' } = req.body;
    if (!['Approved', 'Rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be Approved or Rejected.' });
    }
    if (decision === 'Rejected' && !reason.trim()) {
      return res.status(400).json({ message: 'A rejection reason is required.' });
    }

    const uploadedResults = fs.existsSync(uploadedResultsFilePath)
      ? JSON.parse(fs.readFileSync(uploadedResultsFilePath, 'utf8') || '[]')
      : [];
    const index = uploadedResults.findIndex((item) => item.id === req.params.id);
    if (index < 0) {
      return res.status(404).json({ message: 'Uploaded result was not found.' });
    }
    if (uploadedResults[index].status !== 'Pending Approval') {
      return res.status(409).json({ message: 'This result has already been reviewed.' });
    }

    uploadedResults[index] = {
      ...uploadedResults[index],
      status: decision,
      rejectionReason: decision === 'Rejected' ? reason.trim() : '',
      reviewedBy: req.user.username,
      reviewedAt: new Date().toISOString(),
    };
    fs.writeFileSync(uploadedResultsFilePath, JSON.stringify(uploadedResults, null, 2));
    return res.json({ message: `Result ${decision.toLowerCase()}.`, result: uploadedResults[index] });
  } catch (error) {
    console.error('Result review failed.', error);
    return res.status(500).json({ message: 'Unable to review this result.' });
  }
});

function sendUploadedPdf(req, res, patientAccess = false) {
  try {
    const uploadedResults = fs.existsSync(uploadedResultsFilePath)
      ? JSON.parse(fs.readFileSync(uploadedResultsFilePath, 'utf8') || '[]')
      : [];
    const result = uploadedResults.find((item) => item.id === req.params.id);
    if (!result || (patientAccess && (
      result.patientId !== req.user.patientId || result.status !== 'Approved'
    ))) {
      return res.status(404).json({ message: 'Result not found.' });
    }

    const pdfPath = path.join(resultsUploadDir, path.basename(result.pdfFile));
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ message: 'The PDF file is no longer available on the server.' });
    }

    return res.sendFile(pdfPath, (error) => {
      if (error && !res.headersSent) {
        return res.status(500).json({ message: 'Unable to deliver the PDF file.' });
      }
    });
  } catch (error) {
    console.error('PDF delivery failed.', error);
    return res.status(500).json({ message: 'Unable to deliver the PDF file.' });
  }
}

app.get('/api/patient/results/:id/pdf', requirePatient, (req, res) => sendUploadedPdf(req, res, true));
app.get('/api/staff/results/:id/pdf', requireSecretary, (req, res) => sendUploadedPdf(req, res));
app.get('/api/scientist/results/:id/pdf', requireScientist, (req, res) => sendUploadedPdf(req, res));

// public patient lookup
app.post("/api/patient/results/lookup", patientLookupLimiter, (req, res) => {
  try {
    const { reference, accessCode } = req.body;

    if (!reference || !accessCode) {
      return res.status(400).json({
        message: "Reference number and access code are required.",
      });
    }

    const results = readResults();
    const normalizedReference = reference.trim().toUpperCase();
    const normalizedAccessCode = accessCode.trim().toUpperCase();
    const foundResult = results.find((item) => {
      const recordReference = (item.referenceNumber || item.reference || "").toUpperCase();
      return recordReference === normalizedReference;
    });

    if (!foundResult || !foundResult.accessCodeHash) {
      return res.status(404).json({
        message: "Invalid reference number or access code.",
      });
    }

    const submittedCodeHash = crypto
      .createHash("sha256")
      .update(normalizedAccessCode)
      .digest("hex");

    if (submittedCodeHash !== foundResult.accessCodeHash) {
      return res.status(401).json({
        message: "Invalid reference number or access code.",
      });
    }

    const result = {
      reference: foundResult.referenceNumber || foundResult.reference,
      referenceNumber: foundResult.referenceNumber || foundResult.reference,
      patientName: foundResult.patientName,
      age: foundResult.age,
      sex: foundResult.sex,
      sampleDate: foundResult.sampleDate,
      testName: foundResult.testName,
      result: foundResult.result,
      remarks: foundResult.remarks,
      scientist: foundResult.scientist,
      createdAt: foundResult.createdAt,
    };

    return res.status(200).json({
      message: "Result retrieved successfully.",
      result,
    });
  } catch (error) {
    console.error("Patient result lookup failed.", error);
    return res.status(500).json({
      message: "Unable to retrieve the result at this time.",
    });
  }
});

app.post('/api/results', requireAdmin, (req, res) => {
  const {
    patientName,
    age,
    sex,
    sampleDate,
    testName,
    result,
    remarks,
    scientist,
  } = req.body;

  if (!patientName || !age || !sex || !sampleDate || !testName || !result || !remarks || !scientist) {
    return res.status(400).json({ error: 'Please provide all required fields' });
  }

  const results = readResults();
  const referenceNumber = `RML-${new Date().getFullYear()}-${String(results.length + 1).padStart(5, '0')}`;

  const patientAccessCode = crypto
  .randomBytes(6)
  .toString("hex")
  .toUpperCase();
  const newResult = {
    referenceNumber,
    reference: referenceNumber,
    patientName,
    age,
    sex,
    sampleDate,
    testName,
    result,
    remarks: remarks || '',
    scientist: scientist || '',
    patientAccessCode,
    accessCodeHash: crypto
      .createHash("sha256")
      .update(patientAccessCode)
      .digest("hex"),
    createdAt: new Date().toISOString(),
  };

  results.push(newResult);
  saveResults(results);

  res.status(201).json({
    message: 'Laboratory result created successfully',
    result: newResult,
    patientAccessCode,
  });
});
app.get("/api/results", requireAdmin, (req, res) =>{
    try{
    const results = readResults();
    res.json(results);
 } catch (error){
    res.status(500).json({
        message: "Unable to retrieve laboratory results.",
    });
 }
});
app.get('/api/results/:referenceNumber', (req, res) => {
 

  const reference = req.params.referenceNumber.toUpperCase();
  const results = readResults();
  const result = results.find((r) => (r.referenceNumber || r.reference) === reference);

  if (!result) {
    return res.status(404).json({ error: 'Result not found' });
  }

  const responseResult = {
    ...result,
    reference: result.referenceNumber || result.reference,
    referenceNumber: result.referenceNumber || result.reference,
  };

  return res.json({ result: responseResult });
});

app.post(
  '/api/results/upload-pdf',
  requireSecretary,
  (req, res, next) => {
    uploadPdf.single('resultPDF')(req, res, (error) => {
      if (error) {
        const status = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE'
          ? 413
          : 400;
        return res.status(status).json({ message: error.message || 'Unable to process uploaded PDF.' });
      }
      return next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Please upload a PDF result.' });
      }

      const { patientId, testName, testDate } = req.body;
      if (!patientId?.trim() || !testName?.trim() || !testDate) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'A registered patient, test name, and test date are required.' });
      }

      const patients = readPatients();
      const patientIndex = patients.findIndex((item) => item.patientId === patientId.trim());
      if (patientIndex < 0) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: 'Patient ID not found. Select a registered patient.' });
      }

      let patientPin;
      if (!patients[patientIndex].pinHash) {
        patientPin = String(crypto.randomInt(100000, 1000000));
        patients[patientIndex] = {
          ...patients[patientIndex],
          pinHash: await bcrypt.hash(patientPin, 12),
          pinIssuedAt: new Date().toISOString(),
        };
      }

      const uploadedResults = fs.existsSync(uploadedResultsFilePath)
        ? JSON.parse(fs.readFileSync(uploadedResultsFilePath, 'utf8') || '[]')
        : [];
      const uploadedResult = {
        id: crypto.randomUUID(),
        patientId: patientId.trim(),
        patientName: patients[patientIndex].fullName,
        testName: testName.trim(),
        testDate,
        pdfFile: req.file.filename,
        status: 'Pending Approval',
        uploadedAt: new Date().toISOString(),
      };

      fs.mkdirSync(path.dirname(uploadedResultsFilePath), { recursive: true });
      uploadedResults.push(uploadedResult);
      fs.writeFileSync(uploadedResultsFilePath, JSON.stringify(uploadedResults, null, 2));
      savePatients(patients);

      return res.status(201).json({
        message: 'PDF result uploaded successfully.',
        result: uploadedResult,
        ...(patientPin ? { patientPin } : {}),
        pinAlreadyIssued: !patientPin,
        patient: {
          patientId: patients[patientIndex].patientId,
          fullName: patients[patientIndex].fullName,
        },
      });
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      console.error('PDF upload error:', error);
      return res.status(500).json({ message: 'Failed to save the uploaded PDF result.' });
    }
  }
);



app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

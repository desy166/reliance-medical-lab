import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = 5000;
const resultsFilePath = path.join(__dirname, 'data', 'results.json');

const requiredAuthSettings = ['ADMIN_USERNAME', 'ADMIN_PASSWORD_HASH', 'JWT_SECRET'];
const missingAuthSettings = requiredAuthSettings.filter((setting) => !process.env[setting]);
if (missingAuthSettings.length > 0) {
  console.warn(`Admin authentication is not configured. Missing: ${missingAuthSettings.join(', ')}`);
}

app.use(cors());
app.use(express.json());

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
    patientName,
    age,
    sex,
    sampleDate,
    testName,
    result,
    remarks: remarks || '',
    scientist: scientist || '',
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
  const result = results.find((r) => r.referenceNumber === reference);

  if (!result) {
    return res.status(404).json({ error: 'Result not found' });
  }

  res.json({ result });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const PORT = 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const resultsFilePath = path.join(__dirname, 'data', 'results.json');

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

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.post('/api/results', (req, res) => {
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
    createdAt: new Date().toISOString(),
  };

  results.push(newResult);
  saveResults(results);

  res.status(201).json({
    message: 'Laboratory result created successfully',
    result: newResult,
  });
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

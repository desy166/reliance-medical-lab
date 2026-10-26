import { useState } from "react";
import "./Results.css";

function Results() {
const [reference, setReference] = useState("");
const [result, setResult] = useState(null);
const [error, setError] = useState("");
const [loading, setLoading] = useState(false);

const handleCheckResult = async (e) => {
e.preventDefault();

if (!reference.trim()) {
  setError("Please enter your result reference number.");
  setResult(null);
  return;
}

setLoading(true);
setError("");
setResult(null);

try {
  const response = await fetch(
    `http://localhost:5000/api/results/${encodeURIComponent(
      reference.trim()
    )}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to retrieve result.");
  }

  setResult(data);
} catch (err) {
  setError(
    err.message === "Failed to fetch"
      ? "Unable to connect to the server. Please try again."
      : err.message
  );
} finally {
  setLoading(false);
}

};

return (
<section className="results-section" id="results">
<div className="results-container">
<h2>Patient Result Portal</h2>

    <p>
      Enter your laboratory result reference number to check your result.
    </p>

    <form onSubmit={handleCheckResult} className="results-form">
      <input
        type="text"
        placeholder="e.g. RML-2026-00001"
        value={reference}
        onChange={(e) => setReference(e.target.value)}
      />

      <button type="submit" disabled={loading}>
        {loading ? "Checking..." : "Check Result"}
      </button>
    </form>

    {error && <p className="result-error">{error}</p>}

    {result && (
      <div className="result-card">
        <h3>Laboratory Result</h3>

        <p>
          <strong>Reference:</strong> {result.reference}
        </p>

        <p>
          <strong>Patient Name:</strong> {result.patientName}
        </p>

        <p>
          <strong>Age:</strong> {result.age}
        </p>

        <p>
          <strong>Sex:</strong> {result.sex}
        </p>

        <p>
          <strong>Sample Date:</strong> {result.sampleDate}
        </p>

        <p>
          <strong>Test:</strong> {result.testName}
        </p>

        <p>
          <strong>Result:</strong> {result.result}
        </p>

        {result.remarks && (
          <p>
            <strong>Remarks:</strong> {result.remarks}
          </p>
        )}

        {result.scientist && (
          <p>
            <strong>Authorized By:</strong> {result.scientist}
          </p>
        )}
      </div>
    )}
  </div>
</section>

);
}

export default Results;
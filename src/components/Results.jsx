import { useState } from "react";
import { Download } from "lucide-react";
import logo from "../assets/file_00000000bff0820ab8a502466c888f49.png";
import "./Results.css";
import jsPDF from "jspdf";

function Results() {
  const [reference, setReference] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCheckResult = async (e) => {
    e.preventDefault();

    if (!reference.trim() || !accessCode.trim()) {
      setError("Please enter your reference number and access code.");
      setResult(null);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("http://localhost:5000/api/patient/results/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference: reference.trim(),
          accessCode: accessCode.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to retrieve result.");
      }

      setResult(data.result || null);
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

  const downloadPatientPDF = async () => {
    if (!result) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    try {
      const logoImage = new Image();
      logoImage.src = logo;
      await logoImage.decode();
      const canvas = document.createElement("canvas");
      canvas.width = logoImage.naturalWidth;
      canvas.height = logoImage.naturalHeight;
      const context = canvas.getContext("2d");
      context.drawImage(logoImage, 0, 0);
      doc.addImage(canvas.toDataURL("image/png"), "PNG", 15, 10, 24, 24);
    } catch (imageError) {
      console.error("Unable to add laboratory logo to PDF.", imageError);
    }

    doc.setFontSize(17);
    doc.setTextColor(23, 74, 139);
    doc.text("RELIANCE MEDICAL LABORATORY", pageWidth / 2, 16, {
        align: "center",
    });

    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text("123 Main Street, City, State 12345", pageWidth / 2, 23, {
        align: "center",
    });
    doc.text("info@reliancemedlab.com", pageWidth / 2, 28, {
        align: "center",
    });

    doc.setFontSize(11);
    doc.setTextColor(23, 74, 139);
    doc.text("Laboratory Test Report", pageWidth / 2, 35, {
        align: "center",
    });

    doc.setDrawColor(213, 43, 63);
    doc.line(15, 40, 195, 40);


    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
     const fields = [
      ["Reference Number", result.referenceNumber || result.reference],
      ["Patient Name",
        result.patientName
        ],
      ["Age", result.age],
      ["Sex", result.sex],
      ["Sample Date", result.sampleDate],
      ["Test Name", result.testName],
      ["Test Result", result.result],
      ["Remarks", result.remarks || "None"],
      ["Authorized By", result.scientist || "Not specified"],
     ];
      let y = 52;

      fields.forEach(([label, value]) =>
     {
        const safeValue = String(value?? "Not specified");
         const lines = doc.splitTextToSize(safeValue,155);
         doc.setFont("helvetica", "bold");
         doc.text(`${label}:`, 15, y);

         doc.setFont("helvetica", "normal");
         doc.text(lines, 75, y);
        y += Math.max(lines.length, 1) * 7 + 5;

        if (y > 260){
            doc.addPage();
            y = 20;

        }
    });
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("Please consult a qualified healthcare professional to interpret your results.", 105, 285, 
        {align: "center", maxWidth: 180});

     doc.save(`Reliance-Lab-Report-${result.referenceNumber || result.reference}.pdf`);   
  };

  return (
    <section className="results-section" id="results">
      <div className="results-container">
        <div className="results-intro">
          <div className="lab-brand">
            <img src={logo} alt="Reliance Medical Laboratory logo" />
            <div>
              <span className="brand-kicker">Reliance Medical</span>
              <h3>Laboratory</h3>
            </div>
          </div>

          <p className="results-intro-text">
            Securely access your test reports using your reference number and access code.
          </p>

          <div className="lab-contact-list">
            <div className="contact-row">
              <div className="contact-icon">📍</div>
              <div>
                <span>Address</span>
                <p>123 Main Street, City, State 12345</p>
              </div>
            </div>

            <div className="contact-row">
              <div className="contact-icon">✉️</div>
              <div>
                <span>Email</span>
                <p>info@reliancemedlab.com</p>
              </div>
            </div>

            <div className="contact-row">
              <div className="contact-icon">📞</div>
              <div>
                <span>Office Phone</span>
                <p>+1 (123) 456-7890</p>
              </div>
            </div>
          </div>
        </div>

        <div className="results-panel">
          <p className="section-subtitle">PATIENT PORTAL</p>
          <h2>Check Your Results</h2>
          <p className="results-panel-text">
            Enter the reference number assigned to your sample and your access code to view your test result.
          </p>

          <form onSubmit={handleCheckResult} className="results-form">
            <label htmlFor="reference">Reference Number</label>
            <div className="result-input">
              <input
                id="reference"
                type="text"
                placeholder="e.g. RML-2026-00001"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>

            <label htmlFor="accessCode">Access Code</label>
            <div className="result-input">
              <input
                id="accessCode"
                type="password"
                placeholder="Enter your access code"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Checking..." : "Check Result"}
            </button>
          </form>

          {error && <p className="result-error">{error}</p>}

          {result && (
            <div className="result-card">
              <div className="result-card-header">
                <div className="result-card-icon">✓</div>
                <h3>Laboratory Result</h3>
              </div>

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

              <button
                type="button"
                className="download-result-btn"
                onClick={downloadPatientPDF}
              >
                <Download size={18} aria-hidden="true" />
                <span>Download PDF Report</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default Results;
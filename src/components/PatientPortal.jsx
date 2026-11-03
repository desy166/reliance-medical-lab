import { useState } from "react";
import { Download, FileText, LogOut, ShieldCheck } from "lucide-react";
import "./PatientPortal.css";

function PatientPortal() {
  const [patientId, setPatientId] = useState("");
  const [pin, setPin] = useState("");
  const [token, setToken] = useState("");
  const [patient, setPatient] = useState(null);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/patient/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: patientId.trim().toUpperCase(), pin }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to sign in.");

      const historyResponse = await fetch("http://localhost:5000/api/patient/results", {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      const historyData = await historyResponse.json();
      if (!historyResponse.ok) throw new Error(historyData.message || "Unable to load your reports.");

      setToken(data.token);
      setPatient(data.patient);
      setReports(historyData);
      setPin("");
    } catch (requestError) {
      setError(requestError.message === "Failed to fetch"
        ? "Unable to connect to the laboratory server. Please try again."
        : requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (report) => {
    setDownloadingId(report.id);
    setError("");

    try {
      const response = await fetch(`http://localhost:5000/api/patient/results/${report.id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Unable to download this report.");
      }

      const fileUrl = URL.createObjectURL(await response.blob());
      const downloadLink = document.createElement("a");
      downloadLink.href = fileUrl;
      downloadLink.download = `${report.testName}-${report.testDate}.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      URL.revokeObjectURL(fileUrl);
    } catch (requestError) {
      setError(requestError.message || "Unable to download this report.");
    } finally {
      setDownloadingId("");
    }
  };

  const handleLogout = () => {
    setToken("");
    setPatient(null);
    setReports([]);
    setPatientId("");
    setPin("");
    setError("");
  };

  return (
    <main className="patient-portal">
      <header className="patient-portal-header">
        <a className="patient-portal-brand" href="/" aria-label="Reliance Medical Laboratory home">
          <span className="patient-portal-mark">R</span>
          <span><strong>RELIANCE</strong><small>MEDICAL LABORATORY</small></span>
        </a>
        <a className="patient-home-link" href="/">Back to website</a>
      </header>

      {!patient ? (
        <section className="patient-login-wrap">
          <div className="patient-login-aside">
            <ShieldCheck size={30} />
            <p className="patient-eyebrow">PRIVATE PATIENT ACCESS</p>
            <h1>Your laboratory results, in one place.</h1>
            <p>Sign in with the patient ID and PIN provided by the laboratory to access approved reports.</p>
          </div>
          <form className="patient-login-form" onSubmit={handleLogin}>
            <p className="patient-eyebrow">PATIENT PORTAL</p>
            <h2>Sign in</h2>
            <label htmlFor="patient-id">Patient ID</label>
            <input
              id="patient-id"
              value={patientId}
              onChange={(event) => setPatientId(event.target.value)}
              placeholder="RML-P-2026-00001"
              autoComplete="username"
              required
            />
            <label htmlFor="patient-pin">PIN</label>
            <input
              id="patient-pin"
              type="password"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              inputMode="numeric"
              autoComplete="current-password"
              required
            />
            {error && <p className="patient-portal-error" role="alert">{error}</p>}
            <button type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in securely"}
            </button>
          </form>
        </section>
      ) : (
        <section className="patient-history">
          <div className="patient-history-heading">
            <div>
              <p className="patient-eyebrow">PATIENT PORTAL</p>
              <h1>Welcome, {patient.fullName}</h1>
              <p>Patient ID: <strong>{patient.patientId}</strong></p>
            </div>
            <button type="button" className="patient-logout" onClick={handleLogout}>
              <LogOut size={17} /> Sign out
            </button>
          </div>

          {error && <p className="patient-portal-error" role="alert">{error}</p>}
          <div className="patient-report-heading">
            <div>
              <h2>Approved results</h2>
              <p>{reports.length} report{reports.length === 1 ? "" : "s"} available</p>
            </div>
          </div>

          {reports.length === 0 ? (
            <div className="patient-empty-state">
              <FileText size={30} />
              <h3>No approved reports yet</h3>
              <p>Reports will appear here after laboratory review and approval.</p>
            </div>
          ) : (
            <div className="patient-report-list">
              {reports.map((report) => (
                <article className="patient-report-row" key={report.id}>
                  <div className="patient-report-icon"><FileText size={21} /></div>
                  <div className="patient-report-info">
                    <h3>{report.testName}</h3>
                    <p>{report.testDate} <span>•</span> Approved {report.reviewedAt ? new Date(report.reviewedAt).toLocaleDateString() : ""}</p>
                  </div>
                  <button
                    type="button"
                    className="patient-download"
                    onClick={() => downloadReport(report)}
                    disabled={downloadingId === report.id}
                  >
                    <Download size={17} />
                    {downloadingId === report.id ? "Downloading..." : "Download PDF"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default PatientPortal;

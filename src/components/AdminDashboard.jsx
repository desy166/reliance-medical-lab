
import { useState, useEffect} from "react";
import {
  Activity,
  ClipboardList,
  FilePlus2,
  LayoutDashboard,
  Menu,
  Search,
  Upload,
  UserPlus,
  CircleCheck,
  FileText,
  X,
} from "lucide-react";
import { jsPDF } from "jspdf";
import "./AdminDashboard.css";

function AdminDashboard() {
  const generatePDF = (patient) => {
    const doc = new jsPDF();
    const referenceNumber = patient.referenceNumber || "Lab-Report";
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;
    let cursorY = 55;

    const drawHeader = (continued = false) => {
      doc.setFillColor(20, 55, 78);
      doc.rect(0, 0, pageWidth, 43, "F");
      doc.setFillColor(27, 154, 145);
      doc.rect(0, 43, pageWidth, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("RELIANCE", margin, 19);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("MEDICAL LABORATORY", margin, 26);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(continued ? "TEST REPORT - CONTINUED" : "LABORATORY TEST REPORT", pageWidth - margin, 20, {
        align: "right",
      });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Reference: ${referenceNumber}`, pageWidth - margin, 29, { align: "right" });
    };

    const addPage = () => {
      doc.addPage();
      drawHeader(true);
      cursorY = 56;
    };

    const ensureSpace = (height) => {
      if (cursorY + height > pageHeight - 24) addPage();
    };

    const drawSectionTitle = (title) => {
      ensureSpace(15);
      doc.setTextColor(20, 55, 78);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(title.toUpperCase(), margin, cursorY);
      doc.setDrawColor(27, 154, 145);
      doc.setLineWidth(0.6);
      doc.line(margin, cursorY + 3, margin + contentWidth, cursorY + 3);
      cursorY += 12;
    };

    const drawParagraph = (label, value, emphasize = false) => {
      const lines = doc.splitTextToSize(String(value || "N/A"), contentWidth - 4);
      ensureSpace(14);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(91, 112, 125);
      doc.text(label.toUpperCase(), margin, cursorY);
      cursorY += 5;

      lines.forEach((line) => {
        ensureSpace(6);
        doc.setFont("helvetica", emphasize ? "bold" : "normal");
        doc.setFontSize(emphasize ? 12 : 10);
        doc.setTextColor(...(emphasize ? [20, 55, 78] : [40, 52, 61]));
        doc.text(line, margin, cursorY);
        cursorY += emphasize ? 7 : 5.5;
      });
      cursorY += 4;
    };

    drawHeader();
    doc.setFillColor(241, 247, 248);
    doc.roundedRect(margin, cursorY, contentWidth, 41, 2, 2, "F");
    doc.setTextColor(20, 55, 78);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("PATIENT INFORMATION", margin + 5, cursorY + 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(40, 52, 61);
    doc.text(`Patient: ${patient.patientName || "N/A"}`, margin + 5, cursorY + 18);
    doc.text(`Age: ${patient.age ?? "N/A"}`, margin + 5, cursorY + 27);
    doc.text(`Sex: ${patient.sex || "N/A"}`, margin + 92, cursorY + 27);
    doc.text(`Sample date: ${patient.sampleDate || "N/A"}`, margin + 5, cursorY + 36);
    cursorY += 52;

    drawSectionTitle("Test details");
    drawParagraph("Test name", patient.testName);
    drawParagraph("Result", patient.result, true);
    drawParagraph("Remarks", patient.remarks || "No remarks provided");

    ensureSpace(22);
    cursorY += 3;
    doc.setDrawColor(180, 193, 199);
    doc.line(margin, cursorY, margin + 58, cursorY);
    cursorY += 7;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(40, 52, 61);
    doc.text(String(patient.scientist || "Authorized Scientist"), margin, cursorY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(91, 112, 125);
    doc.text("Authorized laboratory scientist", margin, cursorY + 5);

    const pageCount = doc.internal.getNumberOfPages();
    for (let page = 1; page <= pageCount; page += 1) {
      doc.setPage(page);
      doc.setDrawColor(220, 228, 231);
      doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(110, 126, 135);
      doc.text(`Generated ${new Date().toLocaleDateString()}`, margin, pageHeight - 9);
      doc.text(`Page ${page} of ${pageCount}`, pageWidth - margin, pageHeight - 9, {
        align: "right",
      });
    }

    doc.save(`${referenceNumber}.pdf`);
  };

  const [activePage, setActivePage] = useState("Dashboard");
  const [authToken, setAuthToken] = useState("");
  const [staffUser, setStaffUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginPending, setLoginPending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    patientName: "",
    age: "",
    sex: "",
    sampleDate: "",
    testName: "",
    result: "",
    remarks: "",
    scientist: "",
  });
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [createdResult, setCreatedResult] = useState(null);
  const [allResults, setAllResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState("");
  const [selectedResult, setSelectedResult] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    patientId: "",
    patientName: "",
    testName: "",
    testDate: "",
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploadedPatientCredentials, setUploadedPatientCredentials] = useState(null);
  const [patientForm, setPatientForm] = useState({
    fullName: "",
    dateOfBirth: "",
    sex: "",
    phone: "",
    email: "",
    address: "",
  });
  const [registeredPatient, setRegisteredPatient] = useState(null);
  const [patientFormError, setPatientFormError] = useState("");
  const [patientFormSaving, setPatientFormSaving] = useState(false);
  const [registeredPatients, setRegisteredPatients] = useState([]);
  const [patientsError, setPatientsError] = useState("");
  const [pendingReports, setPendingReports] = useState([]);
  const [uploadedReports, setUploadedReports] = useState([]);
  const [reviewError, setReviewError] = useState("");

  const handleAdminLogin = async (event) => {
    event.preventDefault();
    setLoginPending(true);
    setLoginError("");

    try {
      const response = await fetch("http://localhost:5000/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to sign in.");
      }
      if (!data.token) {
        throw new Error("The server did not return a login token.");
      }

      setAuthToken(data.token);
      setStaffUser(data.user);
      setActivePage(data.user.role === "scientist" ? "Review Results" : "Dashboard");
      setLoginForm({ username: "", password: "" });
    } catch (error) {
      setLoginError(
        error.message === "Failed to fetch"
          ? "Cannot connect to the API. Make sure the server is running."
          : error.message
      );
    } finally {
      setLoginPending(false);
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleSubmitResult = async (event) => {
    event.preventDefault();
    setSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("http://localhost:5000/api/results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          ...formData,
          age: Number(formData.age),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to save laboratory result.");
      }

      setSuccessMessage(data.message);
      setCreatedResult({
        ...data.result,
        patientAccessCode: data.patientAccessCode,
      });
      setFormData({
        patientName: "",
        age: "",
        sex: "",
        sampleDate: "",
        testName: "",
        result: "",
        remarks: "",
        scientist: "",
      });
    } catch (error) {
      setErrorMessage(
        error.message === "Failed to fetch"
          ? "Failed to save laboratory result."
          : error.message
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUploadPDF = async (event) => {
    event.preventDefault();
    setUploading(true);
    setUploadMessage("");
    setUploadError("");
    setUploadedPatientCredentials(null);

    try {
      const body = new FormData();
      if (!pdfFile) throw new Error("Select a PDF report to upload.");
      body.append("resultPDF", pdfFile);
      Object.entries(uploadForm).forEach(([key, value]) => body.append(key, value));

      const response = await fetch("http://localhost:5000/api/results/upload-pdf", {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
        body,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to upload PDF result.");
      }

      setUploadMessage(data.message || "PDF result uploaded successfully.");
      setUploadedPatientCredentials({
        patientId: data.patient?.patientId || uploadForm.patientId,
        patientName: data.patient?.fullName || uploadForm.patientName,
        patientPin: data.patientPin,
        pinAlreadyIssued: data.pinAlreadyIssued,
      });
      setUploadForm({ patientId: "", patientName: "", testName: "", testDate: "" });
      setPdfFile(null);
      event.target.reset();
      fetchUploadedReports();
    } catch (error) {
      setUploadError(
        error.message === "Failed to fetch"
          ? "Cannot connect to the API. Make sure the server is running."
          : error.message
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRegisterPatient = async (event) => {
    event.preventDefault();
    setPatientFormSaving(true);
    setPatientFormError("");
    setRegisteredPatient(null);

    try {
      const response = await fetch("http://localhost:5000/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(patientForm),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to register patient.");
      }

      setRegisteredPatient(data.patient);
      setRegisteredPatients((patients) => [data.patient, ...patients]);
      setPatientForm({ fullName: "", dateOfBirth: "", sex: "", phone: "", email: "", address: "" });
    } catch (error) {
      setPatientFormError(
        error.message === "Failed to fetch"
          ? "Cannot connect to the API. Make sure the server is running."
          : error.message
      );
    } finally {
      setPatientFormSaving(false);
    }
  };

  const fetchRegisteredPatients = async () => {
    setPatientsError("");

    try {
      const response = await fetch("http://localhost:5000/api/patients", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load registered patients.");
      }

      setRegisteredPatients(data);
    } catch (error) {
      setPatientsError(
        error.message === "Failed to fetch"
          ? "Unable to connect to the backend. Check that the server is running."
          : error.message
      );
    }
  };

  const fetchUploadedReports = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/staff/results", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load uploaded reports.");
      setUploadedReports(data);
    } catch (error) {
      setUploadError(error.message);
    }
  };

  const fetchPendingReports = async () => {
    setReviewError("");
    try {
      const response = await fetch("http://localhost:5000/api/scientist/results/pending", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load pending reports.");
      setPendingReports(data);
    } catch (error) {
      setReviewError(error.message);
    }
  };

  const handleReportReview = async (report, decision) => {
    const reason = decision === "Rejected"
      ? window.prompt("Enter the reason for rejecting this report:")
      : "";
    if (decision === "Rejected" && !reason?.trim()) return;

    setReviewError("");
    try {
      const response = await fetch(`http://localhost:5000/api/scientist/results/${report.id}/review`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ decision, reason }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to update report status.");
      setPendingReports((reports) => reports.filter((item) => item.id !== report.id));
    } catch (error) {
      setReviewError(error.message);
    }
  };

  const openUploadedReport = async (report) => {
    const reportWindow = window.open("about:blank", "_blank");
    try {
      const pdfRoute = staffUser?.role === "scientist" ? "scientist" : "staff";
      const response = await fetch(`http://localhost:5000/api/${pdfRoute}/results/${report.id}/pdf`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error("Unable to open this PDF report.");
      const pdfUrl = URL.createObjectURL(await response.blob());
      if (reportWindow) reportWindow.location.href = pdfUrl;
      else window.location.href = pdfUrl;
    } catch (error) {
      reportWindow?.close();
      setUploadError(error.message);
    }
  };

  const fetchAllResults = async () => {
    setResultsLoading(true);
    setResultsError("");

    try {
      const response = await fetch("http://localhost:5000/api/results", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load results.");
      }

      setAllResults(data);
    } catch (error) {
      setResultsError(
        error.message === "Failed to fetch"
          ? "Unable to connect to the backend. Check that the server is running."
          : error.message
      );
    } finally {
      setResultsLoading(false);
    }
  };
  useEffect(() => {
    if (authToken) {
      if (staffUser?.role === "scientist") {
        fetchPendingReports();
      } else {
        fetchAllResults();
        fetchRegisteredPatients();
        fetchUploadedReports();
        fetchPendingReports();
      }
    }
  }, [authToken, staffUser]);

  const staffMenuItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { name: "Register Patient", icon: <UserPlus size={18} /> },
    { name: "Add New Result", icon: <FilePlus2 size={18} /> },
    { name: "Upload PDF Result", icon: <Upload size={18} /> },
    { name: "Uploaded Reports", icon: <FileText size={18} /> },
    { name: "Manage Results", icon: <ClipboardList size={18} /> },
  ];
  const scientistMenuItems = [
    { name: "Review Results", icon: <CircleCheck size={18} /> },
  ];
  const menuItems = staffUser?.role === "scientist"
    ? scientistMenuItems
    : staffUser?.role === "secretary"
      ? [...staffMenuItems, ...scientistMenuItems]
      : [...staffMenuItems, ...scientistMenuItems];

  const filteredResults = allResults.filter((item) => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;

    return (
      item.patientName?.toLowerCase().includes(search) ||
      item.referenceNumber?.toLowerCase().includes(search)
    );
  });
  const today = new Date().toDateString();
  const newResultsToday = allResults.filter((item) => {if (!item.createdAt) return false;
    return new
    Date(item.createdAt).toDateString() === today;
  }).length;

  if (!authToken) {
    return (
      <section className="admin-login-page">
        <form className="admin-login-panel" onSubmit={handleAdminLogin}>
          <div className="admin-login-brand">
            <span className="brand-mark" aria-hidden="true">+</span>
            <div>
              <h1>RELIANCE</h1>
              <p>MEDICAL LABORATORY</p>
            </div>
          </div>
          <h2>Admin sign in</h2>
          <p className="admin-login-description">Sign in to manage laboratory records.</p>
          {loginError && <div className="form-error" role="alert">{loginError}</div>}
          <label>
            Username
            <input
              type="text"
              autoComplete="username"
              value={loginForm.username}
              onChange={(event) => setLoginForm({ ...loginForm, username: event.target.value })}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={loginForm.password}
              onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
              required
            />
          </label>
          <button type="submit" className="form-submit-btn" disabled={loginPending}>
            {loginPending ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    );
  }

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <div className="brand-block">
            <span className="brand-mark">+</span>
            <div>
              <h2>RELIANCE</h2>
              <p>MEDICAL LABORATORY</p>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        <p className="sidebar-label">MAIN MENU</p>

        <nav className="admin-nav">
          {menuItems.map((item) => (
            <button
              key={item.name}
              type="button"
              className={activePage === item.name ? "admin-nav-item active" : "admin-nav-item"}
              onClick={() => {
                setActivePage(item.name);
                setSidebarOpen(false);
              }}
            >
              {item.icon}
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="status-dot"></span>
          Laboratory Management System
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="admin-main">
        <header className="admin-header">
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={25} />
          </button>

          <div>
            <h1>{activePage}</h1>
            <p>Welcome to your laboratory management dashboard.</p>
          </div>

          <div className="admin-profile">
            <div className="profile-avatar">RL</div>
            <div className="profile-info">
              <strong>Laboratory Staff</strong>
              <span>{staffUser?.role || "admin"}</span>
            </div>
            <button
              type="button"
              className="admin-logout-btn"
              onClick={() => {
                setAuthToken("");
                setStaffUser(null);
                setAllResults([]);
                setSelectedResult(null);
              }}
            >
              Log out
            </button>
          </div>
        </header>

        {activePage === "Dashboard" && (
          <section className="admin-content">
            <div className="welcome-banner">
              <div>
                <span>ADMINISTRATOR PANEL</span>
                <h2>Welcome to Reliance Medical Laboratory</h2>
                <p>Manage patient results from one place.</p>
              </div>
              <Activity size={55} />
            </div>

            <div className="dashboard-stats">
              <article className="stat-card">
                <div className="stat-icon blue">
                  <ClipboardList size={25} />
                </div>
                <div>
                  <p>Total Results</p>
                  <h3>{allResults.length}</h3>
                  <span>Database integration pending</span>
                </div>
              </article>

              <article className="stat-card">
                <div className="stat-icon green">
                  <Activity size={25} />
                </div>
                <div>
                  <p>System Status</p>
                  <h3>Ready</h3>
                  <span>Dashboard interface loaded</span>
                </div>
              </article>
            </div>

            <div className="admin-panel">
              <h3>Quick Actions</h3>
              <p>Choose what you want to do next.</p>

              <div className="quick-actions">
                <button type="button" onClick={() => setActivePage("Add New Result")}>
                  <FilePlus2 size={22} />
                  <span>
                    <strong>Add New Result</strong>
                    <small>Enter a patient's laboratory result</small>
                  </span>
                </button>

                <button type="button" onClick={() => setActivePage("Manage Results")}>
                  <Search size={22} />
                  <span>
                    <strong>Manage Results</strong>
                    <small>Search existing laboratory records</small>
                  </span>
                </button>
              </div>
            </div>
          </section>
        )}

        {activePage === "Add New Result" && (
          <section className="admin-content">
            <div className="admin-panel result-entry-panel">
              <div className="form-heading">
                <div>
                  <h2>Add New Laboratory</h2>
                  <p>Enter the patient's information and laboratory results below.</p>
                </div>
                <FilePlus2 size={30} />
              </div>
            </div>

            {successMessage && (
              <div className="form-success" role="status">
                <strong>{successMessage}</strong>
                {createdResult && (
                  <>
                    <p>
                      Reference Number: <strong>{createdResult.referenceNumber}</strong>
                    </p>
                    <p>
                      Access Code: <strong>{createdResult.patientAccessCode}</strong>
                    </p>
                    <p>Patient: {createdResult.patientName}</p>
                    <p>Test: {createdResult.testName}</p>
                  </>
                )}
              </div>
            )}

            {errorMessage && (
              <div className="form-error" role="alert">
                <strong>{errorMessage}</strong>
              </div>
            )}

            <form className="result-entry-form" onSubmit={handleSubmitResult}>
              <h3>Patient Information</h3>
              <div className="form-grid">
                <label>
                  Patient Full Name *
                  <input
                    type="text"
                    name="patientName"
                    required
                    value={formData.patientName}
                    onChange={handleInputChange}
                  />
                </label>

                <label>
                  Age *
                  <input
                    type="number"
                    name="age"
                    min="0"
                    max="120"
                    required
                    value={formData.age}
                    onChange={handleInputChange}
                  />
                </label>

                <label>
                  Sex *
                  <select name="sex" required value={formData.sex} onChange={handleInputChange}>
                    <option value="">Select Sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label>
                  Sample Collection Date *
                  <input
                    type="date"
                    name="sampleDate"
                    required
                    value={formData.sampleDate}
                    onChange={handleInputChange}
                  />
                </label>
              </div>

              <h3>Laboratory Test Information</h3>
              <div className="form-grid">
                <label>
                  Test Name *
                  <select name="testName" required value={formData.testName} onChange={handleInputChange}>
                    <option value="">Select Test</option>
                    <option value="Blood Test">Blood Test</option>
                    <option value="Malaria Test">Malaria Test</option>
                    <option value="Genotype Test">Genotype Test</option>
                    <option value="Microscopy">Microscopy</option>
                    <option value="Urinalysis">Urinalysis</option>
                    <option value="Screening Test">Screening Test</option>
                    <option value="Ultrasound Test">Ultrasound Test</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label>
                  Test Result *
                  <input
                    type="text"
                    name="result"
                    value={formData.result}
                    onChange={handleInputChange}
                    placeholder="Enter verified test result"
                    required
                  />
                </label>

                <label className="full-width">
                  Remarks *
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    placeholder="Enter any additional remarks"
                    required
                  />
                </label>

                <label className="full-width">
                  Authorized Scientist
                  <input
                    type="text"
                    name="scientist"
                    value={formData.scientist}
                    onChange={handleInputChange}
                    placeholder="Enter authorized scientist's name"
                  />
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="form-reset-btn"
                  onClick={() => {
                    setFormData({
                      patientName: "",
                      age: "",
                      sex: "",
                      sampleDate: "",
                      testName: "",
                      result: "",
                      remarks: "",
                      scientist: "",
                    });
                    setSuccessMessage("");
                    setCreatedResult(null);
                    setErrorMessage("");
                  }}
                >
                  Clear form
                </button>

                <button type="submit" className="form-submit-btn" disabled={saving}>
                  {saving ? "Saving Result..." : "Save Laboratory Result"}
                </button>
              </div>
            </form>
          </section>
        )}

        {activePage === "Register Patient" && (
          <section className="admin-content">
            <div className="admin-panel result-entry-panel">
              <div className="form-heading">
                <div>
                  <h2>Register Patient</h2>
                  <p>Enter patient details to create a patient ID. A portal PIN is issued after the first result PDF is uploaded.</p>
                </div>
                <UserPlus size={30} />
              </div>

              {registeredPatient && (
                <div className="form-success" role="status">
                  <strong>Patient registered successfully.</strong>
                  <p>Patient ID: <strong>{registeredPatient.patientId}</strong></p>
                  <p>{registeredPatient.fullName}</p>
                </div>
              )}
              {patientFormError && <div className="form-error" role="alert">{patientFormError}</div>}

              <form className="result-entry-form" onSubmit={handleRegisterPatient}>
                <h3>Patient Information</h3>
                <div className="form-grid">
                  <label>
                    Full Name *
                    <input
                      type="text"
                      value={patientForm.fullName}
                      onChange={(event) => setPatientForm({ ...patientForm, fullName: event.target.value })}
                      autoComplete="name"
                      required
                    />
                  </label>

                  <label>
                    Date of Birth *
                    <input
                      type="date"
                      value={patientForm.dateOfBirth}
                      onChange={(event) => setPatientForm({ ...patientForm, dateOfBirth: event.target.value })}
                      required
                    />
                  </label>

                  <label>
                    Sex *
                    <select
                      value={patientForm.sex}
                      onChange={(event) => setPatientForm({ ...patientForm, sex: event.target.value })}
                      required
                    >
                      <option value="">Select sex</option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>

                  <label>
                    Phone Number *
                    <input
                      type="tel"
                      value={patientForm.phone}
                      onChange={(event) => setPatientForm({ ...patientForm, phone: event.target.value })}
                      autoComplete="tel"
                      required
                    />
                  </label>

                  <label>
                    Email Address
                    <input
                      type="email"
                      value={patientForm.email}
                      onChange={(event) => setPatientForm({ ...patientForm, email: event.target.value })}
                      autoComplete="email"
                    />
                  </label>

                  <label>
                    Address
                    <input
                      type="text"
                      value={patientForm.address}
                      onChange={(event) => setPatientForm({ ...patientForm, address: event.target.value })}
                      autoComplete="street-address"
                    />
                  </label>
                </div>

                <div className="form-actions">
                  <button type="submit" className="form-submit-btn" disabled={patientFormSaving}>
                    {patientFormSaving ? "Registering..." : "Register Patient"}
                  </button>
                </div>
              </form>
            </div>

            <div className="admin-panel manage-results-panel">
              <div className="manage-results-heading">
                <div>
                  <h2>Patient Registry</h2>
                  <p>{registeredPatients.length} registered patient(s)</p>
                </div>
                <button type="button" className="refresh-result-btn" onClick={fetchRegisteredPatients}>
                  Refresh Patients
                </button>
              </div>

              {patientsError && <div className="form-error" role="alert">{patientsError}</div>}
              {!patientsError && registeredPatients.length === 0 ? (
                <div className="empty-results">
                  <UserPlus size={36} />
                  <h3>No patients registered yet</h3>
                </div>
              ) : !patientsError && (
                <div className="results-table-wrapper">
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th>Patient ID</th>
                        <th>Full Name</th>
                        <th>Date of Birth</th>
                        <th>Phone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registeredPatients.map((patient) => (
                        <tr key={patient.patientId}>
                          <td>{patient.patientId}</td>
                          <td>{patient.fullName}</td>
                          <td>{patient.dateOfBirth}</td>
                          <td>{patient.phone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {activePage === "Upload PDF Result" && (
          <section className="admin-content">
            <div className="admin-panel upload-result-panel">
              <div className="form-heading">
                <div>
                  <h2>Upload PDF Result</h2>
                  <p>Attach a PDF report to the patient's laboratory record.</p>
                </div>
                <Upload size={30} />
              </div>

              {uploadMessage && (
                <div className="form-success" role="status">
                  <strong>{uploadMessage}</strong>
                  {uploadedPatientCredentials && (
                    <>
                      <p>Patient: {uploadedPatientCredentials.patientName}</p>
                      <p>Patient ID: <strong>{uploadedPatientCredentials.patientId}</strong></p>
                      {uploadedPatientCredentials.patientPin ? (
                        <p>Patient portal PIN: <strong>{uploadedPatientCredentials.patientPin}</strong></p>
                      ) : (
                        <p>The patient’s existing portal PIN remains valid.</p>
                      )}
                      <p>Share any newly issued login details securely. The report remains unavailable until approved.</p>
                    </>
                  )}
                </div>
              )}
              {uploadError && <div className="form-error" role="alert">{uploadError}</div>}

              <form className="result-entry-form" onSubmit={handleUploadPDF}>
                <div className="form-grid">
                  <label>
                    Registered Patient *
                    <select
                      value={uploadForm.patientId}
                      onChange={(event) => {
                        const patient = registeredPatients.find((item) => item.patientId === event.target.value);
                        setUploadForm({
                          ...uploadForm,
                          patientId: patient?.patientId || "",
                          patientName: patient?.fullName || "",
                        });
                      }}
                      required
                    >
                      <option value="">Select a patient</option>
                      {registeredPatients.map((patient) => (
                        <option key={patient.patientId} value={patient.patientId}>
                          {patient.patientId} - {patient.fullName}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Patient Name
                    <input type="text" value={uploadForm.patientName} readOnly />
                  </label>

                  <label>
                    Test Name *
                    <input
                      type="text"
                      value={uploadForm.testName}
                      onChange={(event) => setUploadForm({ ...uploadForm, testName: event.target.value })}
                      required
                    />
                  </label>

                  <label>
                    Test Date *
                    <input
                      type="date"
                      value={uploadForm.testDate}
                      onChange={(event) => setUploadForm({ ...uploadForm, testDate: event.target.value })}
                      required
                    />
                  </label>

                  <label className="full-width upload-file-field">
                    Result PDF *
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={(event) => setPdfFile(event.target.files?.[0] || null)}
                      required
                    />
                    <span>{pdfFile ? pdfFile.name : "Choose a PDF file (maximum 10 MB)"}</span>
                  </label>
                </div>

                <div className="form-actions">
                  <button type="submit" className="form-submit-btn" disabled={uploading || !pdfFile}>
                    {uploading ? "Uploading PDF..." : "Upload PDF Result"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {activePage === "Review Results" && (
          <section className="admin-content">
            <div className="admin-panel manage-results-panel">
              <div className="manage-results-heading">
                <div>
                  <h2>Pending Result Review</h2>
                  <p>Review each uploaded report for accuracy before releasing it to the patient.</p>
                </div>
                <button type="button" className="refresh-result-btn" onClick={fetchPendingReports}>
                  Refresh Queue
                </button>
              </div>

              {reviewError && <div className="form-error" role="alert">{reviewError}</div>}
              {!reviewError && pendingReports.length === 0 ? (
                <div className="empty-results">
                  <CircleCheck size={38} />
                  <h3>No reports awaiting review</h3>
                </div>
              ) : !reviewError && (
                <div className="results-table-wrapper">
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th>Patient ID</th>
                        <th>Patient</th>
                        <th>Test</th>
                        <th>Test Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingReports.map((report) => (
                        <tr key={report.id}>
                          <td>{report.patientId}</td>
                          <td>{report.patientName}</td>
                          <td>{report.testName}</td>
                          <td>{report.testDate}</td>
                          <td className="review-actions">
                            <button type="button" className="view-result-btn" onClick={() => openUploadedReport(report)}>
                              <FileText size={16} /> View PDF
                            </button>
                            <button type="button" className="approve-report-btn" onClick={() => handleReportReview(report, "Approved")}>
                              Approve
                            </button>
                            <button type="button" className="reject-report-btn" onClick={() => handleReportReview(report, "Rejected")}>
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {activePage === "Uploaded Reports" && (
          <section className="admin-content">
            <div className="admin-panel manage-results-panel">
              <div className="manage-results-heading">
                <div>
                  <h2>Uploaded Reports</h2>
                  <p>Find report PDFs and review any scientist feedback.</p>
                </div>
                <button type="button" className="refresh-result-btn" onClick={fetchUploadedReports}>
                  Refresh Reports
                </button>
              </div>

              {uploadError && <div className="form-error" role="alert">{uploadError}</div>}
              {uploadedReports.length === 0 ? (
                <div className="empty-results">
                  <Upload size={38} />
                  <h3>No uploaded reports found</h3>
                </div>
              ) : (
                <div className="results-table-wrapper">
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th>Patient ID</th>
                        <th>Patient</th>
                        <th>Test</th>
                        <th>Status</th>
                        <th>Review Note</th>
                        <th>PDF</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadedReports.map((report) => (
                        <tr key={report.id}>
                          <td>{report.patientId}</td>
                          <td>{report.patientName}</td>
                          <td>{report.testName}</td>
                          <td>{report.status}</td>
                          <td>{report.rejectionReason || "-"}</td>
                          <td>
                            <button type="button" className="view-result-btn" onClick={() => openUploadedReport(report)}>
                              Open / Print
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {activePage === "Manage Results" && (
          <section className="admin-content">
            <div className="admin-panel manage-results-panel">
              <div className="manage-results-heading">
                <div>
                  <h2>Laboratory Records</h2>
                  <p>Search and review saved laboratory results.</p>
                </div>
                <button
                  type="button"
                  className="refresh-result-btn"
                  onClick={fetchAllResults}
                  disabled={resultsLoading}
                >
                  {resultsLoading ? "Loading..." : "Refresh Results"}
                </button>
              </div>

              <div className="results-search-box">
                <Search size={20} />
                <input
                  type="search"
                  placeholder="Search by patient name or reference number..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>

              {resultsError && <div className="form-error">{resultsError}</div>}

              {resultsLoading && <p className="loading-state">Loading laboratory records...</p>}

              {!resultsLoading && !resultsError && (
                <>
                  <p className="records-count">{filteredResults.length} record(s) found</p>

                  {filteredResults.length === 0 ? (
                    <div className="empty-results">
                      <ClipboardList size={40} />
                      <h3>No records found</h3>
                      <p>Click Refresh Results to load saved records or try another search.</p>
                    </div>
                  ) : (
                    <div className="results-table-wrapper">
                      <table className="results-table">
                        <thead>
                          <tr>
                            <th>Reference Number</th>
                            <th>Patient Name</th>
                            <th>Test</th>
                            <th>Sample Date</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredResults.map((item) => (
                            <tr key={item.referenceNumber}>
                              <td>{item.referenceNumber}</td>
                              <td>{item.patientName}</td>
                              <td>{item.testName}</td>
                              <td>{item.sampleDate}</td>
                              <td>
                                <button
                                  type="button"
                                  className="view-result-btn"
                                  onClick={() => setSelectedResult(item)}
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>

            {selectedResult && (
              <div className="result-modal-backdrop">
                <div className="result-modal" role="dialog" aria-modal="true">
                  <div className="result-modal-heading">
                    <h2>Laboratory Result</h2>
                    <button
                      type="button"
                      className="modal-close-btn"
                      onClick={() => setSelectedResult(null)}
                      aria-label="Close result details"
                    >
                      <X size={22} />
                    </button>
                  </div>

                  <p>
                    <strong>Reference:</strong> {selectedResult.referenceNumber}
                  </p>
                  <p>
                    <strong>Access Code:</strong> {selectedResult.accessCode || selectedResult.patientAccessCode || "Not available"}
                  </p>
                  <p>
                    <strong>Patient:</strong> {selectedResult.patientName}
                  </p>
                  <p>
                    <strong>Age:</strong> {selectedResult.age}
                  </p>
                  <p>
                    <strong>Sex:</strong> {selectedResult.sex}
                  </p>
                  <p>
                    <strong>Sample Date:</strong> {selectedResult.sampleDate}
                  </p>
                  <p>
                    <strong>Result:</strong> {selectedResult.result}
                  </p>
                  <p>
                    <strong>Remarks:</strong> {selectedResult.remarks || "None"}
                  </p>
                  <p>
                    <strong>Authorized By:</strong> {selectedResult.scientist || "Not specified"}
                  </p>
                  <div className="mosal-actions">
                    <button type="button"
                    className="download-pdf-btn"
                    onClick={() => generatePDF(selectedResult)}>
                        Download PDF
                    </button>
                  
                <button
                    type="button"
                    className="form-submit-btn modal-close-btn"
                    onClick={() => setSelectedResult(null)}
                  >
                    Close
                  </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
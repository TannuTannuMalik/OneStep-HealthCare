// src/pages/Reports.jsx
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useEffect, useState } from "react";
import { api } from "../utils/api";

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [verifying, setVerifying] = useState({});

  const loadReports = async () => {
    setLoading(true);
    setErrMsg("");
    try {
      const res = await api.get("/api/reports/patient/me");
      if (res.data.ok) {
        setReports(res.data.data || []);
      } else {
        setErrMsg(res.data.error || "Failed to load reports");
      }
    } catch (e) {
      setErrMsg(e.response?.data?.error || e.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const verifyReport = async (reportId) => {
    setVerifying((v) => ({ ...v, [reportId]: true }));
    try {
      const res = await api.get(`/api/reports/${reportId}/verify`);
      const { tampered, dbMatch, chainMatch, blockchainTx } = res.data.data;

      if (!tampered) {
        alert(`✅ Report #${reportId} is AUTHENTIC\n\nDB Check: ${dbMatch ? "✅ Pass" : "❌ Fail"}\nBlockchain Check: ${chainMatch ? "✅ Pass" : "❌ Fail"}\n\nTx: ${blockchainTx}`);
      } else {
        alert(`🚨 Report #${reportId} has been TAMPERED!\n\nDB Check: ${dbMatch ? "✅ Pass" : "❌ Fail"}\nBlockchain Check: ${chainMatch ? "✅ Pass" : "❌ Fail"}`);
      }
    } catch (e) {
      alert("Verification failed: " + (e.response?.data?.error || e.message));
    } finally {
      setVerifying((v) => ({ ...v, [reportId]: false }));
    }
  };

  const downloadReport = async (reportId) => {
    try {
      const res = await api.get(`/api/reports/${reportId}/download`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `report_${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("download report error:", e);
      alert(e.response?.data?.error || e.message || "Download failed");
    }
  };

  const viewReport = (reportId) => {
    window.open(`http://localhost:5000/api/reports/${reportId}/download`, "_blank");
  };

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <>
      <Navbar />

      <div style={styles.container}>
        <div style={styles.topRow}>
          <div>
            <h1 style={{ margin: 0 }}>Consultation Reports</h1>
            <p style={{ marginTop: 6, opacity: 0.8 }}>
              Reports are available after your appointment is completed and the doctor generates the PDF.
            </p>
          </div>

          <button style={styles.btnOutline} onClick={loadReports} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {errMsg && (
          <div style={styles.errorBox}>
            <b>Error:</b> {errMsg}
          </div>
        )}

        {loading ? (
          <p>Loading reports...</p>
        ) : reports.length === 0 ? (
          <div style={styles.emptyBox}>
            <b>No reports yet.</b>
            <div style={{ opacity: 0.8, marginTop: 6 }}>
              Once a doctor completes your appointment and creates a report, it will appear here.
            </div>
          </div>
        ) : (
          reports.map((r) => {
            const verified = !!r.pdfHash;
            const hasBlockchain = !!r.blockchainTx;
            return (
              <div key={r.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <h3 style={{ margin: 0 }}>Report #{r.id}</h3>

                    <div style={{ opacity: 0.8, marginTop: 6 }}>
                      <b>Doctor:</b> {r.doctorName || "—"} {r.specialty ? `• ${r.specialty}` : ""}
                    </div>

                    <div style={{ opacity: 0.8, marginTop: 4 }}>
                      <b>Date:</b> {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
                    </div>

                    {hasBlockchain && (
                      <div style={{ marginTop: 4, fontSize: 12, color: "#1b7a3c" }}>
                        ⛓️ <b>Blockchain Tx:</b> {r.blockchainTx.slice(0, 20)}...
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                    <span style={verified ? styles.verified : styles.pending}>
                      {verified ? "Verified ✅" : "Pending ⏳"}
                    </span>
                    {hasBlockchain && (
                      <span style={styles.blockchain}>⛓️ On Blockchain</span>
                    )}
                  </div>
                </div>

                {/* Preview info */}
                <div style={{ marginTop: 10, lineHeight: 1.6 }}>
                  {r.diagnosis && (
                    <div><b>Diagnosis:</b> {r.diagnosis}</div>
                  )}
                  {r.prescription && (
                    <div><b>Prescription:</b> {r.prescription}</div>
                  )}
                  {r.improvementSuggestions && (
                    <div><b>Suggestions:</b> {r.improvementSuggestions}</div>
                  )}
                </div>

                <div style={styles.actions}>
                  {r.pdfUrl ? (
                    <>
                      <button type="button" style={styles.btn} onClick={() => viewReport(r.id)}>
                        View Report (PDF)
                      </button>

                      <button type="button" style={styles.btnOutline} onClick={() => downloadReport(r.id)}>
                        Download PDF
                      </button>

                      {hasBlockchain && (
                        <button
                          type="button"
                          style={styles.btnVerify}
                          onClick={() => verifyReport(r.id)}
                          disabled={verifying[r.id]}
                        >
                          {verifying[r.id] ? "Verifying..." : "🔍 Verify Integrity"}
                        </button>
                      )}
                    </>
                  ) : (
                    <div style={{ opacity: 0.8 }}>
                      PDF not uploaded yet. Ask the doctor to generate the report.
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <Footer />
    </>
  );
}

const styles = {
  container: {
    maxWidth: "1000px",
    margin: "40px auto",
    padding: "20px",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 16,
  },
  card: {
    background: "#f9f9f9",
    padding: "20px",
    marginBottom: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },
  actions: {
    marginTop: "14px",
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },
  btn: {
    padding: "10px 16px",
    background: "#0f7f7c",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 900,
  },
  btnOutline: {
    padding: "10px 16px",
    background: "white",
    border: "1px solid #0f7f7c",
    color: "#0f7f7c",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 900,
  },
  btnVerify: {
    padding: "10px 16px",
    background: "#1b7a3c",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 900,
  },
  verified: {
    fontSize: 12,
    fontWeight: 900,
    color: "#1b7a3c",
    background: "#dff7e6",
    padding: "6px 10px",
    borderRadius: 999,
    height: "fit-content",
  },
  pending: {
    fontSize: 12,
    fontWeight: 900,
    color: "#8a5b00",
    background: "#fff3cd",
    padding: "6px 10px",
    borderRadius: 999,
    height: "fit-content",
  },
  blockchain: {
    fontSize: 12,
    fontWeight: 900,
    color: "#1a3a6b",
    background: "#dce8ff",
    padding: "6px 10px",
    borderRadius: 999,
    height: "fit-content",
  },
  errorBox: {
    padding: 12,
    borderRadius: 10,
    background: "#ffe3e3",
    border: "1px solid rgba(156,42,42,0.3)",
    color: "#9c2a2a",
    marginBottom: 16,
    fontWeight: 700,
  },
  emptyBox: {
    padding: 16,
    borderRadius: 10,
    background: "#fff",
    border: "1px dashed #bbb",
  },
};
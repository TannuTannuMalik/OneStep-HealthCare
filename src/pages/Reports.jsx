// src/pages/Reports.jsx
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useEffect, useState } from "react";
import { api } from "../utils/api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [verifying, setVerifying] = useState({});
  const [verifyResults, setVerifyResults] = useState({});

  const loadReports = async () => {
    setLoading(true);
    setErrMsg("");

    try {
      const res = await api.get("/reports/patient/me");

      if (res.data.ok) {
        setReports(res.data.data || []);
      } else {
        setErrMsg(res.data.error || "Failed to load reports");
      }
    } catch (e) {
      setErrMsg(
        e.response?.data?.error || e.message || "Failed to load reports"
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyReport = async (reportId) => {
    setVerifying((prev) => ({ ...prev, [reportId]: true }));

    try {
      const res = await api.get(`/reports/${reportId}/verify`);
      const { tampered, dbMatch, chainMatch, blockchainTx } = res.data.data;

      setVerifyResults((prev) => ({
        ...prev,
        [reportId]: {
          success: !tampered,
          tampered,
          dbMatch,
          chainMatch,
          blockchainTx,
          message: tampered
            ? "This report may have been tampered with."
            : "This report is authentic and passed integrity verification.",
        },
      }));
    } catch (e) {
      setVerifyResults((prev) => ({
        ...prev,
        [reportId]: {
          success: false,
          message:
            e.response?.data?.error || e.message || "Verification failed",
        },
      }));
    } finally {
      setVerifying((prev) => ({ ...prev, [reportId]: false }));
    }
  };

  const downloadReport = async (reportId) => {
    try {
      const res = await api.get(`/reports/${reportId}/download`, {
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
      console.error("Download report error:", e);
      setErrMsg(e.response?.data?.error || e.message || "Download failed");
    }
  };

  const viewReport = (reportId) => {
    window.open(`${API_BASE_URL}/reports/${reportId}/download`, "_blank");
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleString();
  };

  const getReportStatus = (report) => {
    if (report.blockchainTx) return "On Blockchain";
    if (report.pdfHash) return "Verified";
    return "Pending";
  };

  const getStatusStyle = (report) => {
    if (report.blockchainTx) return styles.blockchain;
    if (report.pdfHash) return styles.verified;
    return styles.pending;
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
            <p style={styles.subtitle}>
              Reports become available after the appointment is completed and
              the doctor generates the PDF.
            </p>
          </div>

          <button
            style={{
              ...styles.btnOutline,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            onClick={loadReports}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {errMsg && (
          <div style={styles.errorBox}>
            <strong>Error:</strong> {errMsg}
          </div>
        )}

        {loading ? (
          <div style={styles.infoBox}>Loading reports...</div>
        ) : reports.length === 0 ? (
          <div style={styles.emptyBox}>
            <strong>No reports yet.</strong>
            <div style={{ opacity: 0.8, marginTop: 6 }}>
              Once a doctor completes your appointment and creates a report, it
              will appear here.
            </div>
          </div>
        ) : (
          reports.map((r) => {
            const hasPdf = !!r.pdfUrl;
            const hasBlockchain = !!r.blockchainTx;
            const result = verifyResults[r.id];

            return (
              <div key={r.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <h3 style={{ margin: 0 }}>Report #{r.id}</h3>

                    <div style={styles.metaText}>
                      <strong>Doctor:</strong> {r.doctorName || "—"}{" "}
                      {r.specialty ? `• ${r.specialty}` : ""}
                    </div>

                    <div style={styles.metaText}>
                      <strong>Date:</strong> {formatDate(r.createdAt)}
                    </div>

                    {hasBlockchain && (
                      <div style={styles.txText}>
                        ⛓️ <strong>Blockchain Tx:</strong>{" "}
                        {r.blockchainTx.slice(0, 24)}...
                      </div>
                    )}
                  </div>

                  <div style={styles.badgeColumn}>
                    <span style={getStatusStyle(r)}>{getReportStatus(r)}</span>
                  </div>
                </div>

                <div style={styles.details}>
                  {r.diagnosis && (
                    <div>
                      <strong>Diagnosis:</strong> {r.diagnosis}
                    </div>
                  )}
                  {r.prescription && (
                    <div>
                      <strong>Prescription:</strong> {r.prescription}
                    </div>
                  )}
                  {r.improvementSuggestions && (
                    <div>
                      <strong>Suggestions:</strong> {r.improvementSuggestions}
                    </div>
                  )}
                </div>

                {result && (
                  <div
                    style={{
                      ...styles.verifyBox,
                      background: result.success ? "#e8f7ed" : "#fff1f1",
                      border: result.success
                        ? "1px solid #9ad0ab"
                        : "1px solid #efb0b0",
                      color: result.success ? "#1b5e20" : "#a12a2a",
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{result.message}</div>

                    {"dbMatch" in result && (
                      <div style={{ marginTop: 6, fontSize: 14 }}>
                        DB Check: {result.dbMatch ? "✅ Pass" : "❌ Fail"} | Blockchain
                        Check: {result.chainMatch ? "✅ Pass" : "❌ Fail"}
                      </div>
                    )}

                    {result.blockchainTx && (
                      <div style={{ marginTop: 6, fontSize: 13 }}>
                        Tx: {result.blockchainTx}
                      </div>
                    )}
                  </div>
                )}

                <div style={styles.actions}>
                  {hasPdf ? (
                    <>
                      <button
                        type="button"
                        style={styles.btn}
                        onClick={() => viewReport(r.id)}
                      >
                        View PDF
                      </button>

                      <button
                        type="button"
                        style={styles.btnOutline}
                        onClick={() => downloadReport(r.id)}
                      >
                        Download PDF
                      </button>

                      {hasBlockchain && (
                        <button
                          type="button"
                          style={{
                            ...styles.btnVerify,
                            opacity: verifying[r.id] ? 0.7 : 1,
                            cursor: verifying[r.id] ? "not-allowed" : "pointer",
                          }}
                          onClick={() => verifyReport(r.id)}
                          disabled={verifying[r.id]}
                        >
                          {verifying[r.id]
                            ? "Verifying..."
                            : "Verify Integrity"}
                        </button>
                      )}
                    </>
                  ) : (
                    <div style={{ opacity: 0.8 }}>
                      PDF not uploaded yet. Ask the doctor to generate the
                      report.
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
    marginBottom: 20,
  },
  subtitle: {
    marginTop: 6,
    opacity: 0.8,
    lineHeight: 1.5,
  },
  card: {
    background: "#f9f9f9",
    padding: "20px",
    marginBottom: "20px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },
  badgeColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    alignItems: "flex-end",
  },
  metaText: {
    opacity: 0.8,
    marginTop: 6,
  },
  txText: {
    marginTop: 6,
    fontSize: 12,
    color: "#1b7a3c",
  },
  details: {
    marginTop: 14,
    lineHeight: 1.7,
  },
  verifyBox: {
    marginTop: 14,
    borderRadius: 10,
    padding: 12,
  },
  actions: {
    marginTop: "16px",
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
    fontWeight: 700,
  },
  btnOutline: {
    padding: "10px 16px",
    background: "white",
    border: "1px solid #0f7f7c",
    color: "#0f7f7c",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 700,
  },
  btnVerify: {
    padding: "10px 16px",
    background: "#1b7a3c",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: 700,
  },
  verified: {
    fontSize: 12,
    fontWeight: 700,
    color: "#1b7a3c",
    background: "#dff7e6",
    padding: "6px 10px",
    borderRadius: 999,
  },
  pending: {
    fontSize: 12,
    fontWeight: 700,
    color: "#8a5b00",
    background: "#fff3cd",
    padding: "6px 10px",
    borderRadius: 999,
  },
  blockchain: {
    fontSize: 12,
    fontWeight: 700,
    color: "#1a3a6b",
    background: "#dce8ff",
    padding: "6px 10px",
    borderRadius: 999,
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
  infoBox: {
    padding: 16,
    borderRadius: 10,
    background: "#f5f7fb",
    border: "1px solid #d9e2f2",
  },
  emptyBox: {
    padding: 16,
    borderRadius: 10,
    background: "#fff",
    border: "1px dashed #bbb",
  },
};
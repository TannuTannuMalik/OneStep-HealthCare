import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { api } from "../utils/api";

export default function PharmacyDashboard() {
  const navigate = useNavigate();

  const [rxId, setRxId] = useState("");
  const [loading, setLoading] = useState(false);
  const [dispensing, setDispensing] = useState(false);
  const [prescription, setPrescription] = useState(null);
  const [error, setError] = useState("");
  const [dispenseSuccess, setDispenseSuccess] = useState(null);

  // ── Verify prescription via backend + blockchain ──────────────────────────
  const handleVerify = async () => {
    const id = rxId.trim();
    if (!id) return setError("Please enter a Report/Prescription ID.");

    setLoading(true);
    setError("");
    setPrescription(null);
    setDispenseSuccess(null);

    try {
      const res = await api.get(`/pharmacy/prescription/${id}`);
      if (res.data.ok) {
        setPrescription(res.data);
      } else {
        setError(res.data.error || "Verification failed.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  // ── Dispense on blockchain ────────────────────────────────────────────────
  const handleDispense = async () => {
    if (!prescription) return;
    setDispensing(true);
    setError("");
    setDispenseSuccess(null);

    try {
      const res = await api.post(`/pharmacy/dispense/${prescription.reportId}`);
      if (res.data.ok) {
        setDispenseSuccess(res.data);
        // refresh prescription state locally
        setPrescription((prev) => ({
          ...prev,
          blockchain: { ...prev.blockchain, isDispensed: true },
        }));
      } else {
        setError(res.data.error || "Dispense failed.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Blockchain transaction failed.");
    } finally {
      setDispensing(false);
    }
  };

  const formatDate = (val) => {
    if (!val) return "—";
    // unix timestamp
    if (typeof val === "number" && val > 0)
      return new Date(val * 1000).toLocaleString();
    return new Date(val).toLocaleString();
  };

  const bc = prescription?.blockchain;

  return (
    <div style={styles.page}>
      <Navbar />

      <main style={styles.main}>
        {/* ── Page Header ── */}
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>💊 Pharmacy Dashboard</h1>
            <p style={styles.pageSub}>
              Verify blockchain prescriptions and dispense medicines securely.
            </p>
          </div>
          <button
            style={styles.historyBtn}
            onClick={() => navigate("/pharmacy/history")}
          >
            📋 View Dispensed History
          </button>
        </div>

        <div style={styles.grid}>
          {/* ── LEFT: Verify Panel ── */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>🔍 Verify Prescription</h2>
            <p style={styles.cardSub}>
              Enter the Report ID given by the patient or doctor.
            </p>

            <input
              value={rxId}
              onChange={(e) => setRxId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              placeholder="Enter Report / Prescription ID"
              style={styles.input}
            />

            <button
              style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
              onClick={handleVerify}
              disabled={loading}
            >
              {loading ? "Verifying on Blockchain…" : "Verify Prescription"}
            </button>

            {/* Blockchain status pill */}
            <div style={{ marginTop: 20 }}>
              {!prescription && !loading && (
                <span style={styles.badge.idle}>⏳ Awaiting Verification</span>
              )}
              {loading && (
                <span style={styles.badge.pending}>🔄 Checking Blockchain…</span>
              )}
              {prescription && bc?.isValid && !bc?.isDispensed && (
                <span style={styles.badge.valid}>✅ Blockchain Verified — Ready to Dispense</span>
              )}
              {prescription && bc?.isValid && bc?.isDispensed && (
                <span style={styles.badge.dispensed}>💊 Already Dispensed</span>
              )}
              {prescription && !bc?.isValid && (
                <span style={styles.badge.invalid}>❌ Invalid / Revoked Prescription</span>
              )}
            </div>

            {/* Steps guide */}
            <div style={styles.stepsBox}>
              <div style={styles.stepsTitle}>How it works</div>
              {[
                "Patient provides their Report ID",
                "Enter the ID and click Verify",
                "System checks Ethereum blockchain",
                "If valid, click Mark as Dispensed",
                "Transaction is recorded permanently",
              ].map((step, i) => (
                <div key={i} style={styles.step}>
                  <span style={styles.stepNum}>{i + 1}</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Prescription Details ── */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>📄 Prescription Details</h2>

            {!prescription && !error && (
              <div style={styles.emptyState}>
                <div style={{ fontSize: 56 }}>💊</div>
                <p style={{ marginTop: 12, color: "#64748b" }}>
                  Enter a Report ID on the left to view prescription details and
                  blockchain verification status.
                </p>
              </div>
            )}

            {error && (
              <div style={styles.errorBox}>
                ❌ {error}
              </div>
            )}

            {dispenseSuccess && (
              <div style={styles.successBox}>
                ✅ Dispensed successfully!
                <div style={styles.txHash}>
                  TX: {dispenseSuccess.txHash}
                </div>
              </div>
            )}

            {prescription && (
              <div>
                {/* Patient & Doctor */}
                <div style={styles.section}>
                  <div style={styles.sectionTitle}>👤 Patient & Doctor</div>
                  <Row label="Patient" value={prescription.patientName} />
                  <Row label="Doctor" value={prescription.doctorName} />
                  <Row label="Specialty" value={prescription.specialty} />
                  <Row label="Report ID" value={`#${prescription.reportId}`} />
                  <Row label="Created" value={formatDate(prescription.createdAt)} />
                </div>

                {/* Clinical */}
                <div style={styles.section}>
                  <div style={styles.sectionTitle}>🏥 Clinical Details</div>
                  <Row label="Diagnosis" value={prescription.diagnosis || "—"} />
                  <div style={styles.prescriptionBlock}>
                    <strong style={{ fontSize: 13, color: "#475569" }}>
                      Prescription
                    </strong>
                    <div style={styles.prescriptionText}>
                      {prescription.prescriptionText || "—"}
                    </div>
                  </div>
                </div>

                {/* Blockchain */}
                <div style={styles.section}>
                  <div style={styles.sectionTitle}>⛓️ Blockchain Status</div>
                  <Row
                    label="Validity"
                    value={
                      bc?.isValid ? (
                        <span style={{ color: "#16a34a", fontWeight: 700 }}>✅ Valid</span>
                      ) : (
                        <span style={{ color: "#dc2626", fontWeight: 700 }}>❌ Invalid</span>
                      )
                    }
                  />
                  <Row
                    label="Dispensed"
                    value={
                      bc?.isDispensed ? (
                        <span style={{ color: "#2563eb", fontWeight: 700 }}>
                          💊 Yes — {formatDate(bc.dispensedAt)}
                        </span>
                      ) : (
                        <span style={{ color: "#92400e", fontWeight: 700 }}>Pending</span>
                      )
                    }
                  />
                  <Row
                    label="Hash"
                    value={
                      <span style={styles.hashText}>
                        {bc?.prescriptionHash
                          ? `0x${bc.prescriptionHash.slice(0, 16)}…`
                          : "—"}
                      </span>
                    }
                  />
                  <Row
                    label="Stored At"
                    value={formatDate(bc?.timestamp)}
                  />
                </div>

                {/* Dispense button */}
                {bc?.isValid && !bc?.isDispensed && (
                  <button
                    style={{
                      ...styles.dispenseBtn,
                      opacity: dispensing ? 0.7 : 1,
                    }}
                    onClick={handleDispense}
                    disabled={dispensing}
                  >
                    {dispensing
                      ? "⏳ Recording on Blockchain…"
                      : "✅ Mark as Dispensed"}
                  </button>
                )}

                {bc?.isDispensed && (
                  <div style={styles.dispensedNote}>
                    💊 This prescription has already been dispensed and recorded
                    permanently on the Ethereum blockchain.
                  </div>
                )}

                {bc && !bc.isValid && (
                  <div style={styles.invalidNote}>
                    ⚠️ This prescription has been invalidated by the doctor and
                    cannot be dispensed.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Info bar */}
        <div style={styles.infoBar}>
          <strong>⛓️ Blockchain Secured:</strong> All prescriptions are stored on
          Ethereum Sepolia. Verification and dispensing are tamper-proof and
          permanent.
        </div>
      </main>

      <Footer />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={rowStyle}>
      <span style={{ color: "#64748b", fontSize: 13, fontWeight: 600 }}>
        {label}
      </span>
      <span style={{ fontSize: 14, fontWeight: 600, textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}

const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 0",
  borderBottom: "1px solid #f1f5f9",
  gap: 12,
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(to bottom right, #eef7f6, #f8fbff)",
    fontFamily: "Segoe UI, system-ui, sans-serif",
  },

  main: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "32px 24px",
  },

  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 28,
  },

  pageTitle: {
    margin: 0,
    fontSize: 30,
    fontWeight: 900,
    color: "#0f172a",
    letterSpacing: "-0.5px",
  },

  pageSub: {
    marginTop: 6,
    color: "#475569",
    fontSize: 15,
  },

  historyBtn: {
    padding: "10px 18px",
    borderRadius: 12,
    border: "1px solid #0f766e",
    background: "#fff",
    color: "#0f766e",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1.4fr",
    gap: 24,
  },

  card: {
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(10px)",
    borderRadius: 20,
    padding: 28,
    boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
    border: "1px solid rgba(255,255,255,0.6)",
  },

  cardTitle: {
    margin: "0 0 6px 0",
    fontSize: 20,
    fontWeight: 800,
    color: "#0f172a",
  },

  cardSub: {
    margin: "0 0 18px 0",
    color: "#64748b",
    fontSize: 13,
  },

  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 14,
    border: "1.5px solid #e2e8f0",
    marginBottom: 14,
    fontSize: 15,
    boxSizing: "border-box",
    outline: "none",
    background: "#fff",
  },

  btn: {
    width: "100%",
    padding: "14px",
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(to right, #0f766e, #14b8a6)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 15,
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(15,118,110,0.2)",
  },

  badge: {
    idle: {
      background: "#f1f5f9",
      color: "#64748b",
      padding: "8px 14px",
      borderRadius: 999,
      fontWeight: 700,
      fontSize: 13,
      display: "inline-block",
    },
    pending: {
      background: "#fef9c3",
      color: "#92400e",
      padding: "8px 14px",
      borderRadius: 999,
      fontWeight: 700,
      fontSize: 13,
      display: "inline-block",
    },
    valid: {
      background: "#dcfce7",
      color: "#166534",
      padding: "8px 14px",
      borderRadius: 999,
      fontWeight: 700,
      fontSize: 13,
      display: "inline-block",
    },
    dispensed: {
      background: "#dbeafe",
      color: "#1e40af",
      padding: "8px 14px",
      borderRadius: 999,
      fontWeight: 700,
      fontSize: 13,
      display: "inline-block",
    },
    invalid: {
      background: "#fee2e2",
      color: "#991b1b",
      padding: "8px 14px",
      borderRadius: 999,
      fontWeight: 700,
      fontSize: 13,
      display: "inline-block",
    },
  },

  stepsBox: {
    marginTop: 28,
    padding: 18,
    background: "#f8fafc",
    borderRadius: 14,
    border: "1px solid #e2e8f0",
  },

  stepsTitle: {
    fontWeight: 800,
    fontSize: 13,
    color: "#475569",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },

  step: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
    fontSize: 13,
    color: "#334155",
  },

  stepNum: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "#0f766e",
    color: "#fff",
    fontSize: 11,
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#64748b",
  },

  errorBox: {
    background: "#fee2e2",
    border: "1px solid #fca5a5",
    borderRadius: 12,
    padding: 14,
    color: "#991b1b",
    fontWeight: 700,
    fontSize: 14,
    marginBottom: 16,
  },

  successBox: {
    background: "#dcfce7",
    border: "1px solid #86efac",
    borderRadius: 12,
    padding: 14,
    color: "#166534",
    fontWeight: 700,
    fontSize: 14,
    marginBottom: 16,
  },

  txHash: {
    fontFamily: "monospace",
    fontSize: 11,
    marginTop: 6,
    wordBreak: "break-all",
    opacity: 0.8,
  },

  section: {
    marginBottom: 20,
  },

  sectionTitle: {
    fontWeight: 800,
    fontSize: 13,
    color: "#0f766e",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: 6,
    paddingBottom: 6,
    borderBottom: "2px solid #ccfbf1",
  },

  prescriptionBlock: {
    marginTop: 10,
    padding: "12px 14px",
    background: "#f8fafc",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
  },

  prescriptionText: {
    marginTop: 6,
    fontSize: 14,
    color: "#334155",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
  },

  hashText: {
    fontFamily: "monospace",
    fontSize: 13,
    color: "#334155",
  },

  dispenseBtn: {
    width: "100%",
    marginTop: 16,
    padding: "14px",
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(to right, #2563eb, #3b82f6)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 15,
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(37,99,235,0.2)",
  },

  dispensedNote: {
    marginTop: 16,
    padding: 14,
    background: "#dbeafe",
    borderRadius: 12,
    color: "#1e40af",
    fontWeight: 600,
    fontSize: 13,
    lineHeight: 1.5,
  },

  invalidNote: {
    marginTop: 16,
    padding: 14,
    background: "#fee2e2",
    borderRadius: 12,
    color: "#991b1b",
    fontWeight: 600,
    fontSize: 13,
    lineHeight: 1.5,
  },

  infoBar: {
    marginTop: 24,
    padding: 14,
    borderRadius: 12,
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    fontSize: 13,
    color: "#166534",
    lineHeight: 1.5,
  },
};

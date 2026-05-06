import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { api } from "../utils/api";

export default function PharmacyHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/pharmacy/history");
        if (res.data.ok) {
          setHistory(res.data.data || []);
        } else {
          setError(res.data.error || "Failed to load history");
        }
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return "—";
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div>
      <Navbar />

      <main style={styles.main}>
        {/* Header */}
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.h1}>💊 Dispensed Prescription History</h1>
            <p style={styles.sub}>
              All prescriptions that have been verified and dispensed on the Ethereum blockchain.
            </p>
          </div>
          <button
            style={styles.backBtn}
            onClick={() => navigate("/pharmacy/dashboard")}
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Stats */}
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Dispensed</div>
            <div style={styles.statValue}>{history.length}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Network</div>
            <div style={styles.statValueSmall}>Ethereum Sepolia</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Status</div>
            <div style={styles.statValueSmall}>⛓️ On Blockchain</div>
          </div>
        </div>

        {/* Content */}
        <div style={styles.card}>
          {loading && (
            <div style={styles.center}>
              <div style={styles.spinner} />
              <p>Loading dispensed history from blockchain...</p>
            </div>
          )}

          {error && (
            <div style={styles.errorBox}>
              ❌ {error}
            </div>
          )}

          {!loading && !error && history.length === 0 && (
            <div style={styles.empty}>
              <div style={{ fontSize: 48 }}>💊</div>
              <p>No prescriptions have been dispensed yet.</p>
              <button
                style={styles.primaryBtn}
                onClick={() => navigate("/pharmacy/dashboard")}
              >
                Go to Dashboard
              </button>
            </div>
          )}

          {!loading && !error && history.length > 0 && (
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Report ID", "Patient", "Doctor", "Prescription", "Dispensed At", "Status"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((item, i) => (
                  <tr key={item.id} style={{ background: i % 2 === 0 ? "#f9fafb" : "#fff" }}>
                    <td style={styles.td}>
                      <span style={styles.reportId}>#{item.id}</span>
                    </td>
                    <td style={styles.td}>{item.patientName}</td>
                    <td style={styles.td}>
                      <div>{item.doctorName}</div>
                      <div style={styles.specialty}>{item.specialty}</div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.prescriptionText}>
                        {item.prescription || "—"}
                      </div>
                    </td>
                    <td style={styles.td}>
                      {item.blockchain?.dispensedAt
                        ? formatDate(item.blockchain.dispensedAt)
                        : "—"}
                    </td>
                    <td style={styles.td}>
                      <span style={styles.dispensedBadge}>
                        ✅ Dispensed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Blockchain note */}
        <div style={styles.note}>
          <b>⛓️ Blockchain Verified:</b> All dispensed records are permanently stored on the
          Ethereum Sepolia testnet and cannot be altered or deleted by anyone.
        </div>
      </main>

      <Footer />
    </div>
  );
}

const styles = {
  main: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: 24,
    fontFamily: "system-ui, sans-serif",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  h1: { margin: 0, fontSize: 26, fontWeight: 900 },
  sub: { marginTop: 6, opacity: 0.8, maxWidth: 700 },
  backBtn: {
    padding: "10px 16px",
    borderRadius: 10,
    border: "1px solid #0f7f7c",
    background: "#fff",
    color: "#0f7f7c",
    fontWeight: 800,
    cursor: "pointer",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 14,
    marginBottom: 16,
  },
  statCard: {
    background: "#fff",
    border: "1px solid #eee",
    borderRadius: 14,
    padding: 16,
  },
  statLabel: { fontSize: 12, opacity: 0.75, fontWeight: 900, marginBottom: 6 },
  statValue: { fontSize: 34, fontWeight: 900, color: "#0f7f7c" },
  statValueSmall: { fontSize: 16, fontWeight: 900, color: "#0f7f7c" },
  card: {
    background: "#fff",
    border: "1px solid #eee",
    borderRadius: 14,
    padding: 16,
    overflowX: "auto",
  },
  center: {
    textAlign: "center",
    padding: "40px 20px",
    opacity: 0.7,
  },
  spinner: {
    width: 40,
    height: 40,
    border: "3px solid #eee",
    borderTop: "3px solid #0f7f7c",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 12px",
  },
  errorBox: {
    background: "#ffe3e3",
    border: "1px solid rgba(156,42,42,0.2)",
    borderRadius: 10,
    padding: 14,
    color: "#9c2a2a",
    fontWeight: 700,
  },
  empty: {
    textAlign: "center",
    padding: "60px 20px",
    opacity: 0.6,
  },
  primaryBtn: {
    marginTop: 12,
    padding: "10px 24px",
    background: "#0f7f7c",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontWeight: 800,
    cursor: "pointer",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
  },
  th: {
    background: "#0f7f7c",
    color: "#fff",
    padding: "10px 12px",
    textAlign: "left",
    fontWeight: 800,
    fontSize: 13,
  },
  td: {
    padding: "10px 12px",
    borderBottom: "1px solid #f0f0f0",
    verticalAlign: "top",
  },
  reportId: {
    fontWeight: 900,
    color: "#0f7f7c",
  },
  specialty: {
    fontSize: 11,
    opacity: 0.65,
    marginTop: 2,
  },
  prescriptionText: {
    maxWidth: 200,
    fontSize: 12,
    color: "#444",
    lineHeight: 1.4,
  },
  dispensedBadge: {
    background: "#dff7e6",
    color: "#1b7a3c",
    padding: "4px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 800,
    border: "1px solid rgba(27,122,60,0.25)",
    whiteSpace: "nowrap",
  },
  note: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    background: "#eef7f7",
    border: "1px solid rgba(15,127,124,0.25)",
    lineHeight: 1.5,
    fontSize: 13,
  },
};
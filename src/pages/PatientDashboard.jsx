import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { useEffect, useState, useMemo, useRef } from "react";
import { api } from "../utils/api";

export default function PharmacyDashboard() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dispensing, setDispensing] = useState(null); // reportId currently being dispensed
  const [errMsg, setErrMsg] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });
  const toastTimerRef = useRef(null);

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); }
    catch { return null; }
  }, []);

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast((t) => ({ ...t, show: false }));
    }, 3500);
  };

  const loadPending = async () => {
    try {
      setLoading(true);
      setErrMsg("");
      const res = await api.get("/pharmacy/pending");
      if (res.data.ok) setPending(res.data.data || []);
    } catch (e) {
      setErrMsg(e.response?.data?.error || "Failed to load pending prescriptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleDispense = async (reportId) => {
    try {
      setDispensing(reportId);
      const res = await api.post(`/pharmacy/dispense/${reportId}`);
      if (res.data.ok) {
        showToast(`✅ Prescription #${reportId} dispensed on blockchain`, "success");
        // remove from pending list
        setPending((prev) => prev.filter((r) => r.id !== reportId));
      }
    } catch (e) {
      showToast(e.response?.data?.error || "Dispense failed", "error");
    } finally {
      setDispensing(null);
    }
  };

  return (
    <div>
      <Navbar />

      {toast.show && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: toast.type === "success" ? "#dcfce7" : "#fee2e2",
          color: toast.type === "success" ? "#166534" : "#991b1b",
          padding: "14px 18px", borderRadius: 14, fontWeight: "700",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}>
          {toast.message}
        </div>
      )}

      <main style={styles.page}>

        {/* HERO */}
        <section style={styles.hero}>
          <div style={styles.heroLeft}>
            <div style={styles.heroTag}>Pharmacy Portal</div>
            <h1 style={styles.heroTitle}>
              Welcome,<br />{user?.fullName || "Pharmacist"}
            </h1>
            <p style={styles.heroText}>
              View pending prescriptions verified on blockchain, dispense
              medications, and track dispensing history — all from one place.
            </p>
            <div style={styles.heroButtons}>
              <Link to="/pharmacy/history" style={styles.primaryBtn}>📋 View History</Link>
            </div>
          </div>

          <div style={styles.heroCard}>
            <div style={styles.heroMiniCard}>
              <div style={styles.heroMiniNumber}>{pending.length}</div>
              <div style={styles.heroMiniLabel}>Pending Prescriptions</div>
            </div>
            <div style={styles.heroMiniCard}>
              <div style={styles.heroMiniNumber}>⛓️</div>
              <div style={styles.heroMiniLabel}>Blockchain Verified</div>
            </div>
            <div style={styles.heroMiniCard}>
              <div style={styles.heroMiniNumber}>Active</div>
              <div style={styles.heroMiniLabel}>Account Status</div>
            </div>
          </div>
        </section>

        {/* PENDING PRESCRIPTIONS */}
        <section style={styles.card}>
          <div style={styles.cardTitle}>
            <h2 style={{ margin: 0 }}>💊 Pending Prescriptions</h2>
            <button onClick={loadPending} style={styles.refreshBtn}>
              🔄 Refresh
            </button>
          </div>

          {loading ? (
            <p style={styles.muted}>Loading prescriptions...</p>
          ) : pending.length === 0 ? (
            <div style={styles.emptyBox}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#0f172a" }}>
                No pending prescriptions
              </div>
              <div style={{ color: "#64748b", marginTop: 6 }}>
                All prescriptions have been dispensed.
              </div>
            </div>
          ) : (
            pending.map((r) => (
              <div key={r.id} style={styles.rowCard}>
                <div style={styles.left}>

                  {/* Header row */}
                  <div style={styles.rowMain}>
                    <b>RX-2026-{r.id}</b>
                    <span style={styles.dot}>•</span>
                    <span style={styles.muted}>{r.patientName}</span>
                    <span style={styles.dot}>•</span>
                    <span style={styles.muted}>Dr. {r.doctorName}</span>
                  </div>

                  {/* Specialty + date */}
                  <div style={styles.muted}>
                    {r.specialty} &nbsp;|&nbsp;{" "}
                    {new Date(r.createdAt).toLocaleDateString("en-NZ", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </div>

                  {/* Diagnosis */}
                  {r.diagnosis && (
                    <div style={styles.detailBox}>
                      <span style={styles.detailLabel}>🩺 Diagnosis:</span>
                      <span style={styles.detailText}>{r.diagnosis}</span>
                    </div>
                  )}

                  {/* Prescription text */}
                  {r.prescription && (
                    <div style={styles.detailBox}>
                      <span style={styles.detailLabel}>💊 Prescription:</span>
                      <span style={styles.detailText}>{r.prescription}</span>
                    </div>
                  )}

                  {/* Blockchain badge */}
                  <div style={{ marginTop: 12 }}>
                    <span style={styles.blockchain}>⛓️ Verified on Blockchain</span>
                  </div>
                </div>

                <div style={styles.right}>
                  <span style={styles.validBadge}>✅ Valid</span>
                  <button
                    onClick={() => handleDispense(r.id)}
                    disabled={dispensing === r.id}
                    style={{
                      ...styles.dispenseBtn,
                      opacity: dispensing === r.id ? 0.6 : 1,
                      cursor: dispensing === r.id ? "not-allowed" : "pointer",
                    }}
                  >
                    {dispensing === r.id ? "Dispensing..." : "💊 Dispense"}
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        {errMsg && (
          <div style={styles.errorBox}>{errMsg}</div>
        )}

      </main>

      <Footer />
    </div>
  );
}

const styles = {
  page: { maxWidth: 1400, margin: "0 auto", padding: "30px" },
  hero: {
    background: "linear-gradient(135deg,#ecfeff,#f8fafc)",
    borderRadius: 32, padding: "50px",
    display: "grid", gridTemplateColumns: "1.2fr 420px",
    gap: "40px", alignItems: "center", marginBottom: "30px",
  },
  heroLeft: {},
  heroTag: {
    display: "inline-block", background: "rgba(15,127,124,0.12)",
    color: "#0f7f7c", padding: "10px 18px", borderRadius: "999px",
    fontWeight: "900", fontSize: "14px", marginBottom: "20px",
  },
  heroTitle: {
    fontSize: "68px", lineHeight: "1.05", fontWeight: "900",
    color: "#0f172a", marginBottom: "20px",
  },
  heroText: {
    fontSize: "18px", lineHeight: "1.8", color: "#475569", maxWidth: "700px",
  },
  heroButtons: { display: "flex", gap: "14px", marginTop: "30px", flexWrap: "wrap" },
  primaryBtn: {
    textDecoration: "none", background: "linear-gradient(135deg,#0f766e,#14b8a6)",
    color: "#fff", padding: "14px 22px", borderRadius: 16, fontWeight: "900",
    boxShadow: "0 12px 24px rgba(15,118,110,0.25)",
  },
  heroCard: {
    background: "#fff", borderRadius: "28px", padding: "28px",
    display: "grid", gap: "18px", boxShadow: "0 20px 40px rgba(0,0,0,0.06)",
  },
  heroMiniCard: { background: "#f8fafc", borderRadius: "20px", padding: "22px" },
  heroMiniNumber: {
    fontSize: "42px", fontWeight: "900", color: "#0f7f7c", marginBottom: "6px",
  },
  heroMiniLabel: { color: "#64748b", fontWeight: "700" },
  card: {
    marginTop: 24, background: "#fff", border: "1px solid rgba(0,0,0,0.05)",
    borderRadius: 28, padding: 28, boxShadow: "0 14px 40px rgba(0,0,0,0.05)",
  },
  cardTitle: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: 18,
  },
  refreshBtn: {
    background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#0f172a",
    padding: "10px 18px", borderRadius: 12, fontWeight: "800",
    cursor: "pointer", fontSize: 14,
  },
  rowCard: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    gap: 16, padding: 24, borderRadius: 24, background: "#f8fafc",
    border: "1px solid rgba(0,0,0,0.05)", marginTop: 18, flexWrap: "wrap",
  },
  left: { minWidth: 260, flex: 1 },
  right: {
    display: "flex", flexDirection: "column",
    gap: 10, alignItems: "flex-end",
  },
  rowMain: { fontSize: 16, marginBottom: 8, display: "flex", flexWrap: "wrap", gap: 4 },
  muted: { color: "#64748b", fontSize: 14, marginBottom: 6 },
  dot: { margin: "0 6px", color: "#cbd5e1" },
  detailBox: {
    marginTop: 10, padding: "10px 14px", borderRadius: 12,
    background: "#fff", border: "1px solid #e2e8f0",
    display: "flex", flexDirection: "column", gap: 4,
  },
  detailLabel: { fontWeight: 800, fontSize: 12, color: "#0f766e" },
  detailText: { fontSize: 14, color: "#0f172a", lineHeight: 1.6 },
  blockchain: {
    background: "#dce8ff", color: "#1a3a6b",
    padding: "6px 14px", borderRadius: "999px",
    fontWeight: "800", fontSize: 13, display: "inline-block",
  },
  validBadge: {
    background: "#dcfce7", color: "#166534",
    padding: "8px 16px", borderRadius: "999px",
    fontWeight: "800", fontSize: 13,
  },
  dispenseBtn: {
    border: "none",
    background: "linear-gradient(135deg,#0f766e,#14b8a6)",
    color: "#fff", padding: "14px 22px", borderRadius: 14,
    fontWeight: "900", fontSize: 15,
    boxShadow: "0 8px 20px rgba(15,118,110,0.25)",
  },
  emptyBox: {
    textAlign: "center", padding: "60px 20px",
    background: "#f8fafc", borderRadius: 24, marginTop: 18,
  },
  errorBox: {
    marginTop: 20, background: "#fee2e2", color: "#991b1b",
    padding: 14, borderRadius: 14, fontWeight: "700",
  },
};
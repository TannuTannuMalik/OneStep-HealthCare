import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo, useRef } from "react";
import { socket, connectSocket } from "../utils/socket";
import { api } from "../utils/api";
import ChatBot from "../pages/ChatBot";

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });
  const toastTimerRef = useRef(null);

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); }
    catch { return null; }
  }, []);

  const JOIN_WINDOW_MINUTES = 1;

  const canJoinVideoCall = (appointment) => {
    if (!appointment) return false;
    if (appointment.appointmentType !== "VIDEO") return false;
    if (appointment.status !== "CONFIRMED") return false;
    const now = new Date();
    const start = new Date(appointment.requestedStart);
    const end = new Date(appointment.requestedEnd);
    const joinWindowStart = new Date(start.getTime() - JOIN_WINDOW_MINUTES * 60 * 1000);
    return now >= joinWindowStart && now <= end;
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "CONFIRMED": return { background: "#dcfce7", color: "#166534" };
      case "REQUESTED": return { background: "#fef3c7", color: "#92400e" };
      case "COMPLETED": return { background: "#e0e7ff", color: "#3730a3" };
      default: return { background: "#e2e8f0", color: "#334155" };
    }
  };

  const getPaymentBadge = (appointment) => {
    if (!appointment.paymentStatus || appointment.paymentStatus === "PENDING") {
      return { label: "💳 Unpaid", bg: "#fff7ed", color: "#c2410c" };
    }
    if (appointment.paymentStatus === "PAID") {
      return { label: `✅ Paid $${appointment.consultationFee || "50.00"}`, bg: "#dcfce7", color: "#166534" };
    }
    if (appointment.paymentStatus === "REFUNDED") {
      return { label: "↩️ Refunded", bg: "#e0e7ff", color: "#3730a3" };
    }
    return null;
  };

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast((t) => ({ ...t, show: false }));
    }, 3500);
  };

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code);
    showToast(`Copied ${code} ✅`, "success");
  };

  const loadAppointments = async () => {
    const res = await api.get("/appointments/patient/me");
    if (res.data.ok) setAppointments(res.data.data || []);
  };

  const loadReports = async () => {
    const res = await api.get("/reports/patient/me");
    if (res.data.ok) setReports(res.data.data || []);
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await Promise.all([loadAppointments(), loadReports()]);
      } catch (e) {
        setErrMsg(e.response?.data?.error || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    connectSocket();
    if (!socket) return;
    socket.emit("join", { userId: user.id });
    const onStatus = () => loadAppointments();
    const onReport = () => { loadReports(); showToast("New report available ✅", "success"); };
    socket.on("appointment_status", onStatus);
    socket.on("report_ready", onReport);
    return () => {
      socket.off("appointment_status", onStatus);
      socket.off("report_ready", onReport);
    };
  }, [user?.id]);

  return (
    <div>
      <Navbar />

      {toast.show && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: toast.type === "success" ? "#dcfce7" : "#fff",
          color: toast.type === "success" ? "#166534" : "#111",
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
            <div style={styles.heroTag}>Trusted Digital Healthcare</div>
            <h1 style={styles.heroTitle}>
              Welcome back,<br />{user?.fullName || "Patient"}
            </h1>
            <p style={styles.heroText}>
              Manage appointments, download reports, verify blockchain
              prescriptions, and connect with doctors securely from one place.
            </p>
            <div style={styles.heroButtons}>
              <Link to="/find-doctor" style={styles.primaryBtn}>+ Book Appointment</Link>
              <Link to="/health-assistant" style={styles.aiBtn}>🤖 Health Assistant</Link>
              <Link to="/reports" style={styles.secondaryBtn}>View Reports</Link>
            </div>
          </div>

          <div style={styles.heroCard}>
            <div style={styles.heroMiniCard}>
              <div style={styles.heroMiniNumber}>{appointments.length}</div>
              <div style={styles.heroMiniLabel}>Appointments</div>
            </div>
            <div style={styles.heroMiniCard}>
              <div style={styles.heroMiniNumber}>{reports.length}</div>
              <div style={styles.heroMiniLabel}>Reports</div>
            </div>
            <div style={styles.heroMiniCard}>
              <div style={styles.heroMiniNumber}>Active</div>
              <div style={styles.heroMiniLabel}>Account Status</div>
            </div>
          </div>
        </section>

        {/* APPOINTMENTS */}
        <section style={styles.card}>
          <div style={styles.cardTitle}>
            <h2 style={{ margin: 0 }}>Upcoming Appointments</h2>
            <Link to="/appointments" style={styles.linkBtn}>View All</Link>
          </div>

          {loading ? (
            <p>Loading appointments...</p>
          ) : appointments.length === 0 ? (
            <p>No appointments yet.</p>
          ) : (
            appointments.map((a) => {
              const payBadge = getPaymentBadge(a);
              return (
                <div key={a.id} style={styles.rowCard}>
                  <div style={styles.left}>
                    <div style={styles.rowMain}>
                      <b>{a.doctorName}</b>
                      <span style={styles.dot}>•</span>
                      <span style={styles.muted}>{a.specialty}</span>
                    </div>
                    <div style={styles.muted}>
                      {new Date(a.requestedStart).toLocaleString()}
                    </div>
                    {a.appointmentType === "VIDEO" &&
                      a.status === "CONFIRMED" &&
                      canJoinVideoCall(a) && (
                        <button
                          onClick={() => navigate(`/video-call/${a.id}`)}
                          style={styles.joinBtn}
                        >
                          📹 Join Video Call
                        </button>
                      )}
                  </div>

                  <div style={styles.right}>
                    <span style={{ ...styles.badge, ...getStatusBadgeStyle(a.status) }}>
                      {a.status}
                    </span>
                    {payBadge && (
                      <span style={{ ...styles.badge, background: payBadge.bg, color: payBadge.color }}>
                        {payBadge.label}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* REPORTS */}
        <section style={styles.card}>
          <div style={styles.cardTitle}>
            <h2 style={{ margin: 0 }}>Medical Reports</h2>
            <Link to="/reports" style={styles.linkBtn}>View All</Link>
          </div>

          {loading ? (
            <p>Loading reports...</p>
          ) : reports.length === 0 ? (
            <p>No reports found.</p>
          ) : (
            reports.map((r) => (
              <div key={r.id} style={styles.rowCard}>
                <div style={styles.left}>
                  <div style={styles.rowMain}>
                    <b>Report #{r.id}</b>
                    <span style={styles.dot}>•</span>
                    <span style={styles.muted}>{r.doctorName}</span>
                  </div>
                  <div style={styles.muted}>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </div>

                  {/* Pharmacy prescription code — patient shows this at the pharmacy */}
                  {r.prescription && r.prescription.trim().length > 0 && (
                    <div style={styles.rxBox}>
                      <span style={styles.rxLabel}>💊 Pharmacy Code</span>
                      <span style={styles.rxCode}>RX-2026-{r.id}</span>
                      <button
                        style={styles.rxCopy}
                        onClick={() => copyCode(`RX-2026-${r.id}`)}
                      >
                        Copy
                      </button>
                      <span style={styles.rxHint}>
                        Show this code at any pharmacy to collect your prescription
                      </span>
                    </div>
                  )}
                </div>
                <div style={styles.right}>
                  <span style={r.pdfHash ? styles.verified : styles.pending}>
                    {r.pdfHash ? "Verified ✅" : "Pending"}
                  </span>
                  {r.blockchainTx && (
                    <span style={styles.blockchain}>⛓️ On Blockchain</span>
                  )}
                </div>
              </div>
            ))
          )}
        </section>

        <ChatBot />

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
  heroTitle: { fontSize: "68px", lineHeight: "1.05", fontWeight: "900", color: "#0f172a", marginBottom: "20px" },
  heroText: { fontSize: "18px", lineHeight: "1.8", color: "#475569", maxWidth: "700px" },
  heroButtons: { display: "flex", gap: "14px", marginTop: "30px", flexWrap: "wrap" },
  primaryBtn: {
    textDecoration: "none", background: "linear-gradient(135deg,#0f766e,#14b8a6)",
    color: "#fff", padding: "14px 22px", borderRadius: 16, fontWeight: "900",
    boxShadow: "0 12px 24px rgba(15,118,110,0.25)",
  },
  aiBtn: {
    textDecoration: "none", background: "linear-gradient(135deg,#7c3aed,#a855f7)",
    color: "#fff", padding: "14px 22px", borderRadius: 16, fontWeight: "900",
    boxShadow: "0 12px 24px rgba(124,58,237,0.25)",
  },
  secondaryBtn: {
    textDecoration: "none", background: "#fff", color: "#0f172a",
    padding: "14px 22px", borderRadius: 16, fontWeight: "900",
    border: "1px solid #dbe2ea",
  },
  heroCard: {
    background: "#fff", borderRadius: "28px", padding: "28px",
    display: "grid", gap: "18px", boxShadow: "0 20px 40px rgba(0,0,0,0.06)",
  },
  heroMiniCard: { background: "#f8fafc", borderRadius: "20px", padding: "22px" },
  heroMiniNumber: { fontSize: "42px", fontWeight: "900", color: "#0f7f7c", marginBottom: "6px" },
  heroMiniLabel: { color: "#64748b", fontWeight: "700" },
  card: {
    marginTop: 24, background: "#fff", border: "1px solid rgba(0,0,0,0.05)",
    borderRadius: 28, padding: 28, boxShadow: "0 14px 40px rgba(0,0,0,0.05)",
  },
  cardTitle: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  linkBtn: { color: "#0f7f7c", fontWeight: "900", textDecoration: "none" },
  rowCard: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    gap: 16, padding: 22, borderRadius: 24, background: "#f8fafc",
    border: "1px solid rgba(0,0,0,0.05)", marginTop: 18, flexWrap: "wrap",
  },
  left: { minWidth: 260, flex: 1 },
  right: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
  rowMain: { fontSize: 16, marginBottom: 8 },
  muted: { color: "#64748b", fontSize: 14 },
  dot: { margin: "0 8px" },
  badge: { padding: "8px 14px", borderRadius: "999px", fontWeight: "800", fontSize: 13 },
  joinBtn: {
    marginTop: 14, border: "none",
    background: "linear-gradient(135deg,#0f766e,#14b8a6)",
    color: "#fff", padding: "12px 18px", borderRadius: 14,
    fontWeight: "800", cursor: "pointer",
  },
  verified: {
    background: "#dcfce7", color: "#166534",
    padding: "8px 14px", borderRadius: "999px", fontWeight: "800",
  },
  pending: {
    background: "#fef3c7", color: "#92400e",
    padding: "8px 14px", borderRadius: "999px", fontWeight: "800",
  },
  blockchain: {
    background: "#dce8ff", color: "#1a3a6b",
    padding: "8px 14px", borderRadius: "999px", fontWeight: "800", fontSize: 13,
  },
  // ── prescription code box ──
  rxBox: {
    marginTop: 14, display: "flex", alignItems: "center", flexWrap: "wrap",
    gap: 10, padding: "12px 16px", borderRadius: 16,
    background: "#f0fdfa", border: "1px dashed rgba(15,127,124,0.4)",
  },
  rxLabel: { fontWeight: 900, color: "#0f766e", fontSize: 13 },
  rxCode: {
    fontFamily: "monospace", fontWeight: 900, fontSize: 18,
    color: "#0f172a", letterSpacing: "1px",
    background: "#fff", padding: "4px 12px", borderRadius: 8,
    border: "1px solid rgba(15,127,124,0.25)",
  },
  rxCopy: {
    border: "1px solid #0f766e", background: "#fff", color: "#0f766e",
    fontWeight: 800, cursor: "pointer", padding: "6px 14px", borderRadius: 8, fontSize: 13,
  },
  rxHint: { fontSize: 12, color: "#64748b", flexBasis: "100%" },
  errorBox: {
    marginTop: 20, background: "#fee2e2", color: "#991b1b",
    padding: 14, borderRadius: 14, fontWeight: "700",
  },
};
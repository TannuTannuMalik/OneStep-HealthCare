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
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const JOIN_WINDOW_MINUTES = 1;

  const canJoinVideoCall = (appointment) => {
    if (!appointment) return false;
    if (appointment.appointmentType !== "VIDEO") return false;
    if (appointment.status !== "CONFIRMED") return false;

    const now = new Date();
    const start = new Date(appointment.requestedStart);
    const end = new Date(appointment.requestedEnd);
    const joinWindowStart = new Date(
      start.getTime() - JOIN_WINDOW_MINUTES * 60 * 1000
    );

    return now >= joinWindowStart && now <= end;
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "CONFIRMED":
        return {
          background: "#dff7e6",
          color: "#1b7a3c",
          border: "1px solid rgba(27,122,60,0.25)",
        };
      case "REQUESTED":
        return {
          background: "#fff3cd",
          color: "#8a5b00",
          border: "1px solid rgba(138,91,0,0.25)",
        };
      case "COMPLETED":
        return {
          background: "#eef2ff",
          color: "#3730a3",
          border: "1px solid rgba(55,48,163,0.2)",
        };
      case "REJECTED":
      case "CANCELLED":
        return {
          background: "#ffe3e3",
          color: "#9c2a2a",
          border: "1px solid rgba(156,42,42,0.2)",
        };
      default:
        return {
          background: "#eef7f7",
          color: "#0f7f7c",
          border: "1px solid rgba(15,127,124,0.25)",
        };
    }
  };

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });

    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast((t) => ({ ...t, show: false }));
    }, 3500);
  };

  const loadAppointments = async () => {
    const res = await api.get("/appointments/patient/me");
    if (res.data.ok) setAppointments(res.data.data || []);
    else throw new Error(res.data.error || "Failed to load appointments");
  };

  const loadReports = async () => {
    const res = await api.get("/reports/patient/me");
    if (res.data.ok) setReports(res.data.data || []);
    else throw new Error(res.data.error || "Failed to load reports");
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

      showToast(`Report #${reportId} downloaded ✅`, "success");
    } catch (e) {
      console.error("download report error:", e);
      const msg = e.response?.data?.error || e.message || "Download failed";
      showToast(msg, "error");
      alert(msg);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErrMsg("");
      try {
        await Promise.all([loadAppointments(), loadReports()]);
      } catch (e) {
        console.error(e);
        setErrMsg(e.response?.data?.error || e.message || "Something went wrong");
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

    const onStatus = (payload) => {
      loadAppointments().catch(console.error);
      showToast(`Appointment updated: ${payload?.status || "changed"}`, "info");
    };

    const onReport = (payload) => {
      loadReports().catch(console.error);
      showToast(
        `New report is ready ✅ ${payload?.reportId ? `(Report #${payload.reportId})` : ""}`,
        "success"
      );
    };

    socket.on("appointment_status", onStatus);
    socket.on("report_ready", onReport);

    return () => {
      socket.off("appointment_status", onStatus);
      socket.off("report_ready", onReport);
    };
  }, [user?.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAppointments((prev) => [...prev]);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  return (
    <div>
      <Navbar />

      {toast.show && (
        <div
          style={{
            position: "fixed",
            top: 16,
            right: 16,
            zIndex: 9999,
            padding: "12px 14px",
            borderRadius: 12,
            fontWeight: 900,
            boxShadow: "0 8px 22px rgba(0,0,0,0.12)",
            background:
              toast.type === "success"
                ? "#dff7e6"
                : toast.type === "error"
                ? "#ffe3e3"
                : "#eef7f7",
            color:
              toast.type === "success"
                ? "#1b7a3c"
                : toast.type === "error"
                ? "#9c2a2a"
                : "#0f7f7c",
            border:
              toast.type === "success"
                ? "1px solid rgba(27,122,60,0.25)"
                : toast.type === "error"
                ? "1px solid rgba(156,42,42,0.25)"
                : "1px solid rgba(15,127,124,0.25)",
            maxWidth: 360,
            cursor: "pointer",
          }}
          onClick={() => setToast((t) => ({ ...t, show: false }))}
          title="Click to dismiss"
        >
          {toast.message}
        </div>
      )}

      <main style={styles.page}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={{ margin: 0 }}>Patient Dashboard</h1>
            <p style={styles.sub}>
              Manage your appointments, view reports, and book a doctor.
            </p>
          </div>

          <Link to="/find-doctor" style={styles.primaryBtn}>
            + Book New Appointment
          </Link>
        </div>

        {errMsg && (
          <div style={{ marginTop: 12, color: "crimson", fontWeight: 800 }}>
            Error: {errMsg}
          </div>
        )}

        <section style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Appointments</div>
            <div style={styles.statValue}>{appointments.length}</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>Reports</div>
            <div style={styles.statValue}>{reports.length}</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>Account</div>
            <div style={styles.statValueSmall}>Active</div>
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.cardTitle}>
            <h2 style={{ margin: 0 }}>Appointments</h2>
            <Link to="/appointments" style={styles.linkBtn}>
              View All
            </Link>
          </div>

          {loading ? (
            <p style={styles.empty}>Loading appointments...</p>
          ) : appointments.length === 0 ? (
            <p style={styles.empty}>No appointments found.</p>
          ) : (
            appointments.map((a) => (
              <div key={a.id} style={styles.rowCard}>
                <div style={styles.left}>
                  <div style={styles.rowMain}>
                    <b>{a.doctorName}</b> <span style={styles.dot}>•</span>
                    <span style={styles.muted}>{a.specialty}</span>
                  </div>

                  <div style={styles.muted}>
                    {a.requestedStart
                      ? new Date(a.requestedStart).toLocaleString()
                      : "No time"}
                    {" • "}
                    {a.appointmentType}
                  </div>

                  {a.patientNote && (
                    <div style={styles.noteBox}>
                      <b>Your note:</b> {a.patientNote}
                    </div>
                  )}

                  {a.status === "REQUESTED" && (
                    <div style={styles.infoText}>
                      Waiting for doctor confirmation.
                    </div>
                  )}

                  {a.appointmentType === "VIDEO" &&
                    a.status === "CONFIRMED" &&
                    !canJoinVideoCall(a) && (
                      <div style={styles.infoText}>
                        Video call will be available 1 minute before appointment time.
                      </div>
                    )}

                  {canJoinVideoCall(a) && (
                    <button
                      type="button"
                      onClick={() => navigate(`/video-call/${a.id}`)}
                      style={styles.joinBtn}
                    >
                      📹 Join Video Call
                    </button>
                  )}

                  {a.status === "COMPLETED" && (
                    <button
                      type="button"
                      onClick={() => navigate("/reports")}
                      style={styles.reportBtn}
                    >
                      📄 View Report
                    </button>
                  )}
                </div>

                <div style={styles.right}>
                  <span
                    style={{
                      ...styles.badge,
                      ...getStatusBadgeStyle(a.status),
                    }}
                  >
                    {a.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </section>

        <section style={styles.card}>
          <div style={styles.cardTitle}>
            <h2 style={{ margin: 0 }}>Reports</h2>
            <Link to="/reports" style={styles.linkBtn}>
              View All
            </Link>
          </div>

          {loading ? (
            <p style={styles.empty}>Loading reports...</p>
          ) : reports.length === 0 ? (
            <p style={styles.empty}>No reports yet.</p>
          ) : (
            reports.map((r) => (
              <div key={r.id} style={styles.rowCard}>
                <div style={styles.left}>
                  <div style={styles.rowMain}>
                    <b>Report #{r.id}</b> <span style={styles.dot}>•</span>
                    <span style={styles.muted}>{r.doctorName}</span>
                  </div>
                  <div style={styles.muted}>
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "No date"}
                  </div>
                </div>

                <div style={styles.right}>
                  <span style={r.pdfHash ? styles.verified : styles.pending}>
                    {r.pdfHash ? "Verified ✅" : "Pending ⏳"}
                  </span>

                  <button
                    type="button"
                    style={styles.outlineBtn}
                    disabled={!r.pdfUrl}
                    onClick={() => downloadReport(r.id)}
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
        <ChatBot />

        <div style={styles.note}>
          <b>Reminder:</b> This platform provides guidance only and does not give medical diagnosis.
        </div>
      </main>

      <Footer />
    </div>
  );
}

const styles = {
  page: { maxWidth: 1100, margin: "0 auto", padding: 24 },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  sub: { marginTop: 6, opacity: 0.8 },
  primaryBtn: {
    textDecoration: "none",
    background: "#0f7f7c",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 10,
    fontWeight: 900,
  },

  statsGrid: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },
  statCard: {
    background: "#fff",
    border: "1px solid #eee",
    borderRadius: 14,
    padding: 16,
  },
  statLabel: { fontSize: 12, opacity: 0.75, fontWeight: 900, marginBottom: 6 },
  statValue: { fontSize: 34, fontWeight: 900, color: "#0f7f7c" },
  statValueSmall: { fontSize: 18, fontWeight: 900, color: "#0f7f7c" },

  card: {
    marginTop: 16,
    background: "#fff",
    border: "1px solid #eee",
    borderRadius: 14,
    padding: 16,
  },
  cardTitle: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  linkBtn: { textDecoration: "none", color: "#0f7f7c", fontWeight: 900 },

  rowCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.06)",
    marginTop: 10,
    flexWrap: "wrap",
  },
  left: { minWidth: 260, flex: 1 },
  right: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
  rowMain: { fontSize: 14 },
  muted: { opacity: 0.75, fontSize: 13 },
  dot: { margin: "0 6px", opacity: 0.5 },

  badge: {
    fontWeight: 900,
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
  },

  noteBox: {
    marginTop: 8,
    background: "#f9f9f9",
    borderRadius: 10,
    padding: "8px 10px",
    fontSize: 13,
    color: "#555",
  },

  infoText: {
    marginTop: 8,
    fontSize: 13,
    color: "#666",
    fontWeight: 600,
  },

  joinBtn: {
    marginTop: 10,
    padding: "10px 14px",
    border: "none",
    borderRadius: 10,
    background: "#0f7f7c",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },

  reportBtn: {
    marginTop: 10,
    marginLeft: 10,
    padding: "10px 14px",
    border: "none",
    borderRadius: 10,
    background: "#6366f1",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },

  outlineBtn: {
    border: "1px solid #0f7f7c",
    background: "#fff",
    color: "#0f7f7c",
    borderRadius: 10,
    padding: "8px 12px",
    fontWeight: 900,
    cursor: "pointer",
    textDecoration: "none",
  },

  verified: {
    fontSize: 12,
    fontWeight: 900,
    color: "#1b7a3c",
    background: "#dff7e6",
    padding: "6px 10px",
    borderRadius: 999,
  },
  pending: {
    fontSize: 12,
    fontWeight: 900,
    color: "#8a5b00",
    background: "#fff3cd",
    padding: "6px 10px",
    borderRadius: 999,
  },

  empty: { opacity: 0.75 },
  note: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    background: "#fff7e6",
    border: "1px solid rgba(255, 153, 0, 0.35)",
    lineHeight: 1.5,
  },
};
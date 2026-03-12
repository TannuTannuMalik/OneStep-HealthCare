import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { api } from "../utils/api";

const canJoinVideoCall = (appointment) => {
  if (!appointment) return false;
  if (appointment.appointmentType !== "VIDEO") return false;
  if (appointment.status !== "CONFIRMED") return false;

  const now = new Date();
  const start = new Date(appointment.requestedStart);
  const end = new Date(appointment.requestedEnd);
  const joinWindowStart = new Date(start.getTime() - 1 * 60 * 1000);

  return now >= joinWindowStart && now <= end;
};

export default function Appointments() {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/api/appointments/patient/me")
      .then((res) => {
        if (res.data.ok) setAppointments(res.data.data || []);
        else setError(res.data.error || "Failed to load appointments");
      })
      .catch((e) => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  }, []);

  const statusColor = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "#10b981";
      case "COMPLETED":
        return "#6366f1";
      case "CANCELLED":
        return "#ef4444";
      case "REJECTED":
        return "#f97316";
      case "REQUESTED":
        return "#f59e0b";
      default:
        return "#888";
    }
  };

  const upcoming = appointments.filter((a) =>
    ["REQUESTED", "CONFIRMED"].includes(a.status)
  );

  const past = appointments.filter((a) =>
    ["COMPLETED", "CANCELLED", "REJECTED"].includes(a.status)
  );

  return (
    <>
      <Navbar />

      <div style={styles.container}>
        <h1 style={styles.heading}>My Appointments</h1>

        {loading && <p style={styles.info}>Loading appointments…</p>}
        {error && <p style={styles.error}>{error}</p>}

        {!loading && appointments.length === 0 && !error && (
          <div style={styles.empty}>
            <div style={{ fontSize: 48 }}>📅</div>
            <p>No appointments yet.</p>
            <button
              style={styles.bookBtn}
              onClick={() => navigate("/find-doctor")}
            >
              Find a Doctor
            </button>
          </div>
        )}

        {upcoming.length > 0 && (
          <>
            <h2 style={styles.sectionTitle}>Upcoming</h2>
            {upcoming.map((a) => (
              <AppointmentCard
                key={a.id}
                a={a}
                statusColor={statusColor}
                navigate={navigate}
              />
            ))}
          </>
        )}

        {past.length > 0 && (
          <>
            <h2 style={styles.sectionTitle}>Past</h2>
            {past.map((a) => (
              <AppointmentCard
                key={a.id}
                a={a}
                statusColor={statusColor}
                navigate={navigate}
              />
            ))}
          </>
        )}
      </div>

      <Footer />
    </>
  );
}

function AppointmentCard({ a, statusColor, navigate }) {
  const isJoinable = canJoinVideoCall(a);

  return (
    <div style={styles.card}>
      <div style={{ ...styles.badge, background: statusColor(a.status) }}>
        {a.status}
      </div>

      <h3 style={styles.doctorName}>{a.doctorName}</h3>

      {a.specialty && <p style={styles.meta}>🩺 {a.specialty}</p>}

      <p style={styles.meta}>
        🗓 {new Date(a.requestedStart).toLocaleString()} →{" "}
        {new Date(a.requestedEnd).toLocaleTimeString()}
      </p>

      <p style={styles.meta}>
        📋 {a.appointmentType === "VIDEO" ? "📹 Video" : "🏥 In-Person"} Consultation
      </p>

      {a.patientNote && (
        <p style={styles.note}>
          <strong>Your note:</strong> {a.patientNote}
        </p>
      )}

      {a.status === "REQUESTED" && (
        <p style={styles.infoText}>Waiting for doctor confirmation.</p>
      )}

      {a.appointmentType === "VIDEO" &&
        a.status === "CONFIRMED" &&
        !isJoinable && (
          <p style={styles.infoText}>
            Video call will be available 1 minutes before appointment time.
          </p>
        )}

      {isJoinable && (
        <button
          style={styles.joinBtn}
          onClick={() => navigate(`/video-call/${a.id}`)}
        >
          📹 Join Video Call
        </button>
      )}

      {a.status === "COMPLETED" && (
        <button
          style={styles.reportBtn}
          onClick={() => navigate("/reports")}
        >
          📄 View Report
        </button>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "800px",
    margin: "40px auto",
    padding: "20px",
    fontFamily: "system-ui, sans-serif",
  },
  heading: {
    fontSize: 28,
    fontWeight: 900,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    opacity: 0.5,
    textTransform: "uppercase",
    letterSpacing: 1,
    margin: "28px 0 12px",
  },
  card: {
    background: "#fff",
    padding: "20px 24px",
    marginBottom: "16px",
    borderRadius: "14px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
    position: "relative",
  },
  badge: {
    display: "inline-block",
    color: "#fff",
    fontSize: 11,
    fontWeight: 800,
    padding: "3px 10px",
    borderRadius: 20,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  doctorName: {
    margin: "0 0 8px",
    fontSize: 18,
    fontWeight: 800,
  },
  meta: {
    margin: "4px 0",
    fontSize: 14,
    color: "#555",
  },
  note: {
    margin: "8px 0 0",
    fontSize: 13,
    color: "#666",
    background: "#f9f9f9",
    padding: "8px 12px",
    borderRadius: 8,
  },
  infoText: {
    marginTop: 10,
    fontSize: 13,
    color: "#666",
  },
  joinBtn: {
    marginTop: 14,
    padding: "10px 20px",
    background: "#0f7f7c",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
    marginRight: 10,
  },
  reportBtn: {
    marginTop: 14,
    padding: "10px 20px",
    background: "#6366f1",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
  },
  bookBtn: {
    marginTop: 12,
    padding: "10px 24px",
    background: "#0f7f7c",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontWeight: 800,
    cursor: "pointer",
  },
  empty: {
    textAlign: "center",
    padding: "60px 20px",
    opacity: 0.6,
  },
  info: { color: "#555" },
  error: { color: "crimson", fontWeight: 700 },
};
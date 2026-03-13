import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { api } from "../utils/api";

export default function BookAppointment() {
  const { doctorId } = useParams();
  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const [requestedStart, setRequestedStart] = useState("");
  const [requestedEnd, setRequestedEnd] = useState("");
  const [appointmentType, setAppointmentType] = useState("VIDEO");
  const [patientNote, setPatientNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!user) navigate("/login");
    if (user?.role !== "PATIENT") navigate("/login");
  }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");

    if (!requestedStart || !requestedEnd) {
      setErr("Please select start and end time.");
      return;
    }

    try {
      setLoading(true);

      const startSql = requestedStart.replace("T", " ") + ":00";
      const endSql = requestedEnd.replace("T", " ") + ":00";

      const res = await api.post("/appointments", {
        doctorId: Number(doctorId),
        requestedStart: startSql,
        requestedEnd: endSql,
        appointmentType,
        patientNote,
      });

      if (res.data.ok) {
        setMsg("Appointment requested ✅");
        setTimeout(() => navigate("/patient"), 700);
      } else {
        setErr(res.data.error || "Booking failed");
      }
    } catch (e2) {
      setErr(e2.response?.data?.error || e2.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />

      <main style={styles.page}>
        <h1 style={{ marginTop: 0 }}>Book Appointment</h1>

        <div style={styles.card}>
          <b>Doctor ID:</b> {doctorId}
          <div style={{ opacity: 0.75, marginTop: 6 }}>
            Choose times and submit your appointment request.
          </div>
        </div>

        <form onSubmit={submit} style={styles.form}>
          <label style={styles.label}>
            Start time
            <input
              type="datetime-local"
              value={requestedStart}
              onChange={(e) => setRequestedStart(e.target.value)}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            End time
            <input
              type="datetime-local"
              value={requestedEnd}
              onChange={(e) => setRequestedEnd(e.target.value)}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Appointment type
            <select
              value={appointmentType}
              onChange={(e) => setAppointmentType(e.target.value)}
              style={styles.input}
            >
              <option value="VIDEO">VIDEO</option>
              <option value="IN_PERSON">IN_PERSON</option>
            </select>
          </label>

          <label style={styles.label}>
            Note (optional)
            <textarea
              value={patientNote}
              onChange={(e) => setPatientNote(e.target.value)}
              rows={4}
              style={styles.input}
            />
          </label>

          <button disabled={loading} style={styles.btn}>
            {loading ? "Booking..." : "Submit Request"}
          </button>

          {msg && <div style={{ color: "green", fontWeight: 800 }}>{msg}</div>}
          {err && <div style={{ color: "crimson", fontWeight: 800 }}>{err}</div>}
        </form>
      </main>

      <Footer />
    </div>
  );
}

const styles = {
  page: { maxWidth: 900, margin: "0 auto", padding: 24 },
  card: {
    marginTop: 10,
    border: "1px solid #eee",
    borderRadius: 12,
    padding: 12,
    background: "#fff",
  },
  form: { display: "grid", gap: 12, marginTop: 14 },
  label: { fontWeight: 800, display: "grid", gap: 6 },
  input: {
    width: "100%",
    padding: 10,
    borderRadius: 10,
    border: "1px solid #ddd",
  },
  btn: {
    padding: 12,
    borderRadius: 12,
    border: "none",
    background: "#0f7f7c",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  },
};
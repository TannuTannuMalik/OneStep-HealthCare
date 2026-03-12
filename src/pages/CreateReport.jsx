import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../utils/api";

export default function CreateReport() {
  const navigate = useNavigate();
  const { appointmentId } = useParams();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const [appt, setAppt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    diagnosis: "",
    prescription: "",
    doctorNotes: "",
    improvementSuggestions: "",
    followUpDate: "",
  });

  // ✅ protect
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !user) navigate("/login");
    if (user?.role !== "DOCTOR") navigate("/login");
  }, [navigate, user]);

  // ✅ load appointment details (doctor must own it)
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr("");
      setMsg("");

      try {
        const res = await api.get(`/api/appointments/${appointmentId}`);
        if (res.data.ok) {
          setAppt(res.data.data);
        } else {
          setErr(res.data.error || "Failed to load appointment");
        }
      } catch (e) {
        setErr(e.response?.data?.error || e.message);
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId) load();
  }, [appointmentId]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    try {
      const payload = {
        appointmentId: Number(appointmentId),
        diagnosis: form.diagnosis,
        prescription: form.prescription,
        doctorNotes: form.doctorNotes,
        improvementSuggestions: form.improvementSuggestions,
        followUpDate: form.followUpDate ? new Date(form.followUpDate).toISOString() : null,
      };

      const res = await api.post("/api/reports", payload);

      if (res.data.ok) {
        setMsg("Report created ✅ PDF generated + saved.");
        const pdfUrl = res.data.data?.pdfUrl;
        if (pdfUrl) window.open(pdfUrl, "_blank");
      } else {
        setErr(res.data.error || "Report create failed");
      }
    } catch (e2) {
      setErr(e2.response?.data?.error || e2.message);
    }
  };

  return (
    <div>
      <Navbar />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
        <h1 style={{ marginTop: 0 }}>Create Consultation Report</h1>

        {loading ? (
          <p>Loading appointment...</p>
        ) : err ? (
          <div style={boxErr}><b>Error:</b> {err}</div>
        ) : (
          <>
            <div style={boxInfo}>
              <div><b>Appointment ID:</b> {appointmentId}</div>
              <div><b>Status:</b> {appt?.status}</div>
              <div style={{ opacity: 0.8 }}>
                Note: Report can be created only when status is <b>COMPLETED</b>.
              </div>
            </div>

            {msg && <div style={boxOk}>{msg}</div>}
            {err && <div style={boxErr}><b>Error:</b> {err}</div>}

            <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
              <input
                name="diagnosis"
                placeholder="Diagnosis"
                value={form.diagnosis}
                onChange={onChange}
                style={input}
              />

              <textarea
                name="prescription"
                placeholder="Prescription"
                value={form.prescription}
                onChange={onChange}
                rows={3}
                style={input}
              />

              <textarea
                name="doctorNotes"
                placeholder="Doctor Notes"
                value={form.doctorNotes}
                onChange={onChange}
                rows={4}
                style={input}
              />

              <textarea
                name="improvementSuggestions"
                placeholder="Improvement Suggestions"
                value={form.improvementSuggestions}
                onChange={onChange}
                rows={3}
                style={input}
              />

              <label style={{ fontWeight: 800 }}>
                Follow-up Date (optional)
                <input
                  type="datetime-local"
                  name="followUpDate"
                  value={form.followUpDate}
                  onChange={onChange}
                  style={{ ...input, marginTop: 6 }}
                />
              </label>

              <button style={btn} type="submit">
                Generate Report PDF
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

const input = {
  padding: 12,
  borderRadius: 10,
  border: "1px solid #ddd",
  outline: "none",
  fontSize: 14,
};

const btn = {
  padding: 12,
  borderRadius: 10,
  border: "none",
  background: "#0f7f7c",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
};

const boxInfo = {
  padding: 12,
  borderRadius: 10,
  border: "1px solid #eee",
  background: "#fafafa",
  marginBottom: 14,
  lineHeight: 1.5,
};

const boxOk = {
  padding: 12,
  borderRadius: 10,
  background: "#dff7e6",
  border: "1px solid rgba(27,122,60,0.25)",
  color: "#1b7a3c",
  marginBottom: 12,
  fontWeight: 800,
};

const boxErr = {
  padding: 12,
  borderRadius: 10,
  background: "#ffe3e3",
  border: "1px solid rgba(156,42,42,0.25)",
  color: "#9c2a2a",
  marginBottom: 12,
  fontWeight: 800,
};
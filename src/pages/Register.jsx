import Navbar from "../components/Navbar";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../utils/api";

export default function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // keep your UI values, but convert to backend enums
  const [role, setRole] = useState("patient");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const mapRole = (r) => {
    if (r === "doctor") return "DOCTOR";
    if (r === "admin") return "ADMIN";
    return "PATIENT";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        fullName,
        email,
        password,
        role: mapRole(role),
      };

      const res = await api.post("/api/auth/register", payload);

      if (res.data.ok) {
        alert("Registered ✅ Now login");
        navigate("/login");
      } else {
        setError(res.data.error || "Registration failed");
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <main style={styles.main}>
        <div style={styles.card}>
          <h2>Register</h2>
          <p style={styles.sub}>Create an account (Patient / Doctor / Admin)</p>

          {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}

          <form onSubmit={onSubmit} style={styles.form}>
            <label style={styles.label}>Full Name</label>
            <input
              style={styles.input}
              placeholder="Your name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <label style={styles.label}>Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={styles.input}
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="admin">Admin</option>
            </select>

            <button style={styles.btn} type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>

          <p style={styles.bottom}>
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

const styles = {
  main: { padding: 18, display: "grid", placeItems: "center" },
  card: {
    width: "100%",
    maxWidth: 460,
    border: "1px solid #e8e8e8",
    borderRadius: 14,
    padding: 18,
  },
  sub: { marginTop: 6, color: "#555" },
  form: { display: "grid", gap: 10, marginTop: 12 },
  label: { fontSize: 13, fontWeight: 700 },
  input: { padding: 10, borderRadius: 10, border: "1px solid #ccc" },
  btn: {
    marginTop: 6,
    padding: 10,
    borderRadius: 10,
    border: "none",
    background: "#222",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
  bottom: { marginTop: 12 },
}
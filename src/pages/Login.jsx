import Navbar from "../components/Navbar";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../utils/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // role dropdown is no longer needed for real login,
  // but we’ll keep it in UI if you want. We will ignore it.
  const [role, setRole] = useState("patient");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const goDashboard = (r) => {
    if (r === "DOCTOR") navigate("/doctor");
    else if (r === "ADMIN") navigate("/admin");
    else navigate("/patient");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/api/auth/login", { email, password });

      if (res.data.ok) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        goDashboard(res.data.user.role);
      } else {
        setError(res.data.error || "Login failed");
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
          <h2>Login</h2>
          <p style={styles.sub}>Login using your registered email and password</p>

          {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}

          <form onSubmit={onSubmit} style={styles.form}>
            {/* Optional UI only - not used in backend */}
            <label style={styles.label}>Role (optional)</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={styles.input}
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="admin">Admin</option>
            </select>

            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="you@example.com"
              required
            />

            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              required
            />

            <button style={styles.btn} type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p style={styles.bottom}>
            Don’t have an account? <Link to="/register">Register</Link>
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
    maxWidth: 420,
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
};
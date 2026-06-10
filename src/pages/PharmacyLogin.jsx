import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";

export default function PharmacyLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });

      if (res.data.ok) {
        const user = res.data.user;

        if (user.role !== "PHARMACIST") {
          setError("Access denied. This portal is for pharmacists only.");
          setLoading(false);
          return;
        }

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(user));
        navigate("/pharmacy/dashboard");
      } else {
        setError(res.data.error || "Login failed");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>💊</div>
          <div style={styles.logoText}>OneStep HealthCare</div>
          <div style={styles.logoSub}>Pharmacist Portal</div>
        </div>

        <h2 style={styles.title}>Pharmacist Login</h2>
        <p style={styles.sub}>
          Sign in to access blockchain prescription verification
        </p>

        <form onSubmit={handleLogin} style={styles.form}>
          <label style={styles.label}>
            Email Address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pharmacist@hospital.co.nz"
              style={styles.input}
              required
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={styles.input}
              required
            />
          </label>

          {error && <div style={styles.errorBox}>❌ {error}</div>}

          <button
            type="submit"
            style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In to Pharmacy Portal"}
          </button>
        </form>

        {/* Info box */}
        <div style={styles.infoBox}>
          <div style={styles.infoTitle}>⛓️ Blockchain Powered</div>
          <div style={styles.infoText}>
            All prescription verifications are recorded permanently on
            Ethereum Sepolia testnet. Dispensing records cannot be altered
            or deleted.
          </div>
        </div>

        {/* Back link */}
        <div style={styles.backWrap}>
          <button style={styles.backBtn} onClick={() => navigate("/")}>
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f766e 0%, #134e4a 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    fontFamily: "system-ui, sans-serif",
  },
  card: {
    background: "#fff",
    borderRadius: 24,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 440,
    boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
  },
  logoWrap: { textAlign: "center", marginBottom: 24 },
  logoIcon: { fontSize: 48, marginBottom: 8 },
  logoText: { fontSize: 20, fontWeight: 900, color: "#0f766e" },
  logoSub: { fontSize: 13, color: "#64748b", marginTop: 2 },
  title: { margin: "0 0 6px", fontSize: 24, fontWeight: 900, color: "#0f172a", textAlign: "center" },
  sub: { margin: "0 0 24px", fontSize: 14, color: "#64748b", textAlign: "center", lineHeight: 1.5 },
  form: { display: "grid", gap: 14 },
  label: { fontWeight: 800, fontSize: 13, display: "grid", gap: 6, color: "#0f172a" },
  input: {
    padding: "12px 14px", borderRadius: 12, border: "1px solid #e2e8f0",
    fontSize: 15, outline: "none", fontFamily: "system-ui, sans-serif",
  },
  errorBox: {
    background: "#fee2e2", border: "1px solid rgba(220,38,38,0.2)",
    borderRadius: 10, padding: 12, color: "#dc2626", fontWeight: 700, fontSize: 13,
  },
  btn: {
    padding: 14, borderRadius: 12, border: "none",
    background: "linear-gradient(to right, #0f766e, #14b8a6)",
    color: "#fff", fontWeight: 900, fontSize: 15, cursor: "pointer",
    boxShadow: "0 4px 14px rgba(15,118,110,0.3)",
  },
  infoBox: {
    marginTop: 20, padding: 14, background: "#f0fdfa",
    border: "1px solid rgba(15,118,110,0.2)", borderRadius: 12,
  },
  infoTitle: { fontWeight: 900, color: "#0f766e", fontSize: 13, marginBottom: 6 },
  infoText: { fontSize: 12, color: "#475569", lineHeight: 1.6 },
  backWrap: { marginTop: 16, textAlign: "center" },
  backBtn: {
    background: "none", border: "none", color: "#0f766e",
    fontWeight: 700, cursor: "pointer", fontSize: 13,
  },
};
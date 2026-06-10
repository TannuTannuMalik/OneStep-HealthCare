import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../utils/api";
import { connectSocket } from "../utils/socket";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // default empty
  const [role, setRole] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const goDashboard = (backendRole) => {
    if (backendRole === "DOCTOR") {
      navigate("/doctor");
    }

    else if (backendRole === "PHARMACIST") {
      navigate("/pharmacy");
    }

    else if (backendRole === "ADMIN") {
      navigate("/admin");
    }

    else {
      navigate("/patient");
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      if (res.data.ok) {
        localStorage.setItem("token", res.data.token);

        localStorage.setItem(
          "user",
          JSON.stringify(res.data.user)
        );

        connectSocket();

        goDashboard(res.data.user.role);
      } else {
        setError(res.data.error || "Login failed");
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <Navbar />

      <main style={styles.main}>
        {/* LEFT SIDE */}
        <section style={styles.left}>
          <div style={styles.tag}>
            Secure Healthcare Access
          </div>

          <h1 style={styles.title}>
            Welcome Back to OneStep HealthCare
          </h1>

          <p style={styles.desc}>
            Access appointments, blockchain prescriptions,
            reports, video consultations, and secure
            healthcare management in one platform.
          </p>

          <div style={styles.points}>
            <div style={styles.point}>✅ Secure Login</div>
            <div style={styles.point}>✅ Blockchain Verification</div>
            <div style={styles.point}>✅ Online Consultation</div>
            <div style={styles.point}>✅ Medical Reports</div>
          </div>
        </section>

        {/* RIGHT SIDE */}
        <section style={styles.card}>
          <div style={styles.cardTop}>
            <div style={styles.loginIcon}>
              🔐
            </div>

            <h2 style={styles.heading}>
              Login
            </h2>

            <p style={styles.sub}>
              Login using your registered account
            </p>
          </div>

          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}

          <form
            onSubmit={onSubmit}
            style={styles.form}
          >
            {/* Role */}
            <div>
              <label style={styles.label}>
                Select Role
              </label>

              <select
                value={role}
                onChange={(e) =>
                  setRole(e.target.value)
                }
                style={styles.input}
              >
                <option value="">
                  Choose role
                </option>

                <option value="patient">
                  Patient
                </option>

                <option value="doctor">
                  Doctor
                </option>

                <option value="admin">
                  Admin
                </option>

                <option value="pharmacist">
                  Pharmacist
                </option>
              </select>
            </div>

            {/* Email */}
            <div>
              <label style={styles.label}>
                Email Address
              </label>

              <input
                style={styles.input}
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label style={styles.label}>
                Password
              </label>

              <input
                style={styles.input}
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                type="password"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              style={styles.btn}
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Logging in..."
                : "Login Securely"}
            </button>
          </form>

          <p style={styles.bottom}>
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              style={styles.link}
            >
              Create Account
            </Link>
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg,#f5fffd 0%, #f8fafc 100%)",
  },

  main: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "60px 20px",
    display: "grid",
    gridTemplateColumns: "1fr 460px",
    gap: "50px",
    alignItems: "center",
  },

  left: {
    paddingRight: "20px",
  },

  tag: {
    display: "inline-block",
    background: "rgba(15,127,124,0.12)",
    color: "#0f766e",
    padding: "10px 16px",
    borderRadius: "999px",
    fontWeight: "800",
    fontSize: "14px",
    marginBottom: "20px",
  },

  title: {
    fontSize: "58px",
    lineHeight: "1.1",
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: "22px",
  },

  desc: {
    color: "#475569",
    fontSize: "18px",
    lineHeight: "1.8",
    marginBottom: "28px",
    maxWidth: "650px",
  },

  points: {
    display: "grid",
    gap: "14px",
  },

  point: {
    background: "#fff",
    borderRadius: "16px",
    padding: "16px",
    fontWeight: "700",
    border: "1px solid rgba(0,0,0,0.05)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
  },

  card: {
    background: "#fff",
    borderRadius: "28px",
    padding: "38px",
    border: "1px solid rgba(0,0,0,0.06)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
  },

  cardTop: {
    textAlign: "center",
    marginBottom: "24px",
  },

  loginIcon: {
    width: "74px",
    height: "74px",
    margin: "0 auto 16px",
    borderRadius: "50%",
    background:
      "linear-gradient(135deg,#0f766e,#14b8a6)",
    display: "grid",
    placeItems: "center",
    fontSize: "32px",
  },

  heading: {
    fontSize: "38px",
    marginBottom: "10px",
    color: "#0f172a",
  },

  sub: {
    color: "#64748b",
    fontSize: "16px",
  },

  error: {
    background: "#fee2e2",
    color: "#b91c1c",
    padding: "14px",
    borderRadius: "14px",
    marginBottom: "20px",
    fontWeight: "700",
  },

  form: {
    display: "grid",
    gap: "18px",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "800",
    color: "#0f172a",
    fontSize: "14px",
  },

  input: {
    width: "100%",
    padding: "16px",
    borderRadius: "16px",
    border: "1px solid #dbe2ea",
    fontSize: "15px",
    background: "#f8fafc",
    outline: "none",
    boxSizing: "border-box",
  },

  btn: {
    marginTop: "10px",
    width: "100%",
    padding: "18px",
    borderRadius: "18px",
    border: "none",
    background:
      "linear-gradient(135deg,#0f766e,#14b8a6)",
    color: "#fff",
    fontWeight: "900",
    fontSize: "17px",
    cursor: "pointer",
    boxShadow:
      "0 14px 30px rgba(15,118,110,0.25)",
  },

  bottom: {
    marginTop: "24px",
    textAlign: "center",
    color: "#475569",
    fontSize: "15px",
  },

  link: {
    color: "#0f766e",
    fontWeight: "800",
    textDecoration: "none",
  },
};
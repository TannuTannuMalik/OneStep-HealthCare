import { Link, NavLink, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  let user = null;
  let token = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
    token = localStorage.getItem("token");
  } catch {
    user = null;
    token = null;
  }

  const isLoggedIn = !!user && !!token;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
    window.location.reload();
  };

  return (
    <header style={styles.header}>
      <div style={styles.left}>
        <Link to="/" style={styles.brand}>
          <span style={styles.logo}>🩺</span>
          <span style={styles.brandText}>OneStep HealthCare</span>
        </Link>

        <nav style={styles.nav}>
          <NavItem to="/">Home</NavItem>
          <NavItem to="/services">Services</NavItem>
          <NavItem to="/contact">Contact Us</NavItem>
          <NavItem to="/find-doctor">Find a Doctor</NavItem>

          <button
            onClick={() => window.dispatchEvent(new Event("open-health-chat"))}
            style={styles.assistantBtn}
          >
            ✨ Health Assistant
          </button>

          {isLoggedIn && user?.role === "PATIENT" && (
            <>
              <NavItem to="/patient">Dashboard</NavItem>
              <NavItem to="/appointments">Appointments</NavItem>
              <NavItem to="/reports">Reports</NavItem>
            </>
          )}

          {isLoggedIn && user?.role === "DOCTOR" && (
            <NavItem to="/doctor">Doctor Panel</NavItem>
          )}

          {isLoggedIn && user?.role === "ADMIN" && (
            <NavItem to="/admin">Admin Panel</NavItem>
          )}

          {isLoggedIn && user?.role === "PHARMACIST" && (
            <>
              <NavItem to="/pharmacy">Pharmacy</NavItem>
              <NavItem to="/pharmacy/history">History</NavItem>
            </>
          )}
        </nav>
      </div>

      <div style={styles.right}>
        {!isLoggedIn ? (
          <>
            <NavLink to="/login" style={styles.loginBtn}>Login</NavLink>
            <NavLink to="/register" style={styles.signupBtn}>Sign Up</NavLink>
          </>
        ) : (
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        )}
      </div>
    </header>
  );
}

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        ...styles.link,
        ...(isActive ? styles.activeLink : {}),
      })}
    >
      {children}
    </NavLink>
  );
}

const styles = {
  header: { position: "sticky", top: 0, zIndex: 999, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(0,0,0,0.06)", padding: "14px 34px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 8px 24px rgba(0,0,0,0.04)" },
  left: { display: "flex", alignItems: "center", gap: 28 },
  brand: { display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "#0f7f7c", fontWeight: 900 },
  logo: { fontSize: 30 },
  brandText: { fontSize: 24, fontWeight: "900", letterSpacing: "-0.5px" },
  nav: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  link: { textDecoration: "none", color: "#0f172a", fontWeight: "700", fontSize: 14, padding: "10px 14px", borderRadius: 12, transition: "0.2s ease" },
  activeLink: { background: "rgba(15,127,124,0.12)", color: "#0f7f7c" },
  assistantBtn: { border: "none", background: "linear-gradient(135deg,#0f766e,#14b8a6)", color: "#fff", padding: "10px 18px", borderRadius: "999px", fontWeight: "900", cursor: "pointer", fontSize: "13px", boxShadow: "0 10px 24px rgba(20,184,166,0.25)" },
  right: { display: "flex", alignItems: "center", gap: 12 },
  loginBtn: { textDecoration: "none", padding: "10px 16px", borderRadius: 14, border: "1px solid rgba(0,0,0,0.12)", color: "#0f172a", fontWeight: "800", fontSize: 14, background: "#fff" },
  signupBtn: { textDecoration: "none", padding: "10px 18px", borderRadius: 14, background: "linear-gradient(135deg,#0f766e,#14b8a6)", color: "#fff", fontWeight: "900", fontSize: 14, boxShadow: "0 10px 24px rgba(20,184,166,0.25)" },
  logoutBtn: { padding: "10px 18px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", fontWeight: "900", fontSize: 14, cursor: "pointer", boxShadow: "0 10px 24px rgba(239,68,68,0.22)" },
};
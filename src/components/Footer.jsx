import { Link, NavLink } from "react-router-dom";

export default function Navbar() {
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
        </nav>
      </div>

      <div style={styles.right}>
        <NavLink to="/login" style={styles.loginBtn}>
          Login
        </NavLink>
        <NavLink to="/register" style={styles.signupBtn}>
          Sign Up
        </NavLink>
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
  header: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    background: "#ffffff",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
    padding: "12px 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: { display: "flex", alignItems: "center", gap: 18 },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    textDecoration: "none",
    color: "#0f7f7c",
    fontWeight: 900,
  },
  logo: { fontSize: 22 },
  brandText: { fontSize: 15 },
  nav: { display: "flex", alignItems: "center", gap: 14 },
  link: {
    textDecoration: "none",
    color: "#222",
    fontWeight: 600,
    fontSize: 13,
    padding: "8px 10px",
    borderRadius: 10,
  },
  activeLink: {
    background: "rgba(15,127,124,0.12)",
    color: "#0f7f7c",
  },
  right: { display: "flex", alignItems: "center", gap: 10 },
  loginBtn: {
    textDecoration: "none",
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.15)",
    color: "#222",
    fontWeight: 800,
    fontSize: 13,
  },
  signupBtn: {
    textDecoration: "none",
    padding: "8px 12px",
    borderRadius: 10,
    background: "#0f7f7c",
    color: "#fff",
    fontWeight: 900,
    fontSize: 13,
  },
};
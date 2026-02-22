import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header style={styles.header}>
      <div style={styles.brand}>
        <span style={styles.logo}>🏥</span>
        <span style={styles.title}>OneStep HealthCare</span>
      </div>

      <nav style={styles.nav}>
        <Link style={styles.link} to="/">Home</Link>
        <Link style={styles.link} to="/about">About</Link>
        <Link style={styles.link} to="/login">Login</Link>
        <Link style={styles.btn} to="/register">Register</Link>
      </nav>
    </header>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 18px",
    borderBottom: "1px solid #e8e8e8",
  },
  brand: { display: "flex", alignItems: "center", gap: 10 },
  logo: { fontSize: 22 },
  title: { fontWeight: 700, fontSize: 16 },
  nav: { display: "flex", alignItems: "center", gap: 14 },
  link: { textDecoration: "none", color: "#222", fontWeight: 500 },
  btn: {
    textDecoration: "none",
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #222",
    color: "#222",
    fontWeight: 600,
  },
};
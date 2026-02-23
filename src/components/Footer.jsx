import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        {/* Brand */}
        <div style={styles.brand}>
          <div style={styles.logo}>🏥 OneStep HealthCare</div>
          <p style={styles.text}>
            Academic MVP for booking appointments and doctor matching (not medical advice).
          </p>
        </div>

        {/* Columns */}
        <div style={styles.cols}>
          <div>
            <h4 style={styles.h4}>Product</h4>
            <Link style={styles.link} to="/find-doctor">Find a Doctor</Link>
          <Link style={styles.link} to="/appointments">Appointments</Link>
<Link style={styles.link} to="/reports">Reports</Link>
          </div>

          <div>
            <h4 style={styles.h4}>Company</h4>
            <Link style={styles.link} to="/about">About</Link>
            <Link style={styles.link} to="/contact">Contact</Link>
            <Link style={styles.link} to="/services">Services</Link>
          </div>

          <div>
            <h4 style={styles.h4}>Support</h4>
            <Link style={styles.link} to="/contact">Help</Link>
            <Link style={styles.link} to="/privacy">Privacy</Link>
            <Link style={styles.link} to="/terms">Terms</Link>
          </div>
        </div>
      </div>

      <div style={styles.bottom}>
        <span>© {new Date().getFullYear()} OneStep HealthCare</span>
        <span style={{ opacity: 0.8 }}>Studio 5 MVP</span>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    width: "100%",
    background: "#0f7f7c",
    color: "white",
    padding: "30px 0",
    marginTop: 40,
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 20px",
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr",
    gap: 24,
    alignItems: "start",
  },
  brand: {},
  logo: { fontWeight: 900, fontSize: 18, marginBottom: 8 },
  text: { margin: 0, opacity: 0.9, lineHeight: 1.5, maxWidth: 420 },

  cols: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
  },
  h4: { margin: "0 0 10px 0" },

  link: {
    display: "block",
    margin: "8px 0",
    color: "white",
    opacity: 0.9,
    textDecoration: "none",
  },

  bottom: {
    maxWidth: "1200px",
    margin: "18px auto 0",
    padding: "14px 20px 0",
    borderTop: "1px solid rgba(255,255,255,0.25)",
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13,
  },
};
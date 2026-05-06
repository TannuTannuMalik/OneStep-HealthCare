import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PharmacyDashboard() {
  const [rxId, setRxId] = useState("");
  const [verified, setVerified] = useState(false);

  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  const handleVerify = () => {
    if (!rxId.trim()) {
      alert("Please enter Prescription ID");
      return;
    }

    // TEMPORARY DEMO VERIFICATION
    // Later this becomes backend + blockchain verification
    setVerified(true);
  };

  return (
    <div style={styles.page}>
      {/* TOP NAVBAR */}
      <div style={styles.topbar}>
        <div>
          <h1 style={styles.logo}>
            OneStep HealthCare
          </h1>

          <p style={styles.role}>
            Pharmacist Portal
          </p>
        </div>

        <button
          onClick={logout}
          style={styles.logoutBtn}
        >
          Logout
        </button>
      </div>

      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>
          Pharmacy Dashboard
        </h1>

        <p style={styles.subtitle}>
          Verify blockchain prescriptions and
          manage medicine dispensing securely
        </p>
      </div>

      {/* MAIN GRID */}
      <div style={styles.grid}>
        {/* LEFT PANEL */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            Verify Prescription
          </h2>

          <input
            value={rxId}
            onChange={(e) =>
              setRxId(e.target.value)
            }
            placeholder="Enter Prescription ID"
            style={styles.input}
          />

          <button
            style={styles.button}
            onClick={handleVerify}
          >
            Verify Prescription
          </button>

          {/* Blockchain Status */}
          <div style={styles.statusBox}>
            {verified ? (
              <span style={styles.statusBadge}>
                Blockchain Verified
              </span>
            ) : (
              <span style={styles.pendingBadge}>
                Waiting Verification
              </span>
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            Prescription Details
          </h2>

          {!verified ? (
            <div style={styles.emptyState}>
              <h3>No Prescription Selected</h3>

              <p>
                Search for a prescription ID to
                verify blockchain authenticity
                and dispensing status.
              </p>
            </div>
          ) : (
            <div>
              <div style={styles.detailRow}>
                <strong>Prescription ID</strong>
                <span>{rxId}</span>
              </div>

              <div style={styles.detailRow}>
                <strong>Blockchain Status</strong>
                <span style={{ color: "#16a34a" }}>
                  Verified
                </span>
              </div>

              <div style={styles.detailRow}>
                <strong>Dispensing Status</strong>
                <span>Pending</span>
              </div>

              <button style={styles.dispenseBtn}>
                Mark As Dispensed
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <div>
          © 2026 OneStep HealthCare —
          Blockchain Prescription System
        </div>

        <div style={styles.footerLinks}>
          <span>Privacy</span>
          <span>Support</span>
          <span>Security</span>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(to bottom right, #eef7f6, #f8fbff)",
    padding: "40px",
    fontFamily: "Segoe UI",
  },

  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "50px",
    padding: "20px 30px",
    background: "rgba(255,255,255,0.7)",
    backdropFilter: "blur(12px)",
    borderRadius: "24px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.05)",
  },

  logo: {
    fontSize: "32px",
    color: "#0f766e",
    fontWeight: "800",
    margin: 0,
    letterSpacing: "-1px",
  },

  role: {
    marginTop: "4px",
    color: "#64748b",
    fontSize: "15px",
  },

  logoutBtn: {
    padding: "14px 24px",
    borderRadius: "14px",
    border: "none",
    background:
      "linear-gradient(to right, #dc2626, #ef4444)",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "15px",
    boxShadow: "0 6px 18px rgba(220,38,38,0.2)",
  },

  header: {
    marginBottom: "40px",
  },

  title: {
    fontSize: "68px",
    color: "#0f766e",
    marginBottom: "12px",
    fontWeight: "900",
    letterSpacing: "-2px",
    lineHeight: 1,
  },

  subtitle: {
    color: "#475569",
    fontSize: "20px",
    maxWidth: "700px",
    lineHeight: 1.7,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "28px",
  },

  card: {
    background: "rgba(255,255,255,0.8)",
    backdropFilter: "blur(10px)",
    borderRadius: "28px",
    padding: "36px",
    boxShadow: "0 12px 40px rgba(0,0,0,0.06)",
    border: "1px solid rgba(255,255,255,0.5)",
  },

  cardTitle: {
    marginBottom: "24px",
    color: "#0f172a",
    fontSize: "28px",
    fontWeight: "800",
  },

  input: {
    width: "100%",
    padding: "18px",
    borderRadius: "18px",
    border: "1px solid #dbe4ee",
    marginBottom: "18px",
    fontSize: "16px",
    boxSizing: "border-box",
    background: "#fff",
    outline: "none",
  },

  button: {
    width: "100%",
    padding: "18px",
    borderRadius: "18px",
    border: "none",
    background:
      "linear-gradient(to right, #0f766e, #14b8a6)",
    color: "#fff",
    fontWeight: "800",
    fontSize: "17px",
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(15,118,110,0.2)",
  },

  statusBox: {
    marginTop: "24px",
  },

  statusBadge: {
    background: "#dcfce7",
    color: "#166534",
    padding: "12px 18px",
    borderRadius: "999px",
    fontWeight: "700",
    display: "inline-block",
    fontSize: "14px",
  },

  pendingBadge: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "12px 18px",
    borderRadius: "999px",
    fontWeight: "700",
    display: "inline-block",
    fontSize: "14px",
  },

  emptyState: {
    marginTop: "40px",
    padding: "60px 30px",
    textAlign: "center",
    borderRadius: "22px",
    background:
      "linear-gradient(to bottom right, #f8fafc, #eef7ff)",
    color: "#475569",
  },

  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "18px 0",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "16px",
  },

  dispenseBtn: {
    width: "100%",
    marginTop: "28px",
    padding: "18px",
    borderRadius: "18px",
    border: "none",
    background:
      "linear-gradient(to right, #2563eb, #3b82f6)",
    color: "#fff",
    fontWeight: "800",
    fontSize: "16px",
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(37,99,235,0.2)",
  },

  footer: {
    marginTop: "70px",
    paddingTop: "30px",
    borderTop: "1px solid #dbe4ee",
    display: "flex",
    justifyContent: "space-between",
    color: "#64748b",
    fontSize: "14px",
  },

  footerLinks: {
    display: "flex",
    gap: "24px",
    fontWeight: "600",
  },
};
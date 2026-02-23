import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";

export default function PatientDashboard() {
  // Dummy MVP data (later replace with API + MySQL)
  const upcomingAppointments = [
    {
      id: 1,
      doctor: "Dr. Asha Patel",
      specialty: "General Practice",
      date: "25 Feb 2026",
      time: "10:30 AM",
      type: "Video",
      status: "Confirmed",
    },
  ];

  const recentReports = [
    {
      id: "RPT-12345",
      doctor: "Dr. Noah Singh",
      date: "10 Feb 2026",
      verified: true,
    },
    {
      id: "RPT-12346",
      doctor: "Dr. Emma Wilson",
      date: "05 Feb 2026",
      verified: true,
    },
  ];

  return (
    <div>
      <Navbar />

      <main style={styles.page}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={{ margin: 0 }}>Patient Dashboard</h1>
            <p style={styles.sub}>
              Manage your appointments, view reports, and book a doctor (MVP UI).
            </p>
          </div>

          <Link to="/find-doctor" style={styles.primaryBtn}>
            + Book New Appointment
          </Link>
        </div>

        {/* Quick Cards */}
        <section style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Upcoming Appointments</div>
            <div style={styles.statValue}>{upcomingAppointments.length}</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>Reports Available</div>
            <div style={styles.statValue}>{recentReports.length}</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>Account Status</div>
            <div style={styles.statValueSmall}>Active</div>
          </div>
        </section>

        {/* Appointments */}
        <section style={styles.card}>
          <div style={styles.cardTitle}>
            <h2 style={{ margin: 0 }}>Appointments</h2>
            <Link to="/appointments" style={styles.linkBtn}>
              View All
            </Link>
          </div>

          {upcomingAppointments.length === 0 ? (
            <p style={styles.empty}>No upcoming appointments.</p>
          ) : (
            upcomingAppointments.map((a) => (
              <div key={a.id} style={styles.rowCard}>
                <div style={styles.left}>
                  <div style={styles.rowMain}>
                    <b>{a.doctor}</b> <span style={styles.dot}>•</span>{" "}
                    <span style={styles.muted}>{a.specialty}</span>
                  </div>
                  <div style={styles.muted}>
                    {a.date} • {a.time} • {a.type}
                  </div>
                </div>

                <div style={styles.right}>
                  <span style={styles.badge}>{a.status}</span>
                  <button style={styles.outlineBtn} onClick={() => alert("Join meeting (demo)")}>
                    Join
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        {/* Reports */}
        <section style={styles.card}>
          <div style={styles.cardTitle}>
            <h2 style={{ margin: 0 }}>Reports</h2>
            <Link to="/reports" style={styles.linkBtn}>
              View All
            </Link>
          </div>

          {recentReports.length === 0 ? (
            <p style={styles.empty}>No reports yet.</p>
          ) : (
            recentReports.map((r) => (
              <div key={r.id} style={styles.rowCard}>
                <div style={styles.left}>
                  <div style={styles.rowMain}>
                    <b>{r.id}</b> <span style={styles.dot}>•</span>{" "}
                    <span style={styles.muted}>{r.doctor}</span>
                  </div>
                  <div style={styles.muted}>Date: {r.date}</div>
                </div>

                <div style={styles.right}>
                  <span style={r.verified ? styles.verified : styles.notVerified}>
                    {r.verified ? "Verified ✅" : "Not verified ❌"}
                  </span>
                  <button style={styles.outlineBtn} onClick={() => alert("Download PDF (demo)")}>
                    Download PDF
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        {/* Notes */}
        <div style={styles.note}>
          <b>Reminder:</b> This platform provides guidance only and does not give medical diagnosis.
        </div>
      </main>

      <Footer />
    </div>
  );
}

const styles = {
  page: { maxWidth: 1100, margin: "0 auto", padding: 24 },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  sub: { marginTop: 6, opacity: 0.8 },

  primaryBtn: {
    textDecoration: "none",
    background: "#0f7f7c",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 10,
    fontWeight: 900,
  },

  statsGrid: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },
  statCard: {
    background: "#fff",
    border: "1px solid #eee",
    borderRadius: 14,
    padding: 16,
  },
  statLabel: { fontSize: 12, opacity: 0.75, fontWeight: 900, marginBottom: 6 },
  statValue: { fontSize: 34, fontWeight: 900, color: "#0f7f7c" },
  statValueSmall: { fontSize: 18, fontWeight: 900, color: "#0f7f7c" },

  card: {
    marginTop: 16,
    background: "#fff",
    border: "1px solid #eee",
    borderRadius: 14,
    padding: 16,
  },
  cardTitle: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  linkBtn: {
    textDecoration: "none",
    color: "#0f7f7c",
    fontWeight: 900,
  },

  rowCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.06)",
    marginTop: 10,
    flexWrap: "wrap",
  },
  left: { minWidth: 260 },
  right: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
  rowMain: { fontSize: 14 },
  muted: { opacity: 0.75, fontSize: 13 },
  dot: { margin: "0 6px", opacity: 0.5 },

  badge: {
    background: "#eef7f7",
    color: "#0f7f7c",
    fontWeight: 900,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(15,127,124,0.25)",
    fontSize: 12,
  },

  outlineBtn: {
    border: "1px solid #0f7f7c",
    background: "#fff",
    color: "#0f7f7c",
    borderRadius: 10,
    padding: "8px 12px",
    fontWeight: 900,
    cursor: "pointer",
  },

  verified: {
    fontSize: 12,
    fontWeight: 900,
    color: "#1b7a3c",
    background: "#dff7e6",
    padding: "6px 10px",
    borderRadius: 999,
  },
  notVerified: {
    fontSize: 12,
    fontWeight: 900,
    color: "#9c2a2a",
    background: "#ffe3e3",
    padding: "6px 10px",
    borderRadius: 999,
  },

  empty: { opacity: 0.75 },

  note: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    background: "#fff7e6",
    border: "1px solid rgba(255, 153, 0, 0.35)",
    lineHeight: 1.5,
  },
};
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function AdminDashboard() {
  const items = [
    { label: "Dashboard", to: "/admin" },
    { label: "Users", to: "/admin" },
    { label: "Doctors", to: "/admin" },
    { label: "Appointments", to: "/admin" },
    { label: "Analytics", to: "/admin" },
  ];

  return (
    <div>
      <Navbar />
      <div style={styles.wrap}>
        <Sidebar items={items} />

        <main style={styles.main}>
          <h2>Admin Dashboard</h2>
          <p style={styles.sub}>UI only (dummy data)</p>

          <div style={styles.stats}>
            <div style={styles.statCard}><h3>Users</h3><p>120</p></div>
            <div style={styles.statCard}><h3>Doctors</h3><p>35</p></div>
            <div style={styles.statCard}><h3>Appointments</h3><p>58</p></div>
          </div>

          <div style={styles.card}>
            <h3>Recent Activity</h3>
            <ul>
              <li>New doctor registered (dummy)</li>
              <li>Appointment booked (dummy)</li>
              <li>Report generated (dummy)</li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
}

const styles = {
  wrap: { display: "flex" },
  main: { padding: 18, flex: 1 },
  sub: { color: "#555" },
  stats: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
  },
  statCard: {
    border: "1px solid #e8e8e8",
    borderRadius: 14,
    padding: 16,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  card: { marginTop: 14, border: "1px solid #e8e8e8", borderRadius: 14, padding: 16 },
};
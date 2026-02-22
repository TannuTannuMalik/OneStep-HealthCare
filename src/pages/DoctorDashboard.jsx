import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function DoctorDashboard() {
  const items = [
    { label: "Dashboard", to: "/doctor" },
    { label: "Appointments", to: "/doctor" },
    { label: "Availability", to: "/doctor" },
    { label: "Reports", to: "/doctor" },
  ];

  return (
    <div>
      <Navbar />
      <div style={styles.wrap}>
        <Sidebar items={items} />

        <main style={styles.main}>
          <h2>Doctor Dashboard</h2>
          <p style={styles.sub}>UI only (dummy data)</p>

          <div style={styles.grid}>
            <div style={styles.card}>
              <h3>Today’s Appointments</h3>
              <ul>
                <li>10:00 AM — Patient: John (General)</li>
                <li>02:30 PM — Patient: Asha (Skin)</li>
              </ul>
            </div>

            <div style={styles.card}>
              <h3>Quick Actions</h3>
              <ul>
                <li>Update availability (coming)</li>
                <li>View symptom summaries (coming)</li>
                <li>Generate report (coming)</li>
              </ul>
            </div>
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
  grid: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 14,
  },
  card: { border: "1px solid #e8e8e8", borderRadius: 14, padding: 16 },
};
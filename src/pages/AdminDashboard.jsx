import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useEffect } from "react";
import { socket } from "../utils/socket";

export default function AdminDashboard() {
  // ✅ get admin user from localStorage (same style as DoctorDashboard)
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    if (!user?.id) return;

    // ✅ Admin can join too (optional)
    socket.emit("join", { userId: user.id });

    // ✅ Admin can listen to global updates if you emit them
    socket.on("appointment_status", (payload) => {
      console.log("appointment_status:", payload);
    });

    socket.on("report_ready", (payload) => {
      console.log("report_ready:", payload);
    });

    return () => {
      socket.off("appointment_status");
      socket.off("report_ready");
    };
  }, [user?.id]);

  const items = [
    { label: "Dashboard", to: "/admin" },
    { label: "Users", to: "/admin/users" },
    { label: "Doctors", to: "/admin/doctors" },
    { label: "Appointments", to: "/admin/appointments" },
    { label: "Analytics", to: "/admin/analytics" },
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
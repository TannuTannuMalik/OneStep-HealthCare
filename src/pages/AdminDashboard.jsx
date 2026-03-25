import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useEffect, useState } from "react";
import { socket } from "../utils/socket";
import { api } from "../utils/api";

export default function AdminDashboard() {
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [error, setError] = useState("");

  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true);
      setError("");

      const res = await api.get("/doctors");

      if (res.data?.ok) {
        setDoctors(res.data.doctors || []);
      } else if (Array.isArray(res.data)) {
        setDoctors(res.data);
      } else {
        setDoctors([]);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load doctors");
    } finally {
      setLoadingDoctors(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    socket.emit("join", { userId: user.id });

    socket.on("appointment_status", (payload) => {
      console.log("appointment_status:", payload);
    });

    socket.on("report_ready", (payload) => {
      console.log("report_ready:", payload);
    });

    fetchDoctors();

    return () => {
      socket.off("appointment_status");
      socket.off("report_ready");
    };
  }, [user?.id]);

  const items = [{ label: "Dashboard", to: "/admin" }];

  return (
    <div>
      <Navbar />
      <div style={styles.wrap}>
        <Sidebar items={items} />

        <main style={styles.main}>
          <h2>Admin Dashboard</h2>
          <p style={styles.sub}>Welcome {user?.fullName || "Admin"}</p>

          <div style={styles.stats}>
            <div style={styles.statCard}>
              <h3>Total Doctors</h3>
              <p>{doctors.length}</p>
            </div>

            <div style={styles.statCard}>
              <h3>Active Doctors</h3>
              <p>
                {
                  doctors.filter(
                    (d) => d.isActive === 1 || d.isActive === true
                  ).length
                }
              </p>
            </div>

            <div style={styles.statCard}>
              <h3>Top Rated</h3>
              <p>
                {doctors.length
                  ? Math.max(...doctors.map((d) => Number(d.rating || 0)))
                  : 0}
              </p>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3>Doctors List</h3>
              <button onClick={fetchDoctors} style={styles.refreshBtn}>
                Refresh
              </button>
            </div>

            {loadingDoctors ? (
              <p>Loading doctors...</p>
            ) : error ? (
              <p style={{ color: "red" }}>{error}</p>
            ) : doctors.length === 0 ? (
              <p>No doctors found.</p>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Name</th>
                      <th style={styles.th}>Email</th>
                      <th style={styles.th}>Specialty</th>
                      <th style={styles.th}>Experience</th>
                      <th style={styles.th}>Rating</th>
                      <th style={styles.th}>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map((doctor) => (
                      <tr key={doctor.id}>
                        <td style={styles.td}>
                          {doctor.fullName || doctor.name || "N/A"}
                        </td>
                        <td style={styles.td}>{doctor.email || "N/A"}</td>
                        <td style={styles.td}>{doctor.specialty || "N/A"}</td>
                        <td style={styles.td}>
                          {doctor.experienceYears ??
                            doctor.experience ??
                            "N/A"}
                        </td>
                        <td style={styles.td}>{doctor.rating ?? "N/A"}</td>
                        <td style={styles.td}>{doctor.location || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    display: "flex",
  },
  main: {
    padding: 18,
    flex: 1,
  },
  sub: {
    color: "#555",
  },
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
  card: {
    marginTop: 14,
    border: "1px solid #e8e8e8",
    borderRadius: 14,
    padding: 16,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  refreshBtn: {
    padding: "8px 14px",
    borderRadius: 10,
    border: "none",
    background: "#222",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: 12,
    borderBottom: "1px solid #ddd",
    background: "#f8f8f8",
  },
  td: {
    padding: 12,
    borderBottom: "1px solid #eee",
  },
};
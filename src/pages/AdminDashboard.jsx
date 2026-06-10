import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useEffect, useState } from "react";
import { api } from "../utils/api";

export default function AdminDashboard() {
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); }
    catch { return null; }
  })();

  const [stats, setStats] = useState({ users: "—", doctors: "—", appointments: "—", reports: "—" });
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch doctors list (public endpoint)
        const drRes = await api.get("/doctors");
        const drList = drRes.data.doctors || [];
        setDoctors(drList);

        // Fetch appointments for total count (admin uses doctor endpoint for counts)
        const apptRes = await api.get("/appointments/doctor/me").catch(() => ({ data: { data: [] } }));
        const apptList = apptRes.data.data || [];

        setStats({
          users: "—",
          doctors: drList.length,
          appointments: apptList.length,
          reports: "—",
        });
      } catch {
        // silently fail — stats remain "—"
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      <Navbar />

      <main style={styles.main}>
        {/* Header */}
        <div style={styles.pageHeader}>
          <div>
            <div style={styles.tag}>Admin Panel</div>
            <h1 style={styles.title}>Admin Dashboard</h1>
            <p style={styles.sub}>Welcome, {user?.fullName || "Admin"}. Platform overview below.</p>
          </div>
        </div>

        {/* Stats */}
        <div style={styles.statsGrid}>
          <StatCard icon="🩺" label="Registered Doctors" value={loading ? "…" : stats.doctors} color="#0f766e" />
          <StatCard icon="📅" label="Appointments" value={loading ? "…" : stats.appointments} color="#2563eb" />
          <StatCard icon="⛓️" label="Blockchain Network" value="Sepolia" color="#7c3aed" />
          <StatCard icon="✅" label="Platform Status" value="Live" color="#16a34a" />
        </div>

        {/* Doctors table */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🩺 Registered Doctors</h2>
          {loading && <p style={styles.muted}>Loading…</p>}
          {!loading && doctors.length === 0 && <p style={styles.muted}>No doctors registered yet.</p>}
          {!loading && doctors.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {["#", "Name", "Specialty", "Experience", "Location"].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((d, i) => (
                    <tr key={d.id} style={{ background: i % 2 === 0 ? "#f9fafb" : "#fff" }}>
                      <td style={styles.td}>{d.id}</td>
                      <td style={styles.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <img
                            src={d.photoUrl || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=60&q=60"}
                            alt={d.fullName}
                            onError={(e) => (e.currentTarget.src = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=60&q=60")}
                            style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
                          />
                          <span style={{ fontWeight: 700 }}>{d.fullName}</span>
                        </div>
                      </td>
                      <td style={styles.td}>{d.specialty || "—"}</td>
                      <td style={styles.td}>{d.experienceYears != null ? `${d.experienceYears} yrs` : "—"}</td>
                      <td style={styles.td}>{d.location || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* System info */}
        <div style={styles.infoBar}>
          <strong>⛓️ Blockchain:</strong> Smart contract deployed at 0x997Ee29Ab4bb58EEd98eFfa5358B7E3e55265323 on Ethereum Sepolia.&nbsp;
          <strong>🌐 Frontend:</strong> Vercel &nbsp;|&nbsp;
          <strong>🖥️ Backend:</strong> Railway &nbsp;|&nbsp;
          <strong>🗄️ DB:</strong> MySQL on Railway
        </div>
      </main>

      <Footer />
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ ...styles.statCard, borderTop: `4px solid ${color}` }}>
      <div style={{ fontSize: 28 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 900, color }}>{value}</div>
        <div style={{ fontSize: 13, color: "#64748b", fontWeight: 700, marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}

const styles = {
  main: { maxWidth: 1200, margin: "0 auto", padding: "28px 20px" },
  pageHeader: { marginBottom: 24 },
  tag: {
    display: "inline-block", background: "rgba(15,118,110,0.1)",
    color: "#0f766e", padding: "8px 16px", borderRadius: 999,
    fontWeight: 900, fontSize: 13, marginBottom: 12,
  },
  title: { fontSize: 38, fontWeight: 900, color: "#0f172a", margin: "0 0 8px 0" },
  sub: { color: "#64748b", fontSize: 15 },
  statsGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16, marginBottom: 24,
  },
  statCard: {
    background: "#fff", borderRadius: 18, padding: "20px 22px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
    display: "flex", gap: 16, alignItems: "center",
  },
  card: {
    background: "#fff", borderRadius: 20, padding: 24,
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)", marginBottom: 20,
  },
  cardTitle: { margin: "0 0 16px 0", fontSize: 20, fontWeight: 900, color: "#0f172a" },
  muted: { color: "#94a3b8", fontSize: 14 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: {
    background: "#0f7f7c", color: "#fff",
    padding: "10px 14px", textAlign: "left",
    fontWeight: 800, fontSize: 13,
  },
  td: { padding: "10px 14px", borderBottom: "1px solid #f0f0f0", verticalAlign: "middle" },
  infoBar: {
    background: "#f0fdf4", border: "1px solid #bbf7d0",
    borderRadius: 12, padding: 14,
    fontSize: 13, color: "#166534", lineHeight: 1.6,
  },
};

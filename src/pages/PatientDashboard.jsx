import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PaymentStatus from "../components/PaymentStatus";
import { api } from "../utils/api";

export default function PatientDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [reports, setReports] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);
  const [apptErr, setApptErr] = useState("");
  const [reportErr, setReportErr] = useState("");

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); }
    catch { return null; }
  }, []);

  useEffect(() => {
    // Fetch appointments
    api.get("/appointments/patient/me")
      .then(res => { if (res.data.ok) setAppointments(res.data.data || []); })
      .catch(e => setApptErr(e.response?.data?.error || "Failed to load appointments"))
      .finally(() => setLoadingAppts(false));

    // Fetch reports
    api.get("/reports/patient/me")
      .then(res => { if (res.data.ok) setReports(res.data.data || []); })
      .catch(e => setReportErr(e.response?.data?.error || "Failed to load reports"))
      .finally(() => setLoadingReports(false));
  }, []);

  const upcoming = appointments.filter(a =>
    ["PENDING", "CONFIRMED"].includes(a.status)
  );
  const recentReports = reports.slice(0, 3);

  const statusColor = {
    PENDING:   { bg: "#fef9c3", text: "#92400e" },
    CONFIRMED: { bg: "#dcfce7", text: "#166534" },
    COMPLETED: { bg: "#dbeafe", text: "#1e40af" },
    CANCELLED: { bg: "#fee2e2", text: "#991b1b" },
  };

  const fmtDate = (val) => {
    if (!val) return "—";
    return new Date(val).toLocaleDateString("en-NZ", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  const fmtDateTime = (val) => {
    if (!val) return "—";
    return new Date(val).toLocaleString("en-NZ", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      <Navbar />

      <main style={styles.main}>

        {/* ── Hero ── */}
        <section style={styles.hero}>
          <div>
            <div style={styles.tag}>Patient Portal</div>
            <h1 style={styles.heroTitle}>
              Welcome,<br />{user?.fullName || "Patient"}
            </h1>
            <p style={styles.heroSub}>
              Manage your appointments, view consultation reports, and
              access your blockchain-verified prescriptions.
            </p>
            <div style={styles.heroActions}>
              <Link to="/find-doctor" style={styles.primaryBtn}>🔍 Find a Doctor</Link>
              <Link to="/appointments" style={styles.outlineBtn}>📅 My Appointments</Link>
              <Link to="/reports" style={styles.outlineBtn}>📄 My Reports</Link>
            </div>
          </div>

          {/* Stats */}
          <div style={styles.statsGrid}>
            <Stat value={appointments.length} label="Total Appointments" />
            <Stat value={upcoming.length} label="Upcoming" />
            <Stat value={reports.length} label="Reports" />
            <Stat
              value={reports.filter(r => r.blockchainTx).length}
              label="Blockchain Verified"
              icon="⛓️"
            />
          </div>
        </section>

        {/* ── Quick Actions ── */}
        <div style={styles.quickRow}>
          {[
            { icon: "🩺", label: "Book Appointment", to: "/find-doctor", color: "#0f766e" },
            { icon: "📅", label: "View Appointments", to: "/appointments", color: "#2563eb" },
            { icon: "📄", label: "View Reports", to: "/reports", color: "#7c3aed" },
          ].map(q => (
            <Link key={q.to} to={q.to} style={{ ...styles.quickCard, borderTop: `4px solid ${q.color}` }}>
              <span style={{ fontSize: 28 }}>{q.icon}</span>
              <span style={{ fontWeight: 800, fontSize: 14, color: "#0f172a" }}>{q.label}</span>
            </Link>
          ))}
        </div>

        <div style={styles.grid}>
          {/* ── Upcoming Appointments ── */}
          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>📅 Upcoming Appointments</h2>
              <Link to="/appointments" style={styles.viewAll}>View all →</Link>
            </div>

            {loadingAppts && <p style={styles.muted}>Loading...</p>}
            {apptErr && <div style={styles.errBox}>❌ {apptErr}</div>}

            {!loadingAppts && !apptErr && upcoming.length === 0 && (
              <div style={styles.empty}>
                <div style={{ fontSize: 40 }}>📅</div>
                <p>No upcoming appointments.</p>
                <Link to="/find-doctor" style={styles.primaryBtn}>Find a Doctor</Link>
              </div>
            )}

            {upcoming.slice(0, 4).map(a => {
              const sc = statusColor[a.status] || { bg: "#f1f5f9", text: "#475569" };
              return (
                <div key={a.id} style={styles.row}>
                  <div style={styles.rowIcon}>🩺</div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.rowTitle}>Dr. {a.doctorName}</div>
                    <div style={styles.rowSub}>{a.specialty}</div>
                    <div style={styles.rowSub}>
                      {fmtDateTime(a.requestedStart)}
                      {a.appointmentType && ` · ${a.appointmentType}`}
                    </div>
                    {a.reason && (
                      <div style={{ ...styles.rowSub, marginTop: 4, fontStyle: "italic" }}>
                        "{a.reason}"
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end" }}>
                    <span style={{ ...styles.badge, background: sc.bg, color: sc.text }}>
                      {a.status}
                    </span>
                    <PaymentStatus status={a.paymentStatus} fee={a.consultationFee} size="xs" />
                  </div>
                </div>
              );
            })}
          </section>

          {/* ── Recent Reports ── */}
          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>📄 Recent Reports</h2>
              <Link to="/reports" style={styles.viewAll}>View all →</Link>
            </div>

            {loadingReports && <p style={styles.muted}>Loading...</p>}
            {reportErr && <div style={styles.errBox}>❌ {reportErr}</div>}

            {!loadingReports && !reportErr && recentReports.length === 0 && (
              <div style={styles.empty}>
                <div style={{ fontSize: 40 }}>📄</div>
                <p>No consultation reports yet.</p>
              </div>
            )}

            {recentReports.map(r => (
              <div key={r.id} style={styles.row}>
                <div style={styles.rowIcon}>📋</div>
                <div style={{ flex: 1 }}>
                  <div style={styles.rowTitle}>Dr. {r.doctorName}</div>
                  <div style={styles.rowSub}>{r.specialty} · {fmtDate(r.createdAt)}</div>
                  {r.diagnosis && (
                    <div style={styles.detailBox}>
                      <span style={styles.detailLabel}>Diagnosis:</span> {r.diagnosis}
                    </div>
                  )}
                  {r.prescription && (
                    <div style={styles.detailBox}>
                      <span style={styles.detailLabel}>💊 Prescription:</span> {r.prescription}
                    </div>
                  )}
                  {r.prescription && r.blockchainTx && (
                    <div style={{ ...styles.detailBox, background: "#f0fdf4", border: "1px solid #bbf7d0", marginTop: 6 }}>
                      <span style={styles.detailLabel}>🏥 Pharmacy Code:</span>{" "}
                      <span style={{ fontFamily: "monospace", fontWeight: 900, color: "#0f766e", letterSpacing: 1 }}>
                        RX-2026-{r.id}
                      </span>
                      <span style={{ color: "#64748b", fontSize: 12, marginLeft: 8 }}>
                        (give this to your pharmacist)
                      </span>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                  {r.blockchainTx && (
                    <span style={styles.chainBadge}>⛓️ Verified</span>
                  )}
                  {r.pdfUrl && (
                    <a
                      href={r.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.downloadBtn}
                    >
                      ⬇ PDF
                    </a>
                  )}
                </div>
              </div>
            ))}
          </section>
        </div>

      </main>
      <Footer />
    </div>
  );
}

function Stat({ value, label, icon }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statValue}>{icon || value}</div>
      {icon && <div style={{ fontSize: 22, fontWeight: 900, color: "#0f766e" }}>{value}</div>}
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

const styles = {
  main: { maxWidth: 1200, margin: "0 auto", padding: "28px 20px" },

  hero: {
    background: "linear-gradient(135deg,#ecfeff,#f0f9ff)",
    borderRadius: 28, padding: "44px 40px",
    display: "grid", gridTemplateColumns: "1fr auto",
    gap: 40, alignItems: "center", marginBottom: 24,
    flexWrap: "wrap",
  },
  tag: {
    display: "inline-block", background: "rgba(15,118,110,0.1)",
    color: "#0f766e", padding: "8px 16px", borderRadius: 999,
    fontWeight: 900, fontSize: 13, marginBottom: 16,
  },
  heroTitle: {
    fontSize: 54, fontWeight: 900, color: "#0f172a",
    margin: "0 0 14px 0", lineHeight: 1.1,
  },
  heroSub: { color: "#475569", fontSize: 16, lineHeight: 1.7, maxWidth: 560, margin: "0 0 24px 0" },
  heroActions: { display: "flex", gap: 12, flexWrap: "wrap" },

  statsGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr",
    gap: 14, minWidth: 280,
  },
  statCard: {
    background: "#fff", borderRadius: 18, padding: "18px 20px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
  },
  statValue: { fontSize: 34, fontWeight: 900, color: "#0f766e", lineHeight: 1 },
  statLabel: { color: "#64748b", fontSize: 12, fontWeight: 700, marginTop: 6 },

  quickRow: {
    display: "grid", gridTemplateColumns: "repeat(3,1fr)",
    gap: 14, marginBottom: 24,
  },
  quickCard: {
    background: "#fff", borderRadius: 16, padding: "20px 18px",
    display: "flex", flexDirection: "column", gap: 10,
    textDecoration: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
    transition: "transform 0.15s",
  },

  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },

  card: {
    background: "#fff", borderRadius: 24, padding: 24,
    boxShadow: "0 8px 30px rgba(0,0,0,0.05)",
    border: "1px solid rgba(0,0,0,0.04)",
  },
  cardHeader: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: 16,
  },
  cardTitle: { margin: 0, fontSize: 18, fontWeight: 900, color: "#0f172a" },
  viewAll: { color: "#0f766e", fontWeight: 800, fontSize: 13, textDecoration: "none" },

  row: {
    display: "flex", gap: 14, alignItems: "flex-start",
    padding: "14px 0", borderBottom: "1px solid #f1f5f9",
  },
  rowIcon: {
    width: 40, height: 40, borderRadius: 12,
    background: "#f0fdf4", display: "flex",
    alignItems: "center", justifyContent: "center",
    fontSize: 18, flexShrink: 0,
  },
  rowTitle: { fontWeight: 800, fontSize: 15, color: "#0f172a" },
  rowSub: { color: "#64748b", fontSize: 13, marginTop: 2 },

  badge: {
    padding: "5px 12px", borderRadius: 999,
    fontWeight: 800, fontSize: 12, whiteSpace: "nowrap",
    alignSelf: "flex-start",
  },

  detailBox: {
    marginTop: 6, fontSize: 13, color: "#334155",
    background: "#f8fafc", padding: "6px 10px",
    borderRadius: 8, lineHeight: 1.5,
  },
  detailLabel: { fontWeight: 800, color: "#0f766e" },

  chainBadge: {
    background: "#dce8ff", color: "#1e3a8a",
    padding: "4px 10px", borderRadius: 999,
    fontWeight: 800, fontSize: 12,
  },
  downloadBtn: {
    background: "#f1f5f9", color: "#0f172a",
    padding: "5px 12px", borderRadius: 8,
    fontWeight: 700, fontSize: 12, textDecoration: "none",
  },

  primaryBtn: {
    background: "linear-gradient(135deg,#0f766e,#14b8a6)",
    color: "#fff", padding: "12px 20px", borderRadius: 14,
    fontWeight: 900, fontSize: 14, textDecoration: "none",
    boxShadow: "0 8px 20px rgba(15,118,110,0.2)",
  },
  outlineBtn: {
    background: "#fff", color: "#0f172a",
    padding: "12px 18px", borderRadius: 14,
    fontWeight: 800, fontSize: 14, textDecoration: "none",
    border: "1px solid #e2e8f0",
  },

  muted: { color: "#94a3b8", fontSize: 14 },
  empty: {
    textAlign: "center", padding: "40px 20px",
    color: "#64748b", display: "flex",
    flexDirection: "column", alignItems: "center", gap: 10,
  },
  errBox: {
    background: "#fee2e2", color: "#991b1b",
    padding: 12, borderRadius: 12, fontWeight: 700, fontSize: 14,
  },
};

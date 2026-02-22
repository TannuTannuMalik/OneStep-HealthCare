import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div>
      <Navbar />

      <main style={styles.main}>
        <section style={styles.hero}>
          <div>
            <h1 style={styles.h1}>
              Providing Quality Healthcare for a Brighter and Healthy Future
            </h1>
            <p style={styles.p}>
              OneStep HealthCare helps patients enter symptoms in simple language,
              then recommends suitable doctors based on availability, experience,
              and ratings.
            </p>

            <div style={styles.actions}>
              <Link to="/find-doctor" style={styles.primaryBtn}>
                Find a Doctor
              </Link>
              <Link to="/register" style={styles.secondaryBtn}>
                Sign Up
              </Link>
            </div>
          </div>

          <div style={styles.heroCard}>
            <div style={styles.heroBadge}>24/7</div>
            <div style={styles.docImg} />
          </div>
        </section>

        <section style={styles.findBar}>
          <div style={styles.findTitle}>Find A Doctor</div>

          <div style={styles.findRow}>
            <input style={styles.input} placeholder="Name" />
            <input style={styles.input} placeholder="Specialty" />

            <label style={styles.toggleWrap}>
              <input type="checkbox" />
              <span>Available</span>
            </label>

            <Link to="/find-doctor" style={styles.searchBtn}>
              Search
            </Link>
          </div>
        </section>

        <section style={styles.stats}>
          <Stat value="99%" label="Customer satisfaction" />
          <Stat value="15k" label="Online Patients" />
          <Stat value="12k" label="Patients Recovered" />
          <Stat value="240%" label="Company growth" />
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>Services we provide</h2>
          <p style={styles.p2}>
            Explore the most common services. (UI-only for now)
          </p>

          <div style={styles.cards}>
            <ServiceCard title="Dental treatments" />
            <ServiceCard title="Cardiology" />
            <ServiceCard title="Surgery" />
            <ServiceCard title="Eye Care" />
            <ServiceCard title="Diagnosis" />
            <ServiceCard title="Bone treatments" />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div style={styles.stat}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function ServiceCard({ title }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardImg} />
      <div style={{ fontWeight: 900, marginTop: 10 }}>{title}</div>
      <div style={styles.cardText}>Short description goes here.</div>
      <div style={styles.cardLink}>Learn more →</div>
    </div>
  );
}

const styles = {
  main: { maxWidth: 1100, margin: "0 auto", padding: "18px" },
  hero: {
    display: "grid",
    gridTemplateColumns: "1.15fr 0.85fr",
    gap: 18,
    alignItems: "center",
    padding: "10px 0 18px",
  },
  h1: { fontSize: 34, margin: 0, lineHeight: 1.15 },
  p: { marginTop: 10, lineHeight: 1.7, maxWidth: 640, color: "#444" },
  actions: { marginTop: 14, display: "flex", gap: 12, flexWrap: "wrap" },
  primaryBtn: {
    textDecoration: "none",
    background: "#0f7f7c",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 12,
    fontWeight: 900,
  },
  secondaryBtn: {
    textDecoration: "none",
    border: "1px solid rgba(0,0,0,0.15)",
    color: "#222",
    padding: "10px 14px",
    borderRadius: 12,
    fontWeight: 900,
  },
  heroCard: {
    background: "rgba(15,127,124,0.12)",
    borderRadius: 22,
    padding: 14,
    position: "relative",
    minHeight: 240,
  },
  heroBadge: {
    position: "absolute",
    right: 14,
    top: 14,
    background: "#fff",
    padding: "6px 10px",
    borderRadius: 999,
    fontWeight: 900,
    border: "1px solid rgba(0,0,0,0.08)",
  },
  docImg: {
    height: 210,
    borderRadius: 18,
    background:
      "url(https://images.unsplash.com/photo-1580281658628-07c6b4fbe2b3?auto=format&fit=crop&w=900&q=60) center/cover",
  },
  findBar: {
    background: "#eef2ff",
    borderRadius: 18,
    padding: 14,
    border: "1px solid rgba(0,0,0,0.06)",
  },
  findTitle: { fontWeight: 900, marginBottom: 10 },
  findRow: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },
  input: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    minWidth: 160,
    outline: "none",
    background: "#fff",
  },
  toggleWrap: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    fontWeight: 800,
    fontSize: 13,
    color: "#333",
  },
  searchBtn: {
    textDecoration: "none",
    background: "#0f7f7c",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 12,
    fontWeight: 900,
  },
  stats: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 12,
  },
  stat: {
    background: "#fff",
    borderRadius: 18,
    padding: 14,
    border: "1px solid rgba(0,0,0,0.06)",
  },
  statValue: { fontWeight: 900, fontSize: 22, color: "#0f7f7c" },
  statLabel: { marginTop: 6, fontSize: 13, color: "#555" },
  section: { marginTop: 18 },
  h2: { margin: "0 0 8px 0" },
  p2: { margin: "0 0 14px 0", color: "#555" },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: 12,
  },
  card: {
    background: "#fff",
    borderRadius: 18,
    padding: 14,
    border: "1px solid rgba(0,0,0,0.06)",
  },
  cardImg: {
    height: 110,
    borderRadius: 14,
    background: "#f3f4f6",
  },
  cardText: { marginTop: 6, fontSize: 13, color: "#555", lineHeight: 1.6 },
  cardLink: { marginTop: 10, fontWeight: 900, color: "#0f7f7c", fontSize: 13 },
};
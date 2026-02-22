import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div>
      <Navbar />

      <main style={styles.main}>
        <section style={styles.hero}>
          <h1 style={styles.h1}>Find the right doctor, faster.</h1>
          <p style={styles.p}>
            OneStep HealthCare helps patients describe symptoms in simple language,
            then connects them with suitable doctors based on availability and experience.
          </p>

          <div style={styles.actions}>
            <Link to="/register" style={styles.primaryBtn}>Get Started</Link>
            <Link to="/login" style={styles.secondaryBtn}>Login</Link>
          </div>
        </section>

        <section style={styles.cards}>
          <div style={styles.card}>
            <h3>Symptom Input</h3>
            <p>Enter symptoms in simple language and get a structured summary.</p>
          </div>
          <div style={styles.card}>
            <h3>Doctor Matching</h3>
            <p>Recommendation engine ranks doctors by match, rating & availability.</p>
          </div>
          <div style={styles.card}>
            <h3>Booking & Reports</h3>
            <p>Book appointments and download consultation reports (PDF).</p>
          </div>
        </section>
      </main>
    </div>
  );
}

const styles = {
  main: { padding: 18, maxWidth: 980, margin: "0 auto" },
  hero: { padding: "28px 0" },
  h1: { fontSize: 36, marginBottom: 10 },
  p: { maxWidth: 720, lineHeight: 1.6, marginBottom: 18 },
  actions: { display: "flex", gap: 12, flexWrap: "wrap" },
  primaryBtn: {
    textDecoration: "none",
    padding: "10px 14px",
    borderRadius: 10,
    background: "#222",
    color: "#fff",
    fontWeight: 700,
  },
  secondaryBtn: {
    textDecoration: "none",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #222",
    color: "#222",
    fontWeight: 700,
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
    marginTop: 12,
  },
  card: {
    border: "1px solid #e8e8e8",
    borderRadius: 14,
    padding: 16,
  },
};
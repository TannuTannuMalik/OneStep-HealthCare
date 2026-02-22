import Navbar from "../components/Navbar";

export default function About() {
  return (
    <div>
      <Navbar />
      <main style={styles.main}>
        <h2>About OneStep HealthCare</h2>
        <p style={styles.p}>
          OneStep HealthCare is a doctor marketplace prototype for Studio 5.
          It helps patients find suitable doctors based on symptoms, book appointments,
          and access consultation reports.
        </p>

        <h3>Core Features</h3>
        <ul style={styles.ul}>
          <li>Role-based access (Patient / Doctor / Admin)</li>
          <li>AI-assisted symptom categorization (hybrid rule-based in MVP)</li>
          <li>Doctor recommendation using weighted scoring</li>
          <li>Booking with real-time updates (Socket.io)</li>
          <li>Consultation report PDFs and verification (planned)</li>
        </ul>

        <p style={styles.note}>
          Note: This is an academic prototype and does not provide medical diagnoses.
        </p>
      </main>
    </div>
  );
}

const styles = {
  main: { padding: 18, maxWidth: 900, margin: "0 auto" },
  p: { lineHeight: 1.6 },
  ul: { lineHeight: 1.8 },
  note: {
    marginTop: 18,
    padding: 12,
    borderRadius: 12,
    border: "1px solid #e8e8e8",
    background: "#fafafa",
  },
};
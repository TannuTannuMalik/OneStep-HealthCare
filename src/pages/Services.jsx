import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Services() {
  const items = [
    {
      title: "AI-assisted Symptom Input",
      desc: "Patients enter symptoms in simple language. The system produces a structured symptom summary to help doctors prepare.",
    },
    {
      title: "Doctor Marketplace & Discovery",
      desc: "Browse doctors by specialty, ratings, and availability. Choose the most suitable provider.",
    },
    {
      title: "Recommendation Engine",
      desc: "Doctors are ranked using weighted scoring: symptom match, rating, availability, and experience (MVP logic).",
    },
    {
      title: "Online Appointment Booking",
      desc: "Book video or in-person appointments with clear time slots and confirmation.",
    },
    {
      title: "Real-time Appointment Updates",
      desc: "Appointment status updates are delivered in real-time using Socket.io (implemented after booking MVP).",
    },
    {
      title: "Consultation PDF Reports",
      desc: "Doctors generate consultation summaries and patients can download PDF reports after completion.",
    },
    {
      title: "Report Integrity Verification",
      desc: "Blockchain verification stores only report hash + timestamp to validate integrity (no health data on-chain).",
    },
  ];

  return (
    <div>
      <Navbar />
      <main style={styles.main}>
        <h1 style={styles.h1}>Services</h1>
        <p style={styles.p}>
          OneStep HealthCare provides a doctor marketplace prototype with symptom-based matching,
          booking, dashboards, and report access.
        </p>

        <div style={styles.grid}>
          {items.map((it) => (
            <div key={it.title} style={styles.card}>
              <h3 style={styles.h3}>{it.title}</h3>
              <p style={styles.cardP}>{it.desc}</p>
            </div>
          ))}
        </div>

        <div style={styles.note}>
          <b>Note:</b> This system is a Studio 5 academic MVP. It supports guidance and workflow,
          but it does not provide medical diagnosis.
        </div>
      </main>
      <Footer />
    </div>
  );
}

const styles = {
  main: { maxWidth: 1050, margin: "0 auto", padding: 24 },
  h1: { marginBottom: 6 },
  p: { opacity: 0.85, maxWidth: 820, lineHeight: 1.6 },
  grid: {
    marginTop: 18,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 14,
  },
  card: {
    background: "#fff",
    border: "1px solid #eee",
    borderRadius: 14,
    padding: 16,
  },
  h3: { marginTop: 0, marginBottom: 8, color: "#0f7f7c" },
  cardP: { margin: 0, lineHeight: 1.55 },
  note: {
    marginTop: 18,
    background: "#f6fbfb",
    border: "1px solid rgba(15,127,124,0.25)",
    padding: 14,
    borderRadius: 14,
    lineHeight: 1.6,
  },
};
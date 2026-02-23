import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Appointments() {
  return (
    <>
      <Navbar />

      <div style={styles.container}>
        <h1>My Appointments</h1>

        <div style={styles.card}>
          <h3>Upcoming Appointment</h3>
          <p><strong>Doctor:</strong> Dr. Vivek</p>
          <p><strong>Date:</strong> 25 Feb 2026</p>
          <p><strong>Type:</strong> Video Consultation</p>
          <button style={styles.btn}>Join Meeting</button>
        </div>

        <div style={styles.card}>
          <h3>Past Appointment</h3>
          <p><strong>Doctor:</strong> Dr. Sharma</p>
          <p><strong>Date:</strong> 10 Feb 2026</p>
          <p><strong>Status:</strong> Completed</p>
        </div>
      </div>

      <Footer />
    </>
  );
}

const styles = {
  container: {
    maxWidth: "1000px",
    margin: "40px auto",
    padding: "20px",
  },
  card: {
    background: "#f9f9f9",
    padding: "20px",
    marginBottom: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  btn: {
    marginTop: "10px",
    padding: "10px 16px",
    background: "#0f7f7c",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};
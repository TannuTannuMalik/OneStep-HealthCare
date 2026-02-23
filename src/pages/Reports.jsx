import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Reports() {
  return (
    <>
      <Navbar />

      <div style={styles.container}>
        <h1>Consultation Reports</h1>

        <div style={styles.card}>
          <h3>Report #12345</h3>
          <p><strong>Doctor:</strong> Dr. Vivek</p>
          <p><strong>Date:</strong> 10 Feb 2026</p>
          <p><strong>Status:</strong> Verified ✅</p>

          <div style={styles.actions}>
            <button style={styles.btn}>View Report</button>
            <button style={styles.btnOutline}>Download PDF</button>
          </div>
        </div>

        <div style={styles.card}>
          <h3>Report #12346</h3>
          <p><strong>Doctor:</strong> Dr. Sharma</p>
          <p><strong>Date:</strong> 05 Feb 2026</p>
          <p><strong>Status:</strong> Verified ✅</p>

          <div style={styles.actions}>
            <button style={styles.btn}>View Report</button>
            <button style={styles.btnOutline}>Download PDF</button>
          </div>
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
  actions: {
    marginTop: "10px",
  },
  btn: {
    marginRight: "10px",
    padding: "10px 16px",
    background: "#0f7f7c",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  btnOutline: {
    padding: "10px 16px",
    background: "white",
    border: "1px solid #0f7f7c",
    color: "#0f7f7c",
    borderRadius: "6px",
    cursor: "pointer",
  },
};
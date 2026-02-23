import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Terms() {
  return (
    <>
      <Navbar />

      <div style={styles.container}>
        <h1>Terms & Conditions</h1>

        <p>
          By using OneStep HealthCare, you agree to the following terms.
        </p>

        <h3>1. Academic Use</h3>
        <p>
          This system is developed as part of an academic project (Studio 5 MVP).
          It is not intended for real-world medical use.
        </p>

        <h3>2. No Medical Advice</h3>
        <p>
          The platform provides guidance only and does not replace professional medical consultation.
        </p>

        <h3>3. User Responsibility</h3>
        <p>
          Users must not rely on the system for real medical decisions.
        </p>

        <h3>4. System Limitations</h3>
        <p>
          Recommendations are based on predefined logic and may not be accurate.
        </p>

        <h3>5. Data Integrity</h3>
        <p>
          Blockchain verification ensures report authenticity but does not store sensitive data.
        </p>
      </div>

      <Footer />
    </>
  );
}

const styles = {
  container: {
    maxWidth: "900px",
    margin: "40px auto",
    padding: "20px",
    lineHeight: "1.6",
  },
};
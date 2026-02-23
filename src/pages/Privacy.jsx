import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Privacy() {
  return (
    <>
      <Navbar />

      <div style={styles.container}>
        <h1>Privacy Policy</h1>

        <p>
          OneStep HealthCare is an academic MVP project designed for educational purposes.
          We respect your privacy and aim to handle data responsibly.
        </p>

        <h3>1. Data Collection</h3>
        <p>
          This platform may collect basic information such as user inputs, symptoms,
          and appointment details for demonstration purposes only.
        </p>

        <h3>2. Data Usage</h3>
        <p>
          Collected data is used only to simulate doctor recommendations and system features.
          No real medical decisions are made.
        </p>

        <h3>3. Data Security</h3>
        <p>
          Consultation reports may include blockchain-based verification (hash only),
          ensuring integrity without exposing sensitive information.
        </p>

        <h3>4. Disclaimer</h3>
        <p>
          This platform does NOT provide medical advice. It is strictly for academic use.
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
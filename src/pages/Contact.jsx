import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Contact() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "General",
    message: "",
  });

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = (e) => {
    e.preventDefault();
    alert("Message submitted (UI only). Next step: connect backend/email service.");
    setForm({ firstName: "", lastName: "", email: "", phone: "", subject: "General", message: "" });
  };

  return (
    <div>
      <Navbar />
      <main style={styles.main}>
        <h1 style={styles.h1}>Contact Us</h1>
        <p style={styles.p}>
          For Studio 5 MVP support or project feedback, send a message below.
        </p>

        <form style={styles.form} onSubmit={onSubmit}>
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>First Name</label>
              <input
                style={styles.input}
                name="firstName"
                value={form.firstName}
                onChange={onChange}
                placeholder="Enter your first name"
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Last Name</label>
              <input
                style={styles.input}
                name="lastName"
                value={form.lastName}
                onChange={onChange}
                placeholder="Enter your last name"
                required
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input
                style={styles.input}
                name="email"
                value={form.email}
                onChange={onChange}
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Phone</label>
              <input
                style={styles.input}
                name="phone"
                value={form.phone}
                onChange={onChange}
                placeholder="Optional"
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Subject</label>
            <select style={styles.input} name="subject" value={form.subject} onChange={onChange}>
              <option>General</option>
              <option>Appointment</option>
              <option>Technical Support</option>
              <option>Feedback</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Message</label>
            <textarea
              style={styles.textarea}
              name="message"
              value={form.message}
              onChange={onChange}
              placeholder="Write your message..."
              required
            />
          </div>

          <button style={styles.btn} type="submit">Submit</button>

          <div style={styles.note}>
            <b>Important:</b> OneStep HealthCare does not provide medical advice or diagnosis.
            If this is an emergency, contact local emergency services.
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}

const styles = {
  main: { maxWidth: 900, margin: "0 auto", padding: 24 },
  h1: { marginBottom: 6 },
  p: { opacity: 0.85, marginBottom: 16 },
  form: {
    background: "#fff",
    border: "1px solid #eee",
    borderRadius: 14,
    padding: 16,
  },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  field: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: 800, opacity: 0.8 },
  input: { padding: 10, borderRadius: 10, border: "1px solid #ccc" },
  textarea: { padding: 10, borderRadius: 10, border: "1px solid #ccc", minHeight: 120 },
  btn: {
    padding: 10,
    borderRadius: 10,
    border: "none",
    background: "#0f7f7c",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  },
  note: {
    marginTop: 14,
    background: "#f6fbfb",
    border: "1px solid rgba(15,127,124,0.25)",
    padding: 12,
    borderRadius: 12,
    lineHeight: 1.5,
  },
};
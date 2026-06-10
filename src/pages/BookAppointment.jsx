import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { api } from "../utils/api";

// ─── Payment Form Component ───────────────────────────────────────────────────
function PaymentForm({ doctorId, appointmentData, onSuccess, onBack }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [payErr, setPayErr] = useState("");
  const [cardErr, setCardErr] = useState(""); // real-time card field error
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [doctorInfo, setDoctorInfo] = useState(null);

  useEffect(() => {
    const createIntent = async () => {
      try {
        const res = await api.post("/payments/create-intent", {
          doctorId,
          appointmentType: appointmentData.appointmentType,
        });
        if (res.data.ok) {
          setClientSecret(res.data.clientSecret);
          setPaymentIntentId(res.data.paymentIntentId);
          setDoctorInfo({
            name: res.data.doctorName,
            specialty: res.data.specialty,
          });
        } else {
          setPayErr(res.data.error || "Failed to initialize payment");
        }
      } catch (err) {
        setPayErr(err.response?.data?.error || err.message);
      }
    };
    createIntent();
  }, [doctorId, appointmentData.appointmentType]);

  const handlePay = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    setPaying(true);
    setPayErr("");

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (error) {
        setPayErr(error.message);
        setPaying(false);
        return;
      }

      if (paymentIntent.status === "succeeded") {
        // confirm with backend and create appointment
        const res = await api.post("/payments/confirm", {
          paymentIntentId: paymentIntent.id,
          appointmentData,
        });

        if (res.data.ok) {
          onSuccess(res.data.appointmentId);
        } else {
          setPayErr(res.data.error || "Booking failed after payment");
        }
      }
    } catch (err) {
      setPayErr(err.response?.data?.error || err.message);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div style={styles.paymentWrap}>
      {/* Order Summary */}
      <div style={styles.summaryCard}>
        <h3 style={styles.summaryTitle}>💳 Payment Summary</h3>
        {doctorInfo && (
          <>
            <div style={styles.summaryRow}>
              <span>Doctor</span>
              <span><b>{doctorInfo.name}</b></span>
            </div>
            <div style={styles.summaryRow}>
              <span>Specialty</span>
              <span>{doctorInfo.specialty}</span>
            </div>
          </>
        )}
        <div style={styles.summaryRow}>
          <span>Appointment Type</span>
          <span>{appointmentData.appointmentType}</span>
        </div>
        <div style={styles.divider} />
        <div style={{ ...styles.summaryRow, ...styles.totalRow }}>
          <span>Total</span>
          <span style={styles.totalAmount}>$50.00 NZD</span>
        </div>
        <div style={styles.testNote}>
          🧪 Test mode — use card: <b>4242 4242 4242 4242</b>
          <br />Any future expiry, any CVC
        </div>
      </div>

      {/* Card Input */}
      <form onSubmit={handlePay} style={styles.payForm}>
        <label style={styles.label}>Card Details</label>
        <div style={styles.cardWrap}>
          {clientSecret ? (
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#1a3c40",
                    "::placeholder": { color: "#aab7c4" },
                  },
                  invalid: { color: "#e63946" },
                },
              }}
              onChange={(e) => {
                // Surface Stripe's human-readable error in real time
                // e.g. "Your card number is incomplete", "Insufficient funds"
                setCardErr(e.error ? e.error.message : "");
              }}
            />
          ) : (
            <div style={{ opacity: 0.6 }}>
              {payErr ? payErr : "Initializing payment..."}
            </div>
          )}
        </div>

        {cardErr && (
          <div style={styles.errBox}>⚠️ {cardErr}</div>
        )}

        {payErr && (
          <div style={styles.errBox}>❌ {payErr}</div>
        )}

        <div style={styles.btnRow}>
          <button
            type="button"
            onClick={onBack}
            style={styles.backBtn}
            disabled={paying}
          >
            ← Back
          </button>
          <button
            type="submit"
            style={styles.payBtn}
            disabled={!stripe || !clientSecret || paying}
          >
            {paying ? "Processing..." : "Pay $50.00 NZD & Book"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Main BookAppointment Component ──────────────────────────────────────────
export default function BookAppointment() {
  const { doctorId } = useParams();
  const navigate = useNavigate();

  const [stripePromise, setStripePromise] = useState(null);
  const [step, setStep] = useState(1); // 1 = form, 2 = payment, 3 = success
  // Each time the user reaches step 2 this key increments.
  // Passing it as `key` on <Elements> forces React to fully unmount and
  // remount the CardElement subtree — clearing any previous card input.
  // This is the recommended Stripe pattern for modal/multi-step flows.
  const [paymentKey, setPaymentKey] = useState(0);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const [requestedStart, setRequestedStart] = useState("");
  const [requestedEnd, setRequestedEnd] = useState("");
  const [appointmentType, setAppointmentType] = useState("VIDEO");
  const [patientNote, setPatientNote] = useState("");
  const [formErr, setFormErr] = useState("");
  const [successAppointmentId, setSuccessAppointmentId] = useState(null);

  useEffect(() => {
    if (!user) navigate("/login");
    if (user?.role !== "PATIENT") navigate("/login");
  }, [user, navigate]);

  // load Stripe publishable key from backend
  useEffect(() => {
    const loadStripeKey = async () => {
      try {
        const res = await api.post("/payments/create-intent", {
          doctorId,
          appointmentType: "VIDEO",
        });
        if (res.data.publishableKey) {
          setStripePromise(loadStripe(res.data.publishableKey));
        }
      } catch {
        // will retry when user submits
      }
    };
    if (doctorId) loadStripeKey();
  }, [doctorId]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormErr("");

    if (!requestedStart || !requestedEnd) {
      setFormErr("Please select start and end time.");
      return;
    }

    if (new Date(requestedStart) >= new Date(requestedEnd)) {
      setFormErr("End time must be after start time.");
      return;
    }

    setPaymentKey((k) => k + 1); // force CardElement remount on (re-)entry
    setStep(2);
  };

  const appointmentData = {
    doctorId: Number(doctorId),
    requestedStart: requestedStart.replace("T", " ") + ":00",
    requestedEnd: requestedEnd.replace("T", " ") + ":00",
    appointmentType,
    patientNote,
  };

  const handlePaymentSuccess = (appointmentId) => {
    setSuccessAppointmentId(appointmentId);
    setStep(3);
  };

  return (
    <div>
      <Navbar />
      <main style={styles.page}>

        {/* Steps indicator */}
        <div style={styles.steps}>
          {["Appointment Details", "Payment", "Confirmed"].map((label, i) => (
            <div key={label} style={styles.stepWrap}>
              <div style={{
                ...styles.stepCircle,
                background: step > i + 1 ? "#0f7f7c" : step === i + 1 ? "#0f7f7c" : "#e0e0e0",
                color: step >= i + 1 ? "#fff" : "#999",
              }}>
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <div style={{
                ...styles.stepLabel,
                color: step >= i + 1 ? "#0f7f7c" : "#999",
                fontWeight: step === i + 1 ? 900 : 600,
              }}>
                {label}
              </div>
              {i < 2 && <div style={styles.stepLine} />}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Appointment Form ── */}
        {step === 1 && (
          <>
            <h1 style={{ marginTop: 16 }}>Book Appointment</h1>
            <div style={styles.card}>
              <b>Doctor ID:</b> {doctorId}
              <div style={{ opacity: 0.75, marginTop: 6 }}>
                Fill in your appointment details. You will pay $50 NZD on the next step.
              </div>
            </div>

            <form onSubmit={handleFormSubmit} style={styles.form}>
              <label style={styles.label}>
                Start time
                <input
                  type="datetime-local"
                  value={requestedStart}
                  onChange={(e) => setRequestedStart(e.target.value)}
                  style={styles.input}
                  required
                />
              </label>

              <label style={styles.label}>
                End time
                <input
                  type="datetime-local"
                  value={requestedEnd}
                  onChange={(e) => setRequestedEnd(e.target.value)}
                  style={styles.input}
                  required
                />
              </label>

              <label style={styles.label}>
                Appointment type
                <select
                  value={appointmentType}
                  onChange={(e) => setAppointmentType(e.target.value)}
                  style={styles.input}
                >
                  <option value="VIDEO">Video Consultation</option>
                  <option value="IN_PERSON">In Person</option>
                </select>
              </label>

              <label style={styles.label}>
                Note (optional)
                <textarea
                  value={patientNote}
                  onChange={(e) => setPatientNote(e.target.value)}
                  rows={4}
                  style={styles.input}
                  placeholder="Describe your symptoms or reason for visit..."
                />
              </label>

              {formErr && (
                <div style={{ color: "crimson", fontWeight: 800 }}>❌ {formErr}</div>
              )}

              <button style={styles.btn}>
                Continue to Payment →
              </button>
            </form>
          </>
        )}

        {/* ── STEP 2: Payment ── */}
        {step === 2 && stripePromise && (
          <>
            <h1 style={{ marginTop: 16 }}>Complete Payment</h1>
            <Elements key={paymentKey} stripe={stripePromise}>
              <PaymentForm
                doctorId={doctorId}
                appointmentData={appointmentData}
                onSuccess={handlePaymentSuccess}
                onBack={() => setStep(1)}
              />
            </Elements>
          </>
        )}

        {/* ── STEP 3: Success ── */}
        {step === 3 && (
          <div style={styles.successWrap}>
            <div style={styles.successIcon}>✅</div>
            <h2 style={styles.successTitle}>Appointment Booked!</h2>
            <p style={styles.successText}>
              Your payment of <b>$50.00 NZD</b> was successful and your appointment
              has been submitted for doctor confirmation.
            </p>
            <div style={styles.successCard}>
              <div style={styles.summaryRow}>
                <span>Appointment ID</span>
                <span><b>#{successAppointmentId}</b></span>
              </div>
              <div style={styles.summaryRow}>
                <span>Payment Status</span>
                <span style={{ color: "#1b7a3c", fontWeight: 900 }}>✅ PAID</span>
              </div>
              <div style={styles.summaryRow}>
                <span>Amount</span>
                <span><b>$50.00 NZD</b></span>
              </div>
            </div>
            <button
              style={styles.btn}
              onClick={() => navigate("/patient")}
            >
              Go to Dashboard
            </button>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}

const styles = {
  page: { maxWidth: 680, margin: "0 auto", padding: 24, fontFamily: "system-ui, sans-serif" },

  // steps
  steps: { display: "flex", alignItems: "center", gap: 0, marginBottom: 8 },
  stepWrap: { display: "flex", alignItems: "center", gap: 8, flex: 1 },
  stepCircle: {
    width: 32, height: 32, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 900, fontSize: 14, flexShrink: 0,
  },
  stepLabel: { fontSize: 13, whiteSpace: "nowrap" },
  stepLine: { flex: 1, height: 2, background: "#e0e0e0", margin: "0 4px" },

  // form
  card: {
    marginTop: 10, border: "1px solid #eee",
    borderRadius: 12, padding: 12, background: "#fff",
  },
  form: { display: "grid", gap: 14, marginTop: 14 },
  label: { fontWeight: 800, display: "grid", gap: 6, fontSize: 14 },
  input: { width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd", fontSize: 14 },
  btn: {
    padding: 14, borderRadius: 12, border: "none",
    background: "#0f7f7c", color: "#fff", fontWeight: 900, cursor: "pointer", fontSize: 15,
  },

  // payment
  paymentWrap: { display: "grid", gap: 16, marginTop: 16 },
  summaryCard: {
    background: "#f0fdfa", border: "1px solid rgba(15,127,124,0.25)",
    borderRadius: 14, padding: 16,
  },
  summaryTitle: { margin: "0 0 12px", color: "#0f7f7c" },
  summaryRow: {
    display: "flex", justifyContent: "space-between",
    padding: "6px 0", fontSize: 14, borderBottom: "1px solid rgba(0,0,0,0.06)",
  },
  divider: { margin: "8px 0", borderTop: "2px solid rgba(15,127,124,0.2)" },
  totalRow: { fontWeight: 900, fontSize: 16 },
  totalAmount: { color: "#0f7f7c", fontSize: 20, fontWeight: 900 },
  testNote: {
    marginTop: 12, padding: 10, background: "#fff3cd",
    border: "1px solid #ffc107", borderRadius: 8, fontSize: 12, lineHeight: 1.6,
  },
  payForm: { display: "grid", gap: 14 },
  cardWrap: {
    padding: 14, border: "1px solid #ddd",
    borderRadius: 10, background: "#fff",
  },
  errBox: {
    background: "#ffe3e3", border: "1px solid rgba(156,42,42,0.2)",
    borderRadius: 8, padding: 10, color: "#9c2a2a", fontWeight: 700, fontSize: 13,
  },
  btnRow: { display: "flex", gap: 12 },
  backBtn: {
    padding: "12px 20px", borderRadius: 12,
    border: "1px solid #0f7f7c", background: "#fff",
    color: "#0f7f7c", fontWeight: 900, cursor: "pointer", flex: 1,
  },
  payBtn: {
    padding: "12px 20px", borderRadius: 12, border: "none",
    background: "#0f7f7c", color: "#fff", fontWeight: 900, cursor: "pointer", flex: 2,
  },

  // success
  successWrap: { textAlign: "center", padding: "40px 20px" },
  successIcon: { fontSize: 64, marginBottom: 16 },
  successTitle: { fontSize: 28, fontWeight: 900, color: "#0f7f7c", margin: "0 0 12px" },
  successText: { fontSize: 15, opacity: 0.8, lineHeight: 1.6, maxWidth: 400, margin: "0 auto 20px" },
  successCard: {
    background: "#f0fdfa", border: "1px solid rgba(15,127,124,0.25)",
    borderRadius: 14, padding: 16, marginBottom: 20, textAlign: "left",
  },
};
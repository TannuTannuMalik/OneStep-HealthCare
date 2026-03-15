import express from "express";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

// ─── Rules Engine ─────────────────────────────────────────────────────────────

const rules = [
  // ── Greetings ──────────────────────────────────────────────────────────────
  {
    category: "greeting",
    keywords: ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "howdy"],
    responses: [
      "Hello! 👋 Welcome to OneStep Healthcare. How can I help you today?",
      "Hi there! 😊 I'm your OneStep Health Assistant. What can I help you with?",
      "Hey! Welcome. I can help with symptoms, appointments, reports, or health tips. What do you need?",
    ],
  },

  // ── Symptoms — Headache ────────────────────────────────────────────────────
  {
    category: "symptom",
    keywords: ["headache", "head pain", "migraine", "head hurts", "head ache"],
    responses: [
      "🤕 For headaches, try resting in a quiet dark room and staying hydrated. If the headache is severe, sudden, or lasts more than 2 days, please book an appointment with a doctor. Would you like help booking one?",
    ],
  },

  // ── Symptoms — Fever ───────────────────────────────────────────────────────
  {
    category: "symptom",
    keywords: ["fever", "high temperature", "temperature", "chills", "sweating"],
    responses: [
      "🌡️ For a fever, rest and drink plenty of fluids. If your temperature is above 39°C (102°F) or lasts more than 3 days, please see a doctor immediately. Shall I help you book an appointment?",
    ],
  },

  // ── Symptoms — Cough ───────────────────────────────────────────────────────
  {
    category: "symptom",
    keywords: ["cough", "coughing", "sore throat", "throat pain", "throat"],
    responses: [
      "😷 For a cough or sore throat, try warm liquids, honey, and rest. If you have difficulty breathing or the cough persists for more than 2 weeks, please consult a doctor. Would you like to book an appointment?",
    ],
  },

  // ── Symptoms — Stomach ─────────────────────────────────────────────────────
  {
    category: "symptom",
    keywords: ["stomach", "stomach ache", "nausea", "vomiting", "diarrhea", "stomach pain", "belly", "abdominal"],
    responses: [
      "🤢 For stomach issues, avoid heavy foods and stay hydrated. If you experience severe pain, blood in stool, or symptoms lasting more than 48 hours, please see a doctor. Shall I help you find one?",
    ],
  },

  // ── Symptoms — Chest ───────────────────────────────────────────────────────
  {
    category: "symptom",
    keywords: ["chest pain", "chest", "heart", "palpitation", "shortness of breath", "breathing"],
    responses: [
      "⚠️ Chest pain or breathing difficulties can be serious. If you are experiencing severe chest pain, call emergency services immediately (111 in NZ). For mild discomfort, please book an urgent appointment with a doctor right away.",
    ],
  },

  // ── Symptoms — Back Pain ───────────────────────────────────────────────────
  {
    category: "symptom",
    keywords: ["back pain", "back ache", "spine", "lower back", "backache"],
    responses: [
      "🦴 For back pain, gentle stretching and rest can help. Avoid heavy lifting. If pain is severe or radiates down your leg, please consult a doctor. Would you like to book an appointment?",
    ],
  },

  // ── Symptoms — Fatigue ─────────────────────────────────────────────────────
  {
    category: "symptom",
    keywords: ["tired", "fatigue", "exhausted", "no energy", "weakness", "dizzy", "dizziness"],
    responses: [
      "😴 Fatigue and dizziness can have many causes including poor sleep, dehydration, or underlying conditions. Try resting and drinking water. If it persists, a doctor check-up is recommended. Shall I help you book one?",
    ],
  },

  // ── Symptoms — Skin ────────────────────────────────────────────────────────
  {
    category: "symptom",
    keywords: ["rash", "skin", "itching", "itch", "allergy", "hives", "swelling"],
    responses: [
      "🩹 For skin rashes or itching, avoid scratching and use a cold compress. If the rash spreads rapidly, causes difficulty breathing, or is accompanied by fever, seek medical attention immediately. Would you like to book an appointment?",
    ],
  },

  // ── Appointment Booking ────────────────────────────────────────────────────
  {
    category: "appointment",
    keywords: ["book", "appointment", "schedule", "doctor", "see a doctor", "find doctor", "booking"],
    responses: [
      "📅 To book an appointment, click **'+ Book New Appointment'** at the top of your dashboard, or go to **Find a Doctor** to search by specialization. Would you like any help with that?",
    ],
  },

  // ── Appointment Status ─────────────────────────────────────────────────────
  {
    category: "appointment",
    keywords: ["my appointment", "appointment status", "confirmed", "pending", "upcoming", "when is my"],
    responses: [
      "📋 You can view all your appointments in the **Appointments** section of your dashboard. Appointments show their current status — REQUESTED, CONFIRMED, or COMPLETED.",
    ],
  },

  // ── Reports ────────────────────────────────────────────────────────────────
  {
    category: "report",
    keywords: ["report", "my report", "consultation report", "diagnosis", "prescription", "download report"],
    responses: [
      "📄 Your consultation reports are available in the **Reports** section of your dashboard. You can download them as PDF files and verify their authenticity using our blockchain verification system. Would you like to know more?",
    ],
  },

  // ── Blockchain Verification ────────────────────────────────────────────────
  {
    category: "report",
    keywords: ["verify", "blockchain", "authentic", "tampered", "integrity", "trust"],
    responses: [
      "⛓️ OneStep Healthcare uses blockchain technology to protect your medical reports. Each report is stored with a unique cryptographic hash on the Ethereum blockchain. Click **Verify Integrity** on any report to confirm it has not been tampered with.",
    ],
  },

  // ── Medication ─────────────────────────────────────────────────────────────
  {
    category: "medication",
    keywords: ["medication", "medicine", "drug", "tablet", "pill", "dose", "dosage", "prescription"],
    responses: [
      "💊 Always follow the medication instructions provided in your consultation report. Never adjust dosage without consulting your doctor. If you have questions about a specific medication, please book an appointment or contact your doctor directly.",
    ],
  },

  // ── Health Tips — Diet ─────────────────────────────────────────────────────
  {
    category: "health_tip",
    keywords: ["diet", "food", "eat", "nutrition", "healthy eating", "weight", "calories"],
    responses: [
      "🥗 A balanced diet includes plenty of vegetables, fruits, lean proteins, and whole grains. Limit processed foods, sugar, and saturated fats. Staying hydrated with 8 glasses of water daily is also important for overall health.",
    ],
  },

  // ── Health Tips — Exercise ─────────────────────────────────────────────────
  {
    category: "health_tip",
    keywords: ["exercise", "workout", "fitness", "gym", "walk", "running", "physical activity"],
    responses: [
      "🏃 Regular exercise is essential for good health. Aim for at least 30 minutes of moderate activity 5 days a week. Even a daily walk can significantly improve your cardiovascular health and mental wellbeing.",
    ],
  },

  // ── Health Tips — Sleep ────────────────────────────────────────────────────
  {
    category: "health_tip",
    keywords: ["sleep", "insomnia", "can't sleep", "sleeping", "rest", "night"],
    responses: [
      "😴 Adults need 7–9 hours of sleep per night. Maintain a consistent sleep schedule, avoid screens before bed, and keep your bedroom cool and dark. Poor sleep can affect immunity, mood, and overall health.",
    ],
  },

  // ── Health Tips — Mental Health ────────────────────────────────────────────
  {
    category: "health_tip",
    keywords: ["stress", "anxiety", "mental health", "depression", "sad", "worried", "panic"],
    responses: [
      "🧠 Mental health is just as important as physical health. Practice deep breathing, mindfulness, or meditation to manage stress. If you are feeling persistently anxious or depressed, please speak with a healthcare professional. Would you like to book an appointment?",
    ],
  },

  // ── Emergency ──────────────────────────────────────────────────────────────
  {
    category: "emergency",
    keywords: ["emergency", "urgent", "critical", "ambulance", "911", "111", "dying", "unconscious"],
    responses: [
      "🚨 If this is a medical emergency, please call **111** (New Zealand) or your local emergency number immediately. Do not wait — emergency services can provide the fastest help.",
    ],
  },

  // ── Thank you ──────────────────────────────────────────────────────────────
  {
    category: "general",
    keywords: ["thank", "thanks", "thank you", "helpful", "great", "awesome"],
    responses: [
      "😊 You're welcome! Stay healthy and don't hesitate to ask if you need anything else.",
      "Happy to help! Take care of yourself. 💚",
    ],
  },

  // ── Goodbye ────────────────────────────────────────────────────────────────
  {
    category: "general",
    keywords: ["bye", "goodbye", "see you", "take care", "exit"],
    responses: [
      "👋 Goodbye! Take care and stay healthy. OneStep Healthcare is always here for you.",
    ],
  },
];

// ─── Match function ────────────────────────────────────────────────────────────

function getResponse(message) {
  const lower = message.toLowerCase().trim();

  for (const rule of rules) {
    for (const keyword of rule.keywords) {
      if (lower.includes(keyword)) {
        const responses = rule.responses;
        const picked = responses[Math.floor(Math.random() * responses.length)];
        return { response: picked, category: rule.category };
      }
    }
  }

  // Default fallback
  return {
    response:
      "🤔 I'm not sure about that. I can help with symptoms, appointments, reports, medications, and health tips. Could you try rephrasing your question?",
    category: "unknown",
  };
}

// ─── POST /api/chat ────────────────────────────────────────────────────────────

router.post("/", authRequired, (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ ok: false, error: "Message is required" });
    }

    if (message.trim().length > 500) {
      return res.status(400).json({ ok: false, error: "Message too long" });
    }

    const { response, category } = getResponse(message);

    console.log(`[chat] userId=${req.user.id} category=${category} message="${message.slice(0, 60)}"`);

    return res.json({ ok: true, response, category });
  } catch (err) {
    console.error("[chat] error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;

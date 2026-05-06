import express from "express";
import OpenAI from "openai";

const router = express.Router();

// ✅ Safe OpenAI init (no crash if key missing)
let client = null;

if (process.env.OPENAI_API_KEY) {
  client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log("✅ OpenAI initialized");
} else {
  console.log("⚠️ OpenAI API key missing — using rule-based only");
}

// ─── RULE ENGINE ─────────────────────────────────────────────

const rules = [
  {
    category: "greeting",
    keywords: ["hello", "hi", "hey"],
    responses: [
      "Hello! 👋 Welcome to OneStep Healthcare. How can I help you today?",
    ],
  },
  {
    category: "symptom",
    keywords: ["headache"],
    responses: [
      "🤕 Rest and hydrate. If it persists more than 2 days, see a doctor.",
    ],
  },
  {
    category: "emergency",
    keywords: ["chest pain", "can't breathe"],
    responses: [
      "🚨 This may be serious. Call 111 immediately.",
    ],
  },
];

// ─── MATCH FUNCTION ─────────────────────────────────────────

function getResponse(message) {
  const lower = message.toLowerCase();

  for (const rule of rules) {
    for (const keyword of rule.keywords) {
      if (lower.includes(keyword)) {
        return {
          response:
            rule.responses[
              Math.floor(Math.random() * rule.responses.length)
            ],
          category: rule.category,
        };
      }
    }
  }

  return { category: "unknown" };
}

// ─── MAIN ROUTE ─────────────────────────────────────────────

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        ok: false,
        error: "Message required",
      });
    }

    // 1️⃣ RULE CHECK
    const ruleResult = getResponse(message);

    if (ruleResult.category !== "unknown") {
      return res.json({
        ok: true,
        response: ruleResult.response,
        source: "rule",
      });
    }

    // 2️⃣ IF NO API KEY → fallback safely
    if (!client) {
      return res.json({
        ok: true,
        response:
          "🤖 AI service is currently unavailable. Please try a simpler query or contact support.",
        source: "fallback",
      });
    }

    // 3️⃣ AI RESPONSE
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a medical triage assistant. Return JSON with possibleConditions, recommendedSpecialty, urgency (low/moderate/high), and advice. Never diagnose.",
        },
        {
          role: "user",
          content: message,
        },
      ],
      response_format: {
        type: "json_object",
      },
    });

    const aiData = JSON.parse(
      completion.choices[0].message.content
    );

    return res.json({
      ok: true,
      response: aiData,
      source: "ai",
    });
  } catch (err) {
    console.error("❌ Chat error:", err);

    return res.status(500).json({
      ok: false,
      error: "Server error. Try again.",
    });
  }
});

export default router;
import express from "express";
import Groq from "groq-sdk";

const router = express.Router();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a medical triage assistant for OneStep Healthcare platform in New Zealand.

Your job is to analyse patient symptoms and return a structured JSON response.

Rules:
- NEVER diagnose a condition
- ALWAYS recommend seeing a doctor
- Be helpful, clear, and empathetic
- Recommend the most appropriate medical specialty
- Assess urgency honestly

You MUST respond with ONLY valid JSON in this exact format, no other text:
{
  "possibleConditions": ["condition1", "condition2", "condition3"],
  "recommendedSpecialty": "one specialty name",
  "urgency": "low" | "moderate" | "high" | "emergency",
  "urgencyReason": "brief reason why",
  "advice": "2-3 sentences of general guidance",
  "seeDoctor": true
}

Specialty options: General Practice, Cardiology, Neurology, Pulmonology, Gastroenterology, Dermatology, Orthopedics, ENT, Psychiatry, Endocrinology, Urology, Gynecology, Ophthalmology, Pediatrics`;

// ─── POST /api/symptoms ───────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms || typeof symptoms !== "string" || symptoms.trim().length === 0) {
      return res.status(400).json({ ok: false, error: "Symptoms are required" });
    }

    if (symptoms.trim().length < 5) {
      return res.status(400).json({ ok: false, error: "Please describe your symptoms in more detail" });
    }

    if (symptoms.trim().length > 1000) {
      return res.status(400).json({ ok: false, error: "Please keep your description under 1000 characters" });
    }

    console.log(`[AI] Analysing symptoms: "${symptoms.slice(0, 80)}..."`);

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Patient symptoms: ${symptoms}` }
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    const rawResponse = completion.choices[0].message.content;
    console.log(`[AI] Raw response: ${rawResponse}`);

    // parse JSON from response
    let parsed;
    try {
      const cleaned = rawResponse.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("[AI] Failed to parse JSON:", rawResponse);
      return res.status(500).json({
        ok: false,
        error: "AI response could not be parsed. Please try again."
      });
    }

    // validate required fields
    if (!parsed.recommendedSpecialty || !parsed.urgency || !parsed.advice) {
      return res.status(500).json({
        ok: false,
        error: "Incomplete AI response. Please try again."
      });
    }

    console.log(`[AI] Specialty: ${parsed.recommendedSpecialty} | Urgency: ${parsed.urgency}`);

    return res.json({
      ok: true,
      symptoms: symptoms.trim(),
      analysis: {
        possibleConditions: parsed.possibleConditions || [],
        recommendedSpecialty: parsed.recommendedSpecialty,
        urgency: parsed.urgency,
        urgencyReason: parsed.urgencyReason || "",
        advice: parsed.advice,
        seeDoctor: true,
      }
    });

  } catch (err) {
    console.error("[AI] symptoms error:", err);

    if (err.status === 429) {
      return res.status(429).json({
        ok: false,
        error: "AI service is busy. Please try again in a moment."
      });
    }

    return res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
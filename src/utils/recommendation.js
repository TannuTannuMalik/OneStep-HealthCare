// src/utils/recommendation.js

// Simple MVP symptom categorization (rule-based hybrid start)
export function categorizeSymptoms(text = "") {
  const t = text.toLowerCase();

  const rules = [
    {
      category: "Respiratory",
      keywords: ["cough", "breath", "breathing", "asthma", "wheeze", "chest tight", "shortness"],
      suggestedSpecialties: ["Pulmonology", "General Practice"],
    },
    {
      category: "Skin",
      keywords: ["rash", "itch", "eczema", "acne", "skin", "hives", "allergy", "spots"],
      suggestedSpecialties: ["Dermatology", "General Practice"],
    },
    {
      category: "Digestive",
      keywords: ["stomach", "nausea", "vomit", "diarrhea", "constipation", "heartburn", "acid", "bloating"],
      suggestedSpecialties: ["Gastroenterology", "General Practice"],
    },
    {
      category: "Cardiac",
      keywords: ["chest pain", "palpitations", "heart", "pressure", "blood pressure", "bp"],
      suggestedSpecialties: ["Cardiology", "General Practice"],
    },
    {
      category: "Eye",
      keywords: ["eye", "blur", "vision", "red eye", "pain in eye", "watery"],
      suggestedSpecialties: ["Ophthalmology", "General Practice"],
    },
    {
      category: "Mental Health",
      keywords: ["anxiety", "stress", "panic", "depression", "sleep", "insomnia"],
      suggestedSpecialties: ["Psychology", "General Practice"],
    },
  ];

  for (const r of rules) {
    if (r.keywords.some((k) => t.includes(k))) {
      return {
        category: r.category,
        suggestedSpecialties: r.suggestedSpecialties,
        structuredSummary: `Patient reported symptoms related to ${r.category}. Summary generated for doctor review.`,
      };
    }
  }

  return {
    category: "General",
    suggestedSpecialties: ["General Practice"],
    structuredSummary:
      "Patient reported general symptoms. Summary generated for doctor review (MVP rule-based).",
  };
}

// Weighted scoring as per your proposal:
// symptom match, rating, availability, experience
export function scoreDoctor(doctor, preferredSpecialties = []) {
  const symptomMatch = preferredSpecialties.includes(doctor.specialty) ? 40 : 15;

  // rating is 0-5 => scale to 0-30
  const ratingScore = Math.round((doctor.rating / 5) * 30);

  // availability true/false => 20 or 5
  const availabilityScore = doctor.availableToday ? 20 : 5;

  // experience years => cap at 10+ => 10..20 range
  const exp = Math.min(doctor.experienceYears, 10);
  const experienceScore = 10 + exp; // 10-20

  const total = symptomMatch + ratingScore + availabilityScore + experienceScore;

  return {
    total,
    breakdown: { symptomMatch, ratingScore, availabilityScore, experienceScore },
  };
}

export function recommendDoctors(doctors, preferredSpecialties = [], onlyAvailable = false) {
  const filtered = onlyAvailable ? doctors.filter((d) => d.availableToday) : doctors;

  const scored = filtered.map((d) => {
    const s = scoreDoctor(d, preferredSpecialties);
    return { ...d, score: s.total, breakdown: s.breakdown };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored;
}
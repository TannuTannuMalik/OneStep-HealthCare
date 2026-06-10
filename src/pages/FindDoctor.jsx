import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { api } from "../utils/api";

export default function FindDoctor() {
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [doctorError, setDoctorError] = useState("");

  const [symptoms, setSymptoms] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    const fetchDoctors = async () => {
      setDoctorError("");
      setLoadingDoctors(true);
      try {
        const res = await api.get("/doctors");
        if (res.data.ok) setDoctors(res.data.doctors || []);
        else setDoctorError(res.data.error || "Failed to load doctors");
      } catch (err) {
        setDoctorError(err.response?.data?.error || err.message);
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, []);

  // ── AI-powered symptom analysis ─────────────────────────────
  const onAnalyze = async () => {
    if (!symptoms.trim()) return;
    setAnalyzingAI(true);
    setAiError("");
    setAnalysis(null);

    try {
      const res = await api.post("/symptoms", { symptoms });
      if (res.data.ok) {
        const a = res.data.analysis;
        setAnalysis({
          category: a.recommendedSpecialty,
          suggestedSpecialties: [a.recommendedSpecialty],
          structuredSummary: a.advice,
          urgency: a.urgency,
          urgencyReason: a.urgencyReason,
          possibleConditions: a.possibleConditions || [],
        });
      } else {
        setAiError(res.data.error || "AI analysis failed");
      }
    } catch (err) {
      setAiError(err.response?.data?.error || err.message);
    } finally {
      setAnalyzingAI(false);
    }
  };

  // ── Doctor scoring and filtering ────────────────────────────
  const results = useMemo(() => {
    if (!analysis || doctors.length === 0) return [];

    const specialty = analysis.suggestedSpecialties[0]?.toLowerCase() || "";

    const mapped = doctors.map((d) => {
      const safeName = d.fullName?.startsWith("Dr") ? d.fullName : `Dr. ${d.fullName}`;
      const docSpecialty = (d.specialty || "General Practice").toLowerCase();

      // symptom match score
      const exactMatch = docSpecialty === specialty;
      const partialMatch = docSpecialty.includes(specialty) || specialty.includes(docSpecialty);
      const symptomMatch = exactMatch ? 50 : partialMatch ? 30 : 0;

      const ratingScore = Number(d.rating || 0) * 5;
      const availabilityScore = d.availableToday ? 20 : 0;
      const experienceScore = Math.min(Number(d.experienceYears || 0), 10);
      const score = symptomMatch + ratingScore + availabilityScore + experienceScore;

      return {
        id: d.id,
        name: safeName,
        specialty: d.specialty || "General Practice",
        rating: Number(d.rating || 0),
        experienceYears: Number(d.experienceYears || 0),
        availableToday: !!d.availableToday,
        location: d.location || "—",
        photoUrl: d.photoUrl || "",
        score: Math.round(score),
        breakdown: { symptomMatch, ratingScore: Math.round(ratingScore), availabilityScore, experienceScore },
      };
    });

    let filtered = mapped;

    // auto-filter by recommended specialty
    const specialtyMatches = mapped.filter((d) =>
      d.specialty.toLowerCase().includes(specialty) ||
      specialty.includes(d.specialty.toLowerCase())
    );

    // if specialty matches exist use them, otherwise show all ranked
    if (specialtyMatches.length > 0) {
      filtered = specialtyMatches;
    }

    if (onlyAvailable) {
      filtered = filtered.filter((d) => d.availableToday);
    }

    return filtered.sort((a, b) => b.score - a.score);
  }, [analysis, doctors, onlyAvailable]);

  const urgencyColor = {
    low: { bg: "#dcfce7", color: "#166534", icon: "🟢" },
    moderate: { bg: "#fef3c7", color: "#92400e", icon: "🟡" },
    high: { bg: "#fee2e2", color: "#991b1b", icon: "🟠" },
    emergency: { bg: "#fee2e2", color: "#7f1d1d", icon: "🔴" },
  };

  const defaultImg =
    "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=60";

  return (
    <div>
      <Navbar />

      <main style={styles.main}>
        <h1 style={styles.h1}>Find a Doctor</h1>
        <p style={styles.p}>
          Enter your symptoms in simple language. Our AI will analyse them and
          recommend the right specialist for you.
        </p>

        {/* Doctors loaded indicator */}
        <section style={styles.card}>
          <h3 style={styles.h3}>Marketplace Doctors (from Database)</h3>
          {loadingDoctors && <p>Loading doctors...</p>}
          {doctorError && <p style={{ color: "red" }}>{doctorError}</p>}
          {!loadingDoctors && !doctorError && (
            <p style={{ opacity: 0.8, marginTop: 0 }}>
              Doctors loaded: <b>{doctors.length}</b>
            </p>
          )}
        </section>

        {/* Symptom input */}
        <section style={styles.card}>
          <h3 style={styles.h3}>🧠 AI Symptom Analysis</h3>
          <textarea
            style={styles.textarea}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Example: I have a severe headache and fever for 3 days..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.ctrlKey) onAnalyze();
            }}
          />
          <div style={styles.row}>
            <button
              style={{ ...styles.btn, opacity: analyzingAI || !symptoms.trim() ? 0.7 : 1 }}
              onClick={onAnalyze}
              disabled={!symptoms.trim() || analyzingAI}
            >
              {analyzingAI ? "⏳ Analysing with AI..." : "🔍 Analyze Symptoms"}
            </button>

            <label style={styles.toggle}>
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
              />
              Only show available today
            </label>
          </div>

          {aiError && (
            <div style={styles.errorBox}>❌ {aiError}</div>
          )}

          {/* AI analysis result */}
          {analysis && (
            <div style={styles.analysis}>
              {/* Urgency badge */}
              {analysis.urgency && (() => {
                const u = urgencyColor[analysis.urgency] || urgencyColor.moderate;
                return (
                  <div style={{ ...styles.urgencyBadge, background: u.bg, color: u.color }}>
                    {u.icon} <b>Urgency: {analysis.urgency.toUpperCase()}</b>
                    {analysis.urgencyReason && ` — ${analysis.urgencyReason}`}
                  </div>
                );
              })()}

              {/* Possible conditions */}
              {analysis.possibleConditions?.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <b>🔍 Possible Conditions:</b>{" "}
                  {analysis.possibleConditions.join(", ")}
                </div>
              )}

              {/* Recommended specialty */}
              <div style={{ marginTop: 6 }}>
                <b>👨‍⚕️ Recommended Specialist:</b>{" "}
                <span style={styles.specialtyTag}>{analysis.category}</span>
              </div>

              {/* Advice */}
              <div style={{ marginTop: 8 }}>
                <b>💡 AI Advice:</b>
                <div style={styles.summaryBox}>{analysis.structuredSummary}</div>
              </div>
            </div>
          )}
        </section>

        {/* Doctor results */}
        {analysis && (
          <section style={styles.card}>
            <h3 style={styles.h3}>
              Recommended Doctors
              {analysis.category && (
                <span style={styles.filterTag}>
                  Filtered: {analysis.category}
                </span>
              )}
            </h3>
            <p style={{ opacity: 0.8, marginTop: 0 }}>
              Ranked by specialty match, rating, availability, and experience.
            </p>

            <div style={styles.grid}>
              {results.map((d) => (
                <div key={d.id} style={styles.docCard}>
                  <div style={styles.docTop}>
                    <div style={styles.avatarImgWrap}>
                      <img
                        src={d.photoUrl || defaultImg}
                        alt={d.name}
                        style={styles.avatarImg}
                        onError={(e) => { e.currentTarget.src = defaultImg; }}
                      />
                    </div>
                    <div>
                      <div style={styles.docName}>{d.name}</div>
                      <div style={styles.docMeta}>{d.specialty} • {d.location}</div>
                    </div>
                  </div>

                  <div style={styles.metrics}>
                    <span>⭐ {d.rating}</span>
                    <span>🧠 {d.experienceYears} yrs</span>
                    <span>{d.availableToday ? "✅ Available" : "⛔ Not today"}</span>
                  </div>

                  <div style={styles.score}>
                    <b>Score:</b> {d.score}
                    <div style={styles.breakdown}>
                      Match {d.breakdown.symptomMatch} • Rating {d.breakdown.ratingScore} •
                      Avail {d.breakdown.availabilityScore} • Exp {d.breakdown.experienceScore}
                    </div>
                  </div>

                  <div style={styles.actions}>
                    <Link to={`/doctor/${d.id}`} style={styles.outlineBtn}>
                      View Profile
                    </Link>
                    <Link to={`/book/${d.id}`} style={styles.primaryBtn}>
                      Book
                    </Link>
                  </div>
                </div>
              ))}

              {results.length === 0 && (
                <p style={{ marginTop: 12 }}>
                  No doctors matched for <b>{analysis.category}</b>.
                  Try different symptoms or uncheck "available today".
                </p>
              )}
            </div>
          </section>
        )}

        <div style={styles.note}>
          <b>Disclaimer:</b> Recommendations are for guidance only and do not
          provide medical diagnosis. Always consult a qualified healthcare provider.
        </div>
      </main>

      <Footer />
    </div>
  );
}

const styles = {
  main: { maxWidth: 1100, margin: "0 auto", padding: 24 },
  h1: { marginBottom: 6 },
  p: { opacity: 0.85, maxWidth: 900, lineHeight: 1.6 },
  card: {
    background: "#fff", border: "1px solid #eee",
    borderRadius: 14, padding: 16, marginTop: 16,
  },
  h3: { marginTop: 0, color: "#0f7f7c", display: "flex", alignItems: "center", gap: 10 },
  textarea: {
    width: "100%", minHeight: 110, padding: 10,
    borderRadius: 12, border: "1px solid #ccc",
    outline: "none", lineHeight: 1.5,
  },
  row: {
    display: "flex", gap: 12, alignItems: "center",
    justifyContent: "space-between", flexWrap: "wrap", marginTop: 10,
  },
  btn: {
    padding: "10px 14px", borderRadius: 10, border: "none",
    background: "#0f7f7c", color: "#fff", fontWeight: 900, cursor: "pointer",
  },
  toggle: { display: "flex", gap: 8, alignItems: "center", fontWeight: 700, opacity: 0.85 },
  errorBox: {
    marginTop: 10, padding: 10, background: "#fee2e2",
    border: "1px solid rgba(220,38,38,0.2)", borderRadius: 8,
    color: "#dc2626", fontWeight: 700, fontSize: 13,
  },
  analysis: {
    marginTop: 12, background: "#f6fbfb",
    border: "1px solid rgba(15,127,124,0.25)",
    borderRadius: 12, padding: 12, lineHeight: 1.6,
  },
  urgencyBadge: {
    display: "inline-block", padding: "6px 12px",
    borderRadius: 999, fontWeight: 700, fontSize: 13, marginBottom: 8,
  },
  specialtyTag: {
    background: "#0f7f7c", color: "#fff",
    padding: "3px 10px", borderRadius: 999,
    fontWeight: 800, fontSize: 13,
  },
  filterTag: {
    marginLeft: 10, background: "#dcfce7", color: "#166534",
    padding: "3px 10px", borderRadius: 999,
    fontWeight: 700, fontSize: 12,
  },
  summaryBox: {
    marginTop: 6, padding: 10, borderRadius: 10,
    background: "#fff", border: "1px solid rgba(0,0,0,0.06)",
  },
  grid: {
    marginTop: 12, display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14,
  },
  docCard: {
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 14, padding: 14, background: "#fff",
  },
  docTop: { display: "flex", gap: 10, alignItems: "center" },
  avatarImgWrap: {
    width: 46, height: 46, borderRadius: 999, overflow: "hidden",
    border: "1px solid rgba(15,127,124,0.25)", background: "#eef7f7", flex: "0 0 auto",
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  docName: { fontWeight: 900 },
  docMeta: { fontSize: 12, opacity: 0.75, marginTop: 2 },
  metrics: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10, fontWeight: 700, opacity: 0.85 },
  score: { marginTop: 10 },
  breakdown: { fontSize: 12, opacity: 0.7, marginTop: 4, lineHeight: 1.4 },
  actions: { marginTop: 12, display: "flex", gap: 10 },
  outlineBtn: {
    textDecoration: "none", padding: "10px 12px", borderRadius: 10,
    border: "1px solid #0f7f7c", color: "#0f7f7c",
    fontWeight: 900, textAlign: "center", flex: 1,
  },
  primaryBtn: {
    textDecoration: "none", padding: "10px 12px", borderRadius: 10,
    border: "none", background: "#0f7f7c", color: "#fff",
    fontWeight: 900, textAlign: "center", flex: 1,
  },
  note: {
    marginTop: 16, padding: 12, borderRadius: 12,
    background: "#fff7e6", border: "1px solid rgba(255, 153, 0, 0.35)", lineHeight: 1.5,
  },
};
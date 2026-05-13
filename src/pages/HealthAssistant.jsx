import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { api } from "../utils/api";

const QUICK_REPLIES = [
  "I have a headache and fever",
  "I have chest pain and shortness of breath",
  "I have stomach pain and nausea",
  "I have back pain for 3 days",
  "I feel dizzy and tired",
  "I have a skin rash",
];

export default function HealthAssistant() {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "👋 Hello! I'm your OneStep Health Assistant powered by AI. Describe your symptoms and I'll help recommend the right specialist for you. Remember — I provide guidance only and cannot diagnose conditions.",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;

    setInput("");
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // add user message
    setMessages((prev) => [...prev, { role: "user", text: userText, time }]);
    setLoading(true);

    // add typing indicator
    setMessages((prev) => [...prev, { role: "bot", text: "...", time, typing: true }]);

    try {
      const res = await api.post("/symptoms", { symptoms: userText });

      setMessages((prev) => prev.filter((m) => !m.typing));

      if (res.data.ok) {
        const a = res.data.analysis;
        const urgencyEmoji = {
          low: "🟢",
          moderate: "🟡",
          high: "🟠",
          emergency: "🔴",
        }[a.urgency] || "🟡";

        const botText = `${urgencyEmoji} **Urgency: ${a.urgency.toUpperCase()}**\n\n` +
          `**Possible Conditions:** ${a.possibleConditions?.join(", ")}\n\n` +
          `**Recommended Specialist:** ${a.recommendedSpecialty}\n\n` +
          `**Advice:** ${a.advice}\n\n` +
          `_⚠️ This is guidance only — please consult a doctor for proper diagnosis._`;

        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text: botText,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            specialty: a.recommendedSpecialty,
            urgency: a.urgency,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: `❌ ${res.data.error || "Analysis failed. Please try again."}`, time },
        ]);
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => !m.typing));
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "❌ Could not connect to health assistant. Please try again.", time },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderText = (text) => {
    return text.split("\n").map((line, i) => {
      const bold = line.replace(/\*\*(.*?)\*\*/g, (_, t) => `<b>${t}</b>`);
      const italic = bold.replace(/_(.*?)_/g, (_, t) => `<i>${t}</i>`);
      return <div key={i} dangerouslySetInnerHTML={{ __html: italic || "&nbsp;" }} />;
    });
  };

  return (
    <div>
      <Navbar />
      <main style={styles.main}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.h1}>🤖 Health Assistant</h1>
            <p style={styles.sub}>
              AI-powered symptom analysis using Groq Llama 3.
              Describe your symptoms and get specialist recommendations instantly.
            </p>
          </div>
          <button
            style={styles.findBtn}
            onClick={() => navigate("/find-doctor")}
          >
            🔍 Find a Doctor
          </button>
        </div>

        <div style={styles.layout}>
          {/* Chat area */}
          <div style={styles.chatWrap}>
            {/* Messages */}
            <div style={styles.messages}>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    ...styles.msgRow,
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  {msg.role === "bot" && (
                    <div style={styles.avatar}>🤖</div>
                  )}
                  <div>
                    <div
                      style={{
                        ...styles.bubble,
                        ...(msg.role === "user" ? styles.userBubble : styles.botBubble),
                      }}
                    >
                      {msg.typing ? (
                        <div style={styles.typingDots}>
                          <span /><span /><span />
                        </div>
                      ) : (
                        renderText(msg.text)
                      )}
                    </div>
                    <div style={{
                      ...styles.msgTime,
                      textAlign: msg.role === "user" ? "right" : "left",
                    }}>
                      {msg.time}
                    </div>
                    {msg.specialty && (
                      <button
                        style={styles.bookBtn}
                        onClick={() => navigate("/find-doctor")}
                      >
                        Find {msg.specialty} Doctor →
                      </button>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div style={styles.userAvatar}>👤</div>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Quick replies */}
            <div style={styles.quickWrap}>
              {QUICK_REPLIES.map((q) => (
                <button
                  key={q}
                  style={styles.quickBtn}
                  onClick={() => sendMessage(q)}
                  disabled={loading}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div style={styles.inputRow}>
              <input
                style={styles.input}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Describe your symptoms..."
                disabled={loading}
              />
              <button
                style={{ ...styles.sendBtn, opacity: loading || !input.trim() ? 0.6 : 1 }}
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
              >
                {loading ? "⏳" : "Send →"}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div style={styles.sidebar}>
            <div style={styles.sideCard}>
              <div style={styles.sideTitle}>🧠 How it works</div>
              {[
                ["1", "Describe symptoms in plain language"],
                ["2", "AI analyses using Groq Llama 3"],
                ["3", "Get specialist recommendation"],
                ["4", "Book appointment with right doctor"],
              ].map(([n, t]) => (
                <div key={n} style={styles.sideStep}>
                  <span style={styles.sideNum}>{n}</span>
                  <span style={{ fontSize: 13 }}>{t}</span>
                </div>
              ))}
            </div>

            <div style={styles.sideCard}>
              <div style={styles.sideTitle}>⚠️ Urgency Guide</div>
              {[
                ["🟢", "Low", "Monitor at home"],
                ["🟡", "Moderate", "See doctor soon"],
                ["🟠", "High", "See doctor today"],
                ["🔴", "Emergency", "Call 111 now"],
              ].map(([e, l, d]) => (
                <div key={l} style={styles.urgencyRow}>
                  <span>{e} <b>{l}</b></span>
                  <span style={{ fontSize: 12, opacity: 0.7 }}>{d}</span>
                </div>
              ))}
            </div>

            <div style={styles.disclaimer}>
              <b>⚕️ Medical Disclaimer</b><br />
              This assistant provides general health guidance only.
              It does not diagnose conditions or replace professional
              medical advice. Always consult a qualified healthcare
              provider for medical decisions.
            </div>
          </div>
        </div>
      </main>
      <Footer />

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  main: { maxWidth: 1200, margin: "0 auto", padding: 24, fontFamily: "system-ui, sans-serif" },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    flexWrap: "wrap", gap: 12, marginBottom: 20,
  },
  h1: { margin: "0 0 6px", fontSize: 28, fontWeight: 900 },
  sub: { margin: 0, opacity: 0.75, maxWidth: 600, lineHeight: 1.5, fontSize: 14 },
  findBtn: {
    padding: "10px 20px", borderRadius: 12, border: "none",
    background: "#0f766e", color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 14,
  },
  layout: { display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" },
  chatWrap: {
    background: "#fff", borderRadius: 20, border: "1px solid #e2e8f0",
    overflow: "hidden", display: "flex", flexDirection: "column",
  },
  messages: {
    padding: 20, display: "flex", flexDirection: "column", gap: 16,
    minHeight: 400, maxHeight: 500, overflowY: "auto",
    background: "#f8fafc",
  },
  msgRow: { display: "flex", gap: 10, alignItems: "flex-end" },
  avatar: { fontSize: 28, flexShrink: 0 },
  userAvatar: { fontSize: 24, flexShrink: 0 },
  bubble: {
    maxWidth: 480, padding: "12px 16px", borderRadius: 16,
    fontSize: 14, lineHeight: 1.6,
  },
  botBubble: {
    background: "#fff", border: "1px solid #e2e8f0",
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    background: "#0f766e", color: "#fff",
    borderBottomRightRadius: 4,
  },
  msgTime: { fontSize: 11, opacity: 0.5, marginTop: 4, paddingLeft: 4 },
  typingDots: { display: "flex", gap: 4, padding: "4px 0" },
  bookBtn: {
    marginTop: 8, padding: "6px 12px", borderRadius: 8,
    border: "1px solid #0f766e", background: "#f0fdfa",
    color: "#0f766e", fontWeight: 800, cursor: "pointer", fontSize: 12,
  },
  quickWrap: {
    padding: "12px 16px", display: "flex", flexWrap: "wrap", gap: 8,
    borderTop: "1px solid #f0f0f0", background: "#fff",
  },
  quickBtn: {
    padding: "6px 12px", borderRadius: 20, border: "1px solid #e2e8f0",
    background: "#f8fafc", cursor: "pointer", fontSize: 12, fontWeight: 600,
    color: "#0f766e",
  },
  inputRow: {
    display: "flex", gap: 8, padding: "12px 16px",
    borderTop: "1px solid #e2e8f0", background: "#fff",
  },
  input: {
    flex: 1, padding: "12px 14px", borderRadius: 12,
    border: "1px solid #e2e8f0", fontSize: 14, outline: "none",
  },
  sendBtn: {
    padding: "12px 20px", borderRadius: 12, border: "none",
    background: "#0f766e", color: "#fff", fontWeight: 800,
    cursor: "pointer", fontSize: 14, whiteSpace: "nowrap",
  },
  sidebar: { display: "flex", flexDirection: "column", gap: 16 },
  sideCard: {
    background: "#fff", borderRadius: 16, padding: 16,
    border: "1px solid #e2e8f0",
  },
  sideTitle: { fontWeight: 900, color: "#0f766e", marginBottom: 12, fontSize: 14 },
  sideStep: { display: "flex", gap: 10, alignItems: "center", marginBottom: 10 },
  sideNum: {
    width: 24, height: 24, borderRadius: "50%", background: "#0f766e",
    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 900, fontSize: 12, flexShrink: 0,
  },
  urgencyRow: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", padding: "6px 0",
    borderBottom: "1px solid #f0f0f0", fontSize: 13,
  },
  disclaimer: {
    background: "#fff7ed", border: "1px solid rgba(234,88,12,0.2)",
    borderRadius: 12, padding: 14, fontSize: 12, lineHeight: 1.6, color: "#7c2d12",
  },
};
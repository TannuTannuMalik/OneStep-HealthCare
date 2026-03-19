import { useState, useRef, useEffect } from "react";
import { api } from "../utils/api";

const QUICK_REPLIES = [
  "I have a headache",
  "I have a fever",
  "Book an appointment",
  "View my reports",
  "Health tips",
  "I feel tired",
];

export default function ChatBot() {
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "👋 Hi! I'm your OneStep Health Assistant. I can help with symptoms, appointments, reports, and health tips. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;

    setMessages((prev) => [...prev, { from: "user", text: userText }]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/chat", { message: userText });
      if (res.data.ok) {
        setMessages((prev) => [
          ...prev,
          { from: "bot", text: res.data.response },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { from: "bot", text: "Sorry, something went wrong. Please try again." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Unable to reach the health assistant. Please check your connection." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.avatar}>🏥</div>
          <div>
            <div style={styles.headerTitle}>Health Assistant</div>
            <div style={styles.headerSub}>Always here to help</div>
          </div>
        </div>
        <div style={styles.onlineDot} title="Online" />
      </div>

      {/* Messages */}
      <div style={styles.messages}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.msgRow,
              justifyContent: msg.from === "user" ? "flex-end" : "flex-start",
            }}
          >
            {msg.from === "bot" && <div style={styles.botAvatar}>🤖</div>}
            <div
              style={
                msg.from === "user" ? styles.userBubble : styles.botBubble
              }
            >
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ ...styles.msgRow, justifyContent: "flex-start" }}>
            <div style={styles.botAvatar}>🤖</div>
            <div style={styles.botBubble}>
              <span style={styles.typing}>
                <span>.</span><span>.</span><span>.</span>
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      <div style={styles.quickReplies}>
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
          type="text"
          placeholder="Type your question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading}
          maxLength={500}
        />
        <button
          style={{
            ...styles.sendBtn,
            opacity: !input.trim() || loading ? 0.5 : 1,
          }}
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
        >
          ➤
        </button>
      </div>

      <div style={styles.disclaimer}>
        ⚠️ This assistant provides general guidance only. Always consult a doctor for medical advice.
      </div>

      <style>{`
        @keyframes blink {
          0%, 80%, 100% { opacity: 0; }
          40% { opacity: 1; }
        }
        .typing span {
          animation: blink 1.4s infinite both;
          font-size: 20px;
          line-height: 1;
        }
        .typing span:nth-child(2) { animation-delay: 0.2s; }
        .typing span:nth-child(3) { animation-delay: 0.4s; }
      `}</style>
    </div>
  );
}

const styles = {
  wrapper: {
    background: "#fff",
    border: "1px solid #eee",
    borderRadius: 16,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    fontFamily: "system-ui, sans-serif",
    boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
    marginTop: 16,
  },

  // Header
  header: {
    background: "#0f7f7c",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    fontSize: 24,
    background: "rgba(255,255,255,0.15)",
    borderRadius: "50%",
    width: 40,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontWeight: 900,
    fontSize: 15,
  },
  headerSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#4ade80",
    boxShadow: "0 0 6px #4ade80",
  },

  // Messages
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    minHeight: 280,
    maxHeight: 320,
    background: "#f9fafb",
  },
  msgRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
  },
  botAvatar: {
    fontSize: 20,
    flexShrink: 0,
  },
  botBubble: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px 16px 16px 4px",
    padding: "10px 14px",
    fontSize: 13,
    color: "#111",
    maxWidth: "75%",
    lineHeight: 1.5,
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  userBubble: {
    background: "#0f7f7c",
    borderRadius: "16px 16px 4px 16px",
    padding: "10px 14px",
    fontSize: 13,
    color: "#fff",
    maxWidth: "75%",
    lineHeight: 1.5,
  },
  typing: {
    display: "flex",
    gap: 2,
  },

  // Quick replies
  quickReplies: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    padding: "10px 14px",
    borderTop: "1px solid #f0f0f0",
    background: "#fff",
  },
  quickBtn: {
    padding: "5px 10px",
    borderRadius: 20,
    border: "1px solid #0f7f7c",
    background: "#fff",
    color: "#0f7f7c",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.15s",
  },

  // Input
  inputRow: {
    display: "flex",
    gap: 8,
    padding: "10px 14px",
    borderTop: "1px solid #f0f0f0",
    background: "#fff",
  },
  input: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    fontSize: 13,
    outline: "none",
    fontFamily: "system-ui, sans-serif",
  },
  sendBtn: {
    padding: "10px 16px",
    borderRadius: 10,
    border: "none",
    background: "#0f7f7c",
    color: "#fff",
    fontWeight: 900,
    fontSize: 16,
    cursor: "pointer",
    transition: "opacity 0.15s",
  },

  // Disclaimer
  disclaimer: {
    padding: "8px 14px",
    fontSize: 10,
    color: "#999",
    background: "#fff",
    borderTop: "1px solid #f0f0f0",
    textAlign: "center",
  },
};

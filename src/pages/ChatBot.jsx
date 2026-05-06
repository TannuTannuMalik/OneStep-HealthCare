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
      text:
        "👋 Hi! I'm your OneStep Health Assistant. I can help with symptoms, appointments, reports, and health tips.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ NEW
  const [open, setOpen] = useState(false);

  const bottomRef = useRef(null);

  // ✅ OPEN FROM NAVBAR
  useEffect(() => {
    const openChat = () => {
      setOpen(true);
    };

    window.addEventListener(
      "open-health-chat",
      openChat
    );

    return () => {
      window.removeEventListener(
        "open-health-chat",
        openChat
      );
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();

    if (!userText || loading) return;

    setMessages((prev) => [
      ...prev,
      {
        from: "user",
        text: userText,
      },
    ]);

    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/chat", {
        message: userText,
      });

      if (res.data.ok) {
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text: res.data.response,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text:
              "Sorry, something went wrong.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text:
            "Unable to connect to health assistant.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {
      e.preventDefault();

      sendMessage();
    }
  };

  return (
    <>
      {/* FLOATING BUTTON */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={styles.floatingBtn}
        >
          💬
        </button>
      )}

      {/* CHAT WINDOW */}
      {open && (
        <div style={styles.wrapper}>
          {/* HEADER */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.avatar}>
                🏥
              </div>

              <div>
                <div
                  style={styles.headerTitle}
                >
                  Health Assistant
                </div>

                <div
                  style={styles.headerSub}
                >
                  Online now
                </div>
              </div>
            </div>

            <button
              onClick={() =>
                setOpen(false)
              }
              style={styles.closeBtn}
            >
              ✕
            </button>
          </div>

          {/* MESSAGES */}
          <div style={styles.messages}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  ...styles.msgRow,
                  justifyContent:
                    msg.from === "user"
                      ? "flex-end"
                      : "flex-start",
                }}
              >
                {msg.from === "bot" && (
                  <div
                    style={
                      styles.botAvatar
                    }
                  >
                    🤖
                  </div>
                )}

                <div
                  style={
                    msg.from === "user"
                      ? styles.userBubble
                      : styles.botBubble
                  }
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div
                style={{
                  ...styles.msgRow,
                  justifyContent:
                    "flex-start",
                }}
              >
                <div
                  style={styles.botAvatar}
                >
                  🤖
                </div>

                <div
                  style={styles.botBubble}
                >
                  Typing...
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* QUICK REPLIES */}
          <div style={styles.quickReplies}>
            {QUICK_REPLIES.map((q) => (
              <button
                key={q}
                style={styles.quickBtn}
                onClick={() =>
                  sendMessage(q)
                }
              >
                {q}
              </button>
            ))}
          </div>

          {/* INPUT */}
          <div style={styles.inputRow}>
            <input
              style={styles.input}
              value={input}
              onChange={(e) =>
                setInput(
                  e.target.value
                )
              }
              onKeyDown={handleKey}
              placeholder="Ask health assistant..."
            />

            <button
              onClick={() =>
                sendMessage()
              }
              style={styles.sendBtn}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  floatingBtn: {
    position: "fixed",
    right: 24,
    bottom: 24,
    width: 68,
    height: 68,
    borderRadius: "50%",
    border: "none",
    background:
      "linear-gradient(135deg,#0f766e,#14b8a6)",
    color: "#fff",
    fontSize: 28,
    cursor: "pointer",
    zIndex: 9999,
    boxShadow:
      "0 14px 30px rgba(20,184,166,0.35)",
  },

  wrapper: {
    position: "fixed",
    right: 24,
    bottom: 24,
    width: 390,
    height: 620,
    background: "#fff",
    borderRadius: 28,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow:
      "0 20px 60px rgba(0,0,0,0.16)",
    zIndex: 9999,
  },

  header: {
    background:
      "linear-gradient(135deg,#0f766e,#14b8a6)",
    padding: "18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    background:
      "rgba(255,255,255,0.15)",
    display: "grid",
    placeItems: "center",
    fontSize: 24,
  },

  headerTitle: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 18,
  },

  headerSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
  },

  closeBtn: {
    border: "none",
    background: "transparent",
    color: "#fff",
    fontSize: 22,
    cursor: "pointer",
  },

  messages: {
    flex: 1,
    overflowY: "auto",
    padding: 18,
    background: "#f8fafc",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  msgRow: {
    display: "flex",
    gap: 8,
  },

  botAvatar: {
    fontSize: 20,
  },

  botBubble: {
    background: "#fff",
    padding: "12px 16px",
    borderRadius:
      "18px 18px 18px 6px",
    maxWidth: "75%",
    fontSize: 14,
    lineHeight: 1.6,
  },

  userBubble: {
    background:
      "linear-gradient(135deg,#0f766e,#14b8a6)",
    color: "#fff",
    padding: "12px 16px",
    borderRadius:
      "18px 18px 6px 18px",
    maxWidth: "75%",
    fontSize: 14,
    lineHeight: 1.6,
  },

  quickReplies: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    padding: 14,
    borderTop:
      "1px solid rgba(0,0,0,0.06)",
  },

  quickBtn: {
    border:
      "1px solid rgba(15,118,110,0.2)",
    background: "#fff",
    color: "#0f766e",
    padding: "8px 12px",
    borderRadius: 999,
    cursor: "pointer",
    fontWeight: "700",
    fontSize: 12,
  },

  inputRow: {
    display: "flex",
    gap: 10,
    padding: 14,
    borderTop:
      "1px solid rgba(0,0,0,0.06)",
  },

  input: {
    flex: 1,
    padding: "14px",
    borderRadius: 14,
    border: "1px solid #dbe2ea",
    outline: "none",
  },

  sendBtn: {
    width: 54,
    borderRadius: 14,
    border: "none",
    background:
      "linear-gradient(135deg,#0f766e,#14b8a6)",
    color: "#fff",
    fontWeight: "900",
    cursor: "pointer",
  },
};
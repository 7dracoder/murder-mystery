import { useEffect, useRef, useState, FormEvent } from "react";
import type { Message } from "../App";

const CHARACTER_NAMES: Record<string, { name: string; color: string }> = {
  // Matched by content prefix — fallback to inboxId
};

const CHAR_PATTERNS: Array<{ pattern: RegExp; name: string; color: string }> = [
  { pattern: /^Game Master:/i, name: "Game Master", color: "#C9A96E" },
  { pattern: /^Edmund/i, name: "Edmund (Butler)", color: "#4A7C59" },
  { pattern: /^Lady Victoria/i, name: "Lady Victoria", color: "#9B59B6" },
  { pattern: /^Dr\. Helena/i, name: "Dr. Helena", color: "#3498DB" },
  { pattern: /^Mr\. Sterling/i, name: "Mr. Sterling", color: "#C0392B" },
  { pattern: /^Inspector Grey/i, name: "Inspector Grey", color: "#7F8C8D" },
];

function getCharInfo(content: string): { name: string; color: string } | null {
  for (const p of CHAR_PATTERNS) {
    if (p.pattern.test(content)) return { name: p.name, color: p.color };
  }
  return null;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface Props {
  messages: Message[];
  onSend: (content: string) => Promise<void>;
}

export default function ChatPanel({ messages, onSend }: Props) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    setInput("");
    try {
      await onSend(content);
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="glass-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderLeft: "1px solid rgba(201,169,110,0.2)",
        borderRight: "none",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid rgba(201,169,110,0.15)",
          flexShrink: 0,
        }}
      >
        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "1rem",
            color: "var(--gold)",
            letterSpacing: "0.05em",
          }}
        >
          Investigation Log
        </h2>
        <p style={{ fontSize: "0.65rem", color: "rgba(245,230,200,0.4)", marginTop: 2 }}>
          {messages.length} messages
        </p>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: "rgba(245,230,200,0.3)",
              fontSize: "0.75rem",
              marginTop: 40,
              fontStyle: "italic",
            }}
          >
            The manor awaits...
          </div>
        )}
        {messages.map((msg) => {
          const charInfo = getCharInfo(msg.content);
          const isGM = charInfo?.name === "Game Master";
          return (
            <div
              key={msg.id}
              className="fade-in"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 3,
              }}
            >
              {/* Sender label */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {charInfo && (
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: charInfo.color,
                      boxShadow: `0 0 6px ${charInfo.color}`,
                      flexShrink: 0,
                    }}
                  />
                )}
                <span
                  style={{
                    fontSize: "0.65rem",
                    color: charInfo ? charInfo.color : "rgba(245,230,200,0.4)",
                    letterSpacing: "0.08em",
                    fontWeight: 600,
                  }}
                >
                  {charInfo ? charInfo.name : `${msg.senderInboxId.slice(0, 8)}...`}
                </span>
                <span style={{ fontSize: "0.6rem", color: "rgba(245,230,200,0.25)", marginLeft: "auto" }}>
                  {formatTime(msg.sentAt)}
                </span>
              </div>

              {/* Content */}
              <div
                style={{
                  background: isGM
                    ? "rgba(201,169,110,0.08)"
                    : "rgba(255,255,255,0.03)",
                  border: isGM
                    ? "1px solid rgba(201,169,110,0.2)"
                    : "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 4,
                  padding: "8px 10px",
                  fontSize: "0.78rem",
                  lineHeight: 1.5,
                  color: "var(--parchment)",
                  fontFamily: isGM ? "'Playfair Display', serif" : "'Special Elite', cursive",
                }}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          borderTop: "1px solid rgba(201,169,110,0.15)",
          padding: "12px 16px",
          display: "flex",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Speak to the manor..."
          disabled={sending}
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(201,169,110,0.2)",
            borderRadius: 4,
            padding: "8px 10px",
            color: "var(--parchment)",
            fontFamily: "'Special Elite', cursive",
            fontSize: "0.78rem",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          style={{
            background: "rgba(201,169,110,0.15)",
            border: "1px solid var(--gold)",
            color: "var(--gold)",
            fontFamily: "'Special Elite', cursive",
            fontSize: "0.75rem",
            padding: "8px 14px",
            cursor: sending || !input.trim() ? "not-allowed" : "pointer",
            opacity: sending || !input.trim() ? 0.4 : 1,
            borderRadius: 4,
            transition: "all 0.2s",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

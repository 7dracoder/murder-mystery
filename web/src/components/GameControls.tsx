import { useState } from "react";

interface Props {
  onSend: (content: string) => Promise<void>;
}

const SUSPECTS = [
  "Edmund (Butler)",
  "Lady Victoria",
  "Dr. Helena",
  "Mr. Sterling",
  "Inspector Grey",
];

export default function GameControls({ onSend }: Props) {
  const [accuseOpen, setAccuseOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  async function send(cmd: string, key: string) {
    setLoading(key);
    try {
      await onSend(cmd);
    } finally {
      setLoading(null);
    }
  }

  async function handleAccuse(name: string) {
    setAccuseOpen(false);
    const lower = name.toLowerCase().replace(/[^a-z ]/g, "").trim();
    const first = lower.split(" ")[0];
    await send(`/accuse ${first}`, "accuse");
  }

  const btnStyle = (key: string, accent: string) => ({
    display: "block",
    width: "100%",
    padding: "10px 18px",
    background: `${accent}18`,
    border: `1px solid ${accent}66`,
    color: accent,
    fontFamily: "'Special Elite', cursive",
    fontSize: "0.78rem",
    letterSpacing: "0.08em",
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading === key ? 0.5 : 1,
    transition: "all 0.2s",
    textAlign: "left" as const,
    borderRadius: 4,
  });

  return (
    <div
      className="glass-panel"
      style={{
        padding: "12px",
        borderRadius: 6,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minWidth: 200,
      }}
    >
      <div
        style={{
          fontSize: "0.6rem",
          color: "rgba(245,230,200,0.3)",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          marginBottom: 2,
        }}
      >
        Investigation
      </div>

      <button
        style={btnStyle("start", "#C9A96E")}
        onClick={() => send("/start", "start")}
        disabled={!!loading}
        onMouseEnter={(e) => { (e.target as HTMLElement).style.background = "#C9A96E33"; }}
        onMouseLeave={(e) => { (e.target as HTMLElement).style.background = "#C9A96E18"; }}
      >
        ⚔ Begin Investigation
      </button>

      <button
        style={btnStyle("hint", "#3498DB")}
        onClick={() => send("/hint", "hint")}
        disabled={!!loading}
        onMouseEnter={(e) => { (e.target as HTMLElement).style.background = "#3498DB33"; }}
        onMouseLeave={(e) => { (e.target as HTMLElement).style.background = "#3498DB18"; }}
      >
        🔍 Request Clue
      </button>

      <div style={{ position: "relative" }}>
        <button
          style={{ ...btnStyle("accuse", "#C0392B"), width: "100%" }}
          onClick={() => setAccuseOpen(!accuseOpen)}
          disabled={!!loading}
          onMouseEnter={(e) => { (e.target as HTMLElement).style.background = "#C0392B33"; }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.background = "#C0392B18"; }}
        >
          ✝ Make Accusation ▾
        </button>

        {accuseOpen && (
          <div
            style={{
              position: "absolute",
              bottom: "calc(100% + 4px)",
              left: 0,
              right: 0,
              background: "rgba(8,6,15,0.96)",
              border: "1px solid rgba(192,57,43,0.4)",
              backdropFilter: "blur(12px)",
              borderRadius: 4,
              overflow: "hidden",
              zIndex: 20,
            }}
          >
            {SUSPECTS.map((s) => (
              <button
                key={s}
                onClick={() => handleAccuse(s)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "8px 14px",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid rgba(192,57,43,0.15)",
                  color: "rgba(245,230,200,0.75)",
                  fontFamily: "'Special Elite', cursive",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.background = "rgba(192,57,43,0.2)"; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.background = "transparent"; }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

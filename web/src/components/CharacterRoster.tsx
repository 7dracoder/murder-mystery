import type { Message } from "../App";

interface Character {
  id: string;
  name: string;
  role: string;
  color: string;
  initials: string;
  pattern: RegExp;
}

const CHARACTERS: Character[] = [
  { id: "gm", name: "Game Master", role: "Narrator", color: "#C9A96E", initials: "GM", pattern: /^Game Master:/i },
  { id: "butler", name: "Edmund", role: "The Butler", color: "#4A7C59", initials: "EG", pattern: /^Edmund/i },
  { id: "widow", name: "Lady Victoria", role: "The Widow", color: "#9B59B6", initials: "LV", pattern: /^Lady Victoria/i },
  { id: "scientist", name: "Dr. Helena", role: "The Scientist", color: "#3498DB", initials: "HC", pattern: /^Dr\. Helena/i },
  { id: "banker", name: "Mr. Sterling", role: "The Banker", color: "#C0392B", initials: "MS", pattern: /^Mr\. Sterling/i },
  { id: "detective", name: "Inspector Grey", role: "The Detective", color: "#7F8C8D", initials: "IG", pattern: /^Inspector Grey/i },
];

interface Props {
  activeSpeaker: string | null;
  messages: Message[];
}

export default function CharacterRoster({ messages }: Props) {
  // Find the last message per character
  const lastMessages: Record<string, string> = {};
  for (const msg of messages) {
    for (const char of CHARACTERS) {
      if (char.pattern.test(msg.content)) {
        lastMessages[char.id] = msg.content.split(":").slice(1).join(":").trim().slice(0, 60);
      }
    }
  }

  // Find the most recently active character
  const lastMsg = messages[messages.length - 1];
  let activeName: string | null = null;
  if (lastMsg) {
    for (const char of CHARACTERS) {
      if (char.pattern.test(lastMsg.content)) {
        activeName = char.id;
        break;
      }
    }
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "nowrap",
        overflowX: "auto",
        padding: "2px 0",
      }}
    >
      {CHARACTERS.map((char) => {
        const isActive = activeName === char.id;
        const lastLine = lastMessages[char.id];
        return (
          <div
            key={char.id}
            className="glass-panel"
            style={{
              minWidth: 100,
              padding: "8px 10px",
              borderRadius: 4,
              border: isActive
                ? `1px solid ${char.color}`
                : "1px solid rgba(255,255,255,0.06)",
              boxShadow: isActive
                ? `0 0 12px ${char.color}55, 0 0 24px ${char.color}22`
                : "none",
              transition: "all 0.4s ease",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Active glow bar */}
            {isActive && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: `linear-gradient(90deg, transparent, ${char.color}, transparent)`,
                  animation: "pulse-glow 1.5s ease-in-out infinite",
                }}
              />
            )}

            {/* Avatar */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: `${char.color}22`,
                  border: `1.5px solid ${char.color}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  color: char.color,
                  flexShrink: 0,
                }}
              >
                {char.initials}
              </div>
              <div>
                <div style={{ fontSize: "0.68rem", color: char.color, fontWeight: 600, whiteSpace: "nowrap" }}>
                  {char.name}
                </div>
                <div style={{ fontSize: "0.58rem", color: "rgba(245,230,200,0.35)", whiteSpace: "nowrap" }}>
                  {char.role}
                </div>
              </div>
            </div>

            {/* Last message snippet */}
            {lastLine && (
              <div
                style={{
                  fontSize: "0.6rem",
                  color: "rgba(245,230,200,0.4)",
                  fontStyle: "italic",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: 130,
                }}
              >
                "{lastLine}"
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

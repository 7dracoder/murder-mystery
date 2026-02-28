import { useEffect, useState, FormEvent } from "react";

interface Member {
  inboxId: string;
  addresses: string[];
}

interface Props {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [addInput, setAddInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadMembers() {
    setLoading(true);
    try {
      const res = await fetch("/api/members");
      const data = await res.json();
      setMembers(data);
    } catch (err) {
      setError("Failed to load members");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const val = addInput.trim();
    if (!val) return;
    setAdding(true);
    setError(null);
    setSuccess(null);
    try {
      const body = val.startsWith("0x")
        ? { address: val }
        : { inboxId: val };
      const res = await fetch("/api/members/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.ok) {
        setSuccess("Member added successfully");
        setAddInput("");
        await loadMembers();
      } else {
        setError(data.error || "Failed to add member");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(inboxId: string) {
    setRemoving(inboxId);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/members/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inboxId }),
      });
      const data = await res.json();
      if (data.ok) {
        setSuccess("Member removed");
        await loadMembers();
      } else {
        setError(data.error || "Failed to remove member");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="glass-panel"
        style={{
          width: 480,
          maxWidth: "90vw",
          maxHeight: "80vh",
          borderRadius: 8,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(201,169,110,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.1rem",
              color: "var(--gold)",
            }}
          >
            Manage Guests
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(245,230,200,0.4)",
              fontSize: "1.2rem",
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Add member */}
          <div>
            <div style={{ fontSize: "0.7rem", color: "rgba(245,230,200,0.4)", letterSpacing: "0.15em", marginBottom: 8, textTransform: "uppercase" }}>
              Add Guest
            </div>
            <form onSubmit={handleAdd} style={{ display: "flex", gap: 8 }}>
              <input
                value={addInput}
                onChange={(e) => setAddInput(e.target.value)}
                placeholder="0x address or inboxId"
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(201,169,110,0.2)",
                  borderRadius: 4,
                  padding: "8px 10px",
                  color: "var(--parchment)",
                  fontFamily: "'Special Elite', cursive",
                  fontSize: "0.75rem",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={adding || !addInput.trim()}
                style={{
                  background: "rgba(201,169,110,0.15)",
                  border: "1px solid var(--gold)",
                  color: "var(--gold)",
                  fontFamily: "'Special Elite', cursive",
                  fontSize: "0.75rem",
                  padding: "8px 16px",
                  cursor: adding || !addInput.trim() ? "not-allowed" : "pointer",
                  opacity: adding || !addInput.trim() ? 0.4 : 1,
                  borderRadius: 4,
                }}
              >
                {adding ? "Adding..." : "Add"}
              </button>
            </form>
          </div>

          {/* Status */}
          {error && (
            <div style={{ color: "#f44336", fontSize: "0.75rem", background: "rgba(244,67,54,0.1)", padding: "8px 12px", borderRadius: 4, border: "1px solid rgba(244,67,54,0.3)" }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ color: "#4caf50", fontSize: "0.75rem", background: "rgba(76,175,80,0.1)", padding: "8px 12px", borderRadius: 4, border: "1px solid rgba(76,175,80,0.3)" }}>
              {success}
            </div>
          )}

          {/* Member list */}
          <div>
            <div style={{ fontSize: "0.7rem", color: "rgba(245,230,200,0.4)", letterSpacing: "0.15em", marginBottom: 8, textTransform: "uppercase" }}>
              Current Guests ({loading ? "..." : members.length})
            </div>
            {loading ? (
              <div style={{ color: "rgba(245,230,200,0.3)", fontSize: "0.75rem" }}>Loading...</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {members.map((m) => (
                  <div
                    key={m.inboxId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 12px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 4,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.7rem", color: "rgba(245,230,200,0.6)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {m.inboxId}
                      </div>
                      {m.addresses.length > 0 && (
                        <div style={{ fontSize: "0.63rem", color: "rgba(245,230,200,0.3)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                          {m.addresses[0]}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemove(m.inboxId)}
                      disabled={removing === m.inboxId}
                      style={{
                        background: "rgba(192,57,43,0.15)",
                        border: "1px solid rgba(192,57,43,0.4)",
                        color: "#C0392B",
                        fontFamily: "'Special Elite', cursive",
                        fontSize: "0.65rem",
                        padding: "4px 10px",
                        cursor: removing === m.inboxId ? "not-allowed" : "pointer",
                        opacity: removing === m.inboxId ? 0.4 : 1,
                        borderRadius: 3,
                        flexShrink: 0,
                      }}
                    >
                      {removing === m.inboxId ? "..." : "Remove"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

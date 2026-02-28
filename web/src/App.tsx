import { useEffect, useRef, useState, useCallback } from "react";
import Scene3D from "./components/Scene3D";
import ChatPanel from "./components/ChatPanel";
import CharacterRoster from "./components/CharacterRoster";
import GameControls from "./components/GameControls";
import AdminPanel from "./components/AdminPanel";

export interface Message {
  id: string;
  senderInboxId: string;
  content: string;
  sentAt: number;
}

type WsStatus = "connecting" | "connected" | "disconnected";

// In dev: ws://localhost:3001
// In prod: set VITE_WS_URL=wss://your-backend.railway.app (or ngrok URL)
// In dev: ws://localhost:3001
// In prod: set VITE_WS_URL=wss://your-backend.railway.app
const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:3001";
// In dev: http://localhost:3001 (proxied via vite as /api)
// In prod: set VITE_API_URL=https://your-backend.railway.app
const API_BASE = import.meta.env.VITE_API_URL ?? "";

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [wsStatus, setWsStatus] = useState<WsStatus>("connecting");
  const [showAdmin, setShowAdmin] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    setWsStatus("connecting");

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus("connected");
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "history") {
          setMessages(payload.data);
        } else if (payload.type === "message") {
          setMessages((prev) => [...prev, payload.data]);
          // Set active speaker for 4 seconds
          setActiveSpeaker(payload.data.senderInboxId);
          setTimeout(() => setActiveSpeaker(null), 4000);
        }
      } catch {
        // ignore malformed
      }
    };

    ws.onclose = () => {
      setWsStatus("disconnected");
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connect]);

  const sendMessage = useCallback(async (content: string) => {
    await fetch(`${API_BASE}/api/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden" }}>
      {/* 3D Background */}
      <div style={{ position: "absolute", inset: 0 }}>
        <Scene3D />
      </div>

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
          pointerEvents: "none",
          zIndex: 10,
        }}
      >
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "2.2rem",
            color: "var(--gold)",
            letterSpacing: "0.1em",
            textShadow: "0 0 30px rgba(201,169,110,0.6), 0 2px 4px rgba(0,0,0,0.8)",
            lineHeight: 1,
          }}
        >
          Blackwood Manor
        </h1>
        <p
          style={{
            fontFamily: "'Special Elite', cursive",
            fontSize: "0.75rem",
            color: "rgba(245,230,200,0.5)",
            letterSpacing: "0.3em",
            marginTop: 6,
            textTransform: "uppercase",
          }}
        >
          A Murder Mystery — 1923
        </p>
      </div>

      {/* Connection status */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          display: "flex",
          alignItems: "center",
          gap: 8,
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background:
              wsStatus === "connected"
                ? "#4caf50"
                : wsStatus === "connecting"
                ? "#ff9800"
                : "#f44336",
            boxShadow:
              wsStatus === "connected"
                ? "0 0 8px #4caf50"
                : wsStatus === "connecting"
                ? "0 0 8px #ff9800"
                : "0 0 8px #f44336",
            animation: wsStatus === "connecting" ? "dot-blink 1s infinite" : "none",
          }}
        />
        <span style={{ fontSize: "0.7rem", color: "rgba(245,230,200,0.5)", letterSpacing: "0.1em" }}>
          {wsStatus === "connected" ? "XMTP Connected" : wsStatus === "connecting" ? "Connecting..." : "Disconnected"}
        </span>
      </div>

      {/* Manage Guests button */}
      <button
        onClick={() => setShowAdmin(true)}
        style={{
          position: "absolute",
          top: 20,
          right: 360,
          zIndex: 10,
          background: "transparent",
          border: "1px solid var(--gold)",
          color: "var(--gold)",
          fontFamily: "'Special Elite', cursive",
          fontSize: "0.75rem",
          letterSpacing: "0.1em",
          padding: "8px 16px",
          cursor: "pointer",
          backdropFilter: "blur(8px)",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLButtonElement).style.background = "rgba(201,169,110,0.15)";
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.background = "transparent";
        }}
      >
        ⚙ Manage Guests
      </button>

      {/* Game Controls — bottom left */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          left: 24,
          zIndex: 10,
        }}
      >
        <GameControls onSend={sendMessage} />
      </div>

      {/* Character Roster — bottom strip */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 24,
          right: 356,
          zIndex: 10,
        }}
      >
        <CharacterRoster activeSpeaker={activeSpeaker} messages={messages} />
      </div>

      {/* Chat Panel — right edge */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 340,
          height: "100vh",
          zIndex: 10,
        }}
      >
        <ChatPanel messages={messages} onSend={sendMessage} />
      </div>

      {/* Admin Panel Modal */}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </div>
  );
}

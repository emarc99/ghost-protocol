"use client";

import React from "react";
import { Terminal } from "lucide-react";

interface LogEntry {
  id: string;
  time: string;
  text: string;
  type: "info" | "success" | "alert" | "warn";
}

interface TerminalLogProps {
  logs: LogEntry[];
  title?: string;
  maxHeight?: string;
}

export function TerminalLog({ logs, title = "SYSTEM EVENT STREAM", maxHeight = "240px" }: TerminalLogProps) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px", borderBottom: "1px solid var(--border-subtle)", fontSize: "9px", color: "var(--text-muted)", background: "rgba(0,0,0,0.2)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Terminal size={11} color="var(--cyan)" />
          <span>{title}</span>
        </span>
        <span>{logs.length} EVENTS</span>
      </div>

      <div className="event-feed" style={{ maxHeight }}>
        {logs.length === 0 ? (
          <div style={{ color: "var(--text-muted)", fontSize: "10px", padding: "12px 0", textAlign: "center" }}>
            Awaiting system events...
          </div>
        ) : (
          logs.map((l) => (
            <div key={l.id} className="feed-row">
              <span className={`feed-pip ${l.type}`} />
              <span className="feed-time">[{l.time}]</span>
              <span
                style={{
                  color:
                    l.type === "alert"
                      ? "var(--red)"
                      : l.type === "warn"
                      ? "var(--amber)"
                      : l.type === "success"
                      ? "var(--emerald)"
                      : "var(--text-secondary)",
                  wordBreak: "break-all"
                }}
              >
                {l.text}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

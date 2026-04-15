import { CheckCircle2 } from "lucide-react";

const objectives = [
  "Represent a computer network as a weighted directed graph.",
  "Detect unreachable routers after faults using BFS.",
  "Explore alternate directed paths using DFS.",
  "Maintain efficient router lookup with BST.",
  "Generate a practical recovery plan with latency awareness.",
];

export default function AboutPage() {
  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        background: "radial-gradient(circle at 10% 10%, #102847 0%, #070d1a 42%, #04070f 100%)",
        padding: "26px 18px 34px",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gap: 16 }}>
        <section
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 16,
            background: "rgba(6, 12, 24, 0.72)",
            padding: 20,
          }}
        >
          <h1 style={{ fontSize: 28, marginBottom: 10 }}>About The Project</h1>
          <p style={{ lineHeight: 1.7, color: "rgba(255,255,255,0.82)" }}>
            This mini-project, Network Fault Detector and Recovery Planner, models a real network as a
            weighted directed graph where routers are nodes and links are directed edges with latency.
            When a router fails, the system immediately analyzes who can still communicate and suggests
            a recovery route to keep traffic flowing.
          </p>
          <p style={{ marginTop: 12, lineHeight: 1.7, color: "rgba(255,255,255,0.76)" }}>
            The core idea from your report is simple: automate fault analysis so teams do not rely on
            manual guessing during outages. The system combines graph traversal and search-tree indexing
            to make fault detection and recovery planning fast and explainable.
          </p>
        </section>

        <section
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 16,
            background: "rgba(6, 12, 24, 0.72)",
            padding: 20,
          }}
        >
          <h2 style={{ fontSize: 22, marginBottom: 14 }}>Objectives (From FA-2 Report)</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {objectives.map((item) => (
              <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <CheckCircle2 size={18} style={{ marginTop: 2, color: "#00d4ff", flexShrink: 0 }} />
                <p style={{ lineHeight: 1.6, color: "rgba(255,255,255,0.82)" }}>{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 16,
            background: "rgba(6, 12, 24, 0.72)",
            padding: 20,
          }}
        >
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>Why Directed Graphs Matter</h2>
          <p style={{ lineHeight: 1.7, color: "rgba(255,255,255,0.8)" }}>
            Real routing is often asymmetric. If Router A can send packets to Router B, that does not
            guarantee Router B can return through the same link. That is why this project uses directed
            edges. It makes the simulation closer to real ISP, enterprise, and data-center behavior.
          </p>
        </section>
      </div>
    </div>
  );
}

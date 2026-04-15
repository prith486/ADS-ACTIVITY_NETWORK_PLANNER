const modules = [
  "Graph Builder",
  "BFS Module",
  "DFS Module",
  "BST Module",
  "Recovery Planner",
  "Visualization + Console",
];

const constraints = [
  "Directed and bidirectional links based on user input.",
  "Edge weights represent latency in milliseconds.",
  "Duplicate router IDs are not allowed.",
  "Static input model suitable for simulation and teaching.",
];

export default function DesignPage() {
  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        background: "radial-gradient(circle at 0% 100%, #3a1f0f 0%, #110b1c 40%, #05070e 100%)",
        padding: "26px 18px 34px",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gap: 16 }}>
        <section
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 16,
            background: "rgba(8, 11, 22, 0.72)",
            padding: 20,
          }}
        >
          <h1 style={{ fontSize: 28, marginBottom: 10 }}>System Design</h1>
          <p style={{ lineHeight: 1.7, color: "rgba(255,255,255,0.82)" }}>
            The architecture follows a clean processing pipeline from your report:
            Input → Graph Construction → BFS/DFS/BST Processing → Recovery Decision → Visual Output.
          </p>
        </section>

        <section
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 16,
            background: "rgba(8, 11, 22, 0.72)",
            padding: 20,
          }}
        >
          <h2 style={{ fontSize: 22, marginBottom: 14 }}>Project Modules</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
            {modules.map((moduleName) => (
              <div
                key={moduleName}
                style={{
                  border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: 12,
                  padding: "12px 14px",
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(255,255,255,0.9)",
                  fontWeight: 600,
                }}
              >
                {moduleName}
              </div>
            ))}
          </div>
        </section>

        <section
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 16,
            background: "rgba(8, 11, 22, 0.72)",
            padding: 20,
          }}
        >
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>Data Structures Used</h2>
          <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8, color: "rgba(255,255,255,0.82)", lineHeight: 1.6 }}>
            <li>Adjacency List Graph for network representation</li>
            <li>Queue for BFS traversal</li>
            <li>Recursion stack for DFS backtracking</li>
            <li>Binary Search Tree for router indexing and lookup</li>
            <li>Active status tracking to model failed routers</li>
          </ul>
        </section>

        <section
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 16,
            background: "rgba(8, 11, 22, 0.72)",
            padding: 20,
          }}
        >
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>Constraints and Scope</h2>
          <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8, color: "rgba(255,255,255,0.82)", lineHeight: 1.6 }}>
            {constraints.map((constraint) => (
              <li key={constraint}>{constraint}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

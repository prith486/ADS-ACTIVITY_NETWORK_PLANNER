const algoCards = [
  {
    title: "BFS - Fault Detection",
    color: "#4db8ff",
    points: [
      "Starts from a source router and explores level by level.",
      "Follows directed outgoing links only.",
      "Routers not visited are marked unreachable.",
      "Time complexity: O(V + E).",
    ],
  },
  {
    title: "DFS - Alternate Path Discovery",
    color: "#00ff88",
    points: [
      "Explores one directed route deeply, then backtracks.",
      "Finds all valid alternate routes from source to destination.",
      "Useful when primary route fails and backups are needed.",
      "Time complexity: O(V + E) for traversal, plus path enumeration.",
    ],
  },
  {
    title: "BST - Fast Router Lookup",
    color: "#ffd700",
    points: [
      "Stores router IDs for quick indexing operations.",
      "Search, insert and lookup are efficient on average.",
      "Supports scalability better than linear scans.",
      "Average complexity: O(log n).",
    ],
  },
];

export default function AlgorithmPage() {
  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        background: "radial-gradient(circle at 90% 0%, #23300f 0%, #0a0f1e 40%, #06070c 100%)",
        padding: "26px 18px 34px",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gap: 16 }}>
        <section
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 16,
            background: "rgba(7, 12, 24, 0.72)",
            padding: 20,
          }}
        >
          <h1 style={{ fontSize: 28, marginBottom: 10 }}>Algorithm Core</h1>
          <p style={{ lineHeight: 1.7, color: "rgba(255,255,255,0.82)" }}>
            The project combines three data-structure techniques from your FA-2 report: BFS for fault
            reachability, DFS for alternate directed paths, and BST for efficient router indexing.
          </p>
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
          {algoCards.map((card) => (
            <article
              key={card.title}
              style={{
                border: `1px solid ${card.color}55`,
                borderRadius: 16,
                background: "rgba(5, 10, 20, 0.78)",
                padding: 16,
              }}
            >
              <h2 style={{ color: card.color, marginBottom: 10, fontSize: 18 }}>{card.title}</h2>
              <ul style={{ margin: 0, paddingLeft: 16, display: "grid", gap: 7, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
                {card.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <section
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 16,
            background: "rgba(7, 12, 24, 0.72)",
            padding: 20,
          }}
        >
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>Recovery Path Selection Strategy</h2>
          <p style={{ color: "rgba(255,255,255,0.82)", lineHeight: 1.7 }}>
            After DFS lists all directed candidate paths, the planner scores each path using total latency
            (sum of edge weights). The path with the lowest latency is selected as the recommended recovery
            route. In simple words: first find all roads, then pick the fastest detour.
          </p>
        </section>
      </div>
    </div>
  );
}

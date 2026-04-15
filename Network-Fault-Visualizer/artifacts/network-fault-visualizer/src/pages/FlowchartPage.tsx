import { useEffect, useMemo, useRef, useState } from "react";

type NodeId = "input" | "graph" | "bfs" | "dfs" | "bst" | "recovery" | "output";

interface FlowNode {
  id: NodeId;
  label: string;
  x: number;
  y: number;
  color: string;
}

const INITIAL_NODES: FlowNode[] = [
  { id: "input", label: "Input Network", x: 130, y: 200, color: "#00d4ff" },
  { id: "graph", label: "Build Directed Graph", x: 360, y: 200, color: "#4db8ff" },
  { id: "bfs", label: "BFS Fault Detection", x: 610, y: 120, color: "#00ff88" },
  { id: "dfs", label: "DFS Alternate Paths", x: 610, y: 280, color: "#9f7bff" },
  { id: "bst", label: "BST Router Index", x: 860, y: 120, color: "#ffd700" },
  { id: "recovery", label: "Recovery Planner", x: 860, y: 280, color: "#ff9f43" },
  { id: "output", label: "Result Visualization", x: 1080, y: 200, color: "#ff5f7a" },
];

const EDGES: Array<{ from: NodeId; to: NodeId; bend?: number }> = [
  { from: "input", to: "graph" },
  { from: "graph", to: "bfs" },
  { from: "graph", to: "dfs" },
  { from: "bfs", to: "bst", bend: -24 },
  { from: "dfs", to: "recovery", bend: 24 },
  { from: "bst", to: "output", bend: -16 },
  { from: "recovery", to: "output", bend: 16 },
];

function edgePath(from: FlowNode, to: FlowNode, bend = 0): string {
  const cx = (from.x + to.x) / 2;
  const cy = (from.y + to.y) / 2 + bend;
  return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
}

function getPointOnQuad(t: number, p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }) {
  const one = 1 - t;
  return {
    x: one * one * p0.x + 2 * one * t * p1.x + t * t * p2.x,
    y: one * one * p0.y + 2 * one * t * p1.y + t * t * p2.y,
  };
}

export default function FlowchartPage() {
  const [nodes, setNodes] = useState<FlowNode[]>(INITIAL_NODES);
  const [phase, setPhase] = useState(0);
  const [draggingId, setDraggingId] = useState<NodeId | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let raf = 0;
    const animate = () => {
      setPhase((prev) => (prev + 0.004) % 1);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  const nodeById = useMemo(() => {
    return new Map(nodes.map((n) => [n.id, n]));
  }, [nodes]);

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!draggingId || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 1200;
    const y = ((event.clientY - rect.top) / rect.height) * 420;

    setNodes((prev) =>
      prev.map((node) =>
        node.id === draggingId
          ? {
              ...node,
              x: Math.max(90, Math.min(1110, x - dragOffsetRef.current.x)),
              y: Math.max(80, Math.min(340, y - dragOffsetRef.current.y)),
            }
          : node,
      ),
    );
  };

  const startDrag = (event: React.PointerEvent<SVGGElement>, node: FlowNode) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 1200;
    const y = ((event.clientY - rect.top) / rect.height) * 420;
    dragOffsetRef.current = { x: x - node.x, y: y - node.y };
    setDraggingId(node.id);
  };

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        background: "radial-gradient(circle at 60% 10%, #14253b 0%, #0b1020 45%, #05070d 100%)",
        padding: "24px 16px 34px",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gap: 14 }}>
        <section
          style={{
            border: "1px solid rgba(255,255,255,0.13)",
            borderRadius: 16,
            background: "rgba(6, 12, 24, 0.76)",
            padding: 18,
          }}
        >
          <h1 style={{ fontSize: 27, marginBottom: 8 }}>Interactive Flowchart</h1>
          <p style={{ color: "rgba(255,255,255,0.82)", lineHeight: 1.65 }}>
            Drag any block to rearrange the pipeline. The moving particles show data flow between modules,
            matching the report sequence: Input → Graph → BFS/DFS/BST → Recovery → Output.
          </p>
        </section>

        <section
          style={{
            border: "1px solid rgba(0, 212, 255, 0.25)",
            borderRadius: 18,
            background: "rgba(3, 8, 18, 0.86)",
            padding: 10,
          }}
        >
          <svg
            ref={svgRef}
            viewBox="0 0 1200 420"
            style={{ width: "100%", height: "auto", display: "block", touchAction: "none" }}
            onPointerMove={handlePointerMove}
            onPointerUp={() => setDraggingId(null)}
            onPointerLeave={() => setDraggingId(null)}
          >
            <defs>
              <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {EDGES.map((edge) => {
              const from = nodeById.get(edge.from);
              const to = nodeById.get(edge.to);
              if (!from || !to) return null;
              const path = edgePath(from, to, edge.bend ?? 0);
              const cx = (from.x + to.x) / 2;
              const cy = (from.y + to.y) / 2 + (edge.bend ?? 0);

              return (
                <g key={`${edge.from}-${edge.to}`}>
                  <path d={path} fill="none" stroke="rgba(0, 212, 255, 0.2)" strokeWidth={10} />
                  <path d={path} fill="none" stroke="rgba(131, 203, 255, 0.9)" strokeWidth={2} />
                  <circle
                    cx={getPointOnQuad((phase + (from.x % 7) / 10) % 1, from, { x: cx, y: cy }, to).x}
                    cy={getPointOnQuad((phase + (from.x % 7) / 10) % 1, from, { x: cx, y: cy }, to).y}
                    r={4}
                    fill="#ffffff"
                    filter="url(#glow)"
                  />
                </g>
              );
            })}

            {nodes.map((node) => (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                style={{ cursor: "grab" }}
                onPointerDown={(event) => startDrag(event, node)}
              >
                <rect
                  x={-90}
                  y={-30}
                  rx={14}
                  width={180}
                  height={60}
                  fill="rgba(7, 14, 28, 0.95)"
                  stroke={node.color}
                  strokeWidth={2}
                />
                <rect
                  x={-90}
                  y={-30}
                  rx={14}
                  width={180}
                  height={60}
                  fill="none"
                  stroke="rgba(255,255,255,0.14)"
                  strokeWidth={1}
                />
                <text
                  x={0}
                  y={5}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.92)"
                  style={{ fontSize: 14, fontWeight: 600 }}
                >
                  {node.label}
                </text>
              </g>
            ))}
          </svg>
        </section>
      </div>
    </div>
  );
}

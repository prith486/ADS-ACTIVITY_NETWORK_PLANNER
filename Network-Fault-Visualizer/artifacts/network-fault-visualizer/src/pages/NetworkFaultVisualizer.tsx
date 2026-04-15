import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  PlusCircle, Link2, Zap, Activity, GitBranch, Network,
  ScanSearch, RotateCcw, RefreshCw, Trash2, ChevronRight, Play, Settings, SkipBack, SkipForward
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Dock, DockIcon } from "@/components/ui/dock";
import { FlickeringGrid } from "@/components/ui/flickering-grid";

// â”€â”€â”€ Physics constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PHYSICS = {
  repulsion: 4500, // Increased for better spacing
  springStrength: 0.04,
  springRestLength: 160,
  centeringForce: 0.003,
  damping: 0.85,
  maxVelocity: 10,
  idleNudge: 0.08,
  nodeRadius: 22,
};

// â”€â”€â”€ Color palette â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const C = {
  active: "#00d4ff",
  failed: "#ff3333",
  unreachable: "#ff9500",
  bfsVisited: "#4db8ff",
  bfsAura: "#ffffff",
  dfsPath: "#00ff88",
  recovery: "#ffd700",
  bgSpace: "#080c16",
  bgDeep: "#050810",
  edgeDefault: "rgba(0, 212, 255, 0.2)",
  edgeFlow: "rgba(0, 212, 255, 0.8)",
  terminalBg: "rgba(4, 8, 16, 0.95)",
};

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type NodeState = "active" | "failed" | "unreachable" | "bfs-visited" | "dfs-path" | "recovery";
type EdgeState = "normal" | "failed" | "dfs-path" | "recovery";

interface GNode {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  state: NodeState;
  active: boolean;
  shatter?: number; // timestamp for shatter animation
}
interface GEdge {
  id: string;
  from: number;
  to: number;
  weight: number;
  bidirectional: boolean;
  state: EdgeState;
}
interface BSTNode {
  val: number;
  left: BSTNode | null;
  right: BSTNode | null;
}
interface LogEntry {
  id: number;
  ts: string;
  type: "BUILD" | "FAULT" | "BFS" | "DFS" | "RECOVERY" | "BST" | "ERROR" | "SYSTEM";
  msg: string;
}
interface AnimStep {
  type: string;
  nodeId?: number;
  edgeId?: string;
  path?: number[];
  t: number; // absolute ms from animation start
}
interface Overlay {
  kind: "bfs" | "dfs" | "recovery";
  reachable?: number[];
  unreachable?: number[];
  paths?: string[];
  pathCount?: number;
  from?: number;
  to?: number;
  recoveryPath?: string;
  latency?: number;
}

type HistoryAction = 
  | { type: "ADD_NODE", payload: GNode }
  | { type: "ADD_EDGE", payload: GEdge }
  | { type: "FAIL_NODE", payload: number };

// â”€â”€â”€ BST helpers (pure) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function bstInsert(root: BSTNode | null, val: number): BSTNode {
  if (!root) return { val, left: null, right: null };
  if (val < root.val) return { ...root, left: bstInsert(root.left, val) };
  if (val > root.val) return { ...root, right: bstInsert(root.right, val) };
  return root;
}

function buildBalancedBST(ids: number[]): BSTNode | null {
  if (ids.length === 0) return null;
  const sorted = [...ids].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return {
    val: sorted[mid],
    left: buildBalancedBST(sorted.slice(0, mid)),
    right: buildBalancedBST(sorted.slice(mid + 1)),
  };
}

function bstTraverse(root: BSTNode | null, val: number): string[] {
  const steps: string[] = [];
  let cur = root;
  while (cur) {
    if (cur.val === val) { steps.push(`Root(${cur.val}) → FOUND`); return steps; }
    if (val < cur.val) { steps.push(`Root(${cur.val}) → Go Left`); cur = cur.left; }
    else { steps.push(`Root(${cur.val}) → Go Right`); cur = cur.right; }
  }
  steps.push("NOT FOUND");
  return steps;
}

// â”€â”€â”€ Utility â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let _logId = 0;
function ts(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

const LOG_COLOR: Record<string, string> = {
  BUILD: "#00d4ff", FAULT: "#ff3333", BFS: "#4da6ff",
  DFS: "#bf7fff", RECOVERY: "#ffd700", BST: "#00ff88", ERROR: "#ff4444",
};

// â”€â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function NetworkFaultVisualizer() {
  // Refs for mutable simulation state (NOT in React state â€” avoids re-render lag)
  const nodesRef = useRef<GNode[]>([]);
  const edgesRef = useRef<GEdge[]>([]);
  const dragNodeRef = useRef<number | null>(null);
  const hoverNodeRef = useRef<number | null>(null);
  const selectedRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const dashRef = useRef<number>(0);
  const logEndRef = useRef<HTMLDivElement>(null);

  // React state (UI-driven, display only)
  const [renderTick, setRenderTick] = useState(0); // forces panel stats re-render
  const [bstRoot, setBstRoot] = useState<BSTNode | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(false); // for fade-out animation
  const [animating, setAnimating] = useState(false);
  const animatingRef = useRef(false);

  // History state
  const [history, setHistory] = useState<HistoryAction[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Form inputs
  const [routerIn, setRouterIn] = useState("");
  const [eFrom, setEFrom] = useState("");
  const [eTo, setETo] = useState("");
  const [eLatency, setELatency] = useState("");
  const [eBidi, setEBidi] = useState(false);
  const [faultIn, setFaultIn] = useState("");
  const [bfsSrc, setBfsSrc] = useState("");
  const [dfsFrom, setDfsFrom] = useState("");
  const [dfsTo, setDfsTo] = useState("");
  const [recFrom, setRecFrom] = useState("");
  const [recTo, setRecTo] = useState("");
  const [bstIn, setBstIn] = useState("");
  const [errs, setErrs] = useState<Record<string, string>>({});

  // Resizable panels
  const [sideW, setSideW] = useState(290);
  const [termH, setTermH] = useState(180);
  const sideResizing = useRef(false);
  const termResizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0, val: 0 });

  // Animation speed (1 = normal, 2 = 2Ã— faster, 0.5 = 2Ã— slower)
  const [animSpeed, setAnimSpeed] = useState(1);
  const animSpeedRef = useRef(1);

  // Replay last algorithm run
  const replayRef = useRef<{ steps: AnimStep[]; onDone: () => void } | null>(null);
  const [canReplay, setCanReplay] = useState(false);

  // â”€â”€ Logging â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const addLog = useCallback((type: LogEntry["type"], msg: string) => {
    setLogs((prev: LogEntry[]) => {
      const entry: LogEntry = { id: _logId++, ts: ts(), type, msg };
      return [...prev.slice(-300), entry];
    });
    requestAnimationFrame(() => {
      logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  const err = useCallback((field: string, msg: string) => {
    setErrs((p: Record<string, string>) => ({ ...p, [field]: msg }));
    setTimeout(() => setErrs((p: Record<string, string>) => { const n = { ...p }; delete n[field]; return n; }), 3000);
  }, []);

  // â”€â”€ Physics simulation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const tick = useCallback(() => {
    const ns = nodesRef.current;
    const es = edgesRef.current;
    if (ns.length === 0) return;
    const canvas = canvasRef.current;
    const W = canvas?.width ?? 800;
    const H = canvas?.height ?? 600;

    for (let i = 0; i < ns.length; i++) {
      if (dragNodeRef.current === ns[i].id) continue;
      let fx = 0, fy = 0;

      // Repulsion
      for (let j = 0; j < ns.length; j++) {
        if (i === j) continue;
        const dx = ns[i].x - ns[j].x;
        const dy = ns[i].y - ns[j].y;
        const d2 = dx * dx + dy * dy || 1;
        const d = Math.sqrt(d2);
        const f = PHYSICS.repulsion / d2;
        fx += (dx / d) * f;
        fy += (dy / d) * f;
      }

      // Spring attraction along edges
      for (const e of es) {
        let otherId = -1;
        if (e.from === ns[i].id) otherId = ns.findIndex((n: GNode) => n.id === e.to);
        else if (e.to === ns[i].id) otherId = ns.findIndex((n: GNode) => n.id === e.from);
        if (otherId < 0) continue;
        const dx = ns[otherId].x - ns[i].x;
        const dy = ns[otherId].y - ns[i].y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const stretch = d - PHYSICS.springRestLength;
        fx += (dx / d) * stretch * PHYSICS.springStrength;
        fy += (dy / d) * stretch * PHYSICS.springStrength;
      }

      // Centering + idle nudge
      fx += (W / 2 - ns[i].x) * PHYSICS.centeringForce;
      fy += (H / 2 - ns[i].y) * PHYSICS.centeringForce;
      fx += (Math.random() - 0.5) * PHYSICS.idleNudge;
      fy += (Math.random() - 0.5) * PHYSICS.idleNudge;

      ns[i].vx = (ns[i].vx + fx) * PHYSICS.damping;
      ns[i].vy = (ns[i].vy + fy) * PHYSICS.damping;
      const spd = Math.sqrt(ns[i].vx ** 2 + ns[i].vy ** 2);
      if (spd > PHYSICS.maxVelocity) { ns[i].vx = ns[i].vx / spd * PHYSICS.maxVelocity; ns[i].vy = ns[i].vy / spd * PHYSICS.maxVelocity; }

      ns[i].x = Math.max(PHYSICS.nodeRadius + 4, Math.min(W - PHYSICS.nodeRadius - 4, ns[i].x + ns[i].vx));
      ns[i].y = Math.max(PHYSICS.nodeRadius + 4, Math.min(H - PHYSICS.nodeRadius - 4, ns[i].y + ns[i].vy));
    }
  }, []);

  // â”€â”€ Canvas draw â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const draw = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const t = timeRef.current;

    // Background is handled by CSS/AnimatedGridPattern for transparency
    ctx.clearRect(0, 0, W, H);

    // Dot grid pattern
    ctx.fillStyle = "rgba(0, 212, 255, 0.08)";
    const gridSize = 32;
    for (let x = (W % gridSize) / 2; x < W; x += gridSize) {
      for (let y = (H % gridSize) / 2; y < H; y += gridSize) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const ns = nodesRef.current;
    const es = edgesRef.current;

    // --- Dark shadow blobs behind active graph elements to mask the grid ---
    if (ns.length > 0) {
      ctx.save();
      // Thicken black path behind edges for latency label visibility
      for (const e of es) {
        const fn = ns.find((n: GNode) => n.id === e.from);
        const tn = ns.find((n: GNode) => n.id === e.to);
        if (!fn || !tn) continue;
        ctx.beginPath();
        ctx.moveTo(fn.x, fn.y);
        ctx.lineTo(tn.x, tn.y);
        ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
        ctx.lineWidth = 80;
        ctx.lineCap = "round";
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(fn.x, fn.y);
        ctx.lineTo(tn.x, tn.y);
        ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
        ctx.lineWidth = 40;
        ctx.stroke();
      }

      // Dark radial gradients behind nodes
      for (const n of ns) {
        const bgGrad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 160);
        bgGrad.addColorStop(0, "rgba(0, 0, 0, 1)");
        bgGrad.addColorStop(0.4, "rgba(0, 0, 0, 0.95)");
        bgGrad.addColorStop(1, "transparent");
        ctx.fillStyle = bgGrad;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 160, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Empty state: Animated Radar
    if (ns.length === 0) {
      ctx.save();
      const cx = W / 2, cy = H / 2;
      
      // Radar rings
      for (let i = 1; i <= 3; i++) {
        const radius = (180 * i / 3) + (t * 0.5) % 60;
        const opacity = Math.max(0, 0.15 - (radius / 500) - (i * 0.03));
        ctx.strokeStyle = `rgba(0, 212, 255, ${opacity})`;
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Sweep effect (rotating line segment)
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * 0.01 * (i * 0.5));
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(radius, 0);
        ctx.stroke();
        ctx.restore();
      }

      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(0, 212, 255, 0.25)";
      ctx.font = "600 18px 'DM Mono', monospace";
      ctx.fillText("BUILD YOUR NETWORK →", cx, cy - 40);
      
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.font = "400 12px 'DM Mono', monospace";
      ctx.fillText("Click a node to select · Drag to reposition", cx, cy - 18);
      ctx.restore();
    }

    // â”€ Draw edges â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    for (const e of es) {
      const fn = ns.find(n => n.id === e.from);
      const tn = ns.find(n => n.id === e.to);
      if (!fn || !tn) continue;

      const dx = tn.x - fn.x, dy = tn.y - fn.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const ux = dx / len, uy = dy / len;

      const sx = fn.x + ux * PHYSICS.nodeRadius;
      const sy = fn.y + uy * PHYSICS.nodeRadius;
      const ex = tn.x - ux * PHYSICS.nodeRadius;
      const ey = tn.y - uy * PHYSICS.nodeRadius;

      let color = C.edgeDefault;
      let lw = 1.5;
      let isAnimated = false;

      if (!fn.active || !tn.active || e.state === "failed") {
        color = "rgba(255, 51, 51, 0.25)";
        lw = 1;
      } else if (e.state === "recovery") {
        color = C.recovery;
        lw = 3;
        isAnimated = true;
      } else if (e.state === "dfs-path") {
        color = C.dfsPath;
        lw = 2.5;
      }

      ctx.save();
      // 1. Glow line
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.15;
      ctx.lineWidth = lw + 4;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      
      // 2. Core line
      ctx.globalAlpha = 1;
      ctx.lineWidth = lw;
      if (e.state === "recovery") {
        ctx.setLineDash([8, 4]);
        ctx.lineDashOffset = -t * 0.5;
      }
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.setLineDash([]);

      // Flowing particles (for active paths)
      if (fn.active && tn.active && e.state !== "failed") {
        const particleCount = 2;
        const spacing = 1 / particleCount;
        for (let i = 0; i < particleCount; i++) {
          const progress = ((t * 0.015) + (i * spacing)) % 1;
          const px = sx + (ex - sx) * progress;
          const py = sy + (ey - sy) * progress;
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.shadowBlur = 8;
          ctx.shadowColor = color;
          ctx.fill();
        }
      }

      // Arrowheads
      const drawArrow = (tx: number, ty: number, angle: number) => {
        const AS = 10;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx - AS * Math.cos(angle - 0.4), ty - AS * Math.sin(angle - 0.4));
        ctx.lineTo(tx - AS * Math.cos(angle + 0.4), ty - AS * Math.sin(angle + 0.4));
        ctx.fill();
      };
      const ang = Math.atan2(ey - sy, ex - sx);
      drawArrow(ex, ey, ang);
      if (e.bidirectional) drawArrow(sx, sy, ang + Math.PI);

      // Latency label
      ctx.save();
      const mx = (sx + ex) / 2, my = (sy + ey) / 2;
      ctx.translate(mx, my);
      ctx.rotate(ang);
      ctx.fillStyle = "rgba(0, 0, 0, 0.95)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.beginPath();
      ctx.roundRect(-24, -19, 48, 16, 6);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.font = "600 10px 'DM Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${e.weight}ms`, 0, -8);
      ctx.restore();

      ctx.restore();
    }

    // â”€ Draw nodes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    for (const n of ns) {
      const isHov = hoverNodeRef.current === n.id;
      const isSel = selectedRef.current === n.id;
      const state = n.state;
      
      let themeCol = C.active;
      let auraCol = C.active;
      
      switch(state) {
        case "failed": themeCol = C.failed; auraCol = C.failed; break;
        case "unreachable": themeCol = C.unreachable; auraCol = C.unreachable; break;
        case "bfs-visited": themeCol = C.bfsVisited; auraCol = C.bfsAura; break;
        case "dfs-path": themeCol = C.dfsPath; auraCol = C.dfsPath; break;
        case "recovery": themeCol = C.recovery; auraCol = C.recovery; break;
      }

      ctx.save();
      
      // 1. Outer glow aura
      const auraAlpha = 0.1 + 0.05 * Math.sin(t * 0.03);
      const auraGrad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 55);
      auraGrad.addColorStop(0, `${auraCol}${Math.floor(auraAlpha*255).toString(16).padStart(2,'0')}`);
      auraGrad.addColorStop(1, `${auraCol}00`);
      ctx.fillStyle = auraGrad;
      ctx.beginPath(); ctx.arc(n.x, n.y, 55, 0, Math.PI * 2); ctx.fill();

      // 2. Pulsing ring
      if (n.active) {
        const pulse = Math.sin(t * 0.05) * 6 + 30;
        const ringAlpha = Math.sin(t * 0.05) * 0.3 + 0.4;
        ctx.strokeStyle = themeCol;
        ctx.globalAlpha = ringAlpha;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(n.x, n.y, pulse, 0, Math.PI * 2); ctx.stroke();
      }

      // 3. Inner filled circle
      ctx.globalAlpha = 1;
      const nodeGrad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, PHYSICS.nodeRadius);
      nodeGrad.addColorStop(0, "#1a2538");
      nodeGrad.addColorStop(1, "#0a0e1a");
      ctx.fillStyle = nodeGrad;
      ctx.strokeStyle = isSel ? "#ffffff" : themeCol;
      ctx.lineWidth = (isSel || isHov) ? 3 : 2;
      ctx.beginPath(); ctx.arc(n.x, n.y, PHYSICS.nodeRadius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      // 4. Router ID label
      ctx.fillStyle = "#ffffff";
      if (!n.active) ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "600 13px 'DM Mono', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`R${n.id}`, n.x, n.y);

      // Failed node shatter animation simulation (simple particles)
      if (n.shatter && t - n.shatter < 30) { // first ~30 ticks of being failed
        const dt = (t - n.shatter);
        ctx.fillStyle = C.failed;
        for (let i = 0; i < 8; i++) {
          const ang = (i / 8) * Math.PI * 2;
          const dist = dt * 2.5;
          const px = n.x + Math.cos(ang) * dist;
          const py = n.y + Math.sin(ang) * dist;
          ctx.globalAlpha = 1 - (dt / 30);
          ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
        }
      }

      // 'X' for failed nodes
      if (!n.active) {
        ctx.strokeStyle = C.failed;
        ctx.lineWidth = 2;
        const off = 8;
        ctx.beginPath();
        ctx.moveTo(n.x - off, n.y - off); ctx.lineTo(n.x + off, n.y + off);
        ctx.moveTo(n.x + off, n.y - off); ctx.lineTo(n.x - off, n.y + off);
        ctx.stroke();
      }

      ctx.restore();
    }

    // Vignette overlay
    const vignette = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.8);
    vignette.addColorStop(0, "transparent");
    vignette.addColorStop(1, "rgba(5, 8, 16, 0.8)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    // Selected highlight
    if (selectedRef.current !== null) {
      const sel = ns.find((n: GNode) => n.id === selectedRef.current);
      if (sel) {
        ctx.beginPath();
        ctx.arc(sel.x, sel.y, PHYSICS.nodeRadius + 6, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // Legend
    const legend = [
      { color: C.active, lbl: "Active" },
      { color: C.failed, lbl: "Failed" },
      { color: C.unreachable, lbl: "Unreachable" },
      { color: C.bfsVisited, lbl: "BFS Visited" },
      { color: C.dfsPath, lbl: "DFS Path" },
      { color: C.recovery, lbl: "Recovery" },
    ];
    const lx = W - 135;
    let ly = H - 8 - legend.length * 18;
    ctx.save();
    ctx.font = "10px 'Courier New',monospace";
    for (const item of legend) {
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(lx, ly, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(item.lbl, lx + 10, ly);
      ly += 18;
    }
    ctx.restore();
  }, []);

  // â”€â”€ Animation loop â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const loop = React.useCallback(() => {
    timeRef.current++;
    tick();
    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [tick, draw]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    });
    ro.observe(canvas);
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, [loop]);

  // â”€â”€ Canvas mouse events â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const hitNode = React.useCallback((x: number, y: number) => {
    const ns = nodesRef.current;
    for (let i = ns.length - 1; i >= 0; i--) {
      const dx = ns[i].x - x, dy = ns[i].y - y;
      if (dx * dx + dy * dy <= (PHYSICS.nodeRadius + 4) ** 2) return ns[i].id;
    }
    return null;
  }, []);

  const onMouseDown = React.useCallback((e: React.MouseEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const id = hitNode(x, y);
    if (id !== null) {
      dragNodeRef.current = id;
      selectedRef.current = id;
      setFaultIn(String(id));
    } else {
      selectedRef.current = null;
    }
    setRenderTick((t: number) => t + 1);
  }, [hitNode]);

  const onMouseMove = React.useCallback((e: React.MouseEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    hoverNodeRef.current = hitNode(x, y);
    if (dragNodeRef.current !== null) {
      const ns = nodesRef.current;
      const idx = ns.findIndex((n: GNode) => n.id === dragNodeRef.current);
      if (idx >= 0) { ns[idx].x = x; ns[idx].y = y; ns[idx].vx = 0; ns[idx].vy = 0; }
    }
  }, [hitNode]);

  const onMouseUp = React.useCallback(() => { dragNodeRef.current = null; }, []);

  // â”€â”€ Resizable panel drag â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (sideResizing.current) {
        const delta = e.clientX - resizeStart.current.x;
        setSideW(Math.max(220, Math.min(420, resizeStart.current.val + delta)));
      }
      if (termResizing.current) {
        const delta = e.clientY - resizeStart.current.y;
        setTermH(Math.max(80, Math.min(400, resizeStart.current.val - delta)));
      }
    };
    const onUp = () => { sideResizing.current = false; termResizing.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  // â”€â”€ History management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const pushHistory = useCallback((action: HistoryAction) => {
    setHistoryIndex((prevIndex) => {
      setHistory((prev) => {
        const newHistory = prev.slice(0, prevIndex + 1);
        newHistory.push(action);
        return newHistory;
      });
      return prevIndex + 1;
    });
  }, []);

  const rebuildGraph = useCallback((upToIndex: number, currentHistory: HistoryAction[]) => {
    const newNodes: GNode[] = [];
    const newEdges: GEdge[] = [];

    for (let i = 0; i <= upToIndex; i++) {
      const action = currentHistory[i];
      if (action.type === "ADD_NODE") {
        newNodes.push({ ...action.payload });
      } else if (action.type === "ADD_EDGE") {
        newEdges.push({ ...action.payload });
      } else if (action.type === "FAIL_NODE") {
        const id = action.payload;
        const node = newNodes.find((n) => n.id === id);
        if (node) {
          node.active = false;
          node.state = "failed";
        }
        for (const e of newEdges) {
          if (e.from === id || e.to === id) {
            e.state = "failed";
          }
        }
      }
    }

    nodesRef.current = newNodes;
    edgesRef.current = newEdges;

    const activeIds = newNodes.filter((n) => n.active).map((n) => n.id);
    setBstRoot(buildBalancedBST(activeIds));
    setRenderTick((t) => t + 1);
  }, []);

  // â”€â”€ Build adjacency map (only active nodes & edges) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const buildAdj = React.useCallback((nodes: GNode[], edges: GEdge[]) => {
    const adj = new Map<number, { to: number; weight: number; eid: string }[]>();
    for (const n of nodes) if (n.active) adj.set(n.id, []);
    for (const e of edges) {
      const fn = nodes.find(n => n.id === e.from);
      const tn = nodes.find(n => n.id === e.to);
      if (!fn?.active || !tn?.active) continue;
      adj.get(e.from)?.push({ to: e.to, weight: e.weight, eid: e.id });
      if (e.bidirectional) adj.get(e.to)?.push({ to: e.from, weight: e.weight, eid: e.id });
    }
    return adj;
  }, []);

  // â”€â”€ Animation queue processor (ABSOLUTE timeouts â€” no chaining!) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const runAnim = React.useCallback((steps: AnimStep[], onDone?: () => void) => {
    if (animatingRef.current) return;
    animatingRef.current = true;
    setAnimating(true);
    const spd = animSpeedRef.current;

    for (const step of steps) {
      setTimeout(() => {
        // Update node state
        if (step.nodeId !== undefined) {
          const ns = nodesRef.current;
          const idx = ns.findIndex((n: GNode) => n.id === step.nodeId);
          if (idx < 0) return;
          const n = ns[idx];
          if (!n.active) return; // never change failed nodes via animation
          if (step.type === "bfs-visit") ns[idx] = { ...n, state: "bfs-visited" };
          else if (step.type === "bfs-unreachable") ns[idx] = { ...n, state: "unreachable" };
          else if (step.type === "dfs-forward") ns[idx] = { ...n, state: "dfs-path" };
          else if (step.type === "dfs-backtrack") ns[idx] = { ...n, state: "active" };
          else if (step.type === "recovery-node") ns[idx] = { ...n, state: "recovery" };
        }
        // Update edge state
        if (step.edgeId !== undefined) {
          const es = edgesRef.current;
          const idx = es.findIndex((e: GEdge) => e.id === step.edgeId);
          if (idx >= 0) {
            if (step.type === "dfs-forward") es[idx] = { ...es[idx], state: "dfs-path" };
            else if (step.type === "dfs-backtrack") es[idx] = { ...es[idx], state: "normal" };
            else if (step.type === "recovery-edge") es[idx] = { ...es[idx], state: "recovery" };
          }
        }
      }, step.t / spd);
    }

    const maxT = steps.length > 0 ? Math.max(...steps.map(s => s.t)) : 0;
    setTimeout(() => {
      animatingRef.current = false;
      setAnimating(false);
      onDone?.();
    }, maxT / spd + 200);
  }, []);

  // â”€â”€ Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const addRouter = React.useCallback(() => {
    const id = parseInt(routerIn.trim());
    if (isNaN(id) || id < 1) { err("router", "Enter a valid positive Router ID"); return; }
    if (nodesRef.current.find((n: GNode) => n.id === id)) { err("router", `Router ${id} already exists`); return; }

    const newNode: GNode = {
      id, x: 100 + Math.random() * 600, y: 100 + Math.random() * 400,
      vx: 0, vy: 0,
      state: "active", active: true,
    };
    pushHistory({ type: "ADD_NODE", payload: { ...newNode } });
    nodesRef.current = [...nodesRef.current, newNode];
    const activeIds = nodesRef.current.filter((n: GNode) => n.active).map((n: GNode) => n.id);
    setBstRoot(buildBalancedBST(activeIds));
    setRenderTick((t: number) => t + 1);
    addLog("BUILD", `>> Router ${id} added to network.`);
    setRouterIn("");
  }, [routerIn, addLog, err, pushHistory]);

  const addEdge = React.useCallback(() => {
    const from = parseInt(eFrom.trim()), to = parseInt(eTo.trim()), w = parseInt(eLatency.trim());
    if (isNaN(from) || isNaN(to) || isNaN(w) || w < 1) { err("edge", "Enter valid From, To, and Latency (â‰¥1ms)"); return; }
    if (from === to) { err("edge", "From and To must differ"); return; }
    if (!nodesRef.current.find((n: GNode) => n.id === from)) { err("edge", `Router ${from} not found`); return; }
    if (!nodesRef.current.find((n: GNode) => n.id === to)) { err("edge", `Router ${to} not found`); return; }
    const eid = `${from}-${to}`;
    if (edgesRef.current.find((e: GEdge) => e.id === eid)) { err("edge", `Link ${from}→${to} already exists`); return; }

    const newEdge: GEdge = { id: eid, from, to, weight: w, bidirectional: eBidi, state: "normal" };
    pushHistory({ type: "ADD_EDGE", payload: { ...newEdge } });
    edgesRef.current = [...edgesRef.current, newEdge];
    setRenderTick((t: number) => t + 1);
    addLog("BUILD", `>> Link added: Router ${from} ${eBidi ? "↔" : "→"} Router ${to} (Latency: ${w}ms, ${eBidi ? "Two-way" : "One-way"})`);
    setEFrom(""); setETo(""); setELatency("");
  }, [eFrom, eTo, eLatency, eBidi, addLog, err, pushHistory]);

  const failRouter = React.useCallback(() => {
    const id = parseInt(faultIn.trim());
    if (isNaN(id)) { err("fault", "Enter a valid Router ID"); return; }
    const node = nodesRef.current.find((n: GNode) => n.id === id);
    if (!node) { err("fault", `Router ${id} not found`); return; }
    if (!node.active) { err("fault", `Router ${id} is already down`); return; }

    pushHistory({ type: "FAIL_NODE", payload: id });
    nodesRef.current = nodesRef.current.map((n: GNode) =>
      n.id === id ? { ...n, active: false, state: "failed" } : n
    );
    edgesRef.current = edgesRef.current.map((e: GEdge) =>
      (e.from === id || e.to === id) ? { ...e, state: "failed" } : e
    );
    const activeIds = nodesRef.current.filter((n: GNode) => n.active).map((n: GNode) => n.id);
    setBstRoot(buildBalancedBST(activeIds));
    setOverlay(null);
    setOverlayVisible(false);
    setRenderTick((t: number) => t + 1);
    addLog("FAULT", `>> Router ${id} has FAILED and is removed from network.`);
    setFaultIn("");
  }, [faultIn, addLog, err, pushHistory]);

  // BFS
  const runBFS = React.useCallback(() => {
    const src = parseInt(bfsSrc.trim());
    if (isNaN(src)) { err("bfs", "Enter source Router ID"); return; }
    if (nodesRef.current.length === 0) { err("bfs", "No network built yet"); return; }
    const srcNode = nodesRef.current.find((n: GNode) => n.id === src);
    if (!srcNode) { err("bfs", `Router ${src} not found`); return; }
    if (!srcNode.active) { err("bfs", `Source Router ${src} is itself down!`); return; }

    const adj = buildAdj(nodesRef.current, edgesRef.current);
    const visited = new Set<number>([src]);
    const queue = [src];
    const order: number[] = [];
    const steps: AnimStep[] = [];
    let t = 0;

    // Mark source first
    steps.push({ type: "bfs-visit", nodeId: src, t });
    t += 400;

    while (queue.length > 0) {
      const cur = queue.shift()!;
      order.push(cur);
      for (const nb of (adj.get(cur) ?? [])) {
        if (!visited.has(nb.to)) {
          visited.add(nb.to);
          queue.push(nb.to);
          steps.push({ type: "bfs-visit", nodeId: nb.to, t });
          t += 400;
        }
      }
    }

    const activeIds = nodesRef.current.filter((n: GNode) => n.active).map((n: GNode) => n.id);
    const unreachable = activeIds.filter((id: number) => !visited.has(id));
    for (const id of unreachable) {
      steps.push({ type: "bfs-unreachable", nodeId: id, t });
      t += 250;
    }

    const onDone = () => {
      setOverlay({ kind: "bfs", reachable: order, unreachable });
      setOverlayVisible(true);
      setTimeout(() => setOverlayVisible(false), 5500);
      setTimeout(() => setOverlay(null), 6000);
    };
    replayRef.current = { steps: [...steps], onDone };
    setCanReplay(true);
    runAnim(steps, onDone);

    addLog("BFS", `BFS Traversal from Router ${src}: ${order.join(" ")}`);
    addLog("BFS", unreachable.length === 0
      ? "Unreachable Routers: None — network is fully connected!"
      : `Unreachable Routers: ${unreachable.join(", ")}`
    );
  }, [bfsSrc, buildAdj, runAnim, addLog, err]);

  // DFS — find all paths
  const findAllPaths = React.useCallback((
    src: number, dst: number,
    adj: Map<number, { to: number; weight: number; eid: string }[]>
  ): { paths: { nodes: number[]; eids: string[] }[]; steps: AnimStep[] } => {
    const paths: { nodes: number[]; eids: string[] }[] = [];
    const steps: AnimStep[] = [];
    let t = 0;

    steps.push({ type: "dfs-forward", nodeId: src, t });
    t += 200;

    const dfs = (
      cur: number,
      pathNodes: number[],
      pathEids: string[],
      visited: Set<number>
    ) => {
      const currentNode = nodesRef.current.find((n: GNode) => n.id === cur);
      if (!currentNode || !currentNode.active) return;

      if (cur === dst) {
        if (pathNodes.length > 1) {
          paths.push({ nodes: [...pathNodes], eids: [...pathEids] });
        }
        return;
      }
      for (const nb of (adj.get(cur) ?? [])) {
        if (visited.has(nb.to)) continue;

        const neighborNode = nodesRef.current.find((n: GNode) => n.id === nb.to);
        if (!neighborNode || !neighborNode.active) continue;

        visited.add(nb.to);
        pathNodes.push(nb.to);
        pathEids.push(nb.eid);
        steps.push({ type: "dfs-forward", nodeId: nb.to, t });
        steps.push({ type: "dfs-forward", edgeId: nb.eid, t });
        t += 300;

        dfs(nb.to, pathNodes, pathEids, visited);

        steps.push({ type: "dfs-backtrack", nodeId: nb.to, t });
        steps.push({ type: "dfs-backtrack", edgeId: nb.eid, t });
        t += 150;

        pathNodes.pop();
        pathEids.pop();
        visited.delete(nb.to);
      }
    };

    dfs(src, [src], [], new Set([src]));

    const filteredPaths = paths.filter((p: { nodes: number[], eids: string[] }) => p.nodes[p.nodes.length - 1] === dst);

    return { paths: filteredPaths, steps };
  }, []);

  const runDFS = React.useCallback(() => {
    const src = parseInt(dfsFrom.trim()), dst = parseInt(dfsTo.trim());
    if (isNaN(src) || isNaN(dst)) { err("dfs", "Enter From and To Router IDs"); return; }
    if (src === dst) { err("dfs", "Source and destination must be different routers"); return; }
    const srcN = nodesRef.current.find((n: GNode) => n.id === src);
    const dstN = nodesRef.current.find((n: GNode) => n.id === dst);
    if (!srcN) { err("dfs", `Router ${src} not found`); return; }
    if (!dstN) { err("dfs", `Router ${dst} not found`); return; }
    if (!srcN.active) { err("dfs", `Router ${src} is itself down!`); return; }
    if (!dstN.active) { err("dfs", `Router ${dst} is itself down!`); return; }

    const adj = buildAdj(nodesRef.current, edgesRef.current);
    const { paths, steps } = findAllPaths(src, dst, adj);

    const pathStrs = paths.map((p: { nodes: number[], eids: string[] }) => p.nodes.join(" → "));

    const onDone = () => {
      setOverlay({ kind: "dfs", pathCount: paths.length, from: src, to: dst, paths: pathStrs });
      setOverlayVisible(true);
      setTimeout(() => setOverlayVisible(false), 5500);
      setTimeout(() => setOverlay(null), 6000);
    };
    replayRef.current = { steps: [...steps], onDone };
    setCanReplay(true);
    runAnim(steps, onDone);

    addLog("DFS", `All paths from Router ${src} to Router ${dst}:`);
    if (paths.length === 0) {
      addLog("DFS", `  No paths found between Router ${src} and ${dst}.`);
    } else {
      pathStrs.forEach((p: string, i: number) => addLog("DFS", `  Path ${i + 1}: ${p}`));
      addLog("DFS", `  Total paths found: ${paths.length}`);
    }
  }, [dfsFrom, dfsTo, buildAdj, findAllPaths, runAnim, addLog, err]);

  const runRecovery = React.useCallback(() => {
    const src = parseInt(recFrom.trim()), dst = parseInt(recTo.trim());
    if (isNaN(src) || isNaN(dst)) { err("recovery", "Enter From and To Router IDs"); return; }
    if (src === dst) { err("recovery", "Source and destination must be different routers"); return; }
    const srcN = nodesRef.current.find((n: GNode) => n.id === src);
    const dstN = nodesRef.current.find((n: GNode) => n.id === dst);
    if (!srcN) { err("recovery", `Router ${src} not found`); return; }
    if (!dstN) { err("recovery", `Router ${dst} not found`); return; }
    if (!srcN.active) { err("recovery", `Router ${src} is itself down!`); return; }
    if (!dstN.active) { err("recovery", `Router ${dst} is itself down!`); return; }

    const adj = buildAdj(nodesRef.current, edgesRef.current);
    const { paths } = findAllPaths(src, dst, adj);

    if (paths.length === 0) {
      addLog("RECOVERY", ">> No backup path! Network partition detected.");
      setOverlay({ kind: "recovery", from: src, to: dst, recoveryPath: "NONE" });
      setOverlayVisible(true);
      setTimeout(() => setOverlayVisible(false), 5500);
      setTimeout(() => setOverlay(null), 6000);
      return;
    }

    const scored = paths.map((p: { nodes: number[], eids: string[] }) => {
      let totalLat = 0;
      for (let i = 0; i < p.nodes.length - 1; i++) {
        const u = p.nodes[i], v = p.nodes[i+1];
        const edge = edgesRef.current.find((e: GEdge) => 
          (e.from === u && e.to === v) || (e.bidirectional && e.from === v && e.to === u)
        );
        if (edge) totalLat += edge.weight;
      }
      return { ...p, lat: totalLat };
    });
    scored.sort((a, b) => a.lat - b.lat);
    const best = scored[0];

    const steps: AnimStep[] = [];
    let t = 0;
    for (let i = 0; i < best.nodes.length; i++) {
      steps.push({ type: "recovery-node", nodeId: best.nodes[i], t });
      if (i < best.eids.length) steps.push({ type: "recovery-edge", edgeId: best.eids[i], t });
      t += 500;
    }

    const onDone = () => {
      setOverlay({ kind: "recovery", from: src, to: dst, recoveryPath: best.nodes.join(" → "), latency: best.lat });
      setOverlayVisible(true);
      setTimeout(() => setOverlayVisible(false), 6500);
      setTimeout(() => setOverlay(null), 7000);
    };
    replayRef.current = { steps: [...steps], onDone };
    setCanReplay(true);
    runAnim(steps, onDone);
    addLog("RECOVERY", `>> Found Recovery Path: ${best.nodes.join(" → ")} (${best.lat}ms)`);
  }, [recFrom, recTo, buildAdj, findAllPaths, runAnim, addLog, err]);

  const runBSTSearch = React.useCallback(() => {
    const id = parseInt(bstIn.trim());
    if (isNaN(id)) { err("bst", "Enter ID"); return; }
    const steps = bstTraverse(bstRoot, id);
    const found = steps[steps.length - 1] === "FOUND" || steps[steps.length - 1].includes("FOUND");
    addLog("BST", `Search R${id}: ${steps.join(" → ")}`);
    setBstIn("");
  }, [bstIn, bstRoot, addLog, err]);

  const clearHighlights = useCallback(() => {
    nodesRef.current = nodesRef.current.map(n => ({ ...n, state: n.active ? "active" : "failed" }));
    edgesRef.current = edgesRef.current.map(e => ({ ...e, state: e.state === "failed" ? "failed" : "normal" }));
    setOverlay(null);
    setOverlayVisible(false);
    setRenderTick(t => t + 1);
    addLog("SYSTEM", ">> Visual highlights cleared.");
  }, [addLog]);

  const resetAll = useCallback(() => {
    nodesRef.current = [];
    edgesRef.current = [];
    setBstRoot(null);
    setLogs([]);
    setOverlay(null);
    setOverlayVisible(false);
    setCanReplay(false);
    setHistoryIndex(-1);
    setRenderTick(t => t + 1);
    addLog("SYSTEM", ">> Network visually reset. History preserved for playback.");
  }, [addLog]);

  const stepBackward = useCallback(() => {
    if (historyIndex >= 0) {
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      rebuildGraph(nextIndex, history);
      addLog("SYSTEM", ">> Stepped backward in history.");
    }
  }, [historyIndex, history, rebuildGraph, addLog]);

  const stepForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      rebuildGraph(nextIndex, history);
      addLog("SYSTEM", ">> Stepped forward in history.");
    }
  }, [historyIndex, history, rebuildGraph, addLog]);

  const handleReplay = useCallback(() => {
    if (replayRef.current && !animating) {
      nodesRef.current = nodesRef.current.map(n => ({ ...n, state: n.active ? "active" : "failed" }));
      edgesRef.current = edgesRef.current.map(e => ({ ...e, state: e.state === "failed" ? "failed" : "normal" }));
      runAnim(replayRef.current.steps, replayRef.current.onDone);
    }
  }, [animating, runAnim]);

  // Calculations
  const nodeCount = nodesRef.current.length;
  const edgeCount = edgesRef.current.length;
  const activeCount = nodesRef.current.filter(n => n.active).length;
  const failedCount = nodeCount - activeCount;

  const canvR = canvasRef;
  const sideRes = sideResizing;
  const termRes = termResizing;

  // Design tokens
  const inp: React.CSSProperties = {
    background: "rgba(255, 255, 255, 0.04)",
    border: "none",
    borderBottom: "1px solid rgba(0, 212, 255, 0.25)",
    borderRadius: "6px 6px 0 0",
    padding: "10px 12px",
    color: "white",
    fontFamily: "'DM Mono', monospace",
    fontSize: 13,
    outline: "none",
    transition: "all 0.2s ease",
    width: "100%",
  };

  const btn = (variant: "primary" | "danger" | "warning" | "muted" = "primary"): React.CSSProperties => {
    let accent = "#00d4ff";
    if (variant === "danger") accent = "#ff3333";
    if (variant === "warning") accent = "#ff9500";
    if (variant === "muted") accent = "rgba(255, 255, 255, 0.4)";

    return {
      background: `linear-gradient(135deg, ${accent}26, ${accent}1a)`,
      border: `1px solid ${accent}40`,
      color: accent,
      borderRadius: 8,
      padding: "10px 16px",
      fontFamily: "'DM Mono', monospace",
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: "0.05em",
      cursor: "pointer",
      width: "100%",
      transition: "all 0.2s ease",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    };
  };

  const lbl: React.CSSProperties = {
    display: "block",
    fontSize: 10,
    fontWeight: 600,
    color: "rgba(255, 255, 255, 0.4)",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  const errTxt = (field: string) => errs[field]
    ? <div style={{ color: "#ff4444", fontSize: 10, marginTop: 4 }}>{errs[field]}</div>
    : null;

  const CardHeader = ({ title, icon: Icon, color }: any) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", color }}>
        <Icon size={16} />
      </div>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.9)", margin: 0 }}>{title}</h3>
    </div>
  );

  const overlayKindColor = overlay?.kind === "bfs" ? "#4da6ff" : overlay?.kind === "dfs" ? "#bf7fff" : "#ffd700";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#050810", overflow: "hidden", userSelect: "none", color: "#ffffff", fontFamily: "'DM Mono', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0, 212, 255, 0.2); border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0, 212, 255, 0.4); }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; box-shadow: 0 0 0 0 rgba(0, 212, 255, 0.7); }
          50% { transform: scale(1.4); opacity: 1; box-shadow: 0 0 15px 5px rgba(0, 212, 255, 0.3); }
          100% { transform: scale(1); opacity: 0.8; box-shadow: 0 0 0 0 rgba(0, 212, 255, 0); }
        }
        @keyframes fin { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes statPop { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes pdot { 0%, 100% { transform: scale(1); opacity: 0.4; } 50% { transform: scale(1.5); opacity: 1; } }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.07);
          backdrop-filter: blur(10px);
          transition: all 0.2s ease;
          border-radius: 12px;
          padding: 16px;
          margin: 8px 12px;
        }
        .glass-card:hover { border-color: rgba(0, 212, 255, 0.2); box-shadow: 0 0 20px rgba(0, 212, 255, 0.05); }
        .btn-hover:hover { transform: translateY(-1px); box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
        .btn-hover:active { transform: translateY(0); }
        .btn-hover:disabled { opacity: 0.5; cursor: not-allowed; }
        input:focus { border-bottom-color: #00d4ff !important; background: rgba(0, 212, 255, 0.06) !important; box-shadow: 0 2px 0 rgba(0, 212, 255, 0.3); }
        input::placeholder { color: rgba(255, 255, 255, 0.25); font-style: italic; }
      `}</style>
      
      <header style={{
        height: 56, width: "100%", position: "sticky", top: 0, zIndex: 100,
        background: "rgba(8, 12, 22, 0.95)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0, 212, 255, 0.15)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", flexShrink: 0
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 10, height: 10, background: "#00d4ff", borderRadius: "50%",
            animation: `pulse ${Math.max(0.5, 3 - activeCount * 0.2)}s infinite ease-in-out`
          }} />
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>Network Fault Detector</span>
            <span style={{ fontSize: 14, fontWeight: 400, color: "rgba(255, 255, 255, 0.5)" }}>&amp; Recovery Planner</span>
            <span style={{ fontSize: 12, color: "rgba(0, 212, 255, 0.4)", marginLeft: 8 }}>| ADS · PCCOE</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 0 }}>
          {[
            { label: "ROUTERS", val: nodeCount, color: "#00d4ff" },
            { label: "LINKS", val: edgeCount, color: "#4db8ff" },
            { label: "ACTIVE", val: activeCount, color: "#00ff88" },
            { label: "FAILED", val: failedCount, color: "#ff3333" }
          ].map((s, i) => (
            <div key={s.label} style={{
              padding: "0 16px",
              borderRight: i < 3 ? "1px solid rgba(255, 255, 255, 0.08)" : "none",
              display: "flex", flexDirection: "column", alignItems: "flex-end"
            }}>
              <span style={{ fontSize: 9, color: "rgba(255, 255, 255, 0.4)", letterSpacing: 0.5 }}>{s.label}</span>
              <span style={{
                fontSize: 20, fontWeight: 600, color: s.color,
                animation: s.label === "FAILED" && failedCount > 0 ? "statPop 0.3s ease-out" : "none"
              }}>{s.val}</span>
            </div>
          ))}
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        <aside style={{ 
          width: sideW, flexShrink: 0, overflowY: "auto", 
          background: "rgba(10, 14, 26, 0.7)", backdropFilter: "blur(24px)",
          borderRight: "1px solid rgba(0, 212, 255, 0.12)",
          padding: "12px 0",
          userSelect: sideResizing.current ? "none" : "auto"
        }}>
          <div className="glass-card">
            <CardHeader title="Add Router" icon={PlusCircle} color="#00d4ff" />
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Router ID</label>
              <input style={inp} value={routerIn} onChange={(e) => setRouterIn(e.target.value)} placeholder="e.g. 1" onKeyDown={(e) => e.key === "Enter" && addRouter()} />
              {errTxt("router")}
            </div>
            <InteractiveHoverButton className="w-full text-xs h-9 bg-blue-500/10 text-blue-400 border-blue-500/20" onClick={addRouter}>
              <PlusCircle size={14} /> ADD ROUTER
            </InteractiveHoverButton>
          </div>

          <div className="glass-card">
            <CardHeader title="Add Link" icon={Link2} color="#4db8ff" />
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1 }}><label style={lbl}>From ID</label><input style={inp} value={eFrom} onChange={(e) => setEFrom(e.target.value)} placeholder="0" /></div>
              <div style={{ flex: 1 }}><label style={lbl}>To ID</label><input style={inp} value={eTo} onChange={(e) => setETo(e.target.value)} placeholder="0" /></div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Latency (ms)</label>
              <input style={inp} value={eLatency} onChange={(e) => setELatency(e.target.value)} placeholder="e.g. 10" onKeyDown={(e) => e.key === "Enter" && addEdge()} />
            </div>
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              {["One-way", "Two-way"].map((d) => (
                <label key={d} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                  <input type="radio" name="dir" checked={eBidi === (d === "Two-way")} onChange={() => setEBidi(d === "Two-way")} style={{ accentColor: "#00d4ff", width: 16, height: 16 }} />
                  {d}
                </label>
              ))}
            </div>
            <InteractiveHoverButton className="w-full text-xs h-9 bg-cyan-500/10 text-cyan-400 border-cyan-500/20" onClick={addEdge}>
              <Link2 size={14} /> ADD LINK
            </InteractiveHoverButton>
          </div>

          <div className="glass-card" style={{ borderColor: "rgba(255, 51, 51, 0.15)" }}>
            <CardHeader title="Simulate Fault" icon={Zap} color="#ff3333" />
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Faulty Router ID</label>
              <input style={inp} value={faultIn} onChange={(e) => setFaultIn(e.target.value)} placeholder="e.g. 2" onKeyDown={(e) => e.key === "Enter" && failRouter()} />
              {errTxt("fault")}
            </div>
            <InteractiveHoverButton className="w-full text-xs h-9 bg-red-500/10 text-red-500 border-red-500/20" onClick={failRouter}>
              <Zap size={14} /> FAIL ROUTER
            </InteractiveHoverButton>
          </div>

          <div className="glass-card">
            <CardHeader title="Algorithms" icon={Activity} color="#4db8ff" />
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>BFS Fault Detection (Source)</label>
              <input style={inp} value={bfsSrc} onChange={(e) => setBfsSrc(e.target.value)} placeholder="ID" />
              <InteractiveHoverButton className="w-full text-xs h-9 mt-2 bg-blue-500/10 text-blue-400 border-blue-500/20" onClick={runBFS} disabled={animating}>
                RUN BFS
              </InteractiveHoverButton>
            </div>
            <div style={{ marginBottom: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <label style={lbl}>DFS Path Finder</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input style={inp} value={dfsFrom} onChange={(e) => setDfsFrom(e.target.value)} placeholder="From" />
                <input style={inp} value={dfsTo} onChange={(e) => setDfsTo(e.target.value)} placeholder="To" />
              </div>
              <InteractiveHoverButton className="w-full text-xs h-9 mt-2 bg-purple-500/10 text-purple-400 border-purple-500/20" onClick={runDFS} disabled={animating}>
                RUN DFS
              </InteractiveHoverButton>
            </div>
            <div style={{ paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <label style={lbl}>Recovery Plan</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input style={inp} value={recFrom} onChange={(e) => setRecFrom(e.target.value)} placeholder="From" />
                <input style={inp} value={recTo} onChange={(e) => setRecTo(e.target.value)} placeholder="To" />
              </div>
              <ShimmerButton className="w-full text-xs h-9 mt-2 shadow-2xl" onClick={runRecovery} disabled={animating}>
                <span className="whitespace-pre-wrap text-center text-xs font-semibold leading-none tracking-tighter text-white">
                  RUN RECOVERY PLAN
                </span>
              </ShimmerButton>
            </div>
          </div>

          <div className="glass-card">
            <CardHeader title="System" icon={Settings} color="rgba(255,255,255,0.4)" />
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={lbl}>Speed</label>
                <span style={{ fontSize: 11, color: "#00d4ff" }}>{animSpeed}x</span>
              </div>
              <input type="range" min={0} max={4} step={1} value={[0.25, 0.5, 1, 2, 4].indexOf(animSpeed)} 
                onChange={(e) => setAnimSpeed([0.25, 0.5, 1, 2, 4][parseInt(e.target.value)])}
                style={{ width: "100%", accentColor: "#00d4ff", height: 4, borderRadius: 2 }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {canReplay && <button className="btn-hover" style={{ ...btn("muted"), color: "#00ff88", borderColor: "#00ff8840" }} onClick={handleReplay} disabled={animating}><RotateCcw size={14}/> REPLAY LAST</button>}
              <button className="btn-hover" style={btn("muted")} onClick={clearHighlights}>CLEAR HIGHLIGHTS</button>
              <button className="btn-hover" style={btn("danger")} onClick={resetAll}>RESET ALL</button>
            </div>
          </div>
        </aside>

        <div
          style={{ width: 5, background: "transparent", cursor: "col-resize", flexShrink: 0, zIndex: 10, transition: "background 0.1s" }}
          onMouseDown={(e: React.MouseEvent) => { sideResizing.current = true; resizeStart.current = { x: e.clientX, y: e.clientY, val: sideW }; }}
          onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = "rgba(0,212,255,0.18)")}
          onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = "transparent")}
        />

        <main style={{ flex: 1, position: "relative", background: "#050810", overflow: "hidden" }}>
          <AnimatedGridPattern
            numSquares={100}
            maxOpacity={0.4}
            duration={3}
            repeatDelay={1}
            className={cn(
              "[mask-image:radial-gradient(1000px_circle_at_center,white,transparent)]",
              "inset-0 opacity-100"
            )}
          />
          <canvas ref={canvR} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} style={{ width: "100%", height: "100%", display: "block", position: "relative", zIndex: 1 }} />

          {overlay && (
            <div style={{
              position: "absolute", top: 20, right: 20,
              background: "rgba(8,12,22,0.95)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderLeft: `4px solid ${overlayKindColor}`,
              borderRadius: "0 8px 8px 0",
              padding: "10px 14px",
              animation: "fin 0.3s ease",
              fontFamily: "'Courier New',monospace", fontSize: 11,
              boxShadow: `0 4px 24px rgba(0,0,0,0.4), 0 0 20px ${overlayKindColor}18`,
              opacity: overlayVisible ? 1 : 0,
              transform: overlayVisible ? "translateY(0)" : "translateY(-8px)",
              transition: "opacity 0.4s ease, transform 0.4s ease",
              zIndex: 50, maxWidth: 320
            }}>
              {overlay.kind === "bfs" && (
                <>
                  <div style={{ color: "#4da6ff", marginBottom: 6, fontSize: 12, display: "flex", alignItems: "center", gap: 5, fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>
                    <Activity size={13} /> BFS Result
                  </div>
                  <div style={{ color: "#00ff88" }}>✓ Visited: {overlay.reachable?.map((n: number) => `R${n}`).join(", ")}</div>
                  {overlay.unreachable && overlay.unreachable.length > 0
                    ? <div style={{ color: "#ff9500", marginTop: 4 }}>✕ Unreachable: {overlay.unreachable.map((n: number) => `R${n}`).join(", ")}</div>
                    : <div style={{ color: "rgba(255,255,255,0.3)", marginTop: 4 }}>✕ Unreachable: None</div>}
                </>
              )}
              {overlay.kind === "dfs" && (
                <>
                  <div style={{ color: "#bf7fff", marginBottom: 6, fontSize: 12, display: "flex", alignItems: "center", gap: 5, fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>
                    <GitBranch size={13} /> DFS Result
                  </div>
                  <div style={{ color: "#fff" }}>R{overlay.from} → R{overlay.to}: <span style={{ color: "#00ff88" }}>{overlay.pathCount}</span> path(s)</div>
                  {overlay.paths?.slice(0, 4).map((p, i) => (
                    <div key={i} style={{ color: "rgba(255,255,255,0.5)", marginTop: 3, fontSize: 10 }}>P{i + 1}: {p}</div>
                  ))}
                </>
              )}
              {overlay.kind === "recovery" && (
                <>
                  <div style={{ color: "#ffd700", marginBottom: 6, fontSize: 12, display: "flex", alignItems: "center", gap: 5, fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>
                    <Network size={13} /> Recovery Plan
                  </div>
                  {overlay.recoveryPath === "NONE"
                    ? <div style={{ color: "#ff3333" }}>✕ Network partition! No path available.</div>
                    : <>
                      <div style={{ color: "#00ff88", wordBreak: "break-all" }}>Path: {overlay.recoveryPath}</div>
                      <div style={{ color: "#ffd700", marginTop: 4 }}>Total latency: {overlay.latency}ms</div>
                    </>}
                </>
              )}
            </div>
          )}

          {/* Animating indicator */}
          {animating && (
            <div style={{
              position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)",
              background: "rgba(8,12,22,0.9)", border: "1px solid rgba(0,212,255,0.2)",
              borderRadius: 20, padding: "4px 16px",
              fontFamily: "'Inter',sans-serif", fontSize: 10, color: "#00d4ff",
              display: "flex", alignItems: "center", gap: 7,
            }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#00d4ff", animation: "pdot 0.7s ease-in-out infinite" }} />
              Simulation running...
            </div>
          )}

          <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 60 }}>
            <Dock iconSize={40} iconMagnification={54} iconDistance={100} className="bg-black/60 border-white/5 backdrop-blur-xl">
              <DockIcon onClick={stepBackward} className={cn("bg-white/5 transition-colors", historyIndex >= 0 ? "hover:bg-white/10" : "opacity-50 cursor-not-allowed")}>
                <SkipBack size={20} className="text-white/60" />
              </DockIcon>
              <DockIcon onClick={stepForward} className={cn("bg-white/5 transition-colors", historyIndex < history.length - 1 ? "hover:bg-white/10" : "opacity-50 cursor-not-allowed")}>
                <SkipForward size={20} className="text-white/60" />
              </DockIcon>
              <DockIcon onClick={clearHighlights} className="bg-white/5 hover:bg-white/10 transition-colors">
                <Trash2 size={20} className="text-white/60" />
              </DockIcon>
              <DockIcon onClick={handleReplay} className="bg-white/5 hover:bg-white/10 transition-colors">
                <RefreshCw size={20} className="text-green-400/60" />
              </DockIcon>
              <DockIcon onClick={resetAll} className="bg-white/5 hover:bg-white/10 transition-colors">
                <RotateCcw size={20} className="text-red-400/60" />
              </DockIcon>
            </Dock>
          </div>
        </main>
      </div>

      <div
        style={{ height: 5, background: "transparent", cursor: "row-resize", flexShrink: 0, borderTop: "1px solid rgba(0,212,255,0.08)", transition: "background 0.1s" }}
        onMouseDown={(e: React.MouseEvent) => { termResizing.current = true; resizeStart.current = { x: e.clientX, y: e.clientY, val: termH }; }}
        onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = "rgba(0,212,255,0.18)")}
        onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = "transparent")}
      />

      <div style={{ height: termH, position: "relative", flexShrink: 0, display: "flex", flexDirection: "column", background: "#060a12", overflow: "hidden" }}>
        <FlickeringGrid
          className="absolute inset-0 z-0 [mask-image:linear-gradient(to_bottom,white,transparent)]"
          squareSize={4}
          gridGap={6}
          color="#00d4ff"
          maxOpacity={0.1}
          flickerChance={0.05}
        />
        <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "4px 14px", borderBottom: "1px solid rgba(0,212,255,0.08)",
            background: "rgba(8, 13, 24, 0.4)", backdropFilter: "blur(8px)", flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", gap: 5 }}>
                {["#ff5f57", "#febc2e", "#28c840"].map(c => (
                  <div key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c, opacity: 0.8 }} />
                ))}
              </div>
              <span style={{ fontFamily: "'Courier New',monospace", fontSize: 9, color: "rgba(0,212,255,0.4)", textTransform: "uppercase", letterSpacing: 1 }}>
                Console Output
              </span>
            </div>
            <button
              onClick={() => setLogs([])}
              style={{
                background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.3)", fontSize: 9, padding: "2px 9px",
                borderRadius: 4, cursor: "pointer", fontFamily: "'Courier New',monospace",
                transition: "all 0.15s",
              }}
            >
              Clear
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "5px 14px", fontFamily: "'Courier New',monospace", fontSize: 10.5, lineHeight: 1.7 }}>
            {logs.length === 0 && (
              <div style={{ color: "rgba(0,212,255,0.18)", padding: "3px 0" }}>// Console output appears here...</div>
            )}
            {logs.map((log: LogEntry, idx: number) => (
              <div key={log.id} style={{ display: "flex", gap: 8, alignItems: "baseline", padding: "1px 0" }}>
                <span style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0, fontSize: 9 }}>{log.ts}</span>
                <span style={{
                  background: `${LOG_COLOR[log.type]}18`,
                  border: `1px solid ${LOG_COLOR[log.type]}40`,
                  color: LOG_COLOR[log.type],
                  fontFamily: "'Courier New',monospace",
                  fontSize: 8.5,
                  padding: "0 5px",
                  borderRadius: 4,
                  fontWeight: 700,
                  flexShrink: 0,
                  lineHeight: "16px",
                }}>{log.type}</span>
                <span style={{ color: "rgba(255,255,255,0.7)" }}>{log.msg}</span>
                {idx === logs.length - 1 && (
                  <span style={{ animation: "blink 1s step-start infinite", color: "#00d4ff", fontSize: 11, marginLeft: 2 }}>▒</span>
                )}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

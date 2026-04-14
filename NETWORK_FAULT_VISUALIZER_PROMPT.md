# NETWORK FAULT DETECTOR & RECOVERY PLANNER — INTERACTIVE FRONTEND
## Complete Agent Build Prompt

---

## PROJECT OVERVIEW

Build a **fully interactive, single-file React (JSX) frontend** for a **Network Fault Detector and Recovery Planner** system. This is an academic project from PCCOE Pune (Computer Engineering, ADS subject) that visualizes graph-based network fault detection using BFS, DFS, and BST algorithms.

The frontend must feel like **Obsidian's graph view meets a network operations center (NOC) dashboard** — dark, glowing, alive, with nodes that float and repel each other with physics-like behavior exactly as Obsidian brain/graph nodes do.

---

## TECH STACK

- **React (JSX) — single `.jsx` file, no separate CSS files**
- All styling via **Tailwind utility classes + inline styles** where needed
- Use **`useState`, `useEffect`, `useRef`, `useCallback`** hooks
- Canvas rendering via **HTML5 Canvas API** for the graph visualization (nodes + edges drawn on canvas)
- No external graph libraries — implement the physics simulation and rendering manually
- Available libraries: `lucide-react`, `recharts` if needed

---

## CORE CONCEPT — THE OBSIDIAN NODE BEHAVIOR

This is the most critical part. The nodes on the canvas MUST behave exactly like Obsidian's graph/brain view:

### Node Physics (implement a force-directed simulation):
- Every node has `x`, `y`, `vx`, `vy` (position + velocity) properties
- **Repulsion**: Every node repels every other node (like electrons) — use inverse-square law: `force = repulsionStrength / distance²`
- **Attraction**: Connected nodes are pulled toward each other via a spring force along their edges — `force = springStrength * (distance - restLength)`
- **Centering**: A weak force pulls all nodes toward the canvas center so they don't drift off screen
- **Damping**: Velocity is multiplied by a damping factor (0.85) each frame so nodes settle gracefully
- **Drag**: User can click and drag any node — while dragging, that node's velocity is zeroed and position follows mouse
- **Animation loop**: Use `requestAnimationFrame` — the simulation runs continuously at ~60fps so nodes are always gently floating and settling, never completely static
- Nodes should gently wobble/float even when "settled" — add a tiny random nudge each frame so they never fully freeze (this is the Obsidian feel)
- When a new node or edge is added, the simulation should visibly re-settle as forces rebalance

### Node Appearance:
- Nodes are **glowing circles** on a dark canvas
- Default state: deep blue/cyan glow (`#00d4ff` with a radial gradient aura)
- Font: node label (Router ID) centered inside, white, monospace
- Edge: thin glowing line connecting nodes, color matches node state
- **Node states and their visual appearance:**
  - `active`: cyan glow, `#00d4ff`, pulsing ring animation
  - `failed`: red glow, `#ff3333`, static (no pulse), grey fill, crossed out visually
  - `unreachable`: orange/amber glow, `#ff9500`, dimmed
  - `bfs-visited`: bright white/blue flash as BFS wave passes through it
  - `dfs-path`: green glow, `#00ff88`, snake animation crawling along edges
  - `recovery-path`: bright gold glow, `#ffd700`, thicker edge, animated dash

### Edge Appearance:
- Default: thin glowing line, color `rgba(0, 212, 255, 0.4)`
- Directed edges: draw an **arrowhead** at the destination end
- Bidirectional edges: draw **two arrowheads** (or a double-headed arrow)
- Edge label: show latency value (e.g. "4ms") as small text at edge midpoint
- Failed edge (connected to failed node): fade to dark red, dashed
- Recovery path edge: thick gold animated dashed line

---

## LAYOUT

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: "Network Fault Detector & Recovery Planner"  [PCCOE]   │
├──────────────────────────┬──────────────────────────────────────┤
│                          │                                       │
│   LEFT CONTROL PANEL     │      CANVAS (Graph Visualization)    │
│   (scrollable, ~320px)   │      (fills remaining space)         │
│                          │                                       │
│  ┌─ ADD ROUTER ────────┐ │   [nodes floating, physics-based]    │
│  │ Router ID: [____]   │ │                                       │
│  │ [Add Router]        │ │                                       │
│  └─────────────────────┘ │                                       │
│                          │                                       │
│  ┌─ ADD LINK ──────────┐ │                                       │
│  │ From: [__] To: [__] │ │                                       │
│  │ Latency: [___] ms   │ │                                       │
│  │ ○ One-way  ○ Two-way│ │                                       │
│  │ [Add Link]          │ │                                       │
│  └─────────────────────┘ │                                       │
│                          │                                       │
│  ┌─ SIMULATE FAULT ────┐ │                                       │
│  │ Router ID: [____]   │ │                                       │
│  │ [Fail This Router]  │ │                                       │
│  └─────────────────────┘ │                                       │
│                          │                                       │
│  ┌─ ALGORITHMS ────────┐ │                                       │
│  │ [Run BFS]           │ │                                       │
│  │ Source: [__]        │ │                                       │
│  │                     │ │                                       │
│  │ [Run DFS]           │ │                                       │
│  │ From:[__] To:[__]   │ │                                       │
│  │                     │ │                                       │
│  │ [Recovery Plan]     │ │                                       │
│  │ From:[__] To:[__]   │ │                                       │
│  └─────────────────────┘ │                                       │
│                          │                                       │
│  ┌─ BST SEARCH ────────┐ │                                       │
│  │ Router ID: [____]   │ │                                       │
│  │ [Search BST]        │ │                                       │
│  └─────────────────────┘ │                                       │
│                          │                                       │
│  ┌─ CONTROLS ──────────┐ │                                       │
│  │ [Reset Network]     │ │                                       │
│  │ [Reset Faults Only] │ │                                       │
│  └─────────────────────┘ │                                       │
├──────────────────────────┴──────────────────────────────────────┤
│  BOTTOM LOG PANEL: scrollable console output of all actions      │
│  e.g. ">> BFS from Router 1: visited 1,3,5,4 | Unreachable: 2"  │
└─────────────────────────────────────────────────────────────────┘
```

---

## THEME & AESTHETICS

- **Background**: `#0a0e1a` (near-black with a deep blue tint)
- **Canvas background**: `#080c16` with a subtle dot-grid pattern (CSS background-image radial-gradient dots)
- **Panel background**: `#0f1420` with `rgba(0, 212, 255, 0.05)` border glow
- **Primary accent**: `#00d4ff` (cyan)
- **Success/Recovery**: `#00ff88` (green)
- **Fault/Failure**: `#ff3333` (red)
- **Warning/Unreachable**: `#ff9500` (amber)
- **Recovery path**: `#ffd700` (gold)
- **Font**: Use `'Courier New', monospace` for all labels and console — gives the NOC/terminal feel. Use a clean sans-serif like `'Inter'` or `'DM Sans'` (import from Google Fonts via @import in a style tag) for headings and UI labels
- **Borders**: `1px solid rgba(0, 212, 255, 0.2)` with `box-shadow: 0 0 10px rgba(0, 212, 255, 0.1)` on panels
- **Buttons**: Dark background, cyan border, cyan text, on hover fill with cyan and dark text — smooth transition
- All input fields: dark background, cyan bottom-border only, white text, no outline

---

## DATA MODEL

```javascript
// Core state
const [nodes, setNodes] = useState([])
// Node object shape:
// {
//   id: number,           // Router ID (user-defined, e.g. 1, 2, 3...)
//   x: number,            // canvas x position
//   y: number,            // canvas y position  
//   vx: number,           // velocity x (for physics)
//   vy: number,           // velocity y (for physics)
//   state: string,        // 'active' | 'failed' | 'unreachable' | 'bfs-visited' | 'dfs-path' | 'recovery'
//   active: boolean,      // false if router has been failed
// }

const [edges, setEdges] = useState([])
// Edge object shape:
// {
//   id: string,           // e.g. "1-2-oneway"
//   from: number,         // source router ID
//   to: number,           // destination router ID
//   weight: number,       // latency in ms
//   bidirectional: boolean,
//   state: string,        // 'normal' | 'failed' | 'dfs-path' | 'recovery'
// }

const [bstNodes, setBstNodes] = useState([])   // array of router IDs inserted into BST
const [logs, setLogs] = useState([])           // console log entries
const [animQueue, setAnimQueue] = useState([]) // queue of animation steps
```

---

## ALGORITHM IMPLEMENTATIONS (in JavaScript, in the frontend)

All algorithms must be implemented fully in JavaScript within the React component. They must produce step-by-step animation queues so the visualization animates each step.

### BFS — Fault Detection
```
Input: source router ID
1. Build adjacency from edges state (respect directionality)
2. Skip failed nodes (active === false)
3. BFS level-by-level from source, following only OUTGOING directed edges
4. For each visited node: push animation step { type: 'bfs-visit', nodeId, delay }
5. After BFS: collect all active nodes NOT visited → mark as 'unreachable'
6. Push animation steps for unreachable nodes
7. Log output: "BFS from Router X: Visited [list] | Unreachable: [list]"
```

### DFS — All Paths Finder
```
Input: source router ID, destination router ID
1. Recursive DFS with backtracking
2. Follow only outgoing directed edges from active nodes
3. Each time destination is reached: record the full path
4. For each step forward: push animation { type: 'dfs-forward', nodeId, edgeId }
5. For each backtrack: push animation { type: 'dfs-backtrack', nodeId }
6. After all paths found: animate each complete path sequentially
7. Log output: "DFS Router X → Y: Path 1: X→A→B→Y | Path 2: ... | Total: N"
```

### Recovery Plan
```
Input: source router ID, destination router ID
1. Run DFS to find all paths (same as above)
2. If no paths: log "No backup path! Network partition detected."
3. If paths found: highlight Path 1 as the recovery path (gold animation)
4. Log output: "Recovery: Activate path X→A→B→Y (latency: Xms total)"
   (sum up edge weights along the recovery path for total latency)
```

### BST — Insert and Search
```
On every node addition: auto-insert router ID into BST
BST Search input: router ID
- Traverse BST left/right
- Animate the BST search in the LOG panel (show the traversal steps as text)
- Log: "BST Search R5: Root(3) → Right(5) → FOUND" or "NOT FOUND"
```

---

## ANIMATION SYSTEM

Implement a step-based animation queue processor:

```javascript
// Animation step types:
// { type: 'bfs-visit', nodeId: N, delay: ms }
// { type: 'bfs-unreachable', nodeId: N, delay: ms }
// { type: 'dfs-forward', nodeId: N, edgeId: E, delay: ms }
// { type: 'dfs-backtrack', nodeId: N, delay: ms }
// { type: 'dfs-path-found', path: [N1,N2,...], delay: ms }
// { type: 'recovery-highlight', path: [N1,N2,...], delay: ms }
// { type: 'node-fail', nodeId: N, delay: ms }
// { type: 'reset-colors', delay: ms }

// Process queue: use setTimeout chains or a recursive processor
// Each step modifies node/edge states which triggers canvas redraw
```

**Animation speeds:**
- BFS level visit: 400ms between each node lighting up
- DFS forward step: 300ms
- DFS backtrack: 150ms (faster, feels like retreating)
- Recovery path highlight: 600ms per edge segment (slow, dramatic)
- Node fail: immediate + 500ms red pulse ring animation drawn on canvas

---

## CANVAS RENDERING (draw function — called every frame)

```
drawFrame():
  1. Clear canvas
  2. Draw dot-grid background
  3. For each edge:
     - Compute start/end points (from node x,y positions)
     - Draw line with appropriate color/width based on edge.state
     - If directed: draw arrowhead at destination
     - If bidirectional: draw arrowhead at both ends
     - Draw latency label at midpoint
     - If recovery path: draw animated dashed line (use lineDashOffset animated over time)
  4. For each node:
     - Draw outer glow (radial gradient, color based on node.state)
     - Draw pulsing ring for active nodes (radius oscillates with sin(time))
     - Draw filled circle
     - Draw router ID label centered
     - If failed: draw X over the node
     - If bfs-visited: draw a brief flash ring expanding outward
  5. Draw canvas legend (bottom right):
     - ● Active  ● Failed  ● Unreachable  ● BFS Visited  ● Recovery Path
```

---

## USER INTERACTIONS

### Building the Network:
1. **Add Router**: User enters a Router ID number → node appears at a random position near canvas center → physics simulation immediately starts pulling/pushing it into place
2. **Add Link**: User enters From ID, To ID, latency, and selects One-way or Two-way → edge appears with animated "drawing" effect (line grows from source to destination)
3. **Fail Router**: User enters Router ID → node-fail animation plays (red pulse ring expands from node, node dims to grey with X) → all edges connecting to it fade to dashed red
4. **Reset Faults Only**: Restore all failed nodes to active state, clear algorithm color states, keep topology intact
5. **Reset Network**: Clear everything — all nodes, edges, logs

### Canvas Interactions:
- **Drag nodes**: Click and drag any node to reposition it — physics simulation resumes when released
- **Hover node**: Show tooltip with Router ID, number of outgoing links, current state
- **Click node**: Select it — highlight it with a white ring, auto-fill its ID into the "Fault Router" input field

### Algorithm Controls:
- All algorithm inputs have validation — show inline red error message if:
  - Router ID doesn't exist
  - Router is already failed
  - No network built yet
- After running any algorithm: show a "Clear Highlights" button that resets all node/edge colors to default while keeping topology and fault state

---

## BOTTOM LOG PANEL

- Dark terminal-style panel, height ~180px, scrollable
- Each log entry has a timestamp and color-coded prefix:
  - `[BUILD]` → cyan
  - `[FAULT]` → red  
  - `[BFS]` → blue
  - `[DFS]` → purple
  - `[RECOVERY]` → gold
  - `[BST]` → green
  - `[ERROR]` → red bold
- Auto-scrolls to bottom on new entry
- Shows exact same messages as the C++ code would print:
  - `>> Link added: Router 1 --> Router 2 (Latency: 4ms, One-way)`
  - `>> Router 2 has FAILED and is removed from network.`
  - `BFS Traversal from Router 1: 1 3 5 4 6`
  - `Unreachable Routers: None — network is fully connected!`
  - `All paths from Router 1 to Router 4:`
  - `  Path 1: 1 -> 3 -> 5 -> 4`
  - `  Total paths found: 1`
  - `>> Recovery suggestion: Activate Path 1 shown above. (Total latency: 14ms)`

---

## EDGE CASES TO HANDLE IN UI

| Scenario | UI Behavior |
|---|---|
| User tries to add duplicate Router ID | Show inline error: "Router X already exists" |
| User tries to add edge between non-existent routers | Show error: "Router X not found" |
| User runs BFS on failed source | Show error panel: "Source Router X is itself down!" |
| User runs DFS with no path | Animate DFS exploring and backtracking, then show: "No paths found" in log |
| User removes all routers | Canvas shows empty with helper text: "Add routers to begin" |
| User tries to fail an already-failed router | Show: "Router X is already down" |
| Single node with no edges | BFS visits only source, logs "Unreachable: None" |

---

## ADDITIONAL UI DETAILS

### Header:
- Title: "Network Fault Detector & Recovery Planner"
- Subtitle: "ADS Mini Project — PCCOE Pune | BFS · DFS · BST"
- A small animated "network pulse" icon (CSS animated dot or SVG)
- Live stats bar: `Routers: N | Links: E | Active: X | Failed: Y`

### Canvas empty state:
- Center of canvas shows ghost text: `"Build your network →"` with an arrow pointing to the left panel
- Subtle animated concentric rings pulsing from center (like a radar) to indicate the canvas is ready

### Algorithm result overlay (appears on canvas after algorithm runs):
- Small floating card in top-right of canvas area showing:
  - BFS result: "✓ Reachable: [list] | ✗ Unreachable: [list]"
  - DFS result: "Found N path(s) from Router X to Router Y"
  - Recovery: "Recovery path: X→A→B→Y | Total latency: Xms"
- Card fades out after 5 seconds or on next action

---

## PHYSICS CONSTANTS (tune these for the Obsidian feel)

```javascript
const PHYSICS = {
  repulsion: 3000,        // how strongly nodes push each other away
  springStrength: 0.03,   // how strongly edges pull connected nodes
  springRestLength: 150,  // natural/rest length of edge spring (pixels)
  centeringForce: 0.002,  // gentle pull toward canvas center
  damping: 0.88,          // velocity damping per frame (higher = more bouncy)
  maxVelocity: 8,         // cap velocity to prevent explosion
  idleNudge: 0.05,        // tiny random nudge per frame to keep nodes alive
  nodeRadius: 22,         // default node circle radius
}
```

---

## SAMPLE NETWORK FOR TESTING (agent should NOT hardcode this — it is only for agent to verify the UI works correctly during development)

```
Routers: 1, 2, 3, 4, 5, 6
Links (all one-way directed):
1 → 2 (4ms)
1 → 3 (6ms)
2 → 4 (2ms)
3 → 5 (5ms)
5 → 4 (3ms)
5 → 6 (7ms)
3 → 6 (8ms)

Test scenario:
1. Fail Router 2
2. BFS from 1 → should show: Visited: 1,3,5,4,6 | Unreachable: None
3. DFS from 1 to 4 → Path 1: 1→3→5→4
4. Recovery Plan 1→4 → Activate Path 1→3→5→4 (latency: 14ms)
5. Fail Router 3 additionally
6. Recovery Plan 1→4 → No backup path! Network partition detected.
```

---

## WHAT THE AGENT MUST DELIVER

A single `.jsx` file that:

1. ✅ Renders a full-screen dark NOC-style dashboard
2. ✅ Has a left control panel with all input forms
3. ✅ Has a central canvas with Obsidian-style physics node simulation
4. ✅ Nodes glow, float, repel, attract, and can be dragged
5. ✅ Directed edges with arrowheads and latency labels
6. ✅ Complete BFS implementation with step-by-step animation
7. ✅ Complete DFS with backtracking and path animation
8. ✅ Recovery plan with gold path highlight animation
9. ✅ BST insert/search with log output
10. ✅ Router failure animation (red pulse, grey out, X mark)
11. ✅ Bottom terminal-style log panel
12. ✅ All edge cases handled with proper error messages
13. ✅ Canvas empty state with radar animation
14. ✅ Algorithm result overlay card
15. ✅ Reset controls
16. ✅ Node hover tooltip
17. ✅ Node click to select and auto-fill fault input

---

## remember!!!:

- if required for making the project enhance in design or anything use any external graph libraries (D3-force, Cytoscape, vis.js, react-flow, etc.)
- Do NOT hardcode any sample network — everything must come from user input
- Do NOT use `localStorage` or any browser storage APIs
- Do NOT create separate CSS files — all styles inline or Tailwind classes
- Do NOT make the nodes static — they must always be gently floating/moving
- Do NOT use undirected edges — all edges must respect the direction the user chose
- Do NOT skip the arrowheads on directed edges — this is critical for correctness

---

*Built for: PCCOE Pune — SY Computer Engineering — Advance Data Structures Mini Project*
*Team: Anushka Kamate | Prithviraj Sherikar | Aditi Kale | Neeraj Kore*
*Guide: Prof. Reena Kharat*

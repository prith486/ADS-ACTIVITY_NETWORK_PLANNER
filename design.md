# NETWORK FAULT DETECTOR & RECOVERY PLANNER — COMPLETE UI REDESIGN PROMPT

## Context

The existing frontend for this project is functionally complete but visually poor. It looks like a default dark-mode boilerplate with no design intentionality. This document specifies a complete visual redesign from scratch while keeping ALL existing functionality intact. Do not remove or break any feature — only improve the visual design, layout polish, and animation quality.

---

## Design Inspiration & Direction

Take design inspiration from these three sources combined:

1. **Linear.app** — ultra-sharp dark panels, clean monospace labels, razor-thin borders, no fluff
2. **Liveblocks / Figma tool UI** — collaborative tool feel, floating side panels, canvas-first thinking
3. **Framer.com** — bold typography, glassmorphism layering, dramatic motion and transitions

The resulting aesthetic should feel like a **professional network operations tool** — not a student project, not a generic dashboard. It should look like something a senior engineer at a tech company would use to monitor live infrastructure.

**One-line aesthetic direction:** *"Glassmorphism control panels floating over a deep space physics canvas — cyberpunk meets Linear.app."*

---

## What Is Currently Wrong (fix all of these)

### Layout Problems:
- The left panel is a plain scrollable div with zero visual hierarchy — every section looks identical
- Section headers (`ADD ROUTER`, `ADD LINK`, etc.) use all-caps plain text with no weight, color differentiation, or iconography that makes them feel alive
- The panel background blends into the canvas — there is no clear spatial separation
- The canvas area is completely empty-looking — the radar animation is barely visible and feels like a placeholder
- The header bar is too thin and cramped — team names are tiny and unreadable
- The stats counters (ROUTERS, LINKS, ACTIVE, FAILED) in the top-right are boxed but feel disconnected and cold

### Visual Problems:
- Input fields look like default browser inputs — no character, no glow, no personality
- Buttons are flat rectangles with thin borders — they don't feel satisfying to click
- The console output panel at the bottom is barely visible — it blends into the background
- The legend in the bottom-right corner is tiny floating text — it looks like an afterthought
- Color usage is inconsistent — some sections have colored left-border accents but most don't
- Typography is generic monospace throughout — no hierarchy between headings, labels, and values
- The canvas background is solid near-black — it needs depth and atmosphere

### Animation Problems:
- Nodes appear to be static circles — no visible pulsing glow rings
- No particle flow along edges
- Failed node has no dramatic animation — it just changes color
- BFS/DFS animations feel mechanical — no easing, no organic feel

---

## Layout Redesign Specification

### Overall Structure:
Keep the LEFT PANEL + RIGHT CANVAS layout. Do NOT switch to a different layout. The left panel should be **exactly 360px wide**, fixed, non-resizable. The canvas fills the remaining space fully.

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER (56px height)                                               │
│  [● animated dot] Title    BFS DFS BST Recovery badges   Stats bar  │
├──────────────────────────┬──────────────────────────────────────────┤
│                          │                                          │
│  LEFT PANEL (360px)      │   CANVAS (fills rest, dark space bg)    │
│  glassmorphism cards     │   physics node simulation                │
│  with smooth scrollbar   │   dot-grid + subtle vignette            │
│                          │                                          │
├──────────────────────────┴──────────────────────────────────────────┤
│  CONSOLE PANEL (200px height) — terminal style                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Header Redesign

**Height:** 56px, full width, `position: sticky, top: 0, z-index: 100`

**Background:** `rgba(8, 12, 22, 0.95)` with `backdrop-filter: blur(20px)` and a bottom border of `1px solid rgba(0, 212, 255, 0.15)`

**Left side:**
- Animated pulsing dot: 10px circle, color `#00d4ff`, CSS keyframe animation `pulse` — scale from 1 to 1.4 and back, glow expands
- Title: **"Network Fault Detector"** in font `'DM Mono', monospace` — weight 600, size 16px, color white
- Subtitle inline: **"& Recovery Planner"** — weight 400, size 14px, color `rgba(255,255,255,0.5)`
- Separator `|` then `ADS · PCCOE` in size 12px, muted cyan

**Center badges (BFS, DFS, BST, Recovery):**
- Each badge: pill shape, `border-radius: 20px`, small padding
- BFS: background `rgba(0, 150, 255, 0.15)`, border `rgba(0, 150, 255, 0.4)`, text `#4db8ff`
- DFS: background `rgba(150, 0, 255, 0.15)`, border `rgba(150, 0, 255, 0.4)`, text `#b366ff`
- BST: background `rgba(0, 200, 100, 0.15)`, border `rgba(0, 200, 100, 0.4)`, text `#33cc77`
- Recovery: background `rgba(255, 180, 0, 0.15)`, border `rgba(255, 180, 0, 0.4)`, text `#ffcc33`
- Team names: `Team: Prithviraj · Aditi · Neeraj · Anushka` — 11px, `rgba(255,255,255,0.35)`

**Right side — Stats bar:**
- Four stat blocks side by side, each: label on top (9px, muted), number below (20px, bold, monospace)
- ROUTERS: color `#00d4ff`
- LINKS: color `#4db8ff`
- ACTIVE: color `#00ff88`
- FAILED: color `#ff3333`
- Each block separated by `1px solid rgba(255,255,255,0.08)`
- When FAILED count > 0: the FAILED block gets a subtle red background flash animation

---

## Left Panel Redesign

**Background:** `rgba(10, 14, 26, 0.7)` with `backdrop-filter: blur(24px)`
**Border-right:** `1px solid rgba(0, 212, 255, 0.12)`
**Box-shadow (inward on right side):** `inset -1px 0 0 rgba(0, 212, 255, 0.06)`

### Section Card Style (apply to ALL sections):
Each section (Add Router, Add Link, Simulate Fault, Algorithms, BST Search, Animation Controls) must be a **glassmorphism card**:
```css
background: rgba(255, 255, 255, 0.03);
border: 1px solid rgba(255, 255, 255, 0.07);
border-radius: 12px;
padding: 16px;
margin: 8px 12px;
backdrop-filter: blur(10px);
transition: border-color 0.2s ease;
/* on hover: */
border-color: rgba(0, 212, 255, 0.2);
box-shadow: 0 0 20px rgba(0, 212, 255, 0.05);
```

### Section Header Style:
Each card must have a section header with:
- Left-side colored accent bar: `4px wide, border-radius: 2px, height: 16px` — color matches section theme
- Section icon (lucide-react) + section title
- Section title: 11px, letter-spacing 0.12em, font-weight 600, uppercase, color matches accent

Section color themes:
- Add Router: accent `#00d4ff` (cyan)
- Add Link: accent `#4db8ff` (blue)
- Simulate Fault: accent `#ff3333` (red) — this card also has `border-color: rgba(255,51,51,0.15)` always
- BFS: accent `#4db8ff`
- DFS: accent `#b366ff`
- Recovery Plan: accent `#ffd700`
- BST Search: accent `#00ff88`
- Animation Controls: accent `rgba(255,255,255,0.4)`

### Input Field Redesign:
```css
background: rgba(255, 255, 255, 0.04);
border: none;
border-bottom: 1px solid rgba(0, 212, 255, 0.25);
border-radius: 6px 6px 0 0;
padding: 10px 12px;
color: white;
font-family: 'DM Mono', monospace;
font-size: 13px;
outline: none;
transition: border-bottom-color 0.2s, background 0.2s;
width: 100%;
/* on focus: */
border-bottom-color: #00d4ff;
background: rgba(0, 212, 255, 0.06);
box-shadow: 0 2px 0 rgba(0, 212, 255, 0.3);
```
Placeholder text: `rgba(255,255,255,0.25)`, italic

### Button Redesign:
Three button variants:

**Primary (Add Router, Add Link, Run BFS, Run DFS):**
```css
background: linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,150,255,0.1));
border: 1px solid rgba(0, 212, 255, 0.35);
color: #00d4ff;
border-radius: 8px;
padding: 10px 16px;
font-family: 'DM Mono', monospace;
font-size: 12px;
font-weight: 600;
letter-spacing: 0.05em;
cursor: pointer;
width: 100%;
transition: all 0.2s ease;
/* on hover: */
background: linear-gradient(135deg, rgba(0,212,255,0.25), rgba(0,150,255,0.2));
border-color: #00d4ff;
box-shadow: 0 0 20px rgba(0, 212, 255, 0.25), inset 0 0 20px rgba(0,212,255,0.05);
transform: translateY(-1px);
/* on active/click: */
transform: translateY(0px);
box-shadow: none;
```

**Danger (Fail Router, Reset All):**
Same as primary but replace `#00d4ff` with `#ff3333`

**Warning (Reset Faults):**
Same as primary but replace `#00d4ff` with `#ff9500`

**Muted (Clear Highlights, Replay Last):**
Same as primary but replace `#00d4ff` with `rgba(255,255,255,0.4)`

### Radio Button Redesign (One-way / Two-way):
Replace default browser radio buttons with custom styled ones:
- Custom circle: `16px`, border `2px solid rgba(255,255,255,0.2)`
- When selected: filled with `#00d4ff`, border `#00d4ff`, glow `box-shadow: 0 0 8px rgba(0,212,255,0.5)`
- Label text: 12px, `rgba(255,255,255,0.7)`

### Scrollbar in Left Panel:
```css
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.2); border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: rgba(0,212,255,0.4); }
```

---

## Canvas Redesign

### Background:
```css
background: radial-gradient(ellipse at center, #0d1628 0%, #080c16 60%, #050810 100%);
```

On top of that, a dot-grid pattern using CSS:
```css
background-image: radial-gradient(rgba(0, 212, 255, 0.08) 1px, transparent 1px);
background-size: 32px 32px;
```

Add a **vignette overlay** (dark fade at all 4 edges):
```css
/* pseudo-element or additional div */
background: radial-gradient(ellipse at center, transparent 40%, rgba(5,8,16,0.8) 100%);
pointer-events: none;
position: absolute;
inset: 0;
```

### Empty State (when no nodes added):
- Center of canvas: large ghost text **"Build your network →"** — font size 18px, `rgba(0,212,255,0.2)`, monospace
- Below it: smaller text **"Click a node to select · Drag to reposition"** — 12px, `rgba(255,255,255,0.15)`
- **Animated radar**: Three concentric dashed circles expanding outward from center, CSS `@keyframes` — circles fade in from center and grow outward, each with a 1s delay between them, infinite loop
  - Circle 1: `rgba(0,212,255,0.15)`, radius 60px
  - Circle 2: `rgba(0,212,255,0.08)`, radius 120px
  - Circle 3: `rgba(0,212,255,0.04)`, radius 180px
  - All three also slowly rotate at different speeds for a radar sweep effect

### Node Redesign:
Each node must have 4 visual layers drawn on canvas (from outside to inside):

1. **Outer glow aura** — large radial gradient, radius ~55px, very transparent (opacity 0.08-0.15), color based on state
2. **Pulsing ring** — drawn as `arc()`, radius oscillates with `sin(time * 0.003) * 6 + 30`, opacity pulses with `sin(time * 0.003) * 0.3 + 0.4`, color based on state — this creates the Obsidian breathing effect
3. **Inner filled circle** — radius 22px, filled with dark background color + subtle gradient, border stroke 2px in state color
4. **Router ID label** — centered, `DM Mono` font, 13px, white, `font-weight: 600`

Node state colors:
| State | Aura/Ring Color | Fill Stroke | Label |
|---|---|---|---|
| active | `#00d4ff` | `#00d4ff` | white |
| failed | `#ff3333` | `#ff3333` | `rgba(255,255,255,0.4)` |
| unreachable | `#ff9500` | `#ff9500` | `rgba(255,255,255,0.6)` |
| bfs-visited | `#ffffff` | `#4db8ff` | white |
| dfs-path | `#00ff88` | `#00ff88` | white |
| recovery | `#ffd700` | `#ffd700` | `#1a1a00` |
| selected | adds extra white outer ring | same as base state | white |

**Failed node extras:**
- Draw an X through the circle (two diagonal lines, color `#ff3333`, lineWidth 2)
- The outer glow aura should be static (no pulsing) — dead nodes don't breathe

**BFS visited flash:**
- When a node becomes BFS-visited: briefly draw an expanding ring (radius grows from 22 to 60 over 400ms, opacity fades from 1 to 0) — the "shockwave" effect

**Failed node shatter/explode animation:**
- When router is first failed: emit 8 small particle dots from the node center outward in all directions
- Particles: radius 3px, color `#ff3333`, travel outward 60px over 500ms, fading to 0 opacity
- After particles dissipate: node settles into static failed state

### Edge Redesign:
Each edge must have 2 visual layers:

1. **Glow line** — slightly wider (lineWidth 4), very transparent version of edge color, creates bloom effect
2. **Core line** — lineWidth 1.5, full color

**Animated flowing particles along edges (active edges only):**
- Each active directed edge has 2-3 small glowing dots traveling from source to destination
- Dot radius: 2px, color: edge color at full opacity
- Travel speed: completes one full edge traversal every 2 seconds
- Each dot offset by 33% of edge length from each other (so they're evenly spaced)
- This creates the "data flowing through the network" effect

**DFS traversal edge animation:**
- When DFS is exploring an edge forward: the edge color transitions to `#00ff88` with a sweep animation (a bright point travels from source to dest over 300ms)
- On backtrack: edge briefly flashes red then returns to normal

**Recovery path edge:**
- Color: `#ffd700`
- lineWidth: 3
- Animated dashed line: `lineDashOffset` decreases by 1 each frame creating the "marching ants" / flowing effect
- lineDash: `[8, 4]`

**Arrowhead design:**
- Draw filled triangular arrowhead at destination end
- Arrowhead size: 10px long, 6px wide
- Color matches edge line color
- For bidirectional: arrowhead at both ends

**Edge latency label:**
- Small pill-shaped background: `rgba(0,0,0,0.6)` with `1px solid rgba(255,255,255,0.1)`
- Text: 10px, `rgba(255,255,255,0.6)`, monospace
- Positioned at edge midpoint, slightly above the line

### Node Hover Tooltip:
When hovering over a node, show a floating tooltip:
```
┌──────────────────────┐
│ Router 3             │
│ State: Active        │
│ Outgoing links: 2    │
│ Incoming links: 1    │
│ Click to select      │
└──────────────────────┘
```
Style: `background: rgba(10,14,26,0.95)`, `border: 1px solid rgba(0,212,255,0.3)`, `border-radius: 8px`, `padding: 10px 14px`, `font: 11px DM Mono`, `box-shadow: 0 8px 32px rgba(0,0,0,0.5)`

---

## Console Panel Redesign

**Height:** 200px, fixed at bottom, full width

**Background:** `rgba(4, 8, 16, 0.95)` with `backdrop-filter: blur(10px)`

**Top border:** `1px solid rgba(0, 212, 255, 0.1)`

**Top bar:**
- Three macOS-style dots: red `#ff5f56`, yellow `#ffbd2e`, green `#27c93f` — 10px circles, 6px apart
- Label: `CONSOLE OUTPUT` — 10px, letter-spacing 0.15em, `rgba(0,212,255,0.5)`, monospace
- Right side: `[Clear]` button — 10px text, muted, hover shows red tint
- All in a `12px height` top bar with bottom separator line

**Log entry styles:**
Each log entry is one line, monospace 12px, with timestamp prefix:

```
[12:34:05] [BUILD]    >> Link added: Router 1 --> Router 2 (Latency: 4ms, One-way)
[12:34:12] [FAULT]    >> Router 2 has FAILED and is removed from network.
[12:34:18] [BFS]      BFS Traversal from Router 1: 1 3 5 4 6
[12:34:18] [BFS]      Unreachable Routers: None — network is fully connected!
```

Color coding per prefix:
- `[BUILD]` — `#00d4ff`
- `[FAULT]` — `#ff3333`
- `[BFS]` — `#4db8ff`
- `[DFS]` — `#b366ff`
- `[RECOVERY]` — `#ffd700`
- `[BST]` — `#00ff88`
- `[ERROR]` — `#ff3333`, bold, background `rgba(255,51,51,0.08)`
- `[SYSTEM]` — `rgba(255,255,255,0.3)` (for reset/clear messages)

Timestamp: `rgba(255,255,255,0.2)`, 11px
Message text: `rgba(255,255,255,0.75)`

**New entry animation:** Each new log line slides in from the left (translateX -10px → 0) with opacity 0 → 1, duration 200ms

Auto-scroll to bottom on new entry. Show a **"↓ New output"** floating button when user has scrolled up and new logs arrive — clicking it jumps to bottom.

---

## Canvas Legend Redesign

Move legend from bottom-right floating text to a **proper pill-style badge cluster** anchored to bottom-right of canvas with proper glassmorphism card:

```
┌─────────────────────────────────────┐
│  ● Active  ● Failed  ● Unreachable  │
│  ● BFS Visited  ● DFS Path  ● Recovery │
└─────────────────────────────────────┘
```

Style:
```css
background: rgba(10, 14, 26, 0.85);
backdrop-filter: blur(16px);
border: 1px solid rgba(255,255,255,0.07);
border-radius: 10px;
padding: 10px 14px;
```
Each legend item: colored dot (8px circle) + label (10px, `rgba(255,255,255,0.55)`, monospace)
Dots use their respective colors with a `box-shadow: 0 0 6px <color>` glow

---

## Algorithm Result Overlay Card

After running any algorithm, show a floating result card in top-right of canvas area:

```
┌─────────────────────────────────────┐
│  ⚡ BFS COMPLETE                     │
│  ─────────────────────────────────  │
│  Visited:    1 · 3 · 5 · 4 · 6     │
│  Unreachable: None                  │
│  ─────────────────────────────────  │
│  Network fully connected ✓          │
│                          [Dismiss]  │
└─────────────────────────────────────┘
```

Style:
- `background: rgba(10,14,26,0.95)`, `backdrop-filter: blur(20px)`
- `border: 1px solid rgba(0,212,255,0.25)`
- `border-radius: 12px`
- `padding: 16px 20px`
- `box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(0,212,255,0.1)`
- Animate in: slides down from top + fade in, 300ms ease-out
- Auto-dismiss after 8 seconds with a progress bar at the bottom of the card shrinking from full to zero

---

## Typography

Import in a `<style>` tag at the top of the component:
```css
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600&display=swap');
```

Usage:
- **Headings / Section titles / Button text / Labels**: `'DM Mono', monospace`
- **Body text / Descriptions / Log output**: `'DM Mono', monospace`  
- **Stats numbers (large)**: `'DM Mono', monospace`, weight 600
- Node labels on canvas: `'DM Mono', monospace`

Avoid Inter, Roboto, Arial completely.

---

## Micro-interactions to Add

1. **Button click ripple**: On any button click, a brief ripple expands from click point then fades
2. **Input focus glow**: When an input is focused, its parent card gets a very subtle border glow in that section's accent color
3. **Stats counter animation**: When ROUTERS/LINKS/ACTIVE/FAILED numbers change, the number briefly scales up to 1.2 then returns to 1 (CSS transform)
4. **Node add animation**: When a new node is added to canvas, it appears with a scale-in from 0 to 1 with a glow burst
5. **Section card hover**: On hover over any left panel card, the left accent bar brightens and card border gets slightly more opaque
6. **Console new entry**: Each new line slides in from left
7. **Header pulse dot**: The animated dot in the header should sync its pulse frequency with the number of active nodes (more nodes = faster pulse — gives a sense of network activity)

---

## Animation Controls Section Redesign

The speed slider needs visual upgrade:
- Track: `rgba(255,255,255,0.1)` background, `border-radius: 4px`, height `4px`
- Fill (left of thumb): `linear-gradient(to right, #00d4ff, #4db8ff)`
- Thumb: `20px` circle, `background: white`, `box-shadow: 0 0 10px rgba(0,212,255,0.6)`, no default browser styling
- Speed label: shows current multiplier with color — Slow: amber, Normal: cyan, Fast: green

---

## What Must NOT Change

- All existing functionality (BFS, DFS, BST, Recovery Plan, Fail Router, Reset, etc.)
- The physics simulation behavior and constants
- The algorithm logic and animation queue system
- The data model (nodes, edges, logs state)
- The directed/bidirectional edge logic
- The console log message format (same messages, just better styled)

---

## Final Checklist for Agent

Before considering the redesign complete, verify:

- [ ] Left panel cards have glassmorphism style with colored accent bars
- [ ] All inputs have DM Mono font, bottom-border-only style, cyan focus glow
- [ ] All buttons have gradient background + border + hover lift + click press effect
- [ ] Canvas has dot-grid + radial vignette + deep space background
- [ ] Empty state has animated radar rings
- [ ] Nodes have 4-layer rendering (aura + pulsing ring + filled circle + label)
- [ ] Flowing particles animate along active directed edges
- [ ] Failed node triggers particle shatter animation
- [ ] BFS visited node triggers shockwave ring
- [ ] Recovery path edges have animated marching-ants gold dashes
- [ ] Arrowheads drawn correctly for directed/bidirectional edges
- [ ] Latency labels are pill-shaped at edge midpoints
- [ ] Node hover tooltip shows router details
- [ ] Console panel has macOS dots + color-coded log entries + slide-in animation
- [ ] Algorithm result overlay card appears and auto-dismisses with progress bar
- [ ] Legend is a proper glassmorphism card in bottom-right
- [ ] Stats counters animate on change
- [ ] DM Mono font imported and applied everywhere
- [ ] Header has proper badge styling, team names, animated pulse dot

---

*Redesign target: should look indistinguishable from a production-grade network monitoring SaaS tool.*
*Zero tolerance for default browser styles, generic colors, or placeholder-looking UI elements.*
Fix the following bugs in the Network Fault Detector visualizer:

---

BUG 1 — CRITICAL: Recovery Plan picks wrong path (wrong destination node)

Current behavior: After failing Router 2, running Recovery Plan from Router 1 to 
Router 4 shows "Activate Path 1 → 3 → 6 (Total latency: 14ms)" — this path ends 
at Router 6, NOT Router 4. This is completely wrong.

Root cause: The recoveryPlan() function is calling dfsAllPaths() and then picking 
Path 1 from DFS results, BUT the DFS paths are not being filtered to ensure they 
actually END at the destination node. The first path found by DFS order happens to 
be 1→3→6 (which reaches 6 first alphabetically/insertion-order), not 1→3→5→4.

Fix required:
- In the DFS implementation, make sure ALL paths collected by dfsAllPaths() 
  strictly end at the destination node only. A path is only valid and should 
  only be recorded when currentNode === destinationNode.
- In recoveryPlan(), after collecting all DFS paths, filter the results array 
  to only include paths where the last node in the path array equals the 
  destination router ID.
- Then pick paths[0] as the recovery suggestion.
- Also recalculate total latency correctly: sum the edge weights along the 
  chosen path by looking up each edge from→to in the edges array.

Expected behavior after fix:
- Fail Router 2, then Recovery Plan 1→4 should output:
  ">> Recovery suggestion: Activate Path 1 → 3 → 5 → 4 (Total latency: 14ms)"
  (path: 1→3 is 6ms, 3→5 is 5ms, 5→4 is 3ms = 14ms total — correct)

---

BUG 2 — DFS must only traverse ACTIVE nodes (respect failed router state)

Current behavior: DFS correctly skips failed routers in most cases but the 
path collection does not consistently check node.active === true before 
recursing into a neighbor.

Fix required:
In dfsAllPaths(current, destination, visited, path):
- Before recursing into any neighbor node, check:
  1. neighbor exists in nodes array
  2. neighbor.active === true (not failed)
  3. neighbor not already in visited set
- Only recurse if ALL three conditions pass.
- This applies to BOTH the DFS used for "Find All Paths" AND the DFS 
  used internally by recoveryPlan().

---

BUG 3 — BFS must only traverse ACTIVE nodes and follow directed edges only

Verify this is correctly implemented:
- BFS queue should only enqueue a neighbor if:
  1. The edge goes FROM current node TO neighbor (directed, not reverse)
  2. neighbor.active === true
  3. neighbor not already visited
- For bidirectional edges, BOTH directions are valid.
- For one-way edges, ONLY the from→to direction is valid.
- The source node itself must be checked: if source.active === false, 
  immediately log ">> Source router X is itself down!" and return.

After BFS completes:
- Unreachable routers = all nodes where active===true AND visited===false 
  (do NOT count failed routers as unreachable — they are failed, not unreachable)
- If unreachable list is empty, log: "Unreachable Routers: None — network is fully connected!"
- If not empty, log: "Unreachable Routers: [list of IDs]"

---

BUG 4 — Edge lookup for latency calculation must be direction-aware

When calculating total latency for a path [n1, n2, n3, n4]:
- For each consecutive pair (n1→n2), find the edge where:
  edge.from === n1 AND edge.to === n2
  OR (edge.bidirectional === true AND edge.from === n2 AND edge.to === n1)
- Sum up edge.weight for each hop.
- If any edge in the path is not found, log an error.

---

BUG 5 — BST: build BST from currently ACTIVE routers only

Current behavior: BST is built from all routers including failed ones, 
and inserting them in order 1,2,3,4,5,6 creates a fully right-skewed tree 
which makes every search always go right — this looks wrong in logs.

Fix required:
- When buildBST() is called, insert router IDs in a shuffled or 
  non-sequential order so the tree is balanced for demo purposes.
  Specifically: insert the median first, then recurse — this gives 
  a balanced BST.
- Example for routers [1,2,3,4,5,6]: insert in order [3,1,2,5,4,6] 
  so the tree has left and right children at root level.
- Only insert routers where active === true at time of BST build.
- BST search log should show meaningful Left/Right traversal, 
  not always-right.

---

After all fixes, verify against these exact test cases:

Network setup (all one-way directed unless stated):
- Routers: 1, 2, 3, 4, 5, 6
- Links: 1→2 (4ms), 1→3 (6ms), 2→4 (2ms), 3→5 (5ms), 
         5→4 (3ms), 5→6 (7ms), 3→6 (8ms)

TC1: BFS from R1 (all active)
Expected log: "BFS Traversal from Router 1: 1 2 3 4 5 6"
              "Unreachable Routers: None — network is fully connected!"

TC2: Fail R2, then BFS from R1
Expected log: "BFS Traversal from Router 1: 1 3 5 4 6"
              "Unreachable Routers: None — network is fully connected!"
(R4 is still reachable via 1→3→5→4, R2 is failed not unreachable)

TC3: All active, DFS from R1 to R4
Expected log: "All paths from Router 1 to Router 4:"
              "  Path 1: 1 → 2 → 4"
              "  Path 2: 1 → 3 → 5 → 4"
              "  Total paths found: 2"

TC4: Build BST, search R5 → "FOUND", search R7 → "NOT FOUND"

TC5: Fail R2 AND R3, then DFS from R1 to R4
Expected log: "No paths found between Router 1 and 4!"

TC6: Fail R1, then BFS from R1
Expected log: ">> Source router 1 is itself down!"

TC7: Fail R2, Recovery Plan from R1 to R4
Expected log: ">> Recovery suggestion: Activate Path 1 → 3 → 5 → 4 (Total latency: 14ms)"

TC8: Fail R2 AND R3, Recovery Plan from R1 to R4
Expected log: ">> No backup path available! Network partition detected."
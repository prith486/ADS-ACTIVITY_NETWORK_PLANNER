#include <iostream>
#include <vector>
#include <queue>

using namespace std;


const int MAXN = 105;
int N = 0;


vector<pair<int, int>> adj[MAXN];
bool activeRouter[MAXN];


bool dfsVisited[MAXN];
vector<int> currentPath;
vector<pair<vector<int>, int>> allPaths; 


struct BSTNode {
    int id;
    BSTNode* left;
    BSTNode* right;
    explicit BSTNode(int x) : id(x), left(nullptr), right(nullptr) {}
};
BSTNode* bstRoot = nullptr;


bool validRouter(int id) {
    return id >= 1 && id <= N;
}

void resetGraph() {
    for (int i = 0; i < MAXN; i++) adj[i].clear();
    for (int i = 0; i < MAXN; i++) activeRouter[i] = false;
    N = 0;
}

// FUNCTION 1 - Graph Builder
void addEdge(int u, int v, int weight, bool bidirectional) {
    if (!validRouter(u) || !validRouter(v) || weight <= 0) {
        cout << ">> Invalid edge input." << endl;
        return;
    }

    adj[u].push_back({v, weight});
    if (bidirectional) adj[v].push_back({u, weight});

    if (bidirectional) {
        cout << ">> Link added: Router " << u << " <--> Router " << v
             << " (Latency: " << weight << "ms, Two-way)" << endl;
    } else {
        cout << ">> Link added: Router " << u << " --> Router " << v
             << " (Latency: " << weight << "ms, One-way)" << endl;
    }
}

void initGraph() {
    resetGraph();

    cout << "Enter number of routers: ";
    cin >> N;

    if (N < 1 || N >= MAXN) {
        cout << ">> Invalid number of routers. Must be 1 to " << (MAXN - 1) << "." << endl;
        N = 0;
        return;
    }

    for (int i = 1; i <= N; i++) activeRouter[i] = true;

    int e;
    cout << "Enter number of links: ";
    cin >> e;

    for (int i = 0; i < e; i++) {
        int u, v, w, dir;
        cout << "Link " << (i + 1) << " - Enter: router1 router2 latency: ";
        cin >> u >> v >> w;
        cout << "Direction? 1=One-way (" << u << "->" << v << "), 2=Two-way: ";
        cin >> dir;

        addEdge(u, v, w, dir == 2);
    }

    cout << ">> Network ready with " << N << " routers!" << endl;
}

void removeNode(int id) {
    if (!validRouter(id) || !activeRouter[id]) {
        cout << ">> Router " << id << " is already down or doesn't exist." << endl;
        return;
    }

    activeRouter[id] = false;
    cout << ">> Router " << id << " has FAILED and is removed from network." << endl;
}

// FUNCTION 2 - BFS Fault Detector
void bfsFaultDetect(int src) {
    if (N == 0) {
        cout << ">> Please build the network first!" << endl;
        return;
    }
    if (!validRouter(src)) {
        cout << ">> Source router " << src << " does not exist!" << endl;
        return;
    }
    if (!activeRouter[src]) {
        cout << ">> Source router " << src << " is itself down!" << endl;
        return;
    }

    vector<bool> visited(N + 1, false);
    queue<int> q;

    q.push(src);
    visited[src] = true;

    cout << "BFS Traversal from Router " << src << ": ";

    while (!q.empty()) {
        int current = q.front();
        q.pop();

        cout << current << " ";

        for (auto &edge : adj[current]) {
            int neighbor = edge.first;
            if (activeRouter[neighbor] && !visited[neighbor]) {
                visited[neighbor] = true;
                q.push(neighbor);
            }
        }
    }

    cout << endl;
    cout << "Unreachable Routers: ";

    bool anyUnreachable = false;
    for (int i = 1; i <= N; i++) {
        if (activeRouter[i] && !visited[i]) {
            cout << i << " ";
            anyUnreachable = true;
        }
    }

    if (!anyUnreachable) cout << "None - network is fully connected!";
    cout << endl;
}

// FUNCTION 3 - DFS Alternate Path Finder
void dfsAllPaths(int current, int destination, int latencySoFar) {
    dfsVisited[current] = true;
    currentPath.push_back(current);

    if (current == destination) {
        allPaths.push_back({currentPath, latencySoFar});
    } else {
        for (auto &edge : adj[current]) {
            int neighbor = edge.first;
            int weight = edge.second;

            if (activeRouter[neighbor] && !dfsVisited[neighbor]) {
                dfsAllPaths(neighbor, destination, latencySoFar + weight);
            }
        }
    }

    currentPath.pop_back();
    dfsVisited[current] = false;
}

void startDFS(int src, int dest) {
    if (N == 0) {
        cout << ">> Please build the network first!" << endl;
        return;
    }
    if (!validRouter(src) || !validRouter(dest)) {
        cout << ">> Invalid source/destination router ID." << endl;
        return;
    }
    if (!activeRouter[src] || !activeRouter[dest]) {
        cout << ">> Source or destination router is down." << endl;
        return;
    }

    for (int i = 1; i <= N; i++) dfsVisited[i] = false;
    currentPath.clear();
    allPaths.clear();

    cout << "All paths from Router " << src << " to Router " << dest << ":" << endl;
    dfsAllPaths(src, dest, 0);

    if (allPaths.empty()) {
        cout << "No paths found!" << endl;
    } else {
        for (int i = 0; i < (int)allPaths.size(); i++) {
            cout << "Path " << (i + 1) << ": ";
            for (int j = 0; j < (int)allPaths[i].first.size(); j++) {
                cout << allPaths[i].first[j];
                if (j + 1 < (int)allPaths[i].first.size()) cout << " -> ";
            }
            cout << " (Latency: " << allPaths[i].second << "ms)" << endl;
        }
    }

    cout << "Total paths found: " << allPaths.size() << endl;
}

void sortPathsByLatency() {
    int n = allPaths.size();
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (allPaths[j].second > allPaths[j + 1].second) {
                pair<vector<int>, int> temp = allPaths[j];
                allPaths[j] = allPaths[j + 1];
                allPaths[j + 1] = temp;
            }
        }
    }
}

// FUNCTION 4 - Recovery Plan
void recoveryPlan(int src, int dest) {
    for (int i = 1; i <= N; i++) dfsVisited[i] = false;
    currentPath.clear();
    allPaths.clear();

    dfsAllPaths(src, dest, 0);

    if (allPaths.empty()) {
        cout << "No path available!" << endl;
        return;
    }

    sortPathsByLatency();

    cout << "Best path: ";
    for (int i = 0; i < (int)allPaths[0].first.size(); i++) {
        cout << allPaths[0].first[i];
        if (i + 1 < (int)allPaths[0].first.size()) cout << " -> ";
    }
    cout << " (Latency: " << allPaths[0].second << "ms)" << endl;
}

int main() {
    int choice;

    do {
        cout << "\n1. Build Network\n2. Remove Router\n3. BFS\n4. DFS\n5. Recovery\n0. Exit\n";
        cin >> choice;

        if (choice == 1) initGraph();
        else if (choice == 2) {
            int id; cin >> id;
            removeNode(id);
        }
        else if (choice == 3) {
            int src; cin >> src;
            bfsFaultDetect(src);
        }
        else if (choice == 4) {
            int s, d; cin >> s >> d;
            startDFS(s, d);
        }
        else if (choice == 5) {
            int s, d; cin >> s >> d;
            recoveryPlan(s, d);
        }

    } while (choice != 0);

    return 0;
}
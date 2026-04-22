#include <algorithm>
#include <iostream>
#include <queue>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <vector>

using namespace std;

struct Edge {
	int to;
	int weight;
};

struct PathResult {
	vector<int> nodes;
	long long latency;
};

struct NetworkData {
	vector<int> nodeIds;
	unordered_map<int, bool> active;
	unordered_map<int, vector<Edge>> adj;
};

struct BstNode {
	int value;
	BstNode* left;
	BstNode* right;

	explicit BstNode(int v) : value(v), left(nullptr), right(nullptr) {}
};

string escapeJson(const string& text) {
	string out;
	out.reserve(text.size() + 8);

	for (char c : text) {
		switch (c) {
			case '"':
				out += "\\\"";
				break;
			case '\\':
				out += "\\\\";
				break;
			case '\n':
				out += "\\n";
				break;
			case '\r':
				out += "\\r";
				break;
			case '\t':
				out += "\\t";
				break;
			default:
				out += c;
				break;
		}
	}

	return out;
}

void printIntArray(const vector<int>& values) {
	cout << "[";
	for (size_t i = 0; i < values.size(); ++i) {
		if (i != 0U) {
			cout << ",";
		}
		cout << values[i];
	}
	cout << "]";
}

void printStringArray(const vector<string>& values) {
	cout << "[";
	for (size_t i = 0; i < values.size(); ++i) {
		if (i != 0U) {
			cout << ",";
		}
		cout << "\"" << escapeJson(values[i]) << "\"";
	}
	cout << "]";
}

void printPathArray(const vector<PathResult>& paths) {
	cout << "[";
	for (size_t i = 0; i < paths.size(); ++i) {
		if (i != 0U) {
			cout << ",";
		}
		printIntArray(paths[i].nodes);
	}
	cout << "]";
}

void printErrorJson(const string& message) {
	cout << "{\"ok\":false,\"error\":\"" << escapeJson(message) << "\"}";
}

bool nodeExists(const NetworkData& network, int id) {
	return network.active.find(id) != network.active.end();
}

bool nodeIsActive(const NetworkData& network, int id) {
	const auto it = network.active.find(id);
	return it != network.active.end() && it->second;
}

bool runBfs(
	const NetworkData& network,
	int source,
	vector<int>& order,
	vector<int>& unreachable,
	string& error
) {
	if (!nodeExists(network, source)) {
		error = "Source router does not exist in graph.";
		return false;
	}

	if (!nodeIsActive(network, source)) {
		error = "Source router is inactive.";
		return false;
	}

	unordered_set<int> visited;
	queue<int> q;

	visited.insert(source);
	q.push(source);

	while (!q.empty()) {
		const int current = q.front();
		q.pop();

		order.push_back(current);

		const auto it = network.adj.find(current);
		if (it == network.adj.end()) {
			continue;
		}

		for (const Edge& edge : it->second) {
			if (!nodeExists(network, edge.to) || !nodeIsActive(network, edge.to)) {
				continue;
			}

			if (visited.insert(edge.to).second) {
				q.push(edge.to);
			}
		}
	}

	vector<int> sortedIds = network.nodeIds;
	sort(sortedIds.begin(), sortedIds.end());

	for (int id : sortedIds) {
		if (nodeIsActive(network, id) && visited.find(id) == visited.end()) {
			unreachable.push_back(id);
		}
	}

	return true;
}

void dfsCollect(
	const NetworkData& network,
	int current,
	int destination,
	unordered_set<int>& inPath,
	vector<int>& currentPath,
	long long latency,
	vector<PathResult>& results
) {
	inPath.insert(current);
	currentPath.push_back(current);

	if (current == destination) {
		results.push_back(PathResult{currentPath, latency});
	} else {
		const auto it = network.adj.find(current);
		if (it != network.adj.end()) {
			for (const Edge& edge : it->second) {
				if (!nodeExists(network, edge.to) || !nodeIsActive(network, edge.to)) {
					continue;
				}
				if (inPath.find(edge.to) != inPath.end()) {
					continue;
				}

				dfsCollect(
					network,
					edge.to,
					destination,
					inPath,
					currentPath,
					latency + edge.weight,
					results
				);
			}
		}
	}

	currentPath.pop_back();
	inPath.erase(current);
}

bool runDfs(
	const NetworkData& network,
	int source,
	int destination,
	vector<PathResult>& paths,
	string& error
) {
	if (!nodeExists(network, source) || !nodeExists(network, destination)) {
		error = "Source or destination router does not exist in graph.";
		return false;
	}

	if (!nodeIsActive(network, source) || !nodeIsActive(network, destination)) {
		error = "Source or destination router is inactive.";
		return false;
	}

	unordered_set<int> inPath;
	vector<int> currentPath;
	dfsCollect(network, source, destination, inPath, currentPath, 0, paths);

	sort(paths.begin(), paths.end(), [](const PathResult& a, const PathResult& b) {
		if (a.latency != b.latency) {
			return a.latency < b.latency;
		}
		return a.nodes < b.nodes;
	});

	return true;
}

BstNode* buildBalancedBst(const vector<int>& sortedIds, int left, int right) {
	if (left > right) {
		return nullptr;
	}

	const int mid = left + (right - left) / 2;
	BstNode* node = new BstNode(sortedIds[mid]);
	node->left = buildBalancedBst(sortedIds, left, mid - 1);
	node->right = buildBalancedBst(sortedIds, mid + 1, right);
	return node;
}

void destroyBst(BstNode* node) {
	if (node == nullptr) {
		return;
	}
	destroyBst(node->left);
	destroyBst(node->right);
	delete node;
}

bool searchBst(const BstNode* root, int query, vector<string>& trace) {
	const BstNode* current = root;
	bool isFirstVisit = true;

	while (current != nullptr) {
		if (isFirstVisit) {
			trace.push_back("Root(" + to_string(current->value) + ")");
			isFirstVisit = false;
		}

		if (query == current->value) {
			trace.push_back("FOUND");
			return true;
		}

		if (query < current->value) {
			trace.push_back("Go Left");
			current = current->left;
		} else {
			trace.push_back("Go Right");
			current = current->right;
		}
	}

	trace.push_back("NOT FOUND");
	return false;
}

bool readGraph(NetworkData& network, int& nodeCount, int& edgeCount, string& error) {
	if (!(cin >> nodeCount >> edgeCount)) {
		error = "Invalid graph header. Expected: NodeCount EdgeCount.";
		return false;
	}

	if (nodeCount < 0 || edgeCount < 0) {
		error = "NodeCount and EdgeCount must be non-negative.";
		return false;
	}

	network.nodeIds.clear();
	network.active.clear();
	network.adj.clear();
	network.nodeIds.reserve(static_cast<size_t>(nodeCount));

	for (int i = 0; i < nodeCount; ++i) {
		int id = 0;
		int activeFlag = 0;
		if (!(cin >> id >> activeFlag)) {
			error = "Invalid node entry. Expected: id activeFlag.";
			return false;
		}

		if (network.active.find(id) != network.active.end()) {
			error = "Duplicate node id in input.";
			return false;
		}

		network.nodeIds.push_back(id);
		network.active[id] = (activeFlag != 0);
		network.adj[id];
	}

	for (int i = 0; i < edgeCount; ++i) {
		int from = 0;
		int to = 0;
		int weight = 0;
		int bidirectionalFlag = 0;
		int failedFlag = 0;

		if (!(cin >> from >> to >> weight >> bidirectionalFlag >> failedFlag)) {
			error = "Invalid edge entry. Expected: from to weight bidirectionalFlag failedFlag.";
			return false;
		}

		if (failedFlag != 0) {
			continue;
		}

		if (weight <= 0) {
			continue;
		}

		if (!nodeExists(network, from) || !nodeExists(network, to)) {
			continue;
		}

		network.adj[from].push_back(Edge{to, weight});
		if (bidirectionalFlag != 0) {
			network.adj[to].push_back(Edge{from, weight});
		}
	}

	for (auto& [_, edges] : network.adj) {
		sort(edges.begin(), edges.end(), [](const Edge& a, const Edge& b) {
			if (a.to != b.to) {
				return a.to < b.to;
			}
			return a.weight < b.weight;
		});
	}

	return true;
}

int main() {
	ios::sync_with_stdio(false);
	cin.tie(nullptr);

	string operation;
	if (!(cin >> operation)) {
		printErrorJson("Missing operation. Expected one of: BFS DFS RECOVERY BST.");
		return 0;
	}

	int nodeCount = 0;
	int edgeCount = 0;
	string error;
	NetworkData network;

	if (!readGraph(network, nodeCount, edgeCount, error)) {
		printErrorJson(error);
		return 0;
	}

	if (operation == "BFS") {
		int source = 0;
		if (!(cin >> source)) {
			printErrorJson("Missing BFS source router id.");
			return 0;
		}

		vector<int> order;
		vector<int> unreachable;

		if (!runBfs(network, source, order, unreachable, error)) {
			printErrorJson(error);
			return 0;
		}

		cout << "{\"ok\":true,\"result\":{\"order\":";
		printIntArray(order);
		cout << ",\"unreachable\":";
		printIntArray(unreachable);
		cout << "}}";
		return 0;
	}

	if (operation == "DFS" || operation == "RECOVERY") {
		int source = 0;
		int destination = 0;
		if (!(cin >> source >> destination)) {
			printErrorJson("Missing source/destination router ids.");
			return 0;
		}

		vector<PathResult> paths;
		if (!runDfs(network, source, destination, paths, error)) {
			printErrorJson(error);
			return 0;
		}

		if (operation == "DFS") {
			cout << "{\"ok\":true,\"result\":{\"paths\":";
			printPathArray(paths);
			cout << "}}";
			return 0;
		}

		if (paths.empty()) {
			cout << "{\"ok\":true,\"result\":{\"hasPath\":false,\"bestPath\":[],\"latency\":-1}}";
			return 0;
		}

		cout << "{\"ok\":true,\"result\":{\"hasPath\":true,\"bestPath\":";
		printIntArray(paths.front().nodes);
		cout << ",\"latency\":" << paths.front().latency << "}}";
		return 0;
	}

	if (operation == "BST") {
		int query = 0;
		if (!(cin >> query)) {
			printErrorJson("Missing BST query router id.");
			return 0;
		}

		vector<int> activeIds;
		activeIds.reserve(network.nodeIds.size());
		for (int id : network.nodeIds) {
			if (nodeIsActive(network, id)) {
				activeIds.push_back(id);
			}
		}

		sort(activeIds.begin(), activeIds.end());
		activeIds.erase(unique(activeIds.begin(), activeIds.end()), activeIds.end());

		BstNode* root = buildBalancedBst(activeIds, 0, static_cast<int>(activeIds.size()) - 1);

		vector<string> trace;
		bool found = searchBst(root, query, trace);
		destroyBst(root);

		cout << "{\"ok\":true,\"result\":{\"found\":" << (found ? "true" : "false") << ",\"trace\":";
		printStringArray(trace);
		cout << "}}";
		return 0;
	}

	printErrorJson("Unsupported operation. Expected one of: BFS DFS RECOVERY BST.");
	return 0;
}

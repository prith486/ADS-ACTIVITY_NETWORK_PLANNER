import AppNavbar from "@/components/AppNavbar";
import AboutPage from "@/pages/AboutPage";
import AlgorithmPage from "@/pages/AlgorithmPage";
import DesignPage from "@/pages/DesignPage";
import FlowchartPage from "@/pages/FlowchartPage";
import NetworkFaultVisualizer from "@/pages/NetworkFaultVisualizer";
import NotFound from "@/pages/not-found";
import { Route, Switch } from "wouter";

function App() {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <AppNavbar />
      <main style={{ flex: 1, minHeight: 0 }}>
        <Switch>
          <Route path="/" component={AboutPage} />
          <Route path="/about" component={AboutPage} />
          <Route path="/flowchart" component={FlowchartPage} />
          <Route path="/algorithm" component={AlgorithmPage} />
          <Route path="/design" component={DesignPage} />
          <Route path="/simulator" component={NetworkFaultVisualizer} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

export default App;

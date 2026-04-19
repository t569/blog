import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const ResourceGraph: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
  return (
    <div class={`resource-graph-container ${displayClass ?? ""}`}>
      <h3>🕸️ Knowledge Constellation</h3>
      <p class="graph-subtext">Interactive mapping of your vector resources and tags.</p>
      
      {/* The D3 Graph will mount inside this SVG */}
      <div id="d3-graph-wrapper" class="d3-wrapper">
         <div id="graph-loading" class="graph-loading">Initializing Neural Link...</div>
         <svg id="resource-graph-svg"></svg>
      </div>
    </div>
  )
}

// Client-side script to fetch data and run the D3 force simulation
ResourceGraph.afterDOMLoaded = `
  const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const API_URL = isLocalhost ? "http://127.0.0.1:8000" : "https://resource-api-eight.vercel.app";
  
  const svgEl = document.getElementById('resource-graph-svg');
  const loadingEl = document.getElementById('graph-loading');
  
  if (svgEl) {
    // Dynamically inject D3.js to ensure it's available without messing up Quartz's bundler
    if (!window.d3) {
      const script = document.createElement('script');
      script.src = "https://d3js.org/d3.v7.min.js";
      script.onload = fetchAndRenderGraph;
      document.head.appendChild(script);
    } else {
      fetchAndRenderGraph();
    }
  }

  async function fetchAndRenderGraph() {
    try {
      const res = await fetch(\`\${API_URL}/graph/cluster\`);
      if (!res.ok) throw new Error("Failed to fetch graph data");
      const data = await res.json();
      
      loadingEl.style.display = 'none';
      drawGraph(data.nodes, data.links);
    } catch (err) {
      loadingEl.innerText = "Failed to load graph cluster.";
      console.error(err);
    }
  }

  function drawGraph(nodes, links) {
    const width = document.getElementById('d3-graph-wrapper').clientWidth;
    const height = 400;

    const svg = d3.select("#resource-graph-svg")
      .attr("width", width)
      .attr("height", height)
      .call(d3.zoom().on("zoom", (event) => {
         svgGroup.attr("transform", event.transform);
      }));

    const svgGroup = svg.append("g");

    // Force simulation setup
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(80))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(30));

    // Draw Links
    const link = svgGroup.append("g")
      .attr("stroke", "var(--lightgray)")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1.5);

    // Draw Nodes
    const node = svgGroup.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(drag(simulation));

    // Node Circles (Color coded based on type)
    node.append("circle")
      .attr("r", d => d.group === "tag" ? 8 : 12)
      .attr("fill", d => d.group === "tag" ? "var(--secondary)" : "var(--tertiary)")
      .style("cursor", "pointer")
      .on("click", (event, d) => {
          if(d.group === "resource" && d.url) {
              window.open(d.url, '_blank');
          }
      });

    // Node Labels
    node.append("text")
      .text(d => d.name)
      .attr("x", 15)
      .attr("y", 4)
      .style("font-size", "10px")
      .style("fill", "var(--dark)")
      .style("font-family", "inherit")
      .style("pointer-events", "none");

    // Tick update
    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node.attr("transform", d => \`translate(\${d.x},\${d.y})\`);
    });

    // Drag interactions
    function drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }
  }
`

ResourceGraph.css = `
.resource-graph-container {
  margin-top: 2rem;
  width: 100%;
}
.resource-graph-container h3 {
  font-size: 1.2rem;
  margin-bottom: 0.2rem;
}
.graph-subtext {
  font-size: 0.85rem;
  color: var(--gray);
  margin-bottom: 1rem;
}
.d3-wrapper {
  width: 100%;
  height: 400px;
  background-color: var(--light);
  border: 1px solid var(--lightgray);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}
.graph-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--tertiary);
  font-weight: bold;
  font-size: 0.9rem;
}
#resource-graph-svg {
  width: 100%;
  height: 100%;
}
`

export default (() => ResourceGraph) satisfies QuartzComponentConstructor
// Root + 2 children
const rr = 10; // initial radius for root and children

const root = {
  rCollapsed: rr,
  rExpanded: 2 * rr, // ry >= 2rr (for this layout ry = 20)
  expanded: false,
  children: [
    { r: rr, id: "c1" },
    { r: rr, id: "c2" },
  ],
};

const container = d3.select("#viz");

function setup() {
  const { width, height } = container.node().getBoundingClientRect();

  // Clear any previous svg (useful on resize rebuild)
  container.select("svg").remove();

  const svg = container
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const cx = width / 2;
  const cy = height / 2;

  const g = svg.append("g").attr("transform", `translate(${cx}, ${cy})`);

  // Root group
  const rootG = g.append("g").attr("class", "node root");

  const rootCircle = rootG.append("circle").attr("r", root.rCollapsed);

  // Children group (initially hidden)
  const childrenG = rootG
    .append("g")
    .attr("class", "children")
    .style("opacity", 0)
    .style("display", "none");

  // Layout children so they don't overlap:
  // Put them left/right with centers at +/- rr.
  // - Distance between centers = 2rr (no overlap).
  // - Container radius needed = rr (center distance) + rr (child radius) = 2rr.
  const childPositions = [
    { x: -rr, y: 0 },
    { x: rr, y: 0 },
  ];

  childrenG
    .selectAll("circle.child")
    .data(root.children, (d) => d.id)
    .join("circle")
    .attr("class", "child")
    .attr("r", (d) => d.r)
    .attr("cx", (d, i) => childPositions[i].x)
    .attr("cy", (d, i) => childPositions[i].y);

  function expand() {
    root.expanded = true;

    // Show children (display first so opacity transition works)
    childrenG.style("display", null);

    rootCircle.transition().duration(250).attr("r", root.rExpanded);

    childrenG.transition().duration(250).style("opacity", 1);
  }

  function collapse() {
    root.expanded = false;

    childrenG
      .transition()
      .duration(200)
      .style("opacity", 0)
      .on("end", () => {
        if (!root.expanded) childrenG.style("display", "none");
      });

    rootCircle.transition().duration(250).attr("r", root.rCollapsed);
  }

  // Toggle on click (root acts as container)
  rootG.style("cursor", "pointer").on("click", () => {
    if (root.expanded) collapse();
    else expand();
  });

  // If you want it to start expanded, uncomment:
  // expand();
}

setup();

// Optional: rebuild on resize so it stays centered nicely
window.addEventListener("resize", setup);

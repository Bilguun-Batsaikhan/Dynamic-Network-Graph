const rr = 10; // base radius for collapsed/leaf nodes
const gap = 4; // spacing between siblings inside a parent
const padding = 4; // extra padding between children and parent boundary

// Build a sample 5-layer tree: each node has 2 children until leaf
// You can change branching (n children) by editing makeChildren().
function makeTree(depth, maxDepth, path = "root") {
  const node = {
    id: path,
    expanded: false,
    children: [],
    r: rr, // computed radius
    x: 0, // layout position relative to parent
    y: 0,
    absX: 0,
    absY: 0,
  };

  if (depth < maxDepth) {
    node.children = makeChildren(depth, maxDepth, path);
  }

  return node;
}

// Example: binary branching (2 children). Make it n-ary by returning more children.
function makeChildren(depth, maxDepth, parentPath) {
  return [
    makeTree(depth + 1, maxDepth, `${parentPath}/c1`),
    makeTree(depth + 1, maxDepth, `${parentPath}/c2`),
  ];
}

const root = makeTree(0, 4); // 0..4 => 5 layers total

// ---------- D3 setup ----------
const container = d3.select("#viz");

function setup() {
  const { width, height } = container.node().getBoundingClientRect();
  container.select("svg").remove();

  const svg = container
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const g = svg
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  // Initial compute + render
  recomputeAll();
  render(g);

  // ---------- helpers ----------
  function computeAbsolutePositions(node, parentAbsX = 0, parentAbsY = 0) {
    node.absX = parentAbsX + (node.x ?? 0);
    node.absY = parentAbsY + (node.y ?? 0);

    if (node.children && node.children.length && node.expanded) {
      node.children.forEach((c) =>
        computeAbsolutePositions(c, node.absX, node.absY),
      );
    }
  }

  function isVisible(node, ancestorsExpanded) {
    // root is always visible, others only if all ancestors are expanded
    return ancestorsExpanded;
  }

  // Collect visible nodes for a flat D3 join
  function collectVisible(
    node,
    ancestorsExpanded = true,
    out = [],
    parentId = null,
  ) {
    if (!isVisible(node, ancestorsExpanded)) return out;

    out.push({ node, parentId });

    const canShowKids = ancestorsExpanded && node.expanded;
    if (node.children && node.children.length && canShowKids) {
      node.children.forEach((c) => collectVisible(c, true, out, node.id));
    }
    return out;
  }

  // ---- 1) Bottom-up radius computation ----
  // Node radius rule:
  // - collapsed OR no children -> rr
  // - expanded -> big enough to contain immediate children laid out in a row
  function computeRadius(node) {
    if (!node.children || node.children.length === 0) {
      node.r = rr;
      return node.r;
    }

    // First compute children radii (children may be expanded)
    node.children.forEach(computeRadius);

    if (!node.expanded) {
      node.r = rr;
      return node.r;
    }

    // Layout children in a horizontal row: total width is sum of diameters + gaps
    const diameters = node.children.map((c) => 2 * c.r);
    const totalWidth =
      diameters.reduce((a, b) => a + b, 0) +
      gap * Math.max(0, node.children.length - 1);

    // Parent must enclose row -> radius >= half row width, plus padding
    // Also must be at least the biggest child radius + padding (just in case)
    const halfRow = totalWidth / 2;
    const biggest = Math.max(...node.children.map((c) => c.r));

    node.r = Math.max(rr, halfRow + padding, biggest + padding);
    return node.r;
  }

  // ---- 2) Top-down layout (positions inside each expanded node) ----
  // Places children circles along x-axis centered at 0, with no overlap.
  function layout(node) {
    if (!node.children || node.children.length === 0) return;

    if (!node.expanded) return;

    const kids = node.children;

    // totalWidth same as above
    const diameters = kids.map((c) => 2 * c.r);
    const totalWidth =
      diameters.reduce((a, b) => a + b, 0) + gap * Math.max(0, kids.length - 1);

    // Start x at left edge of the row (centered)
    let x = -totalWidth / 2;

    kids.forEach((c, i) => {
      const w = 2 * c.r;
      c.x = x + w / 2;
      c.y = 0; // keep it simple: row inside parent
      x += w + gap;

      // recurse
      layout(c);
    });
  }

  function recomputeAll() {
    computeRadius(root);

    // root local position (origin)
    root.x = 0;
    root.y = 0;

    layout(root);

    // IMPORTANT: convert local x/y into absolute positions for rendering
    computeAbsolutePositions(root, 0, 0);
  }

  // ---- 3) Render with D3 joins + transitions ----
  function render(sceneG) {
    const visible = collectVisible(root, true);

    const nodesSel = sceneG.selectAll("g.node").data(visible, (d) => d.node.id);

    const nodesEnter = nodesSel
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.node.absX}, ${d.node.absY})`)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        // Prevent click bubbling so you can click deep nodes
        event.stopPropagation();

        // Toggle only if it has children
        if (d.node.children && d.node.children.length > 0) {
          d.node.expanded = !d.node.expanded;

          recomputeAll();
          render(sceneG);
        }
      });

    nodesEnter.append("circle").attr("r", rr);

    // UPDATE + ENTER merged
    const nodesMerge = nodesEnter.merge(nodesSel);

    nodesMerge
      .transition()
      .duration(250)
      .attr("transform", (d) => `translate(${d.node.absX}, ${d.node.absY})`);

    nodesMerge
      .select("circle")
      .transition()
      .duration(250)
      .attr("r", (d) => d.node.r)
      .attr("class", (d) => (d.node === root ? "root" : "child"));

    // EXIT
    nodesSel.exit().transition().duration(150).style("opacity", 0).remove();
  }

  // Optional: click empty space to collapse everything
  svg.on("click", () => {
    collapseAll(root);
    recomputeAll();
    render(g);
  });

  function collapseAll(node) {
    node.expanded = false;
    if (node.children) node.children.forEach(collapseAll);
  }
}

setup();
window.addEventListener("resize", setup);

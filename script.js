import { data } from "./data.js"; // This looks for ./data.js
const rr = 10; // base radius for collapsed/leaf nodes
const gap = 5; // spacing between siblings inside a parent
const padding = 10; // extra padding between children and parent boundary

// Convert topology -> your node shape (id/expanded/children/r/x/y/absX/absY)
function toNode(t, parentPath = "") {
  const id = parentPath ? `${parentPath}/${t.name}` : t.name;
  return {
    id,
    name: t.name,
    type: t.type,
    expanded: false,
    children: (t.children ?? []).map((ch) => toNode(ch, id)),
    r: rr,
    x: 0,
    y: 0,
    absX: 0,
    absY: 0,
  };
}

const root = toNode(data);

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
  // expanded -> big enough to contain children on a ring (necklace)
  function computeRadius(node) {
    if (!node.children || node.children.length === 0) {
      node.r = rr;
      return node.r;
    }

    node.children.forEach(computeRadius);

    if (!node.expanded) {
      node.r = rr;
      return node.r;
    }

    const kids = node.children;
    const n = kids.length;

    const maxR = Math.max(...kids.map((c) => c.r));
    const minGap = gap; // your existing spacing

    if (n === 1) {
      // one child just sits in the center; parent must contain it
      node.r = Math.max(rr, maxR + padding);
      return node.r;
    }

    // For a ring: neighbor center distance is 2*a*sin(pi/n)
    // Need >= (r_i + r_j + gap). We approximate with 2*maxR + gap.
    const a = (maxR + minGap / 2) / Math.sin(Math.PI / n);

    // Parent radius must reach ring radius + child radius + padding
    node.r = Math.max(rr, a + maxR + padding);
    return node.r;
  }

  // ---- 2) Top-down layout (positions inside each expanded node) ----
  // Places children circles along x-axis centered at 0, with no overlap.
  // ---- 2) Top-down layout (positions inside each expanded node) ----
  // Place children on a ring inside the parent (necklace)
  function layout(node) {
    if (!node.children || node.children.length === 0) return;
    if (!node.expanded) return;

    const kids = node.children;
    const n = kids.length;

    if (n === 1) {
      kids[0].x = 0;
      kids[0].y = 0;
      layout(kids[0]);
      return;
    }

    const maxR = Math.max(...kids.map((c) => c.r));

    // Put centers on a ring that stays inside parent boundary
    const ringR = Math.max(0, node.r - maxR - padding);

    const step = (2 * Math.PI) / n;

    kids.forEach((c, i) => {
      const ang = i * step;
      c.x = ringR * Math.cos(ang);
      c.y = ringR * Math.sin(ang);

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
    nodesEnter
      .append("text")
      .text((d) => d.node.name ?? d.node.id)
      .attr("y", (d) => d.node.r + 14) // ⬅ label below the circle
      .attr("text-anchor", "middle");

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

    nodesMerge.select("text").attr("y", (d) => d.node.r + 14);

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

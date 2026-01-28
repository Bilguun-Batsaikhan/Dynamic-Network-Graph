import { data } from "./data.js"; // This looks for ./data.js
const rr = 10; // base radius for collapsed/leaf nodes
const gap = 50; // spacing between siblings inside a parent
const padding = 5; // extra padding between children and parent boundary
const siblingPad = gap; // reuse your existing gap

function packWithPadding(circles, pad) {
  // Inflate radii so packing produces spacing.
  circles.forEach((c) => {
    c.__r0 = c.r;
    c.r = c.__r0 + pad / 2;
  });

  d3.packSiblings(circles);
  const enclosing = d3.packEnclose(circles);

  // Restore original radii (keep the packed x/y)
  circles.forEach((c) => {
    c.r = c.__r0;
    delete c.__r0;
  });

  return enclosing; // NOTE: enclosing is based on inflated radii
}

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
root.expanded = true; // show all security zones immediately

// ---------- D3 setup ----------
const container = d3.select("#viz");

function setup() {
  const { width, height } = container.node().getBoundingClientRect();
  container.select("svg").remove();

  const svg = container
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  // A zoomable viewport (camera)
  const viewport = svg.append("g").attr("class", "viewport");

  // Your scene stays centered inside the viewport
  const g = viewport
    .append("g")
    .attr("class", "scene")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  const zoom = d3
    .zoom()
    .scaleExtent([0.3, 6]) // min zoom, max zoom
    .on("zoom", (event) => {
      viewport.attr("transform", event.transform);
    });

  svg.call(zoom).on("dblclick.zoom", null);

  // Initial compute + render
  recomputeAll();
  render(g);

  // ========== EVENT HANDLERS (moved here) ==========
  document.getElementById("collapseAll").onclick = () => {
    collapseAll(root);
    recomputeAll();
    render(g);
  };

  document.getElementById("expandAll").onclick = () => {
    expandAll(root);
    recomputeAll();
    render(g);
  };

  document.getElementById("resetView").onclick = () => {
    svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
  };

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

    // pack using inflated radii so parent size accounts for spacing
    const enclosing = packWithPadding(kids, siblingPad);

    // enclosing.r already includes padding effect; add your outer padding too
    node.r = Math.max(rr, enclosing.r + padding);
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

    // packed positions computed with padding
    const enclosing = packWithPadding(kids, siblingPad);

    // Fit the packed cluster inside the parent
    const targetR = Math.max(0, node.r - padding);
    const scale = enclosing.r > 0 ? targetR / enclosing.r : 1;

    kids.forEach((c) => {
      c.x = (c.x - enclosing.x) * scale;
      c.y = (c.y - enclosing.y) * scale;
    });

    kids.forEach(layout);
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
  function shortLabel(d, max = 12) {
    const s = d.node.name ?? d.node.id;
    return s.length > max ? s.slice(0, max - 1) + "…" : s;
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
        event.stopPropagation();

        // super-root is not interactive
        if (d.node.type === "root") return;

        if (d.node.children && d.node.children.length > 0) {
          d.node.expanded = !d.node.expanded;
          recomputeAll();
          render(sceneG);
        }
      });

    nodesEnter
      .append("circle")
      .attr("r", (d) => (d.node.type === "root" ? 0 : rr))
      .style("display", (d) => (d.node.type === "root" ? "none" : null));

    // background (halo)
    nodesEnter
      .append("text")
      .text((d) => shortLabel(d))
      .attr("y", (d) => d.node.r + 14)
      .attr("text-anchor", "middle")
      .style("display", (d) => (d.node.type === "root" ? "none" : null))
      .style("font-size", (d) => {
        switch (d.node.type) {
          case "zone":
            return "14px";
          case "environment":
            return "13px";
          case "tier":
            return "12px";
          case "application":
            return "11px";
          default:
            return "10px";
        }
      });

    // foreground
    // nodesEnter
    //   .append("text")
    //   .attr("class", "label-text")
    //   .text((d) => d.node.name ?? d.node.id)
    //   .attr("y", (d) => d.node.r + 14)
    //   .attr("text-anchor", "middle");

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
  //   svg.on("click", () => {
  //     collapseAll(root);
  //     recomputeAll();
  //     render(g);
  //   });
  svg.on("click", (event) => {
    if (event.defaultPrevented) return;
  });

  // this keeps expanded children states even after collapsing all
  //   function collapseAll(node) {
  //     node.expanded = false;
  //     if (node.children) node.children.forEach(collapseAll);
  //   }
  function collapseAll(node) {
    // Root stays expanded forever
    if (node.type === "root") {
      node.expanded = true;
      if (node.children) {
        node.children.forEach(collapseAll);
      }
      return;
    }

    // Zones stay visible but collapse their internals
    if (node.type === "zone") {
      node.expanded = false;
      if (node.children) {
        node.children.forEach(collapseAll);
      }
      return;
    }

    // Everything below zones collapses normally
    node.expanded = false;
    if (node.children) {
      node.children.forEach(collapseAll);
    }
  }

  function expandAll(node) {
    node.expanded = true;
    if (node.children) {
      node.children.forEach(expandAll);
    }
  }
}

setup();

window.addEventListener("resize", setup);

import { data } from "./data.js"; // This looks for ./data.js
import { links } from "./links.js"; // This looks for ./links.js
const rr = 10; // base radius for collapsed/leaf nodes
const gap = 100; // spacing between siblings inside a parent
const padding = 5; // extra padding between children and parent boundary
const siblingPad = gap; // reuse your existing gap
const SHOW_LINKS_ONLY_ON_HOVER = true;
const MAX_HOVER_LINKS = 300; // cap to keep it snappy (tweak: 150..800)

let nodeById = new Map();

const labelFontSizes = {
  zone: 14,
  environment: 13,
  tier: 12,
  application: 11,
  host: 10,
};

const labelVisibility = {
  zone: true,
  environment: true,
  tier: true,
  application: true,
  host: true,
};

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
function toNode(t, parentPath = "", parent = null) {
  const id = parentPath ? `${parentPath}/${t.name}` : t.name;
  const node = {
    id,
    name: t.name,
    type: t.type,
    expanded: false,
    children: [],
    parent, // ✅ add this
    r: rr,
    x: 0,
    y: 0,
    absX: 0,
    absY: 0,
  };
  node.children = (t.children ?? []).map((ch) => toNode(ch, id, node));
  return node;
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
    .scaleExtent([0.03, 12]) // min zoom, max zoom
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

  // label controls for live font size adjustment
  const labelTypeSelect = document.getElementById("labelType");
  const labelSizeSlider = document.getElementById("labelSize");
  const labelSizeValue = document.getElementById("labelSizeValue");

  // Initialize slider with current value
  labelSizeSlider.value = labelFontSizes[labelTypeSelect.value];
  labelSizeValue.textContent = `${labelSizeSlider.value}px`;

  // When label type changes → update slider
  labelTypeSelect.onchange = () => {
    const type = labelTypeSelect.value;
    labelSizeSlider.value = labelFontSizes[type];
    labelSizeValue.textContent = `${labelSizeSlider.value}px`;
  };

  // When slider moves → update font size live
  labelSizeSlider.oninput = () => {
    const type = labelTypeSelect.value;
    const size = Number(labelSizeSlider.value);

    labelFontSizes[type] = size;
    labelSizeValue.textContent = `${size}px`;

    // Update only labels (fast!)
    d3.selectAll("g.node")
      .filter((d) => d.node.type === type)
      .select("text")
      .style("font-size", `${size}px`);
  };

  const labelShowToggle = document.getElementById("labelShow");

  // Initialize checkbox based on selected type
  labelShowToggle.checked = labelVisibility[labelTypeSelect.value] !== false;

  // When label type changes, update checkbox to match that type
  labelTypeSelect.onchange = () => {
    const type = labelTypeSelect.value;

    labelSizeSlider.value = labelFontSizes[type];
    labelSizeValue.textContent = `${labelSizeSlider.value}px`;

    labelShowToggle.checked = labelVisibility[type] !== false;
  };

  // When checkbox toggled, show/hide labels of that type
  labelShowToggle.onchange = () => {
    const type = labelTypeSelect.value;
    const show = labelShowToggle.checked;

    labelVisibility[type] = show;

    // Update only labels for that type (fast!)
    d3.selectAll("g.node")
      .filter((d) => d.node.type === type)
      .select("text") // your label text element
      .style("display", show ? null : "none");
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

  function indexAllNodes(node, map = new Map()) {
    map.set(node.id, node);
    if (node.children) node.children.forEach((c) => indexAllNodes(c, map));
    return map;
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

    nodeById = indexAllNodes(root); // keep it current
  }

  //   let nodeById = indexAllNodes(root);

  function shortLabel(d, max = 15) {
    const s = d.node.name ?? d.node.id;
    return s.length > max ? s.slice(0, max - 1) + "…" : s;
  }
  // ---- 3) Render with D3 joins + transitions ----
  function render(sceneG) {
    // ---- collect visible nodes ----
    const visible = collectVisible(root, true);
    const visibleIds = new Set(visible.map((d) => d.node.id));

    // ---- layers (create once via join) ----
    const linksLayer = sceneG
      .selectAll("g.links")
      .data([null])
      .join("g")
      .attr("class", "links");

    const nodesLayer = sceneG
      .selectAll("g.nodes")
      .data([null])
      .join("g")
      .attr("class", "nodes");

    // ---- helpers ----
    function visibleProxy(node) {
      let cur = node;
      while (cur && !visibleIds.has(cur.id)) cur = cur.parent;
      return cur;
    }

    function collectHosts(node, out = []) {
      if (!node) return out;
      if (node.type === "host") out.push(node);
      if (node.children) node.children.forEach((c) => collectHosts(c, out));
      return out;
    }

    function hostIdsUnder(node) {
      const ids = new Set();
      collectHosts(node).forEach((h) => ids.add(h.id));
      return ids;
    }

    function computeResolvedLinksForHosts(hostIdSet) {
      if (!hostIdSet || hostIdSet.size === 0) return [];

      // Filter FIRST (fast)
      const filtered = links.filter(
        (l) => hostIdSet.has(l.source) || hostIdSet.has(l.target),
      );

      // Cap to avoid DOM spikes
      const capped =
        filtered.length > MAX_HOVER_LINKS
          ? filtered.slice(0, MAX_HOVER_LINKS)
          : filtered;

      // Resolve endpoints + snap to visible proxies
      return capped
        .map((l) => {
          const sh = nodeById.get(l.source);
          const th = nodeById.get(l.target);
          if (!sh || !th) return null;

          const sp = visibleProxy(sh);
          const tp = visibleProxy(th);
          if (!sp || !tp) return null;

          return { ...l, _sh: sh, _th: th, _sp: sp, _tp: tp };
        })
        .filter(Boolean);
    }

    function drawLinks(resolvedLinks) {
      const linksSel = linksLayer
        .selectAll("line.link")
        .data(resolvedLinks, (d) => d.id);

      linksSel
        .enter()
        .append("line")
        .attr("class", (d) => `link ${d.kind}`)
        .merge(linksSel)
        // no transitions on hover = snappy
        .attr("x1", (d) => d._sp.absX)
        .attr("y1", (d) => d._sp.absY)
        .attr("x2", (d) => d._tp.absX)
        .attr("y2", (d) => d._tp.absY);

      linksSel.exit().remove();
    }

    function clearLinks() {
      linksLayer.selectAll("line.link").remove();
    }

    function clearHighlight() {
      if (SHOW_LINKS_ONLY_ON_HOVER) clearLinks();

      // reset node styles
      sceneG
        .selectAll("g.node")
        .classed("dim", false)
        .classed("active", false)
        .classed("connected", false);
    }

    function highlightHostsInSubtree(hoveredNode) {
      const subtreeHostIds = hostIdsUnder(hoveredNode);

      // If subtree has no hosts, clear and bail
      if (subtreeHostIds.size === 0) {
        clearHighlight();
        return;
      }

      // 1) Draw only relevant links (or nothing)
      if (SHOW_LINKS_ONLY_ON_HOVER) {
        const resolved = computeResolvedLinksForHosts(subtreeHostIds);
        drawLinks(resolved);
      }

      // 2) Dim everything first
      const lines = sceneG.selectAll("line.link");
      const nodes = sceneG.selectAll("g.node");

      lines.classed("dim", true).classed("active", false);
      nodes
        .classed("dim", true)
        .classed("active", false)
        .classed("connected", false);

      // 3) Undim only endpoints of the *drawn* links that touch the subtree
      const showNodeIds = new Set();
      let anyMatched = false;

      lines.each(function (l) {
        const shId = l._sh?.id ?? l.source;
        const thId = l._th?.id ?? l.target;

        const match = subtreeHostIds.has(shId) || subtreeHostIds.has(thId);
        if (!match) return;

        anyMatched = true;
        d3.select(this).classed("dim", false).classed("active", true);

        if (l._sp?.id) showNodeIds.add(l._sp.id);
        if (l._tp?.id) showNodeIds.add(l._tp.id);
      });

      if (!anyMatched) {
        clearHighlight();
        return;
      }

      nodes.each(function (d) {
        const id = d.node.id;
        if (!showNodeIds.has(id)) return;

        d3.select(this).classed("dim", false).classed("connected", true);
      });

      // mark hovered node as active (optional)
      nodes.each(function (d) {
        if (d.node.id === hoveredNode.id) {
          d3.select(this).classed("active", true).classed("dim", false);
        }
      });
    }

    // ---- NODES join ----
    const nodesSel = nodesLayer
      .selectAll("g.node")
      .data(visible, (d) => d.node.id);

    const nodesEnter = nodesSel
      .enter()
      .append("g")
      .attr("class", (d) => `node ${d.node.type}`)
      .attr("transform", (d) => `translate(${d.node.absX}, ${d.node.absY})`)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
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

    nodesEnter
      .append("text")
      .text((d) => shortLabel(d))
      .attr("y", (d) => d.node.r + 14)
      .attr("text-anchor", "middle")
      .style("display", (d) => (d.node.type === "root" ? "none" : null))
      .style("font-size", (d) => {
        const t = d.node.type;
        return `${labelFontSizes[t] ?? 10}px`;
      });

    const nodesMerge = nodesEnter.merge(nodesSel);

    nodesMerge
      .on("mouseenter", (event, d) => highlightHostsInSubtree(d.node))
      .on("mouseleave", () => clearHighlight());

    nodesMerge
      .transition()
      .duration(250)
      .attr("transform", (d) => `translate(${d.node.absX}, ${d.node.absY})`);

    nodesMerge
      .select("circle")
      .transition()
      .duration(250)
      .attr("r", (d) => d.node.r);

    nodesMerge.attr("class", (d) => `node ${d.node.type}`);
    nodesMerge.select("text").attr("y", (d) => d.node.r + 14);

    nodesSel.exit().transition().duration(150).style("opacity", 0).remove();

    // Default state: no links shown
    if (SHOW_LINKS_ONLY_ON_HOVER) clearLinks();
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

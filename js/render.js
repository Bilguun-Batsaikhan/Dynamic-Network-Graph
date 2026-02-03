import { collectVisible, shortLabel } from "./model.js";
import { createHoverHighlighter } from "./hoverLinks.js";

/**
 * Main render function with D3 joins + transitions
 *
 * @param {Object} params
 * @param {d3.Selection} params.sceneG - D3 selection for the scene group
 * @param {Object} params.root - Root node
 * @param {Object} params.config - Config { SHOW_LINKS_ONLY_ON_HOVER, MAX_HOVER_LINKS, rr, labelFontSizes, labelVisibility }
 * @param {Object} params.colors - Colors { zoneColor }
 * @param {Array} params.linkEndpoints - Cached link endpoints
 * @param {Function} params.onToggleNode - Callback to handle node toggle (expanded state)
 */
export function render({
  sceneG,
  root,
  config,
  colors,
  linkEndpoints,
  onToggleNode,
  selection,
}) {
  const {
    SHOW_LINKS_ONLY_ON_HOVER,
    MAX_HOVER_LINKS,
    rr,
    labelFontSizes,
    labelVisibility,
  } = config;
  const { zoneColor } = colors;

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

  const highlighter = createHoverHighlighter({
    sceneG,
    linksLayer,
    visibleIds,
    linkEndpoints,
    config: { SHOW_LINKS_ONLY_ON_HOVER, MAX_HOVER_LINKS },
    sticky: true,
  });

  // ---- NODES join ----
  const nodesSel = nodesLayer
    .selectAll("g.node")
    .data(visible, (d) => d.node.id);

  const nodesEnter = nodesSel
    .enter()
    .append("g")
    .attr("class", (d) => `node ${d.node.type}`)
    .attr("transform", (d) => `translate(${d.node.absX}, ${d.node.absY})`)
    .style("cursor", "pointer");

  nodesEnter
    .append("circle")
    .attr("r", (d) => (d.node.type === "root" ? 0 : rr))
    .style("display", (d) => (d.node.type === "root" ? "none" : null));

  nodesEnter
    .append("text")
    .text((d) => shortLabel(d))
    .attr("y", (d) => d.node.r + 14)
    .attr("text-anchor", "middle")
    .style("display", (d) => {
      if (d.node.type === "root") return "none";
      return labelVisibility[d.node.type] !== false ? null : "none";
    })
    .style("font-size", (d) => {
      const t = d.node.type;
      return `${labelFontSizes[t] ?? 10}px`;
    });

  const nodesMerge = nodesEnter.merge(nodesSel);

  nodesMerge
    .style("cursor", "pointer")
    .on("click", (event, d) => {
      event.stopPropagation();
      if (d.node.type === "root") return;

      selection.setSelectedNodeId(d.node.id);

      // show highlight for current visibility snapshot
      highlighter.onEnter(d.node);

      applySelection(sceneG, selection.selectedNodeId);
    })
    .on("dblclick", (event, d) => {
      event.stopPropagation();
      if (d.node.type === "root") return;

      selection.setSelectedNodeId(d.node.id);

      if (d.node.children && d.node.children.length > 0) {
        // expand/collapse triggers rerender; rerender will re-apply highlight
        onToggleNode(d.node);
      } else {
        // leaf: highlight immediately
        highlighter.onEnter(d.node);
        applySelection(sceneG, selection.selectedNodeId);
      }
    });

  // nodesMerge
  //   .on("mouseenter", (event, d) => highlighter.onEnter(d.node))
  //   .on("mouseleave", () => highlighter.onLeave());

  nodesMerge
    .transition()
    .duration(250)
    .attr("transform", (d) => `translate(${d.node.absX}, ${d.node.absY})`);

  // Apply per-zone colors only to zone circles (others keep CSS styling)
  nodesMerge
    .filter((d) => d.node.type === "zone")
    .select("circle")
    .style("fill", (d) => zoneColor(d.node.name).fill)
    .style("stroke", (d) => zoneColor(d.node.name).stroke)
    .style("stroke-width", 3);

  nodesMerge
    .filter((d) => d.node.type !== "zone")
    .select("circle")
    .style("fill", null)
    .style("stroke", null)
    .style("stroke-width", null);

  nodesMerge
    .select("circle")
    .transition()
    .duration(250)
    .attr("r", (d) => d.node.r);

  nodesMerge.attr("class", (d) => `node ${d.node.type}`);
  nodesMerge.select("text").attr("y", (d) => d.node.r + 14);

  applySelection(sceneG, selection.selectedNodeId);

  const selected = visible.find((d) => d.node.id === selection.selectedNodeId);
  if (selected) {
    highlighter.onEnter(selected.node);
  } else {
    // if selected node is no longer visible, clear
    highlighter.clear();
  }

  nodesSel.exit().transition().duration(150).style("opacity", 0).remove();

  // If nothing is selected, keep the default "no links" behavior.
  // If something is selected, DO NOT clear, because click-selection is now the trigger.
  if (SHOW_LINKS_ONLY_ON_HOVER && !selection?.selectedNodeId) {
    clearLinks();
  }
}

/**
 * Helper: Clear all links from the visualization
 */

function clearLinks() {
  d3.selectAll("g.links").selectAll("line").remove();
  d3.selectAll("g.links").selectAll("text").remove();
}

function applySelection(sceneG, selectedNodeId) {
  sceneG
    .selectAll("g.node")
    .classed("selected", (d) => d.node.id === selectedNodeId);
}

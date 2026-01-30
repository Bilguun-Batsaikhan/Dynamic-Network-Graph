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
    .style("cursor", "pointer")
    .on("click", (event, d) => {
      event.stopPropagation();
      if (d.node.type === "root") return;

      if (d.node.children && d.node.children.length > 0) {
        onToggleNode(d.node);
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
    .on("mouseenter", (event, d) => highlighter.onEnter(d.node))
    .on("mouseleave", () => highlighter.onLeave());

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

  nodesSel.exit().transition().duration(150).style("opacity", 0).remove();

  // Default state: no links shown
  if (SHOW_LINKS_ONLY_ON_HOVER) clearLinks();
}

/**
 * Helper: Clear all links from the visualization
 */
function clearLinks() {
  d3.selectAll("g.links").selectAll("line").remove();
  d3.selectAll("g.links").selectAll("text").remove();
}

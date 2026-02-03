// main.js - Main application entry point

import { data } from "../data.js";
import { links } from "../links.js";
import { toNode, buildHostCaches } from "./model.js";
import { initZoneColors, zoneColor } from "./colors.js";
import { recomputeAll } from "./layout.js";
import { render } from "./render.js";
import { bindUI } from "./ui.js";
import {
  labelFontSizes,
  labelVisibility,
  SHOW_LINKS_ONLY_ON_HOVER,
  MAX_HOVER_LINKS,
  rr,
} from "./config.js";

// Build root
const root = toNode(data);
buildHostCaches(root);
root.expanded = true;
initZoneColors(root);
let selectedNodeId = null;

function getCenterTransform() {
  const rect = svg.node().getBoundingClientRect();
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  return d3.zoomIdentity.translate(cx, cy).scale(1);
}

// Create SVG/viewport/scene
const container = d3.select("#viz");
const svg = container.append("svg");
const viewport = svg.append("g").attr("class", "viewport");
const g = viewport.append("g").attr("class", "scene");

// Zoom
const zoom = d3
  .zoom()
  .scaleExtent([0.03, 12])
  .on("zoom", (event) => {
    viewport.attr("transform", event.transform);
  });

svg.call(zoom).on("dblclick.zoom", null);
svg.call(zoom.transform, getCenterTransform());

// Initial recompute
let { nodeById, linkEndpoints } = recomputeAll(root, links);

// Config and colors
const renderConfig = {
  labelFontSizes,
  labelVisibility,
  SHOW_LINKS_ONLY_ON_HOVER,
  MAX_HOVER_LINKS,
  rr,
};
const renderColors = { zoneColor };

// onToggleNode
const onToggleNode = (node) => {
  node.expanded = !node.expanded;
  ({ nodeById, linkEndpoints } = recomputeAll(root, links));
  render({
    sceneG: g,
    root,
    config: renderConfig,
    colors: renderColors,
    linkEndpoints,
    onToggleNode,
    selection,
  });
};
// Selection state
const selection = {
  get selectedNodeId() {
    return selectedNodeId;
  },
  setSelectedNodeId(id) {
    selectedNodeId = id;
  },
};

// Initial render
render({
  sceneG: g,
  root,
  config: renderConfig,
  colors: renderColors,
  linkEndpoints,
  onToggleNode,
  selection,
});

// Bind UI
const onRecomputeAndRender = () => {
  ({ nodeById, linkEndpoints } = recomputeAll(root, links));
  render({
    sceneG: g,
    root,
    config: renderConfig,
    colors: renderColors,
    linkEndpoints,
    onToggleNode,
    selection,
  });
};

bindUI({
  root,
  svg,
  zoom,
  onRecomputeAndRender,
  config: renderConfig,
  getCenterTransform,
});

// Clear selection on background click
svg.on("click", (event) => {
  if (event.defaultPrevented) return;
  selectedNodeId = null;
  // rerender so links/nodes clear
  ({ nodeById, linkEndpoints } = recomputeAll(root, links));
  render({
    sceneG: g,
    root,
    config: renderConfig,
    colors: renderColors,
    linkEndpoints,
    onToggleNode,
    selection,
  });
});

// Resize listener
window.addEventListener("resize", () => {
  // Handle resize if needed
});

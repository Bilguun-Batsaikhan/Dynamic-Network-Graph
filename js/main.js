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
  });
};

// Initial render
render({
  sceneG: g,
  root,
  config: renderConfig,
  colors: renderColors,
  linkEndpoints,
  onToggleNode,
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
  });
};

bindUI({ root, svg, zoom, onRecomputeAndRender, config: renderConfig });

// Resize listener
window.addEventListener("resize", () => {
  // Handle resize if needed
});

// layout.js - Handles circle packing, radius computation, positioning, and recomputation of the tree layout

import { rr, padding, siblingPad } from "./config.js";
import { computeAbsolutePositions, indexAllNodes } from "./model.js";

export function packWithPadding(circles, pad) {
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

export function computeRadius(node) {
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

export function layout(node) {
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

export function recomputeAll(root, links) {
  computeRadius(root);

  // root local position (origin)
  root.x = 0;
  root.y = 0;

  layout(root);

  // IMPORTANT: convert local x/y into absolute positions for rendering
  computeAbsolutePositions(root, 0, 0);

  const nodeById = indexAllNodes(root); // keep it current
  const linkEndpoints = links
    .map((l) => {
      const sh = nodeById.get(l.source);
      const th = nodeById.get(l.target);
      if (!sh || !th) return null;
      return { ...l, _sh: sh, _th: th };
    })
    .filter(Boolean);

  return { nodeById, linkEndpoints };
}

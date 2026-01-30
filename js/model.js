import { rr } from "./config.js";

// These are “data structure + traversal” utilities
// Convert topology -> your node shape (id/expanded/children/r/x/y/absX/absY)
export function toNode(t, parentPath = "", parent = null) {
  const id = parentPath ? `${parentPath}/${t.name}` : t.name;
  const node = {
    id,
    name: t.name,
    type: t.type,
    expanded: false,
    children: [],
    parent,
    r: rr,
    x: 0,
    y: 0,
    absX: 0,
    absY: 0,

    // ✅ caches / metadata
    depth: parent ? parent.depth + 1 : 0,
    zone: parent?.zone ?? (t.type === "zone" ? t.name : null),
    env: parent?.env ?? (t.type === "environment" ? t.name : null),

    hostList: null, // Array<Node> (hosts)
    hostSet: null, // Set<string> (host ids)
  };

  node.children = (t.children ?? []).map((ch) => toNode(ch, id, node));
  return node;
}

export function buildHostCaches(node) {
  // Leaf host
  if (node.type === "host") {
    node.hostList = [node];
    node.hostSet = new Set([node.id]);
    return node.hostSet;
  }

  const set = new Set();
  const list = [];

  if (node.children && node.children.length) {
    node.children.forEach((c) => {
      const childSet = buildHostCaches(c);
      // merge sets
      childSet.forEach((id) => set.add(id));

      // merge lists
      if (c.hostList) list.push(...c.hostList);
    });
  }

  node.hostSet = set;
  node.hostList = list;
  return set;
}

export function computeAbsolutePositions(node, parentAbsX = 0, parentAbsY = 0) {
  node.absX = parentAbsX + (node.x ?? 0);
  node.absY = parentAbsY + (node.y ?? 0);

  if (node.children && node.children.length && node.expanded) {
    node.children.forEach((c) =>
      computeAbsolutePositions(c, node.absX, node.absY),
    );
  }
}

export function indexAllNodes(node, map = new Map()) {
  map.set(node.id, node);
  if (node.children) node.children.forEach((c) => indexAllNodes(c, map));
  return map;
}

export function isVisible(node, ancestorsExpanded) {
  // root is always visible, others only if all ancestors are expanded
  return ancestorsExpanded;
}

export function collectVisible(
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

export function shortLabel(d, max = 15) {
  const s = d.node.name ?? d.node.id;
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

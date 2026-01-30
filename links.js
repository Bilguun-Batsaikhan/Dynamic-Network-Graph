// links.js
// Generates ~1600 arcs, internal + cross-zone

import data from "./data.js";

function assignIds(node, parentPath = "") {
  const id = parentPath ? `${parentPath}/${node.name}` : node.name;
  node.__id = id;
  if (node.children) node.children.forEach((c) => assignIds(c, id));
}

function collectHosts(node, zone = null, env = null, out = []) {
  if (node.type === "zone") zone = node.name;
  if (node.type === "environment") env = node.name;

  if (node.type === "host") {
    out.push({ id: node.__id, zone, env });
  }

  if (node.children) {
    node.children.forEach((c) => collectHosts(c, zone, env, out));
  }
  return out;
}

assignIds(data);
const hosts = collectHosts(data);

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const links = [];
let id = 0;

// INTERNAL LINKS (dense)
for (let i = 0; i < 1200; i++) {
  const a = rand(hosts);
  const b = rand(hosts.filter((h) => h.zone === a.zone && h.id !== a.id));
  if (!a || !b) continue;

  links.push({
    id: `l_${id++}`,
    source: a.id,
    target: b.id,
    kind: "internal",
  });
}

// CROSS-ZONE LINKS (mostly prod)
for (let i = 0; i < 400; i++) {
  const a = rand(hosts.filter((h) => h.env === "Production"));
  const b = rand(hosts.filter((h) => h.zone !== a.zone));
  if (!a || !b) continue;

  links.push({
    id: `l_${id++}`,
    source: a.id,
    target: b.id,
    kind: "cross-zone",
  });
}

export { links };
export default links;

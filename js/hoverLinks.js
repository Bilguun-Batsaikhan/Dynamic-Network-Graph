// hoverLinks.js - Handles hover filtering and highlight logic for links and nodes

export function createHoverHighlighter({
  sceneG,
  linksLayer,
  visibleIds,
  linkEndpoints,
  config,
}) {
  const { SHOW_LINKS_ONLY_ON_HOVER, MAX_HOVER_LINKS } = config;

  function visibleProxy(node) {
    let cur = node;
    while (cur && !visibleIds.has(cur.id)) cur = cur.parent;
    return cur;
  }

  function computeResolvedLinksForHosts(hostIdSet) {
    if (!hostIdSet || hostIdSet.size === 0) return [];

    const filtered = linkEndpoints.filter(
      (l) => hostIdSet.has(l.source) || hostIdSet.has(l.target),
    );

    const capped =
      filtered.length > MAX_HOVER_LINKS
        ? filtered.slice(0, MAX_HOVER_LINKS)
        : filtered;

    return capped
      .map((l) => {
        const sp = visibleProxy(l._sh);
        const tp = visibleProxy(l._th);
        if (!sp || !tp) return null;
        return { ...l, _sp: sp, _tp: tp };
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
    const subtreeHostIds = hoveredNode.hostSet ?? new Set();

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

  return {
    onEnter: highlightHostsInSubtree,
    onLeave: clearHighlight,
  };
}

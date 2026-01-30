// ui.js - UI event handlers and controls

export function collapseAll(node) {
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

export function expandAll(node) {
  node.expanded = true;
  if (node.children) {
    node.children.forEach(expandAll);
  }
}

export function bindUI({ root, svg, zoom, onRecomputeAndRender, config }) {
  const { labelFontSizes, labelVisibility } = config;

  // Buttons
  document.getElementById("collapseAll").onclick = () => {
    collapseAll(root);
    onRecomputeAndRender();
  };

  document.getElementById("expandAll").onclick = () => {
    expandAll(root);
    onRecomputeAndRender();
  };

  document.getElementById("resetView").onclick = () => {
    svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
  };

  // Label controls
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
      .select("text")
      .style("display", show ? null : "none");
  };
}

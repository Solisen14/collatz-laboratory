const DEG_TO_RAD = Math.PI / 180;
const SVG_NS = 'http://www.w3.org/2000/svg';

const svg = document.getElementById('treeSvg');
const treeWrapper = document.getElementById('treeWrapper');
const tooltip = document.getElementById('treeTooltip');
const statsLine = document.getElementById('statsLine');
const statusMessage = document.getElementById('statusMessage');
const pathInfo = document.getElementById('pathInfo');
const visualizerShell = document.getElementById('visualizerShell');

const controls = {
  depth: document.getElementById('depthRange'),
  angle: document.getElementById('angleRange'),
  length: document.getElementById('lengthRange'),
  decay: document.getElementById('decayRange'),
  width: document.getElementById('widthRange'),
  colourMode: document.getElementById('colourMode'),
  labelMode: document.getElementById('labelMode'),
  showGlow: document.getElementById('showGlow'),
  renderButton: document.getElementById('renderButton'),
  animateButton: document.getElementById('animateButton'),
  exportButton: document.getElementById('exportButton'),
  toggleControls: document.getElementById('toggleControls'),
  zoomInButton: document.getElementById('zoomInButton'),
  zoomOutButton: document.getElementById('zoomOutButton'),
  fitButton: document.getElementById('fitButton'),
  clearPathButton: document.getElementById('clearPathButton')
};

const outputs = {
  depth: document.getElementById('depthValue'),
  angle: document.getElementById('angleValue'),
  length: document.getElementById('lengthValue'),
  decay: document.getElementById('decayValue'),
  width: document.getElementById('widthValue')
};

let animationTimers = [];
let renderDebounce = null;
let currentModel = null;
let currentElements = null;
let fitViewBox = null;
let cameraViewBox = null;
let cameraTouched = false;
let highlightedValue = null;
let dragState = null;
let suppressNextNodeClick = false;

function clearAnimationTimers() {
  animationTimers.forEach((timer) => window.clearTimeout(timer));
  animationTimers = [];
}

function oddPredecessor(n) {
  const candidate = (n - 1) / 3;
  if (!Number.isInteger(candidate) || candidate <= 0) return null;
  return candidate % 2 === 1 ? candidate : null;
}

function readOptions() {
  return {
    depth: Number(controls.depth.value),
    angle: Number(controls.angle.value),
    length: Number(controls.length.value),
    decay: Number(controls.decay.value),
    width: Number(controls.width.value),
    colourMode: controls.colourMode.value,
    labelMode: controls.labelMode.value,
    showGlow: controls.showGlow.checked
  };
}

function updateOutputs() {
  outputs.depth.textContent = controls.depth.value;
  outputs.angle.textContent = `${controls.angle.value}°`;
  outputs.length.textContent = controls.length.value;
  outputs.decay.textContent = Number(controls.decay.value).toFixed(2);
  outputs.width.textContent = Number(controls.width.value).toFixed(1);
}

function buildTree(options) {
  let nextNodeId = 0;
  const nodes = [];
  const edges = [];
  const seen = new Set();
  let maxValue = 1;

  function visit(value, x, y, angle, depth, incomingType = 'root', parentId = null) {
    if (seen.has(value)) return null;
    seen.add(value);

    const nodeId = `node-${nextNodeId++}`;
    nodes.push({ id: nodeId, value, x, y, angle, depth, incomingType, parentId });
    maxValue = Math.max(maxValue, value);

    if (depth >= options.depth) return nodeId;

    const length = options.length * Math.pow(options.decay, depth);
    const odd = oddPredecessor(value);
    const candidates = [{ value: value * 2, type: 'even' }];
    if (odd !== null) candidates.push({ value: odd, type: 'odd' });
    const children = candidates.filter((child) => !seen.has(child.value));

    children.forEach((child) => {
      const spread = options.angle * 0.5 * DEG_TO_RAD;
      const childAngle = children.length === 1
        ? angle
        : angle + (child.type === 'even' ? -spread : spread);
      const childX = x + length * Math.cos(childAngle);
      const childY = y + length * Math.sin(childAngle);
      const childId = visit(child.value, childX, childY, childAngle, depth + 1, child.type, nodeId);
      if (!childId) return;

      edges.push({
        id: `${nodeId}-${childId}`,
        from: nodeId,
        to: childId,
        x1: x,
        y1: y,
        x2: childX,
        y2: childY,
        depth: depth + 1,
        type: child.type,
        childValue: child.value
      });
    });

    return nodeId;
  }

  visit(1, 0, 0, 0, 0, 'root', null);

  const xs = nodes.map((node) => node.x);
  const ys = nodes.map((node) => node.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    nodes,
    edges,
    maxValue,
    bounds: {
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    }
  };
}

function colourFor(type, depth, maxDepth, mode) {
  if (mode === 'mono') {
    const lightness = 84 - (depth / Math.max(maxDepth, 1)) * 28;
    return `hsla(210, 20%, ${lightness}%, 0.96)`;
  }

  if (mode === 'depth') {
    const hue = 195 + (depth / Math.max(maxDepth, 1)) * 145;
    return `hsla(${hue.toFixed(1)}, 90%, 72%, 0.96)`;
  }

  if (type === 'odd') return 'rgba(255, 201, 107, 0.96)';
  if (type === 'even') return 'rgba(122, 231, 255, 0.96)';
  return 'rgba(255, 255, 255, 0.94)';
}

function formatRuleLabel(type) {
  if (type === 'even') return 'even predecessor · 2n';
  if (type === 'odd') return 'odd predecessor · (n − 1) / 3';
  return 'root value';
}

function shouldShowSmartLabel(node, options) {
  if (node.depth === 0) return true;
  if (node.depth <= 7) return true;
  if (node.incomingType === 'odd' && node.depth <= 10) return true;
  return options.depth <= 9 && node.depth <= options.depth;
}

function showTooltip(html) {
  tooltip.innerHTML = html;
  tooltip.classList.remove('hidden');
}

function hideTooltip() {
  tooltip.classList.add('hidden');
}

function makeViewBox(bounds) {
  const padding = 58;
  return {
    x: bounds.minX - padding,
    y: bounds.minY - padding,
    width: Math.max(880, bounds.width + padding * 2),
    height: Math.max(560, bounds.height + padding * 2)
  };
}

function applyViewBox(viewBox) {
  cameraViewBox = { ...viewBox };
  svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
}

function fitCamera() {
  if (!fitViewBox) return;
  cameraTouched = false;
  applyViewBox(fitViewBox);
  statusMessage.textContent = 'Fit to screen.';
}

function zoomCamera(factor, clientX = null, clientY = null) {
  if (!cameraViewBox) return;
  const rect = svg.getBoundingClientRect();
  const px = clientX == null ? rect.left + rect.width / 2 : clientX;
  const py = clientY == null ? rect.top + rect.height / 2 : clientY;
  const rx = Math.min(1, Math.max(0, (px - rect.left) / rect.width));
  const ry = Math.min(1, Math.max(0, (py - rect.top) / rect.height));
  const anchorX = cameraViewBox.x + rx * cameraViewBox.width;
  const anchorY = cameraViewBox.y + ry * cameraViewBox.height;

  const minWidth = fitViewBox ? fitViewBox.width * 0.06 : 40;
  const maxWidth = fitViewBox ? fitViewBox.width * 8 : cameraViewBox.width * 8;
  const newWidth = Math.min(maxWidth, Math.max(minWidth, cameraViewBox.width * factor));
  const aspect = cameraViewBox.height / cameraViewBox.width;
  const newHeight = newWidth * aspect;

  cameraTouched = true;
  applyViewBox({
    x: anchorX - rx * newWidth,
    y: anchorY - ry * newHeight,
    width: newWidth,
    height: newHeight
  });
}

function svgPointFromClient(clientX, clientY) {
  const rect = svg.getBoundingClientRect();
  return {
    x: cameraViewBox.x + ((clientX - rect.left) / rect.width) * cameraViewBox.width,
    y: cameraViewBox.y + ((clientY - rect.top) / rect.height) * cameraViewBox.height
  };
}

function clearPathHighlight({ silent = false } = {}) {
  highlightedValue = null;
  controls.clearPathButton.disabled = true;
  pathInfo.classList.add('hidden');
  pathInfo.textContent = '';

  if (!currentElements) return;

  currentElements.nodes.forEach(({ group, circle, label, baseStroke }) => {
    group.classList.remove('path-muted', 'path-highlight', 'path-selected');
    circle.setAttribute('stroke', baseStroke);
    if (label) label.classList.remove('path-label-force');
  });

  currentElements.edges.forEach(({ line, glowLine, baseStroke }) => {
    line.classList.remove('path-muted', 'path-highlight');
    line.setAttribute('stroke', baseStroke);
    if (glowLine) {
      glowLine.classList.remove('path-muted', 'path-highlight');
      glowLine.setAttribute('stroke', baseStroke);
    }
  });

  if (!silent) statusMessage.textContent = 'Path cleared.';
}

function highlightPathToRoot(value) {
  if (!currentModel || !currentElements) return;
  const byValue = new Map(currentModel.nodes.map((node) => [node.value, node]));
  const byId = new Map(currentModel.nodes.map((node) => [node.id, node]));
  const edgeByTo = new Map(currentModel.edges.map((edge) => [edge.to, edge]));
  const start = byValue.get(value);
  if (!start) return;

  const pathNodes = [];
  const pathEdges = [];
  let cursor = start;

  while (cursor) {
    pathNodes.push(cursor);
    if (!cursor.parentId) break;
    const edge = edgeByTo.get(cursor.id);
    if (edge) pathEdges.push(edge);
    cursor = byId.get(cursor.parentId) || null;
  }

  const pathNodeIds = new Set(pathNodes.map((node) => node.id));
  const pathEdgeIds = new Set(pathEdges.map((edge) => edge.id));
  const selectedId = start.id;
  highlightedValue = value;

  currentElements.nodes.forEach(({ node, group, circle, label, baseStroke }) => {
    const isPath = pathNodeIds.has(node.id);
    group.classList.toggle('path-muted', !isPath);
    group.classList.toggle('path-highlight', isPath);
    group.classList.toggle('path-selected', node.id === selectedId);
    circle.setAttribute('stroke', isPath ? '#ffe09a' : baseStroke);
    if (label) label.classList.toggle('path-label-force', isPath);
  });

  currentElements.edges.forEach(({ edge, line, glowLine, baseStroke }) => {
    const isPath = pathEdgeIds.has(edge.id);
    line.classList.toggle('path-muted', !isPath);
    line.classList.toggle('path-highlight', isPath);
    line.setAttribute('stroke', isPath ? '#ffe09a' : baseStroke);
    if (glowLine) {
      glowLine.classList.toggle('path-muted', !isPath);
      glowLine.classList.toggle('path-highlight', isPath);
      glowLine.setAttribute('stroke', isPath ? '#ffe09a' : baseStroke);
    }
  });

  const sequence = pathNodes.map((node) => node.value);
  const display = sequence.length > 14
    ? `${sequence.slice(0, 10).join(' → ')} → … → ${sequence[sequence.length - 1]}`
    : sequence.join(' → ');

  pathInfo.innerHTML = `<strong>${value}</strong> to 1: ${display}`;
  pathInfo.classList.remove('hidden');
  controls.clearPathButton.disabled = false;
  statusMessage.textContent = `${sequence.length - 1} Collatz steps to 1.`;
}

function renderTree({ animate = false, fit = false } = {}) {
  clearAnimationTimers();
  hideTooltip();
  updateOutputs();

  const options = readOptions();
  const model = buildTree(options);
  currentModel = model;
  fitViewBox = makeViewBox(model.bounds);

  if (fit || !cameraViewBox) {
    applyViewBox(fitViewBox);
  } else {
    applyViewBox(cameraViewBox);
  }

  svg.innerHTML = '';

  const defs = document.createElementNS(SVG_NS, 'defs');
  defs.innerHTML = `
    <filter id="vizNodeGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="2.8" result="blur"></feGaussianBlur>
      <feMerge>
        <feMergeNode in="blur"></feMergeNode>
        <feMergeNode in="SourceGraphic"></feMergeNode>
      </feMerge>
    </filter>
  `;
  svg.appendChild(defs);

  const edgeGlowLayer = document.createElementNS(SVG_NS, 'g');
  const edgeLayer = document.createElementNS(SVG_NS, 'g');
  const nodeLayer = document.createElementNS(SVG_NS, 'g');
  svg.append(edgeGlowLayer, edgeLayer, nodeLayer);

  const nodeElements = new Map();
  const nodeElementList = [];
  const edgeElements = [];
  const depthDenominator = Math.max(options.depth, 1);

  model.edges.forEach((edge) => {
    const stroke = colourFor(edge.type, edge.depth, options.depth, options.colourMode);
    const taper = 1 - edge.depth / (depthDenominator + 2);
    const strokeWidth = Math.max(0.85, options.width * (0.55 + taper * 0.6));

    let glowLine = null;
    if (options.showGlow) {
      glowLine = document.createElementNS(SVG_NS, 'line');
      glowLine.setAttribute('x1', edge.x1);
      glowLine.setAttribute('y1', edge.y1);
      glowLine.setAttribute('x2', edge.x2);
      glowLine.setAttribute('y2', edge.y2);
      glowLine.setAttribute('stroke', stroke);
      glowLine.setAttribute('stroke-width', Math.max(4.5, strokeWidth * 3.2).toFixed(2));
      glowLine.setAttribute('stroke-opacity', '0.16');
      glowLine.setAttribute('stroke-linecap', 'round');
      glowLine.setAttribute('class', `tree-edge-glow${animate ? ' tree-hidden' : ''}`);
      edgeGlowLayer.appendChild(glowLine);
    }

    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', edge.x1);
    line.setAttribute('y1', edge.y1);
    line.setAttribute('x2', edge.x2);
    line.setAttribute('y2', edge.y2);
    line.setAttribute('stroke', stroke);
    line.setAttribute('stroke-width', strokeWidth.toFixed(2));
    line.setAttribute('class', `tree-edge interactive${animate ? ' tree-hidden' : ''}`);
    line.dataset.edgeId = edge.id;

    line.addEventListener('mouseenter', () => {
      showTooltip(`<p class="tooltip-title">${edge.childValue}</p><p class="tooltip-meta">${formatRuleLabel(edge.type)} · generation ${edge.depth}</p>`);
    });
    line.addEventListener('mouseleave', hideTooltip);

    edgeLayer.appendChild(line);
    edgeElements.push({ edge, line, glowLine, baseStroke: stroke });
  });

  model.nodes.forEach((node) => {
    const stroke = colourFor(node.incomingType, node.depth, options.depth, options.colourMode);
    const group = document.createElementNS(SVG_NS, 'g');
    group.setAttribute('class', `tree-node-group interactive${animate && node.depth > 0 ? ' tree-hidden' : ''}`);
    group.dataset.nodeValue = String(node.value);
    group.dataset.nodeId = node.id;

    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', node.x);
    circle.setAttribute('cy', node.y);
    circle.setAttribute('r', node.depth === 0 ? 7.5 : 4.8);
    circle.setAttribute('stroke', stroke);
    circle.setAttribute('class', 'tree-node-circle');
    if (options.showGlow) circle.setAttribute('filter', 'url(#vizNodeGlow)');
    group.appendChild(circle);

    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', node.x + 8);
    label.setAttribute('y', node.y - 8);
    label.textContent = String(node.value);

    const labelAlways = options.labelMode === 'all'
      || (options.labelMode === 'smart' && shouldShowSmartLabel(node, options))
      || node.depth === 0;
    label.setAttribute(
      'class',
      `tree-node-label ${labelAlways ? 'label-always' : 'label-hover'}${animate && node.depth > 0 ? ' tree-hidden' : ''}`
    );
    group.appendChild(label);

    group.addEventListener('mouseenter', () => {
      showTooltip(`<p class="tooltip-title">${node.value}</p><p class="tooltip-meta">${formatRuleLabel(node.incomingType)} · generation ${node.depth}</p>`);
    });
    group.addEventListener('mouseleave', hideTooltip);
    group.addEventListener('click', (event) => {
      event.stopPropagation();
      if (suppressNextNodeClick) {
        suppressNextNodeClick = false;
        return;
      }
      highlightPathToRoot(node.value);
    });

    nodeLayer.appendChild(group);
    nodeElements.set(node.id, group);
    nodeElementList.push({ node, group, circle, label, baseStroke: stroke });
  });

  currentElements = { nodes: nodeElementList, edges: edgeElements };

  statsLine.textContent = `Nodes: ${model.nodes.length.toLocaleString()} · Branches: ${model.edges.length.toLocaleString()} · Max value: ${model.maxValue.toLocaleString()}`;
  statusMessage.textContent = animate ? 'Animating growth…' : 'Rendered.';

  if (highlightedValue != null) {
    const stillExists = model.nodes.some((node) => node.value === highlightedValue);
    if (stillExists) highlightPathToRoot(highlightedValue);
    else clearPathHighlight({ silent: true });
  }

  if (!animate) return;

  const rootGroup = nodeElements.get('node-0');
  rootGroup?.classList.remove('tree-hidden');

  const sortedEdges = [...edgeElements].sort((a, b) => a.edge.depth - b.edge.depth || a.edge.childValue - b.edge.childValue);
  sortedEdges.forEach(({ edge, line, glowLine }, index) => {
    const delay = index * 48;
    animationTimers.push(window.setTimeout(() => {
      glowLine?.classList.remove('tree-hidden');
      line.classList.remove('tree-hidden');
      const childGroup = nodeElements.get(edge.to);
      childGroup?.classList.remove('tree-hidden');
      childGroup?.querySelectorAll('.tree-node-label').forEach((label) => label.classList.remove('tree-hidden'));
    }, delay));
  });

  animationTimers.push(window.setTimeout(() => {
    statusMessage.textContent = 'Animation complete.';
  }, sortedEdges.length * 48 + 180));
}

function downloadSvg() {
  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(svg);
  const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'collatz-visualizer.svg';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  statusMessage.textContent = 'SVG downloaded.';
}

function scheduleRender({ fit = false } = {}) {
  window.clearTimeout(renderDebounce);
  renderDebounce = window.setTimeout(() => renderTree({ animate: false, fit }), 130);
}

['angle', 'length', 'decay', 'width'].forEach((key) => {
  controls[key].addEventListener('input', () => scheduleRender({ fit: false }));
});
controls.depth.addEventListener('input', () => scheduleRender({ fit: true }));
controls.colourMode.addEventListener('change', () => renderTree({ animate: false, fit: false }));
controls.labelMode.addEventListener('change', () => renderTree({ animate: false, fit: false }));
controls.showGlow.addEventListener('change', () => renderTree({ animate: false, fit: false }));
controls.renderButton.addEventListener('click', () => renderTree({ animate: false, fit: false }));
controls.animateButton.addEventListener('click', () => renderTree({ animate: true, fit: false }));
controls.exportButton.addEventListener('click', downloadSvg);
controls.fitButton.addEventListener('click', fitCamera);
controls.zoomInButton.addEventListener('click', () => zoomCamera(0.82));
controls.zoomOutButton.addEventListener('click', () => zoomCamera(1.22));
controls.clearPathButton.addEventListener('click', () => clearPathHighlight());

controls.toggleControls.addEventListener('click', () => {
  const collapsed = visualizerShell.classList.toggle('controls-collapsed');
  controls.toggleControls.textContent = collapsed ? '›' : '‹';
  controls.toggleControls.setAttribute('aria-expanded', String(!collapsed));
  controls.toggleControls.setAttribute('aria-label', collapsed ? 'Show controls' : 'Hide controls');
  statusMessage.textContent = collapsed ? 'Controls hidden.' : 'Controls shown.';
});

svg.addEventListener('wheel', (event) => {
  event.preventDefault();
  zoomCamera(event.deltaY > 0 ? 1.12 : 0.89, event.clientX, event.clientY);
}, { passive: false });

svg.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 || !cameraViewBox) return;
  if (event.target.closest?.('.tree-node-group')) return;
  dragState = {
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startViewBox: { ...cameraViewBox },
    moved: false
  };
  svg.setPointerCapture(event.pointerId);
  svg.classList.add('is-panning');
});

svg.addEventListener('pointermove', (event) => {
  if (!dragState || event.pointerId !== dragState.pointerId) return;
  const rect = svg.getBoundingClientRect();
  const dxPixels = event.clientX - dragState.startClientX;
  const dyPixels = event.clientY - dragState.startClientY;
  if (Math.hypot(dxPixels, dyPixels) > 3) dragState.moved = true;
  const dx = (dxPixels / rect.width) * dragState.startViewBox.width;
  const dy = (dyPixels / rect.height) * dragState.startViewBox.height;
  cameraTouched = true;
  applyViewBox({
    x: dragState.startViewBox.x - dx,
    y: dragState.startViewBox.y - dy,
    width: dragState.startViewBox.width,
    height: dragState.startViewBox.height
  });
});

function endPan(event) {
  if (!dragState || event.pointerId !== dragState.pointerId) return;
  try { svg.releasePointerCapture(event.pointerId); } catch (_) {}
  dragState = null;
  svg.classList.remove('is-panning');
}

svg.addEventListener('pointerup', endPan);
svg.addEventListener('pointercancel', endPan);
svg.addEventListener('dblclick', (event) => {
  if (event.target.closest?.('.tree-node-group')) return;
  fitCamera();
});

window.addEventListener('resize', () => {
  if (!cameraTouched) fitCamera();
});

updateOutputs();
renderTree({ animate: true, fit: true });

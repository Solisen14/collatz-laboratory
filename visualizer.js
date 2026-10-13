const DEG_TO_RAD = Math.PI / 180;

const svg = document.getElementById('treeSvg');
const tooltip = document.getElementById('treeTooltip');
const statsLine = document.getElementById('statsLine');
const statusMessage = document.getElementById('statusMessage');

const controls = {
  depth: document.getElementById('depthRange'),
  angle: document.getElementById('angleRange'),
  length: document.getElementById('lengthRange'),
  decay: document.getElementById('decayRange'),
  width: document.getElementById('widthRange'),
  colourMode: document.getElementById('colourMode'),
  showLabels: document.getElementById('showLabels'),
  showGlow: document.getElementById('showGlow'),
  renderButton: document.getElementById('renderButton'),
  animateButton: document.getElementById('animateButton'),
  exportButton: document.getElementById('exportButton')
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
    showLabels: controls.showLabels.checked,
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
    const children = [{ value: value * 2, type: 'even' }];
    if (odd !== null) children.push({ value: odd, type: 'odd' });

    children.forEach((child) => {
      if (seen.has(child.value)) return;

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

function showTooltip(html) {
  tooltip.innerHTML = html;
  tooltip.classList.remove('hidden');
}

function hideTooltip() {
  tooltip.classList.add('hidden');
}

function renderTree({ animate = false } = {}) {
  clearAnimationTimers();
  hideTooltip();
  updateOutputs();

  const options = readOptions();
  const model = buildTree(options);
  const { bounds } = model;
  const padding = 58;
  const viewBoxWidth = Math.max(880, bounds.width + padding * 2);
  const viewBoxHeight = Math.max(560, bounds.height + padding * 2);

  svg.setAttribute(
    'viewBox',
    `${bounds.minX - padding} ${bounds.minY - padding} ${viewBoxWidth} ${viewBoxHeight}`
  );
  svg.innerHTML = '';

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <filter id="vizGlow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="2.8" result="blur"></feGaussianBlur>
      <feMerge>
        <feMergeNode in="blur"></feMergeNode>
        <feMergeNode in="SourceGraphic"></feMergeNode>
      </feMerge>
    </filter>
  `;
  svg.appendChild(defs);

  const edgeLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const nodeLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  svg.append(edgeLayer, nodeLayer);

  const nodeElements = new Map();
  const edgeElements = [];
  const depthDenominator = Math.max(options.depth, 1);

  model.edges.forEach((edge) => {
    const stroke = colourFor(edge.type, edge.depth, options.depth, options.colourMode);
    const taper = 1 - edge.depth / (depthDenominator + 2);
    const strokeWidth = Math.max(0.85, options.width * (0.55 + taper * 0.6));

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', edge.x1);
    line.setAttribute('y1', edge.y1);
    line.setAttribute('x2', edge.x2);
    line.setAttribute('y2', edge.y2);
    line.setAttribute('stroke', stroke);
    line.setAttribute('stroke-width', strokeWidth.toFixed(2));
    line.setAttribute('class', `tree-edge interactive${animate ? ' tree-hidden' : ''}`);
    if (options.showGlow) line.setAttribute('filter', 'url(#vizGlow)');

    line.addEventListener('mouseenter', () => {
      showTooltip(`<p class="tooltip-title">${edge.childValue}</p><p class="tooltip-meta">${formatRuleLabel(edge.type)} · generation ${edge.depth}</p>`);
    });
    line.addEventListener('mouseleave', hideTooltip);

    edgeLayer.appendChild(line);
    edgeElements.push({ edge, element: line });
  });

  model.nodes.forEach((node) => {
    const stroke = colourFor(node.incomingType, node.depth, options.depth, options.colourMode);
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', `tree-node-group interactive${animate && node.depth > 0 ? ' tree-hidden' : ''}`);

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', node.x);
    circle.setAttribute('cy', node.y);
    circle.setAttribute('r', node.depth === 0 ? 7.5 : 4.8);
    circle.setAttribute('stroke', stroke);
    circle.setAttribute('class', 'tree-node-circle');
    if (options.showGlow) circle.setAttribute('filter', 'url(#vizGlow)');
    group.appendChild(circle);

    if (options.showLabels || node.depth === 0) {
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', node.x + 8);
      label.setAttribute('y', node.y - 8);
      label.setAttribute('class', `tree-node-label${animate && node.depth > 0 ? ' tree-hidden' : ''}`);
      label.textContent = String(node.value);
      group.appendChild(label);
    }

    group.addEventListener('mouseenter', () => {
      showTooltip(`<p class="tooltip-title">${node.value}</p><p class="tooltip-meta">${formatRuleLabel(node.incomingType)} · generation ${node.depth}</p>`);
    });
    group.addEventListener('mouseleave', hideTooltip);

    nodeLayer.appendChild(group);
    nodeElements.set(node.id, group);
  });

  statsLine.textContent = `Nodes: ${model.nodes.length.toLocaleString()} · Branches: ${model.edges.length.toLocaleString()} · Max value: ${model.maxValue.toLocaleString()}`;
  statusMessage.textContent = animate ? 'Animating growth…' : 'Rendered.';

  if (!animate) return;

  const rootGroup = nodeElements.get('node-0');
  rootGroup?.classList.remove('tree-hidden');

  const sortedEdges = [...edgeElements].sort((a, b) => a.edge.depth - b.edge.depth || a.edge.childValue - b.edge.childValue);
  sortedEdges.forEach(({ edge, element }, index) => {
    const delay = index * 55;
    animationTimers.push(window.setTimeout(() => {
      element.classList.remove('tree-hidden');
      const childGroup = nodeElements.get(edge.to);
      childGroup?.classList.remove('tree-hidden');
      childGroup?.querySelectorAll('.tree-node-label').forEach((label) => label.classList.remove('tree-hidden'));
    }, delay));
  });

  animationTimers.push(window.setTimeout(() => {
    statusMessage.textContent = 'Animation complete.';
  }, sortedEdges.length * 55 + 180));
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

function scheduleRender() {
  window.clearTimeout(renderDebounce);
  renderDebounce = window.setTimeout(() => renderTree({ animate: false }), 130);
}

['depth', 'angle', 'length', 'decay', 'width'].forEach((key) => {
  controls[key].addEventListener('input', scheduleRender);
});
controls.colourMode.addEventListener('change', () => renderTree({ animate: false }));
controls.showLabels.addEventListener('change', () => renderTree({ animate: false }));
controls.showGlow.addEventListener('change', () => renderTree({ animate: false }));
controls.renderButton.addEventListener('click', () => renderTree({ animate: false }));
controls.animateButton.addEventListener('click', () => renderTree({ animate: true }));
controls.exportButton.addEventListener('click', downloadSvg);
window.addEventListener('resize', scheduleRender);

updateOutputs();
renderTree({ animate: true });

/* The Collatz Laboratory | Circular Representation
 * The outer circumference contains selectable START MARKERS, not duplicate
 * Collatz nodes. Every integer visited has exactly one canonical inner node.
 * Radius is based on steps remaining to 1, using a nonlinear display scale.
 * The 1 -> 4 -> 2 -> 1 cycle is drawn as a clearly labelled central loop.
 */
(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const TAU = Math.PI * 2;
  const svg = document.getElementById('circleSvg');
  const standard = document.getElementById('visualizerShell');
  const circular = document.getElementById('circleWorkspace');
  const cards = Array.from(document.querySelectorAll('[data-visualizer-mode]'));
  const counters = Array.from(document.querySelectorAll('[data-orbit-count]'));
  const focus = document.getElementById('circleFocus');
  const status = document.getElementById('circleStatus');
  const stats = document.getElementById('circleStats');
  const details = document.getElementById('circleDetails');
  const trafficToggle = document.getElementById('circleTraffic');
  const playButton = document.getElementById('circleAnimate');
  const saveButton = document.getElementById('circleSave');
  const clearButton = document.getElementById('circleClear');

  if (!svg || !standard || !circular || cards.length !== 2) return;

  const state = {
    mode: 'standard', count: 25, selected: null, hovered: null,
    model: null, elements: null, timer: null, revealed: null
  };

  const colours = { even: '#7ae7ff', odd: '#ffd479' };
  const point = (radius, angle) => ({
    x: radius * Math.cos(angle), y: radius * Math.sin(angle)
  });
  const fmt = (n) => Number(n).toFixed(2);
  const getRule = (n) => n % 2 === 0 ? 'even' : 'odd';
  const nextValue = (n) => n % 2 === 0 ? n / 2 : 3 * n + 1;
  const edgeKey = (from, to) => String(from) + ':' + String(to);

  function nodeRadius(node, count) {
    if (node.value === 1 || node.value === 2 || node.value === 4) return 12;
    if (count >= 100) return Math.min(6.2, 2.1 + Math.sqrt(node.traffic) * 0.4);
    if (count >= 50) return Math.min(7.8, 2.8 + Math.sqrt(node.traffic) * 0.67);
    return Math.min(9, 3.8 + Math.sqrt(node.traffic) * 0.75);
  }

  function element(tag, attributes, parent, content) {
    const el = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attributes || {})) {
      el.setAttribute(key, String(value));
    }
    if (content !== undefined) el.textContent = String(content);
    if (parent) parent.appendChild(el);
    return el;
  }

  function pathBetween(from, to) {
    const alpha = Math.atan2(from.y, from.x);
    const beta = Math.atan2(to.y, to.x);
    let difference = beta - alpha;
    while (difference > Math.PI) difference -= TAU;
    while (difference < -Math.PI) difference += TAU;
    const radius = (Math.hypot(from.x, from.y) + Math.hypot(to.x, to.y)) / 2;
    const middle = point(radius, alpha + difference / 2);
    return 'M' + fmt(from.x) + ',' + fmt(from.y) +
      ' Q' + fmt(middle.x) + ',' + fmt(middle.y) +
      ' ' + fmt(to.x) + ',' + fmt(to.y);
  }

  function buildOrbitModel(count) {
    const nodes = new Map(), edges = new Map(), orbits = new Map();
    let peak = 1, longest = { starting: 1, steps: 0 };
    for (let start = 1; start <= count; start++) {
      const path = [start];
      while (path[path.length - 1] !== 1) {
        const next = nextValue(path[path.length - 1]);
        if (path.length > 2500 || !Number.isSafeInteger(next)) throw Error('Orbit exceeds safe limit');
        path.push(next);
      }
      orbits.set(start, path);
      if (path.length - 1 > longest.steps) longest = { starting: start, steps: path.length - 1 };
      path.forEach((value, i) => {
        const distance = path.length - i - 1;
        peak = Math.max(peak, value);
        if (!nodes.has(value)) nodes.set(value, {
          value, distance, traffic: 0, firstSeen: start,
          children: [], fixed: false, x: 0, y: 0, radius: 0
        });
        const node = nodes.get(value);
        if (node.distance !== distance) throw Error('Inconsistent distance: ' + value);
        node.traffic++;
        if (i + 1 < path.length) {
          const to = path[i + 1], key = edgeKey(value, to);
          if (!edges.has(key)) edges.set(key, {
            key, from: value, to, type: getRule(value),
            firstSeen: start, traffic: 0
          });
          edges.get(key).traffic++;
        }
      });
    }
    edges.forEach(edge => nodes.get(edge.to).children.push(edge.from));
    nodes.forEach(node => node.children.sort((a,b) =>
      Number(b%2!==0) - Number(a%2!==0) || a-b));
    const tips = [];
    function visit(value) {
      const node = nodes.get(value);
      if (!node.children.length && value !== 1) tips.push(value);
      node.children.forEach(visit);
    }
    visit(1);
    // Root 1 and actual terminal nodes lie around the outer perimeter.
    const ring = [1, ...tips], R = 405;
    ring.forEach((value,i) => {
      const node = nodes.get(value), angle = 2*Math.PI*i/ring.length;
      node.fixed = true; node.angle = angle;
      node.x = R*Math.cos(angle); node.y = R*Math.sin(angle);
    });
    // Exact harmonic embedding of this tree: eliminate unknown interior
    // vertices bottom-up, then back-substitute from the boundary root.
    function eliminate(value) {
      const n = nodes.get(value);
      if (n.fixed) return;
      let denominator = n.children.length+1, bx=0, by=0;
      for (const v of n.children) {
        eliminate(v);
        const ch = nodes.get(v);
        if (ch.fixed) { bx+=ch.x; by+=ch.y; }
        else { denominator-=ch.alpha; bx+=ch.betaX; by+=ch.betaY; }
      }
      if (denominator<=0) throw Error('Invalid radial layout');
      n.alpha = 1/denominator; n.betaX=bx/denominator; n.betaY=by/denominator;
    }
    function place(value) {
      const parent=nodes.get(value);
      for (const v of parent.children) {
        const ch=nodes.get(v);
        if (!ch.fixed) {
          ch.x = ch.alpha*parent.x+ch.betaX;
          ch.y = ch.alpha*parent.y+ch.betaY;
        }
        place(v);
      }
    }
    nodes.get(1).children.forEach(eliminate);
    place(1);
    // Nearest-neighbour sizing avoids overlapping circles in dense chains.
    const list=[...nodes.values()];
    const maxRadius = count<=25?11:count<=50?9.6:count<=100?8.4:count<=250?7:5.7;
    for (let i=0;i<list.length;i++) {
      const n=list[i]; let nearest=Infinity;
      for (let j=0;j<list.length;j++) {
        if (i===j) continue;
        const other=list[j];
        nearest=Math.min(nearest,Math.hypot(n.x-other.x,n.y-other.y));
      }
      n.radius=Math.max(0.05,Math.min(n.value===1?11.5:maxRadius,(nearest-0.28)*0.42));
    }
    return { count, nodes, edges, orbits, longest, peak, tips,
      maxDepth:Math.max(...list.map(n=>n.distance)) };
  }


  const embeddedStyle = [
    '.orbit-guide{fill:none;stroke:#7ae7ff;stroke-opacity:.10;stroke-width:1}',
    '.orbit-guide.outer{stroke-opacity:.29;stroke-width:1.7}',
    '.orbit-entry{fill:none;stroke:#d5e7ff;stroke-opacity:.16;stroke-width:1.15;stroke-dasharray:3 6;transition:opacity .18s}',
    '.orbit-edge{fill:none;stroke-linecap:round;stroke-opacity:.52;transition:opacity .18s,stroke-width .18s}',
    '.orbit-node{fill:#101827;stroke:#a9b9df;stroke-width:1.3;transition:opacity .18s}',
    '.orbit-node.is-core{fill:#1a1830;stroke:#f0d5a0;stroke-width:2.2}',
    '.orbit-inner-label{fill:#e7effe;paint-order:stroke;stroke:#07101e;stroke-width:3.5;stroke-linejoin:round;font:600 13px Inter,system-ui,sans-serif;text-anchor:middle;dominant-baseline:central;pointer-events:none}',
    '.orbit-inner-label.core{font-size:15px;fill:#fff2d4}',
    '.orbit-start{cursor:pointer;outline:none;transition:opacity .18s}',
    '.orbit-start-disc{fill:#0d1926;stroke:#85cdda;stroke-width:1.5;transition:fill .18s,stroke .18s}',
    '.orbit-start-label{fill:#e5f5ff;font:600 13px Inter,system-ui,sans-serif;text-anchor:middle;dominant-baseline:central;pointer-events:none}',
    '.orbit-start:hover .orbit-start-disc,.orbit-start:focus-visible .orbit-start-disc{stroke:#ffd479;fill:#372e26;stroke-width:2.5}',
    '.orbit-start.is-selected .orbit-start-disc{fill:#453323;stroke:#ffd479;stroke-width:3}',
    '.orbit-start.is-selected .orbit-start-label{fill:#ffe4aa}',
    '.orbit-faint{opacity:.055!important}',
    '.orbit-entry.orbit-faint{opacity:.018!important}',
    '.orbit-node.orbit-faint{opacity:.11!important}',
    '.orbit-start.orbit-faint{opacity:.32!important}',
    '.orbit-strong{opacity:1!important;stroke-opacity:1!important}',
    '.orbit-hidden{opacity:0!important;pointer-events:none}',
    '.orbit-center-name{font:700 13px Inter,system-ui,sans-serif;fill:#e9b979;text-anchor:middle;letter-spacing:2px}',
    '.orbit-cycle-arrow{fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;opacity:.85}'
  ].join('\n');

  function createModelSvg() {
    const model = state.model;
    svg.replaceChildren();
    svg.setAttribute('viewBox', '-540 -540 1080 1080');
    const title = element('title', { id: 'circleSvgTitle' }, svg,
      'Circular representation of Collatz orbits starting at 1 through ' + model.count);
    element('desc', { id: 'circleSvgDescription' }, svg,
      'Outer numbers are selectable start markers. Each visited integer has one shared inner node. Cyan lines indicate even-number Collatz steps, gold lines indicate odd steps, and the 1-4-2-1 cycle appears in the center.');
    svg.setAttribute('aria-labelledby', 'circleSvgTitle circleSvgDescription');
    element('style', { type: 'text/css' }, svg, embeddedStyle);
    const defs = element('defs', {}, svg);
    for (const type of ['even', 'odd']) {
      const marker = element('marker', {
        id: 'circle-' + type + '-arrow', viewBox: '0 0 10 10',
        refX: 9, refY: 5, markerWidth: 5.6, markerHeight: 5.6,
        markerUnits: 'userSpaceOnUse', orient: 'auto'
      }, defs);
      element('path', { d: 'M0 0L10 5L0 10Z', fill: colours[type] }, marker);
    }
    const guides = element('g', { 'aria-hidden': 'true' }, svg);
    for (const radius of [85, 180, 275, 360]) {
      element('circle', { cx: 0, cy: 0, r: radius, class: 'orbit-guide' }, guides);
    }
    element('circle', { cx: 0, cy: 0, r: 429, class: 'orbit-guide outer' }, guides);
    element('text', { x: 0, y: -494, class: 'orbit-center-name' },
      guides, 'STARTING VALUES 1–' + model.count);
    element('text', { x: 0, y: 4, class: 'orbit-center-name' },
      guides, 'CYCLE');

    const entryGroup = element('g', { 'aria-label': 'Starting markers' }, svg);
    const edgeGroup = element('g', { 'aria-label': 'Shared Collatz paths' }, svg);
    const nodeGroup = element('g', { 'aria-label': 'Visited integers' }, svg);
    const startGroup = element('g', { 'aria-label': 'Selectable starting integers' }, svg);
    const entries = new Map(), edgeEls = new Map(), nodeEls = new Map(), starts = new Map();

    for (let start = 1; start <= model.count; start++) {
      const angle = -Math.PI / 2 + TAU * (start - 1) / model.count;
      const a = point(423, angle), b = model.nodes.get(start);
      const entry = element('path', {
        d: pathBetween(a, b), class: 'orbit-entry',
        'data-start': start
      }, entryGroup);
      entries.set(start, entry);
    }

    // Canonical shared edges, with 4->2 and 2->1 curving around the core.
    for (const edge of model.edges.values()) {
      const from = model.nodes.get(edge.from);
      const to = model.nodes.get(edge.to);
      let d;
      if (edge.from === 4 && edge.to === 2) {
        d = 'M-32,-21 Q0,-51 32,-21';
      } else if (edge.from === 2 && edge.to === 1) {
        d = 'M32,-21 Q48,18 0,33';
      } else {
        d = pathBetween(from, to);
      }
      const thick = trafficToggle.checked
        ? 1.15 + Math.min(4.4, Math.log2(edge.traffic + 1) * 0.85) : 1.75;
      const path = element('path', {
        d, class: 'orbit-edge', stroke: colours[edge.type],
        'stroke-width': fmt(thick), 'data-first-seen': edge.firstSeen
      }, edgeGroup);
      element('title', {}, path, edge.from + ' → ' + edge.to +
        ' · ' + edge.type + ' rule · used by ' + edge.traffic + ' starting orbit(s)');
      edgeEls.set(edge.key, path);
    }

    // The forward orbit doesn't terminate at 1: 1 -> 4 closes the cycle.
    const returnArc = element('path', {
      d: 'M0,33 Q-50,17 -32,-21',
      class: 'orbit-cycle-arrow', stroke: colours.odd,
      'marker-end': 'url(#circle-odd-arrow)'
    }, edgeGroup);
    element('title', {}, returnArc, '1 → 4 · the odd step that closes the 4–2–1 cycle');

    for (const node of model.nodes.values()) {
      const core = node.value === 1 || node.value === 2 || node.value === 4;
      const radius = nodeRadius(node, model.count);
      const g = element('g', { 'data-first-seen': node.firstSeen }, nodeGroup);
      element('circle', {
        cx: fmt(node.x), cy: fmt(node.y), r: fmt(radius),
        class: 'orbit-node' + (core ? ' is-core' : '')
      }, g);
      if (core || (model.count <= 25 && node.value <= 16 && node.traffic >= 2)) {
        element('text', {
          x: fmt(node.x), y: fmt(node.y + (core ? 1 : -radius - 8)),
          class: 'orbit-inner-label' + (core ? ' core' : '')
        }, g, node.value);
      }
      element('title', {}, g,
        String(node.value) + ' · ' + node.distance + ' steps to 1 · visited by ' +
        node.traffic + ' of ' + model.count + ' starting orbits');
      nodeEls.set(node.value, g);
    }

    for (let start = 1; start <= model.count; start++) {
      const angle = -Math.PI / 2 + TAU * (start - 1) / model.count;
      const p = point(429, angle);
      const g = element('g', {
        class: 'orbit-start', tabindex: '0', role: 'button',
        'aria-label': 'Highlight Collatz orbit starting at ' + start,
        'aria-pressed': 'false', 'data-start': start
      }, startGroup);
      element('circle', {
        cx: fmt(p.x), cy: fmt(p.y), r: model.count >= 100 ? 10 : 12,
        class: 'orbit-start-disc'
      }, g);
      const label = element('text', {
        x: fmt(p.x), y: fmt(p.y + 0.6), class: 'orbit-start-label'
      }, g, start);
      label.setAttribute('font-size', model.count >= 100 ? '10.8' :
        model.count >= 50 ? '11.8' : '13');
      element('title', {}, g, 'Click to trace the orbit of ' + start);
      g.addEventListener('mouseenter', () => {
        state.hovered = start;
        updateEmphasis();
      });
      g.addEventListener('mouseleave', () => {
        state.hovered = null;
        updateEmphasis();
      });
      g.addEventListener('focus', () => {
        state.hovered = start;
        updateEmphasis();
      });
      g.addEventListener('blur', () => {
        state.hovered = null;
        updateEmphasis();
      });
      g.addEventListener('click', () => selectStart(start));
      g.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectStart(start);
        }
      });
      starts.set(start, g);
    }
    state.elements = { entries, edges: edgeEls, nodes: nodeEls, starts, returnArc };
    updateEmphasis();
  }

  function detailFor(start) {
    if (start === null) {
      return '<strong>Follow a number.</strong> Click an outer starting value, or choose one from the menu, to trace its orbit to 1. Each inner number appears only once, even when many orbits pass through it.';
    }
    const path = state.model.orbits.get(start);
    const peak = Math.max(...path);
    const shown = path.length <= 21
      ? path.join(' → ')
      : path.slice(0, 12).join(' → ') + ' → … → ' + path.slice(-7).join(' → ');
    return '<strong>' + start + '</strong> · ' + (path.length - 1) +
      ' steps to 1 · peak ' + peak.toLocaleString() +
      '<span class="circle-path-sequence">' + shown + '</span>';
  }

  function updateEmphasis() {
    if (!state.elements || !state.model) return;
    const active = state.hovered === null ? state.selected : state.hovered;
    const animating = state.revealed !== null;
    const path = active === null ? null : state.model.orbits.get(active);
    const visited = path ? new Set(path) : null;
    const highlightedEdges = new Set();
    if (path) {
      for (let i = 0; i < path.length - 1; i++) {
        highlightedEdges.add(edgeKey(path[i], path[i + 1]));
      }
    }

    for (const [key, item] of state.elements.edges) {
      const edge = state.model.edges.get(key);
      const hidden = animating && edge.firstSeen > state.revealed;
      const dim = active !== null && !highlightedEdges.has(key);
      item.classList.toggle('orbit-hidden', hidden);
      item.classList.toggle('orbit-faint', dim && !hidden);
      item.classList.toggle('orbit-strong', !hidden && active !== null && !dim);
      if (active !== null && !dim && !hidden) {
        item.setAttribute('marker-end', 'url(#circle-' + edge.type + '-arrow)');
      } else {
        item.removeAttribute('marker-end');
      }
    }
    for (const [value, item] of state.elements.nodes) {
      const node = state.model.nodes.get(value);
      const hidden = animating && node.firstSeen > state.revealed;
      item.classList.toggle('orbit-hidden', hidden);
      item.classList.toggle('orbit-faint', active !== null && !visited.has(value));
    }
    for (const [start, item] of state.elements.entries) {
      const hidden = animating && start > state.revealed;
      item.classList.toggle('orbit-hidden', hidden);
      item.classList.toggle('orbit-faint', active !== null && start !== active);
      item.classList.toggle('orbit-strong', active === start && !hidden);
    }
    for (const [start, item] of state.elements.starts) {
      item.classList.toggle('orbit-hidden', animating && start > state.revealed);
      item.classList.toggle('orbit-faint', active !== null && start !== active);
      item.classList.toggle('is-selected', active === start);
      item.setAttribute('aria-pressed', String(state.selected === start));
    }
    state.elements.returnArc.classList.toggle('orbit-faint', active !== null && active !== 1);
    details.innerHTML = detailFor(active);
    status.textContent = animating
      ? 'Revealing ' + state.revealed + ' of ' + state.count + ' starting orbits'
      : active === null ? 'All starting orbits' : 'Orbit ' + active + ' selected';
  }

  function stopAnimation() {
    if (state.timer !== null) {
      window.clearInterval(state.timer);
      state.timer = null;
    }
    state.revealed = null;
    playButton.textContent = 'Animate orbits';
    if (state.elements) updateEmphasis();
  }

  function selectStart(start) {
    stopAnimation();
    state.selected = state.selected === start ? null : start;
    state.hovered = null;
    focus.value = state.selected === null ? '' : String(state.selected);
    updateEmphasis();
  }

  function render(count) {
    stopAnimation();
    state.count = count;
    state.model = buildOrbitModel(count);
    state.selected = null;
    state.hovered = null;
    focus.replaceChildren(new Option('All starting values', ''));
    for (let n = 1; n <= count; n++) {
      focus.add(new Option('Starting at ' + n, String(n)));
    }
    for (const button of counters) {
      const selected = Number(button.dataset.orbitCount) === count;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    }
    stats.textContent = count + ' starting integers · ' +
      state.model.nodes.size + ' distinct values · ' +
      state.model.longest.steps + ' maximum steps (' +
      state.model.longest.starting + ') · peak ' +
      state.model.peak.toLocaleString();
    createModelSvg();
  }

  function startAnimation() {
    if (state.timer !== null) {
      stopAnimation();
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      status.textContent = 'Animation is disabled by your reduced-motion preference.';
      return;
    }
    state.selected = null;
    state.hovered = null;
    focus.value = '';
    state.revealed = 0;
    updateEmphasis();
    playButton.textContent = 'Stop animation';
    const interval = Math.max(70, Math.round(5400 / state.count));
    state.timer = window.setInterval(() => {
      if (state.revealed === null) return;
      state.revealed++;
      updateEmphasis();
      if (state.revealed >= state.count) {
        stopAnimation();
        status.textContent = 'All ' + state.count + ' orbits revealed.';
      }
    }, interval);
  }

  function saveSvg() {
    // Internal SVG styles ensure a useful standalone downloaded file.
    const copy = svg.cloneNode(true);
    copy.setAttribute('xmlns', NS);
    const text = new XMLSerializer().serializeToString(copy);
    const blob = new Blob([text], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'collatz-orbit-circle-' + state.count + '.svg';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    status.textContent = 'Circular SVG saved.';
  }

  function changeMode(next) {
    if (next === state.mode) return;
    stopAnimation();
    state.mode = next;
    standard.hidden = next !== 'standard';
    circular.hidden = next !== 'circular';
    for (const card of cards) {
      const on = card.dataset.visualizerMode === next;
      card.classList.toggle('is-active', on);
      card.setAttribute('aria-pressed', String(on));
    }
    if (next === 'circular' && !state.model) render(state.count);
    // Standard view remains mounted. Refit when shown after being hidden.
    if (next === 'standard' && typeof fitCamera === 'function') {
      window.requestAnimationFrame(() => fitCamera());
    }
    try {
      window.history.replaceState(
        null, '', window.location.pathname + window.location.search +
        (next === 'circular' ? '#circular' : '')
      );
    } catch (_) { /* Shared environments may disallow history updates. */ }
  }

  for (const card of cards) {
    card.addEventListener('click', () => changeMode(card.dataset.visualizerMode));
  }
  for (const button of counters) {
    button.addEventListener('click', () => render(Number(button.dataset.orbitCount)));
  }
  focus.addEventListener('change', () => {
    stopAnimation();
    state.selected = focus.value ? Number(focus.value) : null;
    state.hovered = null;
    updateEmphasis();
  });
  trafficToggle.addEventListener('change', () => {
    createModelSvg();
  });
  playButton.addEventListener('click', startAnimation);
  saveButton.addEventListener('click', saveSvg);
  clearButton.addEventListener('click', () => {
    stopAnimation();
    state.selected = null;
    state.hovered = null;
    focus.value = '';
    updateEmphasis();
  });

  // Load Standard Visualization by default, or Circular Representation from
  // a link ending in #circular.
  if (window.location.hash === '#circular') changeMode('circular');

  // Expose read-only diagnostics to simplify later mathematical audits.
  window.collatzCircleDiagnostics = function () {
    const model = state.model || buildOrbitModel(state.count);
    return {
      count: model.count,
      values: model.nodes.size,
      edges: model.edges.size,
      stepsTo1: model.maxDepth,
      peak: model.peak,
      orbit: (start) => (model.orbits.get(start) || []).slice()
    };
  };
})();
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
    mode: 'standard', count: 250, selected: null, hovered: null,
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


  function radialColor(depth) {
    const gradient = [
      [0,[25,24,35]], [2,[110,85,166]], [8,[43,132,185]],
      [22,[76,179,152]], [42,[192,224,119]], [58,[255,223,114]],
      [77,[255,159,79]], [95,[224,77,68]], [119,[182,22,77]], [150,[132,28,104]]
    ];
    for (let i = 1; i < gradient.length; i++) {
      if (depth <= gradient[i][0]) {
        const left = gradient[i-1], right = gradient[i];
        const t = (depth-left[0])/(right[0]-left[0]);
        const values = left[1].map((c,j) => Math.round(c+(right[1][j]-c)*t));
        return 'rgb(' + values.join(',') + ')';
      }
    }
    return 'rgb(132,28,104)';
  }

  const embeddedStyle = [
    '.radial-background{fill:#fcfdfa}',
    '.radial-guide{fill:none;stroke:#b6bfc5;stroke-opacity:.5;stroke-width:1.15}',
    '.radial-caption{font:750 14px Inter,system-ui,sans-serif;letter-spacing:2.1px;fill:#788592;text-anchor:middle}',
    '.orbit-edge{fill:none;stroke:#9098a0;stroke-opacity:.79;stroke-linecap:round;transition:opacity .14s,stroke-width .14s}',
    '.orbit-node-group{cursor:pointer;outline:none;transition:opacity .15s}',
    '.orbit-node-group circle{stroke:#2c3441;stroke-opacity:.33;stroke-width:.78}',
    '.orbit-node-group:hover circle,.orbit-node-group:focus-visible circle{stroke:#1b2335;stroke-width:2.5}',
    '.orbit-node-group.is-selected circle{stroke:#1b2335;stroke-width:2.7}',
    '.radial-node-label{pointer-events:none;text-anchor:middle;dominant-baseline:central;fill:#1d2635;font:600 9px Inter,system-ui,sans-serif;paint-order:stroke;stroke:#ffffff90;stroke-width:.65}',
    '.radial-node-label.light{fill:#fff;stroke:#14162590}',
    '.orbit-start{cursor:pointer;outline:none;transition:opacity .15s}',
    '.orbit-start rect{fill:#fff;stroke:#adbcc8;stroke-width:1.0}',
    '.orbit-start text{fill:#34485b;font:650 10px Inter,system-ui,sans-serif;text-anchor:middle;dominant-baseline:central;pointer-events:none}',
    '.orbit-start:hover rect,.orbit-start:focus-visible rect,.orbit-start.is-selected rect{fill:#fff0de;stroke:#b67a41;stroke-width:2}',
    '.orbit-faint{opacity:.11!important}',
    '.orbit-node-group.orbit-faint{opacity:.18!important}',
    '.orbit-start.orbit-faint{opacity:.27!important}',
    '.orbit-strong{opacity:1!important;stroke-opacity:1!important;stroke-width:3!important}',
    '.orbit-hidden{opacity:0!important;pointer-events:none}',
    '.orbit-cycle{fill:none;stroke:#b98a4b;stroke-width:2;stroke-dasharray:4 6;stroke-opacity:.7}'
  ].join('\n');

  function createModelSvg() {
    const model = state.model;
    svg.replaceChildren();
    svg.setAttribute('viewBox', '-500 -500 1000 1000');
    svg.setAttribute('role','img');
    svg.setAttribute('aria-labelledby','radialDiagramTitle radialDiagramDesc');
    element('title',{id:'radialDiagramTitle'},svg,
      'Circular tree of the forward Collatz orbits for the first '+model.count+' positive integers');
    element('desc',{id:'radialDiagramDesc'},svg,
      'The value 1 is at the right edge of the circle. Unique Collatz paths spread into a branching canopy. Each node is one real integer, and the outer white labels identify terminal values.');
    element('style',{},svg,embeddedStyle);
    const defs=element('defs',{},svg);
    for(const type of ['even','odd']){
      const marker=element('marker',{
        id:'circle-'+type+'-arrow',viewBox:'0 0 10 10',refX:9,refY:5,
        markerWidth:5.5,markerHeight:5.5,markerUnits:'userSpaceOnUse',
        orient:'auto'
      },defs);
      element('path',{d:'M0 0 L10 5 L0 10Z',
        fill:type==='even'?'#279bd1':'#d99b3c'},marker);
    }
    element('rect',{x:-500,y:-500,width:1000,height:1000,class:'radial-background'},svg);
    const backdrop=element('g',{'aria-hidden':'true'},svg);
    element('circle',{cx:0,cy:0,r:405,class:'radial-guide'},backdrop);
    element('text',{x:0,y:-470,class:'radial-caption'},backdrop,
      'THE COLLATZ TREE · '+model.count+' STARTING INTEGERS');

    const edgeLayer=element('g',{'aria-label':'Forward Collatz connections'},svg);
    const arcLayer=element('g',{'aria-label':'The 1 to 4 return cycle'},svg);
    const nodeLayer=element('g',{'aria-label':'Unique integer nodes'},svg);
    const tipLayer=element('g',{'aria-label':'Terminal values around the circumference'},svg);
    const edges=new Map(),nodes=new Map(),starts=new Map(),entries=new Map();

    // Draw every mathematical connection exactly once. Grey, straight
    // filaments match the reference; selected orbits use cyan and gold.
    for(const edge of model.edges.values()){
      const from=model.nodes.get(edge.from),to=model.nodes.get(edge.to);
      const strokeWidth=trafficToggle.checked
        ? 0.95+Math.min(1.9,Math.log2(edge.traffic+1)*0.37)
        : 1.12;
      const line=element('path',{
        class:'orbit-edge',
        d:'M'+fmt(from.x)+','+fmt(from.y)+' L'+fmt(to.x)+','+fmt(to.y),
        'stroke-width':fmt(strokeWidth)
      },edgeLayer);
      element('title',{},line,edge.from+' → '+edge.to+
        ' · '+edge.type+' rule · shared by '+edge.traffic+' starting orbit(s)');
      edges.set(edge.key,line);
    }

    const one=model.nodes.get(1), four=model.nodes.get(4);
    // The additional odd step from 1 to 4 closes the period-three cycle,
    // but is not a tree edge. Draw it separately as a dashed return arc.
    const returnArc=element('path',{
      class:'orbit-cycle',
      d:'M'+fmt(one.x+4)+','+fmt(one.y-11)+
        ' Q'+fmt(465)+','+fmt(-74)+
        ' '+fmt(four.x+5)+','+fmt(four.y-9),
      'marker-end':'url(#circle-odd-arrow)'
    },arcLayer);
    element('title',{},returnArc,'1 → 4 closes the 1 → 4 → 2 → 1 cycle');

    for(const node of model.nodes.values()){
      const group=element('g',{
        class:'orbit-node-group',
        role:'button',tabindex:0,
        'data-value':node.value,
        'aria-label':'Highlight forward Collatz orbit starting at '+node.value
      },nodeLayer);
      const core=node.value===1;
      const radius=core?11.4:node.radius;
      element('circle',{
        cx:fmt(node.x),cy:fmt(node.y),r:fmt(radius),
        fill:radialColor(node.distance)
      },group);
      const showLabel=core || (model.count<=25 && radius>=4.4)
        || (node.value<=100 && radius>=6.4 && model.count<=100);
      if(showLabel){
        element('text',{
          x:fmt(node.x),y:fmt(node.y+.5),
          class:'radial-node-label'+(core||node.distance<8||node.distance>105?' light':''),
          'font-size':core?10:(radius<7?7:9)
        },group,node.value);
      }
      element('title',{},group,node.value+' · '+node.distance+
        ' steps to 1 · visited by '+node.traffic+' starting orbit(s)');
      const onSelect=()=>selectStart(node.value);
      group.addEventListener('click',onSelect);
      group.addEventListener('keydown',event=>{
        if(event.key==='Enter'||event.key===' '){event.preventDefault();onSelect();}
      });
      nodes.set(node.value,group);
    }

    // Only actual terminal nodes sit on the outer boundary. A starting
    // number visited by another start remains a single INNER node.
    for(const value of model.tips){
      const node=model.nodes.get(value);
      const angle=node.angle;
      const radius=431;
      const p=point(radius,angle);
      const label=String(value),width=14+6.2*label.length;
      const group=element('g',{
        class:'orbit-start',role:'button',tabindex:0,
        'aria-label':'Highlight Collatz orbit beginning at '+value,
        'aria-pressed':'false'
      },tipLayer);
      element('rect',{
        x:fmt(p.x-width/2),y:fmt(p.y-9),width:fmt(width),height:18,rx:9
      },group);
      element('text',{x:fmt(p.x),y:fmt(p.y+0.5)},group,value);
      group.addEventListener('click',()=>selectStart(value));
      group.addEventListener('keydown',event=>{
        if(event.key==='Enter'||event.key===' '){
          event.preventDefault();selectStart(value);
        }
      });
      element('title',{},group,'Terminal starting value '+value);
      starts.set(value,group);
    }
    state.elements={edges,nodes,starts,entries,returnArc};
    updateEmphasis();
  }

  function orbitOf(value) {
    if (state.model.orbits.has(value)) return state.model.orbits.get(value);
    const p=[value];
    while (p[p.length-1]!==1 && p.length<2500) p.push(nextValue(p[p.length-1]));
    return p;
  }

  function detailFor(start) {
    if (start === null) {
      return '<strong>Follow a number.</strong> Click an outer starting value, or choose one from the menu, to trace its orbit to 1. Each inner number appears only once, even when many orbits pass through it.';
    }
    const path = orbitOf(start);
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
    const path = active === null ? null : orbitOf(active);
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
        item.setAttribute('stroke', edge.type === 'even' ? '#279bd1' : '#d99b3c');
        item.setAttribute('marker-end', 'url(#circle-' + edge.type + '-arrow)');
      } else {
        item.removeAttribute('stroke');
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
    focus.value = state.selected !== null && state.selected <= state.count ? String(state.selected) : '';
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
      state.model.tips.length + ' terminal branches · ' +
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
      tips: model.tips.slice(),
      points: [...model.nodes.values()].map(n=>({value:n.value,x:n.x,y:n.y,r:n.radius})),
      connections: [...model.edges.values()].map(e=>({from:e.from,to:e.to})),
      orbit: (start) => (model.orbits.get(start) || []).slice()
    };
  };
})();
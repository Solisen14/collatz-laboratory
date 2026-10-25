/* Finite Collatz trajectories, through the first visit to 1. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const slider = $('trajectory-start'), chart = $('trajectory-chart');
  if (!slider || !chart) return;
  const panel = $('collatz-trajectory'), region = chart.parentElement;
  const output = $('trajectory-start-value'), indicator = $('trajectory-plot-indicator');
  const detail = $('trajectory-point-inspector'), help = $('trajectory-scale-help');
  const statStart = $('trajectory-stat-start'), statSteps = $('trajectory-stat-steps');
  const statStepsLabel = $('trajectory-stat-steps-label');
  const statPeak = $('trajectory-stat-peak'), statPeakStep = $('trajectory-stat-peak-step');
  const replay = $('trajectory-replay');
  const presets = [...panel.querySelectorAll('[data-trajectory-start]')];
  const radios = [...panel.querySelectorAll('input[name="trajectory-scale"]')];
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ns = 'http://www.w3.org/2000/svg';
  const fmt = n => n.toLocaleString('en-CA');
  let values = [], peaks = [], peakSteps = [], start = 27, scale = 'linear';
  let progress = 0, raf = 0, resizeFrame = 0, hovered = null;
  let visible = !('IntersectionObserver' in window), paint = () => {};

  function svg(tag, attrs = {}, parent = chart, text) {
    const el = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, String(value));
    if (text !== undefined) el.textContent = text;
    parent.appendChild(el);
    return el;
  }
  function compute(n) {
    const path = [n];
    for (let i = 0; n !== 1 && i < 1000; i++) {
      n = n % 2 === 0 ? n / 2 : 3 * n + 1;
      if (!Number.isSafeInteger(n) || n < 1) throw Error('Collatz calculation exceeded safe integers');
      path.push(n);
    }
    if (n !== 1) throw Error('The finite trace did not reach 1 within the safeguard');
    return path;
  }
  function niceStep(amount) {
    const power = 10 ** Math.floor(Math.log10(Math.max(amount, .001)));
    const norm = amount / power;
    return (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * power;
  }
  function currentStep() { return Math.floor(progress * (values.length - 1)); }
  function inspectText(i) {
    detail.textContent = `Step ${i} · value ${fmt(values[i])}` +
      (i > 0 ? ` · ${values[i - 1] % 2 === 0 ? 'n ÷ 2' : '3n + 1'}` : ' · starting value');
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }
  function draw() {
    const total = values.length - 1, step = currentStep(), complete = progress === 1;
    paint(step, complete);
    statSteps.textContent = fmt(step);
    statStepsLabel.textContent = complete ? 'STEPS TO 1' : 'STEPS TAKEN';
    statPeak.textContent = fmt(peaks[step]);
    statPeakStep.textContent = peakSteps[step];
    indicator.textContent = complete ? `${total} STEPS TO FIRST 1` :
      visible && !document.hidden ? `TRACING · STEP ${step} / ${total}` : 'READY WHEN THE GRAPH IS IN VIEW';
    panel.dataset.traceState = complete ? 'complete' : visible && !document.hidden ? 'playing' : 'waiting';
    panel.dataset.step = step;
    chart.setAttribute('aria-label', `Collatz trajectory from ${start}: ` +
      (complete ? `${total} steps to the first 1, highest value ${fmt(peaks[step])}` : `traced through step ${step}`));
    if (hovered === null) inspectText(step);
  }
  function resume() {
    stop();
    if (motion.matches || values.length === 1) {
      progress = 1; draw(); return;
    }
    draw();
    if (!visible || document.hidden || progress === 1) return;
    const from = progress, duration = Math.min(4800, Math.max(1800, values.length * 34));
    let began;
    function frame(time) {
      if (began === undefined) began = time;
      progress = Math.min(1, from + (time - began) / duration);
      draw();
      raf = progress < 1 ? requestAnimationFrame(frame) : 0;
    }
    raf = requestAnimationFrame(frame);
  }
  function plot() {
    stop();
    chart.replaceChildren();
    const W = Math.max(250, chart.clientWidth || 800), H = Math.max(180, chart.clientHeight || 280);
    const box = {left: 65, right: W - 18, top: 28, bottom: H - 39};
    const width = box.right - box.left, height = box.bottom - box.top;
    const steps = Math.max(1, values.length - 1), peak = Math.max(...values), log = scale === 'log';
    const unit = Math.max(1, niceStep(peak * 1.04 / 6));
    const top = Math.max(2, Math.ceil(peak * 1.04 / unit) * unit);
    const logTop = Math.max(1, Math.log2(peak) * 1.08);
    const x = i => box.left + i / steps * width;
    const y = n => box.bottom - (log ? Math.log2(n) / logTop : n / top) * height;
    chart.setAttribute('viewBox', `0 0 ${W} ${H}`);
    chart.dataset.scale = scale;
    svg('title', {id: 'trajectory-chart-title'}, chart, `Collatz trajectory from ${start} to its first 1`);
    svg('desc', {id: 'trajectory-chart-desc'}, chart,
      'Iteration on the horizontal axis. ' + (log ? 'Base-two logarithmic' : 'Linear') +
      ' value on the vertical axis. Gold segments increase; cyan segments decrease. The picture stops at the first 1; the orbit continues afterward.');
    svg('rect', {x: box.left, y: box.top, width, height, rx: 8, fill: '#071929', stroke: '#34516c'});
    const ticks = [];
    if (log) {
      const max = Math.floor(logTop), stride = Math.max(1, Math.ceil(max / (H < 260 ? 4 : 6)));
      for (let e = 0; e <= max; e += stride) ticks.push(2 ** e);
    } else for (let v = 0; v <= top + unit * .01; v += unit) ticks.push(v);
    for (const value of ticks) {
      const py = y(value);
      svg('line', {x1: box.left, x2: box.right, y1: py, y2: py, class: 'trajectory-gridline'});
      svg('text', {x: box.left - 9, y: py + 4, 'text-anchor': 'end', class: 'trajectory-axis-text', 'data-axis': 'y'}, chart, fmt(value));
    }
    const xStep = Math.max(1, Math.ceil(niceStep(steps / (W < 450 ? 4 : 8))));
    for (let i = 0; i <= steps; i += xStep) {
      const px = x(i);
      svg('line', {x1: px, x2: px, y1: box.top, y2: box.bottom, class: 'trajectory-gridline'});
      svg('text', {x: px, y: box.bottom + 19, 'text-anchor': 'middle', class: 'trajectory-axis-text', 'data-axis': 'x'}, chart, i);
    }
    svg('text', {x: (box.left + box.right) / 2, y: H - 5, 'text-anchor': 'middle', class: 'trajectory-axis-name'}, chart, 'Iterations');
    svg('text', {x: 14, y: (box.top + box.bottom) / 2, transform: `rotate(-90 14 ${(box.top + box.bottom) / 2})`, 'text-anchor': 'middle', class: 'trajectory-axis-name'}, chart, log ? 'Value (log₂)' : 'Value');
    const lines = values.slice(1).map((n, i) => svg('path', {
      d: `M ${x(i)} ${y(values[i])} L ${x(i + 1)} ${y(n)}`,
      class: 'trajectory-line ' + (values[i] % 2 ? 'trajectory-line-up' : 'trajectory-line-down')
    }));
    const points = values.length < 50 ? values.map((n, i) => svg('circle', {
      cx: x(i), cy: y(n), r: 2.7, class: 'trajectory-point'
    })) : [];
    const peakIndex = values.indexOf(peak), peakX = x(peakIndex), peakY = y(peak);
    const peakGroup = svg('g', {class: 'trajectory-peak'});
    svg('circle', {cx: peakX, cy: peakY, r: 5.5, class: 'trajectory-peak-point'}, peakGroup);
    const anchor = peakX > box.right - 65 ? 'end' : peakX < box.left + 65 ? 'start' : 'middle';
    svg('text', {x: peakX + (anchor === 'start' ? 7 : anchor === 'end' ? -7 : 0), y: Math.max(15, peakY - 12), 'text-anchor': anchor, class: 'trajectory-annotation'}, peakGroup, `PEAK ${fmt(peak)}`);
    const end = svg('g');
    svg('circle', {cx: x(values.length - 1), cy: y(1), r: 5.5, class: 'trajectory-finish-point'}, end);
    if (values.length > 1) svg('text', {x: box.right - 10, y: y(1) - 10, 'text-anchor': 'end', class: 'trajectory-end-label'}, end, '1');
    const cursor = svg('g');
    const cursorLine = svg('line', {y1: box.top, y2: box.bottom, class: 'trajectory-hover-line'}, cursor);
    const cursorDot = svg('circle', {r: 5, class: 'trajectory-hover-dot'}, cursor);
    function mark(i) {
      cursor.setAttribute('visibility', 'visible');
      cursorLine.setAttribute('x1', x(i)); cursorLine.setAttribute('x2', x(i));
      cursorDot.setAttribute('cx', x(i)); cursorDot.setAttribute('cy', y(values[i]));
    }
    paint = (step, complete) => {
      lines.forEach((line, i) => line.setAttribute('visibility', i < step ? 'visible' : 'hidden'));
      points.forEach((point, i) => point.setAttribute('visibility', i <= step ? 'visible' : 'hidden'));
      peakGroup.setAttribute('visibility', step >= peakIndex ? 'visible' : 'hidden');
      end.setAttribute('visibility', complete ? 'visible' : 'hidden');
      if (hovered !== null) mark(Math.min(hovered, step));
      else if (!complete) mark(step);
      else cursor.setAttribute('visibility', 'hidden');
    };
    const hit = svg('rect', {x: box.left, y: box.top, width, height, class: 'trajectory-hit-area', 'aria-hidden': 'true'});
    function inspect(event) {
      const rect = chart.getBoundingClientRect();
      const localX = (event.clientX - rect.left) * W / rect.width;
      hovered = Math.max(0, Math.min(currentStep(), Math.round((localX - box.left) / width * steps)));
      mark(hovered); inspectText(hovered);
    }
    hit.addEventListener('pointermove', inspect);
    hit.addEventListener('pointerdown', inspect);
    hit.addEventListener('pointerleave', () => {hovered = null; draw();});
    region.onkeydown = event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      hovered = event.key === 'Home' ? 0 : event.key === 'End' ? currentStep() :
        Math.max(0, Math.min(currentStep(), (hovered ?? currentStep()) + (event.key === 'ArrowLeft' ? -1 : 1)));
      mark(hovered); inspectText(hovered);
    };
    draw();
  }
  function update(reset = true) {
    stop();
    start = Math.max(1, Math.min(100, Number(slider.value)));
    values = compute(start);
    let highest = 0, at = 0;
    peaks = []; peakSteps = [];
    values.forEach((n, i) => {
      if (n > highest) {highest = n; at = i;}
      peaks.push(highest); peakSteps.push(at);
    });
    output.textContent = start; statStart.textContent = start;
    if (reset) progress = 0;
    hovered = null;
    presets.forEach(button => {
      const selected = Number(button.dataset.trajectoryStart) === start;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    scale = radios.find(radio => radio.checked)?.value === 'log' ? 'log' : 'linear';
    help.textContent = scale === 'log' ? 'Log₂: each doubling takes the same vertical distance.' :
      'Linear: equal vertical distances show equal changes in value.';
    plot(); resume();
  }
  slider.addEventListener('input', () => update());
  presets.forEach(button => button.addEventListener('click', () => {slider.value = button.dataset.trajectoryStart; update();}));
  radios.forEach(radio => radio.addEventListener('change', () => update(false)));
  replay.addEventListener('click', () => {progress = 0; hovered = null; resume();});
  motion.addEventListener('change', resume);
  document.addEventListener('visibilitychange', resume);
  update();
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting && entries[0].intersectionRatio >= .6;
      resume();
    }, {threshold: [0, .6]});
    observer.observe(chart);
  }
  if ('ResizeObserver' in window) {
    let previous = `${chart.clientWidth}:${chart.clientHeight}`;
    const observer = new ResizeObserver(() => {
      const size = `${chart.clientWidth}:${chart.clientHeight}`;
      if (size === previous) return;
      previous = size;
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {resizeFrame = 0; hovered = null; plot(); resume();});
    });
    observer.observe(chart);
  }
})();

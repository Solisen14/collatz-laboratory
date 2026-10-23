/* Digging Deeper · Fixed-point graph scroll story
 * Progressive, reversible SVG reveal driven by scroll position.
 * With JS unavailable or reduced motion preferred, the complete graph stays visible.
 */
(() => {
  'use strict';

  const figure = document.querySelector('.fixed-graph-figure');
  if (!figure || !window.requestAnimationFrame) return;

  const quadratic = figure.querySelector('[data-fixed-draw="quadratic"]');
  const identity = figure.querySelector('[data-fixed-draw="identity"]');
  const svg = figure.querySelector('.fixed-graph-plot svg');
  if (!svg || !quadratic || !identity) return;

  const groups = {
    quadraticLabel: figure.querySelectorAll('[data-fixed-reveal="quadratic-label"]'),
    identityLabel: figure.querySelectorAll('[data-fixed-reveal="identity-label"]'),
    intersections: figure.querySelectorAll('[data-fixed-reveal="intersections"]'),
    negative: figure.querySelectorAll('[data-fixed-reveal="negative"]')
  };
  if (Object.values(groups).some(nodes => !nodes.length)) return;

  const media = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  if (media && media.matches) return;

  const clamp = v => Math.max(0, Math.min(1, v));
  const phase = (progress, start, finish) => clamp((progress - start) / (finish - start));
  const setOpacity = (elements, amount) => {
    for (const element of elements) element.style.opacity = String(amount);
  };
  const setDrawn = (path, amount) => {
    // Both paths have pathLength=1000, so distance is independent of their
    // actual length. The stroke really traces the mathematical curve.
    path.style.strokeDashoffset = String(1000 * (1 - amount));
  };

  let pending = false;
  let active = true;

  function render() {
    if (!active) return;

    const rect = figure.getBoundingClientRect();
    const viewport = window.innerHeight || document.documentElement.clientHeight || 760;
    // Graph starts blank when the figure enters the lower viewport, and is
    // fully drawn as the reader continues past it. Scrolling up rewinds.
    const begin = viewport * 0.82;
    // Complete the reveal while the figure is still comfortably on screen,
    // rather than after the points have scrolled past the top.
    const finish = viewport * 0.10;
    const progress = clamp((begin - rect.top) / (begin - finish));

    const quadraticProgress = phase(progress, 0.02, 0.41);
    const identityProgress = phase(progress, 0.42, 0.70);
    const pointProgress = phase(progress, 0.72, 0.87);
    const negativeProgress = phase(progress, 0.88, 1);

    setDrawn(quadratic, quadraticProgress);
    setDrawn(identity, identityProgress);
    setOpacity(groups.quadraticLabel, phase(progress, 0.30, 0.43));
    setOpacity(groups.identityLabel, phase(progress, 0.60, 0.72));
    setOpacity(groups.intersections, pointProgress);
    setOpacity(groups.negative, negativeProgress);
    figure.style.setProperty('--fixed-scroll-hint-alpha', String(1 - phase(progress, 0.05, 0.17)));
  }

  function schedule() {
    if (pending || !active) return;
    pending = true;
    window.requestAnimationFrame(() => {
      pending = false;
      render();
    });
  }

  function prepare() {
    for (const path of [quadratic, identity]) {
      path.style.strokeDasharray = '1000';
      path.style.strokeDashoffset = '1000';
    }
    for (const elements of Object.values(groups)) setOpacity(elements, 0);
    // Only switch into the hidden-progressive state after the script is
    // ready. Static content remains readable without JavaScript.
    figure.classList.add('is-scroll-revealing');
    render();
  }

  function restoreStatic() {
    active = false;
    figure.classList.remove('is-scroll-revealing');
    for (const path of [quadratic, identity]) {
      path.style.strokeDasharray = '';
      path.style.strokeDashoffset = '';
    }
    for (const elements of Object.values(groups)) {
      for (const element of elements) element.style.opacity = '';
    }
    figure.style.removeProperty('--fixed-scroll-hint-alpha');
  }

  prepare();

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pageshow', schedule);
  if (media && media.addEventListener) {
    media.addEventListener('change', event => {
      if (event.matches) restoreStatic();
      else if (!active) {
        active = true;
        prepare();
        schedule();
      }
    });
  }

  // Regression hooks, read-only. Deliberately no behavior controls required.
  window.collatzFixedPointScrollDiagnostics = () => ({
    active,
    drawnQuadratic: Number(quadratic.style.strokeDashoffset || 0),
    drawnIdentity: Number(identity.style.strokeDashoffset || 0),
    intersectionOpacity: Number(groups.intersections[0].style.opacity || 1),
    negativeOpacity: Number(groups.negative[0].style.opacity || 1)
  });
})();
/* Digging Deeper 04 · Diagram reveals timed to the drawings themselves.
 * Diagrams remain fully visible without JS, or if reduced motion is requested.
 */
(() => {
  'use strict';

  const article = document.getElementById('below-zero');
  if (!article || !window.requestAnimationFrame) return;

  const figures = Array.from(article.querySelectorAll('[data-negative-stage]'));
  if (!figures.length) return;

  const stages = figures.map(figure => ({
    figure,
    graphic: figure.querySelector('svg'),
    revealed: false
  }));
  if (stages.some(stage => !stage.graphic)) return;

  const media = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  if (media && media.matches) return;

  let pending = false;
  let active = true;

  function render() {
    if (!active) return;

    const viewport = window.innerHeight || document.documentElement.clientHeight || 760;
    for (const stage of stages) {
      if (stage.revealed) continue;

      // Use the SVG itself, not the card heading or container. Most diagrams
      // must be fully on screen, with some breathing room below, before
      // their nodes and edges start animating.
      const rect = stage.graphic.getBoundingClientRect();
      const comfortablyFits = rect.height <= viewport * 0.77;
      const fullyInView = rect.top >= 0 && rect.bottom <= viewport * 0.86;

      // A few layouts may make the large 18-node SVG taller than the usable
      // viewport. Reveal only once most of that SVG is in view instead.
      const tallEnoughInView = !comfortablyFits &&
        rect.top <= viewport * 0.22 &&
        rect.bottom >= viewport * 0.18;

      // Deep links and jumps past a figure should not leave it invisible.
      const alreadyPassed = rect.bottom <= 0;

      if (fullyInView || tallEnoughInView || alreadyPassed) {
        stage.figure.classList.add('is-revealed');
        stage.revealed = true;
      }
    }

    if (stages.every(stage => stage.revealed)) {
      active = false;
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('pageshow', schedule);
    }
  }

  function schedule() {
    if (pending || !active) return;
    pending = true;
    window.requestAnimationFrame(() => {
      pending = false;
      render();
    });
  }

  function restoreAll() {
    active = false;
    article.classList.remove('negative-motion-ready');
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    window.removeEventListener('pageshow', schedule);
  }

  article.classList.add('negative-motion-ready');
  schedule();
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pageshow', schedule);

  if (media && media.addEventListener) {
    media.addEventListener('change', event => {
      if (event.matches) restoreAll();
      else if (!active && stages.some(stage => !stage.revealed)) {
        active = true;
        article.classList.add('negative-motion-ready');
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule, { passive: true });
        window.addEventListener('pageshow', schedule);
        schedule();
      }
    });
  }
})();
/* Reveal the three example orbits individually as they enter the viewport.
 * The cards are left visible when IntersectionObserver is unavailable.
 */
(() => {
  'use strict';
  const figure = document.querySelector('.negative-small-orbits');
  if (!figure || !('IntersectionObserver' in window)) return;
  const rows = [...figure.querySelectorAll('.negative-small-orbit-row')];
  if (!rows.length) return;
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (media.matches) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const row = entry.target;
      const index = rows.indexOf(row);
      // When multiple rows become visible together, unfold them in order.
      window.setTimeout(() => row.classList.add('is-visible'), index * 140);
      observer.unobserve(row);
    });
  }, { threshold: 0.35 });

  figure.classList.add('negative-orbits-motion-ready');
  rows.forEach(row => observer.observe(row));
  media.addEventListener?.('change', event => {
    if (!event.matches) return;
    observer.disconnect();
    figure.classList.remove('negative-orbits-motion-ready');
  });
})();

/* Fractals / fern close-up. One photographic frond, smoothly magnified by reading progress.
   Decorative scroll effect; no effect on the other Fractals visualizations. */
(() => {
  'use strict';
  const section = document.getElementById('fern-scroll-journey');
  if (!section) return;
  const photo = section.querySelector('.fractal-fern-photo');
  const captions = [...section.querySelectorAll('.fractal-fern-caption')];
  const counter = section.querySelector('.fractal-fern-counter');
  const bar = section.querySelector('.fractal-fern-progress-fill');
  const cue = section.querySelector('.fractal-fern-scroll-cue');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pending = false;

  function clamp(value) { return Math.max(0, Math.min(1, value)); }
  function render() {
    pending = false;
    if (prefersReduced.matches) {
      photo.style.transform = 'none';
      photo.style.removeProperty('filter');
      counter.textContent = '01 / 04';
      bar.style.width = '0%';
      captions.forEach((el, i) => {
        el.classList.toggle('is-active', i === 0);
        el.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
      });
      if (cue) cue.textContent = 'EXPLORE THE PATTERNS';
      return;
    }
    const rect = section.getBoundingClientRect();
    const travel = Math.max(1, rect.height - window.innerHeight);
    const progress = clamp((92 - rect.top) / travel);
    // A small ease softens the transition at both ends without freezing any stage.
    const eased = progress * progress * (3 - 2 * progress);
    const scale = 1 + 3.3 * eased;
    photo.style.transform = 'scale(' + scale.toFixed(4) + ')';
    bar.style.width = (100 * progress).toFixed(2) + '%';
    const step = Math.min(3, Math.floor(progress * 4));
    counter.textContent = String(step + 1).padStart(2, '0') + ' / 04';
    captions.forEach((el, i) => {
      const active = i === step;
      el.classList.toggle('is-active', active);
      el.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
    if (cue) cue.textContent = progress > .88 ? 'KEEP EXPLORING ↓' : 'SCROLL TO ZOOM ↓';
  }
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(render);
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  if (prefersReduced.addEventListener) prefersReduced.addEventListener('change', schedule);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render, { once: true });
  else render();
})();

/* Digging Deeper 04 · Scroll-revealed mathematical cycles.
 * The diagrams remain fully visible if JavaScript or IntersectionObserver
 * is unavailable, and to readers who prefer reduced motion.
 */
(() => {
  'use strict';

  const article = document.getElementById('below-zero');
  if (!article || !('IntersectionObserver' in window)) return;

  const figures = Array.from(article.querySelectorAll('[data-negative-stage]'));
  if (!figures.length) return;

  const media = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  if (media && media.matches) return;

  article.classList.add('negative-motion-ready');

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting || entry.intersectionRatio < 0.16) continue;
      entry.target.classList.add('is-revealed');
      observer.unobserve(entry.target);
    }
  }, {
    threshold: [0, 0.16, 0.38],
    rootMargin: '0px 0px -8% 0px'
  });
  figures.forEach(figure => observer.observe(figure));

  if (media && media.addEventListener) {
    media.addEventListener('change', event => {
      if (!event.matches) return;
      observer.disconnect();
      article.classList.remove('negative-motion-ready');
    });
  }
})();
(() => {
  const baseRenderTree = renderTree;
  const BASE_EDGE_DELAY_MS = 48;
  const TARGET_DURATION_MS = 8000;
  const MIN_EDGE_DELAY_MS = 5;

  renderTree = function(options = {}) {
    if (!options.animate) {
      return baseRenderTree(options);
    }

    const edgeCount = Math.max(1, buildTree(readOptions()).edges.length);
    const adaptiveEdgeDelay = Math.max(
      MIN_EDGE_DELAY_MS,
      Math.min(BASE_EDGE_DELAY_MS, TARGET_DURATION_MS / edgeCount)
    );
    const delayScale = adaptiveEdgeDelay / BASE_EDGE_DELAY_MS;
    const nativeSetTimeout = window.setTimeout;

    window.setTimeout = function(callback, delay = 0, ...args) {
      return nativeSetTimeout(callback, delay * delayScale, ...args);
    };

    let result;
    try {
      result = baseRenderTree(options);
    } finally {
      window.setTimeout = nativeSetTimeout;
    }

    const estimatedSeconds = Math.max(1, Math.round((edgeCount * adaptiveEdgeDelay) / 1000));
    statusMessage.textContent = `Animating growth… about ${estimatedSeconds}s`;
    return result;
  };

  // visualizer.js starts an animation immediately on page load. Cancel that
  // fixed-speed run and restart it with the adaptive timing above.
  clearAnimationTimers();
  renderTree({ animate: true, fit: true });
})();

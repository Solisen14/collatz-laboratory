// Stabilize the 20 / 21 story-card interaction.
// The visible card buttons now update the story state directly instead of
// proxy-clicking the floating choice-panel buttons.

(function () {
  function refreshSevenCardButtons() {
    document.querySelectorAll('.story-step[data-scene="choose-seven"] .choice-button').forEach(button => {
      const value = Number(button.dataset.sevenCard || button.textContent.replace(/\D/g, ''));
      if (![20, 21].includes(value)) return;
      button.dataset.sevenCard = String(value);
      const done = state.tracedSeven.has(value);
      button.classList.toggle('done', done);
      button.textContent = done ? `${value} ✓` : String(value);
    });
  }

  function chooseSevenDirect(value) {
    value = Number(value);
    if (![20, 21].includes(value)) return;

    if (!state.tracedSeven.has(value)) {
      state.tracedSeven.add(value);
      setComparisonRowVisible(value, true);
    }

    refreshSevenCardButtons();
    showSevenChoices();

    if (state.tracedSeven.size === 2) {
      stageTitle.textContent = 'Three different starts. Three seven-step paths.';
      showStatus('3 paths · 7 steps each · continue scrolling');
    } else {
      stageTitle.textContent = 'Choose the other starting number.';
      showStatus(`${state.tracedSeven.size} of 2 new paths traced`);
    }
  }

  // Replace the brittle inline proxy handlers installed by the script-sync layer.
  document.querySelectorAll('.story-step[data-scene="choose-seven"] .choice-button').forEach(button => {
    const value = Number(button.textContent.replace(/\D/g, ''));
    if (![20, 21].includes(value)) return;
    button.dataset.sevenCard = String(value);
    button.removeAttribute('onclick');
    button.addEventListener('click', () => chooseSevenDirect(value));
  });

  // Keep the visible card in sync if the floating controls are used instead.
  choicePanel.addEventListener('click', event => {
    if (event.target.closest('[data-seven]')) {
      requestAnimationFrame(refreshSevenCardButtons);
    }
  });

  refreshSevenCardButtons();
})();

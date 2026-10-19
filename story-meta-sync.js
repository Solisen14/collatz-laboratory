// Final story-label sync from the Google Doc source of truth.
// This layer intentionally runs after the interaction/merge scripts so scene
// numbers and scene headings always match the current script, while preserving
// the animation logic underneath.

(function () {
  const sceneMeta = {
    intro: { chapter: "01", kicker: "FOLLOW THE SEQUENCE" },
    "three-1": { chapter: "01", kicker: "FOLLOW THE SEQUENCE" },
    "three-2": { chapter: "01", kicker: "FOLLOW THE SEQUENCE" },
    "three-3": { chapter: "01", kicker: "FOLLOW THE SEQUENCE" },

    "reveal-rule": { chapter: "02", kicker: "PREDICT THE RULE" },
    "finish-three": { chapter: "02", kicker: "PREDICT THE RULE" },
    "collatz-rules": { chapter: "02", kicker: "PREDICT THE RULE" },

    "choose-seven": { chapter: "03", kicker: "TRY 20 AND 21" },

    conjecture: { chapter: "04", kicker: "FIRST CONJECTURE" },
    "conjecture-big": { chapter: "04", kicker: "FIRST CONJECTURE" },

    "test-conjecture": { chapter: "05", kicker: "TEST THE CONJECTURE" },
    refine: { chapter: "06", kicker: "BREAK / REFINE THE CONJECTURE" },

    "revisit-three": { chapter: "07", kicker: "REVISIT THE FIRST THREE PATHS" },
    "merge-three": { chapter: "08", kicker: "MERGE THE PATHS" },
    "grow-six": { chapter: "09", kicker: "ZOOM OUT / ADD THE COUNTEREXAMPLES" },
    "reverse-question": { chapter: "10", kicker: "WHAT COMES NEXT?" },
    "text-placeholder": { chapter: "11", kicker: "GROUP MATHEMATICAL TEXT" }
  };

  function applySceneMeta(scene) {
    const meta = sceneMeta[scene];
    if (!meta) return;

    const chapter = document.querySelector(".stage-heading .chapter");
    const kicker = document.querySelector(".stage-heading .kicker");
    if (chapter) chapter.textContent = meta.chapter;
    if (kicker) kicker.textContent = meta.kicker;
  }

  // Each reveal gets a visible narrative caption while retaining its
  // existing scroll-driven sequence animation.
  const sequenceCaptions = {
    "three-1": "The next number in the sequence is 10",
    "three-2": "Followed by 5"
  };
  Object.entries(sequenceCaptions).forEach(([scene, caption]) => {
    const step = document.querySelector(`.story-step[data-scene="${scene}"]`);
    if (!step) return;
    step.classList.remove("story-cinematic-trigger");
    const card = step.querySelector(".step-card");
    if (card) {
      card.removeAttribute("aria-hidden");
      card.innerHTML = `<p>${caption}</p>`;
    }
  });

  const baseSetScene = setScene;
  setScene = function (scene) {
    const result = baseSetScene(scene);
    applySceneMeta(scene);
    return result;
  };

  applySceneMeta(state.scene || "intro");
})();

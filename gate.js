// Interaction gates for the scroll story.
// A reader must complete each choice set before later story scenes unlock.

const testedGateValues = new Set();
const orderedScenes = storySteps.map(step => step.dataset.scene);
const chooseSevenIndex = orderedScenes.indexOf("choose-seven");
const testConjectureIndex = orderedScenes.indexOf("test-conjecture");
const ungatedSetScene = setScene;
const originalTriggerTestChoice = triggerTestChoice;
let gateSnapPending = false;

function sceneIndex(scene) {
  return orderedScenes.indexOf(scene);
}

function requiredGateFor(scene) {
  const index = sceneIndex(scene);
  if (index < 0) return null;

  if (index > chooseSevenIndex && state.tracedSeven.size < 2) {
    return "choose-seven";
  }

  if (index > testConjectureIndex && testedGateValues.size < 3) {
    return "test-conjecture";
  }

  return null;
}

function gateProgress(scene) {
  if (scene === "choose-seven") {
    return `${state.tracedSeven.size} of 2 paths traced`;
  }
  return `${testedGateValues.size} of 3 values tested`;
}

function gateMessage(scene) {
  if (scene === "choose-seven") {
    return "Select both 20 and 21 before continuing.";
  }
  return "Test 6, 40, and 42 before continuing.";
}

function snapBackToGate(scene) {
  if (gateSnapPending) return;
  const step = storySteps.find(item => item.dataset.scene === scene);
  if (!step) return;

  gateSnapPending = true;
  requestAnimationFrame(() => {
    step.scrollIntoView({ block: "center", behavior: "auto" });
    requestAnimationFrame(() => {
      gateSnapPending = false;
    });
  });
}

setScene = function(scene) {
  const gate = requiredGateFor(scene);
  if (gate) {
    ungatedSetScene(gate);
    showStatus(gateProgress(gate));
    showPrompt(gateMessage(gate));
    snapBackToGate(gate);
    return;
  }

  return ungatedSetScene(scene);
};

function refreshTestCardButtons() {
  document.querySelectorAll(".test-card-choice").forEach(button => {
    const value = Number(button.dataset.testCard);
    const done = testedGateValues.has(value);
    button.classList.toggle("done", done);
    button.textContent = done ? `${value} ✓` : String(value);
  });
}

triggerTestChoice = function(value, element) {
  testedGateValues.add(Number(value));
  originalTriggerTestChoice(value, element);
  refreshTestCardButtons();

  if (testedGateValues.size === 3) {
    showStatus("3 of 3 values tested · continue scrolling");
  } else {
    showStatus(`${testedGateValues.size} of 3 values tested`);
  }
};

// The floating stage controls are secondary to the card buttons, but count them
// too if a user clicks them directly.
choicePanel.addEventListener("click", event => {
  const button = event.target.closest("[data-test]");
  if (!button) return;
  testedGateValues.add(Number(button.dataset.test));
  refreshTestCardButtons();

  if (testedGateValues.size === 3) {
    showStatus("3 of 3 values tested · continue scrolling");
  }
});

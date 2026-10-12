const sequences = {
  3: [3, 10, 5, 16, 8, 4, 2, 1],
  20: [20, 10, 5, 16, 8, 4, 2, 1],
  21: [21, 64, 32, 16, 8, 4, 2, 1],
  6: [6, 3, 10, 5, 16, 8, 4, 2, 1],
  40: [40, 20, 10, 5, 16, 8, 4, 2, 1],
  42: [42, 21, 64, 32, 16, 8, 4, 2, 1]
};

const palette = {
  3: "cyan",
  20: "violet",
  21: "pink"
};

const mergeParent = {
  6: 3,
  40: 20,
  42: 21
};

const state = {
  scene: null,
  tracedSeven: new Set(),
  tested: null,
  timers: []
};

const sequenceArea = document.getElementById("sequence-area");
const choicePanel = document.getElementById("choice-panel");
const floatingPrompt = document.getElementById("floating-prompt");
const promptCopy = document.getElementById("prompt-copy");
const stageTitle = document.getElementById("stage-title");
const statusPill = document.getElementById("status-pill");
const storySteps = [...document.querySelectorAll(".story-step")];

function clearTimers() {
  state.timers.forEach(clearTimeout);
  state.timers = [];
}

function hideTransientUI() {
  choicePanel.classList.add("hidden");
  floatingPrompt.classList.add("hidden");
  statusPill.classList.add("hidden");
}

function showPrompt(text) {
  promptCopy.textContent = text;
  floatingPrompt.classList.remove("hidden");
}

function showStatus(text) {
  statusPill.textContent = text;
  statusPill.classList.remove("hidden");
}

function colourForNode(start, index) {
  if (mergeParent[start]) {
    return index === 0 ? "gold" : palette[mergeParent[start]];
  }
  return palette[start] || "cyan";
}

/*
 * The opening path is built once at its final width. We then reveal nodes
 * inside that fixed geometry. Existing numbers never move when a new value
 * appears, so the sequence grows from left to right rather than snapping.
 */
function buildPrimaryPath() {
  clearTimers();
  sequenceArea.innerHTML = "";
  sequenceArea.dataset.mode = "primary-3";
  sequenceArea.dataset.revealCount = "0";

  const values = sequences[3];
  const rowEl = document.createElement("div");
  rowEl.className = "sequence-row primary-sequence-row";

  const label = document.createElement("div");
  label.className = "row-label";
  label.textContent = "START 3";

  const track = document.createElement("div");
  track.className = "path-track primary-path-track";

  values.forEach((value, index) => {
    const wrap = document.createElement("div");
    wrap.className = "node-wrap";
    wrap.dataset.index = String(index);

    const node = document.createElement("div");
    node.className = "path-node colour-cyan";
    node.textContent = value;

    if (index === values.length - 1) {
      node.classList.add("end-node");
    }

    wrap.appendChild(node);

    if (index < values.length - 1) {
      const connector = document.createElement("div");
      connector.className = "connector colour-cyan";
      wrap.appendChild(connector);
    }

    track.appendChild(wrap);
  });

  rowEl.append(label, track);
  sequenceArea.appendChild(rowEl);
}

function revealPrimaryPath(targetCount) {
  clearTimers();

  if (sequenceArea.dataset.mode !== "primary-3") {
    buildPrimaryPath();
  }

  const wraps = [...sequenceArea.querySelectorAll(".node-wrap")];
  const previousCount = Number(sequenceArea.dataset.revealCount || 0);
  const count = Math.max(0, Math.min(targetCount, wraps.length));

  // Scrolling backwards simply rolls the reveal back while keeping geometry fixed.
  if (count < previousCount) {
    wraps.forEach((wrap, index) => {
      const node = wrap.querySelector(".path-node");
      const connector = wrap.querySelector(".connector");
      node.classList.toggle("visible", index < count);
      if (connector) connector.classList.toggle("visible", index < count - 1);
    });
    sequenceArea.dataset.revealCount = String(count);
    return;
  }

  // Ensure everything already revealed remains visible and anchored.
  wraps.forEach((wrap, index) => {
    if (index < previousCount) {
      wrap.querySelector(".path-node")?.classList.add("visible");
      if (index < previousCount - 1) {
        wrap.querySelector(".connector")?.classList.add("visible");
      }
    }
  });

  if (previousCount === 0 && count > 0) {
    wraps[0]?.querySelector(".path-node")?.classList.add("visible");
  }

  // Each new step draws its connector first, then lets the next integer flow in.
  const firstNewIndex = Math.max(1, previousCount);
  for (let index = firstNewIndex; index < count; index++) {
    const stepOffset = index - firstNewIndex;
    const connectorDelay = stepOffset * 620 + 80;
    const nodeDelay = connectorDelay + 360;

    const previousConnector = wraps[index - 1]?.querySelector(".connector");
    const node = wraps[index]?.querySelector(".path-node");

    if (previousConnector) {
      state.timers.push(setTimeout(() => {
        previousConnector.classList.add("visible");
      }, connectorDelay));
    }

    if (node) {
      state.timers.push(setTimeout(() => {
        node.classList.add("visible");
      }, nodeDelay));
    }
  }

  sequenceArea.dataset.revealCount = String(count);
}

function renderRows(rows, options = {}) {
  clearTimers();
  sequenceArea.innerHTML = "";
  sequenceArea.dataset.mode = "standard";
  delete sequenceArea.dataset.revealCount;

  rows.forEach((row, rowIndex) => {
    const values = options.limit ? row.values.slice(0, options.limit) : row.values;
    const rowEl = document.createElement("div");
    rowEl.className = "sequence-row";

    const label = document.createElement("div");
    label.className = "row-label";
    label.textContent = row.label || `START ${row.start}`;

    const track = document.createElement("div");
    track.className = "path-track";

    values.forEach((value, index) => {
      const wrap = document.createElement("div");
      wrap.className = "node-wrap";

      const node = document.createElement("div");
      const colour = colourForNode(row.start, index);
      node.className = `path-node colour-${colour}`;
      node.textContent = value;

      if (mergeParent[row.start] && index >= 1) {
        node.classList.add("shared-node");
      }
      if (index === values.length - 1 && value === 1) {
        node.classList.add("end-node");
      }

      wrap.appendChild(node);

      if (index < values.length - 1) {
        const connector = document.createElement("div");
        const connectorColour = mergeParent[row.start] && index >= 0
          ? (index === 0 ? palette[mergeParent[row.start]] : colourForNode(row.start, index + 1))
          : colour;
        connector.className = `connector colour-${connectorColour}`;
        wrap.appendChild(connector);
      }

      track.appendChild(wrap);

      const delay = 110 + rowIndex * 120 + index * (rows.length > 1 ? 95 : 170);
      state.timers.push(setTimeout(() => {
        node.classList.add("visible");
        const connector = wrap.querySelector(".connector");
        if (connector) {
          state.timers.push(setTimeout(() => connector.classList.add("visible"), 150));
        }
      }, delay));
    });

    rowEl.append(label, track);
    sequenceArea.appendChild(rowEl);
  });
}

function sevenStepRows() {
  return [3, 20, 21].map(start => ({ start, values: sequences[start] }));
}

function renderSevenChoiceScene() {
  const starts = [3, ...state.tracedSeven];
  renderRows(starts.map(start => ({ start, values: sequences[start] })));
  stageTitle.textContent = state.tracedSeven.size === 2
    ? "Different starts. Same destination."
    : "Choose another starting number.";

  showSevenChoices();

  if (state.tracedSeven.size === 2) {
    showStatus("20 + 21 traced · 7 steps each");
  } else {
    showStatus(`${state.tracedSeven.size} of 2 new paths traced`);
  }
}

function showSevenChoices() {
  choicePanel.innerHTML = `
    <div class="choice-label">Trace both paths</div>
    ${[20, 21].map(value => `
      <button class="choice-button ${state.tracedSeven.has(value) ? "done" : ""}" data-seven="${value}">
        ${value}${state.tracedSeven.has(value) ? " ✓" : ""}
      </button>
    `).join("")}
  `;
  choicePanel.classList.remove("hidden");

  choicePanel.querySelectorAll("[data-seven]").forEach(button => {
    button.addEventListener("click", () => {
      const value = Number(button.dataset.seven);
      state.tracedSeven.add(value);
      renderSevenChoiceScene();
    });
  });
}

function showTestChoices() {
  choicePanel.innerHTML = `
    <div class="choice-label">Choose one value to test the conjecture</div>
    ${[6, 40, 42].map(value => `
      <button class="choice-button ${state.tested === value ? "active" : ""}" data-test="${value}">${value}</button>
    `).join("")}
  `;
  choicePanel.classList.remove("hidden");

  choicePanel.querySelectorAll("[data-test]").forEach(button => {
    button.addEventListener("click", () => {
      const value = Number(button.dataset.test);
      state.tested = value;
      renderRows([{ start: value, values: sequences[value], label: `${value} → ${mergeParent[value]} PATH` }]);
      stageTitle.textContent = `${value} reaches 1. Not in 7 steps.`;
      showStatus("8 steps");
      showPrompt(`After one move, ${value} joins the path that began at ${mergeParent[value]}.`);
      showTestChoices();
    });
  });
}

function renderConjectureScene() {
  if (state.tracedSeven.size < 2) {
    stageTitle.textContent = "Trace both paths before you move on.";
    renderSevenChoiceScene();
    showPrompt("The conjecture is stronger if all three examples are visible.");
    return;
  }

  renderRows(sevenStepRows());
  stageTitle.textContent = "Three paths. Seven steps each.";
  showStatus("3 examples · 7 steps");
  showPrompt("A pattern across examples can suggest a conjecture. It does not prove one.");
}

function setScene(scene) {
  if (scene === state.scene) return;
  state.scene = scene;
  hideTransientUI();

  switch (scene) {
    case "intro":
      stageTitle.textContent = "Start with 3.";
      revealPrimaryPath(1);
      break;

    case "three-1":
      stageTitle.textContent = "Follow the sequence.";
      revealPrimaryPath(2);
      break;

    case "three-2":
      stageTitle.textContent = "One move at a time.";
      revealPrimaryPath(3);
      break;

    case "three-3":
      stageTitle.textContent = "Pause before the next move.";
      revealPrimaryPath(4);
      showPrompt("What is the pattern you notice? Can you predict the next number?");
      break;

    case "reveal-rule":
      stageTitle.textContent = "Two rules drive the sequence.";
      revealPrimaryPath(4);
      showPrompt("Even numbers are halved. Odd numbers are tripled, then increased by 1.");
      break;

    case "finish-three":
      stageTitle.textContent = "The path reaches 1.";
      revealPrimaryPath(8);
      showStatus("7 steps");
      break;

    case "choose-seven":
      renderSevenChoiceScene();
      break;

    case "conjecture":
      renderConjectureScene();
      break;

    case "test-conjecture":
      stageTitle.textContent = "Try to break the conjecture.";
      if (state.tested) {
        renderRows([{ start: state.tested, values: sequences[state.tested], label: `${state.tested} → ${mergeParent[state.tested]} PATH` }]);
        showStatus("8 steps");
      } else {
        clearTimers();
        sequenceArea.innerHTML = "";
        sequenceArea.dataset.mode = "standard";
      }
      showTestChoices();
      break;

    case "refine": {
      const value = state.tested || 6;
      stageTitle.textContent = "The seven-step conjecture breaks.";
      renderRows([{ start: value, values: sequences[value], label: `${value} → ${mergeParent[value]} PATH` }]);
      showStatus("8 steps");
      showPrompt("Exactly 7 steps is false. But the path still reaches 1.");
      break;
    }

    case "text-placeholder":
      stageTitle.textContent = "The mathematical story continues.";
      clearTimers();
      sequenceArea.innerHTML = "";
      sequenceArea.dataset.mode = "standard";
      showPrompt("INSERT TEXT HERE");
      break;
  }
}

let ticking = false;

function updateActiveStep() {
  ticking = false;
  const targetY = window.innerHeight * 0.52;
  let active = storySteps[0];
  let bestDistance = Infinity;

  storySteps.forEach(step => {
    const rect = step.getBoundingClientRect();
    const centre = rect.top + rect.height / 2;
    const distance = Math.abs(centre - targetY);
    if (distance < bestDistance) {
      bestDistance = distance;
      active = step;
    }
  });

  storySteps.forEach(step => step.classList.toggle("is-active", step === active));
  setScene(active.dataset.scene);
}

window.addEventListener("scroll", () => {
  if (!ticking) {
    requestAnimationFrame(updateActiveStep);
    ticking = true;
  }
}, { passive: true });

window.addEventListener("resize", updateActiveStep);
updateActiveStep();

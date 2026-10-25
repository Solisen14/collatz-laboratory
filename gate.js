// Branching transition + interaction gates for the scroll story.
// The reader first tests six starting values, then revisits the original three
// paths as they collapse into one branching structure.

function ensureBranchingStyles() {
  if (document.getElementById("branching-story-styles")) return;

  const style = document.createElement("style");
  style.id = "branching-story-styles";
  style.textContent = `
    .branch-shell {
      width: 100%;
      height: 390px;
      overflow: visible;
    }

    .branch-svg {
      display: block;
      width: 100%;
      height: 390px;
      overflow: visible;
    }

    .branch-world {
      transform-origin: 50% 50%;
      transform-box: view-box;
      transition: transform 1s cubic-bezier(.18,.78,.22,1);
    }

    .branch-stage.expanded .branch-world {
      transform: scale(.88);
    }

    .branch-node circle {
      fill: rgba(9,14,22,.97);
      stroke-width: 1.35;
    }

    .branch-node text {
      fill: #f8fbff;
      font: 500 17px Inter, ui-sans-serif, system-ui, sans-serif;
      text-anchor: middle;
      dominant-baseline: central;
      font-variant-numeric: tabular-nums;
      user-select: none;
    }

    .branch-edge {
      fill: none;
      stroke-width: 1.45;
      stroke-linecap: round;
    }

    .branch-label {
      font: 750 9px Inter, ui-sans-serif, system-ui, sans-serif;
      letter-spacing: .18em;
      opacity: .72;
    }

    .branch-fade {
      opacity: 1;
      transition: opacity .72s ease;
    }

    .branch-stage.merged .branch-fade {
      opacity: 0;
    }

    .branch-merge {
      fill: none;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
      opacity: 0;
      transition:
        stroke-dashoffset .9s cubic-bezier(.2,.78,.25,1) .18s,
        opacity .2s ease .18s;
    }

    .branch-stage.merged .branch-merge {
      stroke-dashoffset: 0;
      opacity: 1;
    }

    .branch-trunk circle,
    .branch-trunk.branch-edge {
      transition: filter .65s ease, stroke-width .65s ease;
    }

    .branch-stage.merged .branch-trunk circle {
      filter: drop-shadow(0 0 12px rgba(122,231,255,.36));
    }

    .branch-stage.merged .branch-trunk.branch-edge {
      stroke-width: 1.7;
      filter: drop-shadow(0 0 5px rgba(122,231,255,.28));
    }

    .branch-outer {
      opacity: 0;
      transform: translateX(-20px);
      transform-box: fill-box;
      transform-origin: center;
      transition: opacity .48s ease, transform .7s cubic-bezier(.18,.78,.22,1);
    }

    .branch-stage.show-outer .branch-outer {
      opacity: 1;
      transform: translateX(0);
    }

    .branch-outer-edge {
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
      transition: stroke-dashoffset .65s cubic-bezier(.2,.78,.25,1) .28s;
    }

    .branch-stage.show-outer .branch-outer-edge {
      stroke-dashoffset: 0;
    }
  `;
  document.head.appendChild(style);
}

function makeBranchStoryStep(scene, number, title, className = "tall-step", description = "INSERT TEXT HERE") {
  const article = document.createElement("article");
  article.className = `story-step ${className}`;
  article.dataset.scene = scene;
  article.innerHTML = `
    <div class="step-card">
      <p class="step-number">${number}</p>
      <h3>${title}</h3>
      <p>${description}</p>
    </div>
  `;
  return article;
}

function installBranchStorySteps() {
  if (storySteps.some(step => step.dataset.scene === "revisit-three")) return;

  const textStep = storySteps.find(step => step.dataset.scene === "text-placeholder");
  if (!textStep) return;

  const revisit = makeBranchStoryStep(
    "revisit-three", "REVISIT", "Let's revisit the first three paths.",
    "tall-step", "Do you see any repeated values?"
  );
  const merge = makeBranchStoryStep(
    "merge-three",
    "BRANCHING",
    "We can think of these three sequences as one branching path",
    "tall-step",
    "Although they begin at different numbers, their sequences eventually meet. From that point onward, they follow the same steps to reach 1."
  );
  const grow = makeBranchStoryStep(
    "grow-six",
    "ZOOM OUT",
    "Now add 6, 40, and 42.",
    "tall-step",
    "These numbers join the branching path, extending it to 8 steps."
  );

  const reverseQuestion = makeBranchStoryStep(
    "reverse-question",
    "EXPLORE BACKWARD",
    "What comes next?",
    "tall-step",
    "Can you determine what number comes before 6, 40 or 42? Is there only one number or are more numbers possible?"
  );

  const reverseReveal = makeBranchStoryStep(
    "reverse-reveal",
    "REVEAL",
    "The branches grow.",
    "tall-step",
    "12 leads to 6. Both 80 and 13 lead to 40. And 84 leads to 42."
  );

  // The next four cards remain part of the scroll sequence. Their SVG is
  // rendered by collatz-tree-story.js, but their cards belong in the same
  // storySteps array so the existing interaction gates still apply.
  const treeRise = makeBranchStoryStep(
    "tree-rise", "EXPAND THE VIEW", "The tree keeps growing.",
    "tall-step",
    "Eight starting values connect to one larger structure. Straight downward arrows represent division by 2; angled arrows represent the odd rule."
  );
  const treeConverge = makeBranchStoryStep(
    "tree-converge", "FOLLOW THE ARROWS", "Many paths. One destination.",
    "tall-step",
    "The branches look different, but every path shown here eventually joins the middle line. From a power of 2, repeated halving leads to 1."
  );
  const treeLoop = makeBranchStoryStep(
    "tree-loop", "THE REPEATING CYCLE", "What happens after 1?",
    "tall-step",
    "The sequence doesn't stop at 1. Because 1 is odd, the next value is 4, followed by 2 and 1 again. The cycle is 1 → 4 → 2 → 1."
  );
  // The final chapter is presented across the entire stage, not in a card.
  // Keep a full-height scroll trigger so it follows the existing loop scene.
  const treeFormal = document.createElement("article");
  treeFormal.className = "story-step tall-step finale-trigger";
  treeFormal.dataset.scene = "tree-formal";
  treeFormal.setAttribute("aria-label", "The Collatz Conjecture and where to explore next");

  textStep.before(
    revisit, merge, grow, reverseQuestion, reverseReveal,
    treeRise, treeConverge, treeLoop, treeFormal
  );
  const insertAt = storySteps.indexOf(textStep);
  storySteps.splice(
    insertAt, 0, revisit, merge, grow, reverseQuestion, reverseReveal,
    treeRise, treeConverge, treeLoop, treeFormal
  );
}

function branchMarker(defs, id, colour) {
  const marker = svgElement("marker", {
    id,
    markerWidth: 9,
    markerHeight: 9,
    refX: 7.6,
    refY: 4.5,
    orient: "auto",
    markerUnits: "userSpaceOnUse"
  });
  const path = svgElement("path", { d: "M0,0 L9,4.5 L0,9 Z", fill: colour });
  marker.appendChild(path);
  defs.appendChild(marker);
}

function branchNode(parent, x, y, value, colour, classes = "") {
  const group = svgElement("g", { class: `branch-node ${classes}`.trim() });
  const circle = svgElement("circle", {
    cx: x,
    cy: y,
    r: 25,
    stroke: colour,
    style: `filter:drop-shadow(0 0 9px ${colour}42)`
  });
  const text = svgElement("text", { x, y });
  text.textContent = value;
  group.append(circle, text);
  parent.appendChild(group);
  return group;
}

function branchLine(parent, x1, y1, x2, y2, colour, markerId, classes = "") {
  const line = svgElement("line", {
    class: `branch-edge ${classes}`.trim(),
    x1,
    y1,
    x2,
    y2,
    stroke: colour,
    "marker-end": `url(#${markerId})`,
    style: `filter:drop-shadow(0 0 4px ${colour}38)`
  });
  parent.appendChild(line);
  return line;
}

function addBranchLabel(parent, x, y, text, colour) {
  const label = svgElement("text", { class: "branch-label", x, y, fill: colour });
  label.textContent = text;
  parent.appendChild(label);
}

function renderBranchingStage({ animateMerge = false, expanded = false } = {}) {
  clearTimers();
  ensureBranchingStyles();
  sequenceArea.innerHTML = "";
  sequenceArea.dataset.mode = "branching-story";

  const shell = document.createElement("div");
  shell.className = `branch-shell branch-stage${expanded ? " merged expanded" : ""}`;

  const svg = svgElement("svg", {
    class: "branch-svg",
    viewBox: "0 0 1000 360",
    preserveAspectRatio: "xMidYMid meet",
    role: "img",
    "aria-label": "Six Collatz starting values represented as one branching path"
  });

  const defs = svgElement("defs");
  branchMarker(defs, "arrow-cyan", "#7ae7ff");
  branchMarker(defs, "arrow-violet", "#9f8cff");
  branchMarker(defs, "arrow-pink", "#ff78b8");
  branchMarker(defs, "arrow-gold", "#ffd479");
  svg.appendChild(defs);

  const world = svgElement("g", { class: "branch-world" });
  svg.appendChild(world);

  const cyan = "#7ae7ff";
  const violet = "#9f8cff";
  const pink = "#ff78b8";
  const gold = "#ffd479";
  const xs = [130, 240, 350, 460, 570, 680, 790, 900];
  const topY = 72;
  const midY = 180;
  const bottomY = 288;
  const trunkValues = [3, 10, 5, 16, 8, 4, 2, 1];
  const topValues = [20, 10, 5, 16, 8, 4, 2, 1];
  const bottomValues = [21, 64, 32, 16, 8, 4, 2, 1];

  addBranchLabel(world, 105, topY - 42, "START 20", violet);
  addBranchLabel(world, 105, midY - 42, "START 3", cyan);
  addBranchLabel(world, 105, bottomY - 42, "START 21", pink);

  // Central path remains throughout the transformation.
  trunkValues.forEach((value, index) => {
    branchNode(world, xs[index], midY, value, cyan, "branch-trunk");
    if (index < trunkValues.length - 1) {
      branchLine(world, xs[index] + 27, midY, xs[index + 1] - 31, midY, cyan, "arrow-cyan", "branch-trunk");
    }
  });

  // 20 initially appears as a complete parallel path. Everything after 20
  // fades once the curved connection to the central 10 is revealed.
  topValues.forEach((value, index) => {
    branchNode(world, xs[index], topY, value, violet, index === 0 ? "" : "branch-fade");
    if (index < topValues.length - 1) {
      branchLine(world, xs[index] + 27, topY, xs[index + 1] - 31, topY, violet, "arrow-violet", "branch-fade");
    }
  });

  // 21 → 64 → 32 remains unique. From 16 onward the duplicate portion fades.
  bottomValues.forEach((value, index) => {
    branchNode(world, xs[index], bottomY, value, pink, index >= 3 ? "branch-fade" : "");
    if (index < bottomValues.length - 1) {
      branchLine(
        world,
        xs[index] + 27,
        bottomY,
        xs[index + 1] - 31,
        bottomY,
        pink,
        "arrow-pink",
        index >= 2 ? "branch-fade" : ""
      );
    }
  });

  const topMerge = svgElement("path", {
    class: "branch-merge",
    d: `M ${xs[0] + 27} ${topY} C 195 ${topY}, 190 ${midY}, ${xs[1] - 31} ${midY}`,
    pathLength: 1,
    stroke: violet,
    "marker-end": "url(#arrow-violet)",
    style: `filter:drop-shadow(0 0 5px ${violet}55)`
  });
  world.appendChild(topMerge);

  const bottomMerge = svgElement("path", {
    class: "branch-merge",
    d: `M ${xs[2] + 27} ${bottomY} C 415 ${bottomY}, 415 ${midY}, ${xs[3] - 31} ${midY}`,
    pathLength: 1,
    stroke: pink,
    "marker-end": "url(#arrow-pink)",
    style: `filter:drop-shadow(0 0 5px ${pink}55)`
  });
  world.appendChild(bottomMerge);

  // The three counterexamples are already part of the same structure. They are
  // hidden until the camera zooms out in the next scroll beat.
  const outerSpecs = [
    { value: 40, y: topY, targetX: xs[0], colour: violet, marker: "arrow-violet" },
    { value: 6, y: midY, targetX: xs[0], colour: cyan, marker: "arrow-cyan" },
    { value: 42, y: bottomY, targetX: xs[0], colour: pink, marker: "arrow-pink" }
  ];

  outerSpecs.forEach(spec => {
    const edgeGroup = svgElement("g", { class: "branch-outer" });
    branchLine(edgeGroup, 54, spec.y, spec.targetX - 31, spec.y, spec.colour, spec.marker, "branch-outer-edge");
    world.appendChild(edgeGroup);

    const nodeGroup = svgElement("g", { class: "branch-outer" });
    branchNode(nodeGroup, 28, spec.y, spec.value, gold);
    world.appendChild(nodeGroup);
  });

  shell.appendChild(svg);
  sequenceArea.appendChild(shell);

  if (expanded) {
    shell.classList.add("show-outer");
    return;
  }

  if (animateMerge) {
    state.timers.push(setTimeout(() => shell.classList.add("merged"), 650));
  } else {
    shell.classList.add("merged");
  }
}

function renderRevisitThree() {
  ensureComparisonStage();
  makePrimaryThreeFullyVisible();
  setComparisonRowVisible(20, false);
  setComparisonRowVisible(21, false);
  stageTitle.textContent = "Revisit the first three paths.";
  showStatus("3 paths · 7 steps each");
}

function renderMergeThree() {
  stageTitle.textContent = "Watch the paths merge.";
  renderBranchingStage({ animateMerge: true });
  showStatus("3 starts · 1 branching path");
}

function renderGrowSix() {
  stageTitle.textContent = "Add 6, 40, and 42.";

  let shell = sequenceArea.querySelector(".branch-stage");
  if (!shell || sequenceArea.dataset.mode !== "branching-story") {
    renderBranchingStage({ animateMerge: false });
    shell = sequenceArea.querySelector(".branch-stage");
  }

  shell?.classList.add("merged");
  state.timers.push(setTimeout(() => shell?.classList.add("expanded"), 180));
  state.timers.push(setTimeout(() => shell?.classList.add("show-outer"), 900));
  showStatus("6 starts · 1 connected structure");
}

function renderReverseQuestion() {
  smoothStageTitle("What comes next?");

  let shell = sequenceArea.querySelector(".branch-stage");
  if (!shell || sequenceArea.dataset.mode !== "branching-story") {
    renderBranchingStage({ expanded: true });
    shell = sequenceArea.querySelector(".branch-stage");
  }

  // Keep the same SVG and camera when scrolling BACK from the answer scene.
  // Only fade out the answers; the three question circles stay in place.
  shell?.classList.remove("revealed-predecessors");
  shell?.classList.add("merged", "expanded", "show-outer");
  // All the question marks are brought on screen by a smooth world transform.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (state.scene === "reverse-question") {
      shell?.classList.add("show-predecessors");
    }
  }));
  showStatus("Look for the numbers that could come before these three.");
}

function renderReverseReveal() {
  smoothStageTitle("The branches grow.");

  let shell = sequenceArea.querySelector(".branch-stage");
  const needsStage = !shell || sequenceArea.dataset.mode !== "branching-story";
  if (needsStage) {
    // Jumping straight to this scroll scene still builds the SAME branching SVG,
    // with the three questions ready for their answer animation.
    renderBranchingStage({ expanded: true });
    shell = sequenceArea.querySelector(".branch-stage");
  }

  // There is no redraw when advancing from 'What comes next?': the exact same
  // circles and arrows stay where they were as their labels are revealed.
  shell?.classList.add("merged", "expanded", "show-outer", "show-predecessors");
  shell?.querySelector(".branch-svg")?.setAttribute(
    "aria-label",
    "Backward Collatz branches: 12 to 6, 80 and 13 to 40, and 84 to 42"
  );

  const showAnswers = () => {
    if (state.scene === "reverse-reveal" && shell?.isConnected) {
      shell.classList.add("revealed-predecessors");
    }
  };
  if (needsStage) {
    // Give the camera time to pull back before drawing the answers.
    state.timers.push(setTimeout(showAnswers, 850));
  } else {
    requestAnimationFrame(() => requestAnimationFrame(showAnswers));
  }

  showStatus("Four possible predecessors · two lead to 40");
}

installBranchStorySteps();

const branchingBaseSetScene = setScene;
setScene = function(scene) {
  if (["revisit-three", "merge-three", "grow-six", "reverse-question", "reverse-reveal"].includes(scene)) {
    if (scene === state.scene) return;
    state.scene = scene;
    hideTransientUI();

    if (scene === "revisit-three") renderRevisitThree();
    if (scene === "merge-three") renderMergeThree();
    if (scene === "grow-six") renderGrowSix();
    if (scene === "reverse-question") renderReverseQuestion();
    if (scene === "reverse-reveal") renderReverseReveal();
    return;
  }

  return branchingBaseSetScene(scene);
};

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
    // Gate redirects are instant. Using 'auto' inherits smooth scrolling
    // from the page and makes the story look like it flies past.
    step.scrollIntoView({ block: "center", behavior: "instant" });
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

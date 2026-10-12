// Polish the post-counterexample transition without disturbing the earlier story.
// Revisit crossfades into the familiar three-row view. The merge then happens
// within the same SVG so nothing snaps between scenes.

function ensureMergePolishStyles() {
  if (document.getElementById("merge-polish-styles")) return;
  const style = document.createElement("style");
  style.id = "merge-polish-styles";
  style.textContent = `
    #sequence-area {
      transition: opacity .38s ease, transform .5s cubic-bezier(.18,.78,.22,1);
    }
    #sequence-area.story-crossfade-out {
      opacity: 0;
      transform: translateY(10px);
    }
    #stage-title {
      transition: opacity .22s ease, transform .32s cubic-bezier(.18,.78,.22,1);
    }
    #stage-title.stage-title-swapping {
      opacity: 0;
      transform: translateY(6px);
    }
    .branch-top-prefix,
    .branch-bottom-prefix {
      transition: transform .95s cubic-bezier(.18,.78,.22,1);
    }
    .branch-stage.merged .branch-top-prefix {
      transform: translateY(56px);
    }
    .branch-stage.merged .branch-bottom-prefix {
      transform: translateY(-56px);
    }
    .branch-duplicates {
      opacity: 1;
      transition: opacity .6s ease .12s;
    }
    .branch-stage.merged .branch-duplicates {
      opacity: 0;
    }
    .branch-merge-diagonal {
      fill: none;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
      opacity: 0;
      transition:
        opacity .12s ease .54s,
        stroke-dashoffset .72s cubic-bezier(.2,.78,.25,1) .54s;
    }
    .branch-stage.merged .branch-merge-diagonal {
      opacity: 1;
      stroke-dashoffset: 0;
    }
  `;
  document.head.appendChild(style);
}

ensureMergePolishStyles();

function smoothStageTitle(text) {
  if (stageTitle.textContent === text) return;
  stageTitle.classList.add("stage-title-swapping");
  window.setTimeout(() => {
    stageTitle.textContent = text;
    stageTitle.classList.remove("stage-title-swapping");
  }, 190);
}

function crossfadeSequence(renderFn) {
  sequenceArea.classList.add("story-crossfade-out");
  window.setTimeout(() => {
    renderFn();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      sequenceArea.classList.remove("story-crossfade-out");
    }));
  }, 330);
}

// Replace the first branching prototype with a geometry that can transform in
// place. The 20 node descends toward the trunk; 21→64→32 rises toward it.
// Duplicate suffixes fade into the already-visible central nodes.
renderBranchingStage = function({ animateMerge = false, expanded = false } = {}) {
  clearTimers();
  ensureBranchingStyles();
  ensureMergePolishStyles();
  sequenceArea.innerHTML = "";
  sequenceArea.dataset.mode = "branching-story";

  const shell = document.createElement("div");
  shell.className = `branch-shell branch-stage${expanded ? " merged expanded" : ""}`;

  const svg = svgElement("svg", {
    class: "branch-svg",
    viewBox: "0 0 1000 360",
    preserveAspectRatio: "xMidYMid meet",
    role: "img",
    "aria-label": "Collatz paths merging into one branching structure"
  });

  const defs = svgElement("defs");
  branchMarker(defs, "polish-arrow-cyan", "#7ae7ff");
  branchMarker(defs, "polish-arrow-violet", "#9f8cff");
  branchMarker(defs, "polish-arrow-pink", "#ff78b8");
  branchMarker(defs, "polish-arrow-gold", "#ffd479");
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
  const topFinalY = topY + 56;
  const bottomFinalY = bottomY - 56;
  const trunkValues = [3, 10, 5, 16, 8, 4, 2, 1];
  const topValues = [20, 10, 5, 16, 8, 4, 2, 1];
  const bottomValues = [21, 64, 32, 16, 8, 4, 2, 1];

  // Central path is the structure the other two eventually join.
  addBranchLabel(world, 105, midY - 42, "START 3", cyan);
  trunkValues.forEach((value, index) => {
    branchNode(world, xs[index], midY, value, cyan, "branch-trunk");
    if (index < trunkValues.length - 1) {
      branchLine(world, xs[index] + 27, midY, xs[index + 1] - 31, midY, cyan, "polish-arrow-cyan", "branch-trunk");
    }
  });

  // The unique part of the upper path is just 20. It physically drops toward
  // the central 10 while its duplicated suffix fades away.
  const topPrefix = svgElement("g", { class: "branch-top-prefix" });
  addBranchLabel(topPrefix, 105, topY - 42, "START 20", violet);
  branchNode(topPrefix, xs[0], topY, 20, violet);
  world.appendChild(topPrefix);

  const topDuplicates = svgElement("g", { class: "branch-duplicates" });
  for (let index = 0; index < topValues.length - 1; index++) {
    branchLine(topDuplicates, xs[index] + 27, topY, xs[index + 1] - 31, topY, violet, "polish-arrow-violet");
  }
  for (let index = 1; index < topValues.length; index++) {
    branchNode(topDuplicates, xs[index], topY, topValues[index], violet);
  }
  world.appendChild(topDuplicates);

  // The unique lower prefix is 21→64→32. It rises as one piece toward 16.
  const bottomPrefix = svgElement("g", { class: "branch-bottom-prefix" });
  addBranchLabel(bottomPrefix, 105, bottomY - 42, "START 21", pink);
  [21, 64, 32].forEach((value, index) => {
    branchNode(bottomPrefix, xs[index], bottomY, value, pink);
    if (index < 2) {
      branchLine(bottomPrefix, xs[index] + 27, bottomY, xs[index + 1] - 31, bottomY, pink, "polish-arrow-pink");
    }
  });
  world.appendChild(bottomPrefix);

  const bottomDuplicates = svgElement("g", { class: "branch-duplicates" });
  branchLine(bottomDuplicates, xs[2] + 27, bottomY, xs[3] - 31, bottomY, pink, "polish-arrow-pink");
  for (let index = 3; index < bottomValues.length; index++) {
    branchNode(bottomDuplicates, xs[index], bottomY, bottomValues[index], pink);
    if (index < bottomValues.length - 1) {
      branchLine(bottomDuplicates, xs[index] + 27, bottomY, xs[index + 1] - 31, bottomY, pink, "polish-arrow-pink");
    }
  }
  world.appendChild(bottomDuplicates);

  // Final connections are deliberately close to 45 degrees.
  const topMerge = svgElement("line", {
    class: "branch-merge-diagonal",
    x1: xs[0] + 27,
    y1: topFinalY,
    x2: xs[1] - 31,
    y2: midY,
    pathLength: 1,
    stroke: violet,
    "marker-end": "url(#polish-arrow-violet)",
    style: `filter:drop-shadow(0 0 5px ${violet}55)`
  });
  world.appendChild(topMerge);

  const bottomMerge = svgElement("line", {
    class: "branch-merge-diagonal",
    x1: xs[2] + 27,
    y1: bottomFinalY,
    x2: xs[3] - 31,
    y2: midY,
    pathLength: 1,
    stroke: pink,
    "marker-end": "url(#polish-arrow-pink)",
    style: `filter:drop-shadow(0 0 5px ${pink}55)`
  });
  world.appendChild(bottomMerge);

  // Counterexamples wait off-stage until the next scroll beat.
  const outerSpecs = [
    { value: 40, y: topFinalY, targetX: xs[0], colour: violet, marker: "polish-arrow-violet" },
    { value: 6, y: midY, targetX: xs[0], colour: cyan, marker: "polish-arrow-cyan" },
    { value: 42, y: bottomFinalY, targetX: xs[0], colour: pink, marker: "polish-arrow-pink" }
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
    state.timers.push(setTimeout(() => shell.classList.add("merged"), 360));
  }
};

renderRevisitThree = function() {
  smoothStageTitle("Revisit the first three paths.");
  crossfadeSequence(() => renderBranchingStage({ animateMerge: false }));
  showStatus("3 paths · 7 steps each");
};

renderMergeThree = function() {
  smoothStageTitle("Watch the paths merge.");
  let shell = sequenceArea.querySelector(".branch-stage");
  if (!shell || sequenceArea.dataset.mode !== "branching-story") {
    renderBranchingStage({ animateMerge: false });
    shell = sequenceArea.querySelector(".branch-stage");
  }
  // No redraw here: the same elements from the revisit scene transform in place.
  state.timers.push(setTimeout(() => shell?.classList.add("merged"), 260));
  showStatus("3 starts · 1 branching path");
};

renderGrowSix = function() {
  smoothStageTitle("Add 6, 40, and 42.");
  let shell = sequenceArea.querySelector(".branch-stage");
  if (!shell || sequenceArea.dataset.mode !== "branching-story") {
    renderBranchingStage({ animateMerge: false });
    shell = sequenceArea.querySelector(".branch-stage");
  }
  shell?.classList.add("merged");
  state.timers.push(setTimeout(() => shell?.classList.add("expanded"), 180));
  state.timers.push(setTimeout(() => shell?.classList.add("show-outer"), 850));
  showStatus("6 starts · 1 connected structure");
};

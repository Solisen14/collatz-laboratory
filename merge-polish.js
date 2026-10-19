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

    /* The unique roots remain absolutely fixed. Only the shared suffixes move. */
    .branch-top-suffix,
    .branch-bottom-suffix {
      opacity: 1;
      transform-box: view-box;
      transform-origin: 0 0;
      transition:
        transform 1s cubic-bezier(.18,.78,.22,1),
        opacity .46s ease .84s;
    }
    .branch-stage.merged .branch-top-suffix {
      transform: translateY(108px);
      opacity: 0;
    }
    .branch-stage.merged .branch-bottom-suffix {
      transform: translateY(-108px);
      opacity: 0;
    }

    /* Horizontal joining arrows disappear as their diagonal replacements grow. */
    .branch-bridge-original {
      opacity: 1;
      transition: opacity .24s ease .28s;
    }
    .branch-stage.merged .branch-bridge-original {
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
        opacity .14s ease .32s,
        stroke-dashoffset .82s cubic-bezier(.2,.78,.25,1) .32s;
    }
    .branch-stage.merged .branch-merge-diagonal {
      opacity: 1;
      stroke-dashoffset: 0;
    }

    /* The extra predecessors live to the left of the established values.
       Zoom the entire branching world down and shift it RIGHT so every
       circle stays inside the standard viewBox at any viewport size.
       No off-canvas SVG coordinates or viewBox swaps are needed. */
    .branch-stage.show-predecessors .branch-world {
      transform: translateX(85px) scale(.76);
    }

    /* The new scene asks visitors to trace the structure backward. */
    .branch-stage .branch-label {
      transition: opacity .4s ease;
    }
    .branch-stage.show-predecessors .branch-label {
      opacity: 0;
    }
    .branch-question {
      opacity: 0;
      transform: translateY(10px);
      transform-box: fill-box;
      transform-origin: center;
      transition:
        opacity .45s ease,
        transform .65s cubic-bezier(.18,.78,.22,1);
    }
    .branch-question[data-target="6"] { transition-delay: .13s; }
    .branch-question[data-target="42"] { transition-delay: .26s; }
    .branch-stage.show-predecessors .branch-question {
      opacity: 1;
      transform: translateY(0);
    }
    .branch-question-arrow {
      stroke-width: 2;
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
      transition: stroke-dashoffset .72s cubic-bezier(.18,.78,.22,1) .28s;
    }
    .branch-stage.show-predecessors .branch-question-arrow {
      stroke-dashoffset: 0;
    }
    .branch-question-node text {
      font-size: 23px;
      font-weight: 750;
      fill: #fff1bc;
    }

    /* Resolve each existing ? in place. Both text layers share the exact
       same SVG circle, so no node is removed or re-created between scenes. */
    .branch-question-mark,
    .branch-question-answer {
      transition: opacity .37s ease, transform .5s ease;
      transform-box: fill-box;
      transform-origin: center;
    }
    .branch-question-mark { opacity: 1; }
    .branch-question-answer {
      opacity: 0;
      transform: translateY(7px);
    }
    .branch-stage.revealed-predecessors .branch-question-mark {
      opacity: 0;
      transform: translateY(-6px);
    }
    .branch-stage.revealed-predecessors .branch-question-answer {
      opacity: 1;
      transform: translateY(0);
    }
    .branch-question[data-target="6"] .branch-question-answer {
      transition-delay: .14s;
    }
    .branch-question[data-target="42"] .branch-question-answer {
      transition-delay: .27s;
    }

    /* A second valid predecessor appears above 80 and joins the SAME 40.
       13 is odd: 3(13) + 1 = 40. The gold branch draws toward 40. */
    .branch-second-predecessor {
      opacity: 0;
      transform: translate(-12px, -9px);
      transition:
        opacity .55s ease .45s,
        transform .75s cubic-bezier(.18,.78,.22,1) .45s;
    }
    .branch-stage.revealed-predecessors .branch-second-predecessor {
      opacity: 1;
      transform: translate(0, 0);
    }
    .branch-second-predecessor-arrow {
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
      transition: stroke-dashoffset .82s cubic-bezier(.2,.78,.25,1) .62s;
    }
    .branch-stage.revealed-predecessors .branch-second-predecessor-arrow {
      stroke-dashoffset: 0;
    }
    @media (prefers-reduced-motion: reduce) {
      .branch-question, .branch-question-arrow, .branch-stage .branch-label,
      .branch-question-mark, .branch-question-answer,
      .branch-second-predecessor, .branch-second-predecessor-arrow {
        transition-duration: .01ms !important;
        transition-delay: 0ms !important;
      }
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

// Geometry for the merge:
// - 20 never moves. Its duplicated 10→...→1 suffix drops onto the middle path.
// - 21→64→32 never moves. Its duplicated 16→...→1 suffix rises onto the middle path.
// - only the joining arrows (20→10 and 32→16) change angle.
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
  const trunkValues = [3, 10, 5, 16, 8, 4, 2, 1];
  const topValues = [20, 10, 5, 16, 8, 4, 2, 1];
  const bottomValues = [21, 64, 32, 16, 8, 4, 2, 1];

  // Central path stays visible throughout and becomes the final shared trunk.
  addBranchLabel(world, 105, midY - 42, "START 3", cyan);
  trunkValues.forEach((value, index) => {
    branchNode(world, xs[index], midY, value, cyan, "branch-trunk");
    if (index < trunkValues.length - 1) {
      branchLine(world, xs[index] + 27, midY, xs[index + 1] - 31, midY, cyan, "polish-arrow-cyan", "branch-trunk");
    }
  });

  // Upper unique root: START 20 and the 20 node stay fixed at their original x/y.
  addBranchLabel(world, 105, topY - 42, "START 20", violet);
  branchNode(world, xs[0], topY, 20, violet);

  // Original 20→10 horizontal bridge. It is replaced by the diagonal bridge.
  branchLine(
    world,
    xs[0] + 27,
    topY,
    xs[1] - 31,
    topY,
    violet,
    "polish-arrow-violet",
    "branch-bridge-original"
  );

  // Everything after 20 moves downward together. Internal geometry does not change.
  const topSuffix = svgElement("g", { class: "branch-top-suffix" });
  for (let index = 1; index < topValues.length; index++) {
    branchNode(topSuffix, xs[index], topY, topValues[index], violet);
    if (index < topValues.length - 1) {
      branchLine(
        topSuffix,
        xs[index] + 27,
        topY,
        xs[index + 1] - 31,
        topY,
        violet,
        "polish-arrow-violet"
      );
    }
  }
  world.appendChild(topSuffix);

  // Lower unique prefix: START 21, 21→64→32 all remain fixed.
  addBranchLabel(world, 105, bottomY - 42, "START 21", pink);
  [21, 64, 32].forEach((value, index) => {
    branchNode(world, xs[index], bottomY, value, pink);
    if (index < 2) {
      branchLine(world, xs[index] + 27, bottomY, xs[index + 1] - 31, bottomY, pink, "polish-arrow-pink");
    }
  });

  // Original 32→16 horizontal bridge. It is replaced by the diagonal bridge.
  branchLine(
    world,
    xs[2] + 27,
    bottomY,
    xs[3] - 31,
    bottomY,
    pink,
    "polish-arrow-pink",
    "branch-bridge-original"
  );

  // Everything after 32 moves upward together onto the central 16→...→1 suffix.
  const bottomSuffix = svgElement("g", { class: "branch-bottom-suffix" });
  for (let index = 3; index < bottomValues.length; index++) {
    branchNode(bottomSuffix, xs[index], bottomY, bottomValues[index], pink);
    if (index < bottomValues.length - 1) {
      branchLine(
        bottomSuffix,
        xs[index] + 27,
        bottomY,
        xs[index + 1] - 31,
        bottomY,
        pink,
        "polish-arrow-pink"
      );
    }
  }
  world.appendChild(bottomSuffix);

  // Final 20→10 bridge: fixed start at 20, moving endpoint represented by the
  // final diagonal into the middle-row 10.
  const topMerge = svgElement("line", {
    class: "branch-merge-diagonal",
    x1: xs[0] + 27,
    y1: topY,
    x2: xs[1] - 31,
    y2: midY,
    pathLength: 1,
    stroke: violet,
    "marker-end": "url(#polish-arrow-violet)",
    style: `filter:drop-shadow(0 0 5px ${violet}55)`
  });
  world.appendChild(topMerge);

  // Final 32→16 bridge: fixed start at 32 into the central-row 16.
  const bottomMerge = svgElement("line", {
    class: "branch-merge-diagonal",
    x1: xs[2] + 27,
    y1: bottomY,
    x2: xs[3] - 31,
    y2: midY,
    pathLength: 1,
    stroke: pink,
    "marker-end": "url(#polish-arrow-pink)",
    style: `filter:drop-shadow(0 0 5px ${pink}55)`
  });
  world.appendChild(bottomMerge);

  // Counterexamples wait off-stage until the next scroll beat. Their targets are
  // the fixed branch roots: 40→20, 6→3, and 42→21.
  const outerSpecs = [
    { value: 40, y: topY, targetX: xs[0], colour: violet, marker: "polish-arrow-violet" },
    { value: 6, y: midY, targetX: xs[0], colour: cyan, marker: "polish-arrow-cyan" },
    { value: 42, y: bottomY, targetX: xs[0], colour: pink, marker: "polish-arrow-pink" }
  ];

  outerSpecs.forEach(spec => {
    const edgeGroup = svgElement("g", { class: "branch-outer" });
    branchLine(edgeGroup, 54, spec.y, spec.targetX - 31, spec.y, spec.colour, spec.marker, "branch-outer-edge");
    world.appendChild(edgeGroup);

    const nodeGroup = svgElement("g", { class: "branch-outer" });
    branchNode(nodeGroup, 28, spec.y, spec.value, gold);
    world.appendChild(nodeGroup);
  });

  // The question marks are one step BEFORE 40, 6, and 42, so each new
  // unknown sits on the LEFT of the corresponding value, along its row.
  // Each arrow points rightward into the existing number's circle.
  // The reverse-question scene scales and shifts the branching world right.
  const predecessorQuestions = [
    { target: 40, answer: 80, nodeY: topY, questionX: -100, questionY: topY, colour: violet, marker: "polish-arrow-violet" },
    { target: 6, answer: 12, nodeY: midY, questionX: -100, questionY: midY, colour: cyan, marker: "polish-arrow-cyan" },
    { target: 42, answer: 84, nodeY: bottomY, questionX: -100, questionY: bottomY, colour: pink, marker: "polish-arrow-pink" }
  ];

  predecessorQuestions.forEach(spec => {
    const targetX = 28;
    const dx = targetX - spec.questionX;
    const dy = spec.nodeY - spec.questionY;
    const distance = Math.hypot(dx, dy);
    const ux = dx / distance;
    const uy = dy / distance;

    const group = svgElement("g", {
      class: "branch-question",
      "data-target": spec.target
    });
    const arrow = svgElement("path", {
      class: "branch-edge branch-question-arrow",
      d: `M ${spec.questionX + ux * 27} ${spec.questionY + uy * 27} L ${targetX - ux * 30} ${spec.nodeY - uy * 30}`,
      pathLength: 1,
      stroke: spec.colour,
      "marker-end": `url(#${spec.marker})`,
      style: `filter:drop-shadow(0 0 5px ${spec.colour}66)`
    });
    group.appendChild(arrow);
    const unknown = branchNode(
      group, spec.questionX, spec.questionY, "?", gold, "branch-question-node"
    );
    unknown.querySelector("text").classList.add("branch-question-mark");
    const revealedNumber = svgElement("text", {
      class: "branch-question-answer", x: spec.questionX, y: spec.questionY
    });
    revealedNumber.textContent = String(spec.answer);
    unknown.appendChild(revealedNumber);
    world.appendChild(group);
  });

  // 40 has one extra predecessor from the odd rule. Keep 80 in the original
  // question-circle position; grow 13 slightly above it, then curve into 40.
  const oddX = -100;
  const oddY = topY - 64;
  const fortyX = 28;
  const vectorX = fortyX - oddX;
  const vectorY = topY - oddY;
  const distance = Math.hypot(vectorX, vectorY);
  const ux = vectorX / distance;
  const uy = vectorY / distance;
  const fromX = oddX + ux * 27;
  const fromY = oddY + uy * 27;
  const toX = fortyX - ux * 29;
  const toY = topY - uy * 29;

  const extraBranch = svgElement("g", {
    class: "branch-second-predecessor",
    "data-target": "40"
  });
  const extraArrow = svgElement("path", {
    class: "branch-edge branch-second-predecessor-arrow",
    d: `M ${fromX} ${fromY} C ${fromX + 34} ${fromY}, ${toX - 34} ${toY}, ${toX} ${toY}`,
    pathLength: 1,
    stroke: gold,
    "marker-end": "url(#polish-arrow-gold)",
    style: `filter:drop-shadow(0 0 5px ${gold}66)`
  });
  extraBranch.appendChild(extraArrow);
  branchNode(extraBranch, oddX, oddY, 13, gold);
  world.appendChild(extraBranch);

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
  shell?.classList.remove("show-predecessors", "revealed-predecessors");
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
  // Rewinding from the next scene hides the question marks again.
  shell?.classList.remove("show-predecessors", "revealed-predecessors");
  shell?.classList.add("merged");
  state.timers.push(setTimeout(() => shell?.classList.add("expanded"), 180));
  state.timers.push(setTimeout(() => shell?.classList.add("show-outer"), 850));
  showStatus("6 starts · 1 connected structure");
};

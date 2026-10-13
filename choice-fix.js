// Scene 3 interaction: keep the full path from 3 visible as a reference,
// while the reader traces 20 and 21 directly from the start nodes above and below it.

(function () {
  const SVG_NS_LOCAL = "http://www.w3.org/2000/svg";
  const TRACE_XS = [110, 225, 340, 455, 570, 685, 800, 915];

  function ensureTraceChoiceStyles() {
    if (document.getElementById("trace-choice-styles")) return;

    const style = document.createElement("style");
    style.id = "trace-choice-styles";
    style.textContent = `
      .trace-choice-shell {
        width: min(1120px, 96vw);
        height: 360px;
        margin: 0 auto;
        opacity: 0;
        transform: translateY(10px);
        transition: opacity .45s ease, transform .65s cubic-bezier(.18,.78,.22,1);
      }

      .trace-choice-shell.visible {
        opacity: 1;
        transform: translateY(0);
      }

      .trace-choice-svg {
        display: block;
        width: 100%;
        height: 360px;
        overflow: visible;
      }

      .trace-choice-start {
        cursor: pointer;
        outline: none;
      }

      .trace-choice-start .trace-hit-ring {
        fill: transparent;
        stroke-width: 1.2;
        opacity: .52;
        transform-box: fill-box;
        transform-origin: center;
        animation: trace-choice-pulse 2s ease-in-out infinite;
      }

      .trace-choice-start.done .trace-hit-ring {
        animation: none;
        opacity: .16;
      }

      .trace-choice-start:focus-visible .trace-hit-ring {
        stroke-width: 2.5;
        opacity: 1;
      }

      @keyframes trace-choice-pulse {
        0%, 100% { transform: scale(1); opacity: .28; }
        50% { transform: scale(1.18); opacity: .72; }
      }

      .trace-choice-node {
        opacity: 0;
        transform: translateX(-7px) scale(.95);
        transform-box: fill-box;
        transform-origin: center;
        transition: opacity .32s ease, transform .46s cubic-bezier(.16,.78,.28,1);
      }

      .trace-choice-node.visible {
        opacity: 1;
        transform: translateX(0) scale(1);
      }

      .trace-choice-node circle,
      .trace-reference-node circle {
        fill: rgba(9,14,22,.97);
        stroke-width: 1.4;
      }

      .trace-choice-node text,
      .trace-reference-node text,
      .trace-choice-start text {
        fill: #f8fbff;
        font: 500 17px Inter, ui-sans-serif, system-ui, sans-serif;
        text-anchor: middle;
        dominant-baseline: central;
        font-variant-numeric: tabular-nums;
        user-select: none;
      }

      .trace-choice-segment {
        opacity: 0;
        transition: opacity .34s ease;
      }

      .trace-choice-segment.visible,
      .trace-reference-segment {
        opacity: 1;
      }

      .trace-choice-segment line,
      .trace-reference-segment line {
        stroke-width: 1.45;
        stroke-linecap: round;
      }

      .trace-reference-row {
        opacity: .92;
      }

      .trace-choice-start-label {
        font: 750 9px Inter, ui-sans-serif, system-ui, sans-serif;
        letter-spacing: .18em;
        text-transform: uppercase;
        opacity: .7;
        text-anchor: middle;
      }

      .trace-choice-instruction {
        font: 700 9px Inter, ui-sans-serif, system-ui, sans-serif;
        letter-spacing: .14em;
        text-transform: uppercase;
        opacity: .58;
        text-anchor: middle;
        transition: opacity .25s ease;
      }

      .trace-choice-start.done .trace-choice-instruction {
        opacity: 0;
      }

      .trace-choice-check {
        opacity: 0;
        font: 800 13px Inter, ui-sans-serif, system-ui, sans-serif;
        transition: opacity .25s ease;
      }

      .trace-choice-start.done .trace-choice-check {
        opacity: .9;
      }
    `;
    document.head.appendChild(style);
  }

  function el(name, attrs = {}) {
    const node = document.createElementNS(SVG_NS_LOCAL, name);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  }

  function addArrowMarker(defs, id, colour) {
    const marker = el("marker", {
      id,
      markerWidth: 9,
      markerHeight: 9,
      refX: 7.6,
      refY: 4.5,
      orient: "auto",
      markerUnits: "userSpaceOnUse"
    });
    marker.appendChild(el("path", { d: "M0,0 L9,4.5 L0,9 Z", fill: colour }));
    defs.appendChild(marker);
  }

  function addCircleNode(parent, x, y, value, colour, className) {
    const group = el("g", { class: className });
    group.appendChild(el("circle", {
      cx: x,
      cy: y,
      r: 25,
      stroke: colour,
      style: `filter:drop-shadow(0 0 9px ${colour}42)`
    }));
    const text = el("text", { x, y });
    text.textContent = value;
    group.appendChild(text);
    parent.appendChild(group);
    return group;
  }

  function addStartLabel(svg, start, y, colour) {
    const label = el("text", {
      class: "trace-choice-start-label",
      x: TRACE_XS[0],
      y: y - 46,
      fill: colour
    });
    label.textContent = `START ${start}`;
    svg.appendChild(label);
  }

  function addTraceRow(svg, start, y, colour, markerId, alreadyTraced) {
    const values = sequences[start];

    const startGroup = el("g", {
      class: `trace-choice-start${alreadyTraced ? " done" : ""}`,
      tabindex: "0",
      role: "button",
      "aria-label": alreadyTraced ? `${start} path traced` : `Trace the path beginning at ${start}`,
      "data-trace-start": start
    });

    startGroup.appendChild(el("circle", {
      class: "trace-hit-ring",
      cx: TRACE_XS[0], cy: y, r: 34, stroke: colour
    }));
    startGroup.appendChild(el("circle", {
      cx: TRACE_XS[0], cy: y, r: 25,
      fill: "rgba(9,14,22,.97)",
      stroke: colour,
      "stroke-width": 1.6,
      style: `filter:drop-shadow(0 0 12px ${colour}55)`
    }));

    const number = el("text", { x: TRACE_XS[0], y });
    number.textContent = start;
    startGroup.appendChild(number);

    const instruction = el("text", {
      class: "trace-choice-instruction",
      x: TRACE_XS[0], y: y + 48, fill: colour
    });
    instruction.textContent = "CLICK TO TRACE";
    startGroup.appendChild(instruction);

    const check = el("text", {
      class: "trace-choice-check",
      x: TRACE_XS[0] + 30, y: y - 29, fill: colour
    });
    check.textContent = "✓";
    startGroup.appendChild(check);
    svg.appendChild(startGroup);

    addStartLabel(svg, start, y, colour);

    for (let index = 0; index < values.length - 1; index++) {
      const segment = el("g", {
        class: `trace-choice-segment${alreadyTraced ? " visible" : ""}`,
        "data-trace-row": start,
        "data-trace-segment": index
      });
      segment.appendChild(el("line", {
        x1: TRACE_XS[index] + 28,
        y1: y,
        x2: TRACE_XS[index + 1] - 31,
        y2: y,
        stroke: colour,
        "marker-end": `url(#${markerId})`,
        style: `filter:drop-shadow(0 0 4px ${colour}38)`
      }));
      svg.appendChild(segment);
    }

    values.slice(1).forEach((value, suffixIndex) => {
      const index = suffixIndex + 1;
      addCircleNode(
        svg,
        TRACE_XS[index],
        y,
        value,
        colour,
        `trace-choice-node${alreadyTraced ? " visible" : ""}`
      ).setAttribute("data-trace-row", start);
    });
  }

  function addReferenceRow(svg, start, y, colour, markerId) {
    const values = sequences[start];
    const row = el("g", { class: "trace-reference-row" });

    addStartLabel(row, start, y, colour);

    for (let index = 0; index < values.length - 1; index++) {
      const segment = el("g", { class: "trace-reference-segment" });
      segment.appendChild(el("line", {
        x1: TRACE_XS[index] + 28,
        y1: y,
        x2: TRACE_XS[index + 1] - 31,
        y2: y,
        stroke: colour,
        "marker-end": `url(#${markerId})`,
        style: `filter:drop-shadow(0 0 4px ${colour}38)`
      }));
      row.appendChild(segment);
    }

    values.forEach((value, index) => {
      addCircleNode(row, TRACE_XS[index], y, value, colour, "trace-reference-node");
    });

    svg.appendChild(row);
  }

  function revealTraceRow(start) {
    const shell = sequenceArea.querySelector(".trace-choice-shell");
    if (!shell) return;

    const segments = [...shell.querySelectorAll(`[data-trace-row="${start}"].trace-choice-segment`)];
    const nodes = [...shell.querySelectorAll(`[data-trace-row="${start}"].trace-choice-node`)];
    const startGroup = shell.querySelector(`[data-trace-start="${start}"]`);

    if (startGroup?.classList.contains("done")) return;
    startGroup?.classList.add("done");
    startGroup?.setAttribute("aria-label", `${start} path traced`);

    segments.forEach((segment, index) => {
      const segmentDelay = 90 + index * 275;
      const nodeDelay = segmentDelay + 190;
      state.timers.push(setTimeout(() => segment.classList.add("visible"), segmentDelay));
      state.timers.push(setTimeout(() => nodes[index]?.classList.add("visible"), nodeDelay));
    });
  }

  function renderTraceChoiceStage() {
    clearTimers();
    ensurePrimaryStyles();
    ensureTraceChoiceStyles();
    hideTransientUI();

    sequenceArea.innerHTML = "";
    sequenceArea.dataset.mode = "trace-choice";

    const shell = document.createElement("div");
    shell.className = "trace-choice-shell";

    const svg = el("svg", {
      class: "trace-choice-svg",
      viewBox: "0 0 1000 360",
      preserveAspectRatio: "xMidYMid meet",
      role: "img",
      "aria-label": "The full path from 3 remains visible while the reader chooses 20 and 21 to trace their Collatz paths above and below it."
    });

    const defs = el("defs");
    addArrowMarker(defs, "trace-arrow-violet", "#9f8cff");
    addArrowMarker(defs, "trace-arrow-cyan", "#7ae7ff");
    addArrowMarker(defs, "trace-arrow-pink", "#ff78b8");
    svg.appendChild(defs);

    addTraceRow(svg, 20, 72, "#9f8cff", "trace-arrow-violet", state.tracedSeven.has(20));
    addReferenceRow(svg, 3, 180, "#7ae7ff", "trace-arrow-cyan");
    addTraceRow(svg, 21, 288, "#ff78b8", "trace-arrow-pink", state.tracedSeven.has(21));

    shell.appendChild(svg);
    sequenceArea.appendChild(shell);
    requestAnimationFrame(() => requestAnimationFrame(() => shell.classList.add("visible")));

    svg.querySelectorAll("[data-trace-start]").forEach(startGroup => {
      const value = Number(startGroup.getAttribute("data-trace-start"));
      const activate = () => chooseSevenDirect(value);
      startGroup.addEventListener("click", activate);
      startGroup.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate();
        }
      });
    });
  }

  function chooseSevenDirect(value) {
    value = Number(value);
    if (![20, 21].includes(value)) return;

    if (!state.tracedSeven.has(value)) {
      state.tracedSeven.add(value);
      revealTraceRow(value);
    }

    choicePanel.classList.add("hidden");
    floatingPrompt.classList.add("hidden");
    stageTitle.textContent = "Trace both paths.";

    if (state.tracedSeven.size === 2) {
      showStatus("2 of 2 paths traced · continue scrolling");
    } else {
      showStatus(`${state.tracedSeven.size} of 2 paths traced`);
    }
  }

  const chooseCard = document.querySelector('.story-step[data-scene="choose-seven"] .step-card');
  if (chooseCard) {
    chooseCard.innerHTML = `
      <p class="step-number">YOUR TURN</p>
      <h3>Trace both paths.</h3>
      <p>Select both 20 and 21 before continuing. Each path will be added to the stage so all three examples can be compared together.</p>
    `;
  }

  renderSevenChoiceScene = function () {
    renderTraceChoiceStage();
    stageTitle.textContent = "Trace both paths.";
    choicePanel.classList.add("hidden");

    if (state.tracedSeven.size === 2) {
      showStatus("2 of 2 paths traced · continue scrolling");
    } else {
      showStatus(`${state.tracedSeven.size} of 2 paths traced`);
    }
  };

  showSevenChoices = function () {
    choicePanel.classList.add("hidden");
  };
})();

// Story copy + visual beats synced from the Google Doc source of truth.
// Loaded after app.js/inline prototype patches and before gate.js so the
// interaction gate knows about the additional scroll scenes.

function ensureStorySyncStyles() {
  if (document.getElementById("story-sync-styles")) return;

  const style = document.createElement("style");
  style.id = "story-sync-styles";
  style.textContent = `
    .script-rule-card .rule-lines {
      margin-top: 18px;
    }

    .story-cinematic-trigger .step-card {
      opacity: 0;
      pointer-events: none;
    }

    .rule-explain-shell {
      width: min(1120px, 94vw);
      margin: 0 auto;
      display: grid;
      gap: 18px;
      opacity: 0;
      transform: translateY(12px);
      transition: opacity .5s ease, transform .7s cubic-bezier(.18,.78,.22,1);
    }

    .rule-explain-shell.visible {
      opacity: 1;
      transform: translateY(0);
    }

    .rule-legend {
      display: flex;
      justify-content: center;
      gap: 14px;
      flex-wrap: wrap;
    }

    .rule-chip {
      display: inline-flex;
      align-items: baseline;
      gap: 10px;
      padding: 9px 14px;
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 999px;
      background: rgba(7,11,18,.72);
      backdrop-filter: blur(10px);
      font-size: 12px;
      letter-spacing: .08em;
      text-transform: uppercase;
    }

    .rule-chip strong {
      font-size: 16px;
      letter-spacing: 0;
      text-transform: none;
      font-weight: 600;
    }

    .rule-chip.even { color: #7ae7ff; border-color: rgba(122,231,255,.28); }
    .rule-chip.odd { color: #ffd479; border-color: rgba(255,212,121,.28); }

    .rule-path-svg {
      width: 100%;
      height: 210px;
      overflow: visible;
      display: block;
    }

    .rule-path-node {
      opacity: .32;
      transition: opacity .32s ease, filter .32s ease;
    }

    .rule-path-node.active,
    .rule-path-node.done {
      opacity: 1;
    }

    .rule-path-node circle {
      fill: rgba(9,14,22,.97);
      stroke-width: 1.4;
    }

    .rule-path-node text {
      fill: #f8fbff;
      font: 500 17px Inter, ui-sans-serif, system-ui, sans-serif;
      text-anchor: middle;
      dominant-baseline: central;
    }

    .rule-path-segment line {
      stroke-width: 1.7;
      stroke-linecap: round;
      opacity: .14;
      transition: opacity .32s ease, filter .32s ease;
    }

    .rule-path-segment polygon {
      opacity: .14;
      transition: opacity .32s ease, filter .32s ease;
    }

    .rule-path-segment .rule-op-label {
      opacity: 0;
      transition: opacity .28s ease;
      font: 700 10px Inter, ui-sans-serif, system-ui, sans-serif;
      letter-spacing: .06em;
      text-anchor: middle;
    }

    .rule-path-segment.active line,
    .rule-path-segment.done line,
    .rule-path-segment.active polygon,
    .rule-path-segment.done polygon,
    .rule-path-segment.active .rule-op-label,
    .rule-path-segment.done .rule-op-label {
      opacity: 1;
    }

    .rule-path-segment.active line,
    .rule-path-segment.active polygon {
      filter: drop-shadow(0 0 8px currentColor);
    }

    .conjecture-stage {
      width: min(1120px, 94vw);
      min-height: 370px;
      margin: 0 auto;
      display: grid;
      place-items: center;
      text-align: center;
      opacity: 0;
      transform: translateY(18px) scale(.985);
      transition: opacity .55s ease, transform .9s cubic-bezier(.18,.78,.22,1);
    }

    .conjecture-stage.visible {
      opacity: 1;
      transform: translateY(0) scale(1);
    }

    .conjecture-stage-inner {
      position: relative;
      width: min(980px, 100%);
      padding: 42px 34px 46px;
      border: 1px solid rgba(159,140,255,.24);
      border-radius: 26px;
      background:
        radial-gradient(circle at 50% 15%, rgba(159,140,255,.14), transparent 45%),
        rgba(7,10,17,.66);
      box-shadow: 0 30px 100px rgba(0,0,0,.28), inset 0 0 80px rgba(159,140,255,.04);
      overflow: hidden;
    }

    .conjecture-stage-inner::before {
      content: "?";
      position: absolute;
      right: 2%;
      top: -24%;
      font: 800 290px/1 Inter, ui-sans-serif, system-ui, sans-serif;
      color: rgba(159,140,255,.045);
      pointer-events: none;
    }

    .conjecture-eyebrow {
      margin: 0 0 22px;
      color: #9f8cff;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: .22em;
      text-transform: uppercase;
    }

    .conjecture-rules {
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 26px;
    }

    .conjecture-rule {
      padding: 8px 13px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,.12);
      background: rgba(255,255,255,.025);
      font-size: 13px;
      color: rgba(248,251,255,.78);
    }

    .conjecture-rule strong { color: #fff; font-weight: 650; }

    .conjecture-statement {
      margin: 0 auto;
      max-width: 820px;
      color: #f8fbff;
      font-size: clamp(32px, 4.7vw, 66px);
      line-height: 1.02;
      font-weight: 640;
      letter-spacing: -.045em;
    }

    .conjecture-statement .emphasis {
      color: #ffd479;
      white-space: nowrap;
    }

    @media (max-width: 760px) {
      .rule-path-svg { height: 180px; }
      .conjecture-stage-inner { padding: 34px 20px 38px; }
      .conjecture-statement { font-size: clamp(30px, 10vw, 48px); }
    }
  `;
  document.head.appendChild(style);
}

function setStoryCard(scene, html) {
  const card = document.querySelector(`.story-step[data-scene="${scene}"] .step-card`);
  if (card) card.innerHTML = html;
}

function syncStoryCopy() {
  const heroSub = document.querySelector(".hero-sub");
  if (heroSub) heroSub.textContent = "Discover and Explore the Collatz Conjecture.";

  setStoryCard("intro", `
    <p class="step-number">01.1</p>
    <h3>BEGIN WITH A SINGLE POSITIVE INTEGER</h3>
    <p>Let’s start with 3.</p>
    <p>Scroll slowly. The sequence will build from left to right.</p>
  `);

  setStoryCard("three-3", `
    <p class="step-number">PAUSE</p>
    <h3>What is the pattern you notice?</h3>
    <p>Can you predict the next number in this sequence?</p>
  `);

  setStoryCard("reveal-rule", `
    <p class="step-number">CAN YOU MAKE A PREDICTION</p>
    <h3>As the sequence unfolded, could you predict what was happening?</h3>
    <p>What number comes next?</p>
  `);

  setStoryCard("finish-three", `
    <p class="step-number">7 STEPS</p>
    <h3>My sequence reaches a value of 1, given an initial value of 3.</h3>
    <p>Was your rule correct?</p>
  `);

  setStoryCard("choose-seven", `
    <p class="step-number">YOUR TURN</p>
    <h3>Trace both paths.</h3>
    <p>Select both 20 and 21 before continuing. Each path will be added to the stage so all three examples can be compared together.</p>
    <div style="display:flex; gap:12px; margin-top:20px;">
      <button class="choice-button" type="button" onclick="const b=document.querySelector('#choice-panel [data-seven=\'20\']'); if(b){b.click(); this.classList.add('done'); this.textContent='20 ✓';}">20</button>
      <button class="choice-button" type="button" onclick="const b=document.querySelector('#choice-panel [data-seven=\'21\']'); if(b){b.click(); this.classList.add('done'); this.textContent='21 ✓';}">21</button>
    </div>
  `);

  setStoryCard("conjecture", `
    <p class="step-number">A FIRST CONJECTURE</p>
    <h3>Under these rules, every positive integer reaches 1 after exactly 7 steps.</h3>
    <p>Three examples agree. Is that enough?</p>
  `);

  setStoryCard("test-conjecture", `
    <p class="step-number">TEST IT</p>
    <h3>Let’s test the conjecture.</h3>
    <p>Select 6, 40, and 42 before continuing. What do you notice? Is our conjecture correct?</p>
    <div style="display:flex; gap:12px; margin-top:20px;">
      <button class="choice-button test-card-choice" type="button" data-test-card="6" onclick="triggerTestChoice(6, this)">6</button>
      <button class="choice-button test-card-choice" type="button" data-test-card="40" onclick="triggerTestChoice(40, this)">40</button>
      <button class="choice-button test-card-choice" type="button" data-test-card="42" onclick="triggerTestChoice(42, this)">42</button>
    </div>
  `);

  setStoryCard("refine", `
    <p class="step-number">REFINE THE CONJECTURE</p>
    <h3>Exactly 7 steps fails.</h3>
    <p>But every path we have tested still reaches 1.</p>
  `);
}

function createScriptStep(scene, className, html) {
  const article = document.createElement("article");
  article.className = `story-step ${className}`.trim();
  article.dataset.scene = scene;
  article.innerHTML = html;
  return article;
}

function installScriptScenes() {
  if (!storySteps.some(step => step.dataset.scene === "collatz-rules")) {
    const finish = storySteps.find(step => step.dataset.scene === "finish-three");
    if (finish) {
      const rules = createScriptStep("collatz-rules", "tall-step", `
        <div class="step-card rule-card script-rule-card">
          <p class="step-number">THE COLLATZ RULES</p>
          <h3>Two rules drive the sequence.</h3>
          <div class="rule-lines">
            <p><span>EVEN</span><strong>n ÷ 2</strong></p>
            <p><span>ODD</span><strong>3n + 1</strong></p>
          </div>
        </div>
      `);
      finish.after(rules);
      const index = storySteps.indexOf(finish);
      storySteps.splice(index + 1, 0, rules);
    }
  }

  if (!storySteps.some(step => step.dataset.scene === "conjecture-big")) {
    const conjecture = storySteps.find(step => step.dataset.scene === "conjecture");
    if (conjecture) {
      const big = createScriptStep("conjecture-big", "tall-step story-cinematic-trigger", `
        <div class="step-card" aria-hidden="true"><p>Conjecture visual</p></div>
      `);
      conjecture.after(big);
      const index = storySteps.indexOf(conjecture);
      storySteps.splice(index + 1, 0, big);
    }
  }
}

function renderRuleExplanation() {
  clearTimers();
  ensureStorySyncStyles();
  sequenceArea.innerHTML = "";
  sequenceArea.dataset.mode = "rule-explanation";

  const shell = document.createElement("div");
  shell.className = "rule-explain-shell";
  shell.innerHTML = `
    <div class="rule-legend" aria-hidden="true">
      <div class="rule-chip odd"><span>ODD</span><strong>3n + 1</strong></div>
      <div class="rule-chip even"><span>EVEN</span><strong>n ÷ 2</strong></div>
    </div>
  `;

  const svg = svgElement("svg", {
    class: "rule-path-svg",
    viewBox: "0 0 1000 210",
    preserveAspectRatio: "xMidYMid meet",
    role: "img",
    "aria-label": "The path from 3 to 1, coloured by which Collatz rule is used at each step"
  });

  const values = sequences[3];
  const left = 54;
  const right = 946;
  const y = 112;
  const radius = 27;
  const xs = Array.from({ length: values.length }, (_, i) => left + (right - left) * i / (values.length - 1));

  values.forEach((value, index) => {
    if (index < values.length - 1) {
      const odd = value % 2 !== 0;
      const colour = odd ? "#ffd479" : "#7ae7ff";
      const x1 = xs[index] + radius + 7;
      const circleLeft = xs[index + 1] - radius;
      const arrowTip = circleLeft - 7;
      const lineEnd = arrowTip - 10;
      const mid = (x1 + arrowTip) / 2;

      const group = svgElement("g", {
        class: `rule-path-segment ${odd ? "odd" : "even"}`,
        "data-rule-index": index,
        style: `color:${colour}`
      });
      const line = svgElement("line", { x1, y1: y, x2: lineEnd, y2: y, stroke: colour });
      const arrow = svgElement("polygon", {
        points: `${arrowTip},${y} ${arrowTip - 10},${y - 5.5} ${arrowTip - 10},${y + 5.5}`,
        fill: colour
      });
      const label = svgElement("text", {
        class: "rule-op-label",
        x: mid,
        y: y - 31,
        fill: colour
      });
      label.textContent = odd ? "3n + 1" : "n ÷ 2";
      group.append(line, arrow, label);
      svg.appendChild(group);
    }

    const isFinal = index === values.length - 1;
    const odd = !isFinal && value % 2 !== 0;
    const colour = isFinal ? "#f8fbff" : (odd ? "#ffd479" : "#7ae7ff");
    const node = svgElement("g", {
      class: "rule-path-node",
      "data-rule-node": index
    });
    const circle = svgElement("circle", {
      cx: xs[index], cy: y, r: radius, stroke: colour,
      style: `filter:drop-shadow(0 0 10px ${colour}45)`
    });
    const text = svgElement("text", { x: xs[index], y });
    text.textContent = value;
    node.append(circle, text);
    svg.appendChild(node);
  });

  shell.appendChild(svg);
  sequenceArea.appendChild(shell);
  requestAnimationFrame(() => shell.classList.add("visible"));

  const segments = [...svg.querySelectorAll(".rule-path-segment")];
  const nodes = [...svg.querySelectorAll(".rule-path-node")];
  nodes[0]?.classList.add("active");

  segments.forEach((segment, index) => {
    const start = 260 + index * 420;
    state.timers.push(setTimeout(() => {
      nodes[index]?.classList.remove("active");
      nodes[index]?.classList.add("done");
      segment.classList.add("active");
    }, start));
    state.timers.push(setTimeout(() => {
      segment.classList.remove("active");
      segment.classList.add("done");
      nodes[index + 1]?.classList.add("active");
    }, start + 300));
  });

  state.timers.push(setTimeout(() => {
    nodes.forEach(node => {
      node.classList.remove("active");
      node.classList.add("done");
    });
  }, 260 + segments.length * 420));
}

function renderBigConjecture() {
  clearTimers();
  ensureStorySyncStyles();
  sequenceArea.innerHTML = "";
  sequenceArea.dataset.mode = "big-conjecture";

  const visual = document.createElement("div");
  visual.className = "conjecture-stage";
  visual.innerHTML = `
    <div class="conjecture-stage-inner">
      <p class="conjecture-eyebrow">A FIRST CONJECTURE</p>
      <div class="conjecture-rules">
        <div class="conjecture-rule"><strong>EVEN</strong> → n ÷ 2</div>
        <div class="conjecture-rule"><strong>ODD</strong> → 3n + 1</div>
      </div>
      <p class="conjecture-statement">
        Every positive integer reaches 1 in <span class="emphasis">exactly 7 steps.</span>
      </p>
    </div>
  `;
  sequenceArea.appendChild(visual);
  requestAnimationFrame(() => requestAnimationFrame(() => visual.classList.add("visible")));
}

ensureStorySyncStyles();
syncStoryCopy();
installScriptScenes();

const storySyncBaseSetScene = setScene;
setScene = function(scene) {
  if (scene === state.scene) return;

  if (scene === "reveal-rule") {
    state.scene = scene;
    hideTransientUI();
    stageTitle.textContent = "Can you make a prediction?";
    revealPrimaryPath(4);
    showPrompt("What number comes next?");
    return;
  }

  if (scene === "collatz-rules") {
    state.scene = scene;
    hideTransientUI();
    stageTitle.textContent = "The Collatz rules.";
    renderRuleExplanation();
    showStatus("Odd: 3n + 1 · Even: n ÷ 2");
    return;
  }

  if (scene === "conjecture-big") {
    state.scene = scene;
    hideTransientUI();
    stageTitle.textContent = "A conjecture emerges.";
    renderBigConjecture();
    return;
  }

  return storySyncBaseSetScene(scene);
};

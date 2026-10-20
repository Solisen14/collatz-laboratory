// Collatz Laboratory: cinematic tree from many starting values to the cycle.
// Designed as one persistent SVG so each scroll scene morphs the SAME drawing.
(function () {
  "use strict";

  const SCENES = ["tree-rise", "tree-converge", "tree-loop", "tree-formal"];
  const SEEDS = [640, 53, 48, 68, 69, 168, 113, 256];
  const SPINE = new Set([256, 128, 64, 32, 16, 8, 4, 2, 1]);
  const NS = "http://www.w3.org/2000/svg";
  const X_COLUMNS = [
    [[640, 320, 160, 80, 40, 20, 10, 5], 390],
    [[48, 24, 12, 6, 3], 270],
    [[68, 34, 17], 225],
    [[69], 60],
    [[208, 104, 52, 26, 13], 155],
    [[53], 630],
    [[168, 84, 42, 21], 735],
    [[113], 940],
    [[340, 170, 85], 835],
    [[256, 128, 64, 32, 16, 8, 4, 2, 1], 520]
  ];
  const BY_X = new Map();
  X_COLUMNS.forEach(function (pair) {
    pair[0].forEach(function (number) { BY_X.set(number, pair[1]); });
  });

  const STEP_HEIGHT = 43;
  const BOTTOM_Y = 736;
  const NODE_RADIUS = 17;
  const MAX_DEPTH = 14;
  const VALUES = new Set();
  const DIST = new Map([[1, 0]]);
  let drawing = null;
  let exitTimer = null;
  let convergeTimer = null;

  function nextValue(value) {
    return value % 2 === 0 ? value / 2 : 3 * value + 1;
  }
  function stepsToOne(number) {
    if (DIST.has(number)) return DIST.get(number);
    const value = nextValue(number);
    const count = 1 + stepsToOne(value);
    DIST.set(number, count);
    return count;
  }
  SEEDS.forEach(function (seed) {
    let n = seed;
    let guard = 0;
    while (n !== 1 && guard++ < 100) {
      VALUES.add(n);
      n = nextValue(n);
    }
    if (n !== 1) throw new Error("Invalid Collatz tree seed.");
    VALUES.add(1);
  });

  // Fail before rendering if any branch would violate the two established
  // rules or if an even arrow would not be perfectly vertical.
  VALUES.forEach(function (n) {
    if (!BY_X.has(n)) throw new Error("Missing tree layout for " + n);
    if (n === 1) return;
    const to = nextValue(n);
    if (!VALUES.has(to)) throw new Error("Broken tree edge " + n);
    if (n % 2 === 0 && BY_X.get(n) !== BY_X.get(to)) {
      throw new Error("Division arrow must be vertical: " + n);
    }
    if (n % 2 === 1 && BY_X.get(n) === BY_X.get(to)) {
      throw new Error("Odd-rule arrow must be diagonal: " + n);
    }
  });

  function coord(n) {
    return { x: BY_X.get(n), y: BOTTOM_Y - STEP_HEIGHT * stepsToOne(n) };
  }
  function element(tag, attributes, parent, text) {
    const el = document.createElementNS(NS, tag);
    Object.entries(attributes || {}).forEach(function (entry) {
      el.setAttribute(entry[0], String(entry[1]));
    });
    if (text != null) el.textContent = String(text);
    if (parent) parent.appendChild(el);
    return el;
  }

  function createStyle() {
    if (document.getElementById("collatz-tree-story-styles")) return;
    const css = document.createElement("style");
    css.id = "collatz-tree-story-styles";
    css.textContent = [
      ".collatz-tree-story { position:absolute; z-index:7; top:10vh; bottom:7vh; left:2vw; right:36vw; display:grid; place-items:center; pointer-events:none; opacity:0; transform:translateY(112vh); transition:transform 1.8s cubic-bezier(.16,.84,.2,1), opacity .65s ease; }",
      ".collatz-tree-story.visible { opacity:1; transform:translateY(0); }",
      ".collatz-tree-story.outgoing { opacity:0; transform:translateY(-30vh) scale(.88); }",
      ".collatz-tree-svg { display:block; width:100%; height:100%; overflow:visible; transition:transform 1.4s cubic-bezier(.16,.84,.2,1), opacity 1s ease; }",
      ".collatz-tree-story .tree-heading { fill:#8593ad; font:700 15px Inter,system-ui,sans-serif; letter-spacing:2.5px; }",
      ".collatz-tree-story .tree-key { fill:#a3adbf; font:500 15px Inter,system-ui,sans-serif; }",
      ".collatz-tree-story .tree-node circle { fill:#0a101b; stroke-width:2; }",
      ".collatz-tree-story .tree-node text { fill:#f5faff; font:600 19px Inter,system-ui,sans-serif; text-anchor:middle; dominant-baseline:central; font-variant-numeric:tabular-nums; }",
      ".collatz-tree-story .tree-node.tree-spine circle { stroke:#7ae7ff; filter:drop-shadow(0 0 5px #7ae7ff50); }",
      ".collatz-tree-story .tree-node.tree-side circle { stroke:#9f8cff; }",
      ".collatz-tree-story .tree-node.tree-tip circle { stroke:#ff78b8; filter:drop-shadow(0 0 4px #ff78b856); }",
      ".collatz-tree-story .tree-edge { fill:none; stroke-width:2; stroke-linecap:round; }",
      ".collatz-tree-story .tree-edge.even { stroke:#7ae7ff; }",
      ".collatz-tree-story .tree-edge.odd { stroke:#ffd479; }",
      ".collatz-tree-story .tree-edge.tree-spine { stroke-width:2.9; filter:drop-shadow(0 0 5px #7ae7ff80); }",
      ".collatz-tree-story .tree-side { transition:opacity 1.4s ease; }",
      ".collatz-tree-story .tree-structure { transform-box:view-box; transform-origin:52% 87%; transition:transform 2.2s cubic-bezier(.16,.84,.2,1); }",
      ".collatz-tree-story.phase-converge.is-collapsed .tree-structure, .collatz-tree-story.phase-loop .tree-structure, .collatz-tree-story.phase-formal .tree-structure { transform:translateY(19px) scale(.79); }",
      ".collatz-tree-story.phase-converge.is-collapsed .tree-side { opacity:.20; }",
      ".collatz-tree-story.phase-loop .tree-side, .collatz-tree-story.phase-formal .tree-side { opacity:.12; }",
      ".collatz-tree-story .tree-edge-trace { fill:none; stroke:#fff3b5; stroke-width:4; opacity:0; stroke-dasharray:1; stroke-dashoffset:1; filter:drop-shadow(0 0 7px #ffd479); }",
      ".collatz-tree-story.phase-converge .tree-edge-trace { animation:tree-flow-pulse .8s ease forwards; animation-delay:var(--flow-delay); }",
      "@keyframes tree-flow-pulse { 0%{opacity:0;stroke-dashoffset:1} 20%{opacity:.85} 80%{opacity:.85} 100%{opacity:0;stroke-dashoffset:0} }",
      ".collatz-tree-story .tree-loop { opacity:0; transition:opacity 1s ease .25s; }",
      ".collatz-tree-story.phase-loop .tree-loop, .collatz-tree-story.phase-formal .tree-loop { opacity:1; }",
      ".collatz-tree-story .tree-loop-arrow { fill:none; stroke:#ffd479; stroke-width:3; stroke-linecap:round; stroke-linejoin:round; stroke-dasharray:1; stroke-dashoffset:1; transition:stroke-dashoffset 1.3s ease .35s; filter:drop-shadow(0 0 7px #ffd47965); }",
      ".collatz-tree-story.phase-loop .tree-loop-arrow, .collatz-tree-story.phase-formal .tree-loop-arrow { stroke-dashoffset:0; }",
      ".collatz-tree-story.phase-formal .collatz-tree-svg { transform:translateX(-5%) scale(.81); opacity:.75; }",
      "#sequence-area.tree-story-underlay { opacity:0; transform:translateY(calc(-50% - 95px)) scale(.84); pointer-events:none; }",
      ".collatz-tree-story.phase-converge .tree-node[data-value='1'] circle, .collatz-tree-story.phase-loop .tree-node[data-value='1'] circle { filter:drop-shadow(0 0 12px #7ae7ff); }",
      "@media(max-width:760px) { .collatz-tree-story { left:1vw; right:8vw; top:10vh; bottom:27vh; } .collatz-tree-story.phase-formal { opacity:.28; } }",
      "@media(prefers-reduced-motion:reduce) { .collatz-tree-story, .collatz-tree-svg, .collatz-tree-story .tree-structure, .collatz-tree-story .tree-loop-arrow, .collatz-tree-story .tree-side { transition-duration:.01ms!important; } .collatz-tree-story.phase-converge .tree-edge-trace { animation:none; } }"
    ].join("\n");
    document.head.appendChild(css);
  }

  function makeDrawing() {
    createStyle();
    const sticky = document.querySelector(".sticky-stage");
    const container = document.createElement("div");
    container.className = "collatz-tree-story";
    container.setAttribute("aria-label", "Collatz tree with eight starting values converging to 1");
    const picture = element("svg", {
      class: "collatz-tree-svg", viewBox: "0 0 1040 820",
      preserveAspectRatio: "xMidYMid meet", role: "img",
      "aria-label": "Eight positive-integer Collatz paths with a vertical power-of-two backbone"
    }, container);
    const defs = element("defs", {}, picture);
    [["even", "#7ae7ff"], ["odd", "#ffd479"]].forEach(function (pair) {
      const marker = element("marker", {
        id: "tree-story-arrow-" + pair[0], markerWidth:8, markerHeight:8,
        refX:7, refY:4, orient:"auto", markerUnits:"userSpaceOnUse"
      }, defs);
      element("path", { d:"M0 0 L8 4 L0 8 Z", fill:pair[1] }, marker);
    });
    element("text", { x:20, y:32, class:"tree-heading" }, picture,
      "EIGHT STARTING VALUES · ONE SHARED DESTINATION");
    element("text", { x:20, y:63, class:"tree-key" }, picture, "↓ EVEN  n ÷ 2");
    element("text", { x:215, y:63, class:"tree-key", fill:"#ffd479" }, picture,
      "↘ ODD  3n + 1");

    const structure = element("g", { class:"tree-structure" }, picture);
    const edges = element("g", { class:"tree-edges" }, structure);
    const traces = element("g", { class:"tree-traces" }, structure);
    const labels = element("g", { class:"tree-nodes" }, structure);
    const ordered = [...VALUES].sort(function(a,b) {
      return stepsToOne(b) - stepsToOne(a) || a-b;
    });
    const tipSet = new Set(SEEDS);
    ordered.forEach(function (n) {
      if (n === 1) return;
      const target = nextValue(n);
      const a = coord(n), b = coord(target);
      const dx = b.x-a.x, dy = b.y-a.y;
      const magnitude = Math.hypot(dx,dy);
      const ux=dx/magnitude, uy=dy/magnitude;
      const x1=a.x+ux*(NODE_RADIUS+2), y1=a.y+uy*(NODE_RADIUS+2);
      const x2=b.x-ux*(NODE_RADIUS+7), y2=b.y-uy*(NODE_RADIUS+7);
      const odd=n%2!==0;
      const rule=odd?"odd":"even";
      const d="M "+x1+" "+y1+" L "+x2+" "+y2;
      const classes="tree-edge "+rule+" "+(SPINE.has(n)?"tree-spine":"tree-side");
      element("path", {
        d:d, class:classes,
        "marker-end":"url(#tree-story-arrow-"+rule+")",
        "data-from":n, "data-to":target
      },edges);
      element("path", {
        d:d, class:"tree-edge-trace",
        pathLength:"1",
        style:"--flow-delay:"+((MAX_DEPTH-stepsToOne(n))*.15).toFixed(2)+"s"
      },traces);
    });

    ordered.forEach(function(n) {
      const p=coord(n), central=SPINE.has(n);
      const classes="tree-node "+(central?"tree-spine":"tree-side")+
        (tipSet.has(n)?" tree-tip":"");
      const group=element("g", { class:classes, "data-value":n },labels);
      element("circle", { cx:p.x, cy:p.y, r:NODE_RADIUS },group);
      element("text", { x:p.x, y:p.y+1 },group,n);
    });

    // After reaching 1, the odd rule returns to 4. These are two STRAIGHT
    // segments beside the vertical 4 → 2 → 1 trunk, not a curved arrow.
    const loop=element("g", { class:"tree-loop" },structure);
    const one=coord(1), four=coord(4);
    const loopPath="M "+(one.x+NODE_RADIUS)+" "+(one.y-5)+
      " L "+(one.x+100)+" "+(one.y-48)+
      " L "+(four.x+NODE_RADIUS+4)+" "+(four.y+7);
    element("path",{
      d:loopPath, class:"tree-loop-arrow", pathLength:"1",
      "marker-end":"url(#tree-story-arrow-odd)"
    },loop);
    element("text",{
      x:one.x+98, y:one.y-89, fill:"#ffd479",
      "text-anchor":"middle", style:"font:700 17px Inter,system-ui,sans-serif;"
    },loop,"1 → 4");

    sticky.appendChild(container);
    return container;
  }

  const sceneInfo = {
    "tree-rise": { title:"The tree keeps growing.", chapter:"12", kicker:"A LARGER COLLATZ TREE", status:"8 starting values · 1 connected tree" },
    "tree-converge": { title:"Many paths. One destination.", chapter:"13", kicker:"FOLLOW THE PATHS TO 1", status:"Every displayed path reaches 1" },
    "tree-loop": { title:"And then the sequence repeats.", chapter:"14", kicker:"THE 4–2–1 CYCLE", status:"1 → 4 → 2 → 1" },
    "tree-formal": { title:"The Collatz Conjecture", chapter:"15", kicker:"THE MATHEMATICAL QUESTION", status:"Still unproved" }
  };
  function updateHeader(scene) {
    const info=sceneInfo[scene];
    const heading=document.getElementById("stage-title");
    const chapter=document.querySelector(".stage-heading .chapter");
    const kicker=document.querySelector(".stage-heading .kicker");
    if (heading) heading.textContent=info.title;
    if (chapter) chapter.textContent=info.chapter;
    if (kicker) kicker.textContent=info.kicker;
    showStatus(info.status);
  }
  function enterScene(scene) {
    window.clearTimeout(exitTimer);
    window.clearTimeout(convergeTimer);
    const newlyCreated = !drawing || !drawing.isConnected;
    if (newlyCreated) drawing=makeDrawing();
    drawing.classList.remove("outgoing");
    if (newlyCreated) {
      // A fresh SVG must first paint below the viewport. On the next
      // rendered frame it can visibly travel upward into position.
      requestAnimationFrame(function(){
        requestAnimationFrame(function(){
          if (drawing && SCENES.includes(state.scene)) {
            drawing.classList.add("visible");
          }
        });
      });
    } else {
      drawing.classList.add("visible");
    }
    drawing.classList.remove("phase-converge", "phase-loop", "phase-formal", "is-collapsed");
    document.getElementById("sequence-area").classList.add("tree-story-underlay");
    if (scene==="tree-converge") {
      drawing.classList.add("phase-converge");
      convergeTimer=window.setTimeout(function(){
        if (state.scene==="tree-converge") drawing.classList.add("is-collapsed");
      },2100);
    }
    if (scene==="tree-loop") drawing.classList.add("phase-loop","is-collapsed");
    if (scene==="tree-formal") drawing.classList.add("phase-formal","is-collapsed");
    updateHeader(scene);
  }
  function leaveTree(next) {
    window.clearTimeout(convergeTimer);
    if (!drawing || !drawing.isConnected) return;
    drawing.classList.add("outgoing");
    drawing.classList.remove("visible");
    document.getElementById("sequence-area").classList.remove("tree-story-underlay");
    window.clearTimeout(exitTimer);
    const disappearing=drawing;
    exitTimer=window.setTimeout(function(){
      if (disappearing===drawing && !SCENES.includes(state.scene)) {
        disappearing.remove();
        drawing=null;
      }
    },1200);
  }

  const originalSetScene=setScene;
  setScene=function(scene){
    if (SCENES.includes(scene)) {
      // Respect the existing requirements to test 20/21 and 6/40/42 first.
      if (typeof requiredGateFor==="function" && requiredGateFor(scene)) {
        return originalSetScene(scene);
      }
      if (state.scene===scene) return;
      state.scene=scene;
      hideTransientUI();
      enterScene(scene);
      return;
    }
    const leaving=SCENES.includes(state.scene);
    const result=originalSetScene(scene);
    if (leaving && !SCENES.includes(state.scene)) leaveTree(scene);
    return result;
  };
})();

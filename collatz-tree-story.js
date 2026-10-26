
// Collatz Laboratory: eight real trajectories in a non-crossing tree.
// The scrolling viewport moves continuously; the SVG is not recreated between scenes.
(function () {
  "use strict";
  const SCENES = ["tree-rise", "tree-converge", "tree-loop", "tree-formal"];
  const SEEDS = [48, 68, 69, 640, 106, 168, 113, 512];
  const SPINE = new Set([512,256,128,64,32,16,8,4,2,1]);
  const COLUMNS = [
    [[48,24,12,6,3],70],
    [[68,34,17],170],
    [[208,104,52,26,13],270],
    [[69],330],
    [[640,320,160,80,40,20,10,5],380],
    [[512,256,128,64,32,16,8,4,2,1],520],
    [[106,53],620],
    [[340,170,85],850],
    [[113],960],
    [[168,84,42,21],1020]
  ];
  const X = new Map();
  COLUMNS.forEach(function(column) {
    column[0].forEach(function(number) { X.set(number,column[1]); });
  });
  const NS = "http://www.w3.org/2000/svg";
  const DIST = new Map([[1,0]]);
  const RADIUS = 18;
  const BOTTOM = 1000;
  const STEP = 80;
  const BELOW = 780, UPPER = 220, ONE = -580;
  let drawing = null, exitTimer = null, loopTimers = [];
  let cameraTicking = false;

  function nextValue(n) { return n % 2 === 0 ? n / 2 : 3 * n + 1; }
  function distance(n) {
    if (DIST.has(n)) return DIST.get(n);
    const result = 1 + distance(nextValue(n));
    DIST.set(n,result);
    return result;
  }
  function pos(n) { return { x:X.get(n),y:BOTTOM-STEP*distance(n) }; }

  // Guard against accidental invalid or diagonal divide-by-two arrows.
  X.forEach(function(x,n) {
    if(n===1) return;
    const next=nextValue(n);
    if(!X.has(next))throw Error("Missing Collatz successor for "+n);
    if(n%2===0 && x!==X.get(next))throw Error("Even arrow not vertical: "+n);
    if(n%2!==0 && x===X.get(next))throw Error("Odd arrow not diagonal: "+n);
  });
  function element(tag,props,parent,text) {
    const el=document.createElementNS(NS,tag);
    Object.entries(props||{}).forEach(function(entry) {
      el.setAttribute(entry[0],String(entry[1]));
    });
    if(text!==undefined)el.textContent=String(text);
    if(parent)parent.appendChild(el);
    return el;
  }
  function addStyles() {
    if(document.getElementById("collatz-tree-story-styles"))return;
    const style=document.createElement("style");
    style.id="collatz-tree-story-styles";
    style.textContent="\n.collatz-tree-story {\n  position:absolute;z-index:7;left:2.5vw;right:35vw;top:126px;\n  height:calc(100vh - 166px);min-height:260px;overflow:hidden;\n  pointer-events:none;opacity:1;transition:opacity .58s ease,transform 1s cubic-bezier(.18,.82,.22,1);\n}\n.collatz-tree-svg {width:100%;height:100%;display:block;overflow:hidden;opacity:1;transition:opacity .6s ease;}\n.collatz-tree-story.tree-faded .collatz-tree-svg {opacity:0;}\n.collatz-tree-story.tree-formal-view {opacity:.34;transform:translate(-5vw,12px) scale(.82);transform-origin:center left;}\n.collatz-tree-story.outgoing {opacity:0;}\n.collatz-tree-story .tree-node circle {fill:#0a101b;stroke-width:2;}\n.collatz-tree-story .tree-node text {fill:#f5faff;font:600 19px Inter,system-ui,sans-serif;text-anchor:middle;dominant-baseline:central;font-variant-numeric:tabular-nums;}\n.collatz-tree-story .tree-node.spine circle {stroke:#7ae7ff;filter:drop-shadow(0 0 6px #7ae7ff65);}\n.collatz-tree-story .tree-node.branch circle {stroke:#9f8cff;}\n.collatz-tree-story .tree-node.tip circle {stroke:#ff78b8;filter:drop-shadow(0 0 5px #ff78b856);}\n.collatz-tree-story .tree-edge {fill:none;stroke-width:2;stroke-linecap:round;}\n.collatz-tree-story .tree-edge.even {stroke:#7ae7ff;}\n.collatz-tree-story .tree-edge.odd {stroke:#ffd479;}\n.collatz-tree-story .tree-edge.spine {stroke-width:3;filter:drop-shadow(0 0 5px #7ae7ff80);}\n.collatz-tree-story .tree-loop {opacity:0;transition:opacity .72s ease;}\n.collatz-tree-story.tree-show-loop .tree-loop {opacity:1;}\n.collatz-tree-story .tree-loop-arrow {fill:none;stroke:#ffd479;stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset 1.15s ease .23s;filter:drop-shadow(0 0 7px #ffd47965);}\n.collatz-tree-story.tree-show-loop .tree-loop-arrow {stroke-dashoffset:0;}\n#sequence-area.tree-story-underlay {opacity:0;pointer-events:none;}\n@media(max-width:900px){.collatz-tree-story{left:2vw;right:3vw;top:105px;height:54vh;}.collatz-tree-story.tree-formal-view{opacity:.16;}}\n@media(prefers-reduced-motion:reduce){.collatz-tree-story,.collatz-tree-svg,.collatz-tree-story .tree-loop,.collatz-tree-story .tree-loop-arrow{transition-duration:.01ms!important;}}\n";
    document.head.appendChild(style);
  }
  function makeTree() {
    addStyles();
    const container=document.createElement("div");
    container.className="collatz-tree-story";
    container.setAttribute("aria-label","Eight Collatz starting values flowing toward the central power-of-two path");
    const svg=element("svg",{
      class:"collatz-tree-svg",viewBox:"0 0 1100 520",
      preserveAspectRatio:"xMidYMid meet",role:"img",
      "aria-label":"A straight-line Collatz tree: even arrows down, odd arrows diagonal"
    },container);
    const defs=element("defs",{},svg);
    [["even","#7ae7ff"],["odd","#ffd479"]].forEach(function(pair) {
      const marker=element("marker",{
        id:"story-tree-marker-"+pair[0],markerWidth:9,markerHeight:9,
        refX:8,refY:4.5,orient:"auto",markerUnits:"userSpaceOnUse"
      },defs);
      element("path",{d:"M0 0 L9 4.5 L0 9 Z",fill:pair[1]},marker);
    });
    const world=element("g",{class:"tree-world",transform:"translate(0 "+BELOW+")"},svg);
    const edges=element("g",{class:"tree-edges"},world);
    const nodes=element("g",{class:"tree-nodes"},world);
    const ordered=[...X.keys()].sort(function(a,b){return distance(b)-distance(a)||a-b;});
    ordered.forEach(function(n){
      if(n===1)return;
      const target=nextValue(n),a=pos(n),b=pos(target);
      const dx=b.x-a.x,dy=b.y-a.y,mag=Math.hypot(dx,dy);
      const ux=dx/mag,uy=dy/mag;
      const rule=n%2===0?"even":"odd";
      const d="M "+(a.x+ux*(RADIUS+2))+" "+(a.y+uy*(RADIUS+2))+
        " L "+(b.x-ux*(RADIUS+7))+" "+(b.y-uy*(RADIUS+7));
      element("path",{
        d:d,class:"tree-edge "+rule+(SPINE.has(n)?" spine":""),
        "marker-end":"url(#story-tree-marker-"+rule+")",
        "data-from":n,"data-to":target
      },edges);
    });
    ordered.forEach(function(n){
      const p=pos(n);
      let cls="tree-node "+(SPINE.has(n)?"spine":"branch");
      if(SEEDS.includes(n))cls+=" tip";
      const g=element("g",{class:cls,"data-value":n},nodes);
      element("circle",{cx:p.x,cy:p.y,r:RADIUS},g);
      element("text",{x:p.x,y:p.y+1},g,n);
    });
    // The odd rule sends 1 back to 4. Draw ONE continuous cubic arc,
    // bowing to the right of the 4 → 2 → 1 spine. Its shallow, oval
    // profile keeps the stroke clear of the 2 node and the text card.
    const loop=element("g",{class:"tree-loop"},world);
    const one=pos(1),four=pos(4);
    const startX=one.x+RADIUS, startY=one.y-3;
    const endX=four.x+RADIUS-1, endY=four.y+6;
    const curveX=one.x+158;
    const loopArc="M "+startX+" "+startY+
      " C "+curveX+" "+(one.y+16)+
      " "+curveX+" "+(four.y+28)+
      " "+endX+" "+endY;
    element("path",{
      d:loopArc,class:"tree-loop-arrow",pathLength:1,
      "marker-end":"url(#story-tree-marker-odd)",
      "aria-label":"Odd rule: 1 goes to 4"
    },loop);
    element("text",{
      x:one.x+198,y:one.y-80,fill:"#ffd479",
      "text-anchor":"middle",
      style:"font:700 17px Inter,ui-sans-serif,system-ui,sans-serif"
    },loop,"1 → 4");
    document.querySelector(".sticky-stage").appendChild(container);
    return container;
  }
  const info={
    "tree-rise": {title:"The tree keeps growing.",chapter:"12",kicker:"A LARGER COLLATZ TREE",status:"8 starting values · one connected tree"},
    "tree-converge": {title:"Many paths. One destination.",chapter:"13",kicker:"FOLLOW THE PATHS DOWN TO 1",status:"Following the arrows toward 1"},
    "tree-loop": {title:"And then the sequence repeats.",chapter:"14",kicker:"THE 4–2–1 CYCLE",status:"1 → 4 → 2 → 1"},
    "tree-formal": {title:"The Collatz Conjecture",chapter:"15",kicker:"THE MATHEMATICAL QUESTION",status:"Still unproved"}
  };
  function layoutTree(){
    if(!drawing||!drawing.isConnected)return;
    const heading=document.querySelector(".stage-heading");
    const stage=drawing.parentElement;
    if(!heading||!stage)return;
    // Keep the clipped SVG viewport below the complete heading, even
    // when the title wraps or the short-screen heading position changes.
    const top=Math.max(0,Math.ceil(heading.getBoundingClientRect().bottom-
      stage.getBoundingClientRect().top+20));
    drawing.style.top=top+"px";
    drawing.style.maxHeight="calc(100% - "+(top+40)+"px)";
    drawing.style.minHeight="0";
  }
  function header(scene){
    const meta=info[scene],h=document.getElementById("stage-title");
    const chapter=document.querySelector(".stage-heading .chapter");
    const kicker=document.querySelector(".stage-heading .kicker");
    if(h)h.textContent=meta.title;
    if(chapter)chapter.textContent=meta.chapter;
    if(kicker)kicker.textContent=meta.kicker;
    showStatus(meta.status);
    layoutTree();
  }
  function cancelLoop(){loopTimers.forEach(window.clearTimeout);loopTimers=[];}
  function queue(fn,delay){loopTimers.push(window.setTimeout(fn,delay));}
  function centre(scene){
    const step=storySteps.find(function(s){return s.dataset.scene===scene;});
    if(!step)return null;
    const rect=step.getBoundingClientRect();
    return window.scrollY+rect.top+rect.height/2;
  }
  function clamp(value){return Math.max(0,Math.min(1,value));}
  function smooth(value){const p=clamp(value);return p*p*(3-2*p);}
  function cameraPosition(){
    const previous=centre("reverse-reveal"),rise=centre("tree-rise");
    const converge=centre("tree-converge"),loop=centre("tree-loop");
    if([previous,rise,converge,loop].some(function(value){return value===null;}))
      return state.scene==="tree-converge"?ONE:BELOW;
    const riseStart=(previous+rise)/2;
    const convergeStart=(rise+converge)/2;
    const convergeEnd=(converge+loop)/2;
    const cursor=window.scrollY+window.innerHeight*.52;
    if(cursor<=convergeStart){
      const p=smooth((cursor-riseStart)/(convergeStart-riseStart));
      return BELOW+(UPPER-BELOW)*p;
    }
    const p=smooth((cursor-convergeStart)/(convergeEnd-convergeStart));
    return UPPER+(ONE-UPPER)*p;
  }
  function putWorld(transform) {
    if(!drawing||!drawing.isConnected)return;
    const world=drawing.querySelector(".tree-world");
    if(world)world.setAttribute("transform",transform);
  }
  function onScroll() {
    if(!SCENES.includes(state.scene))return;
    if(state.scene!=="tree-rise"&&state.scene!=="tree-converge")return;
    if(cameraTicking)return;
    cameraTicking=true;
    requestAnimationFrame(function(){
      cameraTicking=false;
      if(state.scene==="tree-rise"||state.scene==="tree-converge"){
        putWorld("translate(0 "+cameraPosition().toFixed(2)+")");
      }
    });
  }
  window.addEventListener("scroll",onScroll,{passive:true});
  window.addEventListener("resize",function(){layoutTree();onScroll();});
  const stageHeading=document.querySelector(".stage-heading");
  if(stageHeading&&typeof ResizeObserver!=="undefined"){
    new ResizeObserver(layoutTree).observe(stageHeading);
  }
  function fullTree(){
    // Highest branch tips are at y=-120; 1 sits at y=1000. Both newly
    // extended vertical branches fit within the established tree scale.
    putWorld("translate(320 68) scale(0.42)");
  }
  // Reuse the exact Collatz nodes and connections for the finale miniature.
  // This graphic is independent of the camera-scrolled world, so the page
  // can fade to the conjecture while retaining a recognizable tree reminder.
  function drawFinaleMiniTree() {
    const mount = document.getElementById("conjecture-tree-reminder");
    if (!mount || mount.querySelector("svg")) return;
    const mini = element("svg", {
      viewBox: "-25 -167 1150 1218",
      preserveAspectRatio: "xMidYMid meet",
      role: "presentation",
      "aria-hidden": "true",
      class: "finale-tree-svg"
    }, mount);
    const defs = element("defs", {}, mini);
    [["even", "#7ae7ff"], ["odd", "#ffd479"]].forEach(function(pair) {
      const mark = element("marker", {
        id: "finale-tree-arrow-" + pair[0],
        markerWidth: 12, markerHeight: 12, refX: 9.4, refY: 6,
        markerUnits: "userSpaceOnUse", orient: "auto"
      }, defs);
      element("path", { d: "M0 0 L12 6 L0 12 Z", fill: pair[1] }, mark);
    });
    const lines = element("g", { class: "finale-mini-edges" }, mini);
    const nodes = element("g", { class: "finale-mini-nodes" }, mini);
    const ordered = [...X.keys()].sort(function(a,b) {
      return distance(b)-distance(a) || a-b;
    });
    ordered.forEach(function(n) {
      if (n === 1) return;
      const to = nextValue(n), a = pos(n), b = pos(to);
      const dx = b.x-a.x, dy = b.y-a.y, magnitude = Math.hypot(dx,dy);
      const ux = dx/magnitude, uy = dy/magnitude;
      const even = n % 2 === 0;
      const rule = even ? "even" : "odd";
      const d = "M " + (a.x+ux*(RADIUS+8)) + " " + (a.y+uy*(RADIUS+8)) +
                " L " + (b.x-ux*(RADIUS+13)) + " " + (b.y-uy*(RADIUS+13));
      element("path", {
        d: d, class: "mini-tree-edge " + rule + (SPINE.has(n) ? " spine" : ""),
        "marker-end": "url(#finale-tree-arrow-" + rule + ")"
      }, lines);
    });
    ordered.forEach(function(n) {
      const p = pos(n);
      const classes = "mini-tree-node" +
        (SPINE.has(n) ? " spine" : "") +
        (SEEDS.includes(n) ? " tip" : "");
      const group = element("g", { class: classes }, nodes);
      element("circle", { cx: p.x, cy: p.y, r: RADIUS+4 }, group);
      element("text", { x: p.x, y: p.y+1 }, group, n);
    });
    const one = pos(1), four = pos(4);
    element("path", {
      class: "mini-tree-loop",
      d: "M " + (one.x+RADIUS+4) + " " + (one.y-4) +
        " C " + (one.x+163) + " " + (one.y+15) +
        " " + (one.x+163) + " " + (four.y+27) +
        " " + (four.x+RADIUS+2) + " " + (four.y+6),
      "marker-end": "url(#finale-tree-arrow-odd)"
    },mini);
  }

  function setFinale(active) {
    const finale = document.getElementById("conjecture-finale");
    const stage = document.querySelector(".sticky-stage");
    if (!finale || !stage) return;
    if (active) drawFinaleMiniTree();
    stage.classList.toggle("conjecture-is-visible", active);
    finale.classList.toggle("is-visible", active);
    finale.setAttribute("aria-hidden", String(!active));
    if (active) finale.removeAttribute("inert");
    else finale.setAttribute("inert", "");
  }

  function enter(scene,previous){
    window.clearTimeout(exitTimer);
    cancelLoop();
    if(!drawing||!drawing.isConnected)drawing=makeTree();
    drawing.classList.remove("outgoing");
    document.getElementById("sequence-area").classList.add("tree-story-underlay");
    setFinale(scene === "tree-formal");
    if(scene==="tree-rise"||scene==="tree-converge"){
      drawing.classList.remove("tree-faded","tree-show-loop","tree-formal-view");
      putWorld("translate(0 "+cameraPosition().toFixed(2)+")");
    }
    if(scene==="tree-loop"){
      // The tree must remain visible and stationary as the visitor passes
      // the last number and enters the 4 → 2 → 1 cycle scene. Only the
      // RETURN ARC animates. No opacity changes, SVG rebuilds, or zoom-out.
      drawing.classList.remove("tree-formal-view","outgoing","tree-faded");
      if(previous!=="tree-converge"){
        // Return visits enter at the same close-up framing.
        putWorld("translate(0 "+ONE+")");
      }
      drawing.classList.remove("tree-show-loop");
      // Give the browser a frame with the untouched tree visible, then
      // draw the single smooth oval arrow from 1 back to 4.
      requestAnimationFrame(function(){
        requestAnimationFrame(function(){
          if(state.scene==="tree-loop"&&drawing&&drawing.isConnected){
            drawing.classList.add("tree-show-loop");
          }
        });
      });
    }
    if(scene==="tree-formal"){
      // The full-screen conjecture replaces the graphic, rather than
      // shrinking the entire tree into a tiny distracting illustration.
      // Let the close-up cycle fade away under the new statement.
      drawing.classList.remove("tree-formal-view");
      drawing.classList.add("tree-faded");
    }
    header(scene);
  }
  function leave(){
    cancelLoop();
    setFinale(false);
    if(!drawing||!drawing.isConnected)return;
    drawing.classList.add("outgoing");
    document.getElementById("sequence-area").classList.remove("tree-story-underlay");
    window.clearTimeout(exitTimer);
    const old=drawing;
    exitTimer=window.setTimeout(function(){
      if(old===drawing&&!SCENES.includes(state.scene)){old.remove();drawing=null;}
    },1000);
  }
  const previousSetScene=setScene;
  setScene=function(scene){
    if(SCENES.includes(scene)){
      if(typeof requiredGateFor==="function"&&requiredGateFor(scene)){
        return previousSetScene(scene);
      }
      if(state.scene===scene)return;
      const from=state.scene;
      state.scene=scene;
      hideTransientUI();
      enter(scene,from);
      return;
    }
    const leaving=SCENES.includes(state.scene);
    const result=previousSetScene(scene);
    if(leaving&&!SCENES.includes(state.scene))leave();
    return result;
  };
})();

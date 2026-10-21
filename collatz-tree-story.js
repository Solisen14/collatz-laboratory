
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
    // 1 → 4 is the odd-rule return. Two straight segments avoid the 2 node.
    const loop=element("g",{class:"tree-loop"},world);
    const one=pos(1),four=pos(4);
    element("path",{
      d:"M "+(one.x+RADIUS)+" "+(one.y-4)+
       " L "+(one.x+112)+" "+(one.y-45)+
       " L "+(four.x+RADIUS+8)+" "+(four.y+7),
      class:"tree-loop-arrow",pathLength:1,
      "marker-end":"url(#story-tree-marker-odd)"
    },loop);
    element("text",{
      x:one.x+113,y:one.y-90,fill:"#ffd479",
      "text-anchor":"middle",
      style:"font:700 17px Inter,system-ui,sans-serif"
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
  function header(scene){
    const meta=info[scene],h=document.getElementById("stage-title");
    const chapter=document.querySelector(".stage-heading .chapter");
    const kicker=document.querySelector(".stage-heading .kicker");
    if(h)h.textContent=meta.title;
    if(chapter)chapter.textContent=meta.chapter;
    if(kicker)kicker.textContent=meta.kicker;
    showStatus(meta.status);
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
  window.addEventListener("resize",onScroll);
  function fullTree(){
    // Highest branch tips are at y=-120; 1 sits at y=1000. Both newly
    // extended vertical branches fit within the established tree scale.
    putWorld("translate(320 68) scale(0.42)");
  }
  function enter(scene,previous){
    window.clearTimeout(exitTimer);
    cancelLoop();
    if(!drawing||!drawing.isConnected)drawing=makeTree();
    drawing.classList.remove("outgoing");
    document.getElementById("sequence-area").classList.add("tree-story-underlay");
    if(scene==="tree-rise"||scene==="tree-converge"){
      drawing.classList.remove("tree-faded","tree-show-loop","tree-formal-view");
      putWorld("translate(0 "+cameraPosition().toFixed(2)+")");
    }
    if(scene==="tree-loop"){
      drawing.classList.remove("tree-formal-view");
      if(previous==="tree-formal"){
        fullTree();
        drawing.classList.remove("tree-faded");
        drawing.classList.add("tree-show-loop");
      }else{
        // A deliberate cinematic beat: fade out at 1, restore the
        // whole tree while invisible, fade in, then draw 1 → 4.
        drawing.classList.remove("tree-show-loop");
        drawing.classList.add("tree-faded");
        queue(function(){
          if(state.scene!=="tree-loop")return;
          fullTree();
          drawing.classList.remove("tree-faded");
        },650);
        queue(function(){
          if(state.scene==="tree-loop")drawing.classList.add("tree-show-loop");
        },1570);
      }
    }
    if(scene==="tree-formal"){
      fullTree();
      drawing.classList.remove("tree-faded");
      drawing.classList.add("tree-show-loop","tree-formal-view");
    }
    header(scene);
  }
  function leave(){
    cancelLoop();
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

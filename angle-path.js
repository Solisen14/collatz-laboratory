/* Collatz Laboratory: Angle-Path Trails
 * An original browser interpretation of the AnglePath method in
 * Anton Bogatskiy's 2015 Mathematica Collatz visualizations, discussed by
 * Vitaliy Kaurov: https://community.wolfram.com/t/a-beautiful-picture-related-to-collatz-conjecture/6591
 *
 * In reverse orbit order (starting at 1) take, for every value r,
 *   step length = r/(1+r^e)
 *   heading turn = a*pi*(log(2)/log(6) - parity(r)).
 * All computation stays in the browser; BigInt preserves exact parity.
 */
(function () {
  'use strict';

  const canvas = document.getElementById('angleCanvas');
  const workspace = document.getElementById('angleWorkspace');
  const card = document.querySelector('[data-visualizer-mode="angle"]');
  const countInput = document.getElementById('angleCount');
  const maxInput = document.getElementById('angleMax');
  const exponentInput = document.getElementById('angleExponent');
  const strengthInput = document.getElementById('angleStrength');
  const exponentOutput = document.getElementById('angleExponentValue');
  const strengthOutput = document.getElementById('angleStrengthValue');
  const statsLine = document.getElementById('angleStats');
  const statusLine = document.getElementById('angleStatus');
  const randomButton = document.getElementById('angleRandomize');
  const animateButton = document.getElementById('angleAnimate');
  const saveButton = document.getElementById('angleSave');
  const cards = Array.from(document.querySelectorAll('[data-visualizer-mode]'));
  if (!canvas || !workspace || !card || !countInput || !maxInput || !exponentInput || !strengthInput) return;

  const context = canvas.getContext('2d', {alpha:false});
  if (!context) {
    statusLine.textContent = 'The drawing canvas is unavailable in this browser.';
    return;
  }
  const MAX_STEPS = 2500;
  const LOG6 = Math.log(6);
  const BALANCE = Math.LN2 / LOG6;
  const PALETTE = [
    [242,112,157], [255,153,107], [255,203,137], [198,118,210],
    [144,118,229], [103,185,240], [108,223,207], [247,112,105]
  ];
  let modeActive = false, loaded = false;
  let selectionSeed = 20150902;
  let seeds = [], reversedOrbits = [], curves = [];
  let longestSteps = 0, highestValue = 1n;
  let bounds = null;
  let drawingWidth = 800, drawingHeight = 760;
  let visibleCurves = 0, rafId = null, debounceId = null, lastAnimationStart = 0;

  const clamp = (value,min,max)=>Math.max(min,Math.min(max,value));
  function mulberry32(seed) {
    let t=seed>>>0;
    return function () {
      t=(t+0x6D2B79F5)>>>0;
      let x=t;
      x=Math.imul(x^(x>>>15),x|1);
      x^=x+Math.imul(x^(x>>>7),x|61);
      return ((x^(x>>>14))>>>0)/4294967296;
    };
  }
  function options() {
    return {
      count:Math.max(1,Number(countInput.value)),
      maximum:Math.max(1,Number(maxInput.value)),
      e:Number(exponentInput.value),
      a:Number(strengthInput.value)
    };
  }
  function refreshOutputs() {
    exponentOutput.textContent=Number(exponentInput.value).toFixed(2);
    strengthOutput.textContent=Number(strengthInput.value).toFixed(2);
  }
  function sampleSeeds(count,maximum,seed) {
    const random=mulberry32(seed),picked=new Set();
    while(picked.size<count) picked.add(1+Math.floor(random()*maximum));
    return Array.from(picked).sort((a,b)=>b-a);
  }
  function collatzReverse(seed) {
    const forward=[BigInt(seed)];
    let r=forward[0];
    while(r!==1n && forward.length<MAX_STEPS) {
      r=(r%2n===0n)?r/2n:3n*r+1n;
      forward.push(r);
    }
    if(r!==1n) throw Error('A starting orbit did not reach 1 within the supported limit.');
    if(r===1n && forward.length===1) return [1n];
    return forward.reverse();
  }

  function recalculateSamples() {
    stopAnimation();
    const o=options();
    // Unique random integers are sampled without allocating [1,...,max].
    seeds=sampleSeeds(Math.min(o.count,o.maximum),o.maximum,selectionSeed);
    reversedOrbits=[];
    longestSteps=0;
    highestValue=1n;
    let failed=0;
    for(const seed of seeds) {
      try {
        const reversed=collatzReverse(seed);
        reversedOrbits.push({seed,sequence:reversed});
        longestSteps=Math.max(longestSteps,reversed.length-1);
        for(const r of reversed) if(r>highestValue)highestValue=r;
      } catch(_) {failed++; }
    }
    if(!reversedOrbits.length) {
      statusLine.textContent='No valid trajectories were produced. Try a smaller starting-number limit.';
      return;
    }
    statsLine.textContent=reversedOrbits.length.toLocaleString()+' trajectories · '+
      longestSteps+' longest steps · starting numbers ≤ '+
      o.maximum.toLocaleString()+(failed?' · '+failed+' omitted':'');
    computeCurves();
    statusLine.textContent='Ready · '+curves.length+' overlapping paths';
  }

  function computeCurves() {
    const {e,a}=options();
    curves=[];
    let minX=0,maxX=0,minY=0,maxY=0;
    for(let index=0;index<reversedOrbits.length;index++) {
      const {seed,sequence}=reversedOrbits[index];
      let theta=0,x=0,y=0;
      const points=new Float64Array((sequence.length+1)*2);
      for(let k=0;k<sequence.length;k++) {
        const r=sequence[k];
        const v=Number(r);
        if(!Number.isFinite(v))continue;
        const log=Math.log(v);
        // Algebraically equal to r/(1+r^e), but numerically stable.
        const step=Math.exp((1-e)*log)/(1+Math.exp(-e*log));
        theta+=a*Math.PI*(BALANCE-Number(r&1n));
        x+=step*Math.cos(theta);
        y+=step*Math.sin(theta);
        points[2*(k+1)]=x;
        points[2*(k+1)+1]=y;
        minX=Math.min(minX,x);maxX=Math.max(maxX,x);
        minY=Math.min(minY,y);maxY=Math.max(maxY,y);
      }
      const hue=PALETTE[Math.floor((seed*0.00013+index*.43)%PALETTE.length)];
      const frac=seed/options().maximum;
      curves.push({
        seed,points,rgb:hue,alpha:0.065+0.30*Math.pow(frac,2.0),
        width:.45+2.1*Math.pow(1-frac,4*e)
      });
    }
    // Never collapse the canvas when only one short orbit was sampled.
    bounds={minX,maxX,minY,maxY};
    visibleCurves=curves.length;
    draw();
  }

  function setupCanvas() {
    const rect=canvas.getBoundingClientRect();
    drawingWidth=Math.max(320,Math.round(rect.width||800));
    drawingHeight=Math.max(310,Math.round(rect.height||760));
    const ratio=clamp(window.devicePixelRatio||1,1,2);
    canvas.width=Math.round(drawingWidth*ratio);
    canvas.height=Math.round(drawingHeight*ratio);
    context.setTransform(ratio,0,0,ratio,0,0);
    context.imageSmoothingEnabled=true;
  }

  function draw() {
    if(!modeActive)return;
    setupCanvas();
    const w=drawingWidth,h=drawingHeight;
    context.globalCompositeOperation='source-over';
    context.globalAlpha=1;
    context.fillStyle='#050813';
    context.fillRect(0,0,w,h);
    // A delicate radial vignette makes shared luminous threads easier to see.
    const background=context.createRadialGradient(w*.48,h*.46,0,w*.48,h*.46,w*.68);
    background.addColorStop(0,'rgba(26,32,58,.40)');
    background.addColorStop(1,'rgba(5,8,19,0)');
    context.fillStyle=background;
    context.fillRect(0,0,w,h);
    if(!bounds||!curves.length)return;
    const pad=Math.max(24,Math.min(w,h)*.065);
    const sx=w-2*pad,sy=h-2*pad;
    const dx=Math.max(.5,bounds.maxX-bounds.minX),dy=Math.max(.5,bounds.maxY-bounds.minY);
    const scale=Math.min(sx/dx,sy/dy);
    const cx=(bounds.minX+bounds.maxX)/2,cy=(bounds.minY+bounds.maxY)/2;
    const fx=x=>w/2+(x-cx)*scale;
    const fy=y=>h/2-(y-cy)*scale;
    context.globalCompositeOperation='screen';
    const count=Math.min(visibleCurves,curves.length);
    for(let i=0;i<count;i++) {
      const curve=curves[i],p=curve.points;
      const rgb=curve.rgb.join(',');
      context.beginPath();
      context.moveTo(fx(p[0]),fy(p[1]));
      for(let j=2;j<p.length;j+=2)context.lineTo(fx(p[j]),fy(p[j+1]));
      context.lineJoin='round';
      context.lineCap='round';
      context.strokeStyle='rgb('+rgb+')';
      context.globalAlpha=curve.alpha;
      context.lineWidth=curve.width;
      context.stroke();
      // Slight atmospheric bloom, without replacing the precise path.
      if(curves.length<=500) {
        context.globalAlpha=curve.alpha*.18;
        context.lineWidth=curve.width*2.4+1.0;
        context.stroke();
      }
    }
    context.globalAlpha=1;
    context.globalCompositeOperation='source-over';
    // A single shared origin: the first mathematical value in every trail is 1.
    const rootX=fx(0),rootY=fy(0);
    context.fillStyle='#fff0bc';
    context.beginPath();
    context.arc(rootX,rootY,3.5,0,2*Math.PI);
    context.fill();
  }

  function stopAnimation() {
    if(rafId!==null) {
      window.cancelAnimationFrame(rafId);
      rafId=null;
    }
    lastAnimationStart=0;
    animateButton.textContent='Animate paths';
  }
  function animate() {
    if(rafId!==null) {
      stopAnimation();
      visibleCurves=curves.length;
      draw();
      return;
    }
    if(!curves.length)return;
    if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      statusLine.textContent='Animation is disabled by your reduced-motion preference.';
      return;
    }
    visibleCurves=0;
    animateButton.textContent='Stop animation';
    lastAnimationStart=0;
    const frame=timestamp=>{
      if(!modeActive){stopAnimation();return;}
      if(!lastAnimationStart)lastAnimationStart=timestamp;
      const t=clamp((timestamp-lastAnimationStart)/4700,0,1);
      visibleCurves=Math.max(1,Math.floor(t*curves.length));
      draw();
      if(t<1){
        rafId=window.requestAnimationFrame(frame);
      } else {
        rafId=null;animateButton.textContent='Animate paths';
        statusLine.textContent='All '+curves.length+' paths drawn.';
      }
    };
    rafId=window.requestAnimationFrame(frame);
  }
  function scheduleGeometry() {
    refreshOutputs();
    if(debounceId!==null)window.clearTimeout(debounceId);
    debounceId=window.setTimeout(()=>{
      debounceId=null;
      stopAnimation();
      computeCurves();
      statusLine.textContent='Angle-path geometry updated.';
    },150);
  }
  function saveImage() {
    if(!modeActive||!curves.length)return;
    const a=document.createElement('a');
    a.href=canvas.toDataURL('image/png');
    a.download='collatz-angle-paths-'+curves.length+'-seeds.png';
    document.body.appendChild(a);
    a.click();a.remove();
    statusLine.textContent='Image export requested.';
  }
  function activate(active) {
    modeActive=active;
    workspace.hidden=!active;
    if(active){
      if(!loaded){loaded=true;refreshOutputs();recalculateSamples();}
      else draw();
      const href=window.location.pathname+window.location.search+'#angle';
      try{window.history.replaceState(null,'',href);}catch(_){}
    }else{
      stopAnimation();
    }
  }

  // Existing Standard and Circular controllers own their own workspaces.
  // This module only shows/hides the third workspace.
  for(const button of cards) {
    button.addEventListener('click',()=>activate(button.dataset.visualizerMode==='angle'));
  }
  countInput.addEventListener('change',recalculateSamples);
  maxInput.addEventListener('change',recalculateSamples);
  exponentInput.addEventListener('input',scheduleGeometry);
  strengthInput.addEventListener('input',scheduleGeometry);
  randomButton.addEventListener('click',()=>{
    selectionSeed=(selectionSeed+0x9E3779B9)>>>0;
    recalculateSamples();
    statusLine.textContent='New random starting numbers sampled.';
  });
  animateButton.addEventListener('click',animate);
  saveButton.addEventListener('click',saveImage);
  window.addEventListener('resize',()=>{
    if(modeActive){
      if(debounceId!==null)window.clearTimeout(debounceId);
      debounceId=window.setTimeout(()=>{debounceId=null;draw();},100);
    }
  });

  if(window.location.hash==='#angle')card.click();

  // Public, read-only diagnostics for regression checks.
  window.collatzAngleDiagnostics=()=>{
    return {
      pathCount:curves.length,
      longestSteps,
      maximumSample:options().maximum,
      sampleCount:options().count,
      exponent:options().e,
      angleStrength:options().a,
      firstSeeds:seeds.slice(0,6),
      firstReversedOrbit:reversedOrbits[0]?.sequence.slice(0,18).map(String)||[],
      firstPath:curves[0]?Array.from(curves[0].points.slice(0,20)):[],
      bounds:bounds?{...bounds}:null,
      origin:[0,0],
      highestValue:highestValue.toString()
    };
  };
})();
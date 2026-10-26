/* Generalized Angle-Path Experiment
 * Uses the SAME BigInt trace model and Angle-Path turn/length equations
 * as the existing Experiment and Visualize workbenches.
 * Finite prefixes and distinct terminal cycles are never treated as
 * proved convergence to 1.
 */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const canvas=$('exp-angle-canvas');
  const panel=$('angle-path-experiment');
  const ruleA=$('anb-a'),ruleB=$('anb-b');
  const countSelect=$('exp-angle-count'),paletteSelect=$('exp-angle-palette');
  const ruleLabel=$('exp-angle-rule'),outcome=$('exp-angle-outcome');
  const oneCount=$('exp-angle-one'),otherCount=$('exp-angle-other');
  const openCount=$('exp-angle-open'),status=$('exp-angle-status');
  const save=$('exp-angle-save');
  const model=window.CollatzExperiment;
  if(!panel||!canvas||!ruleA||!ruleB||!model||!countSelect||!paletteSelect)return;
  const context=canvas.getContext('2d',{alpha:false});
  if(!context){status.textContent='The drawing canvas is unavailable in this browser.';return;}

  // Exactly the same turning and length parameters as Visualize defaults.
  const STEP_EXPONENT=1.2, TURN_STRENGTH=.34;
  const BALANCE=Math.LN2/Math.log(6);
  const ORIGINAL=[
    [242,112,157],[255,153,107],[255,203,137],[198,118,210],
    [144,118,229],[103,185,240],[108,223,207],[247,112,105]
  ];
  const COLOURS={
    original:{background:'#050813',root:'#fff0bc',blend:'screen',stops:ORIGINAL},
    monochrome:{background:'#ffffff',root:'#252830',blend:'source-over',stops:[
      [23,25,29],[43,46,51],[62,66,72],[35,38,42],
      [78,82,87],[46,49,55],[67,70,76],[29,32,37]]},
    aurora:{background:'#061624',root:'#cefef3',blend:'screen',stops:[
      [62,205,222],[108,242,211],[117,178,250],[163,130,245],
      [77,224,177],[147,231,249],[193,162,254],[80,196,223]]},
    ember:{background:'#120b0b',root:'#ffdcaf',blend:'screen',stops:[
      [255,183,76],[241,120,76],[249,203,137],[226,88,94],
      [255,154,102],[245,190,110],[213,102,74],[255,220,157]]}
  };

  const state={a:3,b:1,traces:[],curves:[],bounds:null,delay:0};
  const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));

  function traceForDrawing(seed,a,b){
    const path=model.trace(seed,a,b);
    const values=path.values;
    // For a completed cycle, start drawing at its smallest integer and
    // follow the computed sequence in reverse until the original seed.
    // This preserves shared reverse tails, as in the original Angle-Path.
    // Different cycles are mathematically DISTINCT despite overlapping
    // in this abstract drawing; the note below the image makes this clear.
    if(path.status==='one'||path.status==='cycle'){
      const cycle=values.slice(path.cycleStart,-1);
      if(!cycle.length)return {path,sequence:values.slice().reverse()};
      const anchor=cycle.reduce((x,y)=>x<y?x:y);
      const end=values.findIndex(value=>value===anchor);
      return {path,sequence:values.slice(0,end+1).reverse()};
    }
    // A safety-limited trajectory has no verified terminal cycle.
    // Its last COMPUTED value is merely our drawing starting point.
    return {path,sequence:values.slice().reverse()};
  }

  function generate(){
    state.a=Number(ruleA.value);
    state.b=Number(ruleB.value);
    const count=Number(countSelect.value);
    state.traces=Array.from({length:count},(_,i)=>traceForDrawing(i+1,state.a,state.b));
    let minX=0,maxX=0,minY=0,maxY=0;
    state.curves=state.traces.map(({path,sequence},index)=>{
      let x=0,y=0,theta=0;
      const points=new Float64Array((sequence.length+1)*2);
      for(let k=0;k<sequence.length;k++){
        const r=sequence[k];
        const n=Number(r);
        if(!Number.isFinite(n)||n<=0)continue;
        const log=Math.log(n);
        const step=Math.exp((1-STEP_EXPONENT)*log)/
          (1+Math.exp(-STEP_EXPONENT*log));
        theta+=TURN_STRENGTH*Math.PI*(BALANCE-Number(r&1n));
        x+=step*Math.cos(theta);y+=step*Math.sin(theta);
        points[2*(k+1)]=x;points[2*(k+1)+1]=y;
        minX=Math.min(minX,x);maxX=Math.max(maxX,x);
        minY=Math.min(minY,y);maxY=Math.max(maxY,y);
      }
      const seed=index+1;
      const slot=Math.floor((seed*.00013+index*.43)%ORIGINAL.length);
      const frac=seed/count;
      return {points,slot,alpha:.065+.30*Math.pow(frac,2),
        width:.45+2.1*Math.pow(1-frac,4*STEP_EXPONENT)};
    });
    state.bounds={minX,maxX,minY,maxY};
    const stats={one:0,cycle:0,open:0};
    state.traces.forEach(({path})=>{
      if(path.status==='one')stats.one++;
      else if(path.status==='cycle')stats.cycle++;
      else stats.open++;
    });
    ruleLabel.textContent=state.a+'n + '+state.b;
    oneCount.textContent=String(stats.one);
    otherCount.textContent=String(stats.cycle);
    openCount.textContent=String(stats.open);
    outcome.textContent=stats.open?
      stats.open+' finite path'+(stats.open===1?'':'s')+' stopped at calculation limits':
      stats.cycle?
        stats.cycle+' paths entered cycles without 1':
        'Every tested path entered a cycle containing 1';
    panel.querySelectorAll('[data-exp-angle-rule]').forEach(btn=>{
      const [a,b]=btn.dataset.expAngleRule.split(',').map(Number);
      const current=a===state.a&&b===state.b;
      btn.classList.toggle('is-current',current);
      btn.setAttribute('aria-pressed',String(current));
    });
    status.textContent=count+' observed starting integers · '+state.a+'n + '+state.b+
      ' · '+model.MAX_STEPS+'-step maximum per path';
    draw();
  }

  function setupCanvas(){
    const rect=canvas.getBoundingClientRect();
    const width=Math.max(320,Math.round(rect.width||960));
    const height=Math.max(260,Math.round(rect.height||580));
    const ratio=clamp(window.devicePixelRatio||1,1,1.5);
    if(canvas.width!==Math.round(width*ratio)||canvas.height!==Math.round(height*ratio)){
      canvas.width=Math.round(width*ratio);
      canvas.height=Math.round(height*ratio);
    }
    context.setTransform(ratio,0,0,ratio,0,0);
    return {w:width,h:height};
  }
  function draw(){
    const {w,h}=setupCanvas();
    const scheme=COLOURS[paletteSelect.value]||COLOURS.original;
    const mono=paletteSelect.value==='monochrome';
    context.globalCompositeOperation='source-over';
    context.globalAlpha=1;
    context.fillStyle=scheme.background;
    context.fillRect(0,0,w,h);
    if(!mono){
      const radial=context.createRadialGradient(w*.48,h*.46,0,w*.48,h*.46,w*.68);
      if(paletteSelect.value==='original'){
        // Exact original background and vignette colours.
        radial.addColorStop(0,'rgba(26,32,58,.40)');
        radial.addColorStop(1,'rgba(5,8,19,0)');
      }else if(paletteSelect.value==='aurora'){
        radial.addColorStop(0,'rgba(13,67,77,.31)');
        radial.addColorStop(1,'rgba(6,22,36,0)');
      }else{
        radial.addColorStop(0,'rgba(93,43,28,.25)');
        radial.addColorStop(1,'rgba(18,11,11,0)');
      }
      context.fillStyle=radial;context.fillRect(0,0,w,h);
    }
    if(!state.bounds||!state.curves.length)return;
    const b=state.bounds,pad=Math.max(30,Math.min(w,h)*.078);
    const scale=Math.min((w-2*pad)/Math.max(.5,b.maxX-b.minX),
                         (h-2*pad)/Math.max(.5,b.maxY-b.minY));
    const midX=(b.minX+b.maxX)/2,midY=(b.minY+b.maxY)/2;
    const X=x=>w/2+(x-midX)*scale,Y=y=>h/2-(y-midY)*scale;
    context.globalCompositeOperation=scheme.blend;
    for(const curve of state.curves){
      const p=curve.points;
      context.beginPath();
      context.moveTo(X(p[0]),Y(p[1]));
      for(let i=2;i<p.length;i+=2)context.lineTo(X(p[i]),Y(p[i+1]));
      context.lineCap='round';context.lineJoin='round';
      context.strokeStyle='rgb('+scheme.stops[curve.slot].join(',')+')';
      context.lineWidth=curve.width;
      context.globalAlpha=mono?Math.min(.76,curve.alpha*1.5+.035):curve.alpha;
      context.stroke();
      if(!mono&&state.curves.length<=500){
        context.globalAlpha=curve.alpha*.18;
        context.lineWidth=curve.width*2.4+1;
        context.stroke();
      }
    }
    context.globalAlpha=1;
    context.globalCompositeOperation='source-over';
    // Marker is a COMMON DRAWING origin. It only represents one shared
    // integer when the completed orbits have the same actual cycle anchor.
    context.fillStyle=scheme.root;
    context.beginPath();context.arc(X(0),Y(0),3.5,0,2*Math.PI);context.fill();
  }

  function schedule(){
    window.clearTimeout(state.delay);
    state.delay=window.setTimeout(generate,110);
  }
  ruleA.addEventListener('input',schedule);
  ruleB.addEventListener('input',schedule);
  countSelect.addEventListener('change',generate);
  paletteSelect.addEventListener('change',()=>{
    panel.dataset.palette=paletteSelect.value;
    draw();
  });
  panel.querySelectorAll('[data-exp-angle-rule]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const [a,b]=btn.dataset.expAngleRule.split(',');
      ruleA.value=a;ruleB.value=b;
      // Updating the existing workbench also updates its graph, summaries
      // and shareable URL. This applet listens to that same change.
      // One input event is sufficient: the existing workbench reads both
      // slider values together, and this panel listens to the same event.
      ruleA.dispatchEvent(new Event('input',{bubbles:true}));
      generate();
    });
  });
  save.addEventListener('click',()=>{
    const link=document.createElement('a');
    link.href=canvas.toDataURL('image/png');
    link.download='collatz-'+state.a+'n-plus-'+state.b+'-angle-paths.png';
    document.body.appendChild(link);link.click();link.remove();
    status.textContent='PNG export requested for '+state.a+'n + '+state.b+'.';
  });
  let resize=0;
  window.addEventListener('resize',()=>{
    window.clearTimeout(resize);
    resize=window.setTimeout(draw,120);
  },{passive:true});
  generate();
  // Read-only diagnostics for mathematical and UI regression checks.
  window.collatzExperimentAngleDiagnostics=()=>({
    a:state.a,b:state.b,palette:paletteSelect.value,
    paths:state.traces.length,
    outcomes:state.traces.reduce((s,{path})=>(s[path.status]=(s[path.status]||0)+1,s),{}),
    firstPathValues:state.traces[0]?.path.values.slice(0,24).map(String)||[],
    firstDrawingValues:state.traces[0]?.sequence.slice(0,24).map(String)||[],
    firstPoints:state.curves[0]?Array.from(state.curves[0].points.slice(0,20)):[],
    bounds:state.bounds?{...state.bounds}:null
  });
})();

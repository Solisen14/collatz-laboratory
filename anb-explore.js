/* Generalized Collatz-style an+b Explorer.
   Positive starting integers 1...25.
   Exact BigInt arithmetic until a fixed value cap; finite data, no proof claims. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const NS='http://www.w3.org/2000/svg';
  const MAX_STEPS=200;
  const MAX_VALUE=1000000000000n;
  const STARTS=Array.from({length:25},(_,i)=>i+1);
  const root=$('anb-path-map');
  if(!root)return;

  const els={
    a:$('anb-a'),b:$('anb-b'),valueA:$('anb-a-value'),valueB:$('anb-b-value'),
    ruleA:$('anb-rule-a'),ruleB:$('anb-rule-b'),ruleCaption:$('anb-rule-caption'),
    currentTitle:$('anb-current-title'),mapStats:$('anb-map-stats'),
    seedGrid:$('anb-seed-grid'),showAll:$('anb-show-all'),
    save:$('anb-save-svg'),share:$('anb-share'),shareStatus:$('anb-share-status'),
    inspectorPlaceholder:$('anb-inspector-placeholder'),inspector:$('anb-inspector-data'),
    detailStart:$('anb-detail-start'),detailSteps:$('anb-detail-steps'),
    detailPeak:$('anb-detail-peak'),detailOutcome:$('anb-detail-outcome'),
    detailSequence:$('anb-path-values'),detailNote:$('anb-detail-note'),
    animate:$('anb-play'),copyPath:$('anb-copy-path'),
    reached:$('anb-reached'),cycles:$('anb-cycles'),capped:$('anb-capped'),limited:$('anb-limited')
  };
  const state={a:3,b:1,paths:[],selected:null,drawFrame:0,animFrame:0};
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const numberText=n=>n.toLocaleString('en-CA');
  const colorFor=start=>'hsl('+(((start-1)*137.508+180)%360).toFixed(1)+' 92% 72%)';
  const labels={
    one:'Reached 1',cycle:'Other cycle',cap:'Beyond value limit',limit:'Step limit'
  };
  function svg(tag,attrs,parent,text){
    const el=document.createElementNS(NS,tag);
    for(const [name,value] of Object.entries(attrs||{}))el.setAttribute(name,String(value));
    if(text!==undefined)el.textContent=String(text);
    if(parent)parent.appendChild(el);
    return el;
  }
  function trace(start,a,b){
    const values=[BigInt(start)];
    const seen=new Map([[BigInt(start),0]]);
    let status=start===1?'one':null;
    let repeatedAt=null,overshoot=null;
    const aBig=BigInt(a),bBig=BigInt(b);
    if(status==='one')return {start,values,status,cycleStart:null,peak:1n};
    while(values.length-1<MAX_STEPS){
      const n=values[values.length-1];
      const next=n%2n===0n ? n/2n : aBig*n+bBig;
      if(next>MAX_VALUE){
        status='cap';overshoot=next;break;
      }
      values.push(next);
      if(next===1n){status='one';break;}
      if(seen.has(next)){status='cycle';repeatedAt=seen.get(next);break;}
      seen.set(next,values.length-1);
    }
    if(status===null)status='limit';
    const peak=values.reduce((best,v)=>v>best?v:best,0n);
    return {start,values,status,cycleStart:repeatedAt,overshoot,peak};
  }
  function allPaths(a,b){return STARTS.map(n=>trace(n,a,b));}
  function sceneGeometry(){
    const maxSteps=Math.max(10,...state.paths.map(p=>p.values.length-1));
    const maxPeak=Math.max(16,...state.paths.map(p=>Number(p.peak)));
    const highestPow=Math.max(4,Math.ceil(Math.log2(maxPeak)));
    const box={left:91,right:1219,top:66,bottom:612};
    const x=n=>box.left+n/maxSteps*(box.right-box.left);
    const y=n=>box.bottom-Math.log2(Number(n))/highestPow*(box.bottom-box.top);
    return {box,maxSteps,highestPow,x,y};
  }
  function plotString(p,g){
    return p.values.map((v,i)=>(i===0?'M ':' L ')+g.x(i).toFixed(2)+' '+g.y(v).toFixed(2)).join('');
  }
  function renderAxes(g){
    const {box,maxSteps,highestPow,x,y}=g;
    svg('rect',{x:box.left,y:box.top,width:box.right-box.left,height:box.bottom-box.top,rx:9,
      fill:'#08182a',stroke:'#2a4765','stroke-opacity':'.55'},root);
    const layers=svg('g',{},root);
    for(let e=0;e<=highestPow;e++){
      if(highestPow>18&&e%2!==0&&e!==highestPow)continue;
      const val=2**e,py=y(val);
      svg('line',{'class':'anb-path-gridline',x1:box.left,y1:py,x2:box.right,y2:py},layers);
      svg('text',{'class':'anb-path-tick',x:box.left-13,y:py+5,'text-anchor':'end'},layers,
        numberText(val));
    }
    const tick=Math.max(1,Math.ceil(maxSteps/10));
    for(let k=0;k<=maxSteps;k+=tick){
      const px=x(k);
      svg('line',{'class':'anb-path-gridline',x1:px,y1:box.top,x2:px,y2:box.bottom},layers);
      svg('text',{'class':'anb-path-tick',x:px,y:box.bottom+27,'text-anchor':'middle'},layers,k);
    }
    svg('line',{'class':'anb-path-axis',x1:box.left,y1:box.bottom,x2:box.right,y2:box.bottom},layers);
    svg('line',{'class':'anb-path-axis',x1:box.left,y1:box.top,x2:box.left,y2:box.bottom},layers);
    svg('text',{'class':'anb-path-axis-label',x:(box.left+box.right)/2,y:681,'text-anchor':'middle'},root,
      'Iteration step  k');
    svg('text',{'class':'anb-path-axis-label',x:26,y:343,transform:'rotate(-90 26 343)','text-anchor':'middle'},root,
      'Value  n  (log₂ scale)');
  }
  function renderGraph(){
    cancelAnimationFrame(state.animFrame);
    root.replaceChildren();
    svg('title',{},root,'First 25 positive-integer trajectories for '+state.a+'n + '+state.b);
    svg('desc',{},root,'Each coloured line represents one trajectory using n/2 for even values and an+b for odd values. The horizontal axis is iteration count; the vertical axis shows values on a logarithmic scale. Only a finite number of steps is tested.');
    const g=sceneGeometry();
    state.geometry=g;
    renderAxes(g);
    const paths=svg('g',{},root);
    const selected=state.selected;
    // Draw longer paths behind shorter ones so all 25 can be inspected.
    const ordered=state.paths.slice().sort((p,q)=>q.values.length-p.values.length);
    for(const p of ordered){
      const attrs={'class':'anb-trajectory'+(selected!==null&&(p.start===selected?' is-selected':' is-muted')),
        d:plotString(p,g),stroke:p.start===selected?'#ffd479':colorFor(p.start),
        'data-seed':p.start,'aria-label':'Starting '+p.start+': '+labels[p.status],
        'stroke-width':p.start===selected?5:2.2};
      const line=svg('path',attrs,paths);
      svg('title',{},line,'Start '+p.start+' · '+labels[p.status]+' · '+(p.values.length-1)+' steps');
      // Include a visible point for single-point paths such as seed 1.
      if(p.values.length===1||p.start===selected){
        const end=p.values[p.values.length-1],i=p.values.length-1;
        svg('circle',{'class':'anb-endpoint',cx:g.x(i),cy:g.y(end),
          r:p.start===selected?7:4,fill:p.start===selected?'#ffd479':colorFor(p.start)},paths);
      }
    }
    if(selected!==null){
      const p=state.paths.find(v=>v.start===selected);
      if(p)svg('circle',{cx:g.x(0),cy:g.y(p.values[0]),r:7,
        fill:'#ffd479',stroke:'#071120','stroke-width':2},root);
    }
    const longest=Math.max(...state.paths.map(p=>p.values.length-1));
    const highest=state.paths.reduce((v,p)=>p.peak>v?p.peak:v,0n);
    els.mapStats.textContent=longest+' longest steps · peak '+numberText(highest);
  }
  function renderSeedButtons(){
    els.seedGrid.replaceChildren();
    for(const p of state.paths){
      const btn=document.createElement('button');
      btn.type='button';btn.className='anb-seed'+(p.start===state.selected?' is-selected':'');
      btn.style.setProperty('--seed-colour',colorFor(p.start));
      btn.setAttribute('aria-pressed',String(p.start===state.selected));
      btn.setAttribute('aria-label','Select starting value '+p.start+'. '+labels[p.status]);
      btn.textContent=String(p.start);
      btn.title='Start '+p.start+': '+labels[p.status];
      btn.addEventListener('click',()=>selectSeed(p.start));
      els.seedGrid.appendChild(btn);
    }
  }
  function renderInspector(){
    const p=state.paths.find(q=>q.start===state.selected);
    els.inspector.hidden=!p;
    els.inspectorPlaceholder.hidden=!!p;
    els.animate.disabled=!p||p.values.length<2;
    els.copyPath.disabled=!p;
    if(!p)return;
    els.detailStart.textContent=p.start;
    els.detailSteps.textContent=String(p.values.length-1);
    els.detailPeak.textContent=numberText(p.peak);
    els.detailOutcome.textContent=labels[p.status];
    els.detailSequence.replaceChildren();
    const maxShown=75;
    p.values.slice(0,maxShown).forEach(n=>{
      const span=document.createElement('span');
      span.className='anb-path-value';span.textContent=numberText(n);
      els.detailSequence.appendChild(span);
    });
    if(p.values.length>maxShown){
      const tail=document.createElement('span');tail.className='anb-path-value';
      tail.textContent='… '+numberText(p.values[p.values.length-1]);
      els.detailSequence.appendChild(tail);
    }
    const notes={
      one:'This tested trajectory reaches 1. We stop at its first visit to 1; the rule may continue afterward.',
      cycle:'A value repeated. The displayed ending closes a cycle of '+(p.values.length-1-p.cycleStart)+' steps. It was not observed to reach 1 first.',
      cap:'The next value would be '+numberText(p.overshoot)+', above the exploration limit of '+numberText(MAX_VALUE)+'. This does not prove divergence.',
      limit:'No 1 or repeated value was detected within '+MAX_STEPS+' steps. This does not prove divergence.'
    };
    els.detailNote.textContent=notes[p.status];
  }
  function renderStats(){
    const count={one:0,cycle:0,cap:0,limit:0};
    state.paths.forEach(p=>count[p.status]++);
    els.reached.textContent=count.one;
    els.cycles.textContent=count.cycle;
    els.capped.textContent=count.cap;
    els.limited.textContent=count.limit;
  }
  function clearAnimation(){
    cancelAnimationFrame(state.animFrame);
    root.querySelectorAll('.anb-trace-overlay,.anb-trace-dot').forEach(e=>e.remove());
  }
  function selectSeed(n){
    clearAnimation();
    state.selected=n;
    renderGraph();
    renderSeedButtons();
    renderInspector();
  }
  function settingsURL(){
    const url=new URL(window.location.href);
    url.searchParams.set('a',state.a);
    url.searchParams.set('b',state.b);
    return url.toString();
  }
  function updateRules(){
    clearAnimation();
    state.a=Number(els.a.value);state.b=Number(els.b.value);
    state.paths=allPaths(state.a,state.b);
    els.valueA.textContent=state.a;els.valueB.textContent=state.b;
    els.ruleA.textContent=state.a;els.ruleB.textContent=state.b;
    els.currentTitle.textContent=state.a+'n + '+state.b+'.';
    els.ruleCaption.textContent='Odd rule: multiply by '+state.a+', then add '+state.b+'.';
    document.querySelectorAll('.anb-preset').forEach(b=>{
      b.classList.toggle('is-current',Number(b.dataset.a)===state.a&&Number(b.dataset.b)===state.b);
    });
    renderStats();renderGraph();renderSeedButtons();renderInspector();
    try{window.history.replaceState(null,'',settingsURL());}catch(_){}
  }
  async function copyText(textToCopy,element,okMessage){
    try{
      if(!navigator.clipboard||!navigator.clipboard.writeText)throw Error('No clipboard');
      await navigator.clipboard.writeText(textToCopy);
      element.textContent=okMessage;
    }catch(_){
      window.prompt('Copy this text:',textToCopy);
      if(element)element.textContent='Copy from the dialog to share.';
    }
  }
  function saveSVG(){
    const svgText=new XMLSerializer().serializeToString(root);
    const blob=new Blob([svgText],{type:'image/svg+xml;charset=utf-8'});
    const link=document.createElement('a');
    const obj=URL.createObjectURL(blob);
    link.href=obj;link.download='anb-'+state.a+'n-plus-'+state.b+'-paths-1-to-25.svg';
    document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(obj),1500);
  }
  function animateSelected(){
    const p=state.paths.find(q=>q.start===state.selected);
    if(!p||p.values.length<2)return;
    clearAnimation();
    const g=state.geometry;
    const d=plotString(p,g);
    const overlay=svg('path',{d,'class':'anb-trace-overlay',fill:'none',
      stroke:'#fff2c0','stroke-width':4.5,'stroke-linecap':'round','stroke-linejoin':'round',
      'pathLength':1},root);
    const marker=svg('circle',{'class':'anb-trace-dot',r:6,cx:g.x(0),cy:g.y(p.values[0])},root);
    const length=overlay.getTotalLength();
    if(!length||!Number.isFinite(length))return;
    overlay.style.strokeDasharray=length;
    overlay.style.strokeDashoffset=length;
    const duration=reduced?50:Math.min(8000,Math.max(1500,p.values.length*55));
    const begin=performance.now();
    function frame(now){
      const t=Math.max(0,Math.min(1,(now-begin)/duration));
      const traveled=t*length;
      overlay.style.strokeDashoffset=length-traveled;
      const point=overlay.getPointAtLength(traveled);
      marker.setAttribute('cx',point.x);marker.setAttribute('cy',point.y);
      if(t<1)state.animFrame=requestAnimationFrame(frame);
    }
    state.animFrame=requestAnimationFrame(frame);
  }

  function initialNumber(name,defaultValue,min,max){
    const raw=new URLSearchParams(window.location.search).get(name);
    if(raw===null||!/^\d+$/.test(raw))return defaultValue;
    const val=Number(raw);
    return Number.isInteger(val)&&val>=min&&val<=max?val:defaultValue;
  }
  els.a.value=initialNumber('a',3,1,11);
  els.b.value=initialNumber('b',1,1,19);
  els.a.addEventListener('input',updateRules);
  els.b.addEventListener('input',updateRules);
  document.querySelectorAll('.anb-preset').forEach(btn=>{
    btn.addEventListener('click',()=>{
      els.a.value=btn.dataset.a;
      els.b.value=btn.dataset.b;
      updateRules();
    });
  });
  els.showAll.addEventListener('click',()=>selectSeed(null));
  els.save.addEventListener('click',saveSVG);
  els.share.addEventListener('click',()=>copyText(settingsURL(),els.shareStatus,'Link copied. Share it with Paul.'));
  els.copyPath.addEventListener('click',()=>{
    const path=state.paths.find(p=>p.start===state.selected);
    if(!path)return;
    copyText(path.values.join(' → '),els.detailNote,'Path copied.');
  });
  els.animate.addEventListener('click',animateSelected);
  root.addEventListener('click',event=>{
    const element=event.target.closest('[data-seed]');
    if(element)selectSeed(Number(element.dataset.seed));
  });
  updateRules();
})();

/* Digging Deeper: finite trajectories from positive starts 1...100.
   Isolated so failures in this lab cannot affect the other chapters.
   One complete classical Collatz orbit is calculated, terminating at 1. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const slider=$('trajectory-start'),chart=$('trajectory-chart');
  if(!slider||!chart)return;

  const ns='http://www.w3.org/2000/svg';
  const output=$('trajectory-start-value');
  const statStart=$('trajectory-stat-start'),statSteps=$('trajectory-stat-steps');
  const statPeak=$('trajectory-stat-peak'),statPeakStep=$('trajectory-stat-peak-step');
  const indicator=$('trajectory-plot-indicator'),detail=$('trajectory-point-inspector');
  const description=$('trajectory-scale-description'),replay=$('trajectory-replay');
  const presets=[...document.querySelectorAll('[data-trajectory-start]')];
  const radios=[...document.querySelectorAll('input[name="trajectory-scale"]')];
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||false;
  const W=960,H=493;
  const box={left:89,right:926,top:43,bottom:425};
  const width=box.right-box.left,height=box.bottom-box.top;
  let values=[],start=27,scale='linear',raf=0,revision=0,chartPosition=null,hovered=null;

  function S(tag,attrs={},parent=chart,text){
    const e=document.createElementNS(ns,tag);
    for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));
    if(text!==undefined)e.textContent=text;
    parent.appendChild(e);
    return e;
  }
  function fmt(n){return n.toLocaleString('en-CA');}
  function compute(n){
    const result=[n];
    let current=n;
    for(let step=0;current!==1&&step<1000;step++){
      current=current%2===0?current/2:3*current+1;
      if(!Number.isSafeInteger(current)||current<1)throw new Error('Collatz calculation exceeded safe integers');
      result.push(current);
    }
    if(result[result.length-1]!==1)throw new Error('The finite trace did not reach 1 within the safeguard');
    return result;
  }
  function niceStep(amount){
    const pow=Math.pow(10,Math.floor(Math.log10(Math.max(amount,.001))));
    const norm=amount/pow;
    return (norm<=1?1:norm<=2?2:norm<=5?5:10)*pow;
  }
  function makeGeometry(){
    const steps=Math.max(1,values.length-1);
    const peak=Math.max(...values);
    const log=scale==='log';
    const logTop=Math.max(1,Math.ceil(Math.log2(peak))+.35);
    const unit=niceStep(Math.max(1,peak*1.10)/5);
    const linearTop=Math.max(2,Math.ceil((peak*1.10)/unit)*unit);
    const x=i=>box.left+(i/steps)*width;
    const y=n=>box.bottom-(log?Math.log2(Math.max(n,1))/logTop:n/linearTop)*height;
    return {steps,peak,x,y,log,logTop,linearTop,unit};
  }
  function updateText(n=0){
    const i=Math.max(0,Math.min(values.length-1,n));
    const label=i===0?'Starting value':i===values.length-1?'Final value':'Iteration '+i;
    detail.textContent=label+' · step '+i+' · value '+fmt(values[i])+
      (i>0?' · '+(values[i-1]%2===0?'previous step: n ÷ 2':'previous step: 3n + 1'):'');
  }
  function clearAnimation(){
    revision++;
    if(raf)cancelAnimationFrame(raf);
    raf=0;
  }
  function plot(){
    clearAnimation();
    chart.replaceChildren();
    const geo=makeGeometry();
    chartPosition=geo;
    const key='trajectory-clip';
    const title=S('title',{id:'trajectory-chart-title'},chart);
    title.textContent='Collatz trajectory of '+start+', with '+(values.length-1)+' iterations';
    const desc=S('desc',{id:'trajectory-chart-desc'},chart);
    desc.textContent='Iteration on the horizontal axis. '+(geo.log?'Base-two logarithmic':'Linear')+
      ' sequence value on the vertical axis. Gold segments are odd rule increases; cyan segments are even rule decreases. The orbit reaches 1.';
    S('rect',{x:box.left,y:box.top,width,height,rx:10,fill:'#071929',
      stroke:'#34516c','stroke-opacity':'.7'});
    const defs=S('defs');
    const clip=S('clipPath',{id:key,clipPathUnits:'userSpaceOnUse'},defs);
    const curtain=S('rect',{x:box.left,y:0,width:0,height:H},clip);
    // Horizontal gridlines and honest axis ticks.
    const yTicks=[];
    if(geo.log){
      const maxP=Math.floor(geo.logTop);
      const step=maxP>10?2:1;
      for(let e=0;e<=maxP;e+=step)yTicks.push(2**e);
      if(!yTicks.includes(1))yTicks.unshift(1);
    }else{
      for(let v=0;v<=geo.linearTop+geo.unit*.01;v+=geo.unit)yTicks.push(v);
    }
    for(const v of yTicks){
      const py=geo.y(v);
      S('line',{x1:box.left,x2:box.right,y1:py,y2:py,'class':'trajectory-gridline'});
      S('text',{x:box.left-12,y:py+4,'text-anchor':'end','class':'trajectory-axis-text'},chart,fmt(v));
    }
    const xStep=niceStep(geo.steps/9);
    for(let k=0;k<=geo.steps;k+=xStep){
      const px=geo.x(k);
      S('line',{x1:px,x2:px,y1:box.top,y2:box.bottom,'class':'trajectory-gridline'});
      S('text',{x:px,y:box.bottom+22,'text-anchor':'middle','class':'trajectory-axis-text'},chart,String(k));
    }
    S('line',{x1:box.left,y1:box.bottom,x2:box.right,y2:box.bottom,'class':'trajectory-zero-line'});
    S('line',{x1:box.left,y1:box.top,x2:box.left,y2:box.bottom,'class':'trajectory-zero-line'});
    S('text',{x:(box.left+box.right)/2,y:H-11,'text-anchor':'middle','class':'trajectory-axis-name'},chart,'Iterations');
    S('text',{x:20,y:(box.top+box.bottom)/2,transform:'rotate(-90 20 '+((box.top+box.bottom)/2)+')',
      'text-anchor':'middle','class':'trajectory-axis-name'},chart,geo.log?'Value (log₂ scale)':'Value');
    const lines=S('g',{'clip-path':'url(#'+key+')'});
    for(let i=0;i<values.length-1;i++){
      S('path',{d:'M '+geo.x(i).toFixed(3)+' '+geo.y(values[i]).toFixed(3)+
        ' L '+geo.x(i+1).toFixed(3)+' '+geo.y(values[i+1]).toFixed(3),
        'class':'trajectory-line '+(values[i]%2?'trajectory-line-up':'trajectory-line-down')},lines);
    }
    if(values.length<50){
      for(let i=0;i<values.length;i++){
        S('circle',{cx:geo.x(i),cy:geo.y(values[i]),r:3.2,'class':'trajectory-point'},lines);
      }
    }
    // The endpoint and the first (possibly repeated) global peak.
    const peakIndex=values.indexOf(geo.peak);
    const peakX=geo.x(peakIndex),peakY=geo.y(geo.peak);
    S('circle',{cx:peakX,cy:peakY,r:7.1,'class':'trajectory-peak-point'},lines);
    const peakAnchor=peakX>box.right-135?'end':peakX<box.left+110?'start':'middle';
    const peakLabelX=peakAnchor==='end'?peakX-7:peakAnchor==='start'?peakX+7:peakX;
    S('text',{x:peakLabelX,y:Math.max(box.top+18,peakY-16),
      'text-anchor':peakAnchor,'class':'trajectory-annotation'},lines,'PEAK '+fmt(geo.peak));
    const endX=geo.x(values.length-1),endY=geo.y(1);
    S('circle',{cx:endX,cy:endY,r:7.2,'class':'trajectory-finish-point'},lines);
    if(values.length>1)S('text',{x:Math.min(box.right-6,endX-13),y:endY-12,
      'text-anchor':'end',fill:'#8bf0bb','font-size':13,'font-weight':730},lines,'1');
    const cursor=S('g',{visibility:'hidden'});
    const cursorLine=S('line',{x1:box.left,y1:box.top,x2:box.left,y2:box.bottom,
      'class':'trajectory-hover-line'},cursor);
    const cursorDot=S('circle',{cx:geo.x(0),cy:geo.y(values[0]),r:6.5,'class':'trajectory-hover-dot'},cursor);
    function mark(i){
      const px=geo.x(i),py=geo.y(values[i]);
      cursor.setAttribute('visibility','visible');
      cursorLine.setAttribute('x1',px);cursorLine.setAttribute('x2',px);
      cursorDot.setAttribute('cx',px);cursorDot.setAttribute('cy',py);
    }
    const hit=S('rect',{x:box.left,y:box.top,width,height,
      'class':'trajectory-hit-area','aria-hidden':'true'});
    function inspect(event){
      const rect=chart.getBoundingClientRect();
      if(!rect.width)return;
      const localX=(event.clientX-rect.left)*W/rect.width;
      hovered=Math.max(0,Math.min(values.length-1,Math.round(((localX-box.left)/width)*geo.steps)));
      mark(hovered);
      updateText(hovered);
    }
    hit.addEventListener('pointermove',inspect);
    hit.addEventListener('pointerdown',inspect);
    hit.addEventListener('pointerleave',()=>{hovered=null;cursor.setAttribute('visibility','hidden');updateText(values.length-1)});
    chart.setAttribute('aria-label','Collatz trajectory from '+start+
      ': '+(values.length-1)+' steps to 1, highest value '+fmt(geo.peak));
    // Clip width grows from left to right, revealing all coloured segments.
    const currentRevision=revision;
    const span=values.length<=2?500:Math.min(4700,Math.max(1800,values.length*34));
    let started=null;
    function frame(time){
      if(currentRevision!==revision)return;
      if(started===null)started=time;
      const t=reduced?1:Math.min(1,(time-started)/span);
      const ease=1-Math.pow(1-t,2);
      curtain.setAttribute('width',Math.max(4,ease*width));
      const step=Math.min(values.length-1,Math.floor(ease*geo.steps));
      if(hovered===null){
        mark(step);updateText(step);
      }
      indicator.textContent=t<1?'TRACING · STEP '+step+' / '+(values.length-1):
        'COMPLETE · '+(values.length-1)+' STEPS TO 1';
      if(t<1)raf=requestAnimationFrame(frame);
      else{
        raf=0;
        if(hovered===null){cursor.setAttribute('visibility','hidden');updateText(values.length-1);}
      }
    }
    raf=requestAnimationFrame(frame);
  }
  function update(){
    clearAnimation();
    start=Math.max(1,Math.min(100,Number(slider.value)));
    values=compute(start);
    const peak=Math.max(...values);
    output.textContent=start;
    statStart.textContent=fmt(start);
    statSteps.textContent=fmt(values.length-1);
    statPeak.textContent=fmt(peak);
    statPeakStep.textContent=String(values.indexOf(peak));
    presets.forEach(btn=>{
      const chosen=Number(btn.dataset.trajectoryStart)===start;
      btn.classList.toggle('is-active',chosen);
      btn.setAttribute('aria-pressed',String(chosen));
    });
    scale=radios.find(x=>x.checked)?.value==='log'?'log':'linear';
    description.textContent=scale==='log'?'(log₂ scale)':'(linear scale)';
    hovered=null;
    plot();
  }
  slider.addEventListener('input',update);
  presets.forEach(btn=>btn.addEventListener('click',()=>{
    slider.value=btn.dataset.trajectoryStart;
    update();
  }));
  radios.forEach(radio=>radio.addEventListener('change',update));
  replay.addEventListener('click',()=>{hovered=null;plot();});
  update();
})();

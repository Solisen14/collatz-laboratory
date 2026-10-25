/* The Collatz Laboratory · Guided investigation of 27.
   Keeps the established positive-integer an+b model and reports finite
   observations separately from mathematical claims about unbounded growth. */
(() => {
  'use strict';
  const model = window.CollatzExperiment;
  const byId = id => document.getElementById(id);
  const plot = byId('exp27-plot');
  if (!model || !plot) return;
  const ns = 'http://www.w3.org/2000/svg';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const buttons = [...document.querySelectorAll('[data-exp27-rule]')];
  const nodes = {
    step: byId('exp27-step'), value: byId('exp27-value'), peak: byId('exp27-peak'),
    outcome: byId('exp27-outcome'), caption: byId('exp27-caption'),
    observation: byId('exp27-observation'), latest: byId('exp27-latest'),
    range: byId('exp27-range'), rangeLabel: byId('exp27-range-label'),
    play: byId('exp27-play'), full: byId('exp27-full'), reset: byId('exp27-reset'),
    jumpPeak: byId('exp27-jump-peak'), scale: byId('exp27-scale'),
    plotLabel: byId('exp27-plot-label')
  };
  const number = value => BigInt(value).toLocaleString('en-CA');
  const compact = value => {
    const n = Number(value);
    if (n >= 1e12) return (n/1e12).toFixed(n>=1e13?0:1).replace(/\.0$/,'') + 'T';
    if (n >= 1e9) return (n/1e9).toFixed(n>=1e10?0:1).replace(/\.0$/,'') + 'B';
    if (n >= 1e6) return (n/1e6).toFixed(n>=1e7?0:1).replace(/\.0$/,'') + 'M';
    if (n >= 1e4) return (n/1e3).toFixed(n>=1e5?0:1).replace(/\.0$/,'') + 'k';
    return n.toLocaleString('en-CA', {maximumFractionDigits:1});
  };
  const original = model.trace(27, 3, 1);
  const firstOne = original.values.findIndex(n => n === 1n);
  const three = original.values.slice(0, firstOne+1);
  const five = model.trace(27, 5, 1).values;
  // Under 4n+1, every term following 27 is a larger odd positive integer.
  // The finite model stops before the first value exceeding its safety cap.
  const four = model.trace(27, 4, 1).values;
  const cases = {
    3: {
      a: 3, values: three, title: 'The familiar 3n + 1 rule',
      explanation: 'We can see that 27 eventually reaches 1. What happens between the beginning and the end is much less predictable: it climbs as high as 9,232 before descending.',
      ending: 'Reached 1 after 111 steps. Continuing the rule gives 1 → 4 → 2 → 1.',
      status: 'Reached 1', log: false
    },
    5: {
      a: 5, values: five, title: 'Change the odd rule to 5n + 1',
      explanation: 'Now 27 comes back to itself. The sequence cycles through ten different values without ever reaching 1. Changing a single coefficient changes the destination.',
      ending: 'A 10-number cycle closes at 27. This particular orbit never visits 1.',
      status: 'Cycle without 1', log: false
    },
    4: {
      a: 4, values: four, title: 'Try the odd rule 4n + 1',
      explanation: 'Notice that every number is odd. Multiplying an odd number by 4 and adding 1 always produces another, larger odd number. The even rule is never used.',
      ending: 'The plot shows only the first values. This orbit keeps increasing without bound, a result we can prove, not merely guess from a graph.',
      status: 'Grows without bound', log: true
    }
  };
  let active = 3;
  let shown = 8;
  let timer = null;
  const svg = (tag, attributes, parent, text) => {
    const el = document.createElementNS(ns, tag);
    Object.entries(attributes || {}).forEach(([key, value]) => el.setAttribute(key, String(value)));
    if (text !== undefined) el.textContent = text;
    (parent || plot).appendChild(el);
    return el;
  };
  function stop() {
    if (timer !== null) window.clearInterval(timer);
    timer = null;
    nodes.play.textContent = 'Play the path';
    nodes.play.setAttribute('aria-pressed', 'false');
  }
  function metrics() {
    const data = cases[active], values = data.values;
    const visible = values.slice(0, shown+1);
    const peak = visible.reduce((m,n)=>n>m?n:m,0n);
    nodes.step.textContent = String(shown);
    nodes.value.textContent = number(values[shown]);
    nodes.peak.textContent = number(peak);
    nodes.outcome.textContent = shown === values.length-1 ? data.status : 'Still exploring';
    nodes.range.value = String(shown);
    nodes.range.max = String(values.length-1);
    nodes.rangeLabel.textContent = 'Step ' + shown + ' of ' + (values.length-1) + (active===4 ? ' shown' : '');
    nodes.caption.textContent = data.title;
    nodes.scale.textContent = data.log ? 'VERTICAL AXIS: LOGARITHMIC SCALE' : 'VERTICAL AXIS: VALUE';
    nodes.plotLabel.textContent = data.log
      ? 'Magnitude plotted on a logarithmic scale because values grow so quickly.'
      : 'Magnitude plotted on a linear scale. Each point is one iteration.';
    nodes.observation.textContent = shown === values.length-1 ? data.ending : data.explanation;
    nodes.full.disabled = shown === values.length-1;
    nodes.jumpPeak.hidden = active !== 3;
    const latest = visible.slice(Math.max(0,visible.length-8));
    nodes.latest.replaceChildren();
    if (visible.length > latest.length) {
      const ellipsis = document.createElement('span');
      ellipsis.className = 'exp27-ellipsis';
      ellipsis.textContent = '…';
      nodes.latest.appendChild(ellipsis);
    }
    latest.forEach((n,i) => {
      const item = document.createElement('span');
      item.className = 'exp27-term' + (i===latest.length-1?' is-current':'');
      item.textContent = number(n);
      nodes.latest.appendChild(item);
      if (i<latest.length-1) {
        const arrow = document.createElement('span');
        arrow.className = 'exp27-arrow';
        arrow.textContent = '→';
        arrow.setAttribute('aria-hidden', 'true');
        nodes.latest.appendChild(arrow);
      }
    });
  }
  function graph() {
    const data = cases[active], values = data.values;
    const w=980,h=385,left=88,right=37,top=31,bottom=60;
    const pw=w-left-right,ph=h-top-bottom;
    const end=values.length-1;
    const numeric=values.map(v=>Number(v));
    const scaled=numeric.map(v=>data.log?Math.log10(v):v);
    const max=Math.max(...scaled);
    const mapX=i=>left+pw*(i/end);
    const mapY=i=>top+ph*(1-scaled[i]/(max||1));
    plot.replaceChildren();
    plot.setAttribute('viewBox', '0 0 '+w+' '+h);
    svg('title', {}, plot, 'Trajectory of 27 under the '+active+'n+1 odd rule');
    svg('desc', {}, plot, 'Horizontal axis: iteration. Vertical axis: '+(data.log?'base-ten logarithm of the value':'value')+'. The revealed portion reaches step '+shown+'.');
    for(let i=0;i<=4;i++) {
      const y=top+ph*(1-i/4);
      svg('line',{x1:left,y1:y,x2:w-right,y2:y,class:'exp27-grid'},plot);
      const label=data.log?compact(Math.round(Math.pow(10,max*i/4))):compact(max*i/4);
      svg('text',{x:left-15,y:y+5,'text-anchor':'end',class:'exp27-tick'},plot,label);
    }
    for(let i=0;i<=4;i++){
      const n=Math.round(end*i/4);
      const x=mapX(n);
      svg('text',{x,y:h-bottom+25,'text-anchor':'middle',class:'exp27-tick'},plot,String(n));
    }
    svg('text',{x:left+pw/2,y:h-9,'text-anchor':'middle',class:'exp27-axis-label'},plot,'ITERATIONS');
    svg('text',{x:20,y:top+ph/2,'text-anchor':'middle',transform:'rotate(-90 20 '+(top+ph/2)+')',class:'exp27-axis-label'},plot,data.log?'VALUE (LOG SCALE)':'VALUE');
    let whole='';
    values.forEach((v,i)=>{whole+=(i?' L ':'M ')+mapX(i).toFixed(2)+' '+mapY(i).toFixed(2);});
    svg('path',{d:whole,class:'exp27-unseen'},plot);
    for(let i=0;i<shown;i++){
      svg('line',{x1:mapX(i),y1:mapY(i),x2:mapX(i+1),y2:mapY(i+1),
        class:values[i]%2n===0n?'exp27-segment is-even':'exp27-segment is-odd'},plot)
        .appendChild(document.createElementNS(ns,'title')).textContent =
        number(values[i])+' → '+number(values[i+1]);
    }
    if(shown>0) {
      const visible=values.slice(0,shown+1);
      const peak=visible.reduce((acc,n,i)=>n>acc.value?{value:n,index:i}:acc,{value:0n,index:0});
      const px=mapX(peak.index),py=mapY(peak.index);
      if(peak.index>0) {
        svg('circle',{cx:px,cy:py,r:6,class:'exp27-peak-dot'},plot);
        const side=px>w*.76?'end':'start';
        const dx=side==='end'?-13:13;
        svg('text',{x:px+dx,y:Math.max(19,py-13),'text-anchor':side,class:'exp27-peak-label'},plot,
          'HIGH '+compact(peak.value));
      }
    }
    const x=mapX(shown),y=mapY(shown);
    svg('line',{x1:x,y1:top,x2:x,y2:top+ph,class:'exp27-cursor-line'},plot);
    svg('circle',{cx:x,cy:y,r:10,class:'exp27-cursor-halo'},plot);
    const point=svg('circle',{cx:x,cy:y,r:5,class:'exp27-cursor'},plot);
    svg('title',{},point,'Step '+shown+': '+number(values[shown]));
    if(shown===end && active===5) {
      svg('text',{x:w-right-10,y:top+17,'text-anchor':'end',class:'exp27-annotation'},plot,'BACK TO 27 · CYCLE CLOSED');
    }
    if(shown===end && active===3) {
      svg('text',{x:w-right-10,y:top+17,'text-anchor':'end',class:'exp27-annotation'},plot,'REACHED 1');
    }
  }
  function render(){metrics();graph();}
  function change(rule) {
    if(!cases[rule])return;
    stop();
    active=rule;
    shown=rule===3?8:Math.min(5,cases[rule].values.length-1);
    buttons.forEach(button=>{
      const selected=Number(button.dataset.exp27Rule)===active;
      button.classList.toggle('is-selected',selected);
      button.setAttribute('aria-pressed',String(selected));
    });
    render();
  }
  buttons.forEach(button=>button.addEventListener('click',()=>change(Number(button.dataset.exp27Rule))));
  nodes.range.addEventListener('input',()=>{
    stop();shown=Number(nodes.range.value);render();
  });
  nodes.full.addEventListener('click',()=>{
    stop();shown=cases[active].values.length-1;render();
  });
  nodes.reset.addEventListener('click',()=>{
    stop();shown=0;render();
  });
  nodes.jumpPeak.addEventListener('click',()=>{
    stop();
    const values=cases[active].values;
    const peak=values.reduce((acc,v,i)=>v>acc.value?{value:v,index:i}:acc,{value:0n,index:0});
    shown=peak.index;render();
  });
  nodes.play.addEventListener('click',()=>{
    if(timer!==null){stop();return;}
    if(shown>=cases[active].values.length-1)shown=0;
    if(reducedMotion){shown=cases[active].values.length-1;render();return;}
    nodes.play.textContent='Pause';
    nodes.play.setAttribute('aria-pressed','true');
    render();
    timer=window.setInterval(()=>{
      shown++;
      render();
      if(shown>=cases[active].values.length-1)stop();
    },active===3?85:360);
  });
  change(3);
})();

/* Progressive enhancement for two local, reversible mathematical stories. */
(function () {
  'use strict';
  const M = window.CollatzDeeperMotion;
  if (!M) return;
  const NS = 'http://www.w3.org/2000/svg';
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = window.matchMedia('(max-width: 600px)');
  const controllers = [];
  const colour = n => n % 2 === 0 ? '#7ae7ff' : '#ffd479';
  const display = n => String(n).replace('-', '−');
  function el(tag, attrs, parent, text) {
    const item = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([k,v]) => item.setAttribute(k, String(v)));
    if (text !== undefined) item.textContent = text;
    if (parent) parent.appendChild(item);
    return item;
  }
  function markers(svg, id) {
    const defs = el('defs', {}, svg);
    for (const [kind, stroke] of [['even','#7ae7ff'],['odd','#ffd479']]) {
      const marker = el('marker', {id:id+'-'+kind,viewBox:'0 0 10 10',refX:8.5,refY:5,markerWidth:8,markerHeight:8,markerUnits:'userSpaceOnUse',orient:'auto'}, defs);
      el('path', {d:'M0 0 L10 5 L0 10Z',fill:stroke}, marker);
    }
  }
  function node(svg, value, p) {
    const g = el('g', {class:'deeper-motion-node'}, svg);
    el('circle', {cx:p.x,cy:p.y,r:27,stroke:colour(value)}, g);
    el('text', {x:p.x,y:p.y}, g, display(value));
    return g;
  }
  function edge(svg, a, b, value, id) {
    const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len;
    return el('path', {d:`M ${a.x+ux*30} ${a.y+uy*30} L ${b.x-ux*36} ${b.y-uy*36}`,
      class:'deeper-motion-edge',stroke:colour(value),'marker-end':`url(#${id}-${value%2===0?'even':'odd'})`}, svg);
  }
  function marker(svg) {
    const g=el('g',{class:'deeper-motion-marker'},svg);
    el('circle',{r:31},g);const text=el('text',{x:0,y:0},g);
    return {g,text};
  }
  function move(marker, p, value) {
    marker.g.style.transform=`translate(${p.x}px, ${p.y}px)`;
    marker.text.textContent=display(value);
  }
  function future(element, hidden) { element.classList.toggle('is-future', hidden); }
  function equation(start, step, value) { return `C<sup>${step}</sup>(${display(start)}) = <strong>${display(value)}</strong>`; }

  const configs = {
    periodic: {
      title:'An initial path. Then a repeating cycle.',label:'PERIODIC · EVENTUALLY PERIODIC',max:14,
      description:'The orbit from 3 takes five steps to enter the cycle at 4. The cycle is 4 to 2 to 1 to 4, of period 3. Starting at 4 begins inside that cycle.',
      beats:state=>state.start===3?[
        [0,'BEGIN OUTSIDE THE CYCLE','Start at 3.','Follow the initial path. The starting value 3 has not returned to itself.'],
        [5,'ENTERING THE CYCLE','The orbit reaches 4.','After five applications, the orbit enters the cycle at 4. The first arrival at 1 comes two steps later.'],
        [8,'A VALUE RETURNS','We have seen 4 before.','4 → 2 → 1 → 4 closes a period-3 cycle. The starting value 3 never returns; its orbit is eventually periodic.'],
        [14,'COMPARE THE STARTING POINT','What if we begin at 4?','The cycle repeats while the initial path stays behind. Use “Start at 4” to compare a periodic starting point with 3.']
      ]:[
        [0,'BEGIN INSIDE THE CYCLE','Start at 4.','There is no initial path to travel: 4 is already in the repeating cycle.'],
        [2,'FOLLOW THE RULE','4 → 2 → 1.','Two applications have taken us to 1. Keep going: the starting value is 4.'],
        [3,'THE STARTING VALUE RETURNS','Back to 4 after three steps.','C³(4) = 4. The starting point itself returns, so 4 is periodic, with period 3.'],
        [9,'PERIODIC FROM THE START','The same three steps repeat.','Starting at 4, 2 or 1 begins inside the same cycle. A periodic orbit is also eventually periodic, with no initial tail.']
      ],
      build(svg,id) {
        svg.setAttribute('viewBox','0 0 900 370');
        const values=[3,10,5,16,8,4,2,1];
        const points=[{x:55,y:155},{x:161,y:155},{x:267,y:155},{x:373,y:155},{x:479,y:155},{x:616,y:155},{x:802,y:155},{x:711,y:286}];
        const halo=el('rect',{x:566,y:84,width:292,height:260,rx:23,fill:'#ffd47906',stroke:'#ffd47966','stroke-dasharray':'5 7',class:'deeper-motion-cycle-halo'},svg);
        const edges=values.slice(1).map((_,i)=>edge(svg,points[i],points[i+1],values[i],id));
        const close=edge(svg,points[7],points[5],1,id);
        const nodes=values.map((n,i)=>node(svg,n,points[i]));
        const tailLabel=el('text',{x:35,y:48,class:'motion-row-label'},svg,'INITIAL PATH');
        el('text',{x:590,y:48,class:'motion-row-label'},svg,'4 → 2 → 1 → 4');
        const playhead=marker(svg);
        return (step,state,ui)=>{
          const fromThree=state.start===3;
          tailLabel.textContent=fromThree?'INITIAL PATH':'NO INITIAL PATH';
          const info=M.cycleInfo(state.start);
          const seq=M.orbit(state.start,step);
          const index=fromThree?(step<5?step:5+(step-5)%3):5+step%3;
          nodes.forEach((n,i)=>{
            future(n,fromThree?i>Math.min(step,7):i<5||i>5+Math.min(step,2));
            n.style.opacity=!fromThree&&i<5?'0':fromThree&&step>=info.firstRepeat&&i<5?'.3':'';
          });
          edges.forEach((n,i)=>{
            const visited=fromThree?step>i:i>=5&&step>i-5;
            future(n,!visited);n.style.opacity=!fromThree&&i<5?'0':fromThree&&step>=info.firstRepeat&&i<5?'.3':'';
          });
          future(close,step<info.firstRepeat);
          halo.style.opacity=step>=info.firstRepeat?'1':'.15';
          move(playhead,points[index],seq[step]);
          ui.equation.innerHTML=equation(state.start,step,seq[step]);
          let caption;
          if(fromThree)caption=step<5?'The initial path has not yet reached the repeating cycle.':step<8?'The orbit is inside the cycle. Watch for the first return to 4.':'The cycle has period 3. The starting value 3 does not return: its orbit is eventually periodic.';
          else caption=step<3?'4 begins inside the cycle. Follow its first return to the starting value.':'4 returns to itself after 3 applications. It is periodic from the start.';
          ui.caption.textContent=caption;
          return `Starting at ${state.start}, step ${step}, value ${seq[step]}. ${caption}`;
        };
      }
    },
    reflection: {
      title:'Reflecting a negative orbit.',label:'NEGATIVE INPUTS · POSITIVE MAGNITUDES',max:9,
      description:'Negative Collatz: −3, −8, −4, −2, −1, −2. Their magnitudes are 3, 8, 4, 2, 1, 2, using 3m−1 for odd magnitudes. Ordinary positive Collatz gives 3, 10, 5, 16, 8, 4.',
      beats:()=>[
        [0,'FOLLOW A NEGATIVE ORBIT','Begin with −3.','Apply the same Collatz rules: −3 → −8 → −4. The orbit stays negative.'],
        [3,'TAKE ABSOLUTE VALUES','See the same orbit as magnitudes.','The signs disappear: 3 → 8 → 4. For odd m, |C(−m)| = 3m − 1. Even magnitudes are still halved.'],
        [6,'COMPARE THE ODD STEPS','The first step already differs.','From magnitude 3, the reflected rule gives 3·3 − 1 = 8. Ordinary positive Collatz gives 3·3 + 1 = 10.'],
        [9,'CONTINUE BOTH SYSTEMS','The rules lead to different paths.','The reflected magnitudes enter 2 → 1 → 2. Ordinary positive Collatz follows 3 → 10 → 5 → 16 → 8 → 4. Reflecting the signs changes the odd rule.']
      ],
      build(svg,id) {
        svg.setAttribute('viewBox','0 0 900 445');
        const xs=[75,225,375,525,675,825];
        const rows=[M.negative,M.magnitudes,M.positive];
        const ys=[92,235,378];
        const rowGroups=rows.map(()=>el('g',{class:'deeper-motion-row'},svg));
        const labels=['NEGATIVE INTEGERS','MAGNITUDES  m = |n|','ORDINARY POSITIVE COLLATZ'];
        const rules=['odd: 3n + 1','odd: 3m − 1','odd: 3m + 1'];
        const objects=rows.map((values,r)=>{
          el('text',{x:35,y:ys[r]-49,class:'motion-row-label'},rowGroups[r],labels[r]);
          el('text',{x:860,y:ys[r]-49,class:'motion-rule-label'},rowGroups[r],rules[r]);
          const edges=values.slice(1).map((_,i)=>edge(rowGroups[r],{x:xs[i],y:ys[r]},{x:xs[i+1],y:ys[r]},values[i],id));
          const group=el('g',{class:r===1?'deeper-motion-magnitude':''},rowGroups[r]);
          const nodes=values.map((v,i)=>node(group,v,{x:xs[i],y:ys[r]}));
          return {nodes,edges,group};
        });
        return (step,state,ui)=>{
          const frame=M.reflectionFrame(step);
          const indices=[frame.negativeIndex,frame.magnitudeIndex,frame.positiveIndex];
          objects.forEach((row,r)=>{
            rowGroups[r].style.opacity=indices[r]<0?'0':'1';
            row.nodes.forEach((n,i)=>future(n,i>indices[r]));
            row.edges.forEach((n,i)=>future(n,i>=indices[r]));
          });
          objects[1].group.style.transform=step<3?'translateY(-143px)':'translateY(0)';
          if(step<3)ui.equation.innerHTML=equation(-3,step,M.negative[step]);
          else if(step===3)ui.equation.innerHTML='|−3| = <strong>3</strong> &nbsp; · &nbsp; |−8| = <strong>8</strong>';
          else if(step===4)ui.equation.innerHTML='Compare the two rules at <strong>3</strong>.';
          else ui.equation.innerHTML='3 → <strong>8</strong> &nbsp; and &nbsp; 3 → <strong>10</strong>';
          const caption=step<3?'The usual Collatz function: odd inputs use 3n + 1; even inputs are halved.':step===3?'Absolute values reveal the 3m − 1 rule for odd magnitudes. This is a different positive system.':step<7?'The starting magnitude is the same. The odd rule differs by its constant: −1 or +1.':'Each arrow follows its row’s stated rule. Halving agrees; the odd rules produce different orbits.';
          ui.caption.textContent=caption;
          return `Comparison step ${step} of 9. ${caption}`;
        };
      }
    }
  };

  function mount(source, key) {
    const cfg=configs[key];
    const state={start:3,step:-1,mode:media.matches?'reduced':narrow.matches?'manual':'scroll',timer:null,lastTime:0};
    const shell=document.createElement('section');
    shell.className='deeper-motion-story';shell.dataset.scene=key;shell.id='deeper-'+key;
    shell.setAttribute('aria-labelledby',shell.id+'-title');
    shell.innerHTML=`<div class="deeper-motion-grid"><div class="deeper-motion-stage">
      <div class="deeper-motion-topline"><span>${cfg.label}</span><span class="deeper-motion-mode"></span></div>
      <h4 id="${shell.id}-title">${cfg.title}</h4>
      <div class="deeper-motion-equation"></div>
      ${key==='reflection'?'<p class="deeper-motion-proof">For odd positive m: C(−m) = −(3m − 1).</p>':''}
      ${key==='periodic'?'<div class="deeper-motion-starts" role="group" aria-label="Choose a periodicity example"><button type="button" data-start="3" aria-pressed="true">Start at 3</button><button type="button" data-start="4" aria-pressed="false">Start at 4</button></div>':''}
      <div class="deeper-motion-viewport" tabindex="0" role="region" aria-label="${cfg.title} Diagram"><svg class="deeper-motion-svg" role="img" aria-labelledby="${shell.id}-svg-title ${shell.id}-svg-desc"><title id="${shell.id}-svg-title">${cfg.title}</title><desc id="${shell.id}-svg-desc">${cfg.description}</desc></svg></div>
      <p class="deeper-motion-hint">Swipe or scroll sideways to explore the full diagram.</p>
      <p class="deeper-motion-caption"></p>
      <div class="deeper-motion-progress" aria-hidden="true"><span></span></div>
      <div class="deeper-motion-controls" role="group" aria-label="${key==='periodic'?'Periodicity':'Reflection'} animation controls">
        <button type="button" data-action="previous">Previous step</button><button type="button" data-action="play">Play</button><button type="button" data-action="next">Next step</button><button type="button" data-action="scroll" aria-pressed="true">Follow scroll</button>
      </div><div class="deeper-motion-status deeper-motion-sr" role="status" aria-live="polite"></div>
    </div><div class="deeper-motion-beats"></div>
    <aside class="deeper-motion-manual" aria-label="Current diagram explanation" hidden><div class="deeper-motion-card"><small></small><h5></h5><p></p></div></aside></div>`;
    source.before(shell);
    const ui={
      equation:shell.querySelector('.deeper-motion-equation'),caption:shell.querySelector('.deeper-motion-caption'),
      mode:shell.querySelector('.deeper-motion-mode'),status:shell.querySelector('.deeper-motion-status'),
      manual:shell.querySelector('.deeper-motion-manual'),
      progress:shell.querySelector('.deeper-motion-progress span'),beatHost:shell.querySelector('.deeper-motion-beats'),
      previous:shell.querySelector('[data-action="previous"]'),next:shell.querySelector('[data-action="next"]'),
      play:shell.querySelector('[data-action="play"]'),scroll:shell.querySelector('[data-action="scroll"]')
    };
    const svg=shell.querySelector('svg');
    markers(svg,shell.id);
    const draw=cfg.build(svg,shell.id);
    let beats=[];
    const max=()=>key==='periodic'&&state.start===4?9:cfg.max;
    function buildBeats(){
      beats=cfg.beats(state);
      ui.beatHost.innerHTML=beats.map((b,i)=>`<div class="deeper-motion-beat" data-step="${b[0]}"><div class="deeper-motion-card"><small>0${i+1} / ${b[1]}</small><h5>${b[2]}</h5><p>${b[3]}</p></div></div>`).join('');
    }
    function stop(){if(state.timer!==null){window.cancelAnimationFrame(state.timer);state.timer=null;}state.lastTime=0;}
    function render(step,announce=false){
      step=Math.max(0,Math.min(max(),Math.round(step)));
      if(step!==state.step){state.step=step;const message=draw(step,state,ui);if(announce)ui.status.textContent=message;}
      ui.previous.disabled=step===0;ui.next.disabled=step===max();
      ui.play.disabled=media.matches;ui.scroll.disabled=media.matches||narrow.matches;
      ui.play.textContent=state.mode==='play'?'Pause':step===max()?'Replay':'Play';
      ui.scroll.setAttribute('aria-pressed',String(state.mode==='scroll'));
      ui.mode.textContent=media.matches?'COMPLETE VIEW · REDUCED MOTION':state.mode==='scroll'?'SCROLL TO FOLLOW':state.mode==='play'?'PLAYING':`STEP ${step} / ${max()}`;
      ui.progress.style.transform=`scaleX(${step/max()})`;
      const active=beats.reduce((found,b,i)=>step>=b[0]?i:found,0);
      [...ui.beatHost.children].forEach((b,i)=>b.classList.toggle('is-current',i===active));
      const controlling=state.mode==='manual'||state.mode==='play';
      ui.beatHost.setAttribute('aria-hidden',String(controlling));
      ui.manual.hidden=!controlling;
      ui.manual.querySelector('small').textContent=`STEP ${step} / ${max()}`;
      ui.manual.querySelector('h5').innerHTML=ui.equation.innerHTML;
      ui.manual.querySelector('p').textContent=ui.caption.textContent;
      shell.dataset.step=String(step);shell.dataset.mode=state.mode;shell.dataset.start=String(state.start);
    }
    function inspect(){
      if(media.matches||narrow.matches)return;
      const rect=shell.getBoundingClientRect();
      if(rect.bottom<0||rect.top>window.innerHeight){if(state.mode==='play'){stop();state.mode='manual';render(state.step);}return;}
      if(state.mode!=='scroll')return;
      const centres=[...ui.beatHost.children].map(b=>{const r=b.getBoundingClientRect();return r.top+r.height*.5;});
      render(M.scrollStep(centres,beats.map(b=>b[0]),window.innerHeight*.54));
    }
    function manual(delta){stop();state.mode=media.matches?'reduced':'manual';render(state.step+delta,true);}
    ui.previous.addEventListener('click',()=>manual(-1));ui.next.addEventListener('click',()=>manual(1));
    ui.scroll.addEventListener('click',()=>{stop();state.mode='scroll';inspect();render(state.step);ui.status.textContent='The animation follows your scroll position.';});
    ui.play.addEventListener('click',()=>{
      if(media.matches)return;
      if(state.mode==='play'){stop();state.mode='manual';render(state.step,true);return;}
      if(state.step===max())render(0,true);
      state.mode='play';state.lastTime=0;render(state.step);
      function tick(time){
        if(!state.lastTime)state.lastTime=time;
        if(time-state.lastTime>=900){state.lastTime=time;render(state.step+1,true);}
        if(state.step===max()){state.timer=null;state.mode='manual';render(state.step);return;}
        state.timer=window.requestAnimationFrame(tick);
      }
      state.timer=window.requestAnimationFrame(tick);
    });
    shell.querySelectorAll('[data-start]').forEach(button=>button.addEventListener('click',()=>{
      stop();state.start=Number(button.dataset.start);state.mode=media.matches?'reduced':'manual';state.step=-1;
      shell.querySelectorAll('[data-start]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      buildBeats();render(media.matches||narrow.matches?max():0,true);
    }));
    buildBeats();render(media.matches||narrow.matches?max():0);
    source.hidden=true;
    controllers.push({inspect,preference(){stop();state.mode=media.matches?'reduced':narrow.matches?'manual':'scroll';state.step=-1;if(media.matches||narrow.matches)render(max());else{inspect();render(state.step);}},pause(){if(state.mode==='play'){stop();state.mode='manual';render(state.step);}}});
    inspect();
  }
  for(const key of Object.keys(configs)){
    const source=document.querySelector(`[data-motion-source="${key}"]`);
    if(source)mount(source,key);
  }
  let scheduled=false;
  function schedule(){if(scheduled)return;scheduled=true;window.requestAnimationFrame(()=>{scheduled=false;controllers.forEach(c=>c.inspect());});}
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
  window.addEventListener('pageshow',schedule);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)controllers.forEach(c=>c.pause());});
  media.addEventListener('change',()=>controllers.forEach(c=>c.preference()));
  narrow.addEventListener('change',()=>controllers.forEach(c=>c.preference()));
})();

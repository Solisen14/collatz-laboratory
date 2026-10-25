/* Animate the existing small orbit cards, without adding scroll-story sections. */
(() => {
  'use strict';
  const model=window.CollatzDeeperMotion;
  if(!model)return;
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const NS='http://www.w3.org/2000/svg';
  const gold='#ffd479',cyan='#7ae7ff',pink='#ff97bb';
  const clamp=n=>Math.max(0,Math.min(1,n));
  const ease=n=>n*n*(3-2*n);
  const configs={
    forward:{values:model.orbit(3,10),width:900,height:108,delay:250,pace:500,laps:1,
      label:'the forward orbit of 3',description:'3 to 10 to 5 to 16 to 8 to 4 to 2 to 1, then 4 to 2 to 1 again. Every arrow is one ordinary Collatz application.'},
    cycle:{values:[1,4,2],width:360,height:130,delay:250,pace:650,laps:3,
      label:'the cycle beginning at 1',description:'1 to 4 to 2, then the curved return arrow goes from 2 back to the same 1. The cycle has period three.'},
    fixed:{values:[-1,1],width:360,height:130,delay:250,pace:850,laps:1,
      label:'the orbit of negative one under squaring',description:'For f(x) = x squared, negative one goes to one. The loop at one shows f(1) = 1. One stays in place as the fixed point.'}
  };
  function el(tag,attrs,parent,text){
    const item=document.createElementNS(NS,tag);
    Object.entries(attrs||{}).forEach(([k,v])=>item.setAttribute(k,String(v)));
    if(text!==undefined)item.textContent=text;
    parent.appendChild(item);return item;
  }
  const controllers=[];
  document.querySelectorAll('[data-inline-orbit]').forEach(host=>{
    const kind=host.dataset.inlineOrbit,cfg=configs[kind];
    if(!cfg)return;
    const card=host.closest('.orbit-chain-panel,.fixed-mini-orbit,.cycle-equation')||host;
    const fallback=document.createElement(kind==='forward'?'div':'span');
    fallback.className='inline-orbit-fallback';
    while(host.firstChild)fallback.appendChild(host.firstChild);
    host.appendChild(fallback);
    const svg=el('svg',{viewBox:`0 0 ${cfg.width} ${cfg.height}`,role:'img','aria-labelledby':`inline-${kind}-title inline-${kind}-desc`},host);
    el('title',{id:`inline-${kind}-title`},svg,cfg.label);
    el('desc',{id:`inline-${kind}-desc`},svg,cfg.description);
    const defs=el('defs',{},svg);
    for(const [name,colour] of [['odd',gold],['even',cyan]]){
      const marker=el('marker',{id:`inline-${kind}-${name}`,viewBox:'0 0 10 10',refX:8.5,refY:5,markerWidth:8,markerHeight:8,markerUnits:'userSpaceOnUse',orient:'auto'},defs);
      el('path',{d:'M0 0 L10 5 L0 10Z',fill:colour},marker);
    }
    const points=cfg.values.map((n,i)=>kind==='forward'?{x:40+i*77,y:53}:kind==='cycle'?{x:40+i*115,y:78}:{x:50+i*140,y:78});
    const segments=[];
    function edge(from,to,loop=false){
      const a=points[from],b=points[to],n=cfg.values[from];
      // The fixed-point example uses squaring, not the Collatz odd rule.
      const colour=kind==='fixed'?(loop?gold:cyan):n%2?gold:cyan;
      const d=loop?kind==='fixed'?'M 211 68 C 272 22 143 0 182 53':'M 270 52 C 270 6 40 6 40 52':`M ${a.x+26} ${a.y} L ${b.x-29} ${b.y}`;
      const path=el('path',{d,pathLength:1,'stroke-dasharray':1,class:'inline-orbit-edge',stroke:colour,'marker-end':`url(#inline-${kind}-${colour===gold?'odd':'even'})`,'data-from':n,'data-to':cfg.values[to]},svg);
      segments.push({from,to,a,b,loop,path});
    }
    cfg.values.slice(1).forEach((_,i)=>edge(i,i+1));
    if(kind==='cycle')edge(2,0,true);
    if(kind==='fixed')edge(1,1,true);
    const nodes=cfg.values.map((n,i)=>{
      const outer=el('g',{transform:`translate(${points[i].x} ${points[i].y})`},svg);
      const node=el('g',{class:'inline-orbit-node','data-value':n},outer);
      el('circle',{r:22,stroke:kind==='fixed'?(n<0?pink:gold):n%2?gold:cyan},node);
      el('text',{x:0,y:0},node,String(n).replace('-','−'));return node;
    });
    if(kind==='forward'){
      el('path',{d:'M 838 53 L 854 53',class:'inline-orbit-edge',stroke:gold,'marker-end':`url(#inline-${kind}-odd)`},svg);
      el('text',{x:867,y:60,class:'inline-orbit-dots'},svg,'⋯');
    }else if(kind==='cycle')el('text',{x:324,y:87,class:'inline-orbit-dots'},svg,'⋯');
    else el('text',{x:252,y:90,class:'inline-orbit-note'},svg,'f(1) = 1');
    const marker=el('g',{class:'inline-orbit-marker','aria-hidden':'true'},svg);
    const ring=el('circle',{r:26},marker);
    const replay=document.createElement('button');
    replay.type='button';replay.className='inline-orbit-replay';replay.textContent='↻';
    replay.setAttribute('aria-label',`Replay ${cfg.label}`);replay.title='Replay animation';card.appendChild(replay);
    let animation=null,started=null,played=false;
    const duration=kind==='fixed'?4400:cfg.delay+cfg.pace*(kind==='cycle'?3*cfg.laps:cfg.values.length-1);
    function stop(){if(animation!==null)window.cancelAnimationFrame(animation);animation=null;started=null;}
    function draw(segment,amount){amount=clamp(amount);segment.path.style.strokeDashoffset=String(1-amount);segment.path.style.opacity=String(.15+.85*amount);}
    function render(elapsed,complete=false){
      const phase=Math.max(0,(elapsed-cfg.delay)/cfg.pace);
      let position,active,radius=26;
      if(kind==='fixed'){
        const arrival=ease(clamp(phase));
        nodes[0].style.opacity='1';nodes[1].style.opacity=String(.25+.75*arrival);
        nodes[1].style.transform=`scale(${.82+.18*arrival})`;
        draw(segments[0],phase);
        draw(segments[1],(elapsed-cfg.delay-cfg.pace)/650);
        position={x:50+140*arrival,y:78};active=phase<1?-1:1;
        // The number 1 remains fixed; only its surrounding ring breathes.
        if(phase>=1&&!complete)radius+=3*Math.sin(Math.PI*clamp((elapsed-1100)/3300)*6)**2;
      }else{
        const revealed=kind==='cycle'?Math.min(3,phase):phase;
        nodes.forEach((node,i)=>{
          const amount=i===0?1:ease(clamp((revealed-i+.5)*2));
          node.style.opacity=String(.25+.75*amount);node.style.transform=`scale(${.82+.18*amount})`;
        });
        segments.forEach((s,i)=>draw(s,revealed-i));
        if(complete){position=points[kind==='cycle'?0:points.length-1];active=kind==='cycle'?1:cfg.values.at(-1);}
        else{
          const index=kind==='cycle'?Math.floor(phase)%3:Math.min(segments.length-1,Math.floor(phase));
          const amount=ease(kind==='cycle'?phase%1:clamp(phase-index));
          const s=segments[index];active=cfg.values[s.from];
          if(s.loop){
            const t=amount,q=1-t;
            position={x:q*q*q*270+3*q*q*t*270+3*q*t*t*40+t*t*t*40,y:q*q*q*78+3*q*q*t*(-3)+3*q*t*t*(-3)+t*t*t*78};
          }else position={x:s.a.x+(s.b.x-s.a.x)*amount,y:s.a.y};
        }
      }
      marker.setAttribute('transform',`translate(${position.x} ${position.y})`);ring.setAttribute('r',radius);
      host.dataset.activeValue=String(active);
    }
    function finish(){stop();render(duration,true);host.dataset.animationState=media.matches?'reduced':'complete';}
    function play(){
      if(media.matches){finish();return;}
      stop();played=true;host.dataset.animationState='playing';render(0);
      function tick(time){
        if(started===null)started=time;
        const elapsed=Math.min(duration,time-started);render(elapsed,elapsed===duration);
        if(elapsed===duration){animation=null;host.dataset.animationState='complete';return;}
        animation=window.requestAnimationFrame(tick);
      }
      animation=window.requestAnimationFrame(tick);
    }
    replay.addEventListener('click',play);
    function preference(){
      replay.hidden=media.matches;replay.disabled=media.matches;
      if(media.matches)finish();
      else if(played)finish();
      else{render(0);host.dataset.animationState='ready';inspect();}
    }
    function inspect(){
      const rect=host.getBoundingClientRect();
      const height=window.innerHeight;
      if(rect.bottom<=0||rect.top>=height){if(animation!==null)finish();return;}
      if(!played&&!media.matches&&rect.top>=65&&rect.bottom<=height*.9)play();
    }
    if('IntersectionObserver' in window){
      const observer=new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
          if(entry.intersectionRatio>=.65){if(!played&&!media.matches)play();}
          else if(!entry.isIntersecting&&animation!==null)finish();
        });
      },{threshold:[0,.65]});observer.observe(host);
    }
    controllers.push({finish,preference});
    host.classList.add('inline-orbit-host');card.classList.add('inline-orbit-card');
    fallback.hidden=true;
    if(media.matches)preference();
    else if(!('IntersectionObserver' in window)){played=true;finish();}
    else{render(0);host.dataset.animationState='ready';inspect();}
  });
  media.addEventListener('change',()=>controllers.forEach(c=>c.preference()));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)controllers.forEach(c=>c.finish());});
})();

/* Digging Deeper 04 · Diagram reveals timed to the drawings themselves.
 * Diagrams remain fully visible without JS, or if reduced motion is requested.
 */
(() => {
  'use strict';

  const article = document.getElementById('below-zero');
  if (!article || !window.requestAnimationFrame) return;

  const figures = Array.from(article.querySelectorAll('[data-negative-stage]'));
  if (!figures.length) return;

  const stages = figures.map(figure => ({
    figure,
    graphic: figure.querySelector('svg'),
    revealed: false
  }));
  if (stages.some(stage => !stage.graphic)) return;

  const media = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  if (media && media.matches) return;

  let pending = false;
  let active = true;

  function render() {
    if (!active) return;

    const viewport = window.innerHeight || document.documentElement.clientHeight || 760;
    for (const stage of stages) {
      if (stage.revealed) continue;

      // Use the SVG itself, not the card heading or container. Most diagrams
      // must be fully on screen, with some breathing room below, before
      // their nodes and edges start animating.
      const rect = stage.graphic.getBoundingClientRect();
      const comfortablyFits = rect.height <= viewport * 0.77;
      const fullyInView = rect.top >= 0 && rect.bottom <= viewport * 0.86;

      // A few layouts may make the large 18-node SVG taller than the usable
      // viewport. Reveal only once most of that SVG is in view instead.
      const tallEnoughInView = !comfortablyFits &&
        rect.top <= viewport * 0.22 &&
        rect.bottom >= viewport * 0.18;

      // Deep links and jumps past a figure should not leave it invisible.
      const alreadyPassed = rect.bottom <= 0;

      if (fullyInView || tallEnoughInView || alreadyPassed) {
        stage.figure.classList.add('is-revealed');
        stage.revealed = true;
      }
    }

    if (stages.every(stage => stage.revealed)) {
      active = false;
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('pageshow', schedule);
    }
  }

  function schedule() {
    if (pending || !active) return;
    pending = true;
    window.requestAnimationFrame(() => {
      pending = false;
      render();
    });
  }

  function restoreAll() {
    active = false;
    article.classList.remove('negative-motion-ready');
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    window.removeEventListener('pageshow', schedule);
  }

  article.classList.add('negative-motion-ready');
  schedule();
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pageshow', schedule);

  if (media && media.addEventListener) {
    media.addEventListener('change', event => {
      if (event.matches) restoreAll();
      else if (!active && stages.some(stage => !stage.revealed)) {
        active = true;
        article.classList.add('negative-motion-ready');
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule, { passive: true });
        window.addEventListener('pageshow', schedule);
        schedule();
      }
    });
  }
})();
/* Reveal the three example orbits individually as they enter the viewport.
 * The cards are left visible when IntersectionObserver is unavailable.
 */
(() => {
  'use strict';
  const figure = document.querySelector('.negative-small-orbits');
  if (!figure || !('IntersectionObserver' in window)) return;
  const rows = [...figure.querySelectorAll('.negative-small-orbit-row')];
  if (!rows.length) return;
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (media.matches) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const row = entry.target;
      const index = rows.indexOf(row);
      // When multiple rows become visible together, unfold them in order.
      window.setTimeout(() => row.classList.add('is-visible'), index * 140);
      observer.unobserve(row);
    });
  }, { threshold: 0.35 });

  figure.classList.add('negative-orbits-motion-ready');
  rows.forEach(row => observer.observe(row));
  media.addEventListener?.('change', event => {
    if (!event.matches) return;
    observer.disconnect();
    figure.classList.remove('negative-orbits-motion-ready');
  });
})();

/* Section 05: one mathematical landscape, revealed in four scroll chapters.
 * All diagram edges are true one-step forward Collatz transformations.
 * The finite selection makes no claim to enumerate all integer orbits.
 */
(() => {
  'use strict';
  const story=document.getElementById('universe-scrollstory');
  const svg=document.getElementById('universe-map');
  if (!story || !svg) return;
  const NS='http://www.w3.org/2000/svg';
  const groups=[
    document.getElementById('universe-positive'),
    document.getElementById('universe-zero'),
    document.getElementById('universe-negative')
  ];
  if(groups.some(g=>!g)) return;
  const add=(parent,tag,attrs)=>{
    const el=document.createElementNS(NS,tag);
    Object.entries(attrs||{}).forEach(([k,v])=>el.setAttribute(k,String(v)));
    parent.appendChild(el);
    return el;
  };
  const txt=(parent,content,x,y,color,size)=>{
    const el=add(parent,'text',{x,y,fill:color,class:'universe-region-label','font-size':size||13});
    el.textContent=content;
    return el;
  };
  const defs=add(svg,'defs');
  [['pos','#7ae7ff'],['gold','#ffd479'],['neg','#c4a4ef'],['zero','#eee0a9']].forEach(([name,color])=>{
    const m=add(defs,'marker',{id:'universe-arrow-'+name,markerWidth:6,markerHeight:6,refX:5.2,refY:3,orient:'auto',markerUnits:'userSpaceOnUse'});
    add(m,'path',{d:'M0 0 L6 3 L0 6 Z',fill:color});
  });
  function arrow(group,from,to,kind,fromRadius=13,toRadius=13){
    const dx=to[0]-from[0],dy=to[1]-from[1],len=Math.hypot(dx,dy);
    if(len<3)return;
    const ux=dx/len,uy=dy/len;
    const a=Math.min(fromRadius+2,len*.26), b=Math.min(toRadius+4,len*.26);
    add(group,'path',{d:'M '+(from[0]+ux*a)+' '+(from[1]+uy*a)+' L '+(to[0]-ux*b)+' '+(to[1]-uy*b),
      class:'universe-edge',stroke:kind==='gold'?'#ffd479':kind==='neg'?'#bfa0ef':'#7ae7ff',
      'marker-end':'url(#universe-arrow-'+kind+')'});
  }
  function node(group,n,x,y,kind,r=13){
    const color=kind==='gold'?'#ffd479':kind==='neg'?'#c4a4ef':kind==='zero'?'#eee0a9':'#7ae7ff';
    add(group,'circle',{cx:x,cy:y,r,fill:'#101a2b',stroke:color,class:'universe-node'});
    const label=add(group,'text',{x,y:y+1,class:'universe-node-label','font-size':Math.abs(n)>=100?11:13});
    label.textContent=String(n).replace('-','−');
  }
  // Inverse graph rooted at 4, where an inverse child n satisfies C(n)=parent.
  // Exclude the 1, 4, 2 loop from the branches; draw that loop separately.
  const all=new Map([[4,{n:4,d:0,parent:null,children:[]}]]);
  let frontier=[4];
  const maxDepth=11;
  for(let d=1;d<=maxDepth;d++){
    const next=[];
    for(const target of frontier){
      const candidates=[2*target];
      if((target-1)%3===0){
        const odd=(target-1)/3;
        if(odd>1 && odd%2===1)candidates.push(odd);
      }
      candidates.sort((a,b)=>a-b);
      for(const n of candidates){
        if(all.has(n)||n===1||n===2)continue;
        all.set(n,{n,d,parent:target,children:[]});
        all.get(target).children.push(n);
        next.push(n);
      }
    }
    frontier=next;
  }
  let leaf=0;
  function layout(n){
    const item=all.get(n);
    if(!item.children.length){item.horizontal=leaf++;return item.horizontal;}
    const childX=item.children.map(layout);
    item.horizontal=(childX[0]+childX[childX.length-1])/2;
    return item.horizontal;
  }
  layout(4);
  const positions=new Map();
  for(const item of all.values()){
    const x=80+(item.horizontal+.5)*840/leaf;
    const y=item.d===0?120:157+item.d*29;
    positions.set(item.n,[x,y]);
  }
  const root=positions.get(4);
  positions.set(1,[root[0]-85,65]);
  positions.set(2,[root[0]+85,65]);
  // Paint connecting edges first so labels and nodes sit above the lines.
  [[1,4],[4,2],[2,1]].forEach(([a,b])=>arrow(groups[0],positions.get(a),positions.get(b),'gold',18,18));
  for(const item of all.values()){
    if(item.parent!==null)arrow(groups[0],positions.get(item.n),positions.get(item.parent),'pos',12,item.parent===4?18:12);
  }
  for(const [n,p] of positions)node(groups[0],n,p[0],p[1],[1,2,4].includes(n)?'gold':'pos',[1,2,4].includes(n)?18:12);
  txt(groups[0],'POSITIVE ORBITS',42,28,'#7ae7ff');
  // A true fixed point, not connected to any other integer.
  add(groups[1],'path',{d:'M 483 548 C 429 511 417 608 477 597',
    class:'universe-edge',stroke:'#eee0a9','marker-end':'url(#universe-arrow-zero)'});
  node(groups[1],0,495,573,'zero',19);
  txt(groups[1],'ZERO · FIXED POINT',540,579,'#eee0a9');
  // Known negative cycles (in exact forward Collatz order).
  const cycles=[
    {values:[-1,-2],cx:160,cy:762,r:42},
    {values:[-5,-14,-7,-20,-10],cx:455,cy:755,r:70},
    {values:[-17,-50,-25,-74,-37,-110,-55,-164,-82,-41,-122,-61,-182,-91,-272,-136,-68,-34],cx:783,cy:758,r:110}
  ];
  txt(groups[2],'NEGATIVE ORBITS · THREE KNOWN CYCLES',42,636,'#c4a4ef');
  cycles.forEach(c=>{
    const points=c.values.map((n,i)=>{
      const ang=-Math.PI/2+2*Math.PI*i/c.values.length;
      return [c.cx+c.r*Math.cos(ang),c.cy+c.r*Math.sin(ang)];
    });
    c.values.forEach((n,i)=>arrow(groups[2],points[i],points[(i+1)%c.values.length],'neg',c.values.length===18?13:15,c.values.length===18?13:15));
    c.values.forEach((n,i)=>node(groups[2],n,points[i][0],points[i][1],'neg',c.values.length===18?14:16));
    txt(groups[2],'PERIOD '+c.values.length,c.cx-41,899,'#d6bef5',12);
  });
  const captions=[
    'Each connecting line is one Collatz step. The finite branches feed into 1 → 4 → 2 → 1.',
    'Zero stands alone: 0 → 0. It neither joins nor connects the positive and negative orbits.',
    'The known negative cycles have lengths 2, 5 and 18. They remain distinct components.',
    'One function, multiple components. This finite map does not classify every orbit.'
  ];
  const phases=['01 / POSITIVE INTEGERS','02 / ZERO','03 / NEGATIVE INTEGERS','04 / WHOLE LANDSCAPE'];
  const beats=[...story.querySelectorAll('[data-universe-step]')];
  const phase=document.getElementById('universe-phase-label');
  const caption=document.getElementById('universe-caption');
  const reduced=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  let active=0,frame=0,currentHeight=530;
  function setExtent(height){
    if(frame)cancelAnimationFrame(frame);
    if(reduced&&reduced.matches){svg.setAttribute('viewBox','0 0 1000 '+height);currentHeight=height;return;}
    const start=currentHeight,change=height-start,began=performance.now();
    if(Math.abs(change)<1)return;
    function tick(now){
      const p=Math.min(1,(now-began)/750),smooth=p*p*(3-2*p);
      currentHeight=start+change*smooth;
      svg.setAttribute('viewBox','0 0 1000 '+currentHeight.toFixed(2));
      if(p<1)frame=requestAnimationFrame(tick);else frame=0;
    }
    frame=requestAnimationFrame(tick);
  }
  function show(step){
    if(step===active)return;
    active=step;
    groups.forEach((g,i)=>g.classList.toggle('visible',i===0||(i===1&&step>=2)||(i===2&&step>=3)));
    phase.textContent=phases[step-1];
    caption.textContent=captions[step-1];
    beats.forEach(b=>b.classList.toggle('is-active',Number(b.dataset.universeStep)===step));
    setExtent(step===1?530:step===2?640:930);
  }
  let queued=false;
  function onScroll(){
    if(queued)return;queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      const threshold=window.innerHeight*.6;
      let step=1;
      for(const b of beats)if(b.getBoundingClientRect().top<=threshold)step=Number(b.dataset.universeStep);
      show(step);
    });
  }
  if(reduced && reduced.matches){
    groups.forEach(g=>g.classList.add('visible'));
    svg.setAttribute('viewBox','0 0 1000 930');
    phase.textContent=phases[3];caption.textContent=captions[3];
    return;
  }
  show(1);onScroll();
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',onScroll);
  window.addEventListener('pageshow',onScroll);
})();

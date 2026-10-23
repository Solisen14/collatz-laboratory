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

/* Unified integer landscape: inverse branches and known cycles.
 * Edges are forward Collatz steps. This finite graph deliberately makes
 * no completeness claim about the infinite integer dynamics.
 */
(() => {
  'use strict';
  const scene=document.getElementById('universe-scrollstory');
  const svg=document.getElementById('universe-map');
  if(!scene||!svg)return;
  const NS='http://www.w3.org/2000/svg';
  const groups=[document.getElementById('universe-positive'),document.getElementById('universe-zero'),document.getElementById('universe-negative')];
  const make=(tag,attrs,parent)=>{const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs||{}))e.setAttribute(k,String(v));parent.appendChild(e);return e;};
  const edge=(g,a,b,color,curved=false)=>{
    const [x,y]=a,[X,Y]=b;
    const path=curved?`M ${x} ${y} Q ${(x+X)/2+24} ${(y+Y)/2-17} ${X} ${Y}`:`M ${x} ${y} L ${X} ${Y}`;
    make('path',{d:path,class:'universe-edge',stroke:color},g);
  };
  const node=(g,n,x,y,color,r=13)=>{
    make('circle',{cx:x,cy:y,r,fill:'#111b2c',stroke:color,class:'universe-node'},g);
    const t=make('text',{x,y:y+1,class:'universe-node-label','font-size':Math.abs(n)>99?10:13},g);t.textContent=String(n).replace('-','−');
  };
  const label=(g,text,x,y,color)=>{const t=make('text',{x,y,fill:color,class:'universe-region-label'},g);t.textContent=text;};
  // Positive rooted inverse graph. Parent references are actual forward images.
  const pos=new Map([[1,[485,88]],[4,[420,128]],[2,[550,128]]]);
  const pEdges=[[1,4],[4,2],[2,1]];
  const levels=[[8,16],[5,10,20,32],[3,6,12,13,21,40,64],[7,11,24,26,42,80,128]];
  // Construct inverse graph automatically, keeping only orbits that reach 1.
  const pool=new Set([1,2,4]);
  for(let n=1;n<=160;n++){let v=n,seen=new Set(),safe=false;for(let k=0;k<80;k++){if(v===1||v===2||v===4){safe=true;break;}if(seen.has(v))break;seen.add(v);v=v%2?3*v+1:v/2;}if(safe)pool.add(n);}
  const rows=[...pool].filter(n=>n>4).sort((a,b)=>a-b).slice(0,63);
  const depth=new Map([[1,0],[2,0],[4,0]]);
  function distance(n){if(depth.has(n))return depth.get(n);const next=n%2?3*n+1:n/2;const d=distance(next)+1;depth.set(n,d);return d;}
  rows.forEach(distance);
  const bands=new Map();
  for(const n of rows){const d=Math.min(distance(n),9);if(!bands.has(d))bands.set(d,[]);bands.get(d).push(n);}
  const extra=[];
  [...bands.entries()].forEach(([d,nums])=>{nums.forEach((n,i)=>{const x=95+(i+.5)*770/nums.length;const y=175+d*28;pos.set(n,[x,y]);extra.push([n,n%2?3*n+1:n/2]);});});
  // Nodes whose forward images fall outside the drawn sample are omitted, not misconnected.
  pEdges.concat(extra).forEach(([a,b])=>{if(pos.has(a)&&pos.has(b))edge(groups[0],pos.get(a),pos.get(b),'#6bafc4',a===2);});
  [...pos.entries()].forEach(([n,p])=>node(groups[0],n,...p,n<=4?'#ffd479':'#7ae7ff',n<=4?17:11));
  label(groups[0],'POSITIVE ORBITS',64,46,'#7ae7ff');
  // Zero's only orbit is 0 -> 0.
  make('path',{d:'M 490 469 C 545 415 561 525 490 490',class:'universe-edge',stroke:'#eee0a9','stroke-width':2.5},groups[1]);
  node(groups[1],0,476,484,'#eee0a9',19);
  label(groups[1],'ZERO: FIXED POINT',530,490,'#eee0a9');
  // Each negative circle is an actual forward Collatz cycle.
  const cycles=[[-1,-2],[-5,-14,-7,-20,-10],[-17,-50,-25,-74,-37,-110,-55,-164,-82,-41,-122,-61,-182,-91,-272,-136,-68,-34]];
  const centers=[[170,552],[480,565],[775,565]];
  const radii=[38,48,73];
  cycles.forEach((cycle,k)=>{
    const [cx,cy]=centers[k],r=radii[k];
    const coords=cycle.map((n,i)=>{const theta=2*Math.PI*i/cycle.length-Math.PI/2;return[cx+r*Math.cos(theta),cy+r*Math.sin(theta)];});
    cycle.forEach((n,i)=>edge(groups[2],coords[i],coords[(i+1)%cycle.length],'#bc9af0',true));
    cycle.forEach((n,i)=>node(groups[2],n,...coords[i],'#c8a8ee',cycle.length>10?11:15));
    label(groups[2],`PERIOD ${cycle.length}`,cx-47,cy+r+31,'#cbb1ef');
  });
  label(groups[2],'NEGATIVE CYCLES',57,425,'#bc9af0');
  const captions=[
    'Branches lead toward 1 → 4 → 2 → 1. The diagram shows a finite selection of positive orbits.',
    'Zero is fixed: 0 → 0. Its orbit cannot cross to positive or negative integers.',
    'Three separate negative cycles: periods 2, 5 and 18. The map shows the cycles, not every branch.',
    'One rule across all integers; several disconnected components, with open questions remaining.'
  ];
  const beats=[...scene.querySelectorAll('[data-universe-step]')];
  const phase=document.getElementById('universe-phase-label');
  const caption=document.getElementById('universe-caption');
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let current=-1;
  const show=step=>{
    if(step===current)return;current=step;
    groups.forEach((g,i)=>g.classList.toggle('visible',i===0||(i===1&&step>=2)||(i===2&&step>=3)));
    phase.textContent=['01 / POSITIVE INTEGERS','02 / ZERO','03 / NEGATIVE INTEGERS','04 / ALL INTEGERS'][step-1];
    caption.textContent=captions[step-1];
  };
  function update(){
    const threshold=window.innerHeight*.57;
    let step=1;
    for(const beat of beats){if(beat.getBoundingClientRect().top<=threshold)step=Number(beat.dataset.universeStep);}
    show(step);
  }
  if(reduced){groups.forEach(g=>g.classList.add('visible'));phase.textContent='ALL INTEGERS';caption.textContent=captions[3];return;}
  update();window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);
})();

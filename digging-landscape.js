/* Collatz Laboratory · Digging Deeper 05: one continuously unfolding integer map.
 * The positive portion deliberately reuses the real trajectories / layout
 * from collatz-tree-story.js on the Story page.
 */
(() => {
  'use strict';
  const host = document.getElementById('landscape-scrollstory');
  const svg = document.getElementById('landscape-svg');
  if (!host || !svg) return;
  const ns = 'http://www.w3.org/2000/svg';
  const layers = {};
  ['positive','zero','negative-two','negative-tail','negative-five','negative-eighteen','negative-growth'].forEach(name => {
    layers[name] = document.getElementById('landscape-'+name);
  });
  const create = (tag,attrs,parent,content) => {
    const el=document.createElementNS(ns,tag);
    for (const key of Object.keys(attrs||{})) el.setAttribute(key,String(attrs[key]));
    if (content!==undefined) el.textContent=String(content);
    parent.appendChild(el);return el;
  };
  const f = n => n%2===0?n/2:3*n+1;
  const colors = {even:'#7ae7ff',odd:'#ffd479',negative:'#bfa2f1',zero:'#eddaa6'};
  const defs=create('defs',{},svg);
  for (const [kind,color] of Object.entries(colors)) {
    const marker=create('marker',{id:'landscape-arrow-'+kind,markerWidth:8,markerHeight:8,refX:6.8,refY:4,orient:'auto',markerUnits:'userSpaceOnUse'},defs);
    create('path',{d:'M0 0 L8 4 L0 8 Z',fill:color},marker);
  }
  function node(group,n,x,y,kind='even',r=18) {
    const g=create('g',{class:'landscape-node'},group);
    create('circle',{cx:x,cy:y,r:r,fill:'#101828',stroke:colors[kind], 'stroke-width':kind==='even'?2.4:2.1},g);
    create('text',{x:x,y:y+1,'text-anchor':'middle','dominant-baseline':'middle','font-size':Math.abs(n)>=100?15:18},g,String(n).replace('-','−'));
    return g;
  }
  function arrow(group,a,b,n,kind='even',radius=18,delay=0) {
    if (f(n)!==b.n) throw new Error('Invalid Collatz arrow: '+n+' to '+b.n);
    const dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy);
    const ux=dx/L,uy=dy/L;
    return create('path',{
      d:'M '+(a.x+ux*(radius+3))+' '+(a.y+uy*(radius+3))+
        ' L '+(b.x-ux*(radius+9))+' '+(b.y-uy*(radius+9)),
      class:'landscape-edge landscape-draw',
      stroke:colors[kind],'stroke-width':kind==='even'?2.6:2.3,fill:'none',
      'stroke-linecap':'round','marker-end':'url(#landscape-arrow-'+kind+')',
      'pathLength':1,style:'--line-delay:'+delay+'ms'
    },group);
  }
  const caption=(group,text,x,y,kind,size=17)=>{
    return create('text',{x,y,class:'landscape-region-title',fill:colors[kind],'font-size':size},group,text);
  };

  // Story page's same 42 positive values, coordinates and forward edges.
  const columns=[
    [[48,24,12,6,3],70],[[68,34,17],170],
    [[208,104,52,26,13],270],[[69],330],
    [[640,320,160,80,40,20,10,5],380],
    [[512,256,128,64,32,16,8,4,2,1],520],
    [[106,53],620],[[340,170,85],850],
    [[113],960],[[168,84,42,21],1020]
  ];
  const X=new Map();
  columns.forEach(col=>col[0].forEach(n=>X.set(n,col[1])));
  const distances=new Map([[1,0]]);
  const steps=n=>{
    if (distances.has(n)) return distances.get(n);
    const d=1+steps(f(n));distances.set(n,d);return d;
  };
  const positive=new Map();
  for(const n of X.keys()) positive.set(n,{n,x:X.get(n),y:350-80*steps(n)});
  for(const n of positive.keys()){
    if(n===1) continue;
    if(!positive.has(f(n))) throw Error('Missing positive successor '+n);
    if(n%2===0 && positive.get(n).x!==positive.get(f(n)).x) throw Error('Even arrow not vertical '+n);
  }
  // Edges first so arrowheads and strokes sit behind the nodes.
  const positiveOrder=[...positive.keys()].filter(n=>n!==1).sort((a,b)=>steps(b)-steps(a));
  positiveOrder.forEach(n=>{
    const a=positive.get(n),b=positive.get(f(n));
    arrow(layers.positive,a,b,n,n%2?'odd':'even',18,Math.max(0,(14-steps(n))*75));
  });
  // An unbroken 1→4 return arc, just like the Story page.
  const one=positive.get(1),four=positive.get(4);
  create('path',{
    d:'M '+(one.x+20)+' '+(one.y-3)+
      ' C '+(one.x+154)+' '+(one.y+18)+
      ' '+(one.x+154)+' '+(four.y+28)+
      ' '+(four.x+17)+' '+(four.y+6),
    class:'landscape-edge landscape-return-arc',stroke:colors.odd,
    'stroke-width':3.6,fill:'none','stroke-linecap':'round',
    'marker-end':'url(#landscape-arrow-odd)',pathLength:1
  },layers.positive);
  for(const n of positive.keys()){
    const p=positive.get(n);
    node(layers.positive,n,p.x,p.y,[1,2,4].includes(n)?'odd':'even',20);
  }
  caption(layers.positive,'THE POSITIVE TREE',72,-818,'even',18);

  // Zero is an independent period-one component.
  create('path',{
    d:'M 544 680 C 628 627 636 763 545 728',
    stroke:colors.zero,'stroke-width':3,fill:'none',
    'marker-end':'url(#landscape-arrow-zero)',
    class:'landscape-edge landscape-loop'
  },layers.zero);
  node(layers.zero,0,520,700,'zero',25);
  caption(layers.zero,'0 → 0',617,713,'zero',20);

  // Negative period-two cycle. Two separate curved arrows, one each way.
  const minusOne={n:-1,x:520,y:920},minusTwo={n:-2,x:520,y:1010};
  create('path',{d:'M 545 919 C 673 911 673 1021 544 1013',
    stroke:colors.negative,'stroke-width':3.4,fill:'none',class:'landscape-edge landscape-loop',
    'marker-end':'url(#landscape-arrow-negative)'},layers['negative-two']);
  create('path',{d:'M 495 1011 C 370 1022 370 908 495 919',
    stroke:colors.negative,'stroke-width':3.4,fill:'none',class:'landscape-edge landscape-loop',
    'marker-end':'url(#landscape-arrow-negative)'},layers['negative-two']);
  node(layers['negative-two'],-1,520,920,'negative',25);
  node(layers['negative-two'],-2,520,1010,'negative',25);
  caption(layers['negative-two'],'PERIOD 2',682,973,'negative',19);

  // Positive-style inverse tree, only now its branches grow below the cycle.
  // Given target t, predecessors are 2t and (t−1)/3 if that is odd.
  const inverse=new Map([[-2,{n:-2,parent:null,children:[],depth:0}]]);
  let frontier=[-2];
  for(let depth=1;depth<=7;depth++){
    const following=[];
    for(const parent of frontier){
      const candidates=[2*parent];
      const odd=(parent-1)/3;
      if(Number.isInteger(odd) && odd%2!==0)candidates.push(odd);
      candidates.sort((a,b)=>a-b);
      for(const n of candidates){
        if(n===-1 || inverse.has(n)) continue; // Known cycle and duplicates.
        if(f(n)!==parent) throw Error('Invalid inverse: '+n+' -> '+parent);
        inverse.set(n,{n,parent,children:[],depth});
        inverse.get(parent).children.push(n);
        following.push(n);
      }
    }
    frontier=following;
  }
  let leaves=0;
  const place=n=>{
    const item=inverse.get(n);
    if(!item.children.length){item.u=leaves++;return item.u;}
    const parts=item.children.map(place);
    item.u=(parts[0]+parts[parts.length-1])/2;return item.u;
  };
  place(-2);
  const rootCentre=inverse.get(-2).u;
  const treePos=new Map();
  for(const item of inverse.values()){
    treePos.set(item.n,{
      n:item.n,
      x:520+(item.u-rootCentre)*155,
      y:1010+item.depth*116
    });
  }
  // −4, −8 and −3 are the first explicitly investigated inverse branches.
  const early=new Set([-4,-8,-3]);
  for(const item of inverse.values()){
    if(item.depth===0)continue;
    const into=early.has(item.n)?layers['negative-tail']:layers['negative-growth'];
    const a=treePos.get(item.n);
    const b=treePos.get(item.parent);
    arrow(into,a,b,item.n,'negative',item.parent===-2?25:18,item.depth*100);
  }
  for(const item of inverse.values()){
    if(item.depth===0)continue;
    const into=early.has(item.n)?layers['negative-tail']:layers['negative-growth'];
    const a=treePos.get(item.n);
    node(into,item.n,a.x,a.y,'negative',18);
  }
  caption(layers['negative-tail'],'−3 → −8 → −4 → −2',640,1175,'negative',16);

  // Separate period-five orbit, explicitly closed, with true directions.
  function cycle(group,nums,cx,cy,r,nodeRadius=19){
    const points=nums.map((n,i)=>{
      const theta=-Math.PI/2+2*Math.PI*i/nums.length;
      return {n,x:cx+r*Math.cos(theta),y:cy+r*Math.sin(theta)};
    });
    for(let i=0;i<nums.length;i++){
      const a=points[i],b=points[(i+1)%nums.length];
      if(f(a.n)!==b.n) throw Error('Invalid cycle '+a.n+' -> '+b.n);
      const dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L;
      create('path',{d:'M '+(a.x+ux*(nodeRadius+2))+' '+(a.y+uy*(nodeRadius+2))+
        ' L '+(b.x-ux*(nodeRadius+8))+' '+(b.y-uy*(nodeRadius+8)),
        class:'landscape-edge',stroke:colors.negative,fill:'none',
        'stroke-width':2.7,'marker-end':'url(#landscape-arrow-negative)'},group);
    }
    points.forEach(p=>node(group,p.n,p.x,p.y,'negative',nodeRadius));
    return points;
  }
  const five=[-5,-14,-7,-20,-10];
  const fivePoints=cycle(layers['negative-five'],five,183,1510,100,22);
  caption(layers['negative-five'],'PERIOD 5',120,1659,'negative',19);

  // The third known negative orbit, already encountered in Section 04.
  const eighteen=[-17,-50,-25,-74,-37,-110,-55,-164,-82,-41,-122,-61,-182,-91,-272,-136,-68,-34];
  const eighteenPoints=cycle(layers['negative-eighteen'],eighteen,928,1605,120,17);
  caption(layers['negative-eighteen'],'PERIOD 18',861,1768,'negative',18);

  // A few rigorously checked inverse limbs of the other negative cycles.
  // Notice depth is not necessarily the numerical magnitude of the predecessor.
  const limbs=[
    [-28,-14,98,1677],[-40,-20,268,1677],
    [-56,-28,98,1782],[-80,-40,268,1782],
    [-112,-56,53,1890],[-19,-56,164,1890],[-160,-80,290,1890],
    [-100,-50,783,1885],[-148,-74,925,1885],[-220,-110,1056,1885],
    [-200,-100,776,1995],[-296,-148,923,1995],[-440,-220,1065,1995]
  ];
  const extra=new Map();
  fivePoints.concat(eighteenPoints).forEach(p=>extra.set(p.n,p));
  for(const [n,parent,x,y] of limbs) extra.set(n,{n,x,y,parent});
  for(const [n,parent] of limbs){
    if(f(n)!==parent) throw Error('Invalid inverse limb '+n+' -> '+parent);
    arrow(layers['negative-growth'],extra.get(n),extra.get(parent),n,'negative',parent===-50||parent===-74||parent===-110||five.includes(parent)?20:18,110);
  }
  limbs.forEach(([n,parent,x,y])=>node(layers['negative-growth'],n,x,y,'negative',18));
  caption(layers['negative-growth'],'BACKWARD BRANCHES · FORWARD ARROWS',58,2162,'negative',19);

  // One canvas, seven zoom/pan chapters. The inverse growth is revealed
  // below the negative cycles rather than inventing a false central root.
  const regions=[
    {x:-55,y:-835,w:1150,h:1260,label:'01 / THE POSITIVE TREE'},
    {x:-55,y:160,w:1150,h:780,label:'02 / ZERO'},
    {x:-55,y:460,w:1150,h:805,label:'03 / A NEGATIVE LOOP'},
    {x:-55,y:760,w:1150,h:785,label:'04 / JOINING THE LOOP'},
    {x:-55,y:840,w:1150,h:970,label:'05 / ANOTHER CYCLE'},
    {x:-55,y:1030,w:1150,h:1200,label:'06 / BACKWARD BRANCHES'},
    {x:-55,y:-840,w:1150,h:3100,label:'07 / THE WHOLE LANDSCAPE'}
  ];
  const visibility={
    positive:1,zero:2,'negative-two':3,'negative-tail':4,
    'negative-five':5,'negative-eighteen':6,'negative-growth':6
  };
  const beats=[...host.querySelectorAll('[data-landscape-step]')];
  const phase=document.getElementById('landscape-phase');
  const summary=document.getElementById('landscape-caption');
  const summaries=[
    'The familiar tree: arrows flow downward to 1, then the curved return carries 1 back to 4.',
    'Zero does not join the tree. Its only orbit is 0 → 0.',
    'Negative one and negative two repeat forever: a separate period-two cycle.',
    '−3 reaches −8, then −4, then −2. We are beginning to see the inverse branches.',
    '−5 enters a different five-number cycle that never meets −2.',
    'Work backward from the known negative cycles to find more predecessors. Follow each arrow forward into its cycle.',
    'The apparent reflection is structural, not an exact symmetry. Unknown orbits may still exist.'
  ];
  const reduced=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  let current=0,activeCamera=regions[0],animation=0,scrollFrame=0;
  const setCamera=r=>svg.setAttribute('viewBox',[r.x,r.y,r.w,r.h].map(v=>Number(v).toFixed(2)).join(' '));
  const lerp=(a,b,p)=>a+(b-a)*p;
  function pan(dest){
    if(animation)cancelAnimationFrame(animation);
    if(reduced && reduced.matches){activeCamera=dest;setCamera(dest);return;}
    const start={...activeCamera},t0=performance.now(),duration=1100;
    function tick(t){
      const k=Math.min(1,(t-t0)/duration);
      const e=k*k*(3-2*k);
      activeCamera={
        x:lerp(start.x,dest.x,e),y:lerp(start.y,dest.y,e),
        w:lerp(start.w,dest.w,e),h:lerp(start.h,dest.h,e)
      };
      setCamera(activeCamera);
      if(k<1)animation=requestAnimationFrame(tick);else animation=0;
    }
    animation=requestAnimationFrame(tick);
  }
  function show(step){
    if(step===current)return;
    current=step;
    for(const [name,minimum] of Object.entries(visibility)){
      layers[name].classList.toggle('is-visible',step>=minimum);
    }
    beats.forEach(el=>el.classList.toggle('is-current',Number(el.dataset.landscapeStep)===step));
    phase.textContent=regions[step-1].label;
    summary.textContent=summaries[step-1];
    pan(regions[step-1]);
  }
  function inspect(){
    scrollFrame=0;
    const line=window.innerHeight*.61;
    let step=1;
    beats.forEach(beat=>{
      if(beat.getBoundingClientRect().top<=line)step=Number(beat.dataset.landscapeStep);
    });
    show(step);
  }
  function schedule(){if(scrollFrame)return;scrollFrame=requestAnimationFrame(inspect);}
  if(reduced&&reduced.matches){
    current=7;setCamera(regions[6]);
    Object.values(layers).forEach(g=>g.classList.add('is-visible'));
    phase.textContent=regions[6].label;summary.textContent=summaries[6];
  }else{
    setCamera(regions[0]);
    schedule();
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',schedule);
    window.addEventListener('pageshow',schedule);
    if(reduced&&reduced.addEventListener)reduced.addEventListener('change',event=>{
      if(event.matches){
        Object.values(layers).forEach(g=>g.classList.add('is-visible'));
        if(animation)cancelAnimationFrame(animation);
        setCamera(regions[6]);
        current=7;
      }else{current=0;schedule();}
    });
  }
})();
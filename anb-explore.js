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
  // Directed functional graph: one node per distinct integer. Arrows
  // go from n to T(n). Shared successors are merged, never duplicated.
  // Cycles are real: we temporarily cut one edge ONLY for the tree layout
  // and draw that directed cycle-closing edge back in magenta.
  const GRAPH_EDGES_PER_START=32;
  const VIEW_WIDTH=1200,VIEW_HEIGHT=730;
  const camera={scale:1,fit:1,x:0,y:0};
  const graphState={group:null,world:null,edges:new Map(),nodes:new Map(),timers:[],stats:"",drag:null,suppressClick:false};
  const nodeKey=n=>String(n);
  function compactValue(v){
    const s=String(v);
    if(s.length<=4)return s;
    const prefix=s.slice(0,s.length%3||3);
    const unit=['','k','m','b','t'][Math.floor((s.length-1)/3)]||'e';
    if(unit==='e')return s.slice(0,3)+'e'+(s.length-3);
    const rest=s.slice(prefix.length).replace(/^0+/,'');
    return prefix+(rest?'.'+rest[0]:'')+unit;
  }
  function buildDirectedGraph(){
    const nodes=new Map(),cycleCuts=new Set(),cycleNodes=new Set();
    const get=value=>{
      const id=nodeKey(value);
      if(!nodes.has(id))nodes.set(id,{id,value,next:null,children:[],depth:0,x:0,y:0,seed:value>=1n&&value<=25n});
      return nodes.get(id);
    };
    let cutPaths=0;
    for(const p of state.paths){
      const used=p.values.slice(0,GRAPH_EDGES_PER_START+1);
      used.forEach(get);
      for(let i=0;i<used.length-1;i++){
        const src=get(used[i]),target=get(used[i+1]);
        if(src.next!==null && src.next!==target.id)throw Error('Inconsistent rule at '+src.id);
        src.next=target.id;
      }
      if(p.values.length>used.length)cutPaths++;
    }
    const examined=new Set(),cycles=[];
    for(const candidate of nodes.values()){
      if(examined.has(candidate.id))continue;
      const localIndex=new Map(),chain=[];
      let id=candidate.id;
      while(id!==null&&nodes.has(id)&&!examined.has(id)&&!localIndex.has(id)){
        localIndex.set(id,chain.length);
        chain.push(id);
        id=nodes.get(id).next;
      }
      if(id!==null&&localIndex.has(id)){
        const members=chain.slice(localIndex.get(id));
        cycles.push(members);
        members.forEach(c=>cycleNodes.add(c));
        const cut=members.slice().sort((x,y)=>BigInt(x)<BigInt(y)?-1:BigInt(x)>BigInt(y)?1:0)[0];
        cycleCuts.add(cut);
      }
      chain.forEach(v=>examined.add(v));
    }
    for(const node of nodes.values()){
      if(node.next!==null&&!cycleCuts.has(node.id))nodes.get(node.next).children.push(node);
    }
    const roots=[...nodes.values()].filter(n=>n.next===null||cycleCuts.has(n.id))
      .sort((a,b)=>a.id==='1'?-1:b.id==='1'?1:a.value<b.value?-1:a.value>b.value?1:0);
    // Every node belongs to exactly one cycle-pruned rooted component.
    let leafIndex=0,maxDepth=0;
    const nodeVisited=new Set();
    function lay(node,depth){
      if(nodeVisited.has(node.id))throw Error('Layout contains a directed cycle at '+node.id);
      nodeVisited.add(node.id);
      node.depth=depth;maxDepth=Math.max(maxDepth,depth);
      node.children.sort((a,b)=>{
        const ae=a.value%2n===0n,be=b.value%2n===0n;
        if(ae!==be)return ae?1:-1; // odd branch to the left of the even trunk
        return a.value<b.value?-1:a.value>b.value?1:0;
      });
      if(!node.children.length){node.x=leafIndex*92;leafIndex++;return;}
      node.children.forEach(c=>lay(c,depth+1));
      node.x=(node.children[0].x+node.children[node.children.length-1].x)/2;
    }
    roots.forEach((n,i)=>{if(i&&leafIndex>0)leafIndex+=.9;lay(n,0);});
    for(const n of nodes.values())n.y=(maxDepth-n.depth)*69;
    if(nodeVisited.size!==nodes.size)throw Error('Layout omitted a graph node');
    const positions=[...nodes.values()];
    const minX=Math.min(...positions.map(n=>n.x)),maxX=Math.max(...positions.map(n=>n.x));
    const minY=Math.min(...positions.map(n=>n.y)),maxY=Math.max(...positions.map(n=>n.y));
    return {nodes,roots,cycleCuts,cycleNodes,cycles,cutPaths,
      totalArrows:positions.filter(n=>n.next!==null).length,
      world:{minX:minX-115,maxX:maxX+115,minY:minY-105,maxY:maxY+105}};
  }
  function cameraUpdate(){
    if(graphState.group)graphState.group.setAttribute('transform',
      'translate('+camera.x.toFixed(3)+' '+camera.y.toFixed(3)+') scale('+camera.scale.toFixed(5)+')');
  }
  function fitGraph(){
    const w=graphState.world;
    if(!w)return;
    const width=Math.max(1,w.maxX-w.minX),height=Math.max(1,w.maxY-w.minY);
    camera.scale=Math.min((VIEW_WIDTH-58)/width,(VIEW_HEIGHT-60)/height);
    camera.fit=camera.scale;
    camera.x=VIEW_WIDTH/2-camera.scale*(w.minX+w.maxX)/2;
    camera.y=VIEW_HEIGHT/2-camera.scale*(w.minY+w.maxY)/2;
    cameraUpdate();
  }
  function zoomGraph(factor,pX=VIEW_WIDTH/2,pY=VIEW_HEIGHT/2){
    const newScale=Math.max(camera.fit*.45,Math.min(Math.max(2.8,camera.fit*17),camera.scale*factor));
    const ratio=newScale/camera.scale;
    camera.x=pX-(pX-camera.x)*ratio;
    camera.y=pY-(pY-camera.y)*ratio;
    camera.scale=newScale;
    cameraUpdate();
  }
  function svgPointFromEvent(event){
    const rect=root.getBoundingClientRect();
    return {x:(event.clientX-rect.left)*VIEW_WIDTH/rect.width,
      y:(event.clientY-rect.top)*VIEW_HEIGHT/rect.height};
  }
  function graphEdgePath(a,b,cycle){
    const dx=b.x-a.x,dy=b.y-a.y;
    if(cycle){
      if(a===b)return 'M '+(a.x+25)+' '+a.y+' C '+(a.x+115)+' '+(a.y-90)+' '+(a.x+95)+' '+(a.y+90)+' '+(a.x+18)+' '+(a.y+17);
      const right=Math.max(a.x,b.x)+Math.max(95,Math.abs(dx)*.18+65);
      return 'M '+(a.x+20)+' '+a.y+' C '+right+' '+(a.y-24)+' '+right+' '+(b.y+24)+' '+(b.x+20)+' '+b.y;
    }
    const length=Math.max(1,Math.hypot(dx,dy)),ux=dx/length,uy=dy/length;
    const sx=a.x+ux*24,sy=a.y+uy*24,ex=b.x-ux*28,ey=b.y-uy*28;
    return 'M '+sx.toFixed(1)+' '+sy.toFixed(1)+' L '+ex.toFixed(1)+' '+ey.toFixed(1);
  }
  function renderGraph(preserveCamera=false){
    clearAnimation();
    const graph=buildDirectedGraph();
    graphState.data=graph;
    graphState.world=graph.world;
    root.replaceChildren();
    root.setAttribute('viewBox','0 0 '+VIEW_WIDTH+' '+VIEW_HEIGHT);
    svg('title',{},root,'Directed integer graph for '+state.a+'n + '+state.b+', showing paths from positive starts 1 to 25');
    svg('desc',{},root,'Unique integer nodes connect by arrows pointing toward the next term. Cyan arrows divide even numbers by two; gold arrows apply the odd a n plus b rule. Magenta links close any cycles.');
    const defs=svg('defs',{},root);
    for(const [kind,color] of [['even','#7ae7ff'],['odd','#ffd479'],['cycle','#ff78b8']]){
      const marker=svg('marker',{id:'anb-arrow-'+kind,viewBox:'0 0 10 10',
        refX:9,refY:5,markerWidth:7,markerHeight:7,orient:'auto',markerUnits:'userSpaceOnUse'},defs);
      svg('path',{d:'M 0 0 L 10 5 L 0 10 z',fill:color},marker);
    }
    svg('rect',{width:VIEW_WIDTH,height:VIEW_HEIGHT,fill:'#071120'},root);
    const world=svg('g',{'class':'anb-world'},root);
    graphState.group=world;graphState.edges=new Map();graphState.nodes=new Map();
    const edges=svg('g',{'class':'anb-graph-links'},world);
    const allNodes=svg('g',{'class':'anb-graph-nodes'},world);
    const chosen=state.paths.find(p=>p.start===state.selected);
    const highlightNodes=new Set(chosen?chosen.values.slice(0,GRAPH_EDGES_PER_START+1).map(nodeKey):[]);
    const highlightEdges=new Set();
    if(chosen){
      for(let i=0;i<chosen.values.length-1&&i<GRAPH_EDGES_PER_START;i++)
        highlightEdges.add(nodeKey(chosen.values[i])+'>'+nodeKey(chosen.values[i+1]));
    }
    for(const node of graph.nodes.values()){
      if(node.next===null)continue;
      const dest=graph.nodes.get(node.next);
      const cycle=graph.cycleCuts.has(node.id);
      const odd=node.value%2n!==0n;
      const type=cycle?'cycle':odd?'odd':'even';
      const chosenEdge=highlightEdges.has(node.id+'>'+node.next);
      const className='anb-graph-edge anb-'+type+'-edge'+
        (state.selected!==null?(chosenEdge?' is-highlight':' is-muted'):'');
      const element=svg('path',{'class':className,
        d:graphEdgePath(node,dest,cycle),
        'marker-end':'url(#anb-arrow-'+type+')',
        'data-edge-from':node.id,'data-edge-to':node.next
      },edges);
      svg('title',{},element,node.id+' → '+node.next+' ('+(odd?state.a+'n + '+state.b:'n ÷ 2')+')');
      graphState.edges.set(node.id+'>'+node.next,element);
    }
    for(const node of graph.nodes.values()){
      const highlighted=highlightNodes.has(node.id);
      const klass='anb-graph-node'+(node.seed?' is-seed':'')+
        (graph.cycleNodes.has(node.id)?' is-cycle':'')+
        (node.id==='1'?' is-one':'')+
        (state.selected!==null?(highlighted?' is-highlight':' is-muted'):'');
      const group=svg('g',{'class':klass,'data-node-value':node.id,
        'role':'button','tabindex':'0','aria-label':'Integer '+node.id+'. Click to trace an associated starting path.'},allNodes);
      const label=compactValue(node.value),length=label.length;
      const rx=Math.max(23,12+length*5.5);
      svg('rect',{x:node.x-rx,y:node.y-23,width:2*rx,height:46,rx:23,'class':'anb-graph-node-shape'},group);
      svg('text',{x:node.x,y:node.y+5,'class':'anb-graph-node-label','text-anchor':'middle'},group,label);
      if(node.seed)svg('circle',{cx:node.x+rx-4,cy:node.y-18,r:4,fill:'#ffd479'},group);
      if(node.next===null&&node.id!=='1'){
        svg('text',{x:node.x,y:node.y+42,'class':'anb-graph-tail',
          'text-anchor':'middle'},group,'finite endpoint');
      }
      svg('title',{},group,'Integer '+node.id+(node.seed?' · one of the 25 starting values':'')+
        (graph.cycleNodes.has(node.id)?' · observed cycle':''));
      graphState.nodes.set(node.id,group);
    }
    if(!preserveCamera||!camera.fit)fitGraph();
    else cameraUpdate();
    graphState.stats=graph.nodes.size+' distinct integers · '+graph.totalArrows+
      ' arrows · '+graph.roots.length+' component'+(graph.roots.length===1?'':'s')+
      (graph.cutPaths?' · '+graph.cutPaths+' paths truncated on graph':'');
    els.mapStats.textContent=graphState.stats;
  }
  // The graph remains in the fixed SVG viewport and moves under the camera.
  // Keep buttons, wheel-zoom and pointer pan reversible, with keyboard access.
  const graphZoomIn=$('anb-zoom-in'),graphZoomOut=$('anb-zoom-out'),graphFit=$('anb-fit');
  graphZoomIn.addEventListener('click',()=>zoomGraph(1.3));
  graphZoomOut.addEventListener('click',()=>zoomGraph(1/1.3));
  graphFit.addEventListener('click',fitGraph);
  root.addEventListener('wheel',event=>{
    event.preventDefault();
    const p=svgPointFromEvent(event);
    zoomGraph(event.deltaY<0?1.15:1/1.15,p.x,p.y);
  },{passive:false});
  root.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    graphState.drag={x:event.clientX,y:event.clientY,
      baseX:camera.x,baseY:camera.y,moved:false};
    if(root.setPointerCapture)root.setPointerCapture(event.pointerId);
  });
  root.addEventListener('pointermove',event=>{
    const drag=graphState.drag;
    if(!drag)return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    if(Math.hypot(dx,dy)>4)drag.moved=true;
    if(!drag.moved)return;
    const rect=root.getBoundingClientRect();
    camera.x=drag.baseX+dx*VIEW_WIDTH/rect.width;
    camera.y=drag.baseY+dy*VIEW_HEIGHT/rect.height;
    cameraUpdate();
  });
  function pointerRelease(event){
    if(!graphState.drag)return;
    if(graphState.drag.moved){
      graphState.suppressClick=true;
      setTimeout(()=>{graphState.suppressClick=false;},0);
    }
    graphState.drag=null;
    if(root.hasPointerCapture&&root.hasPointerCapture(event.pointerId))
      root.releasePointerCapture(event.pointerId);
  }
  root.addEventListener('pointerup',pointerRelease);
  root.addEventListener('pointercancel',pointerRelease);
  root.addEventListener('keydown',event=>{
    if(event.target!==root)return;
    if(['+','='].includes(event.key)){event.preventDefault();zoomGraph(1.3);}
    if(event.key==='-'){event.preventDefault();zoomGraph(1/1.3);}
    if(event.key.toLowerCase()==='f'){event.preventDefault();fitGraph();}
  });
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
    graphState.timers.forEach(clearTimeout);
    graphState.timers=[];
    root.querySelectorAll('.anb-graph-edge.is-animated,.anb-graph-node.is-animated')
      .forEach(el=>el.classList.remove('is-animated'));
  }
  function selectSeed(n){
    clearAnimation();
    state.selected=n;
    renderGraph(true);
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
    renderStats();renderGraph(false);renderSeedButtons();renderInspector();
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
    const clone=root.cloneNode(true);
    clone.setAttribute('xmlns',NS);
    clone.setAttribute('width','1200');
    clone.setAttribute('height','730');
    const style=document.createElementNS(NS,'style');
    style.textContent=[
      '.anb-graph-edge{fill:none;stroke-width:2.8;stroke-linecap:round;stroke-linejoin:round}',
      '.anb-even-edge{stroke:#7ae7ff}.anb-odd-edge{stroke:#ffd479}',
      '.anb-cycle-edge{stroke:#ff78b8;stroke-dasharray:8 6}',
      '.anb-graph-edge.is-muted{opacity:.12}.anb-graph-edge.is-highlight{stroke-width:5;opacity:1}',
      '.anb-graph-node-shape{fill:#111d31;stroke:#9bb7d2;stroke-width:2}',
      '.anb-graph-node.is-seed .anb-graph-node-shape{stroke:#ffd479}',
      '.anb-graph-node.is-one .anb-graph-node-shape{stroke:#7ae7ff;stroke-width:3}',
      '.anb-graph-node.is-cycle .anb-graph-node-shape{stroke:#ff78b8}',
      '.anb-graph-node.is-highlight .anb-graph-node-shape{stroke:#fff0b9;stroke-width:3}',
      '.anb-graph-node.is-muted{opacity:.2}',
      '.anb-graph-node-label{font:700 16px system-ui,sans-serif;fill:#f2faff}',
      '.anb-graph-tail{font:600 10px system-ui,sans-serif;fill:#ffbb89}'
    ].join('');
    clone.insertBefore(style,clone.firstChild);
    const svgText=new XMLSerializer().serializeToString(clone);
    const blob=new Blob([svgText],{type:'image/svg+xml;charset=utf-8'});
    const link=document.createElement('a');
    const obj=URL.createObjectURL(blob);
    link.href=obj;link.download='anb-'+state.a+'n-plus-'+state.b+'-directed-graph.svg';
    document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(obj),1500);
  }
  function animateSelected(){
    const p=state.paths.find(q=>q.start===state.selected);
    if(!p||p.values.length<2)return;
    clearAnimation();
    const limit=Math.min(GRAPH_EDGES_PER_START,p.values.length-1);
    const base=graphState.stats;
    const playStep=i=>{
      if(i<limit){
        const from=nodeKey(p.values[i]),to=nodeKey(p.values[i+1]);
        const edge=graphState.edges.get(from+'>'+to);
        if(edge)edge.classList.add('is-animated');
        const node=graphState.nodes.get(to);
        if(node)node.classList.add('is-animated');
        els.mapStats.textContent='Tracing '+p.start+' · step '+(i+1)+' / '+limit+
          (p.values.length-1>limit?' shown in graph':'');
      }else els.mapStats.textContent=base;
    };
    const startNode=graphState.nodes.get(nodeKey(p.values[0]));
    if(startNode)startNode.classList.add('is-animated');
    for(let i=0;i<limit;i++){
      const timer=setTimeout(()=>playStep(i),i*(reduced?30:135));
      graphState.timers.push(timer);
    }
    graphState.timers.push(setTimeout(()=>{els.mapStats.textContent=base;},limit*(reduced?30:135)+220));
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
    copyText(path.values.join(' → '),els.shareStatus,'Selected path copied.');
  });
  els.animate.addEventListener('click',animateSelected);
  root.addEventListener('click',event=>{
    if(graphState.suppressClick)return;
    const node=event.target.closest('[data-node-value]');
    if(!node)return;
    const id=node.dataset.nodeValue;
    let seed=state.paths.find(p=>String(p.start)===id);
    if(!seed)seed=state.paths.find(p=>p.values.some(n=>nodeKey(n)===id));
    if(seed)selectSeed(seed.start);
  });
  root.addEventListener('keydown',event=>{
    if(event.key!=='Enter'&&event.key!==' ')return;
    const node=event.target.closest('[data-node-value]');
    if(!node)return;
    event.preventDefault();
    const id=node.dataset.nodeValue;
    let seed=state.paths.find(p=>String(p.start)===id);
    if(!seed)seed=state.paths.find(p=>p.values.some(n=>nodeKey(n)===id));
    if(seed)selectSeed(seed.start);
  });

  updateRules();
})();

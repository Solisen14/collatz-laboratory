/* The Collatz Laboratory · Fractals working preview
   All pictures in this page are generated from the stated mathematical rules.
   Fractal renderers are finite escape-time approximations, not proof of membership.
*/
(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';

  // SECTION 02: Compare complete binary and cycle-pruned inverse Collatz trees.
  function svg(tag,attrs={},parent=null,text=null) {
    const el=document.createElementNS(NS,tag);
    for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));
    if(text!==null)el.textContent=text;
    if(parent)parent.appendChild(el);
    return el;
  }
  function makeBinary(depth) {
    const levels=[];
    for(let d=0;d<=depth;d++){
      const count=2**d;
      const row=[];
      for(let j=0;j<count;j++){
        row.push({id:'b'+d+'-'+j,x:19+(j+.5)*482/count,y:24+d*282/depth,d,index:j});
      }
      levels.push(row);
    }
    return levels;
  }
  function makeCollatz(depth) {
    // This inverse graph starts at 1 with the cycle-closing 1 → 4
    // forward edge excluded (otherwise 1,2,4 form a loop, not a tree).
    function build(n,d) {
      const item={n,d,children:[]};
      if(d>=depth)return item;
      const next=[2*n];
      if(n%6===4 && n!==4){
        const odd=(n-1)/3;
        if(Number.isInteger(odd)&&odd>0&&odd%2===1)next.unshift(odd);
      }
      item.children=next.map(c=>build(c,d+1));
      return item;
    }
    const root=build(1,0);
    let leaves=0,number=0;
    function lay(node){
      number++;
      if(!node.children.length){node.u=leaves++;return node.u;}
      const ux=node.children.map(lay);
      node.u=(ux[0]+ux[ux.length-1])/2;
      return node.u;
    }
    lay(root);
    function place(node,rows){
      node.x=19+((node.u+.5)/leaves)*482;
      node.y=24+node.d*282/depth;
      rows.push(node);
      node.children.forEach(c=>place(c,rows));
    }
    const rows=[];place(root,rows);
    return rows;
  }
  function drawBinary(depth){
    const mount=$('binary-tree-svg');
    mount.replaceChildren();
    const levels=makeBinary(depth);
    const lines=svg('g',{fill:'none',stroke:'#bda0ff','stroke-opacity':'.7','stroke-width':'1.15'},mount);
    const dots=svg('g',{},mount);
    for(let d=0;d<depth;d++){
      levels[d].forEach((p,i)=>{
        const ch=levels[d+1];
        for(const v of [ch[i*2],ch[i*2+1]]){
          svg('line',{x1:p.x,y1:p.y+4,x2:v.x,y2:v.y-3},lines);
        }
      });
    }
    for(let d=0;d<=depth;d++){
      const radius=Math.max(1.3,5.7-d*.6);
      levels[d].forEach(p=>svg('circle',{
        cx:p.x,cy:p.y,r:radius,fill:'#0e1a2b',stroke:'#c5acff','stroke-width':d<4?1.7:.9
      },dots));
    }
    $('binary-count').textContent=(2**(depth+1)-1)+' shown';
  }
  function drawCollatz(depth){
    const mount=$('collatz-inverse-svg');
    mount.replaceChildren();
    const nodes=makeCollatz(depth);
    const lines=svg('g',{fill:'none',stroke:'#79dced','stroke-opacity':'.76','stroke-width':'1.7'},mount);
    const dots=svg('g',{},mount);
    for(const p of nodes) {
      for(const child of p.children)svg('line',{x1:p.x,y1:p.y+6,x2:child.x,y2:child.y-7},lines);
    }
    for(const p of nodes) {
      const r=depth>7?6.4:8.5;
      svg('circle',{cx:p.x,cy:p.y,r,fill:'#0e1c2c',stroke:'#7ae7ff','stroke-width':1.8},dots);
      if(depth<=7||p.d<=5)svg('text',{
        x:p.x,y:p.y+.5,'text-anchor':'middle','dominant-baseline':'central',
        'font-size':p.n>99?7.3:10.2,'font-weight':650,fill:'#f2faff'
      },dots,String(p.n));
    }
    $('collatz-count').textContent=nodes.length+' shown';
  }
  const depthSlider=$('tree-depth');
  function refreshTrees(){
    const d=+depthSlider.value;
    $('tree-depth-label').textContent=String(d);
    drawBinary(d);drawCollatz(d);
  }
  depthSlider.addEventListener('input',refreshTrees);
  refreshTrees();

  // SECTION 03: A basic Argand diagram, click to select a complex number.
  const complex=$('complex-canvas');
  const cx=complex.getContext('2d');
  let plotted={re:2,im:3};
  function canvasFit(canvas,ctx,limit=760) {
    const box=canvas.getBoundingClientRect();
    const ratio=Math.min(window.devicePixelRatio||1,1.5);
    const w=Math.max(180,Math.min(limit,Math.round(box.width*ratio)));
    const h=Math.max(150,Math.round(w/(box.width/Math.max(1,box.height))));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    if(ctx)ctx.imageSmoothingEnabled=true;
    return {w,h};
  }
  function drawComplex(){
    const {w,h}=canvasFit(complex,cx);
    const unit=Math.min(w/10,h/8);
    const X=x=>w/2+x*unit,Y=y=>h/2-y*unit;
    cx.fillStyle='#071522';cx.fillRect(0,0,w,h);
    cx.lineWidth=1;
    for(let n=-5;n<=5;n++){
      cx.strokeStyle=n===0?'#81b5d8':'#294057';
      cx.lineWidth=n===0?1.7:0.8;
      cx.beginPath();cx.moveTo(X(n),0);cx.lineTo(X(n),h);cx.stroke();
    }
    for(let n=-4;n<=4;n++){
      cx.strokeStyle=n===0?'#81b5d8':'#294057';
      cx.lineWidth=n===0?1.7:0.8;
      cx.beginPath();cx.moveTo(0,Y(n));cx.lineTo(w,Y(n));cx.stroke();
    }
    cx.font='500 '+Math.max(11,w/55)+'px Inter,system-ui,sans-serif';
    cx.fillStyle='#a5c7e7';cx.textAlign='left';
    cx.fillText('Re',w-27,Y(0)-8);cx.fillText('Im',X(0)+9,20);
    cx.fillStyle='#6f92b4';cx.font='500 '+Math.max(9,w/65)+'px Inter,system-ui,sans-serif';
    for(let n=-4;n<=4;n++)if(n!==0){cx.textAlign='center';cx.fillText(String(n),X(n),Y(0)+15);}
    for(let n=-3;n<=3;n++)if(n!==0){cx.textAlign='right';cx.fillText(String(n),X(0)-8,Y(n)+4);}
    // Draw right-triangle projections before the chosen point.
    cx.strokeStyle='#d3b6fb';cx.setLineDash([6,5]);cx.lineWidth=1.5;
    cx.beginPath();cx.moveTo(X(plotted.re),Y(0));cx.lineTo(X(plotted.re),Y(plotted.im));cx.lineTo(X(0),Y(plotted.im));cx.stroke();cx.setLineDash([]);
    cx.beginPath();cx.arc(X(plotted.re),Y(plotted.im),Math.max(8,w/60),0,Math.PI*2);
    cx.fillStyle='#d9c5ff';cx.shadowBlur=18;cx.shadowColor='#b697ed';cx.fill();
    cx.shadowBlur=0;cx.fillStyle='#f9f1ff';cx.textAlign='left';cx.font='650 '+Math.max(12,w/45)+'px Inter,system-ui,sans-serif';
    cx.fillText('z',X(plotted.re)+15,Y(plotted.im)-10);
    const imaginary=plotted.im>=0?' + ':' − ';
    $('complex-readout').textContent='z = '+plotted.re.toFixed(2)+imaginary+Math.abs(plotted.im).toFixed(2)+'i';
  }
  complex.addEventListener('click',event=>{
    const r=complex.getBoundingClientRect();
    const nx=(event.clientX-r.left)/r.width, ny=(event.clientY-r.top)/r.height;
    const unit=Math.min(complex.width/10,complex.height/8);
    plotted={
      re:Math.max(-4.8,Math.min(4.8,((nx-.5)*complex.width)/unit)),
      im:Math.max(-3.7,Math.min(3.7,((.5-ny)*complex.height)/unit))
    };
    drawComplex();
  });
  complex.addEventListener('keydown',event=>{
    const move={ArrowLeft:[-.25,0],ArrowRight:[.25,0],ArrowUp:[0,.25],ArrowDown:[0,-.25]}[event.key];
    if(!move)return;
    event.preventDefault();
    plotted.re=Math.max(-4.8,Math.min(4.8,plotted.re+move[0]));
    plotted.im=Math.max(-3.7,Math.min(3.7,plotted.im+move[1]));
    drawComplex();
  });

  // SECTION 04: Julia and Mandelbrot generated with the actual quadratic
  // recurrence z -> z²+c. The displayed dark region is a finite-iteration
  // approximation of the filled Julia set / the Mandelbrot set.
  const MAXITER=175;
  // Five independently authored escape-time gradients; none alter the
  // quadratic recurrence, tested coordinates or filled-set membership.
  // Amethyst is the default, emphasizing purple/indigo/orchid/lilac.
  const colourStops={
    ocean:['#061525','#153858','#156f83','#4bd3df','#f2d18c','#061525'],
    fire:['#140b2c','#473078','#9f328b','#f36f4b','#ffe0a0','#140b2c'],
    scientific:['#311364','#4938a7','#2b7796','#65b78b','#f6e875','#311364'],
    mono:['#121212','#454545','#969696','#d1d1d1','#ffffff','#121212'],
    amethyst:['#160d35','#3a1663','#67339f','#af64d2','#e6c5fa','#160d35']
  };
  function hexRgb(hex){
    return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
  }
  const palettes={};
  for(const [name,stops] of Object.entries(colourStops)){
    const rgb=stops.map(hexRgb);
    palettes[name]=Array.from({length:2048},(_,i)=>{
      const position=i/2048*(rgb.length-1);
      const segment=Math.min(rgb.length-2,Math.floor(position));
      const alpha=position-segment;
      return rgb[segment].map((value,k)=>
        Math.round(value+(rgb[segment+1][k]-value)*alpha));
    });
  }
  // Colour escape times across the ENTIRE computed range.
  // Previously, level*42 was clamped to index 2047. Every escaping
  // point after ~49 iterations therefore appeared the same colour,
  // hiding fine escape-time differences near the fractal boundary.
  // A smooth, repeating gradient (as in the original sinusoidal map)
  // restores those distinctions. The logarithmic term increases
  // contrast among the small escape times in the broad exterior.
  // This changes only the colour transfer function, never the orbit.
  function paletteIndex(level){
    const phase=(0.17 + level/42 + 0.12*Math.log1p(level))%1;
    return Math.min(2047,Math.max(0,Math.floor(phase*2048)));
  }
  const selectedPalette=document.querySelector(
    'input[name="fractal-palette"]:checked'
  );
  let currentPalette=selectedPalette&&palettes[selectedPalette.value]
    ?selectedPalette.value:'amethyst';
  const data={
    julia:{canvas:$('julia-canvas'),status:$('julia-status'),c:{x:-.7,y:.27015},x:0,y:0,span:3.7,base:{x:0,y:0,span:3.7},token:0,everRendered:false},
    mandelbrot:{canvas:$('mandelbrot-canvas'),status:$('mandelbrot-status'),x:-.68,y:0,span:3.45,base:{x:-.68,y:0,span:3.45},token:0,everRendered:false}
  };
  function iterCount(type,zr0,zi0,cr,ci){
    let zr=zr0,zi=zi0,iter=0;
    // Mandelbrot's main cardioid and period-two bulb are provably interior.
    if(type==='mandelbrot'){
      const x=cr-.25,q=x*x+ci*ci;
      if(q*(q+x)<=.25*ci*ci || (cr+1)*(cr+1)+ci*ci<=.0625)return -1;
    }
    for(;iter<MAXITER;iter++){
      const rr=zr*zr,ii=zi*zi;
      if(rr+ii>256)break; // Larger escape radius gives pleasing smooth bands.
      zi=2*zr*zi+ci;
      zr=rr-ii+cr;
      if(!Number.isFinite(zr+zi))break;
    }
    if(iter===MAXITER)return -1;
    // Smooth escape estimate for visual colouring only.
    const mag=Math.sqrt(zr*zr+zi*zi);
    return Math.max(0,iter+1-Math.log2(Math.max(.00001,Math.log2(Math.max(2,mag)))));
  }
  function renderFractal(which){
    const s=data[which],canvas=s.canvas;
    const ctx=canvas.getContext('2d',{alpha:false});
    const {w,h}=canvasFit(canvas,ctx,670);
    const img=ctx.createImageData(w,h),pix=img.data;
    const generation=++s.token;
    const spanY=s.span*h/w;
    const xLeft=s.x-s.span/2,yTop=s.y+spanY/2;
    const xStep=s.span/w,yStep=spanY/h;
    const mandel=which==='mandelbrot';
    s.status.textContent='Rendering…';
    s.everRendered=true;
    let y=0;
    function work(){
      if(s.token!==generation)return;
      const start=y;
      const deadline=performance.now()+15;
      do {
        const ciRow=yTop-(y+.5)*yStep;
        for(let x=0;x<w;x++){
          const real=xLeft+(x+.5)*xStep;
          const level=mandel?iterCount('mandelbrot',0,0,real,ciRow):
            iterCount('julia',real,ciRow,s.c.x,s.c.y);
          const id=(y*w+x)*4;
          if(level<0){pix[id]=4;pix[id+1]=9;pix[id+2]=20;}
          else{
            const col=palettes[currentPalette][paletteIndex(level)];
            pix[id]=col[0];pix[id+1]=col[1];pix[id+2]=col[2];
          }
          pix[id+3]=255;
        }
        y++;
      } while(y<h && performance.now()<deadline);
      ctx.putImageData(img,0,0,0,start,w,y-start);
      if(y<h)requestAnimationFrame(work);
      else {
        const zoom=(s.base.span/s.span);
        s.status.textContent='Zoom ×'+(zoom<10?zoom.toFixed(1):Math.round(zoom).toLocaleString())+
          ' · '+MAXITER+' iterations';
      }
    }
    requestAnimationFrame(work);
  }
  function zoomAt(which,px,py,factor){
    const s=data[which],r=s.canvas.getBoundingClientRect();
    const dy=s.span*r.height/r.width;
    const hitX=s.x+(px-.5)*s.span;
    const hitY=s.y-(py-.5)*dy;
    const newSpan=Math.max(3e-12,Math.min(12,s.span*factor));
    if(newSpan===s.span)return;
    const ratio=newSpan/s.span;
    s.x=hitX+(s.x-hitX)*ratio;
    s.y=hitY+(s.y-hitY)*ratio;
    s.span=newSpan;
    renderFractal(which);
  }
  for(const [name,s] of Object.entries(data)){
    s.canvas.addEventListener('click',e=>{
      const rect=s.canvas.getBoundingClientRect();
      zoomAt(name,(e.clientX-rect.left)/rect.width,(e.clientY-rect.top)/rect.height,e.shiftKey?1.85:.54);
    });
    s.canvas.addEventListener('keydown',e=>{
      if(['+','=','Enter',' '].includes(e.key)){e.preventDefault();zoomAt(name,.5,.5,.54);}
      if(['-','_'].includes(e.key)){e.preventDefault();zoomAt(name,.5,.5,1.85);}
      if(e.key==='r'||e.key==='R'){e.preventDefault();resetFractal(name);}
      const move={ArrowLeft:[-.18,0],ArrowRight:[.18,0],ArrowUp:[0,.18],ArrowDown:[0,-.18]}[e.key];
      if(move){e.preventDefault();s.x+=move[0]*s.span;s.y+=move[1]*s.span;renderFractal(name);}
    });
  }
  function resetFractal(which){
    const s=data[which];
    Object.assign(s,{x:s.base.x,y:s.base.y,span:s.base.span});
    renderFractal(which);
  }
  document.querySelectorAll('button[data-fractal][data-action]').forEach(button=>{
    button.addEventListener('click',()=>{
      const which=button.dataset.fractal,action=button.dataset.action;
      if(action==='reset')resetFractal(which);
      else zoomAt(which,.5,.5,action==='in'?.54:1.85);
    });
  });
  $('julia-preset').addEventListener('change',event=>{
    const [real,imag]=event.target.value.split(',').map(Number);
    data.julia.c={x:real,y:imag};
    resetFractal('julia');
  });

  // All three landscapes use one palette. Keep the top radio group
  // and the complex-extension dropdown in sync; do not reset zoom or c.
  function applyFractalPalette(value) {
    if (!palettes[value]) return;
    currentPalette=value;
    document.querySelectorAll('input[name="fractal-palette"]').forEach(input=>{
      input.checked=input.value===value;
    });
    if(complexExplorer.palette)complexExplorer.palette.value=value;
    for(const [name,entry] of Object.entries(data)){
      if(entry.everRendered)renderFractal(name);
    }
    if(complexExplorer.everRendered)renderComplexLandscape();
  }
  document.querySelectorAll('input[name="fractal-palette"]').forEach(input=>{
    input.addEventListener('change',()=>{
      if(input.checked)applyFractalPalette(input.value);
    });
  });

  // SECTION 05: Complex Collatz interpolation shared by the five-step
  // orbit animation and full complex-landscape explorer.
  // The former one-step slider was replaced and has no DOM listeners.
  function cxMultiply(a,b){return {re:a.re*b.re-a.im*b.im,im:a.re*b.im+a.im*b.re};}
  function chamberland(real,imag){
    const a=Math.PI*real/2,b=Math.PI*imag/2;
    const cos={re:Math.cos(a)*Math.cosh(b),im:-Math.sin(a)*Math.sinh(b)};
    const sin={re:Math.sin(a)*Math.cosh(b),im:Math.cos(a)*Math.sinh(b)};
    const c2=cxMultiply(cos,cos),s2=cxMultiply(sin,sin);
    const p=cxMultiply({re:real/2,im:imag/2},c2);
    const q=cxMultiply({re:3*real+1,im:3*imag},s2);
    return {re:p.re+q.re,im:p.im+q.im};
  }

  // SECTION 05A: Restore the introductory one-step manipulative.
  // All controls are scoped and guarded: missing optional markup must not
  // interrupt tree, Julia, Mandelbrot, or five-step initialization.
  const oneStepSlider=$('imag-offset');
  const oneStepReadout=$('imag-offset-value');
  const oneStepStart=$('complex-start');
  const oneStepOutput=$('complex-output');
  const oneStepPlane=$('one-step-complex-svg');
  function oneStepLabel(point){
    const r=Math.abs(point.re)<.0005?0:point.re;
    const i=Math.abs(point.im)<.0005?0:point.im;
    return r.toFixed(3)+(i<0?' − ':' + ')+Math.abs(i).toFixed(3)+'i';
  }
  function drawOneStepPlane(start,end){
    if(!oneStepPlane)return;
    oneStepPlane.replaceChildren();
    svg('title',{},oneStepPlane,'One complex Collatz step from '+oneStepLabel(start)+' to '+oneStepLabel(end));
    svg('desc',{},oneStepPlane,'The horizontal axis is Real, from 0 to 21. The vertical axis is Imaginary, from -4.3 to +4.3. Cyan is the starting point and gold is the result of one iteration.');
    const plot={left:43,right:393,top:25,bottom:177};
    const x=v=>plot.left+(v/21)*(plot.right-plot.left);
    const y=v=>plot.bottom-((v+4.3)/8.6)*(plot.bottom-plot.top);
    const defs=svg('defs',{},oneStepPlane);
    const arrow=svg('marker',{id:'one-step-complex-arrow',viewBox:'0 0 10 10',
      refX:8.6,refY:5,markerWidth:7,markerHeight:7,orient:'auto'},defs);
    svg('path',{d:'M0 0 L10 5 L0 10 Z',fill:'#bca5f7'},arrow);
    svg('rect',{x:plot.left,y:plot.top,width:plot.right-plot.left,
      height:plot.bottom-plot.top,rx:8,fill:'#071222',stroke:'#2d4664'},oneStepPlane);
    for(const n of [0,5,10,15,20]){
      const px=x(n);
      svg('line',{x1:px,y1:plot.top,x2:px,y2:plot.bottom,
        stroke:n===0?'#8eafc9':'#24425a','stroke-opacity':n===0?.8:.55},oneStepPlane);
      svg('text',{x:px,y:plot.bottom+15,'text-anchor':'middle',
        fill:'#9cb9d3','font-size':11},oneStepPlane,String(n));
    }
    for(const n of [-4,-2,0,2,4]){
      const py=y(n);
      svg('line',{x1:plot.left,y1:py,x2:plot.right,y2:py,
        stroke:n===0?'#8eafc9':'#24425a','stroke-opacity':n===0?.9:.55,
        'stroke-width':n===0?1.7:1},oneStepPlane);
      if(n!==0)svg('text',{x:plot.left-9,y:py+4,'text-anchor':'end',
        fill:'#9cb9d3','font-size':10},oneStepPlane,String(n));
    }
    svg('text',{x:plot.right,y:plot.bottom+32,'text-anchor':'end',
      'class':'fractal-one-step-axis-label'},oneStepPlane,'Real');
    svg('text',{x:plot.left,y:13,'text-anchor':'start',
      'class':'fractal-one-step-axis-label'},oneStepPlane,'Imaginary');
    const x0=x(start.re),y0=y(start.im),x1=x(end.re),y1=y(end.im);
    svg('line',{x1:x0+7,y1:y0,x2:x1-10,y2:y1,
      stroke:'#bca5f7','stroke-width':2.4,'marker-end':'url(#one-step-complex-arrow)'},oneStepPlane);
    for(const [point,fill,label,px,py] of [
      [start,'#80eafa','z₀',x0,y0],[end,'#ffd479','z₁',x1,y1]]){
      svg('circle',{cx:px,cy:py,r:6.5,fill,stroke:'#091525','stroke-width':2},oneStepPlane);
      svg('text',{x:px,y:py-14,'text-anchor':'middle','class':'fractal-one-step-point-label'},oneStepPlane,label);
      svg('title',{},oneStepPlane,label+' = '+oneStepLabel(point));
    }
  }
  function updateOneStepComplex(){
    if(!oneStepSlider||!oneStepReadout||!oneStepStart||!oneStepOutput)return;
    const t=Number(oneStepSlider.value);
    const start={re:3,im:t};
    const output=chamberland(start.re,start.im);
    oneStepReadout.textContent='t = '+t.toFixed(2);
    oneStepStart.textContent=oneStepLabel(start);
    oneStepOutput.textContent=oneStepLabel(output);
    drawOneStepPlane(start,output);
  }
  if(oneStepSlider){
    oneStepSlider.addEventListener('input',updateOneStepComplex);
    updateOneStepComplex();
  }

  // SECTION 05A: Five steps starting at z₀ = 3 + ti.
  // A true linear complex plane is used. Large iterates are reported as
  // off-scale rather than being secretly compressed or plotted incorrectly.
  const orbitSlider=$('orbit-imag-offset');
  const orbitReadout=$('orbit-imag-readout');
  const orbitSVG=$('fractal-orbit-svg');
  const orbitStatus=$('fractal-orbit-status');
  const orbitStart=$('orbit-iterate');
  const orbitReset=$('orbit-reset');
  const orbitRows=[...document.querySelectorAll('#fractal-orbit-steps li')];
  const ORBIT_BOX={left:72,right:682,top:44,bottom:408,real:20,imag:12};
  const ORBIT_PAUSE=760;
  const orbitReduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const orbitState={t:0,points:[],shown:0,playing:false,timers:[]};
  function orbitShown(n){return Number.isFinite(n) ? n : null;}
  function orbitFormat(n){
    if(!Number.isFinite(n))return 'outside numerical range';
    if(Math.abs(n)<.0005)return '0.000';
    if(Math.abs(n)>=1000 || Math.abs(n)<.001)return n.toExponential(2);
    return n.toFixed(3);
  }
  function orbitComplexLabel(value){
    if(!value)return 'Beyond computer numerical range';
    const imag=value.im<0?' − ':' + ';
    return orbitFormat(value.re)+imag+orbitFormat(Math.abs(value.im))+'i';
  }
  function orbitCompute(t){
    const points=[{re:3,im:t}];
    for(let n=1;n<=5;n++){
      const before=points[n-1];
      if(!before){points.push(null);continue;}
      const after=chamberland(before.re,before.im);
      if(!Number.isFinite(after.re)||!Number.isFinite(after.im)){
        points.push(null);continue;
      }
      points.push(after);
    }
    return points;
  }
  function orbitX(re){return ORBIT_BOX.left+(re+ORBIT_BOX.real)/(2*ORBIT_BOX.real)*(ORBIT_BOX.right-ORBIT_BOX.left);}
  function orbitY(im){return ORBIT_BOX.bottom-(im+ORBIT_BOX.imag)/(2*ORBIT_BOX.imag)*(ORBIT_BOX.bottom-ORBIT_BOX.top);}
  function orbitInside(p){
    return p!==null&&Math.abs(p.re)<=ORBIT_BOX.real&&Math.abs(p.im)<=ORBIT_BOX.imag;
  }
  function orbitClip(from,to){
    // Normalize before intersecting: coordinates can be ~1e200.
    const dx=to.re-from.re,dy=to.im-from.im;
    const norm=Math.max(Math.abs(dx)/ORBIT_BOX.real,Math.abs(dy)/ORBIT_BOX.imag,1);
    const vx=dx/norm,vy=dy/norm;
    if(!Number.isFinite(vx)||!Number.isFinite(vy))return null;
    const tx=vx>0?(ORBIT_BOX.real-from.re)/vx:vx<0?(-ORBIT_BOX.real-from.re)/vx:Infinity;
    const ty=vy>0?(ORBIT_BOX.imag-from.im)/vy:vy<0?(-ORBIT_BOX.imag-from.im)/vy:Infinity;
    const factor=Math.min(tx,ty);
    if(!Number.isFinite(factor)||factor<0)return null;
    return {re:from.re+vx*factor,im:from.im+vy*factor};
  }
  function orbitMarker(parent,n,p,latest,isNew){
    const g=svg('g',{'class':isNew?'orbit-new-node':''},parent);
    const color=n===0?'#7ae7ff':'#c4a8fb';
    svg('circle',{
      'class':'orbit-marker'+(latest?' latest':''),
      cx:orbitX(p.re),cy:orbitY(p.im),r:8.5,
      stroke:latest?'#ffd479':color
    },g);
    svg('text',{
      'class':'orbit-step-label',x:orbitX(p.re),y:orbitY(p.im)+(n%2===0?-17:25),
      'text-anchor':'middle'
    },g,'z'+n);
    svg('title',{},g,'Step '+n+': '+orbitComplexLabel(p));
    return g;
  }
  function orbitAxes(){
    orbitSVG.replaceChildren();
    svg('title',{},orbitSVG,'Five steps of the complex Collatz extension on labelled linear axes');
    svg('desc',{},orbitSVG,'Horizontal axis: real part from minus 20 to 20. Vertical axis: imaginary part from minus 12 to 12. Off-scale results are flagged, not plotted as if they were in range.');
    const defs=svg('defs',{},orbitSVG);
    const marker=svg('marker',{id:'fractal-orbit-tip',viewBox:'0 0 10 10',
      refX:9,refY:5,markerWidth:7,markerHeight:7,orient:'auto'},defs);
    svg('path',{d:'M 0 0 L 10 5 L 0 10 z',fill:'#bca5f7'},marker);
    const offMarker=svg('marker',{id:'fractal-orbit-off-tip',viewBox:'0 0 10 10',
      refX:9,refY:5,markerWidth:7,markerHeight:7,orient:'auto'},defs);
    svg('path',{d:'M 0 0 L 10 5 L 0 10 z',fill:'#ffd479'},offMarker);
    svg('rect',{x:ORBIT_BOX.left,y:ORBIT_BOX.top,
      width:ORBIT_BOX.right-ORBIT_BOX.left,height:ORBIT_BOX.bottom-ORBIT_BOX.top,
      rx:9,fill:'#061222',stroke:'#31485d','stroke-width':1},orbitSVG);
    for(const k of [-20,-10,0,10,20]){
      const x=orbitX(k);
      svg('line',{x1:x,y1:ORBIT_BOX.top,x2:x,y2:ORBIT_BOX.bottom,
        stroke:k===0?'#83b9d6':'#24425a','stroke-opacity':k===0?.86:.42,
        'stroke-width':k===0?2:1},orbitSVG);
      svg('text',{'class':'orbit-tick-label',x,y:ORBIT_BOX.bottom+19,
        'text-anchor':'middle'},orbitSVG,String(k));
    }
    for(const k of [-10,-5,0,5,10]){
      const y=orbitY(k);
      svg('line',{x1:ORBIT_BOX.left,y1:y,x2:ORBIT_BOX.right,y2:y,
        stroke:k===0?'#83b9d6':'#24425a','stroke-opacity':k===0?.86:.42,
        'stroke-width':k===0?2:1},orbitSVG);
      if(k!==0)svg('text',{'class':'orbit-tick-label',x:ORBIT_BOX.left-10,y:y+4,
        'text-anchor':'end'},orbitSVG,String(k));
    }
    svg('text',{'class':'orbit-axis-label',x:ORBIT_BOX.right,y:ORBIT_BOX.bottom+42,
      'text-anchor':'end'},orbitSVG,'Real axis (Re)');
    svg('text',{'class':'orbit-axis-label',x:ORBIT_BOX.left+10,y:ORBIT_BOX.top-14,
      'text-anchor':'start'},orbitSVG,'Imaginary axis (Im)');
  }
  function orbitRender(newStep){
    orbitAxes();
    const paths=svg('g',{},orbitSVG);
    const nodes=svg('g',{},orbitSVG);
    const reveal=[];
    let lastInRange=-1;
    for(let n=0;n<=orbitState.shown;n++){
      const p=orbitState.points[n],prev=n>0?orbitState.points[n-1]:null;
      const inside=orbitInside(p);
      const isNew=n===newStep;
      if(n>0&&prev&&orbitInside(prev)&&p){
        const destination=inside?p:orbitClip(prev,p);
        if(destination){
          const off=!inside;
          const path=svg('path',{
            'class':'orbit-edge'+(off?' off-scale':'')+(isNew?' is-new':''),
            d:'M '+orbitX(prev.re)+' '+orbitY(prev.im)+
              ' L '+orbitX(destination.re)+' '+orbitY(destination.im),
            'marker-end':off?'url(#fractal-orbit-off-tip)':'url(#fractal-orbit-tip)',
            pathLength:1
          },paths);
          if(isNew)reveal.push(path);
        }
      }
      if(inside){
        lastInRange=n;
        const g=orbitMarker(nodes,n,p,n===orbitState.shown,isNew);
        if(isNew)reveal.push(g);
      }
    }
    const last=orbitState.points[orbitState.shown];
    if(orbitState.shown>0&&!orbitInside(last)){
      svg('text',{x:ORBIT_BOX.right-12,y:ORBIT_BOX.top+22,
        'text-anchor':'end',fill:'#ffd479',
        style:'font:700 13px Inter,system-ui,sans-serif'},orbitSVG,
        'z'+orbitState.shown+' · outside view');
    }
    if(newStep!==null&&reveal.length){
      if(orbitReduced)reveal.forEach(node=>node.classList.add('is-revealed'));
      else requestAnimationFrame(()=>reveal.forEach(node=>node.classList.add('is-revealed')));
    }
  }
  function orbitStop(){
    orbitState.timers.forEach(timer=>clearTimeout(timer));
    orbitState.timers=[];
    orbitState.playing=false;
    orbitStart.disabled=false;
  }
  function orbitUpdateRows(){
    for(let n=0;n<orbitRows.length;n++){
      const el=orbitRows[n],visible=n<=orbitState.shown;
      el.classList.toggle('is-shown',visible);
      el.classList.toggle('is-current',visible&&n===orbitState.shown);
      el.classList.toggle('is-offscreen',visible&&n>0&&!orbitInside(orbitState.points[n]));
      const label=el.querySelector('strong');
      if(visible)label.textContent=orbitComplexLabel(orbitState.points[n]);
      else label.textContent=n===1?'Press Iterate':'Not shown yet';
    }
  }
  function orbitResetView(){
    orbitStop();
    orbitState.t=Number(orbitSlider.value);
    orbitState.points=orbitCompute(orbitState.t);
    orbitState.shown=0;
    orbitReadout.textContent='t = '+(orbitState.t>0?'+':'')+orbitState.t.toFixed(3);
    orbitStart.textContent='Iterate five times →';
    orbitUpdateRows();
    orbitRender(null);
    orbitStatus.textContent='Starting at z₀ = '+orbitComplexLabel(orbitState.points[0])+'.';
  }
  function orbitReveal(n){
    orbitState.shown=n;
    orbitUpdateRows();
    orbitRender(n);
    const p=orbitState.points[n];
    orbitStatus.textContent=
      'Step '+n+' of 5: '+orbitComplexLabel(p)+
      (!p?' (precision limit)':orbitInside(p)?'':' (outside the plotted window)');
    if(n===5){
      orbitState.playing=false;
      orbitState.timers=[];
      orbitStart.disabled=false;
      orbitStart.textContent='Play again →';
    }
  }
  orbitSlider.addEventListener('input',orbitResetView);
  orbitReset.addEventListener('click',orbitResetView);
  orbitStart.addEventListener('click',()=>{
    orbitStop();
    orbitState.shown=0;
    orbitUpdateRows();
    orbitRender(null);
    orbitState.playing=true;
    orbitStart.disabled=true;
    orbitStatus.textContent='Iterating F(z) five times…';
    for(let n=1;n<=5;n++){
      orbitState.timers.push(setTimeout(()=>orbitReveal(n),n*(orbitReduced?210:ORBIT_PAUSE)));
    }
  });
  orbitResetView();

  // SECTION 05B: A finite orbit-threshold image of ONE complex Collatz
  // interpolation. Crossing the threshold does not prove divergence.
  // The orbit data are never treated as Julia/Mandelbrot membership.
  // Span is the entire REAL-axis width. At reset this makes x∈[-5,5]
  // and centres 0+0i exactly halfway across both axes.
  const COMPLEX_BASE={x:0,y:0,span:10};
  const complexExplorer={
    canvas:$('collatz-complex-canvas'),
    status:$('collatz-complex-status'),
    palette:$('collatz-complex-palette'),
    x:COMPLEX_BASE.x,y:COMPLEX_BASE.y,span:COMPLEX_BASE.span,
    token:0,everRendered:false
  };
  complexExplorer.palette.value=currentPalette;
  complexExplorer.palette.addEventListener('change',event=>{
    applyFractalPalette(event.target.value);
  });
  const COMPLEX_ITERATIONS=50;
  const COMPLEX_THRESHOLD=40;
  function complexFirstCrossing(real,imag) {
    for(let i=1;i<=COMPLEX_ITERATIONS;i++){
      const result=chamberland(real,imag);
      real=result.re;imag=result.im;
      if(!Number.isFinite(real)||!Number.isFinite(imag))return {step:i,mag:COMPLEX_THRESHOLD*2};
      const mag=Math.hypot(real,imag);
      if(mag>COMPLEX_THRESHOLD)return {step:i,mag};
    }
    return {step:0,mag:0};
  }
  function complexTickStep(span) {
    const rough=span/10;
    const power=Math.pow(10,Math.floor(Math.log10(rough)));
    for(const fraction of [1,2,5,10]){
      if(fraction*power>=rough-1e-12)return fraction*power;
    }
    return 10*power;
  }
  function drawComplexCoordinateAxes(ctx,w,h,left,top,dx,dy,spanX,spanY){
    const bottom=top-spanY, right=left+spanX;
    const axisX=-left/dx, axisY=top/dy;
    const xStep=complexTickStep(spanX), yStep=complexTickStep(spanY);
    const safeFont=Math.max(10,Math.min(12,Math.round(w/48)));
    const label=value=>{
      const rounded=Math.abs(value)<1e-10?0:Number(value.toPrecision(5));
      return String(rounded).replace('-', '−');
    };
    ctx.save();
    ctx.lineWidth=Math.max(.7,w/700);
    ctx.font='600 '+safeFont+'px system-ui,sans-serif';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.strokeStyle='rgba(6,13,28,.9)';
    ctx.lineJoin='round';
    for(let i=Math.ceil(left/xStep-1e-8);i<=Math.floor(right/xStep+1e-8);i++){
      const v=i*xStep,x=(v-left)/dx;
      if(x<-.5||x>w+.5)continue;
      const origin=Math.abs(v)<xStep*1e-4;
      ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.strokeStyle=origin?'rgba(202,236,253,.67)':'rgba(173,215,235,.20)';ctx.lineWidth=origin?1.6:0.75;ctx.stroke();
      const tx=Math.max(safeFont*1.4,Math.min(w-safeFont*1.4,x));
      const str=label(v);
      ctx.lineWidth=3.7;ctx.strokeStyle='rgba(3,9,22,.95)';
      ctx.strokeText(str,tx,h-12);
      ctx.fillStyle='#e2f6ff';ctx.fillText(str,tx,h-12);
    }
    ctx.textAlign='left';
    for(let i=Math.ceil(bottom/yStep-1e-8);i<=Math.floor(top/yStep+1e-8);i++){
      const v=i*yStep,y=(top-v)/dy;
      if(y<-.5||y>h+.5)continue;
      const origin=Math.abs(v)<yStep*1e-4;
      ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.strokeStyle=origin?'rgba(202,236,253,.67)':'rgba(173,215,235,.20)';ctx.lineWidth=origin?1.6:0.75;ctx.stroke();
      if(origin)continue;
      const ty=Math.max(16,Math.min(h-27,y));
      const str=label(v);
      ctx.lineWidth=3.7;ctx.strokeStyle='rgba(3,9,22,.95)';
      ctx.strokeText(str,10,ty);ctx.fillStyle='#d0e8fb';ctx.fillText(str,10,ty);
    }
    if(axisX>=0&&axisX<=w && axisY>=0&&axisY<=h){
      ctx.fillStyle='#b5edff';ctx.strokeStyle='rgba(3,9,22,.9)';
      ctx.beginPath();ctx.arc(axisX,axisY,3.4,0,Math.PI*2);ctx.fill();
      ctx.lineWidth=3.7;
      ctx.strokeText('(0,0)',Math.min(w-65,axisX+9),Math.max(17,axisY-14));
      ctx.fillText('(0,0)',Math.min(w-65,axisX+9),Math.max(17,axisY-14));
    }
    ctx.font='700 '+safeFont+'px system-ui,sans-serif';
    ctx.textAlign='right';ctx.fillStyle='#d5ecfa';
    ctx.fillText('Re',w-10,h-29);
    ctx.textAlign='left';ctx.fillText('Im',10,14);
    ctx.restore();
  }
  function renderComplexLandscape() {
    const s=complexExplorer,canvas=s.canvas;
    const ctx=canvas.getContext('2d',{alpha:false});
    const {w,h}=canvasFit(canvas,ctx,550);
    const img=ctx.createImageData(w,h),pixels=img.data;
    const generation=++s.token;
    const spanY=s.span*h/w;
    const left=s.x-s.span/2, top=s.y+spanY/2;
    const dx=s.span/w,dy=spanY/h;
    s.everRendered=true;
    s.status.textContent='Calculating…';
    let row=0;
    function work() {
      if(generation!==s.token)return;
      const start=row;
      const deadline=performance.now()+11;
      do {
        const im=top-(row+.5)*dy;
        for(let col=0;col<w;col++){
          const re=left+(col+.5)*dx;
          const out=complexFirstCrossing(re,im);
          const k=4*(row*w+col);
          if(out.step===0){
            pixels[k]=4;pixels[k+1]=9;pixels[k+2]=20;
          }else{
            // Reuse the SAME selected colour palette as the two
            // quadratic explorers. This does not alter any orbit.
            const smooth=out.step*3.6+0.75*Math.log2(1+out.mag);
            const rgb=palettes[currentPalette][paletteIndex(smooth)];
            pixels[k]=rgb[0];pixels[k+1]=rgb[1];pixels[k+2]=rgb[2];
          }
          pixels[k+3]=255;
        }
        row++;
      } while(row<h && performance.now()<deadline);
      ctx.putImageData(img,0,0,0,start,w,row-start);
      if(row<h){requestAnimationFrame(work);return;}
      // Overlay numbered axes after the rendered pixels. Labels follow
      // zoom and pan; at reset the real ticks run exactly from -5 to 5.
      drawComplexCoordinateAxes(ctx,w,h,left,top,dx,dy,s.span,spanY);
      const zoom=COMPLEX_BASE.span/s.span;
      s.status.textContent=COMPLEX_ITERATIONS+' steps · first crossing |Fⁿ(z)| > 40 · Zoom ×'+
        (zoom<10?zoom.toFixed(1):Math.round(zoom).toLocaleString());
    }
    requestAnimationFrame(work);
  }
  function complexZoomAt(px,py,factor) {
    const s=complexExplorer;
    const bounds=s.canvas.getBoundingClientRect();
    if(!bounds.width||!bounds.height)return;
    const hitX=s.x+(px-.5)*s.span;
    const hitY=s.y-(py-.5)*s.span*bounds.height/bounds.width;
    const newSpan=Math.max(0.00001,Math.min(40,s.span*factor));
    if(newSpan===s.span)return;
    const ratio=newSpan/s.span;
    s.x=hitX+(s.x-hitX)*ratio;
    s.y=hitY+(s.y-hitY)*ratio;
    s.span=newSpan;
    renderComplexLandscape();
  }
  function resetComplexLandscape() {
    complexExplorer.x=COMPLEX_BASE.x;
    complexExplorer.y=COMPLEX_BASE.y;
    complexExplorer.span=COMPLEX_BASE.span;
    renderComplexLandscape();
  }
  complexExplorer.canvas.addEventListener('click',event=>{
    const rect=complexExplorer.canvas.getBoundingClientRect();
    complexZoomAt(
      (event.clientX-rect.left)/rect.width,
      (event.clientY-rect.top)/rect.height,
      event.shiftKey?1.8:.55
    );
  });
  complexExplorer.canvas.addEventListener('keydown',event=>{
    if(['+','=','Enter',' '].includes(event.key)){event.preventDefault();complexZoomAt(.5,.5,.55);}
    else if(['-','_'].includes(event.key)){event.preventDefault();complexZoomAt(.5,.5,1.8);}
    else if(event.key==='r'||event.key==='R'){event.preventDefault();resetComplexLandscape();}
    else {
      const motion={
        ArrowLeft:[-.14,0],ArrowRight:[.14,0],
        ArrowUp:[0,.14],ArrowDown:[0,-.14]
      }[event.key];
      if(motion){
        event.preventDefault();
        complexExplorer.x+=motion[0]*complexExplorer.span;
        complexExplorer.y+=motion[1]*complexExplorer.span;
        renderComplexLandscape();
      }
    }
  });
  document.querySelectorAll('button[data-complex-action]').forEach(button=>{
    button.addEventListener('click',()=>{
      if(button.dataset.complexAction==='reset')resetComplexLandscape();
      else complexZoomAt(.5,.5,button.dataset.complexAction==='in'?.55:1.8);
    });
  });

  // No computation until the relevant canvas is scrolled near the viewport.
  // This keeps the introduction responsive even on older devices.
  if('IntersectionObserver' in window){
    const seen=new IntersectionObserver(entries=>{
      for(const entry of entries){
        if(!entry.isIntersecting)continue;
        const name=entry.target.id.startsWith('julia')?'julia':'mandelbrot';
        if(!data[name].everRendered)renderFractal(name);
        seen.unobserve(entry.target);
      }
    },{rootMargin:'250px'});
    seen.observe(data.julia.canvas);
    seen.observe(data.mandelbrot.canvas);
    const complexSeen=new IntersectionObserver(entries=>{
      for(const entry of entries){
        if(entry.isIntersecting){
          if(!complexExplorer.everRendered)renderComplexLandscape();
          complexSeen.unobserve(entry.target);
        }
      }
    },{rootMargin:'250px'});
    complexSeen.observe(complexExplorer.canvas);
  }else{
    renderFractal('julia');renderFractal('mandelbrot');
    renderComplexLandscape();
  }
  let resizeTimer=0;
  window.addEventListener('resize',()=>{
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(()=>{
      drawComplex();
      for(const [name,s] of Object.entries(data))if(s.everRendered)renderFractal(name);
      if(complexExplorer.everRendered)renderComplexLandscape();
    },160);
  },{passive:true});
  drawComplex();
})();

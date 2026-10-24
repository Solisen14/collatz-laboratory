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
  const palette=Array.from({length:2048},(_,i)=>{
    const q=i/12;
    const r=39+182*(.5+.5*Math.sin(.15*q+1.6));
    const g=45+183*(.5+.5*Math.sin(.15*q+.1));
    const b=83+160*(.5+.5*Math.sin(.15*q+3.1));
    return [Math.min(255,r)|0,Math.min(255,g)|0,Math.min(255,b)|0];
  });
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
            const col=palette[Math.min(2047,Math.max(0,Math.round(level*12)))];
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

  // SECTION 05: Chamberland interpolation, evaluated for z=3+iy.
  const slider=$('imag-offset');
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
  function writeComplex(v) {
    const real=Math.abs(v.re)<1e-9?0:v.re,imag=Math.abs(v.im)<1e-9?0:v.im;
    return real.toFixed(3)+(imag<0?' − ':' + ')+Math.abs(imag).toFixed(3)+'i';
  }
  function updateComplexCollatz(){
    const im=Number(slider.value);
    $('imag-offset-value').textContent=im.toFixed(2)+'i';
    $('complex-start').textContent='3 + '+im.toFixed(2)+'i';
    $('complex-output').textContent=writeComplex(chamberland(3,im));
  }
  slider.addEventListener('input',updateComplexCollatz);
  updateComplexCollatz();

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
  }else{
    renderFractal('julia');renderFractal('mandelbrot');
  }
  let resizeTimer=0;
  window.addEventListener('resize',()=>{
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(()=>{
      drawComplex();
      for(const [name,s] of Object.entries(data))if(s.everRendered)renderFractal(name);
    },160);
  },{passive:true});
  drawComplex();
})();

/* Scroll-driven History timeline; content remains visible without JS.
   Honors reduced-motion preferences and keeps the document navigable. */
(() => {
  'use strict';
  const root=document.querySelector('.history-page');
  const timeline=document.getElementById('history-timeline');
  if(!root||!timeline)return;
  const entries=[...timeline.querySelectorAll('.history-milestone')];
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Motion is enhanced only when IntersectionObserver is available.
  if('IntersectionObserver' in window && !reduced){
    root.classList.add('history-motion-ready');
    const io=new IntersectionObserver(list=>{
      for(const item of list){
        if(item.isIntersecting){
          item.target.classList.add('is-visible');
          io.unobserve(item.target);
        }
      }
    },{rootMargin:'0px 0px -5% 0px',threshold:.075});
    entries.forEach(entry=>io.observe(entry));
  }else entries.forEach(entry=>entry.classList.add('is-visible'));
  let scheduled=false;
  const update=()=>{
    scheduled=false;
    const rect=timeline.getBoundingClientRect();
    const travel=Math.max(1,rect.height-150);
    const progress=(window.innerHeight*.5-rect.top)/travel;
    const pct=Math.round(Math.max(0,Math.min(1,progress))*100);
    timeline.style.setProperty('--history-progress',pct+'%');
  };
  const onScroll=()=>{
    if(!scheduled){scheduled=true;requestAnimationFrame(update);}
  };
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',onScroll,{passive:true});
  onScroll();
})();

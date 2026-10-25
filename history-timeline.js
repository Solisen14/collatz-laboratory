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
  // Two separate claims, using the same set of positive-integer tiles.
  // The dim tiles are illustrative gaps, NOT known Collatz counterexamples.
  // Never convert this illustration into a claim about checked values.
  const taoGrid=root.querySelector('.history-tao-illustration');
  const taoBeats=[...root.querySelectorAll('.history-tao-beat[data-tao-beat]')];
  const taoStatus=taoGrid?.querySelector('[data-tao-status]');
  const taoKey=taoGrid?.querySelector('[data-tao-key]');
  let currentTaoPhase=null;
  function updateTaoGrid(){
    if(!taoGrid||taoBeats.length!==2)return;
    // Advance as each narrative beat crosses the reader's focus line.
    // Evaluating scroll position (rather than a one-shot observer) makes
    // the animation fully reversible when a reader scrolls back upward.
    const focusY=window.innerHeight*.57;
    let phase='idle';
    for(const beat of taoBeats){
      if(beat.getBoundingClientRect().top<=focusY)
        phase=beat.dataset.taoBeat;
    }
    if(phase===currentTaoPhase)return;
    currentTaoPhase=phase;
    taoGrid.dataset.taoPhase=phase;
    const labels={
      idle:{
        status:'Watch the grid',
        key:'Scroll to compare two mathematical statements.',
        aria:'Conceptual grid of positive integers from 1 to 120. No cells highlighted yet.'
      },
      almost:{
        status:'ALMOST ALL',
        key:'Cyan = illustration of a property held by almost all, not specific results.',
        aria:'Illustration: 114 of 120 positive-integer cells are highlighted cyan. Six unhighlighted cells are chosen for visual contrast only. They are not known exceptions. Finite cell counts are not a definition or proof of logarithmic density.'
      },
      every:{
        status:'EVERY ONE',
        key:'Gold = the still-unproved statement about every positive integer.',
        aria:'Illustration: all 120 positive-integer cells are highlighted gold to depict what the Collatz conjecture claims, not what mathematicians have proved.'
      }
    };
    const label=labels[phase];
    if(taoStatus)taoStatus.textContent=label.status;
    if(taoKey)taoKey.textContent=label.key;
    taoGrid.setAttribute('aria-label',label.aria);
    taoBeats.forEach(beat=>beat.classList.toggle('is-active',beat.dataset.taoBeat===phase));
  }

  let scheduled=false;
  const update=()=>{
    scheduled=false;
    const rect=timeline.getBoundingClientRect();
    const travel=Math.max(1,rect.height-150);
    const progress=(window.innerHeight*.5-rect.top)/travel;
    const pct=Math.round(Math.max(0,Math.min(1,progress))*100);
    timeline.style.setProperty('--history-progress',pct+'%');
    updateTaoGrid();
  };
  const onScroll=()=>{
    if(!scheduled){scheduled=true;requestAnimationFrame(update);}
  };
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',onScroll,{passive:true});
  onScroll();
})();

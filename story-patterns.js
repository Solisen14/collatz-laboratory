/* The Collatz Laboratory — Story prologue: Patterns and Sequences.
 * Loaded after the established Story layers. Later Collatz scenes stay untouched.
 * No new progression gate: prediction reveals are optional.
 */
(() => {
  'use strict';
  const patterns = {
    'pattern-twos': {
      title: 'What comes next?',
      kicker: 'PATTERNS & SEQUENCES',
      eyebrow: '01 / HOW ARE WE COUNTING',
      terms: [2,4,6,8],
      next: 10,
      explanation: 'Add 2 each time. A sequence is an ordered list of terms, and a pattern may help us predict what comes next.',
      color: 'cyan',
      label: 'A SIMPLE START'
    },
    'pattern-sevens': {
      title: 'Can you find the rule?',
      kicker: 'A DIFFERENT STEP',
      eyebrow: '02 / WHAT IS ALWAYS THE SAME',
      terms: [3,10,17,24],
      next: 31,
      explanation: 'Add 7 each time. The numbers are different, but the same kind of rule works: add a fixed amount.',
      color: 'violet',
      label: 'ANOTHER ARITHMETIC SEQUENCE'
    },
    'pattern-fibonacci': {
      title: 'A different kind of pattern.',
      kicker: 'LOOK BACK TWO TERMS',
      eyebrow: '03 / A DIFFERENT SEQUENCE',
      terms: [1,1,2,3,5,8],
      next: 13,
      explanation: 'This is the Fibonacci sequence. Each term is the sum of the two terms before it. The amount we add changes at each step.',
      color: 'gold',
      label: 'TWO PREVIOUS TERMS'
    }
  };
  const bridgePhases = {
    'pattern-bridge': {phase:'all',title:'A new kind of sequence.'},
    'pattern-positive': {phase:'positive',title:'Choose a starting integer.'},
    'pattern-small': {phase:'small',title:'Start small.'},
    'pattern-three': {phase:'three',title:'Start with 3.'}
  };
  const patternScenes = new Set([...Object.keys(patterns), ...Object.keys(bridgePhases)]);
  const solved = new Set();
  const stepElements = [...document.querySelectorAll('.story-step[data-scene^="pattern-"]')];
  if (stepElements.length !== 7 || !stepElements.every(s=>patternScenes.has(s.dataset.scene))) return;

  const stage = document.querySelector('.sticky-stage');
  const holder = document.getElementById('sequence-area');
  const heading = document.getElementById('stage-title');
  const chapter = document.querySelector('.stage-heading .chapter');
  const kicker = document.querySelector('.stage-heading .kicker');
  if (!stage || !holder || !heading || !chapter || !kicker || typeof setScene !== 'function') return;

  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  const baseSetScene = setScene;

  function cardButton(scene) {
    return document.querySelector('.story-step[data-scene="'+scene+'"] [data-pattern-reveal]');
  }
  function reflectSolved(scene) {
    const button=cardButton(scene);
    const note=document.querySelector('.story-step[data-scene="'+scene+'"] .pattern-feedback');
    if (button) {
      button.textContent = solved.has(scene) ? 'Answer revealed ✓' : 'Reveal next number';
      button.disabled = solved.has(scene);
      button.setAttribute('aria-expanded',String(solved.has(scene)));
    }
    if(note) note.hidden=!solved.has(scene);
  }
  function reveal(scene) {
    if (!patterns[scene]) return;
    solved.add(scene);
    reflectSolved(scene);
    if(state.scene!==scene)return;
    const last=holder.querySelector('[data-pattern-answer]');
    if(last){
      last.textContent=String(patterns[scene].next);
      last.classList.add('is-solved');
      last.setAttribute('aria-label','The next term is '+patterns[scene].next);
    }
    const row=holder.querySelector('.pattern-numbers');
    if(row)row.setAttribute('aria-label','Sequence: '+patterns[scene].terms.join(', ')+', '+patterns[scene].next);
    if (scene === 'pattern-fibonacci') {
      const eyebrow=holder.querySelector('.pattern-stage-kicker');
      if(eyebrow)eyebrow.textContent='03 / THE FIBONACCI SEQUENCE';
    }
    const explanation=holder.querySelector('[data-pattern-explanation]');
    if(explanation) {
      explanation.textContent=patterns[scene].explanation;
      explanation.classList.add('is-visible');
    }
  }

  function renderPattern(scene) {
    const p=patterns[scene], answered=solved.has(scene);
    holder.innerHTML='';
    holder.dataset.mode='pattern-prologue';
    holder.classList.add('pattern-prologue-mode');
    const shell=document.createElement('div');
    shell.className='pattern-stage pattern-'+p.color;
    const top=document.createElement('div');
    top.className='pattern-stage-top';
    top.innerHTML='<span class="pattern-stage-kicker"></span><span class="pattern-stage-label"></span>';
    top.querySelector('.pattern-stage-kicker').textContent=scene==='pattern-fibonacci'&&answered?'03 / THE FIBONACCI SEQUENCE':p.eyebrow;
    top.querySelector('.pattern-stage-label').textContent=p.label;
    const row=document.createElement('div');
    row.className='pattern-numbers';
    row.setAttribute('aria-label','Sequence: '+p.terms.join(', ')+(answered?', '+p.next:', next term unknown'));
    p.terms.forEach((value,i)=>{
      const node=document.createElement('div');
      node.className='pattern-number pattern-appear';
      node.style.setProperty('--pattern-index',String(i));
      node.textContent=String(value);
      row.appendChild(node);
    });
    const arrow=document.createElement('span');arrow.className='pattern-arrow pattern-appear';arrow.style.setProperty('--pattern-index',String(p.terms.length));arrow.textContent='→';arrow.setAttribute('aria-hidden','true');
    row.appendChild(arrow);
    const answer=document.createElement('div');
    answer.className='pattern-number pattern-answer pattern-appear'+(answered?' is-solved':'');
    answer.style.setProperty('--pattern-index',String(p.terms.length+1));
    answer.dataset.patternAnswer='';
    answer.textContent=answered?String(p.next):'?';
    answer.setAttribute('aria-label',answered?'The next term is '+p.next:'What number comes next?');
    row.appendChild(answer);
    const explain=document.createElement('p');
    explain.className='pattern-stage-explanation'+(answered?' is-visible':'');
    explain.dataset.patternExplanation='';
    if(answered) explain.textContent=p.explanation;
    shell.append(top,row,explain);
    holder.appendChild(shell);
    if(reduced && reduced.matches) shell.classList.add('reduce-motion');
    reflectSolved(scene);
  }

  // Produce a dense but entirely deterministic sample of 144 distinct
  // integers in [-100,100]. Every 0..20 is included so filtering always
  // leaves all 21 small nonnegative candidates, including the future 3.
  function integerSample() {
    const numbers=new Set(Array.from({length:21},(_,i)=>i));
    for(let i=0;numbers.size<144;i++)numbers.add(((i*73+11)%201)-100);
    return [...numbers].sort((a,b)=>(((a+100)*47)%201)-(((b+100)*47)%201));
  }

  // The original first Collatz node is in a 1000×118 SVG, with its first
  // circle at (36,59). The SVG uses preserveAspectRatio="xMidYMid meet",
  // so the centred letterboxing matters when computing the landing point.
  // This anchor matches the existing Story renderer rather than guessing.
  function collatzFirstNodeAnchor() {
    const rect=holder.getBoundingClientRect();
    const gridLabel=92, gridGap=24;
    const innerWidth=Math.max(0,rect.width-gridLabel-gridGap);
    const svgScale=Math.min(innerWidth/1000,1);
    const horizontalInset=(innerWidth-1000*svgScale)/2;
    const stageRect=stage.getBoundingClientRect();
    return {
      x:rect.left+gridLabel+gridGap+horizontalInset+36*svgScale,
      y:stageRect.top+stageRect.height*.48
    };
  }

  function focusOnThree() {
    const field=holder.querySelector('.pattern-integer-field');
    if(!field)return;
    const chosen=field.querySelector('[data-value="3"]');
    if(!chosen)return;
    const bounds=field.getBoundingClientRect();
    // offsetLeft / offsetTop are layout coordinates: unaffected by CSS
    // transforms, including an in-flight scroll animation or window resize.
    const centreX=bounds.left+chosen.offsetLeft+chosen.offsetWidth/2;
    const centreY=bounds.top+chosen.offsetTop+chosen.offsetHeight/2;
    const target=collatzFirstNodeAnchor();
    chosen.style.setProperty('--focus-x',(target.x-centreX).toFixed(2)+'px');
    chosen.style.setProperty('--focus-y',(target.y-centreY).toFixed(2)+'px');
  }

  // Animate the real handoff even though the original scene renderer
  // replaces sequence-area's contents. Keep one temporary circular node
  // in a fixed layer until the destination SVG node takes over.
  let handoff=null;
  function stopHandoff(){
    if(!handoff)return;
    const ongoing=handoff;
    handoff=null;
    const target=holder.querySelector(
      '.primary-node[data-row-start="3"][data-node-index="0"]'
    );
    // Commit the genuine SVG node instantly under the finished ghost.
    // Otherwise its built-in opacity transition creates a one-frame blink.
    if(target)target.style.transition='none';
    stage.classList.remove('pattern-handoff-running');
    if(ongoing.animation) ongoing.animation.cancel();
    ongoing.ghost.remove();
    if(target)requestAnimationFrame(()=>target.style.removeProperty('transition'));
  }
  function beginHandoff(from){
    if(!from||reduced.matches)return;
    const target=holder.querySelector(
      '.primary-node[data-row-start="3"][data-node-index="0"] circle'
    );
    if(!target||!target.isConnected)return;
    const to=target.getBoundingClientRect();
    if(!(from.width>0&&from.height>0&&to.width>0&&to.height>0))return;
    const ghost=document.createElement('div');
    ghost.className='pattern-handoff-ghost';
    ghost.textContent='3';
    ghost.setAttribute('aria-hidden','true');
    ghost.style.left=from.left+'px';
    ghost.style.top=from.top+'px';
    ghost.style.width=from.width+'px';
    ghost.style.height=from.height+'px';
    ghost.style.fontSize=Math.max(18,from.height*.37)+'px';
    stage.classList.add('pattern-handoff-running');
    document.body.appendChild(ghost);
    const dx=to.left+to.width/2-(from.left+from.width/2);
    const dy=to.top+to.height/2-(from.top+from.height/2);
    const size=to.width/from.width;
    if(typeof ghost.animate!=='function'){
      ghost.remove();
      stage.classList.remove('pattern-handoff-running');
      return;
    }
    const animation=ghost.animate([
      {transform:'translate(0px,0px) scale(1)',opacity:1},
      {transform:'translate('+dx+'px,'+dy+'px) scale('+size+')',opacity:1}
    ],{
      duration:780,
      easing:'cubic-bezier(.2,.8,.2,1)',
      fill:'forwards'
    });
    handoff={ghost,animation};
    animation.addEventListener('finish',()=>{
      if(handoff&&handoff.animation===animation)stopHandoff();
    },{once:true});
  }

  function buildIntegerField() {
    holder.innerHTML='';
    holder.dataset.mode='pattern-prologue';
    holder.classList.add('pattern-prologue-mode','pattern-number-field-mode');

    const shell=document.createElement('div');
    shell.className='pattern-integer-universe';
    shell.innerHTML=
      '<p class="pattern-universe-overline">SAME IDEA · A SURPRISING TWIST</p>'+
      '<div class="pattern-universe-intro">LET’S EXPLORE ANOTHER KIND OF PATTERN</div>';
    const field=document.createElement('div');
    field.className='pattern-integer-field';
    field.setAttribute('role','img');
    field.setAttribute('aria-label','A field of integers between minus 100 and 100.');
    integerSample().forEach((n,i)=>{
      const tile=document.createElement('span');
      tile.className='pattern-integer-tile';
      tile.textContent=String(n).replace('-','−');
      tile.dataset.value=String(n);
      tile.dataset.negative=String(n<0);
      tile.dataset.large=String(n>20);
      tile.style.setProperty('--tile-i',String(i%27));
      tile.setAttribute('aria-hidden','true');
      field.appendChild(tile);
    });
    const footer=document.createElement('p');
    footer.className='pattern-universe-footer';
    footer.id='pattern-universe-footer';
    shell.append(field,footer);
    holder.appendChild(shell);
    requestAnimationFrame(focusOnThree);
  }

  const phaseDetails = {
    all: {
      footer:'Some random integers between −100 and 100',
      accessibility:'144 distinct integers between negative 100 and positive 100, including both negative and positive values.'
    },
    positive: {
      footer:'Negative integers fade away. Zero and the positive integers remain.',
      accessibility:'Negative integers have faded. Zero and positive values remain.'
    },
    small: {
      footer:'Only the numbers 0 through 20 remain.',
      accessibility:'Only the 21 integers from zero through 20 remain.'
    },
    three: {
      footer:'One starting value: 3.',
      accessibility:'All other values have faded away. The integer 3 moves into focus.'
    }
  };

  function renderBridge(scene) {
    const existing=holder.querySelector('.pattern-integer-field');
    if(!existing)buildIntegerField();
    const field=holder.querySelector('.pattern-integer-field');
    const phase=bridgePhases[scene].phase;
    // Configure the focus destination before beginning the final tile motion.
    if(phase==='three'&&field.dataset.phase!=='three') focusOnThree();
    field.dataset.phase=phase;
    field.setAttribute('aria-label',phaseDetails[phase].accessibility);
    const footer=holder.querySelector('.pattern-universe-footer');
    if(footer)footer.textContent=phaseDetails[phase].footer;
  }

  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-pattern-reveal]');
    if(!button)return;
    const step=button.closest('[data-scene]');
    if(step && patterns[step.dataset.scene]) reveal(step.dataset.scene);
  });

  // Call the existing scene handler to preserve its lifecycle cleanups,
  // including a visitor scrolling backward from the finished tree.
  setScene = function(scene){
    if(!patternScenes.has(scene)){
      const result=baseSetScene(scene);
      if(holder.dataset.mode!=='pattern-prologue')holder.classList.remove('pattern-prologue-mode');
      return result;
    }
    if(state.scene===scene && holder.dataset.mode==='pattern-prologue')return;
    baseSetScene(scene);
    // On initial load the base handler may already have set state.scene
    // before this prologue module was installed.
    state.scene=scene;
    clearTimers();
    hideTransientUI();
    heading.textContent=bridgePhases[scene]?bridgePhases[scene].title:patterns[scene].title;
    chapter.textContent='00';
    kicker.textContent=bridgePhases[scene]?'NOW, SOMETHING DIFFERENT':patterns[scene].kicker;
    if(bridgePhases[scene])renderBridge(scene);
    else {
      holder.classList.remove('pattern-number-field-mode');
      renderPattern(scene);
    }
    stage.classList.add('is-pattern-prologue');
  };

  // Crossfade/handoff only for the natural pattern-three → intro edge.
  // If the user scrolls away rapidly, clean up immediately and allow
  // the normal scene machinery to take over without any stale ghost.
  const currentHandler=setScene;
  setScene=function(scene){
    const was=state.scene;
    const isPattern=patternScenes.has(scene);
    const shouldHandoff=was==='pattern-three'&&scene==='intro'
      &&holder.dataset.mode==='pattern-prologue'&&!reduced.matches;
    let source=null;
    if(shouldHandoff){
      const chosen=holder.querySelector('.pattern-integer-field [data-value="3"]');
      if(chosen)source=chosen.getBoundingClientRect();
    }
    stopHandoff();
    if(!isPattern) {
      stage.classList.remove('is-pattern-prologue');
      holder.classList.remove('pattern-number-field-mode');
    }
    const result=currentHandler(scene);
    if(source && state.scene==='intro')beginHandoff(source);
    return result;
  };

  // Keep focus alignment responsive without recentering the page on resize.
  window.addEventListener('resize',()=>requestAnimationFrame(focusOnThree),{passive:true});

  // The base script may have selected the first scene during initialization.
  if(patternScenes.has(state.scene)){
    const current=state.scene;
    holder.dataset.mode='';
    setScene(current);
  }
})();
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
      eyebrow: '01 / COUNT BY TWO',
      terms: [2,4,6,8],
      next: 10,
      explanation: 'Add 2 each time. A sequence is an ordered list of terms, and a pattern may help us predict what comes next.',
      color: 'cyan',
      label: 'A SIMPLE START'
    },
    'pattern-sevens': {
      title: 'Can you find the rule?',
      kicker: 'A DIFFERENT STEP',
      eyebrow: '02 / FIND THE DIFFERENCE',
      terms: [3,10,17,24],
      next: 31,
      explanation: 'Add 7 each time. The numbers are different, but the same kind of rule works: add a fixed amount.',
      color: 'violet',
      label: 'ANOTHER ARITHMETIC SEQUENCE'
    },
    'pattern-fibonacci': {
      title: 'A different kind of pattern.',
      kicker: 'LOOK BACK TWO TERMS',
      eyebrow: '03 / THE FIBONACCI SEQUENCE',
      terms: [1,1,2,3,5,8],
      next: 13,
      explanation: 'Each term is the sum of the two terms before it. The amount we add changes at each step.',
      color: 'gold',
      label: 'TWO PREVIOUS TERMS'
    }
  };
  const patternScenes = new Set([...Object.keys(patterns), 'pattern-bridge']);
  const solved = new Set();
  const stepElements = [...document.querySelectorAll('.story-step[data-scene^="pattern-"]')];
  if (stepElements.length !== 4 || !stepElements.every(s=>patternScenes.has(s.dataset.scene))) return;

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
    top.querySelector('.pattern-stage-kicker').textContent=p.eyebrow;
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

  function renderBridge() {
    holder.innerHTML='';
    holder.dataset.mode='pattern-prologue';
    holder.classList.add('pattern-prologue-mode');
    const shell=document.createElement('div');
    shell.className='pattern-stage pattern-bridge-stage';
    shell.innerHTML =
      '<p class="pattern-bridge-overline">SAME IDEA · A SURPRISING TWIST</p>'+
      '<p class="pattern-bridge-thought">What if the rule we use <strong>changes depending on the number?</strong></p>'+
      '<div class="pattern-bridge-number" aria-label="Our next starting number is three">3</div>'+
      '<p class="pattern-bridge-closer">One starting value. Let’s investigate what happens next.</p>';
    holder.appendChild(shell);
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
    heading.textContent=scene==='pattern-bridge'?'A new kind of sequence.':patterns[scene].title;
    chapter.textContent='00';
    kicker.textContent=scene==='pattern-bridge'?'NOW, SOMETHING DIFFERENT':patterns[scene].kicker;
    if(scene==='pattern-bridge')renderBridge();
    else renderPattern(scene);
    stage.classList.add('is-pattern-prologue');
  };

  // Remove the visual mode once existing Story scenes resume. This is
  // independent of the downstream scripted rule-discovery sequence.
  const currentHandler=setScene;
  setScene=function(scene){
    const isPattern=patternScenes.has(scene);
    if(!isPattern)stage.classList.remove('is-pattern-prologue');
    return currentHandler(scene);
  };

  // The base script may have selected the first scene during initialization.
  if(patternScenes.has(state.scene)){
    const current=state.scene;
    holder.dataset.mode='';
    setScene(current);
  }
})();
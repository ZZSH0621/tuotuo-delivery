/* Source-inspired brand entrance. Visual only: no audio, microphone, network or task mutation. */
(()=>{
 const overlay=document.querySelector('#tuotuoIntro'),skip=document.querySelector('#skipTuotuoIntro'),word=document.querySelector('#introLetters');
 if(!overlay||!skip||!word)return;
 const seenKey='tuotuo-intro-seen-v1';let timers=[],finished=true,previousFocus;
 const main=document.querySelector('main'),side=document.querySelector('.sidebar'),saver=document.querySelector('#screenSaver');
 const motion=matchMedia('(prefers-reduced-motion: reduce)');const reduced=()=>motion.matches;
 const unsafe=()=>!saver.hidden||(typeof tasks!=='undefined'&&tasks.some(t=>!t.done&&!t.ack&&Number.isFinite(t.due)&&t.due<=Date.now()))||window.isLocalVoiceListening?.()||document.querySelector('#modal').open;
 word.replaceChildren(...[...'TUOTUO妥妥'].map((letter,i)=>{const span=document.createElement('span');span.textContent=letter;span.style.setProperty('--i',i);span.style.setProperty('--pull',`${(3.5-i)*13}px`);return span;}));
 function finish(immediate=false){if(finished)return;finished=true;timers.forEach(clearTimeout);timers=[];overlay.classList.add('is-leaving');overlay.style.pointerEvents='none';if(saver.hidden){main.inert=false;side.inert=false;}document.body.style.overflow='';if(immediate){overlay.hidden=true;}else timers.push(setTimeout(()=>overlay.hidden=true,620));if(saver.hidden&&document.activeElement===skip&&previousFocus?.isConnected)previousFocus.focus({preventScroll:true});}
 function start(replay=false){if(!finished||reduced()||unsafe())return;let seen=false;try{seen=sessionStorage.getItem(seenKey)==='1';}catch{}if(seen&&!replay)return;try{sessionStorage.setItem(seenKey,'1');}catch{}timers.forEach(clearTimeout);timers=[];finished=false;previousFocus=document.activeElement;overlay.className='tuotuoIntro';overlay.style.pointerEvents='';overlay.hidden=false;main.inert=true;side.inert=true;document.body.style.overflow='hidden';skip.focus({preventScroll:true});timers.push(setTimeout(()=>overlay.classList.add('is-merging'),1250),setTimeout(()=>overlay.classList.add('is-locked'),2050),setTimeout(()=>finish(),3950));}
 skip.addEventListener('click',()=>finish(true));document.addEventListener('keydown',e=>{if(!finished&&e.key==='Escape'){e.preventDefault();finish(true);}},true);
 new MutationObserver(()=>{if(!finished&&!saver.hidden)finish(true);}).observe(saver,{attributes:true,attributeFilter:['hidden']});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)finish(true);});
 window.addEventListener('care-alarm-start',()=>finish(true));
 document.querySelector('#replayTuotuoIntro')?.addEventListener('click',()=>start(true));
 motion.addEventListener?.('change',e=>{if(e.matches)finish(true);});
 start();
})();


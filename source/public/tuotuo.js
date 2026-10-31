/* TUOTUO presentation layer. Original task, reminder, voice and storage logic is retained. */
const prefersQuiet=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function startNote(){document.querySelector('#closeAPIRecognition')?.click();document.querySelector('#closeLocalRecognition')?.click();document.querySelector('#input').scrollIntoView({behavior:prefersQuiet()?'instant':'smooth',block:'center'});document.querySelector('#input').focus({preventScroll:true});}
function meetTuotuo(){openModal('你好，我是妥妥。',`<div class="meetMascot"><span class="mascot mascot-success" role="img" aria-label="笑眯眯的妥妥"></span><b>把一件件小事，认真记好。</b></div><p>在这里，你可以核对演示待办、查看每日留痕，也可以写下备忘录。我会在空白页、保存成功和提醒时陪你出现。</p><div class="modalbuttons"><button class="primary" onclick="closeModal();startNote()">好，开始记一件事 ↗</button></div>`);}
let greetTimer;
function greetTuotuo(){const m=document.querySelector('.heroMascot');m.classList.replace('mascot-welcome','mascot-wink');document.querySelector('#mascotGreeting').textContent='我在，先核对再记录。';clearTimeout(greetTimer);greetTimer=setTimeout(()=>{m.classList.replace('mascot-wink','mascot-welcome');document.querySelector('#mascotGreeting').textContent='';},2400);}
const originalRender=render;
render=function(){originalRender();const empty=document.querySelector('#list .empty');if(empty){const icon=document.createElement('span');icon.className='mascot mascot-welcome emptyMascot';icon.setAttribute('aria-hidden','true');empty.prepend(icon);}document.querySelectorAll('[data-filter],[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.classList.contains('selected'))));};
const originalPaintSaver=paintSaver;
paintSaver=function(){originalPaintSaver();const active=document.querySelector('#screenSaver').classList.contains('alarming');const m=document.querySelector('.saverMascot');m.className='mascot saverMascot '+(active?'mascot-welcome':'mascot-sleep');if(!active)document.querySelector('#saverTitle').textContent='歇一小会，妥妥在这里';};
const originalIdle=idleScreen;
idleScreen=function(){const el=document.activeElement;if(el?.matches('input,textarea,select,[contenteditable="true"]'))return;originalIdle();};
const originalToast=toast;
toast=function(message){originalToast(message);if(/已保存|已创建|完成记录/.test(message)){const icon=document.createElement('span');icon.className='mascot mascot-success toastMascot';icon.setAttribute('aria-hidden','true');document.querySelector('#toast').prepend(icon);}};
// Navigation retains each feature's own cancellation/privacy handling.
document.querySelectorAll('.sidebar .nav').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('.sidebar .nav').forEach(b=>b.classList.remove('active'));button.classList.add('active');if(button.textContent.includes('工作台')||button.textContent.includes('每日留痕'))document.querySelector('.listheading').scrollIntoView({behavior:prefersQuiet()?'instant':'smooth',block:'start'});}));
render();

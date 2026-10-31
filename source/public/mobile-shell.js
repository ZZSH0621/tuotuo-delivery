/* Phone navigation shares the existing drafts, tasks and reminder lifecycle. */
(()=>{
 const home=document.querySelector('#phoneHome'),profile=document.querySelector('#phoneProfile'),frame=document.querySelector('#phoneRecorder'),hero=document.querySelector('.tuotuoHero');
 const anchor=document.createComment('desktop brand position');hero.before(anchor);
 const media=matchMedia('(max-width:760px)');
 const isPhone=()=>media.matches||document.documentElement.classList.contains('phonePreview');window.isPhoneLayout=isPhone;
 const date=document.createElement('span');date.id='phoneMeta';date.className='phone-meta';document.querySelector('.phone-header').append(date);
 const heading=document.createElement('div');heading.className='phone-upcoming-heading';heading.innerHTML='<b>待提醒</b><span id="phoneUpcomingCount"></span>';document.querySelector('#upcomingWork').before(heading);
 document.querySelector('#phoneQuickNote').onsubmit=e=>{e.preventDefault();const field=document.querySelector('#phoneQuickText');if(field.value.trim()){window.recordTranscript(field.value.trim());field.value='';}};
 let selected='record',recordingActive=false;
 const priorListening=window.isLocalVoiceListening;
 window.isLocalVoiceListening=()=>!!priorListening?.()||(isPhone()&&selected==='record'&&recordingActive);
 window.mobileTab=tab=>{
  if(!['record','tasks','search','profile'].includes(tab))return;
  if(tab==='search'&&!document.querySelector('#phoneKnowledge').getAttribute('src'))document.querySelector('#phoneKnowledge').src='/textbook/?embedded=1';
  if(selected==='record'&&tab!=='record')frame.contentWindow?.postMessage({type:'tuotuo-asr-interrupt'},location.origin);
  selected=tab;if(tab!=='record')recordingActive=false;document.body.dataset.mobileTab=tab;
  document.querySelector('#phoneTitle').textContent={record:'说一句',tasks:'今天',search:'查一查',profile:'我'}[tab];
  document.querySelectorAll('[data-mobile-tab]').forEach(b=>{if(b.dataset.mobileTab===tab)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  if(isPhone()){window.updatePhoneHeading?.();render();window.scrollTo({top:0,behavior:'instant'});}
 };
 function apply(){
  if(isPhone()){
   if(hero.parentNode!==profile)profile.insertBefore(hero,profile.querySelector('.phone-menu'));
   if(!frame.getAttribute('src'))frame.src='/asr/?embedded=1&home=1';
   if(!document.querySelector('#tuotuoIntro').hidden)document.querySelector('#skipTuotuoIntro').click();
   window.mobileTab(selected);
  }else{anchor.after(hero);frame.contentWindow?.postMessage({type:'tuotuo-asr-interrupt'},location.origin);}
 }
 window.addEventListener('message',e=>{if(!isPhone()||e.origin!==location.origin||e.source!==frame.contentWindow)return;if(e.data?.type==='tuotuo-asr-state'&&typeof e.data.active==='boolean'){recordingActive=e.data.active;lastActivity=Date.now();return;}if(e.data?.type==='tuotuo-asr-activity'){lastActivity=Date.now();if(navigator.userActivation?.isActive)prepareReminderAudio();return;}if(e.data?.type==='tuotuo-asr-adopt'&&typeof e.data.text==='string'&&e.data.text.trim()&&e.data.text.length<=12000){window.mobileTab('tasks');window.recordTranscript(e.data.text.trim());}if(e.data?.type==='tuotuo-asr-close')window.mobileTab('tasks');});
 window.addEventListener('message',e=>{if(isPhone()&&e.origin===location.origin&&e.source===document.querySelector('#phoneKnowledge').contentWindow&&e.data?.type==='tuotuo-knowledge-activity')lastActivity=Date.now();});
 window.addEventListener('care-alarm-start',()=>frame.contentWindow?.postMessage({type:'tuotuo-asr-interrupt'},location.origin));
 // Reuse existing feature panels from the phone's profile menu.
 profile.querySelectorAll('.phone-menu button').forEach(b=>b.addEventListener('click',()=>{if(b.textContent.includes('音效')||b.textContent.includes('备忘录')){window.mobileTab('tasks');const target=document.querySelector(b.textContent.includes('音效')?'#soundLibrary':'#memoPanel');target.scrollIntoView({block:'start',behavior:'instant'});}}));
 const originalStartNote=window.startNote;window.startNote=()=>isPhone()?window.mobileTab('record'):originalStartNote();
 media.addEventListener('change',apply);new MutationObserver(apply).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
 apply();
})();




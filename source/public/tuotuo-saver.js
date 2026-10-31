/* Read-only companion to the existing reminder lifecycle. No task or sound mutations. */
(()=>{
 const saver=document.querySelector('#screenSaver'),list=document.querySelector('#saverNotices');
 if(!saver||!list)return;
 let entered=false,ids=new Set(),alarmId=null;
 function duration(ms){const seconds=Math.max(0,Math.ceil(ms/1000));return `${Math.floor(seconds/3600)?Math.floor(seconds/3600)+'时 ':''}${String(Math.floor(seconds/60)%60).padStart(2,'0')}分 ${String(seconds%60).padStart(2,'0')}秒`;}
 function paintNotices(){
  const pending=tasks.filter(t=>!t.done&&Number.isFinite(t.due)).sort((a,b)=>a.due-b.due),selected=pending.filter(t=>t.due>Date.now()).slice(0,3),active=alarmQueue[0];
  if(active){const card=document.querySelector('#saverAlert .saverTask');if(card){card.classList.toggle('is-new',alarmId!==active.id);card.querySelector('span').textContent='到时提醒 · 内容已隐藏';card.querySelector('h3').textContent='有一项待办等待知悉';}alarmId=active.id;}else alarmId=null;
  const nextIds=new Set(selected.map(t=>t.id));
  for(const child of [...list.children])if(!nextIds.has(child.dataset.id))child.remove();
  selected.forEach((task,index)=>{let card=[...list.children].find(c=>c.dataset.id===task.id);if(!card){card=document.createElement('article');card.className='saverNotice';card.dataset.id=task.id;const label=document.createElement('span'),time=document.createElement('b'),note=document.createElement('small');card.append(label,time,note);list.append(card);}
   if(list.children[index]!==card)list.insertBefore(card,list.children[index]||null);
   if(!entered||!ids.has(task.id))card.classList.add('is-new');card.children[0].textContent=`待办 ${index+1} · 内容已隐藏`;card.children[1].textContent=duration(task.due-Date.now());card.children[2].textContent='距计划提醒 · 返回工作台查看详情';
  });
  list.hidden=!!active||!selected.length;ids=nextIds;entered=true;
 }
 const priorPaint=paintSaver;paintSaver=function(){priorPaint();paintNotices();};
 new MutationObserver(()=>{if(saver.hidden){entered=false;ids.clear();alarmId=null;}else paintNotices();}).observe(saver,{attributes:true,attributeFilter:['hidden']});
})();

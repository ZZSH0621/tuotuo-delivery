import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
test('stored tasks render once despite multiple logs, with live remaining time and fixed completion time',()=>{
  let time=100000;
  const nodes=new Map();const $=key=>{if(!nodes.has(key))nodes.set(key,{value:'',style:{},textContent:'',innerHTML:''});return nodes.get(key)};
  const c={$,window:{},document:{querySelectorAll:()=>[]},tasks:[{id:'old',bed:'',name:'',title:'测血压',raw:'一分钟测血压',created:90000,due:160000,done:false,log:[{at:90000},{at:95000},{at:99000}]},{id:'done',title:'皮试',raw:'完成皮试',created:80000,done:true,doneAt:95000,log:[{at:95000}]}],view:'history',filter:'all',now:()=>time,isToday:()=>true,fmt:x=>'时间 '+x,esc:x=>String(x??'')};
  vm.createContext(c);vm.runInContext(source.split(/\r?\n/).filter(l=>['render','recordCard','clockText','status','isScheduled','upcomingTasks','renderUpcomingTasks'].some(n=>l.startsWith('function '+n+'('))).join('\n')+'\nfunction status(t){return t.done?"done":isScheduled(t)&&t.due<=now()?"due":"pending"}',c);
  c.render();const html=$('#list').innerHTML;
  assert.equal((html.match(/data-record-id=/g)||[]).length,2);
  assert(html.includes('一分钟测血压'));assert(!/姓名未提供|林护士|查看记录<\/button>|已知悉提醒/.test(html));
  assert(html.includes('01:00'));assert(html.includes('时间 95000'));
  time+=1000;assert.equal(c.clockText(c.tasks[0]),'00:59');assert.equal(c.clockText(c.tasks[1]),'时间 95000');
  time=160000;assert.equal(c.clockText(c.tasks[0]),'已到时');
  c.view='tasks';c.render();assert.equal(($('#list').innerHTML.match(/data-record-id=/g)||[]).length,2);
  $('#search').value='一分钟';c.view='history';c.render();assert.equal(($('#list').innerHTML.match(/data-record-id=/g)||[]).length,1);
});

/* Parse only information present in the transcript; absent/ambiguous times stay unscheduled. */
function parseSpokenTask(raw, at=Date.now()) {
 const originalRaw=String(raw||'').trim();raw=originalRaw.replace(/[０-９]/g,c=>String(c.charCodeAt(0)-65296));
 const numeral='零〇一二两三四五六七八九十百千',token='[0-9'+numeral+']+';
 const number=value=>{if(/^\d+(?:\.\d+)?$/.test(value))return Number(value);const digits={零:0,〇:0,一:1,二:2,两:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9};if(!/[十百千]/.test(value))return Number([...value].map(x=>digits[x]??'').join(''));let total=0,current=0;for(const x of value){if(x in digits)current=digits[x];else{total+=(current||1)*({十:10,百:100,千:1000}[x]||0);current=0;}}return total+current;};
 const bedMatch=raw.match(new RegExp('(?:床号\\s*[:：]?\\s*('+token+')|('+token+')\\s*(?:号)?床)'));
 const bed=bedMatch?String(number(bedMatch[1]||bedMatch[2])).padStart(/^0\d/.test(bedMatch[1]||bedMatch[2])?(bedMatch[1]||bedMatch[2]).length:1,'0'):'';
 const known=['测量血压','测血压','量血压','测量血糖','测血糖','测量体温','测体温','量体温','皮试','换药','输液','拔针','采血','抽血','雾化','翻身','巡视','吸氧','记录尿量','更换敷料','复测血压','复测血糖'];
 const taskMatches=known.filter(t=>raw.includes(t));
 let title=taskMatches.sort((a,b)=>b.length-a.length)[0]||'';
 let name=(raw.match(/示例患者[甲乙丙丁戊己庚辛壬癸]/)||[])[0]||'';
 if(!name){let tail=raw.match(/(?:姓名|患者|病人|名字)(?:叫|是|为)?\s*[:：]?\s*([^，,。；;\n]+)/)?.[1]||'';if(!tail&&bedMatch)tail=raw.slice(bedMatch.index+bedMatch[0].length).replace(/^[\s，,的]+/,'');tail=tail.split(/[，,]/)[0];tail=tail.split(new RegExp('(?:'+known.join('|')+'|今天|明天|后天|上午|下午|晚上|中午|凌晨|早上|'+token+'\\s*(?:分钟|小时|点|时|:|：))'))[0].replace(/^(?:患者|病人|姓名)(?:叫|是|为)?/,'').replace(/[\s，,。；;:：]+$/,'');if(/^[\u4e00-\u9fa5]{2,4}$/.test(tail)&&!/^(?:提醒|进行|请给|需要|安排|记录|稍后|分钟|小时)/.test(tail))name=tail;}
 let due=null,timeText='',timeIssue='';
 const relativeToken='(?:\\d+(?:\\.\\d+)?|['+numeral+']+)';
 let relative=raw.match(new RegExp('(?<![-\\d.])('+relativeToken+'|半)\\s*(?:个)?(小时|钟头)(?:\\s*('+token+')\\s*分钟)?\\s*(?:之)?后'))||raw.match(new RegExp('(?<![-\\d.])('+relativeToken+')\\s*(分钟|分|秒钟|秒)\\s*(?:之)?后'));

 // ASR often omits “后”. Accept explicit reminder language or a duration before a task.
 if(!relative){const candidates=[...raw.matchAll(new RegExp('(?<![-\\d.])('+relativeToken+')\\s*(分钟|分|秒钟|秒)','g'))];relative=candidates.find(m=>{const before=raw.slice(0,m.index).trim(),after=raw.slice(m.index+m[0].length).replace(/^[\s，,、：:]+/,'');return /^(?:提醒|叫我|通知)/.test(after)||/(?:提醒我?|叫我|通知我?|倒计时|定时)[\s，,：:]*$/.test(before)||known.some(t=>after.startsWith(t))||(!before&&!after.replace(/[。.!！]/g,'').trim());});}
 if(relative){timeText=relative[0];const amount=relative[1]==='半'?.5:number(relative[1]);const ms=(/小时|钟头/.test(relative[2])?amount*3600+(relative[3]?number(relative[3])*60:0):/秒/.test(relative[2])?amount:amount*60)*1000;if(ms>0&&ms<=7*86400000)due=at+ms;else timeIssue='提醒时间超出可识别范围';}
 else{const absolute=raw.match(new RegExp('(今天|明天|后天)?\\s*(上午|下午|晚上|中午|早上|凌晨)?\\s*('+token+')(?:点|时|:|：)\\s*('+token+')?\\s*(?:分)?(半|一刻|三刻)?'));if(absolute){timeText=absolute[0].trim();let hour=number(absolute[3]),minute=absolute[4]?number(absolute[4]):absolute[5]==='半'?30:absolute[5]==='一刻'?15:absolute[5]==='三刻'?45:0;if(['下午','晚上'].includes(absolute[2])&&hour<12)hour+=12;if(absolute[2]==='中午'&&hour<11)hour+=12;if(absolute[2]==='凌晨'&&hour===12)hour=0;if(hour<=23&&minute<=59){const d=new Date(at);d.setDate(d.getDate()+({明天:1,后天:2}[absolute[1]]||0));d.setHours(hour,minute,0,0);if(d.getTime()>at)due=d.getTime();else timeIssue='所述时间已过，尚未设置提醒';}else timeIssue='时间点无效，尚未设置提醒';}}
 if(!title){let remainder=raw;if(bedMatch)remainder=remainder.replace(bedMatch[0],'');if(name)remainder=remainder.replace(name,'');if(timeText)remainder=remainder.replace(timeText,'');title=remainder.replace(/(?:床号|姓名|患者|病人|请|帮我|提醒我|记录一下|需要|安排)/g,'').replace(/^[\s，,。；;:：]+|[\s，,。；;:：]+$/g,'').trim()||raw;}
 return {raw:originalRaw,bed,name,title:title.slice(0,160),due,timeText,timeIssue};
}
if(typeof window!=='undefined')window.parseSpokenTask=parseSpokenTask;

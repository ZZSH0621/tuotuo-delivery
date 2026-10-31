import {searchPages} from './search-core.mjs';
import {availableTopicSummaries} from './topic-summaries.mjs';
const $ = (s) => document.querySelector(s);
const escape = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let book, chapterId = '', query = '', resultPage = 0, currentPage, mode = 'scan';
const pageSize = 12;
let searchAlternatives=[],searchGeneration=0,searchController=null;const searchCache=new Map();
let preparedTopics=[];
function searchTerms(){return [...new Set([query,...searchAlternatives].flatMap(q=>q.trim().split(/\s+/)).filter(Boolean))];}
function searchBusy(busy){$('#searchForm button').textContent=busy?'解析中…':'搜索 ↗';$('#searchForm').setAttribute('aria-busy',String(busy));}
function cancelSearch(){searchGeneration++;searchController?.abort();searchController=null;searchBusy(false);}
function normalized(s) { return String(s ?? '').toLowerCase().replace(/[\s\u3000]/g, ''); }
function chapterFor(p) { return book.chapters.find(c => c.id === p.chapterId); }
function pageLabel(p) { return p.printedPage ? `教材第 ${p.printedPage} 页` : `PDF 第 ${p.pdfPage} 页`; }
function chapterNumber(c, i) { return c.category === 'textbook' ? String(i+2).padStart(2,'0') : '附'; }
function chapterPages(c) { return book.pages.filter(p => p.chapterId === c.id); }
function renderTopicSummary(matches) {
  const terms=[query,...searchAlternatives].map(normalized).filter(Boolean);
  const topic=terms.length ? preparedTopics.find(t=>t.terms.some(term=>terms.some(q=>q.includes(normalized(term)))))
    : preparedTopics.find(t=>!chapterId||t.links.some(link=>link.page.chapterId===chapterId));
  $('#searchHints').innerHTML=preparedTopics.map(t=>`<button type="button" data-topic="${escape(t.id)}" aria-pressed="${t.id===topic?.id}">${escape(t.title)}</button>`).join('');
  const panel=$('#topicSummary');
  if(query&&matches&&!matches.length){panel.hidden=true;panel.innerHTML='';return;}
  if(!topic){panel.hidden=true;panel.innerHTML='';return;}
  panel.hidden=false;
  panel.innerHTML=`<div class="topic-summary-heading"><h2 id="topicSummaryTitle">${escape(topic.title)}</h2><span>小结</span></div><p>${escape(topic.summary)}</p><div class="topic-summary-links">${topic.links.map(link=>`<button type="button" class="topic-content-card" data-page="${link.pdfPage}"><span>${escape(link.title)}</span><small>${escape(pageLabel(link.page))} <b aria-hidden="true">↗</b></small></button>`).join('')}</div>`;
}
function chooseTopic(id) {
  const topic=preparedTopics.find(t=>t.id===id);if(!topic)return;
  cancelSearch();chapterId='';query=topic.query;searchAlternatives=[];resultPage=0;currentPage=null;
  $('#query').value=query;$('#searchStatus').textContent='';$('#reader').hidden=true;renderResults();updateUrl();
}
function highlighted(s) {
  if (!query.trim()) return escape(s);
  const terms = searchTerms().sort((a,b) => b.length-a.length);
  const pattern = terms.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  return String(s).split(new RegExp(`(${pattern})`, 'gi')).map((part,i) => i % 2 ? `<mark>${escape(part)}</mark>` : escape(part)).join('');
}
function snippet(p) {
  const text = p.text.replace(/\s+/g, ' ').trim();
  const first = searchTerms().find(t=>text.toLowerCase().includes(t.toLowerCase())) || '';
  const at = first ? text.toLowerCase().indexOf(first.toLowerCase()) : 0;
  const start = Math.max(0, at - 50);
  return (start ? '…' : '') + text.slice(start,start+190) + (text.length>start+190?'…':'');
}
function renderNav() {
  $('#totalPages').textContent = `${book.pages.length} 页`;
  $('#chapters').innerHTML = book.chapters.map((c,i) => `<button class="chapter${chapterId===c.id?' selected':''}" data-chapter="${escape(c.id)}"${chapterId===c.id?' aria-current="true"':''}><span class="number">${chapterNumber(c,i)}</span><span class="chapter-name">${escape(c.title)}</span><span class="count">${chapterPages(c).length}</span></button>`).join('');
  $('#allChapters').classList.toggle('selected', !chapterId);
}
function renderResults() {
  renderNav();
  const chapter = book.chapters.find(c => c.id === chapterId);
  $('#stats').textContent = `${book.chapters.length} 个章节与附录 · ${book.pages.length} 页收录 · 可搜索正文，查看原页`;
  $('#clearSearch').hidden = !chapterId && !query;
  if (!chapterId && !query) {
    renderTopicSummary();
    $('#resultsTitle').textContent = '按章节探索';
    $('#results').innerHTML = `<div class="chapter-grid">${book.chapters.map((c,i) => {const pages=chapterPages(c);return `<button class="chapter-card" data-chapter="${escape(c.id)}"><span class="card-number">${chapterNumber(c,i)} / TEXTBOOK</span><h3>${escape(c.title)}</h3><p>${pages.length} 页 · ${pages[0]?pageLabel(pages[0]):'教材正文'}</p><span class="arrow">↗</span></button>`;}).join('')}</div>`;
    $('#pagination').innerHTML = '';
    return;
  }
  const matches=searchPages(book,{query,alternatives:searchAlternatives,chapterId});
  renderTopicSummary(matches);
  const count = Math.max(1,Math.ceil(matches.length/pageSize));
  resultPage = Math.min(resultPage,count-1);
  $('#resultsTitle').textContent = query ? `“${query}” · ${matches.length} 页结果${chapter?' / '+chapter.title:''}` : `${chapter.title} · ${matches.length} 页`;
  $('#results').innerHTML = matches.slice(resultPage*pageSize,(resultPage+1)*pageSize).map(p => `<button class="page-result" data-page="${p.pdfPage}"><small>${escape(chapterFor(p)?.title||'教材')} · ${pageLabel(p)} · PDF ${p.pdfPage}</small><h3>${escape(p.heading || pageLabel(p))}</h3><p>${highlighted(snippet(p))}</p><span class="read-more">查看教材原页与识别文字 ↗</span></button>`).join('') || '<div class="empty">没有找到匹配内容。试试更短的关键词，或在全部章节中搜索。<button id="resetFromEmpty">返回全部章节</button></div>';
  $('#pagination').innerHTML = count>1 ? `<button id="prevResults" ${resultPage===0?'disabled':''}>上一组</button><span>${resultPage+1} / ${count}</span><button id="nextResults" ${resultPage===count-1?'disabled':''}>下一组</button>` : '';
}
function updateUrl() {
  const params=new URLSearchParams();
  if(document.documentElement.classList.contains('embedded-library'))params.set('embedded','1');
  if(chapterId)params.set('chapter',chapterId);
  if(query)params.set('q',query);
  if(currentPage)params.set('page',currentPage.pdfPage);
  history.replaceState(null,'',location.pathname+(params.size?'?'+params:''));
}
async function search() {
  if(searchController&&query===$('#query').value.trim())return;
  cancelSearch();const generation=searchGeneration;query=$('#query').value.trim();searchAlternatives=[];resultPage=0;$('#reader').hidden=true;currentPage=null;$('#searchStatus').textContent='';renderResults();updateUrl();if(!query)return;
  const original=query,cached=searchCache.get(original);if(cached){searchAlternatives=cached;renderResults();$('#searchStatus').textContent='检索：'+cached.join(' / ');return;}
  searchBusy(true);$('#searchStatus').textContent='正在理解搜索词…';searchController=new AbortController();const controller=searchController;const timer=setTimeout(()=>controller.abort(),16000);
  try{const response=await fetch('/api/search-query',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':crypto.randomUUID()},body:JSON.stringify({query:original}),signal:controller.signal});const data=await response.json();if(generation!==searchGeneration)return;if(!response.ok||!Array.isArray(data.queries)||!data.queries.length){const e=new Error('MODEL');e.code=data.code;throw e;}searchAlternatives=data.queries.filter(q=>typeof q==='string'&&q.length<=80).slice(0,4);searchCache.set(original,searchAlternatives);if(searchCache.size>24)searchCache.delete(searchCache.keys().next().value);resultPage=0;renderResults();$('#searchStatus').textContent='检索：'+searchAlternatives.join(' / ');}
  catch(e){if(generation!==searchGeneration)return;$('#searchStatus').textContent=e.code==='SEARCH_RATE_LIMIT'||e.code==='SEARCH_LIMIT'?'搜索较频繁，已按原词检索':e.code==='SEARCH_DUPLICATE'?'请求重复，已按原词检索':e.code==='SEARCH_MODEL_UNAUTHORIZED'?'模型权限暂不可用，已按原词检索':'模型暂不可用，已按原词检索';}
  finally{clearTimeout(timer);if(generation===searchGeneration){searchController=null;searchBusy(false);}}
}

function reset() { cancelSearch();searchAlternatives=[];$('#searchStatus').textContent='';chapterId='';query='';$('#query').value='';resultPage=0;currentPage=null;$('#reader').hidden=true;renderResults();updateUrl(); }
function chooseChapter(id) {cancelSearch();chapterId=id;resultPage=0;currentPage=null;$('#reader').hidden=true;renderResults();updateUrl();$('#resultsSection').scrollIntoView({behavior:'smooth',block:'start'}); }
function readPage(pdfPage,scroll=true) {
  const p=book.pages.find(p=>p.pdfPage===Number(pdfPage));
  if(!p){$('#pageJump').setCustomValidity('该页未收录，请输入已收录的 PDF 页码。');$('#pageJump').reportValidity();return;}
  currentPage=p;$('#reader').hidden=false;
  $('#readerChapter').textContent=chapterFor(p)?.title||book.title;
  $('#readerTitle').textContent=pageLabel(p);
  $('#pageJump').value=p.pdfPage;$('#pageJump').min=book.pages[0].pdfPage;$('#pageJump').max=book.pages.at(-1).pdfPage;$('#pageJump').setCustomValidity('');
  $('#pageImage').src=p.image;$('#pageImage').alt=`《基础护理学》第7版 · ${pageLabel(p)} · 原PDF第${p.pdfPage}页`;
  $('#originalImage').href=p.image;
  $('#textView').innerHTML=highlighted(p.text||'此页没有可识别文字，请查看教材原页。');
  $('#pageSource').textContent=`来源：《基础护理学》第7版 · ${pageLabel(p)} · 原文件 PDF 第 ${p.pdfPage} / 504 页 · OCR 未逐字校对`;
  const i=book.pages.indexOf(p);$('#prevPage').disabled=i===0;$('#nextPage').disabled=i===book.pages.length-1;
  setMode(mode);updateUrl();if(scroll)$('#reader').scrollIntoView({behavior:'smooth',block:'start'});
}
function setMode(next) {mode=next;$('#scanView').hidden=mode!=='scan';$('#textView').hidden=mode!=='text';$('#scanMode').setAttribute('aria-pressed',mode==='scan');$('#textMode').setAttribute('aria-pressed',mode==='text');}
$('#searchForm').addEventListener('submit',e=>{e.preventDefault();if(book)search();});
$('#query').addEventListener('input',()=>{cancelSearch();$('#searchStatus').textContent='';});
$('#query').addEventListener('search',()=>{if(book)search();});
$('#allChapters').onclick=()=>{if(book){chapterId='';resultPage=0;renderResults();updateUrl();}};
$('#clearSearch').onclick=()=>reset();
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!book)return;if(b.dataset.topic)chooseTopic(b.dataset.topic);if(b.dataset.chapter)chooseChapter(b.dataset.chapter);if(b.dataset.page)readPage(b.dataset.page);if(b.dataset.query){$('#query').value=b.dataset.query;chapterId='';search();}if(b.id==='resetFromEmpty')reset();if(b.id==='prevResults'||b.id==='nextResults'){resultPage+=b.id==='prevResults'?-1:1;renderResults();$('#resultsSection').scrollIntoView({behavior:'smooth',block:'start'});}});
$('#sourceToggle').onclick=()=>{const show=$('#sourceInfo').hidden;$('#sourceInfo').hidden=!show;$('#sourceToggle').setAttribute('aria-expanded',show);};
$('#closeReader').onclick=()=>{$('#reader').hidden=true;currentPage=null;updateUrl();};
$('#scanMode').onclick=()=>setMode('scan');$('#textMode').onclick=()=>setMode('text');
$('#prevPage').onclick=()=>readPage(book.pages[book.pages.indexOf(currentPage)-1]?.pdfPage,false);
$('#nextPage').onclick=()=>readPage(book.pages[book.pages.indexOf(currentPage)+1]?.pdfPage,false);
$('#jumpPage').onclick=()=>{if(book)readPage($('#pageJump').value,false);};
$('#pageJump').addEventListener('input',()=>$('#pageJump').setCustomValidity(''));
$('#pageJump').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();readPage(e.target.value,false);}});
try {
  const response=await fetch('book.json');if(!response.ok)throw Error('教材索引加载失败');
  book=await response.json();if(!book.pages?.length||!book.chapters?.length)throw Error('教材索引为空');
  preparedTopics=availableTopicSummaries(book);
  const params=new URLSearchParams(location.search);chapterId=book.chapters.some(c=>c.id===params.get('chapter'))?params.get('chapter'):'';query=(params.get('q')||'').slice(0,120);$('#query').value=query;
  const notes=book.sourceNotes;$('#sourceNotes').textContent=Array.isArray(notes)?notes.join('；'):String(notes||'原扫描件可能存在缺页，页码以原页为准。');
  renderResults();if(params.get('page'))readPage(params.get('page'),false);else if(query)void search();
} catch(error) {$('#stats').textContent='教材索引暂时无法加载';$('#chapters').innerHTML='';$('#results').innerHTML='<div class="empty">暂时无法加载教材，请检查网络后重试。<button id="retryLoad">重新加载</button></div>';$('#retryLoad').onclick=()=>location.reload();}

if(document.documentElement.classList.contains('embedded-library')){let lastSignal=0;const report=()=>{if(Date.now()-lastSignal<1000)return;lastSignal=Date.now();parent.postMessage({type:'tuotuo-knowledge-activity'},location.origin);};for(const kind of ['pointerdown','keydown','scroll'])addEventListener(kind,report,{passive:true,capture:true});}

export const normalizeTerm=s=>String(s??'').toLowerCase().replace(/[\s\u3000]/g,'');
export function searchPages(book,{query='',alternatives=[],chapterId=''}={}){
 const plans=[query,...alternatives].map(q=>q.trim().split(/\s+/).map(normalizeTerm).filter(Boolean)).filter(a=>a.length);
 const chapterNames=new Map(book.chapters.map(c=>[c.id,c.title]));
 return book.pages.map(p=>{const text=normalizeTerm(p.text+' '+(chapterNames.get(p.chapterId)||''));const heading=normalizeTerm(p.heading);const scores=plans.filter(terms=>terms.every(t=>text.includes(t))).map(terms=>terms.reduce((n,t)=>n+(heading.includes(t)?30:0)+Math.min(20,text.split(t).length-1),0));return {p,score:scores.length?Math.max(...scores):0,match:!plans.length||!!scores.length};}).filter(x=>(!chapterId||x.p.chapterId===chapterId)&&x.match).sort((a,b)=>plans.length?b.score-a.score||a.p.pdfPage-b.p.pdfPage:a.p.pdfPage-b.p.pdfPage).map(x=>x.p);
}

// Prepared from the linked textbook pages; no model request is needed to display these cards.
export const TOPIC_SUMMARIES = [
  {id:'blood-pressure',title:'血压测量',query:'血压',terms:['血压','测血压'],
    summary:'血压测量包含评估准备、操作测量与结果记录。测量体位、袖带及仪器状态，都是影响结果的相关因素。',
    links:[{pdfPage:235,title:'评估与准备'},{pdfPage:236,title:'测量与记录'},{pdfPage:237,title:'注意事项'}]},
  {id:'aseptic',title:'无菌技术',query:'无菌',terms:['无菌','无菌技术'],
    summary:'无菌技术的重点是保持无菌物品与无菌区域不受污染，内容涵盖相关概念、操作原则及容器、无菌包的使用。',
    links:[{pdfPage:64,title:'概念与操作原则'},{pdfPage:66,title:'无菌容器'},{pdfPage:67,title:'无菌包'}]},
  {id:'specimens',title:'标本采集',query:'标本',terms:['标本','采血','血标本'],
    summary:'标本质量与采集前准备、信息查对、采集方式和送检环节相关；不同标本的容器、采集与保存要求有所区别。',
    links:[{pdfPage:404,title:'采集基本原则'},{pdfPage:405,title:'准备、查对与送检'},{pdfPage:408,title:'血液标本采集'}]},
  {id:'nursing-records',title:'护理记录',query:'护理记录',terms:['护理记录','护理文件','交班报告'],
    summary:'护理记录反映观察、护理措施与效果，书写原则包括及时、准确、完整、简要、清晰；交班报告衔接后续观察与护理。',
    links:[{pdfPage:201,title:'记录与管理'},{pdfPage:202,title:'书写原则'},{pdfPage:209,title:'护理记录与交班'}]}
];

export function availableTopicSummaries(book) {
  const pages = new Map((book?.pages || []).map(p=>[p.pdfPage,p]));
  // A shortcut is offered only when every linked content card is present.
  return TOPIC_SUMMARIES.filter(t=>t.links.every(link=>pages.has(link.pdfPage)))
    .map(t=>({...t,links:t.links.map(link=>({...link,page:pages.get(link.pdfPage)}))}));
}

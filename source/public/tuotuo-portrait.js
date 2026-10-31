/* Layout only. Keep the same document, draft, timers and recording lifecycle. */
(()=>{
 const button=document.querySelector('#portraitToggle'),label=document.querySelector('#portraitStatus');
 if(!button||!label)return;
 const desktop=matchMedia('(min-width: 761px)'),key='tuotuo-layout-preview-v1';let preferred=false;
 try{preferred=localStorage.getItem(key)==='portrait';}catch{}
 function apply(){const active=desktop.matches&&preferred;document.documentElement.classList.toggle('phonePreview',active);button.setAttribute('aria-pressed',String(active));button.textContent=active?'▣ 返回桌面布局':'▯ 手机竖屏预览';label.textContent=active?'390px 布局预览 · 非真机仿真':'桌面布局';}
 button.addEventListener('click',()=>{preferred=!preferred;try{localStorage.setItem(key,preferred?'portrait':'desktop');}catch{}apply();});
 desktop.addEventListener('change',apply);apply();
})();

/* All runtime sources are packaged in this HTML. No cached external JS cohort executes. */
(async()=>{'use strict';
 const report=message=>{
 let box=document.getElementById('persistence-status');if(!box){box=document.createElement('div');box.id='persistence-status';box.setAttribute('role','alert');document.querySelector('.app').prepend(box)}
 box.textContent=message+' Los datos confirmados se conservan. ';
 const link=document.createElement('a');link.href='recovery.html';link.textContent='Abrir recuperación';box.append(link);
 };
 window.addEventListener('almogaver-storage-error',e=>report(e.detail));
 window.addEventListener('unhandledrejection',e=>report(e.reason?.message||String(e.reason)));
 document.documentElement.dataset.persistence='opening';
 try{
 window.AlmogaverStorage=await new AlmogaverPersistence.Repository().open();
 for(const source of document.querySelectorAll('script[type="text/almogaver"]')){
 const script=document.createElement('script');script.textContent=source.textContent;document.body.append(script);
 }
 document.documentElement.dataset.persistence='ready';window.dispatchEvent(new Event('almogaver-ready'));
 }catch(e){document.documentElement.dataset.persistence='blocked';report('No se ha abierto el entrenamiento: '+e.message)}
})();

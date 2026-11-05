/* Public PWA lifecycle and manual checks. No user-data writes or activation commands. */
(()=>{'use strict';
 const button=document.getElementById('pwa-check-update');
 const cardStatus=document.getElementById('pwa-update-status');
 const buildLabel=document.getElementById('pwa-controller-build');
 const settings=document.getElementById('settings-screen');
 const supported='serviceWorker' in navigator;
 const messages={
  idle:'La aplicación comprueba nuevas versiones cuando hay conexión.',
  checking:'Comprobando actualizaciones…',
  downloading:'Descargando y verificando actualización…',
  firstDownloading:'Descargando y verificando la primera instalación offline…',
  prepared:'Actualización preparada. Guarda los cambios y cierra todas las ventanas de entrenamiento y recuperación de ALMOGÀVER. Se aplicará al volver a abrir; esta pantalla no se recargará sola.',
  installed:'Instalación pública descargada. El entrenamiento y la recuperación estarán disponibles sin conexión al volver a abrir. El lector OCR requiere descarga previa.',
  none:'No se ha detectado una versión nueva en esta comprobación.',
  failed:'No se ha podido preparar la actualización. La versión instalada y los datos se conservan.',
  network:'Error al comprobar; inténtalo con conexión. No se ha podido preparar la actualización. La versión instalada y los datos se conservan.',
  offline:'El navegador indica que no hay conexión. No se puede comprobar sin conexión; inténtalo cuando vuelva. Puedes seguir entrenando offline si la instalación está completa.',
  unsupported:'Este navegador no permite Service Worker. No se puede comprobar la actualización desde aquí.',
  unregistered:'No hay un registro de actualización disponible. Abre la aplicación con conexión y vuelve a intentarlo.',
  uncontrolled:'Esta ventana aún no está controlada por un Service Worker. Espera a que termine la primera instalación y vuelve a abrir de forma normal.',
  pending:'La comprobación sigue pendiente y no se ha confirmado su resultado. Puedes continuar entrenando; vuelve a consultar con conexión.'
 };
 let registration=null,registrationPending=supported,inFlight=null,state='idle',message=messages.idle;
 let failureSerial=0,buildEpoch=0,globalStatus=null,automaticNotice=false;
 const workers=new WeakMap(),registrations=new WeakSet();
 const present=()=>{
  const inSettings=!!settings?.classList.contains('active');
  if(cardStatus){cardStatus.textContent=message;cardStatus.dataset.state=state;cardStatus.setAttribute('aria-live',inSettings?'polite':'off')}
  if(!globalStatus&&automaticNotice){globalStatus=document.getElementById('pwa-status');if(!globalStatus){globalStatus=document.createElement('p');globalStatus.id='pwa-status';globalStatus.setAttribute('role','status');(document.querySelector('.app')||document.body).prepend(globalStatus)}}
  if(globalStatus){globalStatus.textContent=message;globalStatus.dataset.state=state;globalStatus.hidden=inSettings;globalStatus.setAttribute('aria-live',inSettings?'off':'polite')}
  if(button){button.dataset.registration=registrationPending?'pending':registration?'ready':'missing';button.disabled=!supported||state==='checking'||state==='downloading'||state==='firstDownloading';button.setAttribute('aria-busy',state==='checking'?'true':'false')}
 };
 const show=(next,automatic=false)=>{state=next;message=messages[next];automaticNotice=automaticNotice||automatic;present()};
 const refreshBuild=()=>{
  const epoch=++buildEpoch,target=supported?navigator.serviceWorker.controller:null;
  if(buildLabel){buildLabel.textContent='Build controlador: no verificado';delete buildLabel.dataset.build}
  if(!target)return;
  const channel=new MessageChannel();let ended=false;
  const finish=()=>{if(ended)return;ended=true;clearTimeout(timer);channel.port1.close();channel.port2.close()};
  const timer=setTimeout(finish,2500);
  channel.port1.onmessage=event=>{
   if(epoch===buildEpoch&&target===navigator.serviceWorker.controller&&typeof event.data?.build==='string'&&/^[a-f0-9]{24}$/.test(event.data.build)&&buildLabel){
    buildLabel.textContent='Build controlador: '+event.data.build;buildLabel.dataset.build=event.data.build;
   }
   finish();
  };
  try{target.postMessage({type:'ALMOGAVER_PUBLIC_STATUS'},[channel.port2])}catch(_){finish()}
 };
 const isUpdate=worker=>workers.get(worker)?.update||!!(registration?.active&&registration.active!==worker)||!!(navigator.serviceWorker.controller&&navigator.serviceWorker.controller!==worker);
 const inspect=()=>{
  const candidate=registration?.waiting||registration?.installing;
  if(candidate?.state==='installed'){show(isUpdate(candidate)?'prepared':'installed',true);return true}
  if(candidate&&(candidate.state==='installing'||candidate.state==='parsed')){show(isUpdate(candidate)?'downloading':'firstDownloading',true);return true}
  return false;
 };
 const observe=worker=>{
  if(!worker||workers.has(worker))return;
  workers.set(worker,{update:!!(registration?.active&&registration.active!==worker)||!!(navigator.serviceWorker.controller&&navigator.serviceWorker.controller!==worker)});
  const changed=()=>{
   if(worker.state==='redundant'){failureSerial++;show('failed',true)}
   else if(worker.state==='installing'){show(isUpdate(worker)?'downloading':'firstDownloading',true)}
   else if(worker.state==='installed'){
    show(isUpdate(worker)?'prepared':'installed',true);
   }else if(worker.state==='activated'){
    // Activation does not imply that this document has a new controller.
    if(!inspect()&&!navigator.serviceWorker.controller)show('uncontrolled',true);
    refreshBuild();
   }
  };
  worker.addEventListener('statechange',changed);changed();
 };
 const watch=reg=>{
  if(!reg)return;registration=reg;
  if(!registrations.has(reg)){
   registrations.add(reg);reg.addEventListener('updatefound',()=>observe(reg.installing));
  }
  observe(reg.installing);if(reg.waiting)observe(reg.waiting);inspect();
 };
 const confirmReachable=async reg=>{
  // update() can resolve a coalesced job without a successful new network read.
  // This existing public URL is a reachability check only, never a source of build identity.
  const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),8000);
  try{
   const response=await fetch(new URL('sw.js',reg.scope),{credentials:'omit',cache:'no-store',redirect:'error',signal:abort.signal});
   try{if(response.status!==200||!response.ok)throw Error('Public worker unavailable')}finally{await response.body?.cancel()}
  }finally{clearTimeout(timer)}
 };
 const check=async()=>{
  if(!supported){show('unsupported');return}
  // Even after a diagnostic deadline, do not start a second unresolved update operation.
  if(inFlight){if(state==='pending')present();return}
  refreshBuild();
  if(registration&&inspect())return;
  if(registrationPending){show('unregistered');return}
  if(!registration){
   show('checking');
   const lookup=Promise.resolve().then(()=>navigator.serviceWorker.getRegistration());inFlight=lookup;
   let lookupTimer=setTimeout(()=>{if(inFlight===lookup)show('pending')},20000);
   try{watch(await lookup)}catch(_){show('network');return}finally{clearTimeout(lookupTimer);if(inFlight===lookup)inFlight=null}
   if(!registration){show('unregistered');return}
   if(inspect())return;
  }
  if(navigator.onLine===false){show('offline');return}
  const failureBefore=failureSerial;
  show('checking');
  // Install the lock before invoking update(): lifecycle events may arrive synchronously.
  const operation={};inFlight=operation;
  const timer=setTimeout(()=>{if(inFlight===operation)show('pending')},20000);
  try{
   await registration.update();
   if(!inspect()){
    if(failureSerial!==failureBefore)show('failed');
    else if(!navigator.serviceWorker.controller)show('uncontrolled');
    else{
     await confirmReachable(registration);
     if(!inspect())show(failureSerial!==failureBefore?'failed':'none');
    }
   }
  }catch(_){if(!inspect())show(navigator.onLine===false?'offline':'network')}
  finally{clearTimeout(timer);if(inFlight===operation)inFlight=null;present();refreshBuild()}
 };
 button?.addEventListener('click',()=>{void check()});
 if(settings&&cardStatus)new MutationObserver(present).observe(settings,{attributes:true,attributeFilter:['class']});
 present();refreshBuild();
 if(!supported){show('unsupported');return}
 navigator.serviceWorker.addEventListener('controllerchange',()=>{
  refreshBuild();if(!inspect())show(navigator.serviceWorker.controller?'idle':'uncontrolled',true);
 });
 // One registration path; automatic lifecycle and the manual card share the same observers.
 Promise.resolve().then(()=>navigator.serviceWorker.register('sw.js',{updateViaCache:'none'})).then(reg=>{
  registrationPending=false;watch(reg);if(!registration)show('unregistered',true);
  else if(!inspect())show(navigator.serviceWorker.controller?'idle':'uncontrolled');
  present();refreshBuild();
 }).catch(()=>{registrationPending=false;show('unregistered',true)});
})();

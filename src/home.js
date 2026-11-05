/* RC2 home navigation only. Existing editors, workouts and IDB transactions are reused. */
(()=>{'use strict';
const K=AlmogaverPersistence.K,host=document.getElementById('personal-home');
const original=document.getElementById('original-training');
let exploring=false,changing=false,busy=false;
const list=()=>AlmogaverStorage.get(K.plans,[]).filter(p=>!p.archived);
function selection(){
 const settings=AlmogaverStorage.get(K.settings,{});
 if(Object.hasOwn(settings,'homePlan')){
  const value=settings.homePlan;
  if(value&&typeof value==='object'&&!Array.isArray(value)){
   if(value.kind==='original')return{kind:'original'};
   if(value.kind==='plan'&&typeof value.id==='string'){
    const plan=list().find(p=>p.id===value.id);
    if(plan)return{kind:'plan',plan};
   }
  }
  return{kind:'choose',unavailable:true};
 }
 // Existing plans have no persisted active selection in RC1. Never infer one from order.
 if(list().length)return{kind:'choose'};
 // Only real prior training/configuration implies the previous home. Drafts alone do not.
 const state=AlmogaverStorage.get(K.state,{});
 const prior=Object.keys(state).length||getHistory().length||
  [K.wods,K.skills,K.weeks].some(k=>AlmogaverStorage.get(k,[]).length)||
  ['openStart','chartExercise'].some(k=>Object.hasOwn(settings,k));
 return{kind:prior?'original':'welcome'};
}
function button(label,action,id){
 const b=domNode('button','btn soft',label);b.type='button';b.dataset.homeAction=action;
 if(id!==undefined)b.dataset.id=id;return b;
}
function actions(...buttons){const box=domNode('div','actions');box.append(...buttons);return box}
function card(title,text){const box=domNode('article','card plan-card');box.append(domNode('h3',null,title));if(text)box.append(domNode('p',null,text));return box}
function editorActions(){return actions(button('Importar mi rutina','import'),button('Crear mi rutina','manual'),button('Explorar plantillas de ejemplo','examples'))}
function render(){
 const active=selection(),mode=exploring?'examples':changing?'choose':active.kind;
 host.dataset.homeState=mode;original.hidden=mode!=='original';host.replaceChildren();
 document.querySelector('.plan-entry').style.display=mode==='original'?'':'none';
 document.querySelector('.tools').style.display=['original','plan'].includes(mode)?'':'none';
 document.getElementById('original-session-notes-title').closest('.card').style.display=mode==='original'?'':'none';
 if(mode!=='original')document.getElementById('session-summary-v6').hidden=true;
 if(mode!=='original')document.querySelector('#dashboard-v6 .resume-session')?.remove();
 if(mode==='original'){
  const box=card('Tu planificación original','Lower Strength · Clase CrossFit · Upper Strength · Open Box');
  box.append(actions(button('Cambiar plan activo','change'),button('Mis planes','library')));host.append(box);return;
 }
 if(mode==='plan'){
  const p=active.plan,box=card(p.name,'Tu plan activo · Elige un día para entrenar.');
  box.append(actions(button('Cambiar plan activo','change'),button('Mis planes','library')));host.append(box);
  const days=domNode('div','plan-library');
  for(const d of p.days){const item=card(d.name,`${d.exercises.length} ejercicios`);item.append(button('Entrenar este día','train',d.id));days.append(item)}
  host.append(days);return;
 }
 if(mode==='examples'){
  const box=card('Plantillas de ejemplo','Son opcionales. Elegir una no elimina tus planes ni reinicia tus entrenamientos.');
  const classic=card('Planificación original ALMOGÀVER','Lower Strength, Clase CrossFit, Upper Strength y Open Box con sus progresiones actuales.');
  classic.append(button('Usar planificación original','original'));
  const sample=card('Rutina de ejemplo editable','Abre el ejemplo existente en el importador y revísalo antes de guardarlo.');
  sample.append(button('Revisar rutina de ejemplo','example'));
  box.append(classic,sample,actions(button('Volver al inicio','back')));host.append(box);return;
 }
 const box=card(mode==='welcome'?'Bienvenido a ALMOGÀVER':'Elige tu plan activo',
  mode==='welcome'?'Organiza tu entrenamiento a tu manera.':active.unavailable?'El plan seleccionado ya no está disponible. Elige otro; tus historiales y borradores se conservan.':'Tus planes se conservan. Elige qué rutina quieres ver al iniciar; no seleccionamos una por ti.');
 box.append(editorActions());
 if(AlmogaverStorage.get(K.draft,null))box.append(button('Continuar borrador','resume'));
 if(mode==='choose'){
  const choices=domNode('div','plan-library');
  for(const p of list()){const item=card(p.name,p.days.map(d=>d.name).join(' · '));item.append(button('Usar como plan activo','select',p.id));choices.append(item)}
  box.append(choices,actions(button('Continuar con la configuración anterior','original'),button('Mis planes','library')));
  if(changing)box.append(button('Cancelar cambio','back'));
 }
 host.append(box);
}
function refresh(){window.refreshDashboardV6()}
host.addEventListener('click',async event=>{
 const b=event.target.closest('[data-home-action]');if(!b||busy)return;
 busy=true;b.disabled=true;
 try{
  const action=b.dataset.homeAction;
  if(action==='examples'){exploring=true;changing=false;refresh()}
  else if(action==='change'){changing=true;exploring=false;refresh()}
  else if(action==='back'){exploring=changing=false;refresh()}
  else if(action==='original'){
   await AlmogaverStorage.commit(repo=>({[K.settings]:JSON.stringify({...repo.get(K.settings,{}),homePlan:{kind:'original'}})}),'select-original-home');
   exploring=changing=false;refresh();
  }else if(action==='select'){
   await AlmogaverPlans.activate(b.dataset.id);exploring=changing=false;refresh();
  }else if(action==='train'){
   const active=selection();if(active.kind!=='plan')throw Error('El plan activo ha cambiado. Vuelve al inicio antes de entrenar.');
   await AlmogaverPlans.train(active.plan.id,b.dataset.id);
  }else await AlmogaverPlans.open(action);
 }catch(error){showToastV5('No se ha cambiado tu configuración',error.message)}
 finally{busy=false;if(b.isConnected)b.disabled=false}
});
const dashboard=window.refreshDashboardV6;
window.refreshDashboardV6=function(){dashboard();render()};
window.addEventListener('almogaver-plans-changed',()=>{exploring=changing=false;refresh()});
window.AlmogaverHome={refresh,selection};refresh();
})();

/* Pending structured sessions only. No history, units or sports calculations change. */
window.AlmogaverSeries=(()=>{'use strict';
 const own=(o,k)=>Object.hasOwn(o,k),object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
 const LOAD='_almogaverLoadV1',UNDO='_almogaverBulkV1';
 function count(e){const n=Number(e.sets);if(!Number.isInteger(n)||n<1||n>30)throw Error('Revisa las series previstas antes de continuar.');return n}
 function context(e,row){return ['loadUnit','loadKind','loadLabel'].map((k,i)=>own(row,k)?row[k]:own(e,k)?e[k]:['kg','carga','Carga'][i])}
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 function known(m){return object(m)&&m.version===1&&['manual','linked'].includes(m.kind)}
 function editLoad(e,rows,index,value){
  const n=count(e);if(!Number.isInteger(index)||index<0||index>=n||typeof value!=='string')throw Error('Serie o carga incompatible.');
  const first=rows[0]||{},previous=first.load,sourceContext=context(e,first);
  const row=rows[index]||{};rows[index]=row;row.load=value;
  if(!own(row,LOAD)||known(row[LOAD]))row[LOAD]={version:1,kind:'manual'};
  if(index!==0)return;
  for(let i=1;i<n;i++){
   const target=rows[i]||{},meta=target[LOAD];
   const linked=known(meta)&&meta.kind==='linked'&&meta.source===0&&typeof meta.value==='string'&&same(meta.context,sourceContext)&&meta.value===target.load&&meta.value===previous;
   // Unknown/recovered nonempty loads are never inferred to be linked, even if equal.
   const empty=!own(target,LOAD)&&(!own(target,'load')||target.load==='');
   if((linked||empty)&&same(context(e,target),sourceContext)){
    target.load=value;target[LOAD]={version:1,kind:'linked',source:0,value,context:sourceContext};rows[i]=target;
   }
  }
 }
 function actions(s){
  if(!own(s,UNDO))return[];
  const m=s[UNDO];if(!object(m)||m.version!==1||!Array.isArray(m.actions))throw Error('Metadatos de deshacer incompatibles. Conserva el borrador y revisa la copia.');
  for(const a of m.actions)if(!object(a)||typeof a.exerciseId!=='string'||typeof a.sessionId!=='string'||!Number.isInteger(a.total)||a.total<1||a.total>30||!Number.isInteger(a.length)||a.length<0||a.length>30||typeof a.hadEntries!=='boolean'||!Array.isArray(a.before)||!a.before.length||a.before.length>a.total||new Set(a.before.map(r=>r?.index)).size!==a.before.length||a.before.some(r=>!object(r)||!Number.isInteger(r.index)||r.index<0||r.index>=a.total||typeof r.hadRow!=='boolean'||typeof r.hadDone!=='boolean'||(r.hadDone&&typeof r.done!=='boolean')))throw Error('Acción de deshacer incompatible. No se han cambiado las series.');
  if(new Set(m.actions.map(a=>a.exerciseId)).size!==m.actions.length||m.actions.some(a=>a.sessionId!==s.id||a.length>a.total||a.before.some(r=>r.hadDone&&(!r.hadRow||r.done!==false))))throw Error('Referencias de deshacer incompatibles. No se ha cambiado el borrador.');
  return m.actions;
 }
 function setActions(s,list){if(list.length)s[UNDO]={version:1,actions:list};else delete s[UNDO]}
 function cancelUndo(s,id){if(own(s,UNDO))setActions(s,actions(s).filter(a=>a.exerciseId!==id))}
 function canUndo(s,e){try{return actions(s).some(a=>a.exerciseId===e.id&&a.sessionId===s.id&&a.total===Number(e.sets))}catch{return false}}
 function complete(s,e){
  const n=count(e),list=actions(s),hadEntries=own(s.entries,e.id),rows=s.entries[e.id]||[],before=[];
  if(rows.length>n)throw Error('El borrador supera las series previstas. No se ha recortado.');
  for(let i=0;i<n;i++)if(rows[i]?.done!==true){const row=rows[i];before.push({index:i,hadRow:object(row),hadDone:object(row)&&own(row,'done'),...(object(row)&&own(row,'done')?{done:row.done}:{})})}
  if(!before.length)return false;
  const action={exerciseId:e.id,sessionId:s.id,total:n,length:rows.length,hadEntries,before};
  for(const r of before){rows[r.index]||={};rows[r.index].done=true}
  s.entries[e.id]=rows;setActions(s,[...list.filter(a=>a.exerciseId!==e.id),action]);return true;
 }
 function undo(s,e){
  const n=count(e),list=actions(s),a=list.find(a=>a.exerciseId===e.id&&a.sessionId===s.id);
  const rows=s.entries[e.id];
  if(!a||a.total!==n||!Array.isArray(rows)||rows.length>n||a.before.some(r=>rows[r.index]?.done!==true))throw Error('La sesión ha cambiado. No se puede deshacer ese marcado; revisa las series.');
  for(const r of a.before){const row=rows[r.index];if(r.hadDone)row.done=r.done;else delete row.done;if(!r.hadRow&&!Object.keys(row).length)rows[r.index]=null}
  while(rows.length>a.length&&rows.at(-1)===null)rows.pop();
  if(!a.hadEntries&&!rows.length)delete s.entries[e.id];
  setActions(s,list.filter(x=>x!==a));
 }
 function recordsEntries(day,entries){
  // Match the targets already displayed by the existing individual-checkbox UI.
  // An explicit empty/null result remains explicit and is never replaced by a target.
  const out=JSON.parse(JSON.stringify(entries));
  for(const e of day.exercises)for(let i=0;i<(out[e.id]?.length||0);i++)if(out[e.id][i]?.done===true&&!own(out[e.id][i],'reps'))out[e.id][i].reps=AlmogaverImport.targetForSet(e,i);
  return out;
 }
 return{editLoad,complete,undo,cancelUndo,canUndo,recordsEntries};
})();

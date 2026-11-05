/* ALMOGÀVER development persistence. Native IndexedDB; no automatic data deletion. */
(function(root){'use strict';
const DB='almogaver-integrity-v2', VERSION=1;
const K={state:'almogavar-state',history:'almogavar-history',wods:'almogavar-wods',skills:'almogavar-skills',settings:'almogavar-settings',plans:'almogavar-plans-v1',draft:'almogavar-import-draft-v1',sessions:'almogavar-plan-sessions-v1',weeks:'almogavar-wod-weeks-v1',weekDraft:'almogavar-wod-week-draft-v1',text:'almogavar-import-text-v1',weekText:'almogavar-wod-week-text-v1'};
const LABELS=Object.fromEntries(Object.entries(K).map(([name,key])=>[key,({state:'Cargas, checks y notas actuales',history:'Historial de sesiones',wods:'Resultados WOD',skills:'Skills',settings:'Ajustes y ciclo Open Box',plans:'Mis planes',draft:'Borrador de rutina',sessions:'Series pendientes de planes',weeks:'Programación semanal',weekDraft:'Borrador semanal',text:'Texto original de rutina',weekText:'Texto original de semana'})[name]]));
const KEYS=Object.values(K), own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k), clone=v=>JSON.parse(JSON.stringify(v));
const fail=m=>{throw new Error(m)}, obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
function jsonSafe(v,depth=0){
 if(depth>60)fail('JSON demasiado profundo.');
 if(v===null||typeof v==='string'||typeof v==='boolean')return;
 if(typeof v==='number'){if(!Number.isFinite(v))fail('Número no finito.');return}
 if(Array.isArray(v)){v.forEach(x=>jsonSafe(x,depth+1));return}
 if(!obj(v))fail('Valor incompatible con JSON.');
 for(const [k,x] of Object.entries(v)){if(['__proto__','constructor','prototype'].includes(k))fail('Clave JSON incompatible: '+k);jsonSafe(x,depth+1)}
}
function requireObj(v,label){if(!obj(v))fail(label+': debe ser un objeto.')}
function array(v,label){if(!Array.isArray(v))fail(label+': debe ser una lista.');return v}
function fields(v,names,type,label){for(const n of names)if(own(v,n)&&typeof v[n]!==type)fail(label+'.'+n+': tipo incompatible.')}
function id(v,label){if(!['string','number'].includes(typeof v)||v===''||(typeof v==='number'&&!Number.isFinite(v)))fail(label+': ID no válido.')}
function scalar(v,label){if(v!==null&&!['string','number'].includes(typeof v))fail(label+': valor escalar incompatible.')}
function strings(v,name){if(own(v,name))array(v[name],name).forEach(x=>{if(typeof x!=='string')fail(name+': se esperaba texto.')})}
function boolFields(v,names,label){fields(v,names,'boolean',label)}
function dateField(value,label,empty=true){
 if(typeof value!=='string')fail(label+': fecha incompatible.');if(empty&&value==='')return;
 const match=value.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
 if(match){const d=new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00Z`);if(!Number.isFinite(d.getTime())||d.getUTCFullYear()!==Number(match[1])||d.getUTCMonth()+1!==Number(match[2])||d.getUTCDate()!==Number(match[3]))fail(label+': fecha inexistente.')}
 if(!Number.isFinite(Date.parse(value)))fail(label+': fecha no válida.');
}
function count(value,label){if(!Number.isSafeInteger(value)||value<0)fail(label+': contador incompatible.')}
function rpe(value,label,numericOnly=false){
 scalar(value,label);if(value===null||value==='')return;
 if(typeof value==='number'){if(!Number.isFinite(value)||value<0||value>10)fail(label+': RPE fuera de 0–10.');return}
 const isNumeric=/^\s*[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)\s*$/.test(value);
 if(isNumeric){const n=Number(value.trim().replace(',','.'));if(!Number.isFinite(n)||n<0||n>10)fail(label+': RPE fuera de 0–10.')}
 else if(numericOnly)fail(label+': RPE debe ser numérico o vacío.');
 // Historical free-form RPE notation is preserved; no reinterpretation of ranges.
}
function setEntry(v,label){requireObj(v,label);for(const n of ['load','reps'])if(own(v,n))scalar(v[n],label+'.'+n);if(own(v,'rpe'))rpe(v.rpe,label+'.rpe');boolFields(v,['done'],label)}
function sessions(value){requireObj(value,'Series pendientes');for(const session of Object.values(value)){requireObj(session,'Borrador de sesión');fields(session,['id','notes'],'string','Borrador de sesión');requireObj(session.entries,'Entradas de sesión');for(const rows of Object.values(session.entries))array(rows,'Series pendientes').forEach(row=>{if(row!==null)setEntry(row,'Serie pendiente')})}}
function plan(v,draft=false,week=false){
 requireObj(v,'Plan');id(v.id,'Plan');if(typeof v.id!=='string')fail('El ID del plan/semana debe ser texto.');fields(v,['name','createdAt','updatedAt','sourceType','sourceText','weekStart'],'string','Plan');
 boolFields(v,['archived','editing'],'Plan/semana');if(own(v,'schemaVersion')&&v.schemaVersion!==1)fail('Esquema interno de plan/semana incompatible.');for(const name of ['createdAt','updatedAt','weekStart'])if(own(v,name))dateField(v[name],name);strings(v,'warnings');strings(v,'unparsed');if(typeof v.name!=='string'||(!draft&&!v.name.trim()))fail('Nombre de plan incompatible.');
 const days=array(v.days,'Días');if(days.length>14||(!draft&&!days.length))fail('Deben ser entre 1 y 14 días; un borrador puede estar vacío.');
 const ids=new Set();let total=0;
 days.forEach(d=>{requireObj(d,'Día');id(d.id,'Día');if(typeof d.id!=='string')fail('El ID del día debe ser texto.');if(ids.has(d.id))fail('Días duplicados.');ids.add(d.id);fields(d,['name'],'string','Día');
 if(typeof d.name!=='string')fail('Nombre de día incompatible.');
 const entries=array(d[week?'blocks':'exercises'],'Contenido del día');total+=entries.length;const sub=new Set();
 entries.forEach(e=>{requireObj(e,'Ejercicio/bloque');id(e.id,'Ejercicio/bloque');if(typeof e.id!=='string')fail('El ID del ejercicio/bloque debe ser texto.');if(sub.has(e.id))fail('IDs duplicados en el día.');sub.add(e.id);
 fields(e,week?['title','type','body','timeCap']:['name','reps','rest','notes','source'],'string','Ejercicio/bloque');
 strings(e,'warnings');if(!draft){for(const field of week?['title','body','type']:['name','reps'])if(typeof e[field]!=='string'||!e[field].trim())fail('Contenido guardado incompleto.');if(!week&&e.sets==null)fail('Series guardadas incompletas.')}
 if(!week&&own(e,'sets')&&e.sets!==null&&(!['number','string'].includes(typeof e.sets)||!Number.isInteger(Number(e.sets))||Number(e.sets)<1||Number(e.sets)>30))fail('Series incompatibles.');
 if(week&&own(e,'type')&&!['Fuerza','Técnica','Circuito','For Time','AMRAP','EMOM','Intervals','Otro'].includes(e.type))fail('Tipo de bloque incompatible.');
 });});
 if(total>(week?100:300))fail(week?'La semana supera 100 bloques.':'El plan supera 300 ejercicios.');
}
function validate(key,value){
 jsonSafe(value);
 if(key===K.draft||key===K.weekDraft){if(value!==null)plan(value,true,key===K.weekDraft);return value}
 if([K.state,K.settings,K.sessions].includes(key)){requireObj(value,key);
 if(key===K.sessions)sessions(value);
 if(key===K.state){for(const[k,v]of Object.entries(value)){
 if(/^note-(?:lower|upper|class|open-p(?:12|34|56|78))$/.test(k)||['class-label','class-warmup','class-strength','class-wod','class-scale'].includes(k)){if(typeof v!=='string')fail('Texto actual incompatible: '+k)}
 if(/^(?:lower|upper|open-p(?:12|34|56|78))-check-\d+$/.test(k)&&typeof v!=='boolean')fail('Check actual incompatible.');
 if(/^(?:lower|upper|open-p(?:12|34|56|78))-ex-\d+-field-\d+$/.test(k))scalar(v,'Métrica actual');}
 if(own(value,'currentSession')&&!['lower','upper','class','open'].includes(value.currentSession))fail('Sesión actual incompatible.');if(own(value,'currentPhase')&&!['p12','p34','p56','p78'].includes(value.currentPhase))fail('Fase actual incompatible.')}
 if(key===K.settings){fields(value,['openStart','chartExercise'],'string','Ajustes');if(own(value,'openStart'))dateField(value.openStart,'Inicio Open Box')}return value}
 if([K.text,K.weekText].includes(key)){if(typeof value!=='string')fail('El texto pendiente debe ser texto.');return value}
 if([K.plans,K.weeks].includes(key)){const ids=new Set();array(value,key).forEach(p=>{plan(p,false,key===K.weeks);if(ids.has(p.id))fail('Planes/semanas duplicados.');ids.add(p.id)});return value}
 if([K.history,K.wods,K.skills].includes(key))array(value,key).forEach(x=>{
 requireObj(x,key);id(x.id,key);fields(x,['name','title','date','notes','workout','result','scaling','type','updated'],'string',key);
 if(own(x,'date'))dateField(x.date,'Fecha de registro',false);if(own(x,'updated'))dateField(x.updated,'Fecha de modificación');if(key===K.wods&&own(x,'rpe'))rpe(x.rpe,'WOD.rpe',true);
 if(key===K.skills&&(!Number.isInteger(x.level)||x.level<0||x.level>5))fail('Nivel de skill incompatible.');
 if(key===K.history){for(const n of ['done','total'])if(own(x,n)&&(!Number.isSafeInteger(x[n])||x[n]<0))fail('Contador de sesión incompatible.');
 if(own(x,'done')&&own(x,'total')&&x.done>x.total)fail('Los bloques completados superan el total.');
 if(own(x,'exercises'))array(x.exercises,'Ejercicios históricos').forEach(e=>{requireObj(e,'Registro');for(const n of ['load','reps','estimated1RM'])if(own(e,n))scalar(e[n],n);if(own(e,'rpe'))rpe(e.rpe,'Registro.rpe');fields(e,['name','exerciseId','exerciseKey','series','loadUnit','loadKind'],'string','Registro');if(own(e,'loadLabel')&&e.loadLabel!==null&&typeof e.loadLabel!=='string')fail('Etiqueta de carga incompatible.');if(own(e,'sets'))array(e.sets,'Series históricas').forEach(s=>setEntry(s,'Serie histórica'))});}
 });
 return value;
}
function validateMap(map){
 requireObj(map,'Módulos');for(const [k,raw] of Object.entries(map)){if(!KEYS.includes(k))fail('Módulo desconocido: '+k);if(typeof raw!=='string')fail('Representación de módulo no válida.');validate(k,JSON.parse(raw))}
 // Historical sessions are immutable snapshots: a removed plan/day is not an active FK.
 // Pending sessions and editing drafts are active relationships and must resolve exactly.
 if(own(map,K.sessions)){
 const plans=own(map,K.plans)?JSON.parse(map[K.plans]):[],pending=JSON.parse(map[K.sessions]);
 for(const [key,session]of Object.entries(pending)){
 const matches=plans.flatMap(p=>p.days.map(d=>({p,d}))).filter(({p,d})=>`${p.id}/${d.id}`===key);
 if(matches.length!==1)fail('Borrador de sesión con referencia de plan/día ausente o ambigua.');
 const day=matches[0].d;
 for(const [eid,rows]of Object.entries(session.entries)){
 const exercise=day.exercises.find(e=>e.id===eid);
 if(!exercise)fail('Referencia de ejercicio ausente.');
 if(rows.length>Number(exercise.sets))fail('Hay series pendientes por encima del objetivo. Revisa y conserva el borrador antes de cambiar el plan.');
 }
 }
 }
 if(own(map,K.draft)){
 const draft=JSON.parse(map[K.draft]);
 if(draft?.editing===true&&!(own(map,K.plans)&&JSON.parse(map[K.plans]).some(p=>p.id===draft.id)))fail('El borrador de edición apunta a un plan ausente. No se ha modificado ningún dato.');
 }

 return map;
}
function capture(){const raw={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith('almogavar-')||k?.startsWith('almogaver-'))raw[k]=localStorage.getItem(k)}return Object.fromEntries(Object.entries(raw).sort(([a],[b])=>a.localeCompare(b)))}
const signature=raw=>JSON.stringify(raw);
async function digest(raw){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(signature(raw))))).map(x=>x.toString(16).padStart(2,'0')).join('')}
function newId(existing=[]){
 const used=new Set(existing.map(x=>String(x.id)));
 for(let attempt=0;attempt<8;attempt++){const value=crypto.randomUUID();if(!used.has(value))return value}
 fail('No se ha podido generar un ID único. No se ha guardado ningún dato.');
}
const uid=()=>crypto.randomUUID(), request=r=>new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
function completion(tx){return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error||Error('Transacción abortada.'));tx.onerror=()=>{/* onabort is the final outcome */}})}
function transact(db,stores,callback){return new Promise((resolve,reject)=>{let error,result;const tx=db.transaction(stores,'readwrite',{durability:'strict'});tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(error||tx.error||Error('Transacción abortada.'));tx.onerror=()=>{};try{callback(tx,v=>{result=v},e=>{error=e;tx.abort()})}catch(e){error=e;tx.abort()}})}
// A generation references immutable module records. Unchanged modules are shared;
// typing a note never duplicates the entire training history on disk.
function validateContext(value){requireObj(value,'Contexto');jsonSafe(value);if(own(value,'initialOpenStart')&&(typeof value.initialOpenStart!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value.initialOpenStart)))fail('Fecha inicial de ciclo incompatible.');if(own(value,'initialOpenStart'))dateField(value.initialOpenStart,'Fecha inicial de ciclo',false);return value}
async function readGeneration(tx,id){
 const meta=await request(tx.objectStore('generations').get(id));if(!meta)throw Error('Generación de recuperación inexistente.');
 if(!meta.owners){const rows=await request(tx.objectStore('records').getAll(IDBKeyRange.bound([id,''],[id,'\uffff'])));return{map:Object.fromEntries(rows.map(r=>[r.key,r.value])),owners:Object.fromEntries(rows.map(r=>[r.key,id])),context:meta.context||{}}}
 const entries=await Promise.all(Object.entries(meta.owners).map(async([key,owner])=>{const row=await request(tx.objectStore('records').get([owner,key]));if(!row)throw Error('Referencia de persistencia incompleta: '+key);return[key,row.value]}));
 return{map:Object.fromEntries(entries),owners:meta.owners,context:meta.context||{}};
}
// HIST-LS-01: explicit, evidence-bound absence recovery. No writes to localStorage.
const stable=v=>Array.isArray(v)?v.map(stable):obj(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
const equal=(a,b)=>signature(stable(a))===signature(stable(b));
const hasReceipt=c=>own(c,'legacyAbsenceReceipt');
const matchesLegacy=(raw,c)=>hasReceipt(c)?Object.keys(raw).length===0:signature(raw)===c.legacySignature;
const legacyConflicts=(rows,originalSignature)=>rows.filter(x=>!obj(x.raw)||(Object.keys(x.raw).length&&signature(x.raw)!==originalSignature));
const legacyRevocations=(rows,receipt)=>rows.filter(x=>x.legacyReceipt===receipt&&x.reason==='legacy-reappeared-after-recovery');
const validControl=c=>{if(!obj(c)||c.id!=='active'||typeof c.generation!=='string'||!c.generation||!Number.isSafeInteger(c.revision)||c.revision<0||typeof c.legacySignature!=='string'||typeof c.legacySnapshot!=='string')fail('Control de persistencia incompleto.');};
async function legacyProof(db){
 const tx=db.transaction(['control','records','generations','legacySnapshots']),done=completion(tx),bindings=[];
 const get=async(store,key)=>{const value=await request(tx.objectStore(store).get(key));bindings.push({kind:'get',store,key,value:value===undefined?null:value,exists:value!==undefined});return value};
 let proof;
 try{
  const control=await get('control','active');validControl(control);
  const original=await get('legacySnapshots',control.legacySnapshot);
  if(!obj(original)||original.invalid||!obj(original.raw)||typeof original.sha256!=='string'||original.signature!==control.legacySignature||signature(original.raw)!==control.legacySignature||!Object.keys(original.raw).length)fail('La captura original no es verificable.');
  const snapshots=await request(tx.objectStore('legacySnapshots').getAll()),conflicts=legacyConflicts(snapshots,control.legacySignature);bindings.push({kind:'conflicts',store:'legacySnapshots',originalSignature:control.legacySignature,value:conflicts});if(conflicts.length)fail('Hay capturas heredadas distintas o incompatibles conservadas. Exporte ambas copias: la ausencia actual no permite reconciliarlas automáticamente.');
  const chain=[],seen=new Set(),latest={};let id=control.generation;
  while(id!==null){
   if(seen.has(id)||seen.size>=10000)fail('Cadena de generaciones cíclica o demasiado extensa para verificar esta recuperación.');seen.add(id);
   const meta=await get('generations',id);
   if(!obj(meta)||meta.id!==id||!obj(meta.owners)||!Number.isSafeInteger(meta.revision)||meta.revision<0||!(meta.parent===null||typeof meta.parent==='string'))fail('Metadatos de generación incompletos.');
   for(const[k,v]of Object.entries(meta.owners))if(!KEYS.includes(k)||typeof v!=='string'||!v)fail('Owners de generación incompatibles.');
   const keys=await request(tx.objectStore('records').getAllKeys(IDBKeyRange.bound([id,''],[id,'\uffff'])));bindings.push({kind:'keys',store:'records',prefix:id,value:keys});
   for(const key of keys){if(!Array.isArray(key)||key[0]!==id||!KEYS.includes(key[1]))fail('Registro fuera del modelo.');if(!own(latest,key[1]))latest[key[1]]=id;}
   chain.push(meta);id=meta.parent;
  }
  if(chain[0].revision!==control.revision||chain.at(-1).reason!=='migration'||chain.at(-1).revision!==0)fail('Identidad o revisión de generación incoherente.');
  for(let i=0;i<chain.length-1;i++)if(chain[i].revision!==chain[i+1].revision+1)fail('Cadena de revisiones incompleta.');
  // Old cohorts have no independent presence witness. Never guess whether a missing owner was an intentional deletion.
  if(!equal(chain[0].owners,latest))fail('No puede demostrarse la completitud: faltan owners/módulos o apuntan a datos anteriores. Exporte las generaciones para revisar.');
  const root=chain.at(-1),initial={};for(const k of KEYS)if(own(original.raw,k))initial[k]=original.raw[k];
  for(const[to,from]of [[K.state,'almogavar-v4-state'],[K.history,'almogavar-v4-history'],[K.wods,'almogavar-v5-wods'],[K.skills,'almogavar-v5-skills'],[K.settings,'almogavar-v5-settings']])if(!own(initial,to)&&own(original.raw,from))initial[to]=original.raw[from];
  validateMap(initial);if(!equal(root.owners,Object.fromEntries(Object.keys(initial).map(k=>[k,root.id]))))fail('La raíz no coincide con la captura migrada.');
  for(const[k,value]of Object.entries(initial)){const row=await get('records',[root.id,k]);if(!row||row.generation!==root.id||row.key!==k||row.value!==value)fail('La raíz migrada está incompleta o modificada.');}
  const map={};for(const[k,owner]of Object.entries(chain[0].owners)){const row=await get('records',[owner,k]);if(!row||row.generation!==owner||row.key!==k||typeof row.value!=='string')fail('Registro activo incompleto.');map[k]=row.value;}
  validateMap(map);const context=validateContext(clone(chain[0].context||{}));
  proof={control,original,chain,map,context,bindings};
  await done;
 }catch(e){await done;throw e}
 if(await digest(proof.original.raw)!==proof.original.sha256)fail('SHA-256 de la captura original incorrecto.');
 proof.fingerprint=await digest(stable({control:proof.control,original:proof.original,chain:proof.chain,map:proof.map,context:proof.context,bindings:proof.bindings}));
 return proof;
}
async function resolutionEvidence(db,control){
 const tx=db.transaction(['control','records','generations','legacySnapshots']),done=completion(tx),bindings=[];
 const get=async(store,key)=>{const value=await request(tx.objectStore(store).get(key));bindings.push({kind:'get',store,key,value:value===undefined?null:value,exists:value!==undefined});return value};
 let receipt,original,revocations,sourceMap;
 try{
  const actual=await get('control','active');validControl(actual);if(actual.legacyAbsenceReceipt!==control.legacyAbsenceReceipt||actual.legacySnapshot!==control.legacySnapshot||actual.legacySignature!==control.legacySignature)fail('Cambió la decisión de recuperación; recarga antes de continuar.');
  if(typeof control.legacyAbsenceReceipt!=='string')fail('Recibo de recuperación incompatible.');
  receipt=await get('legacySnapshots',control.legacyAbsenceReceipt);original=await get('legacySnapshots',control.legacySnapshot);
  if(!obj(receipt)||receipt.reason!=='legacy-absence-consent'||!obj(receipt.raw)||Object.keys(receipt.raw).length||receipt.signature!=='{}'||!obj(receipt.decision)||typeof receipt.decisionSha256!=='string')fail('Recibo de recuperación ausente o incompatible.');
  const d=receipt.decision;
  if(!['download-requested','manual-json'].includes(d.backupMethod)||d.version!==1||d.consent!==true||d.backupRequested!==true||d.originalSnapshot!==control.legacySnapshot||!obj(original)||original.invalid||original.signature!==control.legacySignature||signature(original.raw)!==control.legacySignature||d.originalSha256!==original.sha256||typeof d.resultGeneration!=='string'||!Number.isSafeInteger(d.resultRevision))fail('El recibo no corresponde a la copia heredada original.');
  let id=actual.generation;const seen=new Set();let found=false;
  while(id!==null){if(seen.has(id)||seen.size>=10000)fail('No se puede verificar la cadena del recibo.');seen.add(id);const g=await get('generations',id);if(!g||g.id!==id)fail('Generación del recibo ausente.');if(id===d.resultGeneration){if(g.revision!==d.resultRevision||g.parent!==d.sourceGeneration||g.reason!=='legacy-absence-consent'||g.legacyReceipt!==receipt.id)fail('Generación de consentimiento incoherente.');found=true;break}id=g.parent;}
  if(!found)fail('El recibo no pertenece a esta generación.');
  const source=await get('generations',d.sourceGeneration);if(!source||!obj(source.owners)||source.revision!==d.sourceRevision||d.resultRevision!==d.sourceRevision+1)fail('Fuente del recibo incompleta.');sourceMap={};for(const[k,owner]of Object.entries(source.owners)){const row=await get('records',[owner,k]);if(!row||row.key!==k||row.generation!==owner)fail('Registro de la fuente del recibo incompleto.');sourceMap[k]=row.value}validateMap(sourceMap);
  revocations=await request(tx.objectStore('legacySnapshots').getAll());
  const revoked=legacyRevocations(revocations,receipt.id);bindings.push({kind:'revocations',store:'legacySnapshots',receipt:receipt.id,value:revoked});
  if(revoked.length)fail('El legado reapareció después de la recuperación. Revise y exporte ambas copias; no se fusionarán.');
  await done;
 }catch(e){await done;throw e}
 if(await digest(stable(sourceMap))!==receipt.decision.modulesSha256||await digest(original.raw)!==original.sha256||await digest(receipt.raw)!==receipt.sha256||await digest(stable(receipt.decision))!==receipt.decisionSha256)fail('Integridad del recibo o de la captura original no verificable.');
 return bindings;
}
function verifyBindings(tx,bindings,success,abort){
 let pending=bindings.length;if(!pending)return success();
 for(const b of bindings){const store=tx.objectStore(b.store),r=b.kind==='keys'?store.getAllKeys(IDBKeyRange.bound([b.prefix,''],[b.prefix,'\uffff'])):['conflicts','revocations'].includes(b.kind)?store.getAll():store.get(b.key);r.onsuccess=()=>{try{const actual=b.kind==='conflicts'?legacyConflicts(r.result,b.originalSignature):b.kind==='revocations'?legacyRevocations(r.result,b.receipt):r.result;if(['keys','conflicts','revocations'].includes(b.kind)?!equal(actual,b.value):((actual!==undefined)!==b.exists||!equal(actual===undefined?null:actual,b.value)))fail('La copia cambió durante la comprobación. No se activó la recuperación.');if(--pending===0)success()}catch(e){abort(e)}}}
}

class Repository{
 constructor(){this.db=null;this.map={};this.owners={};this.context={};this.control=null;this.tail=Promise.resolve();this.blocked=null;this.dirtyLegacy=false;this.restoreEpoch=0}
 async open(){
 const opening=indexedDB.open(DB,VERSION);opening.onupgradeneeded=()=>{const db=opening.result;db.createObjectStore('records',{keyPath:['generation','key']});db.createObjectStore('control',{keyPath:'id'});db.createObjectStore('generations',{keyPath:'id'});db.createObjectStore('legacySnapshots',{keyPath:'id'})};
 this.db=await request(opening);this.db.onversionchange=()=>{this.db.close();this.blocked='La base ha cambiado. Cierra y vuelve a abrir la aplicación.'};
 const tx=this.db.transaction('control');const done=completion(tx);const active=await request(tx.objectStore('control').get('active'));await done;
 if(!active){const countsTx=this.db.transaction(['records','generations','legacySnapshots']),countsDone=completion(countsTx),counts=await Promise.all(['records','generations','legacySnapshots'].map(n=>request(countsTx.objectStore(n).count())));await countsDone;if(counts.some(n=>n>0))throw Error('Control activo ausente con datos o capturas conservados. Use recovery.html; no se iniciará una copia vacía.');await this.migrate()}else await this.refresh();
 window.addEventListener('storage',e=>{if(e.key===null||e.key?.startsWith('almogavar-')||e.key?.startsWith('almogaver-')){this.legacyEventEpoch=(this.legacyEventEpoch||0)+1;this.dirtyLegacy=true;this.checkLegacy().catch(e=>this.notify(e))}});await this.checkLegacy();
 return this;
 }
 notify(e){window.dispatchEvent(new CustomEvent('almogaver-storage-error',{detail:e.message}));}
 async migrate(){
 const raw=capture(),hash=await digest(raw),map={};for(const k of KEYS)if(own(raw,k))map[k]=raw[k];
 for(const [to,from]of [[K.state,'almogavar-v4-state'],[K.history,'almogavar-v4-history'],[K.wods,'almogavar-v5-wods'],[K.skills,'almogavar-v5-skills'],[K.settings,'almogavar-v5-settings']])if(!own(map,to)&&own(raw,from))map[to]=raw[from];
 // Invalid legacy data is captured but not activated. No "fallback to empty" migration.
 let invalid=null;try{validateMap(map)}catch(e){invalid=e}
 const sid=uid(),gen=uid(),stamp=new Date().toISOString(),context={initialOpenStart:new Date().toLocaleDateString('sv-SE')};
 await transact(this.db,['control','records','generations','legacySnapshots'],(tx,set,abort)=>{
 const c=tx.objectStore('control'),r=c.get('active');r.onsuccess=()=>{try{
 if(r.result){set(false);return}
 if(signature(capture())!==signature(raw))throw Error('localStorage cambió durante la migración. No se ha activado ningún dato.');
 tx.objectStore('legacySnapshots').put({id:sid,raw,sha256:hash,capturedAt:stamp,signature:signature(raw),invalid:invalid?.message||null});
 if(invalid){set(false);return}
 for(const [key,value]of Object.entries(map))tx.objectStore('records').put({generation:gen,key,value});
 tx.objectStore('generations').put({id:gen,parent:null,reason:'migration',createdAt:stamp,revision:0,owners:Object.fromEntries(Object.keys(map).map(k=>[k,gen])),context});
 c.put({id:'active',generation:gen,revision:0,legacySignature:signature(raw),legacySnapshot:sid,lastOperation:'migration',initialOpenStart:context.initialOpenStart});set(true);
 }catch(e){abort(e)}};
 });
 if(invalid)throw Error('Datos heredados no compatibles; captura conservada. Recupera el original con recovery.html. '+invalid.message);
 await this.refresh();
 }
 async refresh(){
 const tx=this.db.transaction(['control','records','generations']),done=completion(tx);const c=await request(tx.objectStore('control').get('active'));if(!c){await done;throw Error('No existe generación activa; usa recovery.html.')}
 const data=await readGeneration(tx,c.generation);await done;validateMap(data.map);this.control=c;this.map=data.map;this.owners=data.owners;this.context=data.context;return this;
 }
 async checkLegacy(){
 if(!this.control)return;const raw=capture();let invalid=null;
 if(hasReceipt(this.control)){try{this.legacyBindings=await resolutionEvidence(this.db,this.control)}catch(e){invalid=e}}
 if(!matchesLegacy(raw,this.control)||invalid||(hasReceipt(this.control)&&this.dirtyLegacy)){
 this.blocked=invalid?.message||'Se detectaron cambios en localStorage heredado. Cierra la versión 7.1.1 y revisa ambas copias en recovery.html; no se fusionarán automáticamente.';
 const snapshot={id:uid(),raw,sha256:await digest(raw),signature:signature(raw),capturedAt:new Date().toISOString(),reason:hasReceipt(this.control)?'legacy-reappeared-after-recovery':'legacy-divergence',...(hasReceipt(this.control)?{legacyReceipt:this.control.legacyAbsenceReceipt}:{})};
 const key=snapshot.reason+'|'+snapshot.signature;
 if(this.lastDivergence!==key){await transact(this.db,['legacySnapshots'],tx=>tx.objectStore('legacySnapshots').add(snapshot));this.lastDivergence=key}
 throw Error(this.blocked)}this.dirtyLegacy=false;
 }
 async inspectLegacyAbsence(){
 await this.idle();this.legacyRecoveryPrepared=null;const eventEpoch=this.legacyEventEpoch||0;
 try{
 if(Object.keys(capture()).length)fail('El legado contiene claves. No se acepta una diferencia parcial o un contenido distinto.');
 const proof=await legacyProof(this.db);if(hasReceipt(proof.control))fail('Ya existe una decisión de recuperación; cualquier divergencia posterior necesita revisión.');
 if(Object.keys(capture()).length||eventEpoch!==(this.legacyEventEpoch||0))fail('El legado cambió durante la inspección.');
 proof.eventEpoch=eventEpoch;this.legacyRecoveryPrepared=proof;
 return{eligible:true,version:1,fingerprint:proof.fingerprint,generation:proof.control.generation,revision:proof.control.revision,modules:Object.keys(proof.map).map(k=>LABELS[k]),backup:encode(proof.map,proof.context)};
 }catch(e){return{eligible:false,reason:e.message}}
 }
 acceptLegacyAbsence(plan,consent){
 const epoch=this.restoreEpoch;
 const result=this.tail.then(async()=>{
 if(!obj(plan)||plan.version!==1||!obj(consent)||consent.confirmed!==true||consent.backupRequested!==true||!this.legacyRecoveryPrepared||plan.fingerprint!==this.legacyRecoveryPrepared.fingerprint)fail('Prepare y exporte la copia; confirme explícitamente antes de continuar.');
 const eventEpoch=this.legacyRecoveryPrepared.eventEpoch,proof=await legacyProof(this.db);
 if(eventEpoch!==(this.legacyEventEpoch||0))fail('Otra ventana cambió el legado desde la inspección.');
 if(hasReceipt(proof.control)||epoch!==this.restoreEpoch||proof.fingerprint!==plan.fingerprint||Object.keys(capture()).length)fail('La copia o el legado cambiaron desde la inspección. No se ha confirmado la recuperación.');
 if(consent.backupMethod!==undefined&&!['download-requested','manual-json'].includes(consent.backupMethod))fail('Método de copia incompatible.');
 const rid=uid(),gen=uid(),stamp=new Date().toISOString(),decision={version:1,consent:true,backupRequested:true,backupMethod:consent.backupMethod||'download-requested',messageVersion:1,at:stamp,sourceGeneration:proof.control.generation,sourceRevision:proof.control.revision,resultGeneration:gen,resultRevision:proof.control.revision+1,originalSnapshot:proof.control.legacySnapshot,originalSha256:proof.original.sha256,inspectionSha256:proof.fingerprint,modulesSha256:await digest(stable(proof.map))};
 const receipt={id:rid,raw:{},signature:'{}',sha256:await digest({}),capturedAt:stamp,reason:'legacy-absence-consent',decision,decisionSha256:await digest(stable(decision))};
 const control={...proof.control,generation:gen,revision:decision.resultRevision,lastOperation:'legacy-absence-consent',legacyAbsenceReceipt:rid};
 await transact(this.db,['records','control','generations','legacySnapshots'],(tx,set,abort)=>verifyBindings(tx,proof.bindings,()=>{try{
 if(Object.keys(capture()).length||eventEpoch!==(this.legacyEventEpoch||0))fail('El legado reapareció antes de confirmar. Operación rechazada.');
 tx.objectStore('legacySnapshots').add(receipt);
 tx.objectStore('generations').add({id:gen,parent:proof.control.generation,reason:'legacy-absence-consent',createdAt:stamp,revision:control.revision,owners:clone(proof.chain[0].owners),context:clone(proof.context),legacyReceipt:rid});
 const activation=tx.objectStore('control').put(control);activation.onsuccess=()=>{const fence=tx.objectStore('control').get('active');fence.onsuccess=()=>{if(Object.keys(capture()).length||eventEpoch!==(this.legacyEventEpoch||0))abort(Error('El legado cambió antes de completar la transacción.'))}};set(control);
 }catch(e){abort(e)}},abort));
 // No state becomes operational before transaction.oncomplete. No module record is written.
 this.control=control;this.map=proof.map;this.owners=clone(proof.chain[0].owners);this.context=proof.context;this.restoreEpoch++;this.blocked=null;this.dirtyLegacy=eventEpoch!==(this.legacyEventEpoch||0);this.legacyRecoveryPrepared=null;
 await this.checkLegacy();return{generation:control.generation,revision:control.revision,receipt:rid};
 });this.tail=result.catch(e=>this.notify(e));return result;
 }

 get(k,f=null){return own(this.map,k)?clone(JSON.parse(this.map[k])):clone(f)}
 raw(k){return own(this.map,k)?this.map[k]:null}
 token(){return{generation:this.control.generation,revision:this.control.revision}}
 async idle(){await this.tail}
 commit(patch,reason='edit',options={}){
 // Capture the expected generation at invocation, not after queued work/another restore.
 const epoch=this.restoreEpoch, copy=typeof patch==='function'?patch:clone(patch);
 const result=this.tail.then(async()=>{
 if(this.blocked)throw Error(this.blocked);await this.checkLegacy();
 if(epoch!==this.restoreEpoch)throw Error('La generación cambió. Recarga antes de guardar.');
 const changes=typeof copy==='function'?clone(copy(this)):copy;
 const next={...this.map};for(const[k,v]of Object.entries(changes)){if(!KEYS.includes(k))fail('Módulo desconocido.');if(v===null)delete next[k];else next[k]=v}validateMap(next);
 const context=validateContext(clone(options.context||this.context)),owners={...this.owners};const expected=options.expected||this.token(), gen=uid(), op=uid(),stamp=new Date().toISOString();
 const control=await transact(this.db,['records','control','generations',...(hasReceipt(this.control)?['legacySnapshots']:[])],(tx,set,abort)=>{
 const store=tx.objectStore('control'),get=store.get('active');get.onsuccess=()=>{try{
 const actual=get.result;if(!actual||actual.generation!==expected.generation||actual.revision!==expected.revision)throw Error('Otra pestaña ha cambiado los datos. Recarga; no se sobrescribió su trabajo.');
 if(!matchesLegacy(capture(),actual))throw Error('localStorage heredado cambió antes de activar. Operación rechazada.');
 const write=()=>{try{
 // Proposal only: omit ordinary identical edit writes after authority/legacy/bindings checks.
 if(reason==='edit'&&!options.newGeneration&&Object.keys(next).length===Object.keys(this.map).length&&Object.keys(next).every(k=>own(this.map,k)&&next[k]===this.map[k])&&JSON.stringify(context)===JSON.stringify(this.context)){set(actual);return}
 const records=tx.objectStore('records');
 for(const key of options.newGeneration?KEYS:Object.keys(changes)){if(own(next,key)){records.put({generation:gen,key,value:next[key]});owners[key]=gen}else{records.delete([gen,key]);delete owners[key]}}

 const c={...actual,generation:gen,revision:actual.revision+1,lastOperation:op,...(context.initialOpenStart?{initialOpenStart:context.initialOpenStart}:{})};
 tx.objectStore('generations').put({id:gen,parent:actual.generation,reason,createdAt:stamp,revision:c.revision,owners,context});store.put(c);set(c);
 }catch(e){abort(e)}};
 if(hasReceipt(actual)){if(actual.legacyAbsenceReceipt!==this.control.legacyAbsenceReceipt)throw Error('Cambió la decisión de legado. Recarga antes de guardar.');verifyBindings(tx,this.legacyBindings||[],()=>{if(!matchesLegacy(capture(),actual))return abort(Error('El legado reapareció antes de guardar.'));write()},abort)}else write();
 }catch(e){abort(e)}};
 });
 // This runs only after IDBTransaction.oncomplete, never after an individual request.
 this.control=control;this.map=next;this.owners=owners;this.context=context;if(options.newGeneration)this.restoreEpoch++;return control;
 });this.tail=result.catch(e=>{this.notify(e)});return result;
 }
 set(k,v){return this.commit({[k]:JSON.stringify(v)})}
 remove(k){return this.commit({[k]:null})}
 async export(){await this.idle();const reader=new Repository();reader.db=this.db;await reader.refresh();return encode(reader.map,reader.context)}
 prepare(payload){return decode(payload,this.map)}
 restore(prepared){return this.commit(prepared.patch,'restore-v'+prepared.schemaVersion,{newGeneration:true,expected:prepared.expected,context:prepared.context})}
 async generations(){const tx=this.db.transaction('generations'),done=completion(tx),v=await request(tx.objectStore('generations').getAll());await done;return v}
 async generation(id){const tx=this.db.transaction(['records','generations']),done=completion(tx);try{const data=await readGeneration(tx,id);await done;return data.map}catch(e){await done;throw e}}

 async generationBackup(id){const tx=this.db.transaction(['records','generations']),done=completion(tx);try{const data=await readGeneration(tx,id);await done;return encode(data.map,data.context)}catch(e){await done;throw e}}
 async recover(id){
 await this.idle();
 // Validate the chosen immutable generation, not the incompatible active payload.
 // Recovery replaces the complete dataset; it must remain available after read validation fails.
 const backup=await this.generationBackup(id),prepared=decode(backup,{}),tx=this.db.transaction('control'),done=completion(tx),control=await request(tx.objectStore('control').get('active'));await done;
 if(!control)throw Error('No existe control activo para recuperar.');this.control=control;
 return this.commit(prepared.patch,'recovery',{newGeneration:true,context:prepared.context,expected:{generation:control.generation,revision:control.revision}});
 }


}
function encode(map,context={}){
 const out={app:'ALMOGAVAR',schemaVersion:2,version:'7.1.1-integrity-dev',exportedAt:new Date().toISOString(),presence:Object.fromEntries(KEYS.map(k=>[k,own(map,k)]))};
 for(const n of ['state','history','wods','skills','settings'])if(own(map,K[n]))out[n]=JSON.parse(map[K[n]]);
 if(['plans','sessions','draft'].some(n=>own(map,K[n]))){out.plansV7={};for(const[n,v]of [['plans','plans'],['sessions','sessions'],['draft','draft']])if(own(map,K[n]))out.plansV7[v]=JSON.parse(map[K[n]])}
 if(['weeks','weekDraft'].some(n=>own(map,K[n]))){out.weeksV71={};for(const[n,v]of [['weeks','weeks'],['weekDraft','draft']])if(own(map,K[n]))out.weeksV71[v]=JSON.parse(map[K[n]])}
 out.context=clone(context);out.pendingTexts={};if(own(map,K.text))out.pendingTexts.routine=JSON.parse(map[K.text]);if(own(map,K.weekText))out.pendingTexts.week=JSON.parse(map[K.weekText]);return out;
}
function decode(p,current){
 jsonSafe(p);requireObj(p,'Backup');if(p.app!=='ALMOGAVAR'||![1,2].includes(p.schemaVersion))fail('Formato/schemaVersion de backup incompatible.');
 const patch={},put=(k,v)=>{validate(k,v);patch[k]=JSON.stringify(v)};
 for(const n of ['state','history','wods','skills','settings'])if(own(p,n))put(K[n],p[n]);
 for(const[name,items]of [['plansV7',[['plans','plans'],['sessions','sessions'],['draft','draft']]],['weeksV71',[['weeks','weeks'],['weekDraft','draft']]]])if(own(p,name)){
 requireObj(p[name],name);for(const[n,v]of items)if(own(p[name],v))put(K[n],p[name][v]);
 }
 if(own(p,'pendingTexts')){requireObj(p.pendingTexts,'Textos pendientes');for(const[n,v]of [['text','routine'],['weekText','week']])if(own(p.pendingTexts,v))put(K[n],p.pendingTexts[v])}
 if(p.schemaVersion===2){requireObj(p.presence,'Presencia de módulos');for(const k of KEYS){if(typeof p.presence[k]!=='boolean')fail('Presencia incompleta.');if(p.presence[k]!==own(patch,k))fail('Presencia y contenido contradictorios.');if(!p.presence[k])patch[k]=null}}
 if(!Object.keys(patch).length)fail('Backup sin módulos reconocidos.');
 const next={...current};for(const[k,v]of Object.entries(patch)){if(v===null)delete next[k];else next[k]=v}validateMap(next);
 return{schemaVersion:p.schemaVersion,context:own(p,'context')?clone(validateContext(p.context)):undefined,patch,replace:Object.keys(patch).filter(k=>patch[k]!==null),remove:Object.keys(patch).filter(k=>patch[k]===null),retain:KEYS.filter(k=>!own(patch,k)),expected:root.AlmogaverStorage?.token()};
}
root.AlmogaverPersistence={Repository,K,KEYS,DB,LABELS,validate,validateMap,encode,decode,digest,newId};
})(globalThis);

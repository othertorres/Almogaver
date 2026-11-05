/* ALMOGÀVER import model. Deterministic extraction; missing values stay empty. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AlmogaverImport=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const uid=()=>globalThis.crypto?.randomUUID?.()||`a-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const clean=v=>String(v??'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').trim();
// Remove detached OCR marks before a letter; preserve numeric signs and internal notation.
const normalizeLine=v=>clean(v).replace(/^(?:[=:|•●▪*–—-]\s+)+(?=\p{L})/u,'').replace(/^[•●▪*\-](?=\p{L})/u,'');
const key=v=>clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ');
const safeId=v=>/^(?:[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}|a-\d+-[a-z\d]+)$/i.test(String(v))?String(v):uid();
const exercise=(name='')=>({id:uid(),name,sets:null,reps:'',rest:'',notes:'',source:'',warnings:[]});
const day=(name='Día 1')=>({id:uid(),name,exercises:[]});
const blank=()=>({id:uid(),schemaVersion:1,name:'Mi rutina',sourceType:'manual',createdAt:new Date().toISOString(),days:[day()],warnings:[],unparsed:[]});
const sequence=e=>/^\d+(?:\s*[-–]\s*\d+){2,}$/.test(clean(e.reps))?clean(e.reps).split(/\s*[-–]\s*/):null;
const targetForSet=(e,i)=>{const seq=sequence(e);return seq&&seq.length===Number(e.sets)?seq[i]:clean(e.reps)};
const columns=line=>/[|\t]/.test(line)?line.trim().replace(/^\||\|$/g,'').split(/\s*[|\t]\s*/):line.trim().split(/\s{2,}/);
const headerKey=v=>{const s=key(v);return /^(ejercicio|exercise|nombre|nombre del ejercicio)$/.test(s)?'name':/^(series?|sets?)$/.test(s)?'sets':/^(reps?|repeticiones|duracion)$/.test(s)?'reps':/^(descanso|rest|pausa)$/.test(s)?'rest':/^(kg|peso|carga|load|weight|lbs?)$/.test(s)?'load':'extra'};
function parse(text){
 text=clean(text);if(text.length>100000)throw Error('El texto supera los 100.000 caracteres. Divide la rutina.');
 const plan=blank();plan.days=[];plan.sourceType='text';plan.name='Rutina importada';let current=null,previous=null,table=false,headers=null;
 const ensure=()=>{if(!current){current=day('Sin día indicado');plan.days.push(current);plan.warnings.push('No se ha indicado el día de algunos ejercicios. Revisa su distribución.')}return current};
 const rawLines=text.split(/\r?\n/).flatMap(l=>l.split(/;\s*(?=[A-Za-zÁÉÍÓÚÑáéíóúñ])|[.,]\s+(?=[A-Za-zÁÉÍÓÚÑáéíóúñ][^.,;\n]*?\b\d{1,2}\s*[x×]\s*\d)/));
 const lines=[];let normalizedCount=0;for(const raw of rawLines){const source=clean(raw);let l=normalizeLine(source);if(l!==source)normalizedCount++;if(!l||/^[=:|•●▪*–—-]+$/.test(l))continue;const inline=l.match(/^((?:d[ií]a|day|sesi[oó]n)\s*[\dA-G]+[^:]{0,40}):\s*(.+)$/i);if(inline){lines.push({text:inline[1],source});lines.push({text:inline[2],source})}else lines.push({text:l,source})}
 if(normalizedCount)plan.warnings.push(`Se han limpiado marcadores aislados al principio de ${normalizedCount} líneas. Comprueba las líneas de origen; no se han modificado números ni porcentajes.`);
 for(const input of lines){
  const line=input.text;
  const heading=line.match(/^(?:(?:d[ií]a|day|sesi[oó]n)\s*([\dA-G]+)(?:(?:\s*[-–—:·]\s*|\s+)[^\d].*)?|(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)(?:\s*[-–—:·].*)?)\s*:??$/i);
  if(heading&&!/\d\s*[x×]\s*\d/i.test(line)){current=day(line.replace(/:$/,''));plan.days.push(current);previous=null;headers=null;table=false;continue}
  if(/^(ejercicio|exercise|nombre)\b/i.test(line)&&/series|sets/i.test(line)){table=true;let labels=columns(line);if(labels.length<2)labels=line.split(/\s+/);headers=labels.map(label=>({key:headerKey(label),label}));continue}
  if(/^(ejercicio|exercise|series|sets|reps|repeticiones)$/i.test(line)){plan.unparsed.push(line);continue}
  if(/^(?:rutina|programa|plan|semana)\b/i.test(line)&&!/\d\s*[x×]\s*\d/i.test(line)){if(plan.name==='Rutina importada')plan.name=line.slice(0,100);else plan.unparsed.push(line);continue}
  if(/^(?:notas?|descanso|rest|rpe|rir|tempo|superserie|biserie|triserie)\b/i.test(line)){
   if(previous){previous.notes=[previous.notes,line].filter(Boolean).join(' · ');const rest=line.match(/^(?:descanso|rest)\s*:?\s*(.+)$/i);if(rest)previous.rest=rest[1].slice(0,80)}else plan.unparsed.push(line);continue;
  }
  let name='',sets=null,reps='',rest='',notes='',matched=false;
  const combo=line.match(/\b(\d{1,2})\s*(?:[x×]|series?\s*(?:de|a))\s*(\d+(?:\s*(?:[-–]|a)\s*\d+)*(?:\s*(?:s|seg(?:undos)?|min(?:utos)?|m|metros|reps?|rep(?:eticiones)?)\b)?(?:\s*(?:por\s+pierna|por\s+lado|\/lado|\/pierna))?)/i);
  if(combo){name=line.slice(0,combo.index).replace(/[|:–—\-\s]+$/,'');sets=Number(combo[1]);reps=combo[2].trim();notes=line.slice(combo.index+combo[0].length).replace(/^[\s|,·:\-]+/,'');matched=true}
  if(!matched){const labelled=line.match(/^(.+?)\s+(\d{1,2})\s*(?:series?|sets?)\b(?:\s*[,|·:]?\s*(\d+(?:\s*[-–]\s*\d+)?)\s*(?:reps?|repeticiones)\b)?(.*)$/i);if(labelled){name=labelled[1];sets=Number(labelled[2]);reps=labelled[3]||'';notes=labelled[4].trim();matched=true}}
  if(!matched&&(table||/[|\t]/.test(line))){const cols=columns(line);if(cols.length>=3){if(headers){const values={};const extras=[];cols.forEach((v,i)=>{const head=headers[i];if(!head){if(v)extras.push(`Dato adicional: ${v}`);return}if(head.key==='extra'){if(v)extras.push(`${head.label}: ${v}`)}else if(head.key==='load'){if(v)extras.push(`Carga indicada (${head.label}): ${v}`)}else values[head.key]=v});if(values.name&&/^\d{1,2}$/.test(values.sets||'')&&values.reps){name=values.name;sets=Number(values.sets);reps=values.reps;rest=values.rest||'';notes=extras.join(' · ');matched=true}}else if(/^\d{1,2}$/.test(cols[1])&&cols[2].length<=80&&cols[2].trim()){[name,,reps]=cols;sets=Number(cols[1]);notes=cols.slice(3).filter(Boolean).map(v=>`Dato adicional: ${v}`).join(' · ');matched=true}}}
  if(!matched&&table){const row=line.match(/^(.+?)\s+(\d{1,2})\s+(\d+(?:[-–]\d+)*)(?:\s+(.+))?$/);if(row){name=row[1];sets=Number(row[2]);reps=row[3];notes=row[4]?`Dato adicional: ${row[4]}`:'';matched=true}}
  if(!matched){if(line.length<3||!/[a-záéíóúñ]/i.test(line)||line.length>110||/^(?:https?:|@|p[aá]gina|objetivo|entrenador|fecha|calentamiento\s*:|enviado|reenvia)/i.test(line)){plan.unparsed.push(line);continue}name=line;}
  name=clean(name).replace(/^\d+[.)]\s*/,'');if(!name){plan.unparsed.push(line);continue}
  const ex=exercise(name);ex.sets=sets;ex.reps=reps;ex.rest=clean(rest);ex.notes=clean(notes);ex.source=input.source;
  const restMatch=ex.notes.match(/(?:descanso|rest)\s*:?\s*([\d]+(?:[.,]\d+)?\s*(?:s|seg(?:undos)?|min(?:utos)?|["'’′″])?)/i);if(restMatch)ex.rest=restMatch[1].trim();
  if(!sets)ex.warnings.push('Faltan las series.');if(!reps)ex.warnings.push('Faltan las repeticiones o duración.');if(sets>30)ex.warnings.push('Número de series inusual.');if(sequence(ex))ex.warnings.push(`Repeticiones por serie: ${sequence(ex).join(' → ')}. Revisa que coincidan con las ${sets} series.`);if(/^[A-Z]\d\b/.test(name)||/superserie|biserie|dropset|descendente|amrap|fallo/i.test(line))ex.warnings.push('Bloque o serie especial: comprueba la estructura.');
  ensure().exercises.push(ex);previous=ex;
 }
 if(!plan.days.length)plan.days=[day('Sin día indicado')];if(!plan.days.some(d=>d.exercises.length))plan.warnings.push('No se han detectado ejercicios. Puedes añadirlos manualmente o corregir el texto.');
 if(plan.unparsed.length)plan.warnings.push(`${plan.unparsed.length} líneas no se han convertido. Consúltalas antes de guardar.`);
 return plan;
}
function validate(plan){
 const errors=[];if(!plan||typeof plan!=='object')return['Plan no válido.'];if(!clean(plan.name))errors.push('Pon un nombre al plan.');
 if(!Array.isArray(plan.days)||!plan.days.length||plan.days.length>14)return[...errors,'El plan debe tener entre 1 y 14 días.'];let total=0;
 plan.days.forEach((d,i)=>{if(!clean(d.name))errors.push(`Pon nombre al día ${i+1}.`);if(!Array.isArray(d.exercises)||!d.exercises.length){errors.push(`${d.name||'Día '+(i+1)}: añade un ejercicio o elimina el día.`);return}total+=d.exercises.length;d.exercises.forEach((e,j)=>{const p=`${d.name} · ejercicio ${j+1}`;if(!clean(e.name))errors.push(`${p}: falta el nombre.`);if(!Number.isInteger(Number(e.sets))||Number(e.sets)<1||Number(e.sets)>30)errors.push(`${p}: indica entre 1 y 30 series.`);if(!clean(e.reps))errors.push(`${p}: faltan las repeticiones o duración.`);const seq=sequence(e);if(seq&&seq.length!==Number(e.sets))errors.push(`${p}: la secuencia tiene ${seq.length} objetivos para ${e.sets} series. Corrígela antes de guardar.`)})});if(total>300)errors.push('El plan supera los 300 ejercicios.');return errors;
}
function sanitize(p){
 const errors=validate(p);if(errors.length)throw Error(errors[0]);
 const out=JSON.parse(JSON.stringify(p));
 // IDs, dates, source text and extension fields belong to the user; keep them verbatim.
 if(globalThis.AlmogaverPersistence)AlmogaverPersistence.validate('almogavar-plans-v1',[out]);
 return out;
}

function records(dayPlan,entries){for(const e of dayPlan.exercises)if(Array.isArray(entries[e.id])&&entries[e.id].length>Number(e.sets))throw Error('Hay series pendientes por encima del objetivo actual. Revisa el borrador antes de guardar; no se ha recortado.');return dayPlan.exercises.map(e=>{const sets=(Array.isArray(entries[e.id])?entries[e.id]:[]).slice(0,e.sets).filter(s=>s?.done).map(s=>({load:s.load===''||s.load==null?null:Number(String(s.load).replace(',','.')),reps:String(s.reps??'')}));if(!sets.length)return null;for(const s of sets){if(s.load!==null&&(!Number.isFinite(s.load)||s.load<0||s.load>2000))throw Error(`${e.name}: carga no válida.`);if(!s.reps.trim())throw Error(`${e.name}: indica las repeticiones o duración de cada serie completada.`);if(!/^\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+)?(?:\s*(?:s|seg(?:undos)?|min(?:utos)?|m|metros|km|reps?|repeticiones))?(?:\s*(?:por\s+(?:pierna|lado)|\/(?:lado|pierna)))?$/i.test(s.reps.trim()))throw Error(`${e.name}: usa un resultado como 10, 30 s o 1 min.`)}const weighted=sets.filter(s=>s.load!==null),best=weighted.slice().sort((a,b)=>b.load-a.load)[0],reps=best&&/^\d+$/.test(best.reps.trim())?Number(best.reps):null;return{name:e.name,exerciseId:e.id,exerciseKey:key(e.name),load:best?.load??null,loadLabel:'Carga',loadUnit:'kg',loadKind:'carga',series:`${sets.length} × ${e.reps}`,reps,rpe:'',sets,estimated1RM:best?.load&&reps&&reps<=15?Math.round(best.load*(1+reps/30)*10)/10:null}}).filter(Boolean)}
return{uid,clean,key,exercise,day,blank,parse,validate,sanitize,records,sequence,targetForSet,normalizeLine};
});

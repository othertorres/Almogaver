(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./importer-core.js'):root.AlmogaverImport);if(typeof module==='object'&&module.exports)module.exports=api;else root.AlmogaverWeek=api})(globalThis,function(A){
'use strict';const types=['Fuerza','Técnica','Circuito','For Time','AMRAP','EMOM','Intervals','Otro'];
const block=(title='Bloque',type='Otro',body='')=>({id:A.uid(),title,type,body,timeCap:''});
const day=name=>({id:A.uid(),name,blocks:[]});
const blank=()=>({id:A.uid(),schemaVersion:1,name:'Mi semana',weekStart:'',createdAt:new Date().toISOString(),days:[day('Lunes')],warnings:[],sourceText:''});
function parse(text){text=A.clean(text);if(text.length>100000)throw Error('La programación supera los 100.000 caracteres.');const week=blank();week.name='Programación semanal';week.days=[];week.sourceText=text;let current=null,active=null;
 const ensure=()=>{if(!current){current=day('Sin día indicado');week.days.push(current);week.warnings.push('Hay bloques sin día identificado. Revisa su distribución.')}return current};
 for(const raw of text.split(/\r?\n/)){const line=raw.trim();if(!line){if(active&&!active.body.endsWith('\n'))active.body+='\n';continue}const key=A.key(line).replace(/[:.]$/,'');
  if(/^(lunes|martes|miercoles|jueves|viernes|sabado|domingo)(?:\s*[-–—:]\s*.*)?$/.test(key)||/^(dia|day)\s*[\dA-G]+(?:\s*[-–—:]\s*.*)?$/i.test(key)){current=day(line.replace(/:$/,''));week.days.push(current);active=null;continue}
  if(!current&&/^(semana|programaci[oó]n|wods? de la semana)\b/i.test(line)){week.name=line;continue}
  let type=null;if(/^metcon\b/i.test(line))type='Circuito';else if(/^for\s*time\b|^por\s*tiempo\b/i.test(line))type='For Time';else if(/^amrap\b/i.test(line))type='AMRAP';else if(/^emom\b/i.test(line))type='EMOM';else if(/^cada\s+\d+|^every\s+\d+|^interval/i.test(line))type='Intervals';else if(/^warm[ -]?up|^calentamiento|^skill\b|^t[eé]cnica\b/i.test(line))type='Técnica';else if(/^fuerza\b|^strength\b/i.test(line))type='Fuerza';else if(/^\d+\s*(rondas?|rounds?)\b/i.test(line)&&(!active||active.type==='Fuerza'||active.type==='Técnica'))type='Circuito';
  if(type){active=block(line.replace(/:$/,''),type,'');ensure().blocks.push(active);if(/\d/.test(line)||/^for time/i.test(line))active.body=line;continue}
  if(!active){active=block(line.length<100?line:'Fuerza / técnica','Fuerza','');ensure().blocks.push(active)}active.body+=(active.body&&!active.body.endsWith('\n')?'\n':'')+line;
  const cap=line.match(/^t[ce]\s*:?\s*(\d+(?:[.,]\d+)?)\s*['’′"″]?\s*$/i);if(cap){active.timeCap=cap[1].replace(',','.')+' min';if(/^te/i.test(line))week.warnings.push(`${current.name}: se ha interpretado «${line}» como time cap. Compruébalo con el original.`)}
 }
 week.days.forEach(d=>d.blocks.forEach(b=>b.body=b.body.trim()));if(!week.days.length)week.days=[day('Sin día indicado')];week.warnings.push('Se conserva la programación por bloques. Comprueba los porcentajes, las cargas Rx, los intervalos y los tiempos límite antes de confirmar.');return week;
}
function validate(p){const errors=[];if(!p||!A.clean(p.name))errors.push('Pon un nombre a la semana.');if(!p||!Array.isArray(p.days)||!p.days.length||p.days.length>14)return[...errors,'La semana debe tener entre 1 y 14 días.'];if(p.weekStart&&!/^\d{4}-\d{2}-\d{2}$/.test(p.weekStart))errors.push('Fecha de inicio no válida.');let count=0;p.days.forEach((d,i)=>{if(!A.clean(d.name))errors.push(`Pon nombre al día ${i+1}.`);if(!Array.isArray(d.blocks)||!d.blocks.length)errors.push(`${d.name}: añade un bloque o elimina el día.`);else d.blocks.forEach((b,j)=>{count++;if(!A.clean(b.title)||!A.clean(b.body))errors.push(`${d.name} · bloque ${j+1}: completa título y contenido.`);if(!types.includes(b.type))errors.push(`${d.name}: tipo de bloque no válido.`)})});if(count>100)errors.push('Máximo 100 bloques por semana.');return errors}
function sanitize(p){const errors=validate(p);if(errors.length)throw Error(errors[0]);const out=JSON.parse(JSON.stringify(p));if(globalThis.AlmogaverPersistence)AlmogaverPersistence.validate('almogavar-wod-weeks-v1',[out]);return out}

return{types,block,day,blank,parse,validate,sanitize};
});

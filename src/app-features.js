
const WODS_V5="almogavar-wods", SKILLS_V5="almogavar-skills", SETTINGS_V5="almogavar-settings";

const DEFAULT_SKILLS_V5=[
{id:"kipping",name:"Kipping Pull-Up",level:1,notes:""},{id:"butterfly",name:"Butterfly Pull-Up",level:0,notes:""},{id:"doubleunders",name:"Double Unders",level:0,notes:""},{id:"ohs",name:"Overhead Squat",level:1,notes:""},{id:"handstand",name:"Handstand",level:0,notes:""},{id:"t2b",name:"Toes-to-Bar",level:0,notes:""},{id:"clean",name:"Clean",level:1,notes:""},{id:"snatch",name:"Snatch",level:0,notes:""}];
const safeJSONV5=(k,f)=>AlmogaverStorage.get(k,f);
const numV5=v=>{const raw=String(v??"" ).trim();if(!/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(raw))return null;const n=Number(raw.replace(",","."));return Number.isFinite(n)?n:null};
const rpeV52=v=>{const nums=String(v??"").replace(/,/g,".").match(/\d+(?:\.\d+)?/g);if(!nums?.length)return null;const a=nums.map(Number).filter(Number.isFinite);return a.length?Math.max(0,Math.min(10,a.reduce((s,n)=>s+n,0)/a.length)):null};
const todayV5=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
const parseDateV52=v=>{if(/^\d{4}-\d{2}-\d{2}$/.test(String(v||""))){const [y,m,d]=String(v).split("-").map(Number);return new Date(y,m-1,d,12,0,0)}return new Date(v)};
const fullDateV5=v=>{const d=parseDateV52(v);return Number.isNaN(d.getTime())?"":d.toLocaleDateString("es-ES",{day:"2-digit",month:"short",year:"numeric"})};
const shortDateV5=v=>{const d=parseDateV52(v);return Number.isNaN(d.getTime())?"":d.toLocaleDateString("es-ES",{day:"2-digit",month:"short"})};
function showToastV5(title,msg){const t=document.querySelector('#toast-v5');if(!t)return;t.replaceChildren(domNode('b',null,title),domNode('p',null,msg));t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3800)}
// A whole positive repetition count is required. Ranges/durations remain original text.
function repsV5(value){const m=String(value??'').match(/^\s*\d+\s*[×x]\s*([1-9]\d*)\s*(?:(?:reps?|repeticiones)|por\s+(?:pierna|lado))?\s*$/i);return m?Number(m[1]):null}
function loadInfoV5(record){
 const raw=String(record.loadUnit??record.loadLabel??'').trim().toLowerCase().replace(/\s+/g,' ');
 const units={'kg':'kg','kg/mano':'kg/mano','kg por mano':'kg/mano','kg total':'kg total','lb':'lb','lbs':'lb','lb/mano':'lb/mano','lb total':'lb total'};
 const kind=record.loadKind??(/lastre/i.test(record.loadLabel||'')?'lastre':'carga'),unit=['carga','lastre'].includes(kind)&&Object.hasOwn(units,raw)?units[raw]:null;
 return{unit,kind,label:unit?(unit+(kind==='lastre'?' de lastre':'')):'unidad no indicada',key:JSON.stringify([record.name,kind,unit||('sin unidad: '+raw)])};
}
function sameLoadContextV5(a,b){const x=loadInfoV5(a),y=loadInfoV5(b);return !!x.unit&&!!y.unit&&x.unit===y.unit&&x.kind===y.kind}
function recordE1RMV5(record){
 const integer=value=>/^[1-9]\d*$/.test(String(value??'').trim())?Number(value):null;
 let reps=null;
 if(Array.isArray(record.sets)&&record.sets.length){
 const candidates=record.sets.filter(s=>Number(s.load)===record.load);
 if(!candidates.length||candidates.some(s=>integer(s.reps)===null))return null;
 reps=Math.max(...candidates.map(s=>integer(s.reps)));
 }else{
 if(record.series){reps=repsV5(record.series);if(reps===null)return null}
 if(record.reps!=null){const explicit=integer(record.reps);if(explicit===null)return null;if(reps!==null&&reps!==explicit)return null;reps=explicit}
 }
 if(reps!==null)return reps<=15&&record.load>0?Math.round(record.load*(1+reps/30)*10)/10:null;
 return Number.isFinite(record.estimated1RM)&&record.estimated1RM>0?record.estimated1RM:null;
}
function collectExerciseRecordsV5(){
 const panel=document.querySelector('#content .panel.active');if(!panel)return[];
 return [...panel.querySelectorAll('details.exercise')].filter(d=>d.querySelector('.check')?.checked).map(d=>{
 const name=d.querySelector('.ex b')?.textContent?.trim()||'Ejercicio',fields={};let metric=null;
 d.querySelectorAll('.metric').forEach(m=>{const label=m.querySelector('label')?.textContent?.trim()||'';fields[label]=m.querySelector('input')?.value||'';if(/carga|lastre/i.test(label))metric=m});
 if(metric&&metric.querySelector('input').value.trim()!==''&&numV5(metric.querySelector('input').value)===null)throw Error(`${name}: escribe una carga numérica en la unidad indicada; no se ha guardado ni borrado ningún dato.`);
 const loadLabel=metric?.querySelector('label')?.textContent?.trim()||null,load=metric?numV5(metric.querySelector('input').value):null,loadUnit=metric?.querySelector('input')?.placeholder||'',loadKind=/lastre/i.test(loadLabel||'')?'lastre':'carga',series=fields.Series||d.querySelector('.ex span')?.textContent||'',rpe=fields.RPE||'',reps=repsV5(series);
 return{name,load:Number.isFinite(load)?load:null,loadLabel,loadUnit,loadKind,series,rpe,reps,estimated1RM:load&&reps&&reps<=15?Math.round(load*(1+reps/30)*10)/10:null};
 });
}
function allRecordsV5(hist=getHistory()){const rows=[];hist.forEach(h=>(h.exercises||[]).forEach(e=>{if(Number.isFinite(e.load))rows.push({...e,estimated1RM:recordE1RMV5(e),date:h.date,session:h.title})}));return rows}
function comparableRecordsV5(hist=getHistory()){return allRecordsV5(hist).filter(r=>loadInfoV5(r).unit)}
function chartRecordsV5(selected){return comparableRecordsV5().filter(r=>loadInfoV5(r).key===selected).sort((a,b)=>parseDateV52(a.date)-parseDateV52(b.date))}
function detectPRsV5(records,history){const old=comparableRecordsV5(history),out=[];records.forEach(r=>{
 const info=loadInfoV5(r);if(!r.load||!info.unit)return;const same=old.filter(x=>loadInfoV5(x).key===info.key),max=same.reduce((m,x)=>Math.max(m,x.load||0),0),maxE=same.reduce((m,x)=>Math.max(m,x.estimated1RM||0),0),estimate=recordE1RMV5(r);
 if(r.load>max)out.push(`${r.name}: ${r.load} ${info.label}`);else if(estimate&&estimate>maxE+0.2)out.push(`${r.name}: e1RM ${estimate} ${info.label}`);
 });return out}
function latestRecordV5(name,context){const rows=comparableRecordsV5().filter(r=>r.name===name&&(!context||sameLoadContextV5(r,context)));if(new Set(rows.map(r=>loadInfoV5(r).key)).size!==1)return null;return rows.sort((a,b)=>new Date(b.date)-new Date(a.date))[0]||null}
function suggestedLoadV5(name,context){const r=latestRecordV5(name,context);if(!r||!r.load)return null;const rp=rpeV52(r.rpe);let step=/Back Squat|Romanian Deadlift/i.test(name)?5:/mancuernas|Bulgarian|Remo/i.test(name)?1:2.5,next=r.load;if(rp===null||rp<=7)next+=step;else if(rp<=8)next+=Math.min(step,2.5);else if(rp>=9.5)next=Math.max(0,next-Math.min(step,2.5));return{last:r.load,rpe:rp,next:Math.round(next*2)/2,unit:loadInfoV5(r).label}}
function decorateCurrentV5(){document.querySelectorAll('#content details.exercise').forEach(d=>{
 if(d.querySelector('.suggestion-v5'))return;const metric=[...d.querySelectorAll('.metric')].find(m=>/carga|lastre/i.test(m.querySelector('label').textContent));if(!metric)return;
 const name=d.querySelector('.ex b')?.textContent?.trim(),s=suggestedLoadV5(name,{name,loadUnit:metric.querySelector('input').placeholder,loadLabel:metric.querySelector('label').textContent});if(!s)return;
 const div=document.createElement('div');div.className='suggestion-v5';div.append(domNode('b',null,'Siguiente carga sugerida:'),document.createTextNode(` ${s.next} ${s.unit} · último ${s.last} ${s.unit}${s.rpe!==null?` a RPE ${s.rpe}`:''}`));d.querySelector('.body').append(div);
 })}
function settingsV5(){return safeJSONV5(SETTINGS_V5,{})} function saveSettingsV5(x){const prior=settingsV5(),changed=Object.fromEntries(Object.entries(x).filter(([k,v])=>JSON.stringify(v)!==JSON.stringify(prior[k])));return AlmogaverStorage.commit(repo=>({[SETTINGS_V5]:JSON.stringify({...repo.get(SETTINGS_V5,{}),...changed})}),'settings')}
function openInfoV5(){let st=settingsV5();if(!st.openStart){st.openStart=AlmogaverStorage.control.initialOpenStart||todayV5()}const start=parseDateV52(st.openStart),days=Math.floor((new Date()-start)/86400000),week=Math.max(1,Math.floor(days/7)+1),w=Math.min(8,week),phase=w<=2?"p12":w<=4?"p34":w<=6?"p56":"p78";return {start:st.openStart,week,w,phase,complete:week>8}}
function decorateOpenV5(){const panel=document.querySelector("#content .panel.active");if(!panel||!panel.dataset.name?.startsWith("Open Box")||panel.querySelector(".smart-open-v5"))return;const i=openInfoV5(),row=document.createElement("div");row.className="smart-open-v5";row.innerHTML=`<div><b>${i.complete?"Ciclo de 8 semanas completado":`Semana ${i.w} de 8`}</b><span>Fase actual: ${data.open.phases[i.phase].label} · inicio ${fullDateV5(i.start)}</span></div><button class="btn primary" style="min-height:38px;padding:0 12px;font-size:11px" type="button">Ir a actual</button>`;panel.querySelector(".title-row")?.after(row);row.querySelector("button").addEventListener("click",async()=>{currentPhase=i.phase;state.currentPhase=i.phase;saveState();renderCurrent()})}
decorateCurrentV5();decorateOpenV5();addClassToWodButtonV5();
const openCardV5=document.querySelector('.session-card[data-session="open"]');if(openCardV5)openCardV5.addEventListener("click",async()=>{const i=openInfoV5();currentPhase=i.phase;state.currentPhase=i.phase;saveState();renderCurrent()});
function addClassToWodButtonV5(){const box=document.querySelector("#content .class-editor .actions");if(!box||box.querySelector("#class-to-wod-v5"))return;const b=document.createElement("button");b.id="class-to-wod-v5";b.className="btn primary";b.type="button";b.textContent="Registrar resultado";box.insertBefore(b,box.querySelector("#clear-class"));b.addEventListener("click",async()=>{window.AlmogaverWeeks?.clearResultContext();document.querySelector("#wod-title").value=document.querySelector("#content [data-class='class-label']")?.value||state["class-label"]||"Clase CrossFit";document.querySelector("#wod-workout").value=document.querySelector("#content [data-class='class-wod']")?.value||state["class-wod"]||"";switchScreenV5("wods-screen")})}
function PRsV5(){const map=new Map();comparableRecordsV5().forEach(r=>{const info=loadInfoV5(r);if(!map.has(info.key))map.set(info.key,{name:r.name,unit:info.label,load:0,e1rm:0,date:r.date});const row=map.get(info.key);if(r.load>row.load){row.load=r.load;row.date=r.date}if((r.estimated1RM||0)>row.e1rm){row.e1rm=r.estimated1RM;if(!row.load)row.date=r.date}});return [...map.values()].filter(x=>x.load>0).sort((a,b)=>String(a.name??'').localeCompare(String(b.name??''))||a.unit.localeCompare(b.unit))}
function lineChartV5(rows){if(!rows.length)return '<div class="chart-empty">Guarda una sesión con carga para empezar la gráfica.</div>';rows=rows.slice(-14);const W=640,H=230,pad={l:48,r:18,t:18,b:38},vals=rows.map(r=>r.load),min=Math.min(...vals),max=Math.max(...vals),lo=Math.max(0,Math.floor((min-2.5)/5)*5),hi=Math.max(lo+5,Math.ceil((max+2.5)/5)*5),x=i=>pad.l+(rows.length===1?(W-pad.l-pad.r)/2:i*(W-pad.l-pad.r)/(rows.length-1)),y=v=>pad.t+(hi-v)*(H-pad.t-pad.b)/(hi-lo);let grid="";for(let i=0;i<5;i++){const v=lo+(hi-lo)*i/4,yy=y(v);grid+=`<line x1="${pad.l}" y1="${yy}" x2="${W-pad.r}" y2="${yy}" stroke="#44464E"/><text x="${pad.l-8}" y="${yy+4}" text-anchor="end" font-size="10" fill="#B5B8C2">${Math.round(v*10)/10}</text>`}const pts=rows.map((r,i)=>`${x(i)},${y(r.load)}`).join(" "),dots=rows.map((r,i)=>`<circle cx="${x(i)}" cy="${y(r.load)}" r="4" fill="#FC621E"><title>${shortDateV5(r.date)} · ${r.load} ${esc(loadInfoV5(r).label)}</title></circle>`).join(""),labels=rows.length===1?`<text x="${x(0)}" y="${H-12}" text-anchor="middle" font-size="10" fill="#B5B8C2">${shortDateV5(rows[0].date)}</text>`:`<text x="${x(0)}" y="${H-12}" text-anchor="start" font-size="10" fill="#B5B8C2">${shortDateV5(rows[0].date)}</text><text x="${x(rows.length-1)}" y="${H-12}" text-anchor="end" font-size="10" fill="#B5B8C2">${shortDateV5(rows[rows.length-1].date)}</text>`;return `<svg viewBox="0 0 ${W} ${H}" role="img">${grid}<polyline points="${pts}" fill="none" stroke="#11DAFE" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>${dots}${labels}</svg>`}
function renderProgressV5(){
  const box=document.querySelector("#progress-v5");if(!box)return;
  const hist=getHistory(),recs=comparableRecordsV5(hist),groups=[...new Map(recs.map(r=>[loadInfoV5(r).key,{key:loadInfoV5(r).key,name:r.name,label:r.name+' · '+loadInfoV5(r).label}])).values()].sort((a,b)=>a.label.localeCompare(b.label)),st=settingsV5(),selected=groups.find(g=>g.key===st.chartExercise)?.key||groups.find(g=>g.name===st.chartExercise)?.key||groups[0]?.key||'',rows=chartRecordsV5(selected),prs=PRsV5(),last30=hist.filter(h=>(Date.now()-parseDateV52(h.date))/86400000<=30).length,unknown=allRecordsV5(hist).length-recs.length;

  box.innerHTML=`<div class="stats"><div class="stat"><strong>${hist.length}</strong><span>Sesiones</span></div><div class="stat"><strong>${last30}</strong><span>30 días</span></div><div class="stat"><strong>${prs.length}</strong><span>PRs</span></div></div><div class="chart-wrap"><div class="chart-head"><h3>Evolución de cargas</h3><select id="chart-ex-v5">${groups.length?groups.map(g=>`<option value="${esc(g.key)}" ${g.key===selected?"selected":""}>${esc(g.label)}</option>`).join(""):'<option>Sin datos</option>'}</select></div>${lineChartV5(rows)}</div><div class="group">Récords personales</div><div class="pr-list">${prs.length?prs.map(p=>`<div class="list-item"><div class="top"><b>${esc(p.name)}</b><time>${fullDateV5(p.date)}</time></div><div class="pr-badge">PR · ${p.load} ${esc(p.unit)}${p.e1rm?` · e1RM ${Math.round(p.e1rm*10)/10} ${esc(p.unit)}`:""}</div></div>`).join(""):'<div class="small">Aún no hay cargas históricas.</div>'}</div><div class="group">Historial</div><div class="history"></div>`;
  if(unknown)box.querySelector('.chart-wrap').append(domNode('p','small',`${unknown} registros sin unidad indicada: se conservan en el historial y no se comparan automáticamente.`));
  const history=box.querySelector('.history'),rendered=AlmogaverStorage.raw(HIST);
  if(!hist.length)history.append(domNode('div','small','Todavía no hay sesiones guardadas.'));
  for(const [index,h] of hist.slice(0,100).entries()){
   const article=domNode('article','history-item'),top=domNode('div','top'),actions=domNode('div','actions'),button=domNode('button','mini-danger','Eliminar');
   top.append(domNode('b',null,h.title),domNode('time',null,fullDateV5(h.date)));article.append(top,domNode('p',null,`${h.total?`${h.done}/${h.total} bloques completados`:'Sesión registrada'}${h.notes?' · '+h.notes:''}`));
   actions.style.marginTop='8px';button.type='button';button.dataset.sessionDelete=String(h.id);actions.append(button);article.append(actions);history.append(article);
   button.addEventListener('click',async()=>{if(!confirm('¿Eliminar esta sesión y sus cargas históricas?'))return;try{await deleteStoredRowV5(HIST,rendered,index);renderProgressV5();window.refreshDashboardV6?.()}catch(e){showToastV5('No se ha eliminado',e.message)}});
  }
  const sel=document.querySelector("#chart-ex-v5");if(sel)sel.addEventListener("change",async()=>{const x=settingsV5();x.chartExercise=sel.value;await saveSettingsV5(x);renderProgressV5()});

}
function deleteStoredRowV5(key,rendered,index){return AlmogaverStorage.commit(repo=>{
 if(repo.raw(key)!==rendered)throw Error('Los registros han cambiado. Actualiza la vista antes de elegir qué registro eliminar.');
 const rows=repo.get(key,[]);if(!Number.isInteger(index)||index<0||index>=rows.length)throw Error('Registro inexistente. No se ha eliminado ningún dato.');
 rows.splice(index,1);return{[key]:JSON.stringify(rows)};
},'delete-selected-record')}
function getWodsV5(){return safeJSONV5(WODS_V5,[])}
function setWodsV5(x){return AlmogaverStorage.set(WODS_V5,x)}
function renderWodsV5(){
 const list=document.querySelector('#wod-list');if(!list)return;const w=getWodsV5(),rendered=AlmogaverStorage.raw(WODS_V5),fragment=document.createDocumentFragment();
 if(!w.length)fragment.append(domNode('div','small','Todavía no hay WODs guardados.'));
 for(const [index,x] of w.entries()){const item=domNode('div','wod-item'),top=domNode('div','top');top.append(domNode('b',null,x.title||x.type),domNode('time',null,fullDateV5(x.date)));item.append(top,domNode('p',null,`${x.type}${x.result?' · '+x.result:''}${x.rpe?' · RPE '+x.rpe:''}`));
 for(const text of [x.workout,x.scaling,x.notes])if(text)item.append(domNode('p',null,text));
 const actions=domNode('div','actions'),button=domNode('button','mini-danger','Eliminar');actions.style.marginTop='8px';button.type='button';button.dataset.wodDelete=String(x.id);actions.append(button);item.append(actions);fragment.append(item);
 button.addEventListener('click',async()=>{if(!confirm('¿Eliminar este WOD?'))return;try{await deleteStoredRowV5(WODS_V5,rendered,index);renderWodsV5()}catch(e){showToastV5('No se ha eliminado',e.message)}});}
 list.replaceChildren(fragment);
}

const wd=document.querySelector("#wod-date");if(wd)wd.value=todayV5();
let savingWodV52=false;
document.querySelector("#save-wod")?.addEventListener("click",async()=>{
  if(savingWodV52)return;
  const title=document.querySelector("#wod-title").value,workout=document.querySelector("#wod-workout").value,result=document.querySelector("#wod-result").value;
  if(!title.trim()&&!workout.trim()){showToastV5("WOD no guardado","Escribe al menos un título o el entrenamiento.");return;}
  const x={id:AlmogaverPersistence.newId(getWodsV5()),date:document.querySelector("#wod-date").value||todayV5(),type:document.querySelector("#wod-type").value,...(window.AlmogaverWeeks?.resultContext()||{}),title,workout,result,rpe:document.querySelector("#wod-rpe").value,scaling:document.querySelector("#wod-scaling").value,notes:document.querySelector("#wod-notes").value};
  savingWodV52=true;const btn=document.querySelector("#save-wod");if(btn)btn.disabled=true;
  try{const a=getWodsV5();a.unshift(x);await setWodsV5(a);document.querySelector("#wod-saved").textContent="Guardado";renderWodsV5();window.AlmogaverWeeks?.clearResultContext();
  }catch(e){showToastV5("No se ha guardado",e.message)}finally{setTimeout(()=>{savingWodV52=false;if(btn)btn.disabled=false;document.querySelector("#wod-saved").textContent=""},700)};
});
document.querySelector("#clear-wod")?.addEventListener("click",async()=>{document.querySelectorAll("#wods-screen input,#wods-screen textarea").forEach(i=>i.value="");document.querySelector("#wod-date").value=todayV5();document.querySelector("#wod-rpe").value="";document.querySelector("#wod-type").selectedIndex=0});
function getSkillsV5(){let a=safeJSONV5(SKILLS_V5,null);if(!Array.isArray(a)){a=structuredClone(DEFAULT_SKILLS_V5)}return a}function setSkillsV5(a){return AlmogaverStorage.set(SKILLS_V5,a)}function levelV5(n){return["No iniciado","Aprendiendo","Básico","Consistente","Sólido","Dominado"][n]||""}function renderSkillsV5(){
 const box=document.querySelector('#skills-list');if(!box)return;const fragment=document.createDocumentFragment();
 getSkillsV5().forEach((x,i)=>{const card=domNode('div','skill-card'),head=domNode('div','skill-head'),bar=domNode('div','skillbar'),fill=domNode('i'),controls=domNode('div','skill-controls'),select=domNode('select'),input=domNode('input');
 head.append(domNode('b',null,x.name),domNode('span','skill-level',`${x.level}/5 · ${levelV5(x.level)}`));fill.style.width=(x.level*20)+'%';bar.append(fill);select.dataset.lvV5=String(i);
 for(const n of [0,1,2,3,4,5]){const option=domNode('option',null,`${n} · ${levelV5(n)}`);option.value=String(n);option.selected=n===x.level;select.append(option)}
 input.dataset.noteV5=String(i);input.value=x.notes||'';input.placeholder='Nota técnica...';controls.append(select,input);card.append(head,bar,controls);fragment.append(card);
 select.addEventListener('change',async()=>{const items=getSkillsV5();items[i].level=Number(select.value);items[i].updated=new Date().toISOString();await setSkillsV5(items);renderSkillsV5()});
 input.addEventListener('input',()=>{const value=input.value;AlmogaverStorage.commit(repo=>{const items=repo.get(SKILLS_V5,DEFAULT_SKILLS_V5);items[i].notes=value;return{[SKILLS_V5]:JSON.stringify(items)}},'skill-note')});
 });box.replaceChildren(fragment);
}

document.querySelector("#add-skill")?.addEventListener("click",async()=>{const n=document.querySelector("#new-skill").value.trim();if(!n)return;const a=getSkillsV5();a.push({id:AlmogaverPersistence.newId(a),name:n,level:0,notes:""});await setSkillsV5(a);document.querySelector("#new-skill").value="";renderSkillsV5()});
function updateSettingsV5(){const st=settingsV5(),i=openInfoV5(),inp=document.querySelector("#open-start");if(inp)inp.value=i.start;const o=document.querySelector("#open-status");if(o)o.textContent=i.complete?`Ciclo completado · empezó ${fullDateV5(i.start)}`:`Semana ${i.w} de 8 · ${data.open.phases[i.phase].label}`}
document.querySelector("#open-start")?.addEventListener("change",async e=>{const st=settingsV5();st.openStart=e.target.value||todayV5();await saveSettingsV5(st);updateSettingsV5()});document.querySelector("#open-today")?.addEventListener("click",async()=>{const st=settingsV5();st.openStart=todayV5();await saveSettingsV5(st);updateSettingsV5()});
document.querySelector("#export-data")?.addEventListener("click",async()=>{
  const payload=await AlmogaverStorage.export();
  const text=JSON.stringify(payload,null,2),name=`ALMOGAVAR_backup_${todayV5()}.json`;
  try{
    const file=new File([text],name,{type:"application/json"});
    if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:"Backup ALMOGÀVER"})}
    else{const url=URL.createObjectURL(file),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
    document.querySelector("#backup-status").textContent="Backup exportado";
  }catch(e){if(e?.name!=="AbortError")document.querySelector("#backup-status").textContent="No se pudo exportar"}
});
document.querySelector("#import-data")?.addEventListener("change",async e=>{
  const f=e.target.files?.[0];if(!f)return;
  try{
    if(f.size>15_000_000)throw Error("too-large");
    await AlmogaverStorage.idle();
    const prepared=AlmogaverStorage.prepare(JSON.parse(await f.text()));
    const summary=document.createElement('pre');summary.id='backup-preview';const names=keys=>keys.map(k=>AlmogaverPersistence.LABELS[k]).join(', ')||'ninguno';
    summary.textContent='Backup v'+prepared.schemaVersion+' · Sustituye: '+names(prepared.replace)+'\nVacía: '+names(prepared.remove)+'\nConserva (ausentes en el archivo): '+names(prepared.retain)+'\nTextos de origen de la copia: '+JSON.stringify(JSON.parse(await f.text()).pendingTexts||'(no incluidos en v1)');
    document.getElementById('backup-preview')?.remove();document.querySelector('#backup-status').before(summary);
    if(!confirm(summary.textContent+'\n¿Confirmas este alcance de restauración?'))return;
    await AlmogaverStorage.restore(prepared);
    document.querySelector('#backup-status').textContent='Backup restaurado';setTimeout(()=>location.reload(),700);
  }catch(error){document.querySelector('#backup-status').textContent='Backup no válido / no restaurado: '+error.message}finally{e.target.value=''}
});
function switchScreenV5(id){document.querySelectorAll(".nav").forEach(b=>b.setAttribute("aria-current",b.dataset.screen===id?"page":"false"));document.querySelectorAll(".nav").forEach(b=>b.classList.toggle("active",b.dataset.screen===id));document.querySelectorAll(".screen").forEach(x=>x.classList.toggle("active",x.id===id));if(id==="progress-screen")renderProgressV5();if(id==="wods-screen")renderWodsV5();if(id==="skills-screen")renderSkillsV5();if(id==="settings-screen")updateSettingsV5();window.scrollTo({top:0,behavior:"smooth"})}
document.querySelectorAll(".nav").forEach(b=>b.addEventListener("click",async()=>{if(b.dataset.screen)requestAnimationFrame(()=>{if(b.dataset.screen==="progress-screen")renderProgressV5();if(b.dataset.screen==="wods-screen")renderWodsV5();if(b.dataset.screen==="skills-screen")renderSkillsV5();if(b.dataset.screen==="settings-screen")updateSettingsV5()})}));
renderProgressV5();renderWodsV5();renderSkillsV5();updateSettingsV5();

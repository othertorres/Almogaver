
const data = {
  lower: {
    title: "Lower Strength",
    subtitle: "Fuerza de tren inferior, cadena posterior y core.",
    tag: "Strength",
    sections: [
      { label: "Calentamiento", items: [
        { name:"Calentamiento general", meta:"8–10 min", desc:"5 min de remo o bicicleta. Movilidad de tobillo y cadera, 2×15 PVC Pass Through y 2×15 Face Pull. Debes terminar caliente, no fatigado." }
      ]},
      { label: "Fuerza", items: [
        { name:"Back Squat", meta:"5×5 · RPE 7–8 · 2'30”", desc:"Barra sobre la parte alta de la espalda, abdomen firme y rodillas alineadas con los pies. Baja controlado hasta romper el paralelo y asciende con intención rápida sin perder posición.", fields:[["Carga","kg"],["Series","5 × 5"],["RPE","7–8"]] },
        { name:"Romanian Deadlift", meta:"4×8 · RPE 7", desc:"Lleva la cadera hacia atrás con ligera flexión de rodillas, barra pegada a las piernas y espalda neutra. Baja hasta notar tensión clara en isquios y sube extendiendo la cadera.", fields:[["Carga","kg"],["Series","4 × 8"],["RPE","7"]] },
        { name:"Bulgarian Split Squat", meta:"3×10 por pierna", desc:"Pie trasero sobre banco. Desciende con control manteniendo rodilla y cadera estables y empuja con toda la planta del pie delantero.", fields:[["Carga","kg/mano"],["Series","3 × 10"],["RPE","7–8"]] }
      ]},
      { label: "Core + hombro", items: [
        { name:"Pallof Press", meta:"3×12 por lado", desc:"Extiende los brazos desde una polea o banda lateral sin permitir que el tronco rote. Mantén pelvis y costillas estables." },
        { name:"Copenhagen Plank", meta:"3×20–30 s por lado", desc:"Apoya la pierna superior en un banco y eleva la cadera formando una línea recta. Si la técnica cae, reduce el tiempo." },
        { name:"Hombro preventivo", meta:"Face Pull · Rotación externa · Wall Slides", desc:"Face Pull 3×15, rotación externa 3×15 por lado y Wall Slides 2×12. Control total y sin buscar fatiga." },
        { name:"Farmer Carry · opcional", meta:"4×30 m", desc:"Camina con dos cargas pesadas manteniendo postura alta, abdomen firme y pasos controlados.", fields:[["Carga","kg/mano"],["Series","4 × 30 m"],["RPE","7"]] }
      ]}
    ]
  },
  upper: {
    title: "Upper Strength",
    subtitle: "Torso fuerte y equilibrado sin convertir la sesión en otro WOD.",
    tag: "Strength",
    sections: [
      { label: "Fuerza de torso", items: [
        { name:"Press inclinado con mancuernas", meta:"4×8–10 · RPE 7–8", desc:"Banco con ligera inclinación. Baja de forma controlada y empuja manteniendo las escápulas estables.", fields:[["Carga","kg/mano"],["Series","4 × 8–10"],["RPE","7–8"]] },
        { name:"Dominada lastrada", meta:"4×6 · técnica limpia", desc:"Activa las escápulas y lleva el pecho hacia la barra sin balanceo. Usa un lastre que te permita mantener todas las repeticiones limpias.", fields:[["Lastre","kg"],["Series","4 × 6"],["RPE","7–8"]] },
        { name:"Remo con pecho apoyado", meta:"4×10", desc:"Apoya el pecho en un banco inclinado y lleva los codos hacia atrás. Evita levantar el torso o encoger los hombros.", fields:[["Carga","kg/mano"],["Series","4 × 10"],["RPE","7–8"]] }
      ]},
      { label: "Accesorios", items: [
        { name:"Elevaciones laterales", meta:"3×15", desc:"Eleva los brazos hacia los lados con poco impulso y controla especialmente la bajada." },
        { name:"Curl de bíceps", meta:"3×10–12", desc:"Flexiona el codo sin balancear el tronco. Mantén tensión continua y controla el descenso." },
        { name:"Extensión de tríceps en polea", meta:"3×10–12", desc:"Mantén los codos cerca del cuerpo y extiéndelos sin mover los hombros." },
        { name:"Farmer Carry", meta:"4×30 m", desc:"Camina alto y estable con dos cargas pesadas, agarre firme y sin inclinarte lateralmente.", fields:[["Carga","kg/mano"],["Series","4 × 30 m"],["RPE","7"]] }
      ]}
    ]
  },
  open: {
    title: "Open Box",
    subtitle: "Progresión ALMOGÀVER completa de 8 semanas.",
    tag: "8 semanas",
    phases: {
      p12: {
        label: "Semanas 1–2",
        caption: "Movilidad + estabilidad",
        sections: [
          { label: "Movilidad", items: [
            { name:"PVC Pass Through", meta:"2×10–15", desc:"Pasa el PVC desde delante hasta detrás con agarre amplio y codos extendidos. Reduce el agarre solo si no hay dolor ni compensaciones." },
            { name:"Dead Hang", meta:"3×20 s", desc:"Cuélgate dejando que los hombros se eleven de forma controlada. Descarga peso con los pies si lo necesitas." },
            { name:"Band Lat Stretch", meta:"2×30 s por lado", desc:"Banda alta, cadera hacia atrás y brazo largo. Busca tensión suave en dorsal y axila, nunca dolor." }
          ]},
          { label: "Estabilidad", items: [
            { name:"Overhead Carry", meta:"3×20 m por brazo · RPE 5–6", desc:"Camina con una carga ligera bloqueada sobre la cabeza, costillas abajo y hombro activo.", fields:[["Carga","kg"],["Series","3 × 20 m"],["RPE","5–6"]] },
            { name:"Face Pull + rotación externa", meta:"3×15 cada uno", desc:"Face Pull hacia la cara con escápulas activas; rotación externa con el codo pegado al costado y control total." }
          ]},
          { label: "Patrón overhead", items: [
            { name:"Overhead Squat con PVC", meta:"4×5 · técnico", desc:"PVC sobre el centro del pie, brazos bloqueados y hombros activos. Baja solo hasta donde puedas conservar una posición sólida." },
            { name:"Overhead Hold", meta:"3×20 s · RPE 5–6", desc:"Carga ligera sobre la cabeza, codos bloqueados y abdomen activo. No saques las costillas.", fields:[["Carga","kg"],["Series","3 × 20 s"],["RPE","5–6"]] }
          ]}
        ]
      },
      p34: {
        label: "Semanas 3–4",
        caption: "Fuerza + técnica",
        sections: [
          { label: "Activación", items: [
            { name:"PVC Pass Through", meta:"2×10", desc:"Mismo patrón de semanas 1–2, buscando ahora un recorrido más limpio y estable." },
            { name:"Scap Pull-Up", meta:"3×6–8", desc:"Desde el hang, mueve el cuerpo ligeramente hacia arriba y abajo usando solo las escápulas, sin doblar los codos." }
          ]},
          { label: "Fuerza overhead", items: [
            { name:"Press Militar", meta:"4×6 · RPE 6–7", desc:"Empuja la barra desde front rack hasta bloqueo overhead sin usar piernas. Costillas controladas y glúteos activos.", fields:[["Carga","kg"],["Series","4 × 6"],["RPE","6–7"]] },
            { name:"Bottom-Up KB Hold", meta:"3×20 s por lado", desc:"Sujeta la kettlebell invertida y estabiliza muñeca, codo y hombro. Usa una carga ligera y evita compensaciones." }
          ]},
          { label: "Técnica", items: [
            { name:"Overhead Squat · barra ligera", meta:"5×3", desc:"Carga muy ligera. Prioriza equilibrio, profundidad útil y trayectoria estable sobre el centro del pie." },
            { name:"Overhead Carry", meta:"3×20 m por brazo", desc:"Mantén el bloqueo overhead aprendido y camina sin inclinarte ni abrir las costillas." }
          ]}
        ]
      },
      p56: {
        label: "Semanas 5–6",
        caption: "Transferencia",
        sections: [
          { label: "Control escapular", items: [
            { name:"Scap Pull-Up", meta:"3×8", desc:"Movimiento pequeño y controlado de las escápulas manteniendo los codos extendidos." },
            { name:"Front Rack Hold", meta:"3×20–30 s", desc:"Sostén la barra en front rack con codos altos y tronco estable. Respira sin perder la posición." }
          ]},
          { label: "Transferencia overhead", items: [
            { name:"Push Press", meta:"5×3 · RPE 6–7", desc:"Dip corto y vertical, extensión potente de piernas y final con bloqueo overhead estable.", fields:[["Carga","kg"],["Series","5 × 3"],["RPE","6–7"]] },
            { name:"Overhead Squat · carga ligera", meta:"4×4", desc:"Añade carga solo si la barra permanece estable y la profundidad no exige compensaciones." },
            { name:"Bottom-Up Carry", meta:"3×15 m por lado", desc:"Camina manteniendo la kettlebell invertida y el hombro organizado. El objetivo es estabilidad fina, no peso alto." },
            { name:"Overhead Hold", meta:"3×20 s", desc:"Con carga moderada y segura, mantén el bloqueo overhead sin arquear la espalda." }
          ]}
        ]
      },
      p78: {
        label: "Semanas 7–8",
        caption: "Integración",
        sections: [
          { label: "Técnica dinámica", items: [
            { name:"Push Jerk", meta:"5×3 · técnico", desc:"Dip vertical, drive potente y recibe la barra con una segunda flexión de piernas. Bloqueo estable antes de levantarte." },
            { name:"Snatch Balance", meta:"5×3 · barra vacía o ligera", desc:"Desde barra detrás del cuello, entra rápido debajo de la barra y recibe en overhead squat. La velocidad y posición mandan sobre la carga." }
          ]},
          { label: "Integración overhead", items: [
            { name:"Overhead Squat", meta:"4×5 · ligero", desc:"Busca un patrón repetible con carga ligera: barra estable, pies firmes y profundidad sin compensaciones." },
            { name:"Overhead Carry", meta:"3×20 m por brazo", desc:"Mantén la carga sobre el centro de masas con hombro activo y tronco estable." },
            { name:"Scap Pull-Up", meta:"3×8", desc:"Refuerza el control escapular en hang manteniendo los codos rectos." },
            { name:"Complejo técnico", meta:"4 rondas · carga muy ligera", desc:"3 Push Press + 3 Overhead Squat + 20 s Overhead Hold. Hazlo fluido, descansando lo necesario para preservar la técnica." }
          ]}
        ]
      }
    }
  }
};

const STORE = "almogavar-state";
const HIST = "almogavar-history";

const $ = (s,c=document)=>c.querySelector(s);
const $$ = (s,c=document)=>[...c.querySelectorAll(s)];
const content = $("#content");
const sessionCards = $$(".session-card");
let state = AlmogaverStorage.get(STORE,{});
const saveState = ()=>AlmogaverStorage.set(STORE,state);
let currentSession = state.currentSession || "lower";
let currentPhase = state.currentPhase || "p12";

function esc(s){ return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"})[c]); }

// Only internal tag/class names reach this helper. External values become text nodes.
function domNode(tag,className,text){const element=document.createElement(tag);if(className)element.className=className;if(arguments.length>2)element.textContent=String(text??'');return element}
// File names/types are external. Blob previews always carry a non-HTML MIME type.
function safePreviewFileURL(file){
 if(!(file instanceof File))throw Error('Archivo de vista previa no válido.');
 const ext=file.name.match(/\.(pdf|png|jpe?g|webp)$/i)?.[1]?.toLowerCase(),mime=ext==='pdf'?'application/pdf':ext==='png'?'image/png':ext==='webp'?'image/webp':/^(?:jpg|jpeg)$/.test(ext||'')?'image/jpeg':null;
 if(!mime||!Number.isSafeInteger(file.size)||file.size>15000000)throw Error('Archivo de vista previa incompatible o mayor de 15 MB.');
 const given=file.type.toLowerCase(),aliases=mime==='image/jpeg'?['image/jpg']:mime==='application/pdf'?['application/x-pdf']:[];
 if(given&&!['application/octet-stream',mime,...aliases].includes(given))throw Error('El tipo del archivo no coincide con una vista previa PDF o imagen segura.');
 return URL.createObjectURL(new Blob([file],{type:mime}));
}
function metricInputs(keyBase, fields){
  if(!fields) return "";
  return `<div class="metrics">${fields.map((f,idx)=> {
    const key = `${keyBase}-field-${idx}`;
    const isLoad = /carga|lastre/i.test(f[0]);
    const value = state[key] ?? (isLoad ? "" : f[1]);
    const placeholder = isLoad ? f[1] : "";
    const inputmode = isLoad ? ' inputmode="decimal"' : '';
    return `<div class="metric"><label>${esc(f[0])}</label><input data-key="${key}" value="${esc(value)}" placeholder="${esc(placeholder)}"${inputmode}></div>`;
  }).join("")}</div>`;
}

function exerciseHtml(sessionKey, item, idx){
  const checkKey = `${sessionKey}-check-${idx}`;
  const checked = state[checkKey] ? "checked" : "";
  return `<details class="exercise"${idx===0 ? " open" : ""}>
    <summary>
      <input class="check" type="checkbox" aria-label="Completar ${esc(item.name)}" data-key="${checkKey}" ${checked}>
      <div class="ex"><b>${esc(item.name)}</b><span>${esc(item.meta)}</span></div>
      <span class="chev">⌄</span>
    </summary>
    <div class="body">
      ${metricInputs(sessionKey + "-ex-" + idx, item.fields)}
      <details class="technique"><summary>Técnica y ejecución <span aria-hidden="true">+</span></summary><p class="desc">${esc(item.desc)}</p></details>
    </div>
  </details>`;
}

function renderStandardSession(key){
  const s = data[key];
  let html = `<section class="panel active" data-name="${esc(s.title)}">
    <div class="title-row"><div><h2>${esc(s.title)}</h2><p>${esc(s.subtitle)}</p></div><span class="tag">${esc(s.tag)}</span></div>
    <div class="progress"><div class="progress-top"><span>PROGRESO</span><span class="pct">0%</span></div><div class="bar"><i></i></div></div>`;
  let globalIdx = 0;
  s.sections.forEach(sec => {
    html += `<div class="group">${esc(sec.label)}</div>`;
    sec.items.forEach(item => {
      html += exerciseHtml(key, item, globalIdx++);
    });
  });
  html += `</section>`;
  content.innerHTML = html;
}

function renderClassSession(){
  const fields = [
    ["class-label","Etiqueta / semana","Ej. Semana 34 · Agosto"],
    ["class-warmup","Warm-up","Escribe el calentamiento..."],
    ["class-strength","Strength / Skill","Fuerza, halterofilia, técnica..."],
    ["class-wod","WOD","AMRAP, For Time, EMOM..."],
    ["class-scale","Scaling / notas","Pesos, escalados, sensaciones, objetivo de pacing..."],
  ];
  content.innerHTML = `<section class="panel active" data-name="Clase CrossFit">
    <div class="title-row"><div><h2>Clase CrossFit</h2><p>Edita aquí la programación semanal del box. Queda guardada en el iPhone.</p></div><span class="tag">Editable</span></div>
    <div class="class-editor">
      ${fields.map(([id,label,ph], i)=> {
        const v = state[id] || "";
        const isArea = i > 0;
        return `<div class="field"><label>${label}</label>${isArea
          ? `<textarea data-class="${id}" placeholder="${ph}">${esc(v)}</textarea>`
          : `<input data-class="${id}" value="${esc(v)}" placeholder="${ph}">`}</div>`;
      }).join("")}
      <div class="actions">
        <button id="save-class" class="btn red" type="button">Guardar clase</button>
        <button id="clear-class" class="btn soft" type="button">Limpiar editor</button>
        <span id="class-saved" class="saved"></span>
      </div>
    </div>
  </section>`;
}

function renderOpenSession(){
  const o = data.open;
  const phase = o.phases[currentPhase];
  let html = `<section class="panel active" data-name="Open Box · ${esc(phase.label)}">
    <div class="title-row"><div><h2>${esc(o.title)}</h2><p>${esc(o.subtitle)}</p></div><span class="tag">${esc(o.tag)}</span></div>
    <div class="phase-tabs">
      ${Object.entries(o.phases).map(([k,v])=>`<button class="phase-tab${k===currentPhase?' active':''}" data-phase="${k}" type="button">${esc(v.label)}</button>`).join("")}
    </div>
    <div class="progress"><div class="progress-top"><span>${esc(phase.caption)}</span><span class="pct">0%</span></div><div class="bar"><i></i></div></div>`;
  let idx = 0;
  phase.sections.forEach(sec => {
    html += `<div class="group">${esc(sec.label)}</div>`;
    sec.items.forEach(item => {
      html += exerciseHtml("open-" + currentPhase, item, idx++);
    });
  });
  html += `</section>`;
  content.innerHTML = html;
}

function updateProgress(){
  const panel = $(".panel.active", content);
  if(!panel) return;
  const checks = $$(".check", panel);
  if(!checks.length&&!panel.querySelector('.progress')){
    const unknown=domNode('div','progress');unknown.setAttribute('role','status');
    unknown.append(domNode('b',null,'Progreso no calculable'),domNode('p','small','Esta sesión no tiene series ni ejercicios marcables definidos. El texto de la clase y su resultado se conservan; no inventamos un porcentaje.'));
    panel.querySelector('.title-row')?.after(unknown);
  }
  const done = checks.filter(c => c.checked).length;
  const pct = checks.length ? Math.round(done / checks.length * 100) : 0;
  const pctNode = $(".pct", panel);
  const bar = $(".bar i", panel);
  if(pctNode) pctNode.textContent = pct + "%";
  if(bar){bar.style.width=pct+"%";const track=bar.parentElement;track.setAttribute("role","progressbar");track.setAttribute("aria-label","Ejercicios completados");track.setAttribute("aria-valuemin","0");track.setAttribute("aria-valuemax","100");track.setAttribute("aria-valuenow",String(pct))}
  checks.forEach(c=>c.closest("details.exercise").classList.toggle("completed",c.checked));
  if(pctNode) pctNode.textContent = `${done}/${checks.length} ejercicios · ${pct}%`;
}

function bindPanelInteractions(){
  $$("[data-key]", content).forEach(el => {
    const key = el.dataset.key;
    if(el.classList.contains("check")) {
      el.checked = !!state[key];
      el.addEventListener("change", () => {
        state[key] = el.checked;
        saveState();
        updateProgress();
      });
    } else {
      el.addEventListener("input", () => {
        state[key] = el.value;
        saveState();
      });
    }
  });

  $$(".phase-tab", content).forEach(btn => btn.addEventListener("click", () => {
    currentPhase = btn.dataset.phase;
    state.currentPhase = currentPhase;
    saveState();
    renderCurrent();
  }));

  $$("#save-class", content).forEach(btn => btn.addEventListener("click", async () => {
    $$("[data-class]", content).forEach(el => state[el.dataset.class] = el.value);
    await saveState();
    const s = $("#class-saved", content);
    if(s) {
      s.textContent = "Guardado";
      setTimeout(() => s.textContent = "", 1500);
    }
  }));

  $$("#clear-class", content).forEach(btn => btn.addEventListener("click", () => {
    $$("[data-class]", content).forEach(el => {
      el.value = "";
      state[el.dataset.class] = "";
    });
    saveState();
  }));
}

function renderCurrent(){
  sessionCards.forEach(card => card.classList.toggle("active", card.dataset.session === currentSession));
  if(currentSession === "lower") renderStandardSession("lower");
  if(currentSession === "upper") renderStandardSession("upper");
  if(currentSession === "class") renderClassSession();
  if(currentSession === "open") renderOpenSession();
  bindPanelInteractions();
  loadSessionNotes();
  updateProgress();
  window.decorateCurrentV5?.();window.decorateOpenV5?.();window.addClassToWodButtonV5?.();
}

sessionCards.forEach(card => card.addEventListener("click", () => {
  currentSession = card.dataset.session;
  state.currentSession = currentSession;
  saveState();
  renderCurrent();
}));

const noteBox = $("#session-notes");
function noteKey(){ return currentSession === "open" ? `note-open-${currentPhase}` : `note-${currentSession}`; }
function loadSessionNotes(){ noteBox.value = state[noteKey()] || ""; }
noteBox.addEventListener("input", () => {
  state[noteKey()] = noteBox.value;
  saveState();
});

const historyKey = HIST;
function getHistory(){ return AlmogaverStorage.get(historyKey,[]); }
function setHistory(v){ return AlmogaverStorage.set(historyKey,v); }

let savingSessionV52 = false;
$("#save-session").addEventListener("click", async () => {
  if(savingSessionV52) return;
  const panel = $(".panel.active", content);
  if(!panel) return;
  const checks = $$(".check", panel);
  const done = checks.filter(c=>c.checked).length;
  const total = checks.length;
  if(currentSession !== "class" && total > 0 && done === 0){
    showToastV5("Sesión no guardada", "Marca al menos un ejercicio como completado.");
    return;
  }
  const title = panel.dataset.name || currentSession;
  let exercises;try{exercises=collectExerciseRecordsV5()}catch(e){showToastV5('Sesión no guardada',e.message);return}
  const entry = {
    id: AlmogaverPersistence.newId(getHistory()), date: new Date().toISOString(), title, done, total,
    notes: noteBox.value, exercises
  };
  savingSessionV52 = true;
  const saveBtn = $("#save-session");
  if(saveBtn) saveBtn.disabled = true;
  try {
    const h = getHistory();
    const prsV5 = detectPRsV5(entry.exercises, h);
    h.unshift(entry);
    const nextState=structuredClone(state);
    checks.forEach(c=>{if(c.dataset.key)nextState[c.dataset.key]=false});nextState[noteKey()]="";
    await AlmogaverStorage.commit({[HIST]:JSON.stringify(h),[STORE]:JSON.stringify(nextState)},'save-session');
    state=nextState;checks.forEach(c=>c.checked=false);noteBox.value="";
    updateProgress();
    $("#session-saved").textContent = "Guardado";
    setTimeout(() => $("#session-saved").textContent = "", 1500);
    renderHistory(); renderProgressV5();
    window.showSessionSummaryV6?.(entry,prsV5);
    window.refreshDashboardV6?.();
    if(prsV5.length) showToastV5("🏆 Nuevo PR", prsV5.join(" · "));
  } catch(e) { showToastV5("No se ha guardado",e.message); } finally {
    setTimeout(()=>{ savingSessionV52=false; if(saveBtn) saveBtn.disabled=false; }, 700);
  }
});

function renderHistory(){
 const box=$("#history");if(!box)return;const h=getHistory(),fragment=document.createDocumentFragment();
 if(!h.length)fragment.append(domNode('div','small','Todavía no hay sesiones guardadas.'));
 for(const x of h){const article=domNode('article','history-item'),top=domNode('div','top');top.append(domNode('b',null,x.title),domNode('time',null,new Date(x.date).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'})));article.append(top,domNode('p',null,`${x.done}/${x.total} bloques completados${x.notes?' · '+x.notes:''}`));fragment.append(article)}
 box.replaceChildren(fragment);
}

const display = $(".timer");
const rest = $("#rest");
const start = $("#start");
const reset = $("#reset");
let remain = Number(rest.value), timer = null, timerEndV52 = null;
function renderTimer(){ const m=Math.floor(remain/60),s=remain%60; display.textContent=String(m).padStart(2,"0")+":"+String(s).padStart(2,"0"); const ring=document.querySelector("#ring-value"); if(ring)ring.style.strokeDashoffset=100-Math.min(100,remain/Number(rest.value)*100); const status=document.querySelector("#timer-status"); if(status)status.textContent=remain===0?"SIGUIENTE SERIE":timer?"RECUPERA Y RESPIRA":remain<Number(rest.value)?"EN PAUSA":"LISTO PARA EMPEZAR"; }
function stopTimer(){ if(timer){clearInterval(timer);timer=null;} timerEndV52=null; start.textContent="Iniciar"; renderTimer(); }
function tickTimerV52(){
  if(!timerEndV52) return;
  remain=Math.max(0,Math.ceil((timerEndV52-Date.now())/1000)); renderTimer();
  if(remain===0){ stopTimer(); showToastV5("Descanso terminado", "Siguiente serie."); }
}
start.addEventListener("click",()=>{
  if(timer){stopTimer();return;}
  if(remain<=0) remain=Number(rest.value);
  timerEndV52=Date.now()+remain*1000; start.textContent="Pausar";
  timer=setInterval(tickTimerV52,250); tickTimerV52();
});
reset.addEventListener("click",()=>{stopTimer();remain=Number(rest.value);renderTimer();});
rest.addEventListener("change",()=>{stopTimer();remain=Number(rest.value);renderTimer();});
document.addEventListener("visibilitychange",()=>{if(!document.hidden)tickTimerV52();});

$$(".nav").forEach(btn => btn.addEventListener("click", () => {
  $$(".nav").forEach(b => b.classList.toggle("active", b === btn));
  $$(".screen").forEach(s => s.classList.toggle("active", s.id === btn.dataset.screen));
  if(btn.dataset.screen === "history-screen") renderHistory();
  window.scrollTo({ top:0, behavior:"smooth" });
}));

$("#clear-all").addEventListener("click",async()=>{
 if(!confirm("¿Vaciar los datos activos? Las generaciones anteriores y las claves heredadas se conservarán para recuperación."))return;
 try{await AlmogaverStorage.commit(Object.fromEntries(AlmogaverPersistence.KEYS.map(k=>[k,null])), 'user-clear',{newGeneration:true});location.reload()}catch(e){showToastV5('No se ha vaciado',e.message)}
});

renderCurrent();
renderHistory();
renderTimer();

// Service worker lifecycle is coordinated by the bundled src/pwa.js.

/* Spatial reading order for OCR: reconstruct rows and weekday panels. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AlmogaverLayout=api})(globalThis,function(){
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z]/g,'');
const weekdays=['lunes','martes','miercoles','jueves','viernes','sabado','domingo'];
const labels=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
function wordsFrom(data){const words=[];const walk=x=>{if(!x||typeof x!=='object')return;if(Array.isArray(x.words)){for(const w of x.words){const bbox=w.bbox||(Number.isFinite(w.x0)&&Number.isFinite(w.y0)?{x0:w.x0,x1:w.x1,y0:w.y0,y1:w.y1}:null);if(w.text?.trim()&&bbox)words.push({text:w.text.trim(),...bbox,confidence:w.confidence})}return}for(const k of ['blocks','paragraphs','lines'])if(Array.isArray(x[k]))x[k].forEach(walk)};walk(data);return words}
function rowsOf(words){const sorted=words.slice().sort((a,b)=>(a.y0+a.y1-b.y0-b.y1)||a.x0-b.x0),rows=[];for(const w of sorted){const cy=(w.y0+w.y1)/2,h=w.y1-w.y0;let r=rows.find(r=>Math.abs(r.cy-cy)<Math.max(4,Math.min(r.height,h)*.6));if(!r){r={cy,height:h,words:[]};rows.push(r)}r.words.push(w);r.cy=r.words.reduce((n,w)=>n+(w.y0+w.y1)/2,0)/r.words.length;r.height=Math.max(r.height,h)}return rows.sort((a,b)=>a.cy-b.cy).map(r=>({...r,words:r.words.sort((a,b)=>a.x0-b.x0)}))}
function rowText(row){return row.words.map((w,i,a)=>`${i?(w.x0-a[i-1].x1>Math.max(row.height*2,24)?' | ':' '):''}${w.text}`).join('')}
function wordsText(words,{paragraphs=false}={}){const rows=rowsOf(words);return rows.map((r,i)=>`${paragraphs&&i&&r.cy-rows[i-1].cy>Math.max(r.height,rows[i-1].height)*2.5?'\n':''}${rowText(r)}`).join('\n')}
function reconstruct(data,{mode='routine'}={}){
 const words=wordsFrom(data);if(!words.length)return{text:data.text||'',warnings:['No se han obtenido posiciones de palabras; revisa el orden del texto.']};
 const anchors=words.filter(w=>weekdays.includes(norm(w.text))).map(w=>({...w,day:weekdays.indexOf(norm(w.text))}));
 const bands=[];for(const a of anchors.slice().sort((a,b)=>a.y0-b.y0)){let band=bands.find(b=>Math.abs(b.y-a.y0)<Math.max(a.y1-a.y0,15)*2);if(!band){band={y:a.y0,items:[]};bands.push(band)}if(!band.items.some(x=>x.day===a.day))band.items.push(a)}
 if(bands.some(b=>b.items.length>=2)){
  const parts=[];bands.sort((a,b)=>a.y-b.y);for(let bi=0;bi<bands.length;bi++){const band=bands[bi],items=band.items.sort((a,b)=>a.x0-b.x0);for(let ai=0;ai<items.length;ai++){const a=items[ai],left=ai===0?0:a.x0-18,right=items[ai+1]?items[ai+1].x0-18:Infinity,top=band.y-12,bottom=bands[bi+1]?bands[bi+1].y-20:Infinity;const inside=words.filter(w=>{const cx=(w.x0+w.x1)/2,cy=(w.y0+w.y1)/2;return cx>=left&&cx<right&&cy>=top&&cy<bottom&&!(weekdays.includes(norm(w.text))&&Math.abs(w.y0-a.y0)<30)});parts.push({day:a.day,text:labels[a.day]+'\n'+wordsText(inside,{paragraphs:true})})}}
  return{text:parts.sort((a,b)=>a.day-b.day).map(p=>p.text).join('\n\n'),warnings:['Se han separado paneles por día. Comprueba que ningún bloque haya quedado en otro día.']};
 }
 return{text:wordsText(words,{paragraphs:mode==='weekly'}),warnings:[]};
}
return{wordsFrom,rowsOf,wordsText,reconstruct};
});

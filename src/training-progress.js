/* Presentation metric only. No changes to records, PRs, e1RM or training targets. */
window.AlmogaverTrainingProgress=function(day,entries={}){
 let total=0,done=0,unknown=0,exercisesDone=0;
 const exercises=Array.isArray(day?.exercises)?day.exercises:[];
 for(const e of exercises){
  const count=Number(e.sets);
  if(e.sets==null||e.sets===''||!Number.isInteger(count)||count<1||count>30){unknown++;continue}
  total+=count;let checked=0;
  for(let i=0;i<count;i++)if(entries[e.id]?.[i]?.done===true)checked++;
  done+=checked;if(checked===count)exercisesDone++;
 }
 return{done,total,unknown,exercisesDone,exercisesTotal:exercises.length,percent:unknown?null:total?Math.round(done/total*100):0};
};

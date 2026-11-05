/* Local welcome only. There is no account, credential storage or authentication. */
(()=>{'use strict';
 const key=AlmogaverPersistence.K.settings,host=domNode('section','card access-panel');
 host.id='access-screen';host.setAttribute('aria-label','Acceso a ALMOGÀVER');host.hidden=true;
 document.querySelector('.hero').after(host);
 let busy=false;
 function button(text,fn,primary=false){const b=domNode('button','btn '+(primary?'primary':'soft'),text);b.type='button';b.onclick=fn;return b}
 function heading(title,message){host.replaceChildren(domNode('h1',null,title),domNode('p',null,message))}
 function show(mode='welcome'){
  document.body.classList.add('access-mode');host.hidden=false;host.dataset.view=mode;
  if(mode==='welcome'){
   heading('Bienvenido a ALMOGÀVER','Tu entrenamiento. Tu evolución. Puedes entrenar sin crear una cuenta.');
   const actions=domNode('div','access-actions');actions.append(button('Registrarme',()=>show('register'),true),button('Ya tengo cuenta',()=>show('login')),button('Continuar sin cuenta',continueLocal));host.append(actions);
   host.append(domNode('p','small','Las cuentas todavía no están disponibles. El modo local conserva tus datos en este dispositivo.'));
  }else{
   heading(mode==='register'?'Registrarme':'Ya tengo cuenta','Función pendiente: todavía no hay un servicio de cuentas. No se creará una cuenta ni se iniciará sesión.');
   const fields=domNode('fieldset');fields.disabled=true;fields.append(domNode('legend',null,'Vista previa · no introduzcas datos ni contraseñas'));
   for(const [label,type] of (mode==='register'?[['Nombre','text'],['Email','email'],['Contraseña','password'],['Confirmar contraseña','password']]:[['Email','email'],['Contraseña','password']])){
    const row=domNode('label',null,label),input=domNode('input');input.type=type;input.autocomplete='off';input.placeholder='No disponible todavía';row.append(input);fields.append(row);
   }
   if(mode==='register'){const terms=domNode('label','access-terms'),check=domNode('input');check.type='checkbox';terms.append(check,document.createTextNode('Aceptación de condiciones · pendiente de publicación'));fields.append(terms)}
   const unavailable=button(mode==='register'?'Registro no disponible':'Acceso con cuenta no disponible',()=>{});unavailable.disabled=true;fields.append(unavailable);host.append(fields);
   host.append(domNode('p','small','Esta vista previa no recoge datos. Las contraseñas no se guardan ni se envían. Las condiciones deberán publicarse antes de habilitar el registro.'));
   const actions=domNode('div','access-actions');actions.append(button('Continuar en modo local',continueLocal,true),button('Volver',()=>show()));host.append(actions);
  }
  host.querySelector('h1').tabIndex=-1;host.querySelector('h1').focus();window.scrollTo({top:0});
 }
 async function continueLocal(){
  if(busy)return;busy=true;
  try{
   await AlmogaverStorage.commit(repo=>({[key]:JSON.stringify({...repo.get(key,{}),localModeAcknowledged:true})}),'acknowledge-local-mode');
   host.hidden=true;host.replaceChildren();document.body.classList.remove('access-mode');switchScreenV5('training-screen');AlmogaverHome.refresh();
  }catch(e){let error=host.querySelector('[role="alert"]');if(!error){error=domNode('p');error.setAttribute('role','alert');host.append(error)}error.textContent='No se ha guardado la elección. Tus datos se conservan. '+e.message}
  finally{busy=false}
 }
 const access=button('Acceso y cuenta · pendiente',()=>show());access.id='open-local-access';document.querySelector('#settings-screen').append(access);
 // Existing operational data always bypasses this new welcome. Opening it never writes.
 if(!Object.keys(AlmogaverStorage.map).length)show();
 window.AlmogaverAccess={show};
})();

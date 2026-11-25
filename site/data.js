 
(function(){
'use strict';
const BD=window.BD=window.BD||{};
const FILES=['envelope','size','equipment','noise','heat','water','plant_units','zones','addons','arch','dc_rooms','lotside','viewpoints','grade','facilities']; 
const plain=o=>{
  if(Array.isArray(o)) return o.map(plain);
  if(o&&typeof o==='object'){
    if('v' in o&&'src' in o) return plain(o.v);
    const r={}; for(const k of Object.keys(o)){ if(k==='src'||k[0]==='_') continue; r[k]=plain(o[k]); } return r; }
  return o; };
const D={raw:{}};
for(const n of FILES){
  try{ const x=new XMLHttpRequest(); x.open('GET','data/'+n+'.json',false); x.send(null);
    if(x.status&&x.status!==200) throw new Error('HTTP '+x.status);
    const j=JSON.parse(x.responseText); D.raw[n]=j; D[n]=plain(j); }
  catch(e){ console.error('data/'+n+'.json did not load',e); D[n]=null; } }
BD.data=D;
})();

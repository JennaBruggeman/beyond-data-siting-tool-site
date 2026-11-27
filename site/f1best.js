 
(function(){
const BD=window.BD=window.BD||{};
 
const IDXC={}; const index=async(city)=>{ city=city==='edm'?'edm':'van'; if(IDXC[city]!==undefined) return IDXC[city]; try{ let r=await fetch(`data/lib_best_${city}.json`).catch(()=>null); if(!r||!r.ok) r=await fetch((BD.ASSET_BASE||'')+`f1/lib_best_${city}.json`); IDXC[city]=r.ok?await r.json():false; }catch(e){ IDXC[city]=false; } return IDXC[city]; };    
 
const allOf=e=>{ if(!e) return []; const L=e.byDensity?Object.values(e.byDensity).flatMap(b=>[b&&b.best,...((b&&b.alternatives)||[])]):[e.best,...(e.alternatives||[])], seen=new Set(); return L.filter(p=>p&&p.plan&&!seen.has(p.plan)&&seen.add(p.plan)); };
const TN=t=>String(t||'').replace(/_/g,' ').replace(/^./,c=>c.toUpperCase());
 
let OF=null; const oldF=async()=>{ if(OF!==null) return OF; try{ const r=await fetch((BD.ASSET_BASE||'')+'f1/old_fails.json'); OF=r.ok?(await r.json()).plans||{}:{}; }catch(e){ OF={}; } return OF; };
const oldRows=id=>(OF&&id&&OF[id])||null;
 
const away=(id,lot)=>{ id=String(id||''); if(!id) return false; const q=/^V339|^board 63819485/.test(id)?'63819485':(id.match(/^L?(\d{8})_/)||[])[1]; return !q||q!==String(lot); };    
const ROWW={'change rooms':'the change-room check (no change rooms drawn)','deck':'the pool-deck check'};
const oldLine=rows=>!rows||!rows.length?'':rows[0]==='earlier'?'This layout is from an earlier set of layouts.':`This layout fails ${rows.map(r=>ROWW[r]||r).join(' and ')}.`;
const badOf=p=>!p||p.board?null:(oldRows(p.plan)||(p.oldLibrary?['earlier']:null));        
async function pickBest(e){ await oldF(); const all=allOf(e), ok=all.filter(p=>!badOf(p));
  if(BD.f1pick3&&BD.f1pick3.okIdx){ const f=ok.filter(BD.f1pick3.okIdx).filter(p=>!/^board/.test(p.plan||'')||p===e.best); if(f.length&&!(e.best&&e.best.board)) return {p:f.slice().sort((a,b)=>(+b.MW||0)-(+a.MW||0))[0],pulled:all.length-ok.length}; }    
  if(!badOf(e.best)) return {p:e.best,pulled:0};
  if(ok.length) return {p:ok.slice().sort((a,b)=>(+b.MW||0)-(+a.MW||0))[0],pulled:all.length-ok.length};
  return {p:Object.assign({},e.best,{old:badOf(e.best)}),pulled:0}; }
async function forLot(x){ const lot=x&&x.sel&&String(x.sel.id); if(!lot||(x.city!=='van'&&x.city!=='edm')) return {source:'rough',label:'rough size, no plan index for this city yet'};
  if(x.city==='edm'&&current(lot)){ let ch=null; try{ ch=BD.f1pick3&&BD.f1pick3.chosen?await BD.f1pick3.chosen(x,{raw:true}):null; }catch(e){}
    if(ch){ const I=await index('edm'), e=I&&I.index&&I.index[lot], r=e&&[e.best,...(e.alternatives||[])].filter(Boolean).find(p=>p.plan===ch.id)||{}; await oldF(); const od=oldRows(ch.id); return Object.assign({},r,{source:'chosen',edm:true,plan:ch.id,typology:ch.typology,MW:+ch.MW,storeys:(ch.storeys||[]).length,label:`your chosen layout (current library): ${TN(ch.typology)}`},od?{old:od}:{}); } }
  if(x.city==='edm'){ const I=await index('edm'), e=I&&I.index&&I.index[lot];    
    if(e&&e.status==='plan fits'&&e.best){ const B=(await pickBest(e)).p; return Object.assign({source:'best',edm:true,label:`${(BD.f1hc?BD.f1hc():'the highest-capacity layout for your filters')}: ${TN(B.typology)}`},B); }
    return {source:'rough',label:'rough size, no layout fits this lot (current library)'}; }
  let ch=null; try{ ch=BD.f1pick3&&BD.f1pick3.chosen?await BD.f1pick3.chosen(x,{raw:true}):null; }catch(e){}
  if(ch){ const s1=(ch.storeys||[]).find(s=>s.st===1); const fp=s1?(s1.zones||[]).reduce((a,z)=>a+(+z.area||0),0):null; const gens=(ch.plant||[]).filter(q=>/gen/i.test(q.kind||q.name||q.type||'')).length||null;
    await oldF(); const od=oldRows(ch.id); return Object.assign({source:'chosen',plan:ch.id,typology:ch.typology,MW:+ch.MW,footprintM2:fp,storeys:(ch.storeys||[]).length,generators:gens,label:`your chosen layout: ${TN(ch.typology)}`},od?{old:od}:{}); }
  const I=await index('van'), e=I&&I.index&&I.index[lot];
  if(e&&e.status==='plan fits'&&e.best){ const B=(await pickBest(e)).p; return Object.assign({source:'best',label:B.board?`the reference layout for this lot: ${TN(B.typology)}`:`${(BD.f1hc?BD.f1hc():'the highest-capacity layout for your filters')}: ${TN(B.typology)}`},B); }
  return {source:'rough',label:'rough size, no layout fits this lot'}; }
const n0=v=>Math.round(+v||0).toLocaleString('en-CA');
function line(b){ if(!b) return ''; if(b.source==='rough') return `Sized as a rough size: no layout fits this lot.`;
  const d=[b.storeys?`${b.storeys} storeys`:'',b.footprintM2?`${n0(b.footprintM2)} m² on storey 1`:'',genLine(b),refugeLine(b)].filter(Boolean).join(', ');
  return `Sized at ${(+b.MW).toFixed(2)} MW of servers, from ${b.label}${d?` (${d})`:''}.`; }
 
let PL=null; const plants=async()=>{ if(PL!==null) return PL; try{ const r=await fetch((BD.ASSET_BASE||'')+'f1/plant_van.json'); PL=r.ok?await r.json():false; }catch(e){ PL=false; } return PL; };
async function noisePlan(b,lot){ if(!b||b.source==='rough'||!b.plan||away(b.plan,lot)) return null;     const P=await plants(), e=P&&P.plans&&P.plans[b.plan];
  if(!e||!(e.plant||[]).some(q=>!q.roof)) return null; return Object.assign({lot:String(lot),id:b.plan,plant:e.plant},e.origin?{origin:e.origin}:{}); }
 
const PF={}; const getJ=u=>PF[u]||(PF[u]=fetch((BD.ASSET_BASE||'')+u).then(r=>r.ok?r.json():null).catch(()=>null));
async function planData(b,x){ if(!b||b.source==='rough'||!b.plan) return null;
  if(b.source==='chosen'&&BD.f1pick3&&BD.f1pick3.chosen&&!(x&&x.city==='edm')){ try{ const c=await BD.f1pick3.chosen(x,{raw:true}); if(c) return c; }catch(e){} }    
  if(/^board 63819485$/.test(b.plan)||/^V339board/.test(b.plan)) return await getJ('f1/l3/plan339.json');
  const m=/^V339/.test(b.plan)?['','63819485']:String(b.plan).match(/^L?(\d{8})_/); if(!m) return null;    
  const D=await getJ('f1/plans/van_'+m[1]+'.json'); return D&&(D.plans||[]).find(p=>p.id===b.plan)||null; }
 
async function layoutGen(b){ if(!b||b.source==='rough'||!b.plan) return null; const P=await plants(), e=P&&P.plans&&P.plans[b.plan];
   
  const u=(b.generatorUnits||[])[0], R=b.refugeGenerator; if(u&&u.n) return {gen:{n:u.n,kw:u.kW,model:u.model||null},hub:R&&R.kW?{kw:R.kW,model:R.model||null,n:R.n||1}:(e&&e.hub)||null,id:b.plan};
  return e&&e.gen?{gen:e.gen,hub:e.hub||null,id:b.plan}:null; }
 
async function rec(b,x){ if(!b||b.source==='rough'||!b.plan) return null; if(b.heatDemandPublicMWhYr) return b; const I=await index(x&&x.city), e=I&&I.index&&I.index[String(x&&x.sel&&x.sel.id)];
  return e&&[e.best,...(e.alternatives||[])].filter(Boolean).find(p=>p.plan===b.plan)||null; }
 
async function ownHeat(b,x){ const r=await rec(b,x), h=r&&r.heatDemandPublicMWhYr, t=b&&b.typology; if(!h||!/community_pool|warm_bath|heat_cascade|aquaponics|conservatory|emergency_hub|shelter_laundry|food_hub/.test(t||'')) return '';
  const rg=h[0]===h[1]?n0(h[0]):`${n0(h[0])} to ${n0(h[1])}`;
  if(/emergency_hub|shelter_laundry|food_hub/.test(t)) return `This layout’s public floors (${t==='emergency_hub'?'refuge, clinic and staff rooms':t==='shelter_laundry'?'day shelter and laundry':'teaching kitchen and pantry'}) use about ${rg} MWh of heat a year.`;    
   
  if(t==='heat_cascade') return /earlier/.test('earlier')&&!r.rebuilt?'This layout’s own heat use (spa and public floors) has no figure yet.':`This layout’s spa and public floors use at least ${rg} MWh of heat a year: evaporation only.`;    
  if(t==='aquaponics') return `This layout’s public floors use about ${rg} MWh of heat a year, not counting the fish hall.`;
  if(t==='conservatory') return `This layout’s conservatory uses about ${rg} MWh of heat a year: an estimate scaled by climate.`;
  return t==='community_pool'?`This layout’s pool uses about ${rg} MWh of heat a year: heat for the pool water only.`:`This layout’s warm bath uses about ${rg} MWh of heat a year: heat for the spa hall only.`; }
 
const genLine=b=>{ const u=(b&&b.generatorUnits||[])[0]; return u&&u.n?`${u.n} × ${Math.round(u.kW).toLocaleString('en-CA')} kW diesel generators`:(b&&b.generators?`${b.generators} generators`:''); };    
const refugeLine=b=>{ const R=b&&b.refugeGenerator; return R&&R.kW?`Refuge generator (72 h), ${Math.round(R.kW).toLocaleString('en-CA')} kW`:''; };
 
const SK=l=>'bd-plan-'+l;
function current(lot){ lot=String(lot||''); const L=BD.S&&BD.S.layout; if(L&&L.lot===lot) return L.id||null; try{ return sessionStorage.getItem(SK(lot)); }catch(e){ return null; } }
const TPLQ={engineering:'eng',architecture:'arch',municipal:'muni',resident:'res'};
function urlWrite(lot,id,push){ try{ const u=new URL(location.href), s=BD.S.sel, t=BD.f1&&BD.f1.cur&&BD.f1.cur();
    if(t&&TPLQ[t]) u.searchParams.set('open',TPLQ[t]); if(s&&s.city) u.searchParams.set('city',s.city); u.searchParams.set('lot',lot);
    const a=s&&s.a&&s.a[0]; if(a&&!u.searchParams.get('addr')) u.searchParams.set('addr',a); else if(a&&String(u.searchParams.get('lot'))!==lot) u.searchParams.set('addr',a);
    id?u.searchParams.set('layout',id):u.searchParams.delete('layout'); u.searchParams.delete('card'); u.searchParams.delete('x');
    if(u.href!==location.href) history[push?'pushState':'replaceState']({bdLayout:{lot,id:id||null}},'',u.href); }catch(e){} }
function setCurrent(lot,id,o){ o=o||{}; lot=String(lot); id=id||null; const was=current(lot), had=!!(BD.S.layout&&BD.S.layout.lot===lot); BD.S.layout={lot,id};
  try{ id?sessionStorage.setItem(SK(lot),id):sessionStorage.removeItem(SK(lot)); }catch(e){}
  if(!o.noUrl) urlWrite(lot,id,!!o.push);
  if(was!==id||!had){ if(BD.f1cards&&BD.f1cards.engReset) BD.f1cards.engReset(); try{ document.dispatchEvent(new CustomEvent('bd-layout',{detail:{lot,id}})); }catch(e){} } }
 
function onLot(sel){ if(!sel) return; const lot=String(sel.id); let q=null; try{ q=new URLSearchParams(location.search); }catch(e){}
  const ul=q&&q.get('layout'), uLot=q&&q.get('lot');
  if(ul&&(!uLot||uLot===lot)) return setCurrent(lot,ul,{});    
  const L=BD.S.layout; if(L&&L.lot===lot) return;
  setCurrent(lot,null,{noUrl:!(q&&(q.get('layout')||q.get('lot')))}); }
 
window.addEventListener('popstate',()=>{ const s=BD.S&&BD.S.sel; if(!s) return; let q=null; try{ q=new URLSearchParams(location.search); }catch(e){ return; }
  const uLot=q.get('lot'); if(uLot&&uLot!==String(s.id)) return; const id=q.get('layout')||null; if(current(s.id)===id&&BD.S.layout&&BD.S.layout.lot===String(s.id)) return;
  setCurrent(s.id,id,{noUrl:true}); if(BD.f1&&BD.f1.redraw) BD.f1.redraw(); });
 
async function sizedLine(x){ const b=await forLot(x); if(!b) return ''; const lost=b.source!=='chosen'&&current(x.sel&&x.sel.id)?'. The linked layout is not in the tool, so the cards use this one':'';
  if(b.source==='rough') return 'Sized from: a rough size, no layout fits this lot'+lost;
  return `Sized from: ${TN(b.typology)}${b.storeys?`, ${b.storeys} storeys`:''}, ${(+b.MW).toFixed(2)} MW${b.source==='chosen'?' (your pick)':b.board?' (the reference layout)':' ('+(BD.f1hc?BD.f1hc():'the highest-capacity layout for your filters')+')'}${lost}${b.old?'. '+oldLine(b.old):''}`; }
function change(){ const s=BD.S.sel; if(!s||!BD.f1||!BD.f1.openLot) return; const addr=(s.a&&s.a[0])||'';
  Promise.resolve(BD.f1.openLot('architecture',s.city,s.id,addr)).then(()=>{ let m=0; const go=()=>{ const b=[...document.querySelectorAll('#f1v .f1v-strip button')].find(e=>/available (plans|layouts)/i.test(e.textContent)); if(b) b.click(); else if(++m<100) setTimeout(go,100); }; setTimeout(go,200); }); }
const hasEdm=async()=>!!(BD.f1edm&&await BD.f1edm.data());    
BD.f1best={allOf,hasEdm,forLot,line,index,noisePlan,planData,layoutGen,current,setCurrent,onLot,sizedLine,change,oldF,oldRows,oldLine,away,genLine,refugeLine,rec,ownHeat};
})();

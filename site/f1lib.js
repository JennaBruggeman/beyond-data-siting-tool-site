 
(function(){
const BD=window.BD; const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const n0=v=>v==null?'?':Math.round(v).toLocaleString('en-CA'), n2=v=>v==null?'?':(+v).toFixed(2);
const GRP=[['hall','Data hall','#BCCDE4'],['sup','Data-centre support','#9FB6D6'],['load','Loading','#C9D6E8'],['pub','Public programs','#CFE0CB'],['clin','Clinic','#A9C9A3'],['plant','Plant','#DCDBD6'],['circ','Circulation (corridors, lobbies, lifts, vestibules)','#E6E9EF'],['core','Stairs and shafts','#C9CED9'],['spare','Data-centre support','#F7F7F5']];
const GN=Object.fromEntries(GRP.map(g=>[g[0],g])), ra=rm=>rm.r.reduce((t,r)=>t+(r[1]-r[0])*(r[3]-r[2]),0);
let LIB=null, TYP=null;
async function typologies(){ if(TYP) return TYP; try{ TYP=(await BD.getJSON('data/typologies.json')).list||[]; }catch(e){ TYP=[]; } return TYP; }
 
const USE2G={pub:'pub',clin:'clin',grow:'pub',gym:'pub',sup:'sup',hall:'hall',load:'load',plant:'plant',circ:'circ',spare:'spare'};
 
 
let ADDR={}; const tcase=s=>String(s||'').toLowerCase().replace(/\b([a-z])/g,(m,a)=>a.toUpperCase()).replace(/(\d)(St|Nd|Rd|Th)\b/g,(m,d,q)=>d+q.toLowerCase()).replace(/\b(Sw|Se|Nw|Ne)\b/g,m=>m.toUpperCase());
function placeOf(p){ if(p.addr) return tcase(p.addr)+', '+(p.city==='edm'?'Edmonton':'Vancouver');    
  const id=String(p.id), m=id.match(/^L(\d+)_/); if(m&&ADDR[m[1]]) return tcase(ADDR[m[1]])+', Vancouver'; if(/^[PV]339/.test(id)) return '339 1st Ave E, Vancouver'; if(p.city==='edm'||/^E\d/.test(id)) return 'Edmonton'; return p.city==='van'?'Vancouver':'Vancouver or Edmonton'; }
function fromExport(j,TN){ return (j.plans||[]).filter(p=>p.status?p.status==='no fail':p.admitted).map(p=>{ const S={}, X={}, H=[], ZB={}; for(const s of p.storeys||[]){ H.push(s.h); X[s.st]={roof:s.roof||[],open:s.open||[]}; if(s.zones) (ZB[s.st]=s.zones);
      S[s.st]=(s.rooms||[]).map(r=>({id:r.id,n:String(r.name||r.id).replace(/;\s*J\.B\.[^)]*/,'').replace(/\s*\(was:[^)]*\)/,''),     g:USE2G[r.use]||'spare',r:r.rects||[],role:r.role===undefined?null:r.role,fromExport:true,stair:r.role==='stair',wet:!!r.wet})); }
    const nm=TN[p.typology]||p.typology; return {id:'lib_'+p.id,typology:p.typology,name:nm,place:placeOf(p),city:p.city,source:'the layout library (a layout that passed the library’s checks)',MW:p.MW,H,S,X,Z:Object.keys(ZB).length?ZB:null,tags:p.tags?{security:p.tags.security,density:p.tags.density||p.tags.building,rack:p.tags.rack}:null,    D:[],rows:[],yardPlant:(p.plant||[]).length,noGeom:/not published/i.test(String(p.geometry||''))||!(p.storeys||[]).some(s=>(s.zones||[]).some(z=>(z.rects||[]).length||(z.rings||[]).length))}; }); }
async function library(){ if(LIB) return LIB; let V=null; try{ const ad=await BD.getJSON('f1/lotaddr_van.json').catch(()=>null); if(ad&&ad.addr) ADDR=ad.addr; }catch(e){} try{ const j=await BD.getJSON('data/library.json'); if(j&&j.plans){ const TN=Object.fromEntries((await typologies()).map(t=>[t.id,t.name])); V=fromExport(j,TN).filter(v=>!(window.BD_PUBLIC&&v.city==='edm')); LIB={variants:V,sample:false,source:'the layout library'}; } else { V=j&&j.variants; if(V) LIB={variants:V,sample:false,source:'data/library.json'}; } }catch(e){}
   
  let EXP=null; if(LIB&&LIB.variants&&LIB.source==='the layout library'&&!LIB.variants.some(v=>v.typology==='emergency_hub')){ EXP=LIB.variants; LIB=null; }
  if(!LIB){ V=[]; for(const city of (window.BD_PUBLIC?['van']:['van','edm'])){ try{ let j=null; const one=BD.hub&&BD.hub.boardsOf?BD.hub.boardsOf(city):null; j=one?{boards:one}:await BD.getJSON(`data/hub_frozen_${city}.json`);         for(const [id,b] of Object.entries((j&&j.boards)||{})){ if((b.rows||[]).some(r=>r[0]==='fail')) continue;     V.push({id:`hub_${city}_${b.key||id}`,typology:'emergency_hub',name:'Emergency hub',city,source:'an Emergency hub plan checked by the tool',MW:b.MW,H:b.H,S:b.S,D:b.D||[],rows:b.rows||[]}); } }catch(e){} }
    LIB=EXP?{variants:EXP.concat(V),sample:false,source:'the layout library and the Emergency hub layouts checked on the example lots'}:{variants:V,sample:true,source:'the Emergency hub layouts tested on the example lots; more typologies are added as their layouts pass the checks'}; }
  return LIB; }
 
function ratio(v){ const by={}; let tot=0; const F=BD.f1plans; for(const st in v.S) for(const rm of v.S[st]){ const a=ra(rm); let g=GN[rm.g]?rm.g:'spare'; if(F&&F.isCirc){ if(F.isCirc(rm)) g='circ'; else if(g==='circ') g=rm.stair||(F.isShaft&&F.isShaft(rm))?'core':'circ'; } by[g]=(by[g]||0)+a; tot+=a; } return {by,tot}; }
 
const GC=g=>{ const T=BD.TOK; return (T&&({hall:T.hall,sup:T.dcSupport,load:T.loading,pub:T.pubProgram,clin:T.pubProgram,plant:T.plant,circ:T.pubCirc,core:T.pubCore,spare:T.unassigned}[g[0]]))||g[2]; };
function ratioBar(v,w){ const R0=ratio(v), by=Object.assign({},R0.by), tot=R0.tot; if(by.clin){ by.pub=(by.pub||0)+by.clin; delete by.clin; } w=w||300; let x=0; const segs=GRP.filter(g=>by[g[0]]>0).map(g=>{ const ww=by[g[0]]/tot*w, s=`<rect x="${x.toFixed(1)}" y="0" width="${Math.max(.5,ww).toFixed(1)}" height="14" fill="${GC(g)}" stroke="#1E2A47" stroke-width=".5"><title>${esc(g[1])}: ${n0(by[g[0]])} m² (${Math.round(by[g[0]]/tot*100)} %)</title></rect>`; x+=ww; return s; }).join('');
  const lab=GRP.filter(g=>by[g[0]]>0).map(g=>`<span><i style="background:${GC(g)}"></i>${esc(g[0]==='pub'?'Public program':g[1])} ${Math.round(by[g[0]]/tot*100)} %</span>`).join('');
  return `<div class="f1lib-ratio"><div class="tot"><b>${n0(tot)} m²</b> floor area, all storeys</div><svg width="${w}" height="14" viewBox="0 0 ${w} 14" role="img" aria-label="Floor area by program use">${segs}</svg><div class="lab">${lab}</div><div class="lab" style="margin-top:2px">Yard plant (generators, chillers, transformers at grade) is not counted: it is not floor area.</div></div>`; }
 
 
function zoneStoreys(v){ const sts=Object.keys(v.S||{}).map(Number).sort((a,b)=>a-b); let z=0; const MAP={hall:'hall',dc:'dc',clinic:'clinic',public:'public',circulation:'circulation','core-public':'core-public','core-dc':'core-dc',loading:'loading',plant:'plant',unassigned:'unassigned','public-program':'public-program','public-support':'public-support','shell-dc':'shell-dc','heat-recovery':'dc','circulation-dc':'circ-dc','circ-dc':'circ-dc','circ-pub':'circ-pub'};    
  return sts.map((st,i)=>{ const h=(v.H&&v.H[i])||4, z0=z; z+=h; const ZZ=v.Z&&(v.Z[st]||v.Z[String(st)]); let zones;
    if(ZZ&&ZZ.length) zones=ZZ.map(b=>({zone:MAP[b.zone]||'unassigned',rects:b.rects||[]}));
    else { const by={}; const g2z={hall:'hall',sup:'dc',load:'loading',pub:'public',grow:'public',gym:'public',clin:'clinic',plant:'plant',circ:'circulation',spare:'unassigned'}; for(const rm of v.S[st]) (by[g2z[rm.g]||'unassigned']=by[g2z[rm.g]||'unassigned']||[]).push(...(rm.r||[])); zones=Object.entries(by).map(([zone,rects])=>({zone,rects})); }
    return {st,z0,z1:z,zones}; }); }
function axo(v,W,H){ if(BD.f1mass) return `<div class="f1lib-axo" style="height:${H||200}px;box-sizing:border-box;padding:${Math.round((H||200)*0.08)}px 8%;overflow:hidden;display:flex;align-items:center;justify-content:center">${BD.f1mass.render(zoneStoreys(v),{typology:v.typology,k:3,label:'The plan’s massing, from its zones'}).replace('<svg ','<svg style="width:100%;height:100%;display:block" ')}</div>`; W=W||300; H=H||200; const sts=Object.keys(v.S).map(Number).sort((a,b)=>a-b), Z={}; let z=0; sts.forEach((st,i)=>{ Z[st]=z; z+=(v.H&&v.H[i])||4; });
  const C=Math.cos(Math.PI/6), S=.5, P=(x,y,zz)=>[(x-y)*C,-(x+y)*S-zz]; const pts=[]; for(const st of sts) for(const rm of v.S[st]) for(const r of rm.r){ pts.push(P(r[0],r[2],Z[st]),P(r[1],r[3],Z[st]),P(r[1],r[2],Z[st]+((v.H||[])[sts.indexOf(st)]||4)),P(r[0],r[3],Z[st])); }
  if(!pts.length) return ''; const x0=Math.min(...pts.map(p=>p[0])), x1=Math.max(...pts.map(p=>p[0])), y0=Math.min(...pts.map(p=>p[1])), y1=Math.max(...pts.map(p=>p[1])), k=Math.min((W-16)/(x1-x0),(H-16)/(y1-y0));
  const Q=(x,y,zz)=>{ const p=P(x,y,zz); return [8+(p[0]-x0)*k,8+(p[1]-y0)*k]; }, pl=(a,f,s)=>`<path d="M${a.map(q=>q[0].toFixed(1)+' '+q[1].toFixed(1)).join('L')}Z" fill="${f}" stroke="${s||'#1E2A47'}" stroke-width=".6" stroke-linejoin="round"/>`;
  const boxes=[]; sts.forEach((st,i)=>{ const h=(v.H&&v.H[i])||4; for(const rm of v.S[st]) for(const r of rm.r) boxes.push({r,z0:Z[st],z1:Z[st]+h,c:(GN[rm.g]||GN.spare)[2]}); });
  boxes.sort((a,b)=>(a.z0-b.z0)||((b.r[0]+b.r[2])-(a.r[0]+a.r[2])));
  const shade=(hex,f)=>{ const n=parseInt(hex.slice(1),16), c=[n>>16,(n>>8)&255,n&255].map(x=>Math.round(x*f)); return '#'+c.map(x=>x.toString(16).padStart(2,'0')).join(''); };
  let s=''; for(const b of boxes){ const [a0,a1,b0,b1]=b.r; s+=pl([Q(a0,b0,b.z0),Q(a1,b0,b.z0),Q(a1,b0,b.z1),Q(a0,b0,b.z1)],shade(b.c,.86))+pl([Q(a0,b0,b.z0),Q(a0,b1,b.z0),Q(a0,b1,b.z1),Q(a0,b0,b.z1)],shade(b.c,.93))+pl([Q(a0,b0,b.z1),Q(a1,b0,b.z1),Q(a1,b1,b.z1),Q(a0,b1,b.z1)],b.c); }
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(v.name)}: massing by program use">${s}</svg>`; }
const CSS=`
#f1lib{position:fixed;inset:0;z-index:2050;background:var(--f-bg,#fff);color:var(--f-ink,#16181B);font-family:var(--f-font,'IBM Plex Sans',sans-serif);font-size:14px;line-height:1.45;overflow:auto}
#f1lib .f1v-head{position:sticky;top:0;background:var(--f-bg,#fff);z-index:2}#f1lib main{display:block!important;max-width:1280px;margin:0 auto;padding:24px 40px 60px}
#f1lib h1{font-size:30px;font-weight:300;margin:6px 0 8px}#f1lib .ld{max-width:760px;color:var(--f-ink2,#4A4D52)}#f1lib .crumb{font-size:13px;margin:4px 0 8px}#f1lib .crumb button{font:inherit;background:none;border:0;border-bottom:1px solid currentColor;padding:0;cursor:pointer}
#f1lib .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;margin-top:18px}
#f1lib .tile{display:flex;flex-direction:column;align-items:stretch;gap:4px;border:1px solid var(--f-rule,#DDDEDF);padding:14px;background:#fff;cursor:pointer;text-align:left;font:inherit;color:inherit;min-width:0}#f1lib .tile svg{max-width:100%;height:auto}#f1lib section>svg{max-width:100%;height:auto}#f1lib .tile:hover{border-color:#1E2A47}
#f1lib .tile h3{font-size:17px;font-weight:500;margin:0 0 4px}#f1lib .tile p{margin:0 0 6px;font-size:13px;color:var(--f-ink2,#4A4D52)}#f1lib .tile .n{font-size:12.5px;color:var(--f-mute,#66696E)}
#f1lib .f1lib-ratio{margin-top:8px}#f1lib .f1lib-ratio .tot{font-size:13px;margin-bottom:4px}#f1lib .f1lib-ratio .lab{display:flex;flex-wrap:wrap;gap:4px 10px;font-size:12px;color:var(--f-ink2,#4A4D52);margin-top:4px}#f1lib .f1lib-ratio i{display:inline-block;width:10px;height:10px;border:1px solid #1E2A47;margin-right:4px;vertical-align:-1px}
#f1lib .sample{display:inline-block;font-size:12.5px;border:1px solid var(--f-rule,#DDDEDF);padding:6px 10px;margin:4px 0 6px;color:var(--f-ink2,#4A4D52)}
#f1lib section{margin-top:26px}#f1lib section h2{font-size:18px;font-weight:500;margin:0 0 8px}#f1lib table{border-collapse:collapse;width:100%;font-size:13px}#f1lib td,#f1lib th{text-align:left;padding:6px 10px 6px 0;border-bottom:1px solid #EFEFEC;vertical-align:top}#f1lib th{font-weight:400;color:var(--f-mute,#66696E)}
#f1lib .f1lib-back{margin-right:14px;text-decoration:underline;cursor:pointer}#f1lib .chip .cc{color:var(--bd-ink-3,#5E6782);margin-left:4px}#f1lib .chip[aria-pressed=true] .cc{color:inherit}#f1lib .f1lib-none{margin:8px 0 16px;color:var(--bd-ink-2,#4A5672)}
#f1lib .f1lib-fig{display:flex;flex-wrap:wrap;gap:6px 18px;align-items:baseline;padding:14px 0 4px;font-size:13px;color:var(--bd-ink-2,#4A5672)}#f1lib .f1lib-fig b{font-size:20px;font-weight:600;color:var(--bd-ink,#1E2A47)}#f1lib .f1lib-fig p{flex-basis:100%;margin:6px 0 0;font-size:12.5px;color:var(--bd-ink-3,#5E6782)}
#f1lib .plans{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:18px}#f1lib .ok{color:#2E7D4F}#f1lib .bad{color:#8A3B00}
#f1lib .ti{display:grid;grid-template-columns:minmax(300px,400px) 1fr;gap:20px 40px;align-items:start}#f1lib .ti-l{padding-top:4px}#f1lib .ti h1{font-size:36px;margin:14px 0 18px}#f1lib .ti-lead{font-size:24px;line-height:1.42;color:var(--bd-ink,#1E2A47);margin:0 0 36px;max-width:420px}
#f1lib .ti-st{display:block;margin:0 0 36px;border-top:1px solid var(--bd-rule,#D6DEEB)}#f1lib .ti-st>div{display:flex;gap:14px;align-items:center;padding:16px 0;border-bottom:1px solid var(--bd-rule,#D6DEEB)}#f1lib .ti-st dt{font-size:28px;font-weight:600;color:var(--bd-ink,#1E2A47);white-space:nowrap;font-variant-numeric:tabular-nums}#f1lib .ti-st dd{margin:0;flex:1 1 auto;display:flex;flex-direction:column;font-size:13px;color:var(--bd-ink-2,#4A5672)}#f1lib .ti-st dd b{font-size:15px;font-weight:600;color:var(--bd-ink,#1E2A47)}
#f1lib .ti-go{font:inherit;font-size:16px;font-weight:600;color:#fff;background:var(--bd-ink,#1E2A47);border:0;border-radius:2px;padding:14px 44px;min-height:48px;cursor:pointer}#f1lib .ti-go:hover{background:#3D5185}#f1lib .ti-note{font-size:12.5px;color:var(--bd-ink-3,#5E6782);max-width:400px;margin:18px 0 0}
#f1lib .ti-d{margin:0;min-width:0}#f1lib .ti-d svg{display:block;width:100%;height:auto;max-width:900px}
@media (max-width:760px){ #f1lib main{padding:16px 16px 60px} #f1lib .plans{grid-template-columns:1fr} #f1lib .ti{grid-template-columns:minmax(0,1fr);gap:0}#f1lib .ti-st>div{flex-wrap:wrap;gap:4px 14px}#f1lib .ti-st dt{font-size:24px}#f1lib .ti-st dd{min-width:0}#f1lib .ti-l{display:contents}#f1lib .ti .crumb{order:1}#f1lib .ti h1{order:2;font-size:30px;margin:8px 0 10px}#f1lib .ti-lead{order:3;font-size:20px;margin:0 0 12px}#f1lib .ti-d{order:4;margin:0 -16px}#f1lib .ti-st{order:5;margin:16px 0 20px}#f1lib .ti-go{order:6;width:100%}#f1lib .ti-note{order:7} }`;
function css(){ if(document.getElementById('f1lib-css')) return; const s=document.createElement('style'); s.id='f1lib-css'; s.textContent=CSS; document.head.appendChild(s); }
function shell(title,body){ css(); let W=document.getElementById('f1lib'); if(!W){ W=document.createElement('div'); W.id='f1lib'; W.setAttribute('role','dialog'); W.setAttribute('aria-modal','true'); document.body.appendChild(W); OPENER=document.activeElement;    
    W.addEventListener('click',e=>{ const b=e.target.closest('[data-lib]'); if(!b) return; e.preventDefault(); const [k,a]=b.dataset.lib.split('|'); if(k==='back') back(); else if(k==='close') close(); else if(k==='index') index(); else if(k==='typ') (TI()?intro(a):typology(a)); else if(k==='list') typology(a); else if(k==='var') variantPV(a); });
    W.addEventListener('keydown',e=>{ if(e.key==='Escape') close(); }); }
  W.setAttribute('aria-label',title); W.innerHTML=`<header class="f1v-head"><button class="f1v-back f1lib-back" type="button" data-lib="back">Back</button><a class="f1-app" href="#" data-lib="close">Beyond Data</a><span class="tpl">Typology library</span><span style="flex:1"></span><button class="f1v-x" data-lib="close">Close</button></header><main>${body}</main>`; W.scrollTop=0;
   
  if(!W.hasAttribute('inert')){ const h=W.querySelector('main h1'); if(h){ h.setAttribute('tabindex','-1'); try{ h.focus({preventScroll:true}); }catch(e){} } }
  return W; }
let OPENER=null, AT=['index'];    
function back(){ const a=AT; if(a[0]==='var'&&a[2]) return typology(a[2]); if(a[0]==='typ') return TI()&&a[1]?intro(a[1]):index(); if(a[0]==='intro') return index(); close(); }
 
document.addEventListener('keydown',e=>{ if(e.key!=='Escape') return; const W=document.getElementById('f1lib'); if(!W||W.hasAttribute('inert')||document.getElementById('f1i')||document.querySelector('#f1l:not(.f1i-frozen)')) return; if(W.contains(e.target)) return; close(); });
function close(){ const W=document.getElementById('f1lib'); if(W) W.remove(); const o=OPENER; OPENER=null; if(o&&o.isConnected&&o.focus){ try{ o.focus({preventScroll:true}); }catch(e){} } }
 
const mark=(typ,px)=>{ const Z=BD.f1zones; if(!Z||!Z.icon) return ''; return `<span class="f1lib-mark" aria-hidden="true"><i style="background:${Z.hueOf(typ)}"></i>${Z.icon(typ,px||20)}</span>`; };
async function index(){ AT=['index']; const [T,L]=await Promise.all([typologies(),library()]);
  shell('Typology library',`<h1>Typology library</h1><p class="ld">Each typology pairs a data centre with a public program. A variant is one tested building of that typology: laid out, checked against every hard rule, and kept only if it passed. Open a typology to see its variants.</p>${L.sample?`<div class="sample">So far: ${esc(L.source)}.</div>`:''}
   <div class="grid">${T.map(t=>{ const n=L.variants.filter(v=>v.typology===t.id).length; return `<button class="tile" data-lib="typ|${esc(t.id)}"><h3>${mark(t.id)}${esc(t.name)}</h3><p>${esc((t.programs||[]).map(p=>p.name).join(' · '))}</p><p>${esc(t.lead||'')}</p><div class="n">${n?`${n} tested variant${n===1?'':'s'}`:'no tested variant yet'}</div></button>`; }).join('')}</div>`); }
 
const TAGS=[['security','Security',[['separate','Separate entrances'],['shared','Shared entrance']]],['density','Building',[['1-3','1-3 storeys'],['4+','4+ storeys']]],['rack','Racks',[['standard','Existing average, about 8 kW'],['high','New-build, about 30 kW']]]];
const DEN={standard:'1-3',high:'4+'}, tg=(v,k)=>{ const x=v.tags&&v.tags[k]; return k==='density'?(DEN[x]||x):x; };
const tagAttrs=v=>TAGS.map(([k])=>tg(v,k)?` data-t-${k}="${esc(tg(v,k))}"`:'').join('');
function chips(V){ if(BD.F1FLAGS&&BD.F1FLAGS.libFilters===false) return ''; const cnt=(k,val)=>V.filter(v=>tg(v,k)===val).length;    
  const has=TAGS.map(([k,lab,opts])=>[k,lab,opts.filter(([val])=>cnt(k,val)>0)]).filter(([,,opts])=>opts.length);
   
  const MWs=V.map(v=>+v.MW).filter(x=>x>0), lo=MWs.length?Math.floor(Math.min(...MWs)*100)/100:null, hi=MWs.length?Math.ceil(Math.max(...MWs)*100)/100:null;
  const mwG=MWs.length>1?`<div class="cg cg-mw"><span class="cl">MW of servers</span><label class="mwl">from <input type="number" class="mwin" data-mw="lo" min="${lo}" max="${hi}" step="any" value="${lo.toFixed(2)}" inputmode="decimal" aria-label="Smallest MW"></label><label class="mwl">to <input type="number" class="mwin" data-mw="hi" min="${lo}" max="${hi}" step="any" value="${hi.toFixed(2)}" inputmode="decimal" aria-label="Largest MW"></label><label class="mwl">Sort <select class="mwsort" aria-label="Sort the layouts"><option value="">library order</option><option value="desc">MW, high to low</option><option value="asc">MW, low to high</option></select></label></div>`:'';
  if(!has.length&&!mwG) return '';
  return `<div class="f1lib-chips" role="group" aria-label="Filter the layouts"><span class="cn" aria-live="polite"></span>${has.map(([k,lab,opts])=>`<div class="cg"><span class="cl">${lab}</span><button type="button" class="chip" data-chip="${k}|" aria-pressed="true">All <span class="cc">${V.length.toLocaleString('en-CA')}</span></button>${opts.map(([val,txt])=>`<button type="button" class="chip" data-chip="${k}|${val}" aria-pressed="false">${txt} <span class="cc">${cnt(k,val).toLocaleString('en-CA')}</span></button>`).join('')}</div>`).join('')}${mwG}</div><p class="f1lib-none" hidden>No layout has all of these. Choose All in a group, or widen the MW range, to see more.</p>`; }
function wireChips(W){ const bar=W&&W.querySelector('.f1lib-chips'); if(!bar) return; const sel={}; if(bar.querySelector('[data-chip="density|1-3"]')){ sel.density='1-3'; bar.querySelectorAll('[data-chip^="density|"]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.chip==='density|1-3'))); }    
  const grid=W.querySelector('.grid'); if(grid) [...grid.children].forEach((t,i)=>{ t.dataset.i=i; });
  const num=k=>{ const el=bar.querySelector(`.mwin[data-mw="${k}"]`); const x=el?parseFloat(el.value):NaN; return isFinite(x)?x:null; };
  const sortT=()=>{ const sv=bar.querySelector('.mwsort'), m=sv?sv.value:''; if(!grid) return; const T=[...grid.querySelectorAll('.tile')]; T.sort((a,b)=>m==='desc'?(+b.dataset.mw-+a.dataset.mw)||(a.dataset.i-b.dataset.i):m==='asc'?(+a.dataset.mw-+b.dataset.mw)||(a.dataset.i-b.dataset.i):a.dataset.i-b.dataset.i); T.forEach(t=>grid.appendChild(t)); };
  const apply=()=>{ let n=0; const lo=num('lo'), hi=num('hi'); W.querySelectorAll('.grid .tile').forEach(t=>{ const mw=+t.dataset.mw; const ok=Object.entries(sel).every(([k,v])=>!v||t.getAttribute('data-t-'+k)===v)&&(lo==null||!(mw>0)||mw>=lo-1e-9)&&(hi==null||!(mw>0)||mw<=hi+1e-9); t.hidden=!ok; if(ok) n++; }); bar.querySelector('.cn').textContent=`${n.toLocaleString('en-CA')} layout${n===1?'':'s'}`; const no=W.querySelector('.f1lib-none'); if(no) no.hidden=n>0; };
  bar.addEventListener('click',e=>{ const b=e.target.closest('[data-chip]'); if(!b) return; const [k,v]=b.dataset.chip.split('|'); sel[k]=v||null; bar.querySelectorAll(`[data-chip^="${k}|"]`).forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.chip===k+'|'+(sel[k]||''))));     apply(); });
  bar.querySelectorAll('.mwin').forEach(el=>el.addEventListener('input',apply)); const so=bar.querySelector('.mwsort'); if(so) so.addEventListener('change',sortT); apply(); }
 
const zoneFig=v=>{ const by={}; let tot=0, pub=0; for(const zs of Object.values(v.Z||{})) for(const z of zs||[]){ const a=+z.area||0; tot+=a; if(/^public/.test(z.zone||'')) pub+=a; const k=z.label||z.zone; by[k]=(by[k]||0)+a; } return {by,tot,pub}; };
const figCard=v=>{ const F=zoneFig(v); return `<div class="f1lib-fig"><div><b>${n0(F.tot)}</b> m² of floor</div><div><b>${F.tot?Math.round(F.pub/F.tot*100):0} %</b> public</div><div><b>${Object.keys(v.Z||v.S||{}).length}</b> storeys</div><p>Edmonton layout: figures only. Its drawing is not published.</p></div>`; };
let TTL={}; const vTitle=v=>[`${Object.keys(v.S).length} storey${Object.keys(v.S).length===1?'':'s'}`,`${n2(v.MW)} MW`].concat(v.tags&&v.tags.security?[v.tags.security==='shared'?'shared entrance':'separate entrances']:[]).map(t=>t.replace(/ /g,' ')).join(' · ');    
function titles(V){ const lotOf=v=>String(v.id).replace(/^lib_/,'').split('_')[0], g={}, out={}; V.forEach(v=>{ const k=lotOf(v)+'|'+vTitle(v); (g[k]=g[k]||[]).push(v); });
  for(const a of Object.values(g)) a.forEach((v,i)=>{ out[v.id]=vTitle(v)+(a.length>1?` · layout ${String.fromCharCode(65+i)}`:''); }); return out; }
 
const TI=()=>{ try{ if(/[?&]typointro=off\b/.test(location.search)) return false; }catch(e){} return !(BD.F1FLAGS&&BD.F1FLAGS.typoIntro===false); };
let TIM=null, COVL=null; const TISVG={};
const phone=()=>{ try{ return matchMedia('(max-width:760px)').matches; }catch(e){ return false; } };
async function tiDraw(id,w){ const k=id+'_'+w; if(TISVG[k]!=null) return TISVG[k]; try{ const r=await fetch((BD.ASSET_BASE||'')+'f1/typo/'+k+'.svg'); TISVG[k]=r.ok?await r.text():''; }catch(e){ TISVG[k]=''; } if(!/^\s*<svg[\s>]/.test(TISVG[k])) TISVG[k]=''; return TISVG[k]; }
async function intro(id){ if(!TI()) return typology(id); AT=['intro',id]; const [T,L]=await Promise.all([typologies(),library()]), t=T.find(x=>x.id===id)||{name:id};
  if(!TIM) TIM=await BD.getJSON('f1/typo/typo_intro.json').catch(()=>({pages:{}})); if(!COVL) COVL=await BD.getJSON('data/coverage_public.json').catch(()=>({}));
  const M=(TIM.pages||{})[id]||{}, w=phone()?390:1440, svg=await tiDraw(id,w);
  if(AT[0]!=='intro'||AT[1]!==id) return;    
  const V=L.variants.filter(v=>v.typology===id&&tg(v,'density')==='1-3'), MWs=V.map(v=>+v.MW).filter(x=>x>0);
  const lots=c=>{ const b=COVL&&COVL[c]&&COVL[c].byDensity&&COVL[c].byDensity['1-3']; const n=b&&b.byTypology?b.byTypology[id]:null; return n==null?null:n; };
  const lv=lots('van'), le=lots('edm'), nf=x=>x==null?'–':Number(x).toLocaleString('en-CA');
  const st=[[nf(V.length),'variants','tested buildings of this typology, at 1-3 storeys'],
    [`${nf(lv)} · ${nf(le)}`,'lots it fits','Vancouver · Edmonton, at 1-3 storeys'],
    [MWs.length?`${Math.min(...MWs).toFixed(2)} to ${Math.max(...MWs).toFixed(2)} MW`:'–','server power','at 1-3 storeys']];
  const lead=M.lead||t.lead||'';
  const W=shell(t.name,`<div class="ti"><div class="ti-l"><div class="crumb"><button data-lib="index">Typology library</button></div><h1>${mark(id,26)}${esc(M.title||t.name)}</h1><p class="ti-lead">${esc(lead)}</p>
    <dl class="ti-st">${st.map(([v,l,d])=>`<div><dt>${esc(v)}</dt><dd><b>${esc(l)}</b><span>${esc(d)}</span></dd></div>`).join('')}</dl>
    <button type="button" class="ti-go" data-lib="list|${esc(id)}">See the variants</button>
    <p class="ti-note">Counts for 1-3 storeys, the list’s first filter. The drawing is schematic: people, furniture and where rooms sit are drawn, not data.</p></div>
    <figure class="ti-d" data-ti="${w}">${svg?svg.replace('<svg ','<svg aria-label="'+esc((M.title||t.name)+': '+lead+(M.closeup?' Close-up: '+M.closeup+'.':''))+'" '):'<p class="ld">The drawing for this typology is not in the tool yet.</p>'}</figure></div>`);
  try{ const g=W.querySelector('.ti-d>svg'); if(g){ const bb=g.getBBox(), vb=g.viewBox.baseVal, pad=12; if(bb&&bb.width>50&&bb.height>50){ const x0=Math.max(vb.x,bb.x-pad), y0=Math.max(vb.y,bb.y-pad), x1=Math.min(vb.x+vb.width,bb.x+bb.width+pad), y1=Math.min(vb.y+vb.height,bb.y+bb.height+pad); g.setAttribute('viewBox',`${x0} ${y0} ${x1-x0} ${y1-y0}`); } } }catch(e){}
   
  if(!TI.rs){ TI.rs=true; let tm=null; addEventListener('resize',()=>{ clearTimeout(tm); tm=setTimeout(()=>{ const f=document.querySelector('#f1lib .ti-d'); if(f&&AT[0]==='intro'&&+f.dataset.ti!==(phone()?390:1440)) intro(AT[1]); },200); }); }
  return W; }
async function typology(id){ AT=['typ',id]; const [T,L]=await Promise.all([typologies(),library()]), t=T.find(x=>x.id===id)||{name:id}, V=L.variants.filter(v=>v.typology===id);
  shell(t.name,`<div class="crumb"><button data-lib="index">Typology library</button>${TI()?` <span aria-hidden="true">›</span> <button data-lib="typ|${esc(id)}">${esc(t.name)}</button>`:''}</div><h1>${mark(id,26)}${esc(t.name)}</h1><p class="ld">${esc(t.lead||'')}</p>${L.sample?`<div class="sample">So far: ${esc(L.source)}.</div>`:''}
   ${chips(V)}${V.length?`<div class="grid">${(TTL=titles(V),V).map(v=>`<button class="tile" data-lib="var|${esc(v.id)}" data-mw="${+v.MW||0}"${tagAttrs(v)}><h3>${mark(v.typology,18)}${esc(TTL[v.id]||vTitle(v))}</h3>${v.noGeom?figCard(v):axo(v,300,190)+ratioBar(v,250)}</button>`).join('')}</div>`:'<p class="ld">No tested variant of this typology yet.</p>'}`); wireChips(document.getElementById('f1lib')); }
async function variant(id){ const L=await library(), v=L.variants.find(x=>x.id===id); if(!v) return index(); AT=['var',id,v.typology];
  if(v.noGeom){ const F=zoneFig(v), T=(await typologies()).find(x=>x.id===v.typology)||{}, vt=`${v.name} · ${(TTL[v.id]||vTitle(v))}`;    
    return shell(vt,`<div class="crumb"><button data-lib="index">Typology library</button> · <button data-lib="list|${esc(v.typology)}">${esc(T.name||v.typology)}</button></div><h1>${esc(vt)}</h1><p class="ld">An Edmonton layout: its figures only. The layout drawing is not published for Edmonton.</p>${figCard(v)}<section><h2>Floor area by zone</h2><table>${Object.entries(F.by).sort((a,b)=>b[1]-a[1]).map(([k,a])=>`<tr><td>${esc(k)}</td><td style="text-align:right">${n0(a)} m²</td><td style="text-align:right">${F.tot?(a/F.tot*100).toFixed(1):0} %</td></tr>`).join('')}</table></section>`); } const F=BD.f1plans, sts=Object.keys(v.S).map(Number).sort((a,b)=>a-b), G={S:v.S,D:v.D||[],X:v.X,Z:v.Z}, LL={G,H:v.H,storeyNames:[]};    
  const {by,tot}=ratio(v); let ex=''; try{ ex=F&&F.exploded?F.exploded(LL,520,300,v.typology):''; }catch(e){}
   
  const Z=BD.f1zones, ZM=Z&&!(BD.F1FLAGS&&BD.F1FLAGS.zonePlans===false);
  const zplans=ZM?sts.map(st=>{ let p=null; try{ p=Z.plan(G,st,{w:760,fs:13,typology:v.typology}); }catch(e){ console.warn('zones',e); } if(!p) return '';
    const sch=`<details class="f1-pv-sch" open><summary>Zone schedule</summary><table>${p.zones.map(z=>`<tr><td>${esc(z.name)}</td><td style="text-align:right">${n0(z.m2)} m²</td></tr>`).join('')}</table></details>`;
    return `<h3 style="font-size:14px;font-weight:500;margin:16px 0 6px">Storey ${st}</h3><div class="f1-pv"><div class="f1-pv-plan">${p.svg}</div>${sch}</div>`; }).join(''):'';
  const plans=ZM?'':F&&F.plan?sts.map(st=>{ let p=null; try{ p=F.plan(G,st,{w:760}); }catch(e){} if(!p) return '';
    p.svg=p.svg.replace(/font-size="(\d+(?:\.\d+)?)"/g,(m,x)=>`font-size="${Math.max(13,+x)}"`);    
    const sch=`<details class="f1-pv-sch" open><summary>Room schedule</summary><table>${v.S[st].map((rm,i)=>`<tr><td>${i+1}</td><td>${esc(rm.n||rm.id)}</td><td style="text-align:right">${n0(ra(rm))} m²</td></tr>`).join('')}</table></details>`;
    return `<h3 style="font-size:14px;font-weight:500;margin:16px 0 6px">Storey ${st}</h3><div class="f1-pv"><div class="f1-pv-plan">${p.svg}</div>${sch}</div>`; }).join(''):'';    
  const rows=(v.rows||[]); const cnt=k=>rows.filter(r=>r[0]===k).length, WORD={pass:'pass',tight:'tight',flag:'flagged','?':'not checked',fail:'fail'};
  const tally=['pass','tight','flag','?','fail'].map(k=>`${cnt(k)} ${WORD[k]}`).join(' · ');    
  const vt=`${v.name} · ${TTL[v.id]||vTitle(v)}`; shell(vt,`<div class="crumb"><button data-lib="index">Typology library</button> · <button data-lib="list|${esc(v.typology)}">${esc(((await typologies()).find(x=>x.id===v.typology)||{}).name||v.typology)}</button></div><h1>${esc(vt)}</h1>
   <p class="ld">One tested building, shown without a lot: no parcel, yards or neighbours. Source: ${esc(v.source||'')}. The lots it fits are found by the tool’s lot check.</p>
   <section><h2>The numbers</h2><table><tr><th>Floor area, all storeys</th><td>${n0(tot)} m²</td></tr><tr><th>Storeys</th><td>${sts.length}${v.H?` (${v.H.map(h=>h+' m').join(', ')})`:''}</td></tr><tr><th>Servers</th><td>${n2(v.MW)} MW</td></tr>${GRP.filter(g=>by[g[0]]).map(g=>`<tr><th>${esc(g[1])}</th><td>${n0(by[g[0]])} m² (${Math.round(by[g[0]]/tot*100)} %)</td></tr>`).join('')}</table>${ratioBar(v,420)}</section>
   <section><h2>Massing</h2>${axo(v,520,340)}${ex?`<h2 style="margin-top:18px">The storeys pulled apart</h2>${ex}`:''}</section>
   ${zplans?`<section class="f1lib-plans"><h2>Zones by storey</h2>${Z.legend(v.typology)}${zplans}</section>`:plans?`<section class="f1lib-plans"><h2>Floor plans and rooms</h2>${F.legend?F.legend():''}${plans}</section>`:''}
   ${rows.length?`<section><h2>Checks</h2><p class="ld">Checks: ${tally}.${BD.f1decides&&BD.f1decides.on()?` <a href="#" onclick="BD.f1decides.open();return false" style="color:inherit">How the tool decides</a>`:''}</p><table>${rows.map(r=>`<tr><td class="${r[0]==='pass'?'ok':'bad'}">${esc(WORD[r[0]]||r[0])}</td><td>${esc(BD.f1cards&&BD.f1cards.pub?BD.f1cards.pub(r[1]):r[1])}</td></tr>`).join('')}</table></section>`:''}`); }
const _variant=variant; async function variantPV(id){ await _variant(id); const W=document.getElementById('f1lib'), P=W&&W.querySelector('.f1lib-plans'); if(P&&BD.f1planZoom){ BD.f1planZoom(P); BD.f1planLink(P); } }
BD.f1lib={open:index,typology,intro,variant:variantPV,library};
})();

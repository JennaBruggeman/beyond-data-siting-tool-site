 
(function(){
const BD=window.BD; const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const n0=v=>v==null?'?':Math.round(v).toLocaleString('en-CA'), n2=v=>v==null?'?':(+v).toFixed(2);
const GRP=[['hall','Data hall','#BCCDE4'],['sup','Data-centre support','#9FB6D6'],['load','Loading','#C9D6E8'],['pub','Public programs','#CFE0CB'],['clin','Clinic','#A9C9A3'],['plant','Plant','#DCDBD6'],['circ','Circulation','#EFEFEC'],['spare','Unassigned','#F7F7F5']];
const GN=Object.fromEntries(GRP.map(g=>[g[0],g])), ra=rm=>rm.r.reduce((t,r)=>t+(r[1]-r[0])*(r[3]-r[2]),0);
let LIB=null, TYP=null;
async function typologies(){ if(TYP) return TYP; try{ TYP=(await BD.getJSON('data/typologies.json')).list||[]; }catch(e){ TYP=[]; } return TYP; }
async function library(){ if(LIB) return LIB; let V=null; try{ const j=await BD.getJSON('data/library.json'); V=j&&j.variants; if(V) LIB={variants:V,sample:false,source:'data/library.json'}; }catch(e){}
  if(!LIB){ V=[]; for(const city of (window.BD_PUBLIC?['van']:['van','edm'])){ try{ const j=await BD.getJSON(`data/hub_frozen_${city}.json`);     for(const [id,b] of Object.entries((j&&j.boards)||{})) V.push({id:`hub_${city}_${b.key||id}`,typology:'emergency_hub',name:`Emergency hub, ${b.addr||'example lot'}`,city,source:`the Emergency hub plan checked on ${b.addr||'an example lot'}`,MW:b.MW,H:b.H,S:b.S,rows:b.rows||[]}); }catch(e){} }
    LIB={variants:V,sample:true,source:'the Emergency hub plans tested on the example lots; more typologies are added as their plans pass the checks'}; }
  return LIB; }
function ratio(v){ const by={}; let tot=0; for(const st in v.S) for(const rm of v.S[st]){ const a=ra(rm), g=GN[rm.g]?rm.g:'spare'; by[g]=(by[g]||0)+a; tot+=a; } return {by,tot}; }
function ratioBar(v,w){ const {by,tot}=ratio(v); w=w||300; let x=0; const segs=GRP.filter(g=>by[g[0]]>0).map(g=>{ const ww=by[g[0]]/tot*w, s=`<rect x="${x.toFixed(1)}" y="0" width="${Math.max(.5,ww).toFixed(1)}" height="14" fill="${g[2]}" stroke="#1E2A47" stroke-width=".5"><title>${esc(g[1])}: ${n0(by[g[0]])} m² (${Math.round(by[g[0]]/tot*100)} %)</title></rect>`; x+=ww; return s; }).join('');
  const lab=GRP.filter(g=>by[g[0]]>0).map(g=>`<span><i style="background:${g[2]}"></i>${esc(g[1])} ${Math.round(by[g[0]]/tot*100)} %</span>`).join('');
  return `<div class="f1lib-ratio"><div class="tot"><b>${n0(tot)} m²</b> floor area, all storeys</div><svg width="${w}" height="14" viewBox="0 0 ${w} 14" role="img" aria-label="Floor area by program use">${segs}</svg><div class="lab">${lab}</div></div>`; }
 
function axo(v,W,H){ W=W||300; H=H||200; const sts=Object.keys(v.S).map(Number).sort((a,b)=>a-b), Z={}; let z=0; sts.forEach((st,i)=>{ Z[st]=z; z+=(v.H&&v.H[i])||4; });
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
#f1lib .plans{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:18px}#f1lib .ok{color:#2E7D4F}#f1lib .bad{color:#B3261E}
@media (max-width:760px){ #f1lib main{padding:16px 16px 60px} #f1lib .plans{grid-template-columns:1fr} }`;
function css(){ if(document.getElementById('f1lib-css')) return; const s=document.createElement('style'); s.id='f1lib-css'; s.textContent=CSS; document.head.appendChild(s); }
function shell(title,body){ css(); let W=document.getElementById('f1lib'); if(!W){ W=document.createElement('div'); W.id='f1lib'; W.setAttribute('role','dialog'); W.setAttribute('aria-modal','true'); document.body.appendChild(W); OPENER=document.activeElement;    
    W.addEventListener('click',e=>{ const b=e.target.closest('[data-lib]'); if(!b) return; e.preventDefault(); const [k,a]=b.dataset.lib.split('|'); if(k==='close') close(); else if(k==='index') index(); else if(k==='typ') typology(a); else if(k==='var') variantPV(a); });
    W.addEventListener('keydown',e=>{ if(e.key==='Escape') close(); }); }
  W.setAttribute('aria-label',title); W.innerHTML=`<header class="f1v-head"><a class="f1-app" href="#" data-lib="close">Beyond Data</a><span class="tpl">Typology library</span><span style="flex:1"></span><button class="f1v-x" data-lib="close">Close</button></header><main>${body}</main>`; W.scrollTop=0;
   
  if(!W.hasAttribute('inert')){ const h=W.querySelector('main h1'); if(h){ h.setAttribute('tabindex','-1'); try{ h.focus({preventScroll:true}); }catch(e){} } }
  return W; }
let OPENER=null;
 
document.addEventListener('keydown',e=>{ if(e.key!=='Escape') return; const W=document.getElementById('f1lib'); if(!W||W.hasAttribute('inert')||document.getElementById('f1i')||document.querySelector('#f1l:not(.f1i-frozen)')) return; if(W.contains(e.target)) return; close(); });
function close(){ const W=document.getElementById('f1lib'); if(W) W.remove(); const o=OPENER; OPENER=null; if(o&&o.isConnected&&o.focus){ try{ o.focus({preventScroll:true}); }catch(e){} } }
async function index(){ const [T,L]=await Promise.all([typologies(),library()]);
  shell('Typology library',`<h1>Typology library</h1><p class="ld">Each typology pairs a data centre with a public program. A variant is one tested building of that typology: laid out, checked against every hard rule, and kept only if it passed. Open a typology to see its variants.</p>${L.sample?`<div class="sample">So far: ${esc(L.source)}.</div>`:''}
   <div class="grid">${T.map(t=>{ const n=L.variants.filter(v=>v.typology===t.id).length; return `<button class="tile" data-lib="typ|${esc(t.id)}"><h3>${esc(t.name)}</h3><p>${esc((t.programs||[]).map(p=>p.name).join(' · '))}</p><p>${esc(t.lead||'')}</p><div class="n">${n?`${n} tested variant${n===1?'':'s'}`:'no tested variant yet'}</div></button>`; }).join('')}</div>`); }
async function typology(id){ const [T,L]=await Promise.all([typologies(),library()]), t=T.find(x=>x.id===id)||{name:id}, V=L.variants.filter(v=>v.typology===id);
  shell(t.name,`<div class="crumb"><button data-lib="index">Typology library</button></div><h1>${esc(t.name)}</h1><p class="ld">${esc(t.lead||'')}</p>${L.sample?`<div class="sample">So far: ${esc(L.source)}.</div>`:''}
   ${V.length?`<div class="grid">${V.map(v=>`<button class="tile" data-lib="var|${esc(v.id)}"><h3>${esc(v.name)}</h3>${axo(v,300,190)}${ratioBar(v,250)}<div class="n">${Object.keys(v.S).length} storeys · ${n2(v.MW)} MW of servers</div></button>`).join('')}</div>`:'<p class="ld">No tested variant of this typology yet.</p>'}`); }
async function variant(id){ const L=await library(), v=L.variants.find(x=>x.id===id); if(!v) return index(); const F=BD.f1plans, sts=Object.keys(v.S).map(Number).sort((a,b)=>a-b), G={S:v.S}, LL={G,H:v.H,storeyNames:[]};
  const {by,tot}=ratio(v); let ex=''; try{ ex=F&&F.exploded?F.exploded(LL,520,300):''; }catch(e){}
  const plans=F&&F.plan?sts.map(st=>{ let p=null; try{ p=F.plan(G,st,{w:760}); }catch(e){} if(!p) return '';
    const sch=`<details class="f1-pv-sch" open><summary>Room schedule</summary><table>${v.S[st].map((rm,i)=>`<tr><td>${i+1}</td><td>${esc(rm.n||rm.id)}</td><td style="text-align:right">${n0(ra(rm))} m²</td></tr>`).join('')}</table></details>`;
    return `<h3 style="font-size:14px;font-weight:500;margin:16px 0 6px">Storey ${st}</h3><div class="f1-pv"><div class="f1-pv-plan">${p.svg}</div>${sch}</div>`; }).join(''):'';    
  const rows=(v.rows||[]); const okN=rows.filter(r=>r[0]==='pass').length;
  shell(v.name,`<div class="crumb"><button data-lib="index">Typology library</button> · <button data-lib="typ|${esc(v.typology)}">${esc(((await typologies()).find(x=>x.id===v.typology)||{}).name||v.typology)}</button></div><h1>${esc(v.name)}</h1>
   <p class="ld">One tested building, shown without a lot: no parcel, yards or neighbours. Source: ${esc(v.source||'')}. The lots it fits come from the matcher.</p>
   <section><h2>The numbers</h2><table><tr><th>Floor area, all storeys</th><td>${n0(tot)} m²</td></tr><tr><th>Storeys</th><td>${sts.length}${v.H?` (${v.H.map(h=>h+' m').join(', ')})`:''}</td></tr><tr><th>Servers</th><td>${n2(v.MW)} MW</td></tr>${GRP.filter(g=>by[g[0]]).map(g=>`<tr><th>${esc(g[1])}</th><td>${n0(by[g[0]])} m² (${Math.round(by[g[0]]/tot*100)} %)</td></tr>`).join('')}</table>${ratioBar(v,420)}</section>
   <section><h2>Massing</h2>${axo(v,520,340)}${ex?`<h2 style="margin-top:18px">The storeys pulled apart</h2>${ex}`:''}</section>
   ${plans?`<section class="f1lib-plans"><h2>Floor plans and rooms</h2>${F.legend?F.legend():''}${plans}</section>`:''}
   ${rows.length?`<section><h2>Checks it passed</h2><p class="ld">${okN} of ${rows.length} rows pass; the others are named below as the board recorded them.</p><table>${rows.map(r=>`<tr><td class="${r[0]==='pass'?'ok':'bad'}">${esc(r[0])}</td><td>${esc(BD.f1cards&&BD.f1cards.pub?BD.f1cards.pub(r[1]):r[1])}</td></tr>`).join('')}</table></section>`:''}`); }
const _variant=variant; async function variantPV(id){ await _variant(id); const W=document.getElementById('f1lib'), P=W&&W.querySelector('.f1lib-plans'); if(P&&BD.f1planZoom){ BD.f1planZoom(P); BD.f1planLink(P); } }
BD.f1lib={open:index,typology,variant:variantPV,library};
})();

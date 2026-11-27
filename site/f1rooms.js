 
(function(){
'use strict';
const BD=window.BD=window.BD||{};
const INK='#1E2A47', INK2='#4A5672', INK3='#6B7590';
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const n0=v=>Math.round(+v||0).toLocaleString('en-CA');
const J={}; const get=u=>J[u]||(J[u]=fetch((BD.ASSET_BASE||'')+u).then(r=>r.ok?r.json():null).catch(()=>null));
const col=z=>BD.f1mass&&BD.f1mass.colour?BD.f1mass.colour(z):'#C3CAD6';
const pub=t=>BD.f1cards&&BD.f1cards.pubFull?BD.f1cards.pubFull(String(t||'')):String(t||'');
async function record(id){ if(!id||/\s/.test(String(id))) return null;     const k=String(id).split('_')[0].replace(/^L/,''); const D=await get(`f1/rooms/${k}.json`); return D&&(D.plans||[]).find(p=>p.id===id)||null; }
 
function cite(t,city){ let s=String(t||'');
  if(city==='van'){ s=s.replace(/\bNBC 3\.8\.3\.12\b/g,'VBBL 3.8.3.13.(1)(j)').replace(/\bVBBL 3\.8\.3\.13\b(?!\.)/g,'VBBL 3.8.3.13.(1)(j)').replace(/\bNBC \/ VBBL Table\b/g,'VBBL Table').replace(/\bVBBL \/ NBC Table\b/g,'VBBL Table');
    s=s.replace(/(Alberta (?:Health Services|Facility Needs Assessment)[^;()]*?)(\s*\(analogy\))?(?=;|$)/g,'$1 (Alberta guideline, used as a proxy in BC)'); }
  if(city==='edm'){ s=s.replace(/\bVBBL 3\.8\.3\.13\b/g,'NBC(AE) 3.8.3.12').replace(/\bNBC 3\.8\.3\.12\b/g,'NBC(AE) 3.8.3.12').replace(/\b(?:VBBL \/ NBC|NBC \/ VBBL) Table\b/g,'NBC(AE) Table'); }
  return s.replace(/\s*\((?:\d{1,2} (?:Oct|Nov|Dec)|ruling \d+)[^()]*ruling[^()]*\)/g,'').replace(/\s*\(\d{1,2} (?:Oct|Nov|Dec) ruling\)/g,'').replace(/;?\s*\bruling \d+[a-z]?\b/gi,''); }    
const sizedRooms=Z=>(Z&&Z.rooms||[]).filter(r=>+r.m2>0);    
const ZONES=[['public-program','Public program',true],['public-support','Public support',true],['dc','Data-centre support',false]];
function chart(P,o){ o=o||{}; const W=o.W||920, ZB={}; for(const z of P.zones||[]) ZB[z.zone]=z;
  const tot=Math.max(...ZONES.map(([z])=>+(ZB[z]&&ZB[z].area)||0),1), sc=W/tot; let out='';
  for(const [z,lab,sized] of ZONES){ const Z=ZB[z]; if(!Z) continue; const area=+Z.area||0;
    out+=`<div class="rm-z"><div class="rm-h"><b>${esc(lab)}</b>${sized?`<b>${n0(area)} m²</b>`:''}</div>`;
    const noA=sized?(Z.rooms||[]).filter(r=>!(+r.m2>0)):[];
    if(sized&&sizedRooms(Z).length){ const rooms=sizedRooms(Z), sum=rooms.reduce((a,r)=>a+(+r.m2||0),0), big=rooms.reduce((m,r,i)=>(+r.m2>(+rooms[m].m2))?i:m,0);
      let bar='', num=0; const listed=[];
      rooms.forEach((r,i)=>{ const w=(+r.m2||0)*sc; if(i===big&&w>160){ bar+=`<div class="rm-s rm-big" style="width:${w.toFixed(1)}px;background:${col(z)}"><b>${esc(r.name)}</b><span>${n0(r.m2)} m²${r.grows?', the rest of the zone':''}</span></div>`; }
        else { num++; listed.push([num,r]); bar+=`<div class="rm-s" style="width:${Math.max(3,w).toFixed(1)}px;background:${col(z)}" title="${esc(r.name)}: ${n0(r.m2)} m²">${w>16?num:''}</div>`; } });
      const rest=area-sum; if(rest>1) bar+=`<div class="rm-s rm-rest" style="width:${(rest*sc).toFixed(1)}px"></div><span class="rm-rl">not split into rooms, ${n0(rest)} m²</span>`;
      out+=`<div class="rm-bar">${bar}</div>${listed.length?`<ol class="rm-l">${listed.map(([k,r])=>`<li><b>${k}</b> ${esc(r.name)}, ${n0(r.m2)} m²</li>`).join('')}</ol>`:''}`;
      if(noA.length) out+=`<p class="rm-hold">Also in this zone, not sized: ${noA.map(r=>esc(cite(pub(r.name),P.city))).join('; ')}.</p>`;
      const srcs=rooms.filter(r=>r.src).map(r=>`${esc(r.name)}: ${esc(cite(pub(r.src),P.city))}`); if(srcs.length) out+=`<p class="rm-src">${srcs.join('<br>')}</p>`; }
    else if(sized){ out+=`<div class="rm-bar"><div class="rm-s" style="width:${(area*sc).toFixed(1)}px;background:${col(z)}"></div></div><p class="rm-src">${esc(Z.note||'Not split into rooms in this layout.')}</p>`; }
    else { out+=(Z.holds||[]).length?`<p class="rm-hold">The data-centre rooms sit on the data-centre floors with the data hall; they are named here, not sized: ${Z.holds.map(h=>esc(cite(pub(h.name),P.city))).join('; ')}.</p>`:''; }
    out+='</div>'; }
  return `<div class="rm" style="max-width:${W}px"><h3 class="rm-t">Suggested room breakdown (schematic, from research)</h3>${out}</div>`; }
const CSS=`.rm{font-size:13px;color:#1E2A47}.rm-t{font-size:18px;margin:0 0 14px}.rm-z{margin:0 0 22px}.rm-h{display:flex;justify-content:space-between;font-size:15px;margin:0 0 6px}
.rm-bar{display:flex;align-items:center;flex-wrap:nowrap}.rm-s{height:34px;border-right:2px solid #fff;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:12px;box-sizing:border-box;overflow:hidden;flex:0 0 auto}
.rm-big{flex-direction:column;align-items:flex-start;justify-content:center;padding:0 8px;font-weight:400}.rm-big b{font-size:12.5px}.rm-big span{font-size:12px}
.rm-rest{border:1.4px dashed #8A94AA;background:#fff;height:34px}.rm-rl{margin-left:10px;font-size:12px;color:#4A5672}
.rm-l{list-style:none;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:2px 20px;margin:8px 0 0;padding:0;font-size:12.5px;color:#4A5672}.rm-l b{color:#1E2A47;margin-right:4px}
.rm-via{font-size:13px;color:#4A5672;margin:0 0 14px;max-width:920px;text-align:left}.rm-chg{font:inherit;font-size:13px;background:none;border:0;padding:0;margin-left:6px;color:#1E2A47;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.rm-src{font-size:12px;color:#6B7590;margin:8px 0 0;line-height:1.5}.rm-hold{font-size:12.5px;color:#1E2A47;margin:8px 0 0;line-height:1.5}
@media (max-width:700px){ .rm-l{grid-template-columns:1fr} }`;
function css(){ if(document.getElementById('rm-css')) return; const s=document.createElement('style'); s.id='rm-css'; s.textContent=CSS; document.head.appendChild(s); }
async function resolve(x,b){ let P=b?await record(b.plan):null, via=null, ref=false;
  if(!P&&b&&b.board&&x&&x.sel){ const D=await get(`f1/rooms/board${String(x.sel.id)}.json`), R=D&&(D.plans||[])[0]; if(R){ P=R; ref=true; } }        
  if(!P&&b&&b.board&&x&&x.sel){ const lot=String(x.sel.id), city=x.city==='edm'?'edm':'van', I=await get(`f1/lib_best_${city}.json`), e=I&&I.index&&I.index[lot], LL=await get(`data/lib_lots_${city}.json`), bt=LL&&LL.lots&&LL.lots[lot]&&LL.lots[lot].byTypology||{};
    const cand=[...((e&&e.alternatives)||[]).filter(a=>a.typology===b.typology).map(a=>a.plan),...(bt[b.typology]?[bt[b.typology].plan]:[]),...((e&&e.alternatives)||[]).map(a=>a.plan),...Object.values(bt).map(v=>v.plan)];
    for(const id of cand){ const R=await record(id); if(R){ P=R; via=R; break; } } }
  return {P,via,ref}; }
async function build(x){ css(); let b=null; try{ b=BD.f1best?await BD.f1best.forLot(x):null; }catch(e){}
  if(!b||b.source==='rough') return {draw:'<p class="f1v-empty">No layout fits this lot, so there is no room breakdown.</p>',lead:'Rooms in each zone of the layout on this lot.'};
  const RV=await resolve(x,b), P=RV.P, via=RV.via, ref=RV.ref;
  if(!P) return {draw:`<p class="f1v-empty">${b.board?'This lot’s reference layout has no room list.':'This layout has no room list.'} Pick a layout from the library on ‘Available layouts’ to see its rooms.</p>`,lead:'Rooms in each zone of the layout on this lot.'};
  const ZB={}; for(const z of P.zones||[]) ZB[z.zone]=z; const pp=ZB['public-program'], ps=ZB['public-support'];
  const TNm=t=>String(t||'').replace(/_/g,' ').replace(/^./,c=>c.toUpperCase());
  const note=ref?`<p class="rm-via">Rooms for the reference layout.</p>`:via?`<p class="rm-via">These are the rooms of the highest-capacity ${esc(TNm(via.typology))} layout for your filters (${(+via.MW||0).toFixed(2)} MW); the reference layout has no room list. <button type="button" class="rm-chg" onclick="(function(){ const B=[...document.querySelectorAll('#f1v .f1v-strip button')].find(b=>/Available layouts/.test(b.textContent)); if(B) B.click(); })()">Change layout</button></p>`:'';
  return {draw:note+chart(P),lead:'What each public zone could hold, room by room, as a starting brief. The data-centre rooms are named, not sized.',
    hero:[...(pp?[{v:n0(pp.area),u:' m²',l:`public program, in ${sizedRooms(pp).length} rooms`}]:[]),...(ps?[{v:n0(ps.area),u:' m²',l:`public support, in ${sizedRooms(ps).length} rooms`}]:[])],
    foot:'Rooms are suggestions for the next design stage; none has been designed. Public rooms sized from the layout; data-centre rooms named, not sized.',
    src:['Room breakdown: the tool’s merged library (25 Nov 2026), rooms scaled from the typology definitions with their sources; schematic.']}; }
(function wire(n){ const C=BD.f1cards; if(!C||!C.add){ if((n||0)<100) setTimeout(()=>wire((n||0)+1),100); return; } C.add('architecture','Rooms in each zone',{build}); })();
BD.f1rooms={resolve,record,chart,build,css,CSS};
})();

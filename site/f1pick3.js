 
(function(){
const BD=window.BD=window.BD||{};
 
const AB=()=>BD.ASSET_BASE||'';
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const n0=v=>Math.round(+v||0).toLocaleString('en-CA');
const TN={emergency_hub:'Emergency hub',shelter_laundry:'Shelter + laundry',community_pool:'Community pool',warm_bath:'Warm bath',heat_cascade:'Heat cascade',aquaponics:'Aquaponics',conservatory:'Conservatory',food_hub:'Food hub'};
const FACETS=[['typology','Program',v=>TN[v]||v,null],['security','Security',v=>v==='shared'?'Shared entrance':'Separate entrances',['separate','shared']],
  ['band','Building density',v=>v==='3'?'1-3 storeys':'4+ storeys',['3','4+']],
  ['rack','Rack density',v=>v==='avg'?'Existing average about 8 kW (Uptime 2024; 7.1 without the densest sites)':'New-build design ~30 kW (consulting engineer + Bryden Wood 2025): not in the library yet',['avg','new']],
  ['form','Form',v=>v==='compact'?'Compact':'Articulated',['compact','articulated']],
  ['approval','City approval',v=>v==='needs'?'Include layouts that need city approval':'No approval needed',['outright','needs']]];            
const HA=p=>p.heightApproval&&p.heightApproval.needed?p.heightApproval:null, haLine=h=>`Needs height approval: ${h.limitWithApproval!=null?(+h.limitWithApproval).toFixed(1):'?'} m with approval vs ${(+h.limitOutright).toFixed(1)} m outright`;
const NEEDS=p=>!!(HA(p)||(p.approvals&&p.approvals.length)), apLines=p=>[...(p.approvals||[]).map(a=>`Needs City approval: ${a.what}`),...(HA(p)?[haLine(HA(p))]:[])];
const val=(p,f)=>f==='approval'?(NEEDS(p)?'needs':'outright'):f==='band'?(p._band||(p.storeys.length>=4?'4+':'3')):f==='rack'?(p.rack||'avg'):p[f];
let ST=null; let OFF=null; const defOff=()=>({band:new Set(['4+'])});    
    

 
function streetDown(p){ const side=p.street&&p.street.side; if(!side||side==='u-low') return p; const q=JSON.parse(JSON.stringify(p));
  const T=side==='u-high'?(u,v)=>[-u,-v]:side==='v-low'?(u,v)=>[v,-u]:(u,v)=>[-v,u], pt=a=>{ const [u,v]=T(a[0],a[1]); a[0]=u; a[1]=v; };
  const rect=r=>{ const c=[T(r[0],r[2]),T(r[1],r[3])]; r[0]=Math.min(c[0][0],c[1][0]); r[1]=Math.max(c[0][0],c[1][0]); r[2]=Math.min(c[0][1],c[1][1]); r[3]=Math.max(c[0][1],c[1][1]); };
  const rings=v=>{ if(Array.isArray(v)) v.forEach(R=>{ if(Array.isArray(R)) R.forEach(x=>{ if(Array.isArray(x)&&typeof x[0]==='number') pt(x); }); }); };
  for(const s of q.storeys){ for(const z of s.zones){ (z.rects||[]).forEach(rect); rings(z.rings); } for(const r of s.rooms||[]) (r.rects||[]).forEach(rect);
    if(s.circulation) Object.values(s.circulation).forEach(rings); if(s.separations){ (s.separations.fire2h||[]).forEach(g=>{ const a=T(g[0],g[1]), b=T(g[2],g[3]); g[0]=a[0]; g[1]=a[1]; g[2]=b[0]; g[3]=b[1]; }); rings(s.separations.enclosures); } }
  if(q.court) rect(q.court); if(q.yard){ rings(q.yard.rings); if(q.yard.truckCourt&&q.yard.truckCourt.rect) rect(q.yard.truckCourt.rect); } return q; }

const ZS=p=>{ const out=[]; for(const z of (p.shares&&p.shares.byZone)||[]){ const k=/^(public|clinic|public-program)$/.test(z.zone)?'public-program':z.zone; const o=out.find(q=>q.zone===k); if(o){ o.area+=z.area; o.pct=+(o.pct+z.pct).toFixed(1); } else out.push({zone:k,label:k==='public-program'?'Public program':k==='public-support'?'Public support':(LAB22N[k]||z.label),area:z.area,pct:z.pct}); } return out.sort((a,b)=>b.area-a.area); };
const LAB22N={'circulation':'Public circulation','circulation-dc':'Data-centre circulation','core-dc':'Data-centre stairs and lifts','core-public':'Public stairs and lifts'};    
const DOTS={'circulation':['#E4E0D8','#1E2A47'],'circulation-dc':['#D5DCEA','#3D5185']};    
function pie(p,R){ R=R||30; const PID='pd'+Math.random().toString(36).slice(2,7); const Z=ZS(p), T=Z.reduce((a,z)=>a+z.area,0)||1; let a0=-Math.PI/2; const r=R*0.55, c=R+2, seg=[];
  for(const z of Z){ const a1=a0+z.area/T*2*Math.PI, big=a1-a0>Math.PI?1:0, P=(a,rr)=>[c+rr*Math.cos(a),c+rr*Math.sin(a)], [x0,y0]=P(a0,R),[x1,y1]=P(a1,R),[x2,y2]=P(a1,r),[x3,y3]=P(a0,r);
    seg.push(`<path d="M${x0.toFixed(2)},${y0.toFixed(2)}A${R},${R} 0 ${big} 1 ${x1.toFixed(2)},${y1.toFixed(2)}L${x2.toFixed(2)},${y2.toFixed(2)}A${r},${r} 0 ${big} 0 ${x3.toFixed(2)},${y3.toFixed(2)}Z" fill="${DOTS[z.zone]?DOTS[z.zone][0]:BD.f1mass.colour(z.zone==='circulation-dc'?'circ-dc':z.zone,p.typology)}" stroke="#fff" stroke-width=".7"><title>${esc(z.label)} ${z.pct} %</title></path>${DOTS[z.zone]?`<path d="M${x0.toFixed(2)},${y0.toFixed(2)}A${R},${R} 0 ${big} 1 ${x1.toFixed(2)},${y1.toFixed(2)}L${x2.toFixed(2)},${y2.toFixed(2)}A${r},${r} 0 ${big} 0 ${x3.toFixed(2)},${y3.toFixed(2)}Z" fill="url(#${PID}${z.zone})" pointer-events="none"/>`:''}`); a0=a1; }
  return `<svg viewBox="0 0 ${2*R+4} ${2*R+4}" width="${2*R+4}" height="${2*R+4}" role="img" aria-label="Floor area by zone"><defs>${Object.entries(DOTS).map(([k,c])=>`<pattern id="${PID}${k}" width="3" height="3" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r=".55" fill="${c[1]}"/></pattern>`).join('')}</defs>${seg.join('')}</svg>`; }
const mass=p=>BD.f1mass.render(p.storeys.map(s=>({st:s.st,z0:s.z0,z1:s.z1,zones:s.zones.map(z=>({zone:z.zone,rects:z.rects}))})),{typology:p.typology,exploded:false,k:3,labels:false,fire:false,circ:false,label:`${TN[p.typology]||p.typology}: massing`});
const hidden=p=>FACETS.some(([f])=>ST.off[f]&&ST.off[f].has(val(p,f)));
const pubPct=p=>ZS(p).filter(z=>/^public/.test(z.zone)).reduce((a,z)=>a+z.pct,0);
const pass=p=>{ const G=p.checks||{}; let fail=0, nr=0; for(const [k,g] of Object.entries(G)){ if(k==='room'||k==='dd') continue; for(const r of g.rows||[]){ if(r.status==='fail') fail++; if(r.status==='?') nr++; } } return fail?`Fails ${fail} check${fail>1?'s':''}`:`Passes every check measurable at the zone stage${nr?` (${nr} not run: data missing)`:''}`; };

 
function choice(){ const P0=ST.plans, on=P0.filter(p=>!hidden(p));
  const bar=FACETS.map(([f,lab,nm,all])=>{ const vals=all||[...new Set(P0.map(p=>val(p,f)).filter(v=>v!=null))]; const none=!P0.some(p=>val(p,f)!=null);
    return `<div class="p3-f"><span>${lab}</span>${vals.map(v=>{ const n=P0.filter(p=>val(p,f)===v).length, off=ST.off[f]&&ST.off[f].has(v); return `<button type="button" class="p3-t${off?' off':''}" aria-pressed="${!off}" ${n?`onclick="BD.f1pick3.tog('${f}','${esc(v)}')"`:'disabled'}>${esc(nm(v))}${n?` <i>${n}</i>`:''}</button>`; }).join('')}${none?'<em class="p3-na">not in the layouts yet</em>':''}</div>`; }).join('');
  const offT=ST.off.typology||new Set(), sel=[...new Set(P0.map(p=>p.typology))].filter(t=>!offT.has(t)), hidN=p=>FACETS.some(([f])=>f!=='typology'&&ST.off[f]&&ST.off[f].has(val(p,f)));    
  const T=[...new Set(P0.map(p=>p.typology))].map(t=>{ const L=P0.filter(p=>p.typology===t&&!hidN(p)); return [t,L.length,L.length?Math.max(...L.map(p=>+p.MW||0)):0]; }).sort((a,b)=>b[1]-a[1]||b[2]-a[2]);
  const rows=T.map(([t,n,mw])=>`<button type="button" aria-pressed="${offT.size&&!offT.has(t)?'true':'false'}" class="p3-row${n?'':' dim'}${offT.size&&!offT.has(t)?' on':''}" ${n?`onclick="BD.f1pick3.only('${esc(t)}')"`:'disabled'}><span class="p3-tab" style="background:${(BD.TOK&&BD.TOK.TYPO_ICON[t])||'#F28C38'}"></span><b>${esc(TN[t]||t)}</b><span>${n?`${n0(n)} layout${n===1?'':'s'} · up to ${mw.toFixed(2)} MW`:'none match your preferences'}</span></button>`).join('');
  return `<div class="p3"><div class="p3-top"><p class="p3-cnt"><b>${on.length} of ${P0.length}</b> layouts that fit this lot match your preferences.</p><button type="button" class="p3-clr" onclick="BD.f1pick3.clear()">Clear preferences</button></div>${ST.flood?BD.f1flood.html(ST.flood):''}<div class="p3-bar">${bar}</div><h4 class="p3-h4">Programs that fit</h4><div class="p3-rows">${rows}</div><p class="p3-next"><button type="button" class="p3-go" onclick="BD.f1pick3.toList()" ${on.length?'':'disabled'}>See the ${n0(on.length)} layout${on.length===1?'':'s'}</button></p>${ST.none&&ST.none.length?`<details class="p3-why"><summary>Typologies that don’t fit this lot (${ST.none.length})</summary><ul>${ST.none.map(([t,r])=>`<li><b>${esc(TN[t]||t)}</b>${r?': '+esc(r):''}</li>`).join('')}</ul></details>`:''}</div>`; }
function grid(){ const P0=ST.plans, on=P0.filter(p=>!hidden(p)), P=ST.avail?on:P0;
  const bar=FACETS.map(([f,lab,nm,all])=>{ const vals=all||[...new Set(P.map(p=>val(p,f)).filter(v=>v!=null))]; const none=!P.some(p=>val(p,f)!=null);
    return `<div class="p3-f"><span>${lab}</span>${vals.map(v=>{ const n=P.filter(p=>val(p,f)===v).length, off=ST.off[f]&&ST.off[f].has(v); return `<button type="button" class="p3-t${off?' off':''}" aria-pressed="${!off}" ${n?`onclick="BD.f1pick3.tog('${f}','${esc(v)}')"`:'disabled'}>${esc(nm(v))}${n?` <i>${n}</i>`:''}</button>`; }).join('')}${none?'<em class="p3-na">not in the layouts yet</em>':''}</div>`; }).join('');
  const ORD=ST.avail?P:[...P.filter(p=>!hidden(p)),...P.filter(hidden)], LIM=ST.lim||48, P2=ORD.slice(0,LIM), left=ORD.length-P2.length;    
  const cards=P2.map(p=>`<button type="button" class="p3-c${hidden(p)?' dim':''}${ST.chosen===p.id?' chosen':''}" onclick="BD.f1pick3.open('${esc(p.id)}')" ${hidden(p)?'aria-disabled="true"':''}>
     <span class="p3-tab" style="background:${(BD.TOK&&BD.TOK.TYPO_ICON[p.typology])||'#F28C38'}"></span>${p._stub?`<span class="p3-m p3-stub"><img src="f1/l2/i_${esc(p.typology)}.svg" alt="" width="56" height="56" onerror="this.remove()"></span><span class="p3-pie"></span>`:`<span class="p3-m">${mass(p)}</span>`}
     <span class="p3-h">${esc(TN[p.typology]||p.typology)}${p._ref?' (reference layout)':''}</span><span class="p3-s">${esc(p.security==='shared'?'Shared entrance':'Separate entrances')} · ${esc(p.density||((/_(high|standard)_/.exec(p.id)||[])[1])||'standard')} density</span>
     <span class="p3-n">${(+p.MW).toFixed(2)} MW · ${p._stub?'':n0(p.shares&&p.shares.total)+' m² of floor · '}${p._stub?p._st:p.storeys.length} storeys ${p._stub&&p._pub==null?'':` · public ${(p._stub?+p._pub||0:pubPct(p)).toFixed(0)} %`}${p.fitsLots?` · fits ${n0(p.fitsLots)} lots`:''}${p._alt?' · alternative':''}${ST.away&&p.lotsFitted?` · fits ${n0(p.lotsFitted)} lots`:''}</span>${apLines(p).map(t=>`<span class="p3-ha">${esc(t)}</span>`).join('')}${ST.flood&&BD.f1flood.typLine(ST.flood,p.typology)?`<span class="p3-ha p3-fl"><b>Floodplain</b> ${esc(BD.f1flood.typLine(ST.flood,p.typology))}</span>`:''}${p._old?`<span class="p3-ha">${esc(BD.f1best.oldLine(p._old))}</span>`:''}${ST.chosen===p.id?'<span class="p3-ch">Chosen</span>':''}</button>`).join('');
  return `<div class="p3"><div class="p3-top"><p class="p3-cnt"><b>${on.length} of ${P0.length}</b> layouts ${ST.byTyp?'that fit':ST.away?'fitted to':'drawn on'} this lot match your preferences.</p><button type="button" class="p3-clr" onclick="BD.f1pick3.clear()">Clear preferences</button></div>
    <details class="p3-why"><summary>Which layouts are here</summary><p>${ST.away?'Library layouts that fit this lot (the tool’s lot index).':'The tool’s layouts that fit this lot (the tool’s layout set, 22 Nov 2026).'} Not yet here: the full library matched against this lot, which comes from the matcher. The floodplain is a flag only: no layout is greyed out for it.</p></details>
    ${ST.avail?'':'<p class="p3-pre">Already matched to this lot’s size: each layout here fits it.</p>'}${ST.avail?'':`<div class="p3-bar">${bar}</div>`}${ST.flood?BD.f1flood.html(ST.flood):''}<div class="p3-grid">${ST.avail&&!on.length&&P0.length?`<p class="p3-none">No layout matches all your preferences. <button type="button" class="p3-clr" onclick="BD.f1pick3.clear()">Clear preferences</button> to see all ${P0.length}.</p>`:''}${cards}</div>${left>0?`<p class="p3-more"><button type="button" class="p3-clr" onclick="BD.f1pick3.more()">Show ${Math.min(48,left)} more (${n0(left)} not shown)</button></p>`:''}${ST.none&&ST.none.length?`<details class="p3-why"><summary>Typologies that don’t fit this lot (${ST.none.length})</summary><ul>${ST.none.map(([t,r])=>`<li><b>${esc(TN[t]||t)}</b>${r?': '+esc(r):''}</li>`).join('')}</ul></details>`:''}</div>`; }

function detail(id){ const p00=ST.plans.find(q=>q.id===id); if(!p00) return grid();
  if(p00._stub) return `<div class="p3 p3-d"><div class="p3-top"><button type="button" class="p3-clr" onclick="BD.f1pick3.back()">Back to the layouts</button><button type="button" class="p3-go" onclick="BD.f1pick3.choose('${esc(id)}')">${ST.chosen===id?'Chosen':'Choose this layout'}</button></div><h3 class="p3-dh">${esc(TN[p00.typology]||p00.typology)} · ${(+p00.MW).toFixed(2)} MW · ${p00._st} storeys · public ${(+p00._pub||0).toFixed(0)} %</h3><p class="p3-ok">Storey drawings for this layout aren’t in the tool yet; the figures are the layout’s own.</p></div>`; const p0=ST.away&&p00.yard?Object.assign({},p00,{yard:Object.assign({},p00.yard,{pctOfLot:null},p00.yard.truckCourt?{truckCourt:Object.assign({},p00.yard.truckCourt,{pctOfLot:null})}:{})}):p00, p=streetDown(p0), sts=p.storeys.slice().sort((a,b)=>a.st-b.st);
  const axo=BD.f1mass.render(sts.map(s=>({st:s.st,z0:s.z0,z1:s.z1,zones:s.zones.map(z=>({zone:z.zone,rects:z.rects})),circulation:s.circulation,separations:s.separations})),{typology:p.typology,exploded:true,k:4,fs:20,labelCol:true,yard:p.yard,court:p.court,label:'The layout pulled apart storey by storey'});
  const plans=sts.map(s=>`<figure class="p3-pl"><figcaption><b>Storey ${s.st}</b>${s.st===1?' · street along the bottom':''}</figcaption>${BD.f1mass.plan(s,{typology:p.typology,k:4,yard:s.st===1?p.yard:null,court:s.st===1?p.court:null,label:'Storey '+s.st+' plan'})}</figure>`).join('');
  const lg=BD.f1mass.legend(sts.map(s=>({st:s.st,zones:s.zones.map(z=>({zone:z.zone,rects:z.rects})),circulation:s.circulation})),p.typology,p.shares,p.yard||false);
  return `<div class="p3 p3-d"><div class="p3-top"><button type="button" class="p3-clr" onclick="BD.f1pick3.back()">Back to the layouts</button><button type="button" class="p3-go" onclick="BD.f1pick3.choose('${esc(id)}')">${ST.chosen===id?'Chosen':'Choose this layout'}</button></div>
    <h3 class="p3-dh">${esc(TN[p.typology]||p.typology)} · ${(+p.MW).toFixed(2)} MW · ${n0(p.shares&&p.shares.total)} m² · ${sts.length} storeys</h3><p class="p3-ok">${esc(p._old?BD.f1best.oldLine(p._old)+'.':pass(p))}</p>${ST.flood?BD.f1flood.html(ST.flood,{typology:p.typology}):''}
    <div class="p3-dg"><div class="p3-axo">${axo}</div><div class="p3-side">${pie(p,46)}</div></div><div class="p3-lg">${lg}</div><div class="p3-pls">${plans}</div>
    <p class="p3-src">${/board/i.test(p.id)?'The reference layout for this lot.':'A library variant that fits this lot; not yet reviewed.'} Zones, circulation, 2 h lines and the yard as generated.</p></div>`; }

function paint(){ const h=document.querySelector('#f1v [data-p3]'); if(!h) return; h.innerHTML=!ST.avail?choice():ST.open?detail(ST.open):grid(); }    
 
function toList(id){ ST.pending=id||null; const b=[...document.querySelectorAll('#f1v .f1v-strip button')].find(x=>/Available layouts/.test(x.textContent)); if(b) b.click(); else paint(); }
const api={ tog(f,v){ const s=ST.off[f]=ST.off[f]||new Set(); s.has(v)?s.delete(v):s.add(v); paint(); }, clear(){ ST.off=OFF={}; paint(); },
  okIdx,label:hcLabel,
  more(){ ST.lim=(ST.lim||48)+48; paint(); },
  toList(){ toList(); }, only(t){ const all=[...new Set(ST.plans.map(p=>p.typology))]; ST.off=OFF=Object.assign({},ST.off,{typology:new Set(all.filter(x=>x!==t))}); toList(); },
  async open(id){ if(!ST.avail){ toList(id); return; } const i=ST.plans.findIndex(q=>q.id===id); if(i>=0&&ST.plans[i]._stub&&!ST.plans[i]._tried&&BD.f1best&&BD.f1best.planData){ ST.plans[i]._tried=true; try{ const p=await BD.f1best.planData({source:'best',plan:id},ST.x||{sel:BD.S.sel,city:'van'}); if(p&&(p.storeys||[]).length) ST.plans[i]=Object.assign({},p,{fitsLots:ST.plans[i].fitsLots}); }catch(e){} } ST.open=id; paint(); const h=document.querySelector('#f1v [data-p3]'); if(h) h.scrollIntoView({block:'start'}); }, back(){ ST.open=null; paint(); },
  choose(id){ ST.chosen=id; if(BD.f1best&&BD.f1best.setCurrent) BD.f1best.setCurrent(ST.lot,id,{push:true}); else { try{ sessionStorage.setItem('bd-plan-'+ST.lot,id); }catch(e){} } paint(); } };
 
document.addEventListener('bd-layout',e=>{ const d=e.detail||{}; if(ST&&ST.lot===d.lot&&ST.chosen!==d.id){ ST.chosen=d.id; paint(); } });

const CSS=`.p3{display:flex;flex-direction:column;gap:10px} .p3-top{display:flex;align-items:center;gap:12px;flex-wrap:wrap} .p3-cnt{margin:0;font-size:14px;color:#1E2A47} .p3-clr,.p3-go{font:inherit;font-size:13px;padding:5px 14px;border:1px solid #1E2A47;border-radius:999px;background:#fff;color:#1E2A47;cursor:pointer} .p3-go{background:#1E2A47;color:#fff;margin-left:auto}
.p3-why{font-size:12.5px;color:#4A5672} .p3-why p{margin:4px 0 0;max-width:70ch} .p3-bar{display:flex;flex-direction:column;gap:6px} .p3-f{display:flex;flex-wrap:wrap;align-items:center;gap:6px} .p3-f>span{font-size:12.5px;color:#4A5672;min-width:120px}
.p3-t{font:inherit;font-size:12.5px;padding:3px 10px;border:1px solid #8A94AA;border-radius:999px;background:#fff;color:#1E2A47;cursor:pointer} .p3-t i{font-style:normal;color:#5E6782;margin-left:2px} .p3-t:disabled{color:#B5BBC7;border-color:#D9DDE5;cursor:default} .p3-na{font-size:12px;color:#5E6782} .p3-pre{margin:0;font-size:12.5px;color:#4A5672} .p3-t.off{color:#5E6782;border-style:dashed;text-decoration:line-through}
.p3-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px} .p3-c{position:relative;display:grid;grid-template-columns:1fr auto;gap:2px 6px;text-align:left;font:inherit;border:1px solid #E3E6EC;border-radius:6px;background:#fff;padding:10px 10px 8px;cursor:pointer;overflow:hidden}
.p3-h4{font-size:14px;font-weight:600;margin:18px 0 8px;color:#1E2A47}.p3-rows{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px}.p3-row{display:grid;grid-template-columns:6px 1fr;column-gap:10px;align-items:center;text-align:left;font:inherit;background:#fff;border:1px solid #D9DDE3;border-radius:6px;padding:10px 12px;cursor:pointer}.p3-row .p3-tab{grid-row:1/3;align-self:stretch;width:6px;height:auto;position:static;border-radius:2px}.p3-row b{font-weight:600;color:#1E2A47}.p3-row span:last-child{font-size:12.5px;color:#4A5672}.p3-row.dim{opacity:.55;cursor:default}.p3-row:hover:not(.dim){border-color:#5E6782}.p3-row.on{border:2px solid #1E2A47;padding:9px 11px}.p3-next{margin:18px 0 6px}
.p3-ha.p3-fl{font-weight:400;color:var(--bd-ink-2,#4A5672);background:none;padding:0}.p3-ha.p3-fl b{font-weight:600;color:var(--bd-ink,#1E2A47);margin-right:4px} .p3-ha{grid-column:1/-1;font-size:12px;font-weight:600;color:#8A5A00;background:#FFF2D6;border-radius:3px;padding:1px 6px;justify-self:start;margin-top:2px} .p3-c:hover{border-color:#5E6782} .p3-c.dim{opacity:.35} .p3-c.chosen{border-color:#1E2A47;box-shadow:0 0 0 1px #1E2A47} .p3-tab{position:absolute;left:0;top:0;width:28px;height:4px} .p3-m{grid-column:1/-1;display:block;height:110px} .p3-m svg{width:100%;height:110px}
.p3-pie{display:none} .p3-c>span:not(.p3-tab){grid-column:1/-1}   /* HUB-C33: no ring; the text runs the card's full width */ .p3-h{font-size:13.5px;font-weight:600;color:#1E2A47} .p3-s,.p3-n{font-size:12px;color:#4A5672} .p3-ch{position:absolute;right:8px;top:8px;font-size:12px;font-weight:600;color:#1E2A47}
.p3-dh{margin:4px 0 0;font-size:17px;font-weight:600;color:#1E2A47} .p3-ok{margin:0;font-size:13px;color:#4A5672} .p3-dg{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:16px;align-items:start} .p3-axo svg{width:100%;height:auto;max-height:520px}
.p3-side{display:flex;flex-direction:column;gap:8px} .p3-lg{columns:3 230px;column-gap:24px;font-size:12.5px;color:#4A5672;margin:10px 0 4px}.p3-lg .f1m-lg{display:flex;align-items:center;gap:6px;break-inside:avoid;margin:0 0 4px} .p3-lg .f1m-lg{display:flex;align-items:center;gap:6px} .p3-lg .f1m-lg svg{flex:none}
.p3-pls{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px} .p3-pl{margin:0} .p3-pl figcaption{font-size:12.5px;color:#4A5672} .p3-stub{display:flex;align-items:center;justify-content:center;min-height:90px;background:#F4F5F7}[data-p3]{max-height:calc(100vh - 240px);overflow:auto;padding-right:6px;-webkit-mask-image:linear-gradient(to bottom,#000 calc(100% - 28px),transparent);mask-image:linear-gradient(to bottom,#000 calc(100% - 28px),transparent)}
.p3-pl svg{display:block;width:100%;height:clamp(110px,calc(100vh - 860px),300px)} .p3-src{font-size:12px;color:#5E6782;margin:0}
@media (max-width:700px){ .p3-dg{grid-template-columns:minmax(0,1fr)} .p3-f>span{min-width:0;flex-basis:100%} }`;

let LF=null; const getLF=async()=>{ if(LF!==null) return LF; try{ const r=await fetch(`${AB()}data/layout_filters.json`); LF=r.ok?await r.json():false; }catch(e){ LF=false; } return LF; };    
 
const stubOf=(F,row)=>{ const r=F.plans[row], g=k=>r[F.fields.indexOf(k)]; return {id:String(g('id')),typology:g('typology'),MW:+g('MW'),_stub:true,_st:+g('storeys'),_band:g('density')==='4+'?'4+':'3',_pub:null,security:g('entrance')==='shared'?'shared':'separate',density:g('density')==='4+'?'high':'standard',storeys:[],shares:{total:null,byZone:[]},checks:{}}; };
let LOTS=null; const getLots=async()=>{ if(LOTS!==null) return LOTS; try{ const r=await fetch(`${AB()}data/lib_lots_van.json`); LOTS=r.ok?await r.json():false; }catch(e){ LOTS=false; } return LOTS; };
 
async function full(v,typ,x){ let p=null; try{ p=BD.f1best&&BD.f1best.planData?await BD.f1best.planData({source:'best',plan:v.plan},x):null; }catch(e){}
  if(p) return Object.assign({},p,{fitsLots:v.fitsLots||p.lotsFitted});
  const id=String(v.plan); return {id,typology:typ,MW:+v.MW,_stub:true,_pub:v.publicProgramPct,_st:v.storeys,fitsLots:v.fitsLots,security:/_shared_/.test(id)?'shared':'separate',density:/_high_/.test(id)?'high':'standard',storeys:[],shares:{total:null,byZone:[]},checks:{}}; }
async function build(x,mode){
  if(x.city==='edm'&&BD.f1edm&&BD.f1edm.picker){ const r=await BD.f1edm.picker(x,mode); if(r) return r; }    
  if(!document.getElementById('p3-css')){ const s=document.createElement('style'); s.id='p3-css'; s.textContent=CSS; document.head.appendChild(s); }
  const lot=x.sel&&String(x.sel.id); let D=null;
  let dk=lot, JN=null; if(x.city==='van'&&BD.f1best&&BD.f1best.index){ try{ const I0=await BD.f1best.index('van'), e0=I0&&I0.index&&I0.index[lot]; if(e0&&e0.joinedSite&&e0.status!=='plan fits'){ dk=String(e0.joinedSite); const C0=await fetch('data/coverage_public.json').then(r=>r.ok?r.json():null).catch(()=>null), P0=C0&&C0.van&&C0.van.lots&&C0.van.lots[dk]; JN=((P0&&P0.pair&&P0.pair.addresses)||[]).map(a=>String(a).toLowerCase().replace(/\b([a-z])/g,m=>m.toUpperCase()).replace(/\b(\d+)(St|Nd|Rd|Th)\b/g,(m,n,q)=>n+q.toLowerCase())); } }catch(e){} }    
   
  if(x.city==='van'){ try{ const LL=await getLots(); const e=LL&&LL.lots&&LL.lots[dk]; if(e&&e.byTypology){ const plans=[], none=[];
      for(const [typ,v] of Object.entries(e.byTypology)){ if(!v||v.none||typeof v==='string'){ none.push([typ,String((v&&v.none)||v||'').replace(/^none:\s*/,'')]); continue; } plans.push(await full(v,typ,x)); }
      plans.sort((a,b)=>(+b.MW||0)-(+a.MW||0));
      const I=BD.f1best&&await BD.f1best.index('van'), le=I&&I.index&&I.index[dk];
      if(le&&le.best&&le.best.board){ const bp=await full({plan:le.best.plan,MW:le.best.MW,storeys:le.best.storeys},le.best.typology,x); plans.unshift(Object.assign(bp,{_ref:true})); }     if(le&&le.status==='plan fits') for(const a of [le.best,...(le.alternatives||[])].filter(Boolean)){ if(/^board/.test(a.plan)||plans.some(q=>q.id===a.plan)) continue; plans.push(Object.assign(await full({plan:a.plan,MW:a.MW,storeys:a.storeys,fitsLots:a.lotsFitted},a.typology,x),{_alt:true})); }
      try{ const F=await getLF(), rows=F&&F.lots&&F.lots.van&&F.lots.van[dk]; if(Array.isArray(rows)){ const have=new Set(plans.map(p=>p.id)), more=rows.map(i=>stubOf(F,i)).filter(p=>!have.has(p.id)).sort((a,b)=>(+b.MW||0)-(+a.MW||0)); plans.push(...more); } }catch(e){ console.warn('every fitting layout',e); }    
      if(plans.length) D={plans,away:plans.every(p=>BD.f1best.away(p.id,lot)),byTyp:true,none}; } }catch(err){ console.warn('by typology',err); } }
  if(!D&&x.city==='van'){ try{ const r=await fetch(`${AB()}f1/plans/van_${lot}.json`); D=r.ok?await r.json():null; }catch(e){} }
   
  if((!D||!D.plans||!D.plans.length)&&(x.city==='van'||x.city==='edm')&&BD.f1best&&BD.f1best.index){ try{ const I=await BD.f1best.index(x.city), e=I&&I.index&&I.index[lot];    
    if(e&&e.status==='plan fits'&&e.best){ const ps=[]; for(const a of [e.best,...(e.alternatives||[])]){ if(/^board/.test(a.plan)) continue; const p=await BD.f1best.planData({source:'best',plan:a.plan},x); if(p&&!ps.some(q=>q.id===p.id)) ps.push(p); } if(ps.length) D={plans:ps,away:true}; } }catch(e){} }
  if(!D||!D.plans||!D.plans.length) return {draw:'<p class="f1v-empty">No layout in the library fits this lot.</p>',lead:'Pick a layout for this lot.'};
   
  let pulled=0; if(BD.f1best&&BD.f1best.oldF){ await BD.f1best.oldF(); const ok=D.plans.filter(p=>!BD.f1best.oldRows(p.id)); pulled=D.plans.length-ok.length;
    if(ok.length){ if(pulled) D=Object.assign({},D,{plans:ok}); } else { pulled=0; D=Object.assign({},D,{plans:D.plans.map(p=>Object.assign({},p,{_old:BD.f1best.oldRows(p.id)}))}); } }
  const chosen=BD.f1best&&BD.f1best.current?BD.f1best.current(lot):null;
  if(!ST||ST.lot!==lot||ST.plans.length!==D.plans.length) ST={lot,plans:D.plans,off:OFF||(OFF=defOff()),open:null,chosen}; else ST.chosen=chosen; ST.away=!!D.away; ST.none=D.none||null; ST.byTyp=!!D.byTyp; ST.x=x;
  try{ ST.flood=BD.f1flood?await BD.f1flood.forLot(x.sel&&String(x.sel.id)===String(lot)?x.sel:{city:x.city,id:lot}):null; }catch(e){ ST.flood=null; }    
  const AWAY=(JN?` No layout fits this lot alone. These fit it joined with the lot beside it as one site (${JN.join(' + ')}; Needs 2 lots joined).`:'')+(D.away?' These are the library layouts that fit it, not re-planned for it.':'')+(pulled?` ${pulled} layout${pulled>1?'s':''} from the earlier library ${pulled>1?'are':'is'} left out: ${pulled>1?'they fail':'it fails'} the change-room or pool-deck check and ${pulled>1?'are':'is'} being redone.`:'');
  const CNT=D.byTyp?[['Typologies that fit',n0(new Set(D.plans.map(p=>p.typology)).size)],['Layouts listed',n0(D.plans.length)]]:[['Layouts that fit',n0(D.plans.length)]];
  setTimeout(paint,0);
  if(mode==='avail'){ ST.avail=true; ST.open=ST.pending||null; ST.pending=null;     setTimeout(paint,0); return {draw:`<div data-p3>${grid()}</div>`,lead:'The layouts that match your preferences. Open one to see it storey by storey, then choose it.'+AWAY,rows:[['Available',n0(D.plans.filter(p=>!hidden(p)).length)],...CNT],src:['Layouts: the tool’s review pool (art export v0.6, 21 Nov 2026).']}; }
  ST.avail=false;
  return {draw:`<div data-p3>${choice()}</div>`,lead:'Choose a program and your preferences. The layouts that match are listed on the next card, where you open one and choose it.'+AWAY,
    rows:[...CNT,['Programs',n0(new Set(D.plans.map(p=>p.typology)).size)],['Chosen',chosen?(TN[(D.plans.find(p=>p.id===chosen)||{}).typology]||'—'):'none yet']],
    src:['Layouts: the tool’s review pool (art export v0.6, 21 Nov 2026), generated, not admitted until reviewed. Massing and storey plans from zones (one renderer).']}; }

 
 
function okIdx(a){ const off=OFF||defOff(), v={typology:a.typology,security:/_shared_/.test(a.plan||'')?'shared':'separate',band:(+a.storeys||0)>=4?'4+':'3'}; return !Object.entries(v).some(([f,x])=>off[f]&&off[f].has(x)); }
function topFor(e){ const all=(BD.f1best&&BD.f1best.allOf?BD.f1best.allOf(e):[e.best,...(e.alternatives||[])]).filter(a=>a&&a.plan&&!/^board/.test(a.plan)&&!/^V339/.test(a.plan)), ok=all.filter(okIdx), pool=ok.length?ok:all; return pool.slice().sort((a,b)=>(+b.MW||0)-(+a.MW||0))[0]||e.best; }
function hcLabel(cap){ const off=OFF||defOff(), b=off.band||new Set(), isDef=!OFF||(Object.keys(off).every(k=>k==='band'||!off[k]||!off[k].size)&&b.size===1&&b.has('4+'));
  const bandTxt=b.has('4+')&&!b.has('3')?'1-3 storeys':b.has('3')&&!b.has('4+')?'4+ storeys':'any number of storeys', nt=off.typology&&off.typology.size?Object.keys(TN).length-off.typology.size:0;
  const t=isDef?'the highest-capacity layout for your filters (1-3 storeys by default)':`the highest-capacity layout for your filters (${bandTxt}, ${nt?nt+' program'+(nt===1?'':'s'):'all programs'})`; return cap?t[0].toUpperCase()+t.slice(1):t; }
BD.f1hc=hcLabel;
async function chosen(x,o){ const lot=x&&x.sel&&String(x.sel.id); let id=BD.f1best&&BD.f1best.current?BD.f1best.current(lot):null;
   
  if(!id&&x&&x.city==='van'&&BD.f1best&&BD.f1best.index){ try{ const I=await BD.f1best.index('van'), e=I&&I.index&&I.index[lot]; if(e&&e.status==='plan fits'&&e.best&&e.best.plan&&!/^board/.test(e.best.plan)&&!/^V339/.test(e.best.plan)){ id=topFor(e).plan; var STANDIN=true; } }catch(err){} }
  if(!id||(x.city!=='van'&&x.city!=='edm')) return null;
  if(x.city==='edm'&&BD.f1edm){ const Y=await BD.f1edm.layout(id); return Y?Object.assign(JSON.parse(JSON.stringify(Y)),{typName:TN[Y.typology]||Y.typology}):null; }
  let D=ST&&ST.lot===lot?{plans:ST.plans}:null; if(!D&&x.city==='van'){ try{ const r=await fetch(`${AB()}f1/plans/van_${lot}.json`); D=r.ok?await r.json():null; }catch(e){} }
  let p=D&&D.plans&&D.plans.find(q=>q.id===id); if(!p&&BD.f1best&&BD.f1best.planData){ try{ p=await BD.f1best.planData({source:'best',plan:id},x); }catch(e){} }     return p?Object.assign(o&&o.raw?JSON.parse(JSON.stringify(p)):streetDown(p),{typName:TN[p.typology]||p.typology},typeof STANDIN!=='undefined'&&STANDIN?{_best:true}:{}):null; }    
BD.f1pick3=Object.assign({streetDown,build,chosen,pie,ZS,pass,pubPct,haLine,HA,apLines},api);
})();

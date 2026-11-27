 
(function(){
'use strict';
const BD=window.BD=window.BD||{};
const INK='#1E2A47', INK2='#4A5672', INK3='#6B7590', RULE='#D9DDE3', NAVY='#3D5185', AMBER='#8A3B00', PALE='#E4E7EC', YARD='#C9CED8';
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const n0=v=>Math.round(+v||0).toLocaleString('en-CA'), n1=v=>(+v).toFixed(1);
const J={}; const get=u=>J[u]||(J[u]=fetch((BD.ASSET_BASE||'')+u).then(r=>r.ok?r.json():null).catch(()=>null));
const col=(z,t)=>BD.f1mass&&BD.f1mass.colour?BD.f1mass.colour(z,t):'#C3CAD6';

 
function steps(P,LB){ const lot=P.site&&P.site.lot; if(!lot||!lot.length) return null;
  const s1=(P.storeys||[]).find(s=>s.st===1); const W=200, H=270, pad=8;
  const U1=Math.max(...lot.map(q=>q[0])), V1=Math.max(...lot.map(q=>q[1])), V0=Math.min(...lot.map(q=>q[1])), sc=Math.min((W-2*pad)/(V1-V0),(H-2*pad-18)/U1);
  const X=(u,v)=>[pad+(v-V0)*sc,pad+(U1-u)*sc], pt=q=>X(q[0],q[1]).map(n=>n.toFixed(1)).join(','), poly=(ps,f,extra)=>`<polygon points="${ps.map(pt).join(' ')}" fill="${f}"${extra||''}/>`;
  const rect=(r,f,extra)=>poly([[r[0],r[2]],[r[1],r[2]],[r[1],r[3]],[r[0],r[3]]],f,extra);
  let A=0; for(let i=0;i<lot.length;i++){ const a=lot[i], b=lot[(i+1)%lot.length]; A+=a[0]*b[1]-b[0]*a[1]; } const sg=A>0?1:-1;
  const yards=(P.site.edges||[]).filter(e=>e.yard>0).map(e=>{ const dx=e.b[0]-e.a[0], dy=e.b[1]-e.a[1], L=Math.hypot(dx,dy)||1, nx=-dy/L*sg, ny=dx/L*sg, d=e.yard; return [e.a,e.b,[e.b[0]+nx*d,e.b[1]+ny*d],[e.a[0]+nx*d,e.a[1]+ny*d]]; });
  const Y=P.yard||{}, rings=Y.rings||[], tc=Y.truckCourt&&Y.truckCourt.rect, plant=(P.plant||[]).filter(q=>q.rect);
  const zones=s1?s1.zones:[], typ=P.typology;
  const lotLine=`<polygon points="${lot.map(pt).join(' ')}" fill="none" stroke="${INK}" stroke-width="1.2" stroke-dasharray="4 3"/>`;
  const street=`<line x1="0" y1="${(H-16).toFixed(1)}" x2="${W}" y2="${(H-16).toFixed(1)}" stroke="${INK}" stroke-width="1.6"/><text x="${W/2}" y="${H-2}" text-anchor="middle" font-size="12" fill="${INK3}">street</text>`;
  const L1=dark=>yards.map(q=>poly(q,dark?YARD:'#EEF0F3')).join('');
  const L2=dark=>rings.map(r=>poly(r,dark?'#AEB4BF':PALE)).join('')+(tc?rect(tc,dark?'#D3D7DE':'#EEF0F3'):'')+(dark?plant.map(q=>rect(q.rect,'#8A94AA')).join(''):'');
  const L4=mode=>zones.map(z=>(z.rects||[]).map(r=>{ const core=/^core/.test(z.zone), pub=/^public/.test(z.zone), heat=/heat/.test(z.zone);
    const f=mode==='all'?col(z.zone,typ):mode==='core'?(core?NAVY:PALE):mode==='pub'?(pub||heat?col(z.zone,typ):PALE):PALE; return rect(r,f,` stroke="#fff" stroke-width=".4"`); }).join('')).join('');
  const svg=body=>`<svg viewBox="0 0 ${W} ${H}" role="img" style="display:block;width:100%;height:auto">${body}${lotLine}${street}</svg>`;
  const sb=P.setbacks&&P.setbacks.required||{}, cores=zones.filter(z=>/^core/.test(z.zone)).reduce((a,z)=>a+(z.rects||[]).length,0);
  const gens=plant.filter(q=>/^g/.test(q.id)).length, tx=plant.filter(q=>/^t/.test(q.id)).length, ch=plant.filter(q=>/^c/.test(q.id)).length;
   
  const GU=LB&&LB.generatorUnits&&LB.generatorUnits[0], RG=LB&&LB.refugeGenerator;
  const genTxt=GU?`${GU.n} data-centre generator${GU.n>1?'s':''} of ${n0(GU.kW)} kW${RG?` and the hub’s own ${n0(RG.kW)} kW generator`:''}`:`${gens?`${gens} data-centre generator${gens>1?'s':''}`:''}${plant.some(q=>/^h/.test(q.id))?', the hub’s own generator':''}${tx?`, ${tx} transformer pad${tx>1?'s':''}`:''}${ch?`, ${ch} chiller${ch>1?'s':''}`:''}`;
  const out=[
    ['The lot and its yards',svg(L1(true)),`Zoning yards: ${['side','rear','front'].filter(k=>sb[k]!=null).map(k=>`${k} ${n1(sb[k])} m`).join(', ')}.`],
    ['Plant yard and truck court',svg(L1(false)+L2(true)),`${n0(LB&&LB.yardM2||Y.area)} m² of yard${genTxt?`: ${genTxt.replace(/^, /,'')}`:''}${tc?`; the truck court, ${n0(Y.truckCourt.area)} m²`:''}.${GU&&gens&&gens!==GU.n?` Drawn with an earlier generator size; the figures use ${GU.n} × ${n0(GU.kW)} kW.`:''}`],    
    ['The building at grade',svg(L1(false)+L2(false)+L4('all')),'Zones fill what is left: the public part at the street, the data centre behind.'],
    ['Cores',svg(L1(false)+L2(false)+L4('core')),'Stairs and lifts (navy), through every storey.'],
    ['Public rooms',svg(L1(false)+L2(false)+L4('pub')),'Public rooms at the street, where people come in.']];
  return out; }

 
function funnel(C){ const T=C.tried||1, rows=[['Layouts tried',`every use, density and setting on the ${C.lots} lots`,C.tried,null],['A layout fits','the generator finds one that meets its rules',C.fits,C.tried-C.fits]];
  let prev=C.fits; for(const b of C.bands){ rows.push([b.t,b.sub,b.n,prev-b.n,b.g]); prev=b.n; }
  const fire=(C.example&&C.example.rows&&C.example.rows.fire)||[];
  return rows.map(([t,sub,n,lost,g],i)=>{ const w=Math.max(18,100*n/T), on=g==='fire';
    const bar=`<div class="fn-row"><div class="fn-bw"><div class="fn-b${on?' on':''}" style="width:${w.toFixed(1)}%;--w:${w.toFixed(1)}%"><span><b>${esc(t)}</b><small>${esc(sub)}</small></span><b class="fn-n">${n0(n)}</b></div></div><div class="fn-lost${lost?' y':''}">${lost==null?'':lost?`${n0(lost)} dropped here (${Math.round(100*lost/(i===1?C.tried:rows[i-1][2]))} %)`:'none dropped'}</div></div>`;
    return bar+(on&&fire.length?`<div class="fn-rules"><b>Fire separations: the rules (shown on the ${esc(C.example.addr)} emergency hub layout)</b><ul>${fire.map(r=>`<li><span>${esc(r[0])}</span><span class="${r[1]==='fail'?'f':''}">${r[1]==='pass'?'passes':esc(r[1])}</span></li>`).join('')}</ul></div>`:''); }).join(''); }

const CSS=`.fn h2{font-size:22px;font-weight:600;margin:34px 0 6px;color:${INK}} .fn .fn-ld{color:${INK2};margin:0 0 16px;max-width:70ch}
.fn-steps{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:18px;margin:0 0 8px} .fn-steps>figure{display:grid;grid-template-rows:subgrid;grid-row:span 3;row-gap:6px;align-content:start} .fn-steps h3{font-size:14px;font-weight:600;margin:0;color:${INK};line-height:1.3;min-height:2.6em;align-self:end} .fn-steps>figure>svg{align-self:start} .fn-steps p{font-size:13px;color:${INK2};margin:0;line-height:1.4}
.fn-note{font-size:12px;color:${INK3};margin:0 0 14px}
.fn-row{display:grid;grid-template-columns:minmax(0,760px) 220px;gap:12px;align-items:center;margin:0 0 6px} .fn-bw{display:flex;justify-content:center}
.fn-b{background:${NAVY};color:#fff;display:flex;justify-content:space-between;align-items:center;gap:10px;padding:7px 12px;min-height:46px;box-sizing:border-box} .fn-b.on{background:${INK}} .fn-b span{display:flex;flex-direction:column;min-width:0} .fn-b b{font-size:14px} .fn-b small{font-size:12px;opacity:.85;line-height:1.3} .fn-n{font-size:15px}
.fn-lost{font-size:13px;color:${INK3}} .fn-lost.y{color:${INK};font-weight:600;padding:6px 0} .fn-lost.y::before{content:'';display:inline-block;width:9px;height:9px;background:${AMBER};margin-right:8px;vertical-align:0}
.fn-rules{max-width:760px;background:#F4F5F7;padding:12px 14px;margin:4px 0 14px;font-size:13px} .fn-rules ul{list-style:none;margin:8px 0 0;padding:0} .fn-rules li{display:flex;justify-content:space-between;gap:12px;padding:2px 0;color:${INK2}} .fn-rules li span:last-child{color:${INK3}} .fn-rules li span.f{color:${AMBER};font-weight:600}
.fn-src{font-size:12px;color:${INK3};margin:10px 0 0;max-width:760px}
@media (max-width:900px){ .fn-steps{grid-template-columns:repeat(2,minmax(0,1fr))} .fn-row{grid-template-columns:1fr} .fn-bw{justify-content:flex-start} .fn-lost.y,.fn-lost{padding-left:10px}
  .fn-b{width:100%!important;background:linear-gradient(90deg,${NAVY} var(--w),${INK3} var(--w))} .fn-b.on{background:linear-gradient(90deg,${INK} var(--w),${INK3} var(--w))} .fn-b small,.fn-b b{white-space:normal;overflow:visible;text-overflow:clip} }`;    

async function html(){ const [P,C,LBV]=await Promise.all([get('f1/l3/plan339.json'),get('f1/checks135.json'),get('f1/lib_best_van.json')]); const LB=LBV&&LBV.index&&LBV.index['63819485']&&LBV.index['63819485'].best; let out='';
  const S=P?steps(P,LB):null;
  if(S) out+=`<h2>How a layout is drawn</h2><p class="fn-ld">Shown on 339 1st Ave E: its reference Emergency hub layout, ${(+(LB&&LB.MW||P.MW)).toFixed(2)} MW. Each step adds one layer (dark) to the earlier ones (pale).</p><div class="fn-steps">${S.map(([t,svg,cap],i)=>`<figure style="margin:0"><h3>${i+1}&nbsp; ${esc(t)}</h3>${svg}<p>${esc(cap)}</p></figure>`).join('')}</div>`;
  if(C) out+=`<h2>The checks</h2><p class="fn-ld">Each layout goes through these checks in this order. A band is as wide as the layouts still standing; amber marks where some dropped out.</p>${C.sample?`<p class="fn-note">Counts from a sample of ${C.lots} lots in Vancouver and Edmonton.</p>`:''}${funnel(C)}<p class="fn-src">Counts: ${C.sample?`a sample run of ${C.lots} lots in Vancouver and Edmonton (${esc(C.made)})`:'every lot in the library run'}. Rules: the tool’s checks, with their sources in the Source breakdown.</p>`;
  return out?`<style>${CSS}</style><div class="fn">${out}</div>`:''; }
BD.f1funnel={html,steps,funnel};
})();

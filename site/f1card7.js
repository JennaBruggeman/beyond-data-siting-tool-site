 
(function(){
const BD=window.BD=window.BD||{};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const n0=v=>Math.round(+v||0).toLocaleString('en-CA'), f2=v=>(+v).toFixed(2), r10=v=>Math.round(v/10)*10;
const INK='#1E2A47', INK2='#4A5672', ELEC='#9AA3B5', HALL='#8C9DBD', DCS='#B9C5DA', HEAT='#E5338F', HEATL='#F3A2C8', PROG='#F28C38', SUP='#FDE5D0', LOW='#8A3B00';
let D=null; const get=()=>D||(D=fetch('f1/l3/card7_339.json').then(r=>r.ok?r.json():null).catch(()=>null));

function energy(d){ const R=(BD.eng&&BD.eng.R)||{}, P=R.pue||[1.4,1.55], LF=R.lfR||[0.4,0.6], MW=+d.MW, FAC=MW*P[1], OVH=FAC-MW, yr=p=>LF.map(l=>r10(p*8760*l));
  const W=900, K=120/MW, top=70, xA=230, xB=470, xC=700, xD=840, hF=FAC*K, hI=MW*K, hO=OVH*K, yI=top, yO=top+hI+26, yH=top+10, yP=yH-70, H=top+hF+150;
  const t=(x,y,s,sz,wt,fill,anch,halo)=>`<text x="${x}" y="${y}" font-size="${Math.round((sz||13)*1.25)}" font-weight="${wt||400}" fill="${fill||INK}" text-anchor="${anch||'start'}"${halo?' stroke="#fff" stroke-width="4" paint-order="stroke" stroke-linejoin="round"':''}>${esc(s)}</text>`;
  const band=(x0,a0,b0,x1,a1,b1,fill,op,dash)=>{ const m=(x0+x1)/2; return `<path d="M${x0},${a0}C${m},${a0} ${m},${a1} ${x1},${a1}L${x1},${b1}C${m},${b1} ${m},${b0} ${x0},${b0}Z" fill="${dash?'none':fill}" fill-opacity="${op||1}"${dash?` stroke="${fill}" stroke-width="1.6" stroke-dasharray="4 3"`:''}/>`; };
  const node=(x,y,h,fill)=>`<rect x="${x}" y="${y}" width="14" height="${h}" fill="${fill}"/>`;
  const o=[ node(xA,top,hF,ELEC), t(xA-12,top+hF/2-8,'Power in',15,600,INK,'end'), t(xA-12,top+hF/2+14,`${f2(MW*P[0])}–${f2(FAC)} MW at the meter`,13,400,INK2,'end'), t(xA-12,top+hF/2+36,`${n0(yr(MW*P[0])[0])}–${n0(yr(FAC)[1])} MWh a year`,13,400,INK2,'end'),
    band(xA+14,top,top+hI,xB,yI,yI+hI,ELEC,.55), band(xA+14,top+hI,top+hF,xB,yO,yO+hO,ELEC,.35), node(xB,yI,hI,HALL), node(xB,yO,hO,DCS),
    band(xB+14,yI,yI+hI,xC,yH,yH+hI,ELEC,.55), band(xB+14,yO,yO+hO,xC,yH+hI,yH+hF,ELEC,.35), node(xC,yH,hF,HEAT),
    band(xC+14,yH,yH+hF,xD,yH+40,yH+40+hF,HEATL,.85), node(xD,yH+40,hF,HEATL), band(xC+14,yH,yH+22,xD,yP,yP+22,HEAT,1,true), `<rect x="${xD}" y="${yP}" width="14" height="22" fill="none" stroke="${HEAT}" stroke-width="1.6" stroke-dasharray="4 3"/>`,
    t(xB+7,yI-34,'Servers',15,600,INK,'middle',1), t(xB+7,yI-12,`${f2(MW)} MW · ${n0(yr(MW)[0])}–${n0(yr(MW)[1])} MWh a year`,13,400,INK2,'middle',1),
    t(xB+7,yO+hO+20,'Cooling and power losses',15,600,INK,'middle',1), t(xB+7,yO+hO+44,`${f2(MW*P[0]-MW)}–${f2(OVH)} MW (PUE ${P[0]}–${P[1]})`,13,400,INK2,'middle',1),
    t(xC+7,yH+hF+22,'Heat out',15,600,INK,'middle',1), t(xC+7,yH+hF+46,`up to ${f2(FAC)} MW (upper bound)`,13,400,INK2,'middle',1),
    t(xD+22,yH+40+hF/2-8,'Rejected at the plant',15,600), t(xD+22,yH+40+hF/2+14,'air-cooled chillers',13,400,INK2), t(xD+22,yH+40+hF/2+34,`up to ${f2(FAC)} MW (upper bound)`,13,400,INK2),
    t(xD+22,yP+8,'To the public floors',15,600), t(xD+22,yP+26,'share not known',13,400,INK2) ];
  return `<svg viewBox="0 0 ${W+300} ${H}" role="img" aria-label="Where the power goes, to scale in megawatts" style="width:100%;height:auto;font-family:'IBM Plex Sans',system-ui,sans-serif">${o.join('')}</svg>
    <p class="c7-n">Servers ${f2(MW)} MW is the reference layout’s IT load (single source). Power in = servers × PUE ${P[0]}–${P[1]}; bands drawn at ${P[1]}. Yearly figures use a load factor of ${LF[0]}–${LF[1]}. Bands are to scale in MW; rounded to 2 decimals, so parts may not add exactly.</p>
    <details class="c7-d"><summary>How it is worked out</summary><p>Power in = IT MW × PUE · yearly = MW × 8,760 h × load factor · losses = power in − IT · heat out = power in. PUE: Lawrence Berkeley National Laboratory 2023 and the Uptime Institute 2025 survey (industry figures, not this design). Load factor: Uptime Institute 2024 survey (low), Fan et al. 2007 (high). All of an air-cooled hall’s heat goes to the chillers until a heat pump lifts some of it.</p></details>`; }

function groups(d){ const G=d.G||{}, BOH=new Set(d.clinicBOH||[]), SMALL=d.small||15, TINY=d.tiny||5, nm=r=>String(r.name).split(' (')[0];
  const rs=d.rooms, prog=rs.filter(r=>r.zone==='public-program'&&!BOH.has(r.id)&&r.area>=TINY), sup=rs.filter(r=>(r.zone==='public-support'||BOH.has(r.id))&&r.area>=TINY);
  const row=(label,area,gk,drawer,members)=>({label,area,g:gk&&G[gk]?G[gk]:null,drawer,members});
  const pub=[], spt=[], dc=[]; const ex=prog.filter(r=>/^ex\d$/.test(r.id)); if(ex.length) pub.push(row(`Exam rooms (${ex.length})`,ex.reduce((a,r)=>a+r.area,0),'ex',null,ex));
  const rest=prog.filter(r=>!ex.includes(r)), big=rest.filter(r=>r.area>=SMALL), small=rest.filter(r=>r.area<SMALL);
  big.forEach(r=>pub.push(row(nm(r),r.area,G[r.id]?r.id:null)));
  if(small.length>1) pub.push(row(`Smaller program rooms · ${small.length} rooms`,small.reduce((a,r)=>a+r.area,0),null,small.map(r=>`${nm(r)} ${n0(r.area)} m²`).join(' · '))); else small.forEach(r=>pub.push(row(nm(r),r.area,G[r.id]?r.id:null)));
  const wcs=sup.filter(r=>/^wc/.test(r.id)), cots=sup.filter(r=>/^cot/.test(r.id)); if(wcs.length) spt.push(row(`WCs, women and men (${wcs.length} rooms)`,wcs.reduce((a,r)=>a+r.area,0),'wc')); if(cots.length) spt.push(row(`Cot and supply storage (${cots.length} rooms)`,cots.reduce((a,r)=>a+r.area,0),'cot'));
  const others=sup.filter(r=>!wcs.includes(r)&&!cots.includes(r)), clin=others.filter(r=>BOH.has(r.id)&&r.id!=='uwc'), refu=others.filter(r=>!clin.includes(r));
  for(const [lab,g] of [['Clinic support rooms',clin],['Refuge support rooms',refu]]){ if(g.length>1) spt.push(row(`${lab} · ${g.length} rooms`,g.reduce((a,r)=>a+r.area,0),null,g.map(r=>`${nm(r)} ${n0(r.area)} m²`).join(' · '))); else g.forEach(r=>spt.push(row(nm(r),r.area,G[r.id]?r.id:null))); }
  const area=Object.fromEntries(rs.map(r=>[r.id,r])); for(const [lab,ids] of Object.entries(d.dcGroups||{})){ const m=ids.map(i=>area[i]).filter(Boolean); const a=m.reduce((t,r)=>t+r.area,0); if(a) dc.push(row(lab,a,null,m.length>1?m.map(r=>`${nm(r)} ${n0(r.area)} m²`).join(' · '):null)); }
  const by=a=>a.sort((p,q)=>q.area-p.area); return {pub:by(pub),spt:by(spt),dc:by(dc)}; }

function roomsHTML(d){ const S=groups(d), PX=1.6, CLIP=560;
  const bar=(r,fill)=>{ const w=Math.min(CLIP,r.area*PX), clip=r.area*PX>CLIP, min=r.g&&r.g[0]!=null?r.g[0]:null, mw=min!=null?Math.min(CLIP,min*PX):null, low=min!=null&&r.area<min-0.05;
    return `<div class="c7-r"><div class="c7-l"><b>${esc(r.label)}</b><span>${n0(r.area)} m²</span></div><div class="c7-bw"><div class="c7-b" style="width:${(w/CLIP*100).toFixed(1)}%;background:${fill}">${clip?'<i>//</i>':''}</div>${mw!=null?`<div class="c7-t" style="left:${(mw/CLIP*100).toFixed(1)}%" title="guidance minimum ${n0(min)} m²"></div>`:''}</div>
      <div class="c7-w">${r.g?`${low?`<b class="c7-low">Below guidance: </b>`:''}${esc(r.g[1])}<small>${esc(r.g[2])}</small>`:''}${r.drawer?`<details><summary>▸ ${esc(r.label.split(' · ')[1]||'the rooms')}</summary><p>${esc(r.drawer)}</p></details>`:''}</div></div>`; };
  const sum=a=>a.reduce((t,r)=>t+r.area,0), sec=(t,a,fill)=>a.length?`<h4>${esc(t)} <span>${n0(sum(a))} m²</span></h4>${a.map(r=>bar(r,typeof fill==='function'?fill(r):fill)).join('')}`:'';
  return `<p class="c7-n">Bar length is floor area (clipped at the right edge where marked //). A tick marks the guidance minimum where one exists. Cores, circulation and loading are left out: the guidance doesn’t size them.</p>
    ${sec('Public program',S.pub,PROG)}${sec('Public support',S.spt,SUP)}${sec('Data-centre rooms',S.dc,r=>/^Data hall/.test(r.label)?HALL:DCS)}
    <p class="c7-n">Rooms and areas: the reference layout for 339. Guidance minimums and why-lines: the tool’s room guidance for the emergency hub (clause numbers only, no code text), as read for this card. “Project assumption” = a value set for this project, not an outside source.</p>`; }

const CSS=`<style>.c7 h3{margin:18px 0 4px;font-size:18px;font-weight:600;color:${INK}} .c7 h4{margin:14px 0 4px;font-size:14px;font-weight:600;color:${INK}} .c7 h4 span{font-weight:400;color:${INK2}} .c7-n{font-size:12px;color:${INK2};margin:4px 0}
 .c7{min-width:0;max-width:100%} .c7-r{display:grid;grid-template-columns:200px minmax(0,1fr) 260px;gap:10px;align-items:center;padding:4px 0;border-bottom:1px solid #F1F2F5} .c7-l b{display:block;font-size:13px;color:${INK};font-weight:600} .c7-l span{font-size:12px;color:${INK2}}
 .c7-bw{position:relative;height:16px} .c7-b{height:16px;border-radius:2px;position:relative;border:1px solid rgba(30,42,71,.12)} .c7-b i{position:absolute;right:4px;top:-1px;font-style:normal;color:#fff;font-weight:700} .c7-t{position:absolute;top:-3px;width:2px;height:22px;background:${INK}}
 .c7-w{font-size:12.5px;color:${INK2};line-height:1.35} .c7-w small{display:block;font-size:12px;color:#5E6782} .c7-low{color:${LOW}} .c7-w details summary{cursor:pointer;color:${INK}} .c7-w details p{margin:2px 0 0}
 .c7-d{font-size:12.5px;color:${INK2}} .c7-d summary{cursor:pointer;color:${INK}} @media (max-width:820px){ .c7-r{grid-template-columns:1fr} }</style>`;

async function html(){ const d=await get(); if(!d) return ''; return `${CSS}<section class="c7"><h3>Where the power goes</h3><p class="c7-n">At full load. Every watt the building draws ends up as heat; the question is how much of it the public floors use.</p>${energy(d)}<h3>The rooms, to scale</h3>${roomsHTML(d)}</section>`; }
BD.f1card7={html};
})();

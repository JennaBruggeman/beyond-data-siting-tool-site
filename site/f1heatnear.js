 
(function(){
const BD=window.BD=window.BD||{};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const n0=v=>Math.round(+v||0).toLocaleString('en-CA');
const INK='#1E2A47', INK2='#4A5672', INK3='#8A94AA', BLD='#DADDE2', HEAT='#E5338F', DEEP='#A3155F';
const USE={residential:'Housing',commercial:'Commercial',industrial:'Industrial',school:'School',cd:'Use not known (comprehensive development zone)',unknown:'Use not known'};
let NEU=null; const getNEU=async()=>{ if(NEU!==null) return NEU; try{ const r=await fetch((BD.ASSET_BASE||'')+'f1/neu_van.json'); NEU=r.ok?await r.json():false; }catch(e){ NEU=false; } return NEU; };
const arr=r=>{ if(!r) return []; if(Array.isArray(r)&&Array.isArray(r[0])) return r; const o=[]; const a=Array.isArray(r)?r:Object.values(r); for(let i=0;i+1<a.length;i+=2) o.push([a[i],a[i+1]]); return o; };
const pip=(x,y,R)=>{ let c=false; for(let i=0,j=R.length-1;i<R.length;j=i++){ const [xi,yi]=R[i],[xj,yj]=R[j]; if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi)) c=!c; } return c; };
const segD=(px,py,ax,ay,bx,by)=>{ const dx=bx-ax, dy=by-ay, L=dx*dx+dy*dy||1, t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/L)); return Math.hypot(px-ax-t*dx,py-ay-t*dy); };
const ringDist=(x,y,R)=>{ let d=1e12; for(let i=0,j=R.length-1;i<R.length;j=i++) d=Math.min(d,segD(x,y,R[j][0],R[j][1],R[i][0],R[i][1])); return d; };

 
async function planHeat(x){ const lot=x&&x.sel&&String(x.sel.id); if(!lot||(x.city!=='van'&&x.city!=='edm')) return null;    
  try{ const ch=BD.f1pick3&&BD.f1pick3.chosen?await BD.f1pick3.chosen(x,{raw:true}):null; const h=ch&&ch.heat&&ch.heat.ifLiquidColdPlate; if(h&&h.MWhPerYear) return {r:h.MWhPerYear,from:'the layout you chose',note:h.note,air:ch.heat.airCooled&&ch.heat.airCooled.note}; }catch(e){}
   
  try{ const b=BD.f1best?await BD.f1best.forLot(x):null; if(!b||b.source==='rough') return null; const pl=await BD.f1best.planData(b,x), h=pl&&pl.heat&&pl.heat.ifLiquidColdPlate;
    return h&&h.MWhPerYear?{r:h.MWhPerYear,from:b.board||/board/i.test(b.plan||'')?'the reference layout for this lot':(BD.f1hc?BD.f1hc():'the highest-capacity layout for your filters'),note:h.note,air:pl.heat.airCooled&&pl.heat.airCooled.note}:null; }catch(e){ return null; } }
async function build(x,ORIG){
   
  let D=null, H=null; try{ if(ORIG['Shared energy district']) D=await ORIG['Shared energy district'].build(x); }catch(e){} try{ if(ORIG['Heat offered']) H=await ORIG['Heat offered'].build(x); }catch(e){}
  const S=BD.f1d&&BD.f1d.state&&BD.f1d.state(); if(!S||!S.B) return {draw:'<p class="f1v-empty">No district data for this lot yet.</p>',lead:'Who nearby could use the heat.'};
  const lot=arr((BD.S&&BD.S.sel&&BD.S.sel.ring)||(x.sel&&x.sel.ring)), c=S.c, R=540, W=640, H0=640, s=W/(2*R), P=(px,py)=>[(px-c[0]+R)*s,(c[1]+R-py)*s], xy=q=>{ const p=P(q[0],q[1]); return p[0].toFixed(1)+','+p[1].toFixed(1); };
  const inLot=b=>lot.length&&pip(b.c[0],b.c[1],lot), dist=b=>Math.hypot(b.c[0]-c[0],b.c[1]-c[1]), mid=b=>b.heat?(b.heat[0]+b.heat[1])/2:0;
  const B=S.B.filter(b=>b.r&&dist(b)<R*1.05);
  const big=B.filter(b=>b.heat&&mid(b)>=500&&!inLot(b)&&dist(b)<=500).sort((a,b)=>dist(a)-dist(b));
  const top=big.slice(0,5), next=B.filter(b=>!inLot(b)).sort((a,b)=>dist(a)-dist(b))[0]||null;
  const N=x.city==='van'?await getNEU():null, neuR=N&&N.rings&&N.rings[0];    
  const inNEU=neuR&&pip(c[0],c[1],neuR), neuD=neuR&&!inNEU?ringDist(c[0],c[1],neuR):0;
  const out=[], id='hn'+Math.random().toString(36).slice(2,6);
  out.push(`<defs><pattern id="${id}h" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="10" stroke="${HEAT}" stroke-width="1.2" stroke-opacity=".55"/></pattern><clipPath id="${id}c"><rect width="${W}" height="${H0}"/></clipPath></defs><rect width="${W}" height="${H0}" fill="#F7F8FA"/>`);
  out.push(`<g clip-path="url(#${id}c)">`);
  if(neuR) out.push(`<path d="M${neuR.map(xy).join('L')}Z" fill="url(#${id}h)" stroke="${DEEP}" stroke-width="1.4"/>`);
  const label=b=>`${USE[b.use]||b.use||'Use not known'} · ${b.heat?n0(b.heat[0])+'–'+n0(b.heat[1])+' MWh a year (estimate)':'no heat estimate'}`;
  for(const b of B){ const R1=arr(b.r); if(R1.length<3) continue; const isTop=top.includes(b), isNext=b===next;
    out.push(`<path d="M${R1.map(xy).join('L')}Z" fill="${isTop?'#FFFFFF':BLD}" stroke="${isTop?HEAT:isNext?INK:'#FFFFFF'}" stroke-width="${isTop?2.6:isNext?1.6:0.5}"><title>${esc(label(b))}</title></path>`); }
  for(const rr of [250,500]){ const [cx,cy]=P(c[0],c[1]); out.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(rr*s).toFixed(1)}" fill="none" stroke="${INK3}" stroke-dasharray="6 5"/><text x="${(cx+rr*s*0.707).toFixed(1)}" y="${(cy-rr*s*0.707).toFixed(1)}" font-size="12" font-weight="600" fill="${INK2}" stroke="#fff" stroke-width="3" paint-order="stroke">${rr} m</text>`); }
  if(lot.length) out.push(`<path d="M${lot.map(xy).join('L')}Z" fill="none" stroke="${INK}" stroke-width="1.6"/>`);
  out.push('</g>');
  const lotR=()=>{ const xs=lot.map(q=>q[0]), ys=lot.map(q=>q[1]); return [Math.max(...xs),(Math.min(...ys)+Math.max(...ys))/2]; };    
  const taken=[]; if(next){ const [nx,ny]=P(next.c[0],next.c[1]); taken.push({x0:nx-38,x1:nx+38,y0:ny-46,y1:ny-26}); } if(lot.length){ const q=lotR(), [lx,ly]=P(q[0],q[1]); taken.push({x0:lx-34,x1:lx+62,y0:ly-10,y1:ly+8}); }
  const hit=(x,y)=>taken.some(t=>x+11>t.x0&&x-11<t.x1&&y+11>t.y0&&y-11<t.y1);
  const DISCS=top.map(b=>{ const [px,py]=P(b.c[0],b.c[1]); let dx=0; for(let k=1;k<=8&&hit(px+dx,py);k++) dx=(k%2?1:-1)*Math.ceil(k/2)*24; const qx=px+dx; taken.push({x0:qx-11,x1:qx+11,y0:py-11,y1:py+11}); return {px,py,dx,qx}; });
  const discOut=DISCS.map(({px,py,dx,qx},i)=>(`${dx?`<line x1="${px.toFixed(1)}" y1="${py.toFixed(1)}" x2="${(qx-Math.sign(dx)*10).toFixed(1)}" y2="${py.toFixed(1)}" stroke="${HEAT}" stroke-width="1.2"/><circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="2" fill="${HEAT}"/>`:''}<circle cx="${qx.toFixed(1)}" cy="${py.toFixed(1)}" r="10" fill="#fff" stroke="${HEAT}" stroke-width="1.6"/><text x="${qx.toFixed(1)}" y="${(py+4).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="600" fill="${DEEP}">${i+1}</text>`)).join('');
   
  if(BD.f1streets){ await BD.f1streets.load(); const avoid=[]; DISCS.forEach(d=>{ avoid.push([d.qx-12,d.py-12,d.qx+12,d.py+12]); if(d.dx) avoid.push([Math.min(d.px,d.qx)-2,d.py-3,Math.max(d.px,d.qx)+2,d.py+3]); });
    const lbox=(q,t,dx,dy)=>{ const [px,py]=P(q[0],q[1]), w=t.length*7.4, x1=px+dx; avoid.push(dx<0?[x1-w-4,py+dy-9,x1,py+dy+9]:[x1,py+dy-9,x1+w+4,py+dy+9]); };
    if(lot.length){ lbox(lotR(),'Your lot',4,0); } if(next){ const [px,py]=P(next.c[0],next.c[1]); avoid.push([px-40,py-48,px+40,py-28]); }
    out.push(BD.f1streets.svg(x&&x.sel&&x.sel.id,P,{W,H:H0,fs:11,collFs:11,lotPts:lot.map(q=>P(q[0],q[1])),avoid,max:6,minRun:0.4})); }
   
  out.push(discOut);
   

   
  if(lot.length){ const q=lotR(); let [px,py]=P(q[0],q[1]); px=Math.min(px,W-62); py=Math.max(16,Math.min(py,H0-16)); out.push(`<line x1="${(px-34).toFixed(1)}" y1="${py.toFixed(1)}" x2="${(px+6).toFixed(1)}" y2="${py.toFixed(1)}" stroke="${INK}" stroke-width=".8"/><text x="${(px+10).toFixed(1)}" y="${(py+4).toFixed(1)}" font-size="12" font-weight="600" fill="${INK}" stroke="#fff" stroke-width="3" paint-order="stroke">Your lot</text>`); }    
  if(next){ const [px,py]=P(next.c[0],next.c[1]); out.push(`<text x="${px.toFixed(1)}" y="${(py-32).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="600" fill="${INK}" stroke="#fff" stroke-width="3" paint-order="stroke">Next door</text>`); }
   
   
  out.push(`<g><path d="M${W-26},${H0-62}L${W-20},${H0-44}L${W-26},${H0-48}L${W-32},${H0-44}Z" fill="${INK}"/><text x="${W-26}" y="${H0-30}" text-anchor="middle" font-size="12" font-weight="600" fill="${INK}">N</text>`
    +`<rect x="16" y="${H0-28}" width="${(100*s).toFixed(1)}" height="6" fill="${INK}"/><rect x="${(16+100*s).toFixed(1)}" y="${H0-28}" width="${(100*s).toFixed(1)}" height="6" fill="#fff" stroke="${INK}" stroke-width=".6"/><text x="16" y="${H0-10}" font-size="12" fill="${INK2}">0</text><text x="${(16+200*s).toFixed(1)}" y="${H0-10}" text-anchor="middle" font-size="12" fill="${INK2}">200 m</text></g>`);
  const svg=`<svg viewBox="0 0 ${W} ${H0}" role="img" aria-label="Heat users near the lot and the district energy area" style="display:block;width:100%;height:auto;max-height:calc(100vh - 450px);font-family:'IBM Plex Sans',system-ui,sans-serif">${out.join('')}</svg>`;
  const list=top.map((b,i)=>`<li><b>${i+1}</b> ${esc(USE[b.use]||b.use||'Use not known')}, ${n0(b.heat[0])}–${n0(b.heat[1])} MWh a year, ${n0(dist(b))} m</li>`).join('');
  const key=`<div class="f1c-key"><span><i style="background:#fff;border:2px solid ${HEAT}"></i>big heat user (over 500 MWh a year, estimate), numbered</span><span><i style="background:${BLD};border:1.5px solid ${INK}"></i>next door</span><span><i style="background:repeating-linear-gradient(45deg,${HEAT} 0 1px,transparent 1px 7px);border:1.4px solid ${DEEP}"></i>${neuR?esc(N.system.name)+' ('+esc(N.system.owner)+'): existing district energy system':'existing district energy system'}</span><span>rings: 250 m and 500 m</span></div>`;
  const hero=(H&&H.hero||[]).find(q=>/heat offered/i.test(q.l||''))||(H&&H.hero||[])[0]; const PH=await planHeat(x);
  const neuLine=!neuR?'No district energy area is mapped for this city':inNEU?`Your lot is inside the ${N.system.name} area (${N.system.owner})`:`Nearest district energy system: ${N.system.name} (${N.system.owner}), about ${n0(neuD)} m away`;
   
  const ins=(BD.S.answers&&BD.S.answers.inside)||'air', airC=ins==='air', rg2=r=>`${n0(r[0])} to ${n0(r[1])}`, neuArea=neuR?`${N.system.name} area (${N.system.owner})`:'', neuOn=neuR&&(inNEU||neuD<=500);    
  let PB=null, OWN=''; try{ PB=BD.f1best?await BD.f1best.forLot(x):null; OWN=BD.f1best.ownHeat?await BD.f1best.ownHeat(PB,x):''; }catch(e){}    
  if(PH) return {art:true,draw:`<div class="f1hn">${svg}<p class="f1c-phw-n">${big.length?'Heat users':'No big heat users (over 500 MWh a year) found'} within 500 m of the lot${neuOn?`; the hatched area is the ${esc(neuArea)}`:''}.</p><details class="f1c-phw-fold"><summary>Every big heat user, numbered</summary>${key}<ol class="f1hn-list" style="margin:8px 0 0;padding-left:0;list-style:none;font-size:13.5px;line-height:1.6">${list}</ol><p class="f1c-phw-n">Hover a building on the map to see its use and yearly heat estimate.</p></details></div>`,
    lead:`Who nearby could use the data centre’s heat. ${airC?'With air cooling, how much heat can be captured is not yet known; a liquid-cooled hall would have heat to offer.':'A liquid-cooled hall has heat to offer.'} A possibility to explore, not a costed network.${OWN?'\n'+OWN:''}`,
    hero:airC?[{v:'Not yet known',l:'heat on offer with air cooling (this layout)'},{v:rg2(PH.r),u:' MWh',l:'a year on offer if the hall were liquid-cooled, after the heat pump'}]:[{v:rg2(PH.r),u:' MWh',l:'a year on offer, after the heat pump'}],
    keyHtml:`${big.length?`<span class="f1m-lg"><svg width="22" height="12" aria-hidden="true"><rect width="22" height="12" fill="${HEAT}"/></svg>Heat users nearby</span>`:''}${neuOn?`<span class="f1m-lg"><svg width="22" height="12" aria-hidden="true"><line x1="1" y1="6" x2="21" y2="6" stroke="${DEEP}" stroke-width="1.6"/></svg>Energy utility area</span>`:''}`,
    foot:`Big heat users within 500 m: ${big.length} (estimate).${next?` Next door: ${(USE[next.use]||next.use||'use not known').toLowerCase()}${next.heat?`, ${rg2(next.heat)} MWh a year (estimate)`:''}.`:''}${neuR&&!inNEU?` Nearest district energy system: ${N.system.name}, about ${n0(neuD)} m away.`:''}${PB&&PB.source!=='rough'?` Layout: ${PB.label.replace(/^your /,'the ')}.`:''}`,
    rows:[],meters:[],
    more:[['How the heat users are found',`<p>Each building's yearly heat demand is the tool's estimate from its floor area and use (from the zone). "Big" means over 500 MWh a year. Distances are from the lot's centre.</p>`],['How the heat figure is worked out',`<p>From ${esc(PH.from)} (the layout record): ${n0(PH.r[0])}–${n0(PH.r[1])} MWh a year, ${esc(PH.note||'heat after the heat pump if the hall were liquid-cooled')}. With air cooling: ${esc(PH.air||'how much heat can be captured is not yet known')}.</p>`],...((H&&H.more)||[]).filter(m=>!/cost|price|tariff|gas|capital|pay/i.test(m[0]||'')&&!/heat figure/i.test(m[0]||''))],
    src:[].concat((D&&D.src)||[],(H&&H.src)||[],neuR?[`District energy area: ${N.system.name}, City of Vancouver GIS (updated ${N.updated}). ${N.attribution}`]:[]),
    missing:[].concat(neuR?[]:['district energy service areas'],['other district energy systems: boundaries not published (shown when added as labelled points)'])};
  return {draw:`<div class="f1hn"><p class="f1-hint" style="margin:0 0 6px;font-size:14px;color:${INK2}">Hover a building to see its use and yearly heat estimate.</p>${svg}${key}<ol class="f1hn-list" style="margin:8px 0 0;padding-left:0;list-style:none;font-size:13.5px;line-height:1.6">${list}</ol></div>`,
    lead:`Who nearby could use the heat. ${neuLine}. Big heat users within 500 m: ${big.length} (estimate).${next?` Next door: ${USE[next.use]||next.use||'use not known'}${next.heat?`, ${n0(next.heat[0])}–${n0(next.heat[1])} MWh a year (estimate)`:''}.`:''} A possibility to explore, not a costed network.${OWN?'\n'+OWN:''}`,
    hero:PH?[{v:`${n0(PH.r[0])}–${n0(PH.r[1])}`,u:'MWh a year',l:`heat on offer after the heat pump, liquid-cooled case; air-cooled capture not yet known. From ${PH.from}`}]:hero?[Object.assign({},hero,{l:'upper bound: heat offered, after the heat pump, if all the hall’s heat is lifted. Estimate: the servers’ heat at full use; how much an air-cooled hall can hand over is not yet known'})]:[], rows:[], meters:[],    
    more:[['How the heat users are found',`<p>Each building's yearly heat demand is the tool's estimate from its floor area and use (from the zone). "Big" means over 500 MWh a year. Distances are from the lot's centre.</p>`],...(PH?[['How the heat figure is worked out',`<p>From ${esc(PH.from)} (the layout record): ${n0(PH.r[0])}–${n0(PH.r[1])} MWh a year, ${esc(PH.note||'heat after the heat pump if the hall were liquid-cooled')}. With air cooling: ${esc(PH.air||'how much heat can be captured is not yet known')}.</p>`]]:[]),...((H&&H.more)||[]).filter(m=>!/cost|price|tariff|gas|capital|pay/i.test(m[0]||'')&&!(PH&&/heat figure/i.test(m[0]||'')))],        
    src:[].concat((D&&D.src)||[],(H&&H.src)||[],neuR?[`District energy area: ${N.system.name}, City of Vancouver GIS (updated ${N.updated}). ${N.attribution}`]:[]),
    missing:[].concat(neuR?[]:['district energy service areas'],['other district energy systems: boundaries not published (shown when added as labelled points)'])}; }
 
let DEE=null; const getDEE=async()=>{ if(DEE!==null) return DEE; try{ const r=await fetch((BD.ASSET_BASE||'')+'f1/de_edm.json'); DEE=r.ok?await r.json():false; }catch(e){ DEE=false; } return DEE; };
async function district(x){ const ring=arr((x&&x.sel&&x.sel.ring)||[]); if(ring.length<3) return null; const c=ring.reduce((t,q)=>[t[0]+q[0]/ring.length,t[1]+q[1]/ring.length],[0,0]);
  if(x.city==='van'){ const N=await getNEU(), R=N&&N.rings&&N.rings[0]; if(!R) return null; const inside=pip(c[0],c[1],R); return {inside,name:N.system&&N.system.name,owner:N.system&&N.system.owner,distanceM:inside?0:Math.round(ringDist(c[0],c[1],R)),note:''}; }
  if(x.city==='edm'){ const E=await getDEE(); if(!E||E.x==null) return {inside:false,name:'Blatchford district energy',owner:'Blatchford Renewable Energy (City of Edmonton)',distanceM:null,note:'Blatchford is a point, not a service area; its location is not in the tool yet'};
    return {inside:false,name:E.name,owner:E.owner,distanceM:Math.round(Math.hypot(E.x-c[0],E.y-c[1])),note:'Blatchford is a point, not a service area'}; }
  return null; }
BD.f1heatnear={build,district};
})();

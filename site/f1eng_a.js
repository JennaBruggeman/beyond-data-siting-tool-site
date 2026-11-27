 
(function(){
const AWAYTXT='This layout is a library variant that fits this lot; it is not re-planned for it, so its footprint is not drawn here. The figures are the layout’s own.';    
'use strict';
const BD=window.BD, C=BD.f1cards, K=C.K, esc=C.esc, n0=C.n0, n1=C.n1, T='engineering';
const mwS=v=>Math.abs(v*10-Math.round(v*10))>0.001?(+v).toFixed(2):n1(v);    
C.add(T,'Your city',C.get('architecture','Your city'));
C.add(T,'Your parcel',C.get('architecture','Your parcel'));

if(!document.getElementById('f1c-eng-a')){ const st=document.createElement('style'); st.id='f1c-eng-a'; st.textContent=`
.f1v-draw:has(.f1c-eng-a-wrap){justify-content:flex-start}
.f1c-eng-a-wrap{width:100%;max-width:980px;flex:0 0 auto}
.f1c-eng-a-wrap svg{max-width:100%;height:auto;display:block} .f1c-eng-a-wrap .f1-hint{margin:0 0 6px;font-size:14px;color:#4A5672} .f1c-noise-pick{margin:6px 0 4px;font-size:14px;color:#1E2A47;min-height:1.4em}
.f1c-eng-a-mt{margin-top:18px;border-top:1px solid ${K.rule};padding-top:12px;max-width:900px}
.f1c-eng-a-mt h4{margin:0 0 8px;font-size:13px;font-weight:500;color:${K.ink}}
.f1c-eng-a-rm{position:relative;height:46px;margin:18px 0 0}
.f1c-eng-a-rm .trk{position:absolute;left:0;right:0;top:14px;height:12px;background:${K.hair}}
.f1c-eng-a-rm .band{position:absolute;top:14px;height:12px;background:${K.dcSup}}
.f1c-eng-a-rm .fit{position:absolute;top:14px;height:12px;background:${K.ink}}
.f1c-eng-a-rm .no{position:absolute;top:14px;height:12px;background:${K.red}}
.f1c-eng-a-rm .tk{position:absolute;top:8px;width:2px;height:24px;background:${K.ink}}
.f1c-eng-a-rm .lb{position:absolute;top:30px;font-size:12px;color:var(--bd-ink-3);white-space:nowrap}
.f1c-eng-a-rm .lt{position:absolute;top:-12px;font-size:12px;color:${K.ink2};white-space:nowrap}
.f1c-eng-a-red{color:${K.red}}
.f1c-eng-a-cmp{display:grid;grid-template-columns:150px 1fr;gap:0 18px;align-items:center;font-size:12.5px;color:${K.ink2}}
.f1c-eng-a-cmp h4{grid-column:1/3;margin:12px 0 2px;font-size:14px;font-weight:500;color:${K.ink};border-bottom:1px solid ${K.ink};padding-bottom:6px}
.f1c-eng-a-cmp h4:first-child{margin-top:0}
.f1c-eng-a-cmp .rl{padding:5px 0;border-bottom:1px solid ${K.hair};color:${K.ink}}
.f1c-eng-a-cmp .rl small{display:block;color:var(--bd-ink-3);font-size:12px;margin-top:2px}
.f1c-eng-a-cmp .rb{padding:6px 0;border-bottom:1px solid ${K.hair}}
.f1c-eng-a-bar{display:grid;grid-template-columns:130px 1fr 300px;gap:10px;align-items:center;margin:1px 0;font-size:12px;color:var(--bd-ink-3)}
.f1c-eng-a-bar.pick{color:${K.ink}}
.f1c-eng-a-bar .t{height:11px;background:transparent;position:relative}
.f1c-eng-a-bar .t i{position:absolute;left:0;top:0;height:11px;background:${K.faint}}
.f1c-eng-a-bar .t b{position:absolute;top:0;height:11px;background:${K.faint};opacity:.45}
.f1c-eng-a-bar.pick .t i{background:${K.ink}}
.f1c-eng-a-bar.pick .t b{background:${K.ink};opacity:.35}
.f1c-eng-a-bar .nf{color:${K.red}}
.f1c-eng-a-bar small{display:inline;margin-left:6px;font-size:12px;color:var(--bd-ink-3)}
.f1c-eng-a-tbl{border-collapse:collapse;width:100%;font-size:12px;color:${K.ink2}}
.f1c-eng-a-tbl th{font-weight:400;text-align:left;color:var(--bd-ink-3);border-bottom:1px solid ${K.ink};padding:4px 8px 4px 0;font-size:12px}
.f1c-eng-a-tbl td{padding:5px 8px 5px 0;border-bottom:1px solid ${K.hair};vertical-align:top}
.f1c-eng-a-tbl td.a{color:#8A3B00}.f1c-eng-a-tbl tr.empty td{color:#6B6A66}.f1c-eng-a-tbl td.r{color:${K.red}}
.f1c-eng-a-note{font-size:12px;color:var(--bd-ink-3);max-width:900px;line-height:1.5;margin-top:10px}
`; document.head.appendChild(st); }

const rng=(a,b,d)=>a==null||b==null?'?':(Math.abs(a-b)<0.05*Math.max(1,Math.abs(b))?(d===0?n0(b):n1(b)):(d===0?n0(a)+'–'+n0(b):n1(a)+'–'+n1(b)));
const fmtL=v=>n0(Math.round(v/100)*100);  
const own=(x)=>{ const s=x.sel; return new Set((s.rings||[]).concat([s.ring])); };
const isMine=(x,p)=>{ const s=x.sel; return own(x).has(p.r)||(x.city==='van'?p.id===s.id:(p.ids||[]).includes(s.id)); };
const cen=r=>{ let a=0,b=0,n=0; for(let i=0;i<r.length;i+=2){ a+=r[i]; b+=r[i+1]; n++; } return [a/n,b/n]; };
const pip=(x,y,r)=>{ let c=false; for(let i=0,j=r.length-2;i<r.length;j=i,i+=2){ const xi=r[i],yi=r[i+1],xj=r[j],yj=r[j+1]; if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi) c=!c; } return c; };
const segD=(px,py,ax,ay,bx,by)=>{ const dx=bx-ax,dy=by-ay,L=dx*dx+dy*dy; let t=L?((px-ax)*dx+(py-ay)*dy)/L:0; t=Math.max(0,Math.min(1,t)); return Math.hypot(px-ax-t*dx,py-ay-t*dy); };
const ringD=(px,py,r)=>{ if(pip(px,py,r)) return 0; let b=1e12; for(let i=0,j=r.length-2;i<r.length;j=i,i+=2) b=Math.min(b,segD(px,py,r[j],r[j+1],r[i],r[i+1])); return b; };
const ringNear=(a,b)=>{ let d=1e12; for(let i=0;i<b.length;i+=2) d=Math.min(d,ringD(b[i],b[i+1],a)); for(let i=0;i<a.length;i+=2) d=Math.min(d,ringD(a[i],a[i+1],b)); return d; };
const arr=r=>Array.from(r||[]);

 
function plan(x,M,o){ o=o||{}; const r=arr(x.sel.ring);
   
  if(r.length<6||!r.every(Number.isFinite)) return {svg:`<p class="f1v-empty">The lot plan is not drawn here: ${x.city==='edm'?'the public version shows Edmonton as derived results only, without lot lines':'this lot has no outline in the tool'}. The figures beside it still apply.</p>`,P:null,f:null,bb:null};
  const b=C.bbox(r), cx=(b[0]+b[2])/2, cy=(b[1]+b[3])/2, W=o.W||600, H=o.H||340, half=o.half||Math.max(45,Math.max(b[2]-b[0],b[3]-b[1])*0.78);
  const hh=half, hw=half*W/H, bb=[cx-hw,cy-hh,cx+hw,cy+hh], f=C.frame(bb,W,H,0), P=f.P, LW=o.LW||210;
  const ctx=C.context(x,P,f.I,[0,0,W,H],{skip:x.sel.id});
  const okP=d=>/M/.test(d||'')?d:'', foot=M.foot?okP(C.pathOf([arr(M.foot)],P)):'', sfoot=M.serverFoot&&M.serverFoot!==M.foot?okP(C.pathOf([arr(M.serverFoot)],P)):'';
  const boxes=o.noBoxes?'':(M.plant&&M.plant.boxes||[]).map(q=>`<path d="${C.pathOf([arr(q.ring)],P)}" fill="${o.box?o.box(q):K.dc}" stroke="none"/>`).join('');
  const id='f1c-eng-a-'+(plan.n=(plan.n||0)+1);
  let lead='', ys=[];    
  for(const L of (o.leaders||[])){ for(const c of L.pts){ const [px,py]=P(c[0],c[1]); if(px<6||px>W-6||py<14||py>H-14) continue; const n=L.lines.length;
      let y0=Math.max(py+4-(n>1?7:0),16); for(const b of ys.slice().sort((a,b)=>a[0]-b[0])) if(y0-11<b[1]+4&&y0-11+n*14>b[0]-4) y0=b[1]+4+11; if(y0+(n-1)*14>H+4) continue; ys.push([y0-11,y0-11+n*14]);
      const ly=n>1?y0+7-4:y0-4, bend=Math.abs(ly-py)>0.5?`<polyline points="${px.toFixed(1)},${py.toFixed(1)} ${(W+4).toFixed(1)},${py.toFixed(1)} ${(W+4).toFixed(1)},${ly.toFixed(1)} ${W+10},${ly.toFixed(1)}" fill="none" stroke="#8E8D88" stroke-width="0.6"/>`:`<line x1="${px.toFixed(1)}" y1="${py.toFixed(1)}" x2="${W+10}" y2="${py.toFixed(1)}" stroke="#8E8D88" stroke-width="0.6"/>`;
      lead+=`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="2.4" fill="${K.ink}" stroke="#fff" stroke-width="0.8"/>${bend}`+
        L.lines.map((t,i)=>`<text x="${W+16}" y="${(y0+i*14).toFixed(1)}" font-size="${i?11.5:13}" font-weight="${i?400:500}" fill="${i?K.ink2:K.ink}">${esc(t)}</text>`).join(''); break; } }
  const svg=`<svg viewBox="0 0 ${W+LW} ${H+8}" width="${W+LW}" height="${H+8}" role="img" aria-label="${esc(o.aria||'Plan of the lot')}"><defs><clipPath id="${id}"><rect x="0" y="0" width="${W}" height="${H}"/></clipPath></defs>${ctx}
    <g clip-path="url(#${id})"><path d="${C.pathOf([r],P)}" fill="${K.dcSup}" fill-opacity="0.22" stroke="none"/>${sfoot?`<path d="${sfoot}" fill="${K.fillSup}" stroke="none"/>`:''}${foot?`<path d="${foot}" fill="none" stroke="${K.ink2}" stroke-width="1" stroke-dasharray="5 3"/>`:''}${boxes}${o.under?o.under(P,f):''}<path d="${C.pathOf([r],P)}" fill="none" stroke="${K.ink}" stroke-width="1.6"/>${o.after?o.after(P,f):''}</g>${lead}${C.scaleBar(10,H-30,(()=>{ let L=Math.max(10,Math.round(half/4/10)*10); const m=70/f.s; if(L<m) L=[10,20,25,50,100,200,250,500,1000,2000].find(q=>q>=m)||L; return L; })(),f.s)}</svg>`;    
  return {svg,P,f,bb}; }
const keyItem=(bg,t,o)=>`<span><i style="background:${bg};${o||''}"></i>${esc(t)}</span>`;

 
C.add(T,'What fits',{async build(x){
  const M=await x.eng(); if(!M||!M.ring) return {draw:'<p class="f1v-empty">No lot loaded.</p>'};
  const A=BD.S.answers, f=BD.eng.siteFacts(), fm=BD.fitMax(), fp=BD.fitPlan(), tested=M.mwSized;    
  const step=(BD.eng.R.steps||[]).find(s=>s>fm+1e-9), nextMw=step!=null?Math.min(step,Math.round((fm+0.1)*10)/10):Math.round((fm+0.1)*10)/10, nxt=Math.round((fm+0.1)*10)/10;
   
  const why=fm==null?null:BD.fitWhy();
   
  let hall=null; try{ if(fm!=null&&BD.scene3d&&BD.scene3d.ensure){ await BD.scene3d.ensure(); hall=BD.scene3d.layoutCheck(fm); } }catch(e){ hall=null; }
  const stp=fm!=null&&BD.fitStep?BD.fitStep(fm):null, stopTxt=(()=>{ const a=stp&&stp.a, b=stp&&stp.b; if(!a||!b||!(b.gN>a.gN&&b.yard>a.yard+0.5)) return null;
    const row=b.perRow===1&&b.setL&&b.width?` A set is ${n1(b.setL)} m long and the lot ${n1(b.width)} m wide, so the sets stand one to a row and each one adds a row to the yard.`:'';
    const fl=b.floor<b.need-0.5?` The ${b.up} hall floor${b.up>1?'s':''} then give ${n0(b.floor)} m², below the ${n0(b.need)} m² the hall, UPS and battery rooms need (${n0(stp.per)} m² per MW).`:` The hall floors would still hold it (${n0(b.floor)} m² against ${n0(b.need)} m²).`;
    const cap=why&&why.k==='yard'?` The tool also stops at yards deeper than 21.7 m, the deepest it has tested: generator noise at the lot lines is not modelled.`:'';
    return `At ${n1(b.mw)} MW the generators go from ${a.gN} to ${b.gN} sets (${b.gNeed} needed + ${b.gN-b.gNeed} spare).${row} The yard deepens from ${n1(a.yard)} to ${n1(b.yard)} m and the building footprint drops from ${n0(a.foot)} to ${n0(b.foot)} m².${fl}${cap}`; })();
  let bind=null, bindSrc='';
  if(fm==null) bind='No size fits with these choices.';
  else if(why&&why.t){ bind=`At ${n1(why.mw)} MW: ${why.t.replace(/\.$/,'')}.`; bindSrc={setup:'the tool’s set-up check',yard:'the plant-yard depth check (tested range)',floor:'the floor test (hall and room areas)',range:'the size range the site allows'}[why.k]||'site.js fitMax'; }
  else { bind=`Above ${n1(fm)} MW the tool’s checks stop passing; the engine names no rule (?).`; bindSrc='site.js fitMax'; }
  const pl=plan(x,M,{aria:'The lot with its building and plant',box:q=>q.name==='standby generators'?K.dcSup:K.dc,
    leaders:[{pts:[BD.centroid(arr(x.sel.ring))],lines:[x.addr,`${n0(x.sel.lotArea)} m² · ${x.zone}`]},
      ...(M.plant&&M.plant.boxes&&M.plant.boxes.length?[{pts:M.plant.boxes.map(q=>BD.centroid(arr(q.ring))),lines:[`${M.plant.boxes.length} ${M.plant.boxes[0].name}`,'in the yard']}]:[]),
      ...(M.foot?[{pts:[BD.centroid(arr(M.foot))],lines:['Building',`${n0(M.footArea)} m² · ${M.nF[0]===M.nF[1]?M.nF[0]:M.nF[0]+'–'+M.nF[1]} storeys`]}]:[])]});
  const sc=100/Math.max(fm||0,tested||0,0.1)/1.12, pct=v=>Math.max(0,Math.min(100,v*sc));
  const meter=`<div class="f1c-eng-a-mt"><h4>The size this lot allows, in MW of servers</h4><div class="f1c-eng-a-rm"><div class="trk"></div>
    ${fm!=null?`<div class="fit" style="left:0;width:${pct(fm)}%"></div><div class="tk" style="left:calc(${pct(tested)}% - 1px)"></div>`:''}
    <span class="lt" style="left:0">0</span>${fm!=null?`<span class="lb" style="left:${pct(fm)}%;transform:translateX(-100%)">${n1(fm)} MW</span>`:''}
    ${fm!=null?`<span class="lt" style="left:${pct(tested)}%;transform:translateX(-50%)">tested ${n1(tested)} MW</span>`:''}</div>
    <div class="f1c-key" style="margin-top:6px">${fm!=null?keyItem(K.ink,'largest size that passes every check: '+n1(fm)+' MW'):''}</div>
    <p class="f1c-eng-a-note"><b style="color:#8A3B00">What limits it.</b> <span>${esc(bind)}</span></p></div>`;
  const key=`<div class="f1c-key">${keyItem(K.dcSup,'lot','opacity:.5')}${keyItem('#fff','building','border:1px dashed '+K.ink2)}${keyItem(K.dcSup,'generators')}${(M.plant&&M.plant.boxes||[]).some(q=>q.name!=='standby generators')?keyItem(K.dc,'cooling plant'):''}${keyItem(K.bld,'neighbouring buildings')}</div>`;
  const cool=M.plant&&M.plant.s&&M.plant.s.k?`${M.plant.s.n} ${M.plant.s.k.name}${M.plant.coolRoofIndoor>0&&!(M.plant.boxes||[]).some(q=>q.name===M.plant.s.k.name)?', indoors in a plant room':''}`:'?';
  const meas=fp&&fp.measure?fp.measure.t:'';
  return {draw:`<div class="f1c-eng-a-wrap">${pl.svg}${key}${meter}</div>`,
    lead:`Servers are only part of what has to fit. The size shown is the largest where the building, the cooling plant, the generators and the loading all fit${meas?' '+meas:''}.`,
    hero:[{v:fm!=null?n1(fm):C.q(),u:fm!=null?' MW':'',l:'largest size that fits'},{v:n1(tested),u:' MW',l:'size tested here'}],
    rows:[['Largest that fits',fm!=null?`${n1(fm)} MW of servers${fp&&fp.asIs!=null&&fp.asIs<fm?`; ${n1(fp.asIs)} MW without the plant room`:''}`:'none with these choices'],
      ['With public floors','this is the data centre alone; with the Emergency hub’s public floors it is smaller (the Architecture cards give the figure)'],        
      ...(BD.hallNote?(()=>{ const dl=BD.denseLine(), hn=BD.hallNote(); return [['Hall density',esc(hn.t)],[esc(dl.lab),esc(dl.mw!=null&&dl.mw>=0.05?'about '+n1(dl.mw)+' MW'+(hn.kind==='air'?' (shown, not the default)':''):'none fits')]]; })():[]),    
      ...(hall?[['Racks needed',`${n0(hall.need[0])}–${n0(hall.need[1])} at ${n1(hall.mw)} MW (8–7.1 kW a rack); the tool’s rack layout ${hall.ok?'places them':'places only '+n0(hall.placed)+' (?)'} on ${hall.floors} hall floor${hall.floors>1?'s':''} of ${n0(hall.floor)} m², about ${n1(hall.floor/hall.need[1])}–${n1(hall.floor/hall.need[0])} m² a rack (our arithmetic)`]]:[]),
      ...(stopTxt?[['Why it stops',esc(stopTxt)]]:[]),['Building',`${n0(M.footArea)} m² footprint, ${M.nF[0]===M.nF[1]?M.nF[0]:M.nF[0]+'–'+M.nF[1]} storeys, ${n1(M.H)} m`],['Cooling plant',cool],['Generators',M.plant&&M.plant.s&&M.plant.s.g?`${M.plant.s.gN} sets of ${n1(M.plant.s.g.mw)} MW, ${A.genAt||'yard'}`:'none']],
    more:[['How the size is found',`<p>The tool tries sizes from 0.1 MW up to the most the floor holds and keeps the largest where its set-up checks pass: building height, loading, plant and generators placed, fuel on site, noise, and a floor test for the hall, UPS and battery rooms.</p>`],['Warnings at this size',`<p>${(M.warn||[]).length?esc(M.warn.join(' ')):'none'}</p>`]],
    src:['Largest that fits and the plant-room note: the tool’s size search (0.1 MW search, conservative floor test; register arch_dc_hall, arch_dc_electrical, arch_dc_battery). Racks needed: size ÷ the kW per rack (register rack_count: Uptime 2024 survey, 7.1–8 kW average), placed on the building at that size: UPS and battery room, room cooling units, 1.1 m corridors and 1.2 m aisles, racks spread evenly (register hall_layout). Why it stops: site.js fitStep, the largest size and the next (generator sets and sets per row, plant.js; yard depth; footprint; floor test at 637 m² per MW, dc_rooms.json conservative end).','Hall density by cooling type (project decision, 12 Nov 2026): air 560–640 m² per MW (four built Canadian halls, dc_rooms.json); liquid to the chip about 150 m² per MW (Schneider Electric reference design RD99: 3,818 kW on 574 m² of IT floor; maker claim, confidence 50); immersion the same figure as a stand-in. Denser-hall line: RICS Construction Journal, “Data centre demand”, 2.5–4.0 kW/m² net white space, run at 400 m² per MW (BD.fitMax({hall:400})).',`What stops the next size: ${bindSrc||'the tool’s checks'}, run at ${n1(nxt)} MW with the answers restored after.`,'Building, plant boxes and lot: the tool’s site model.',C.CONTEXT_SRC(x.city)],
    missing:[]}; }});

 
const INSIDE=[['air','Air','Air through the room'],['plate','Liquid to the chip','Cold plates on the chips'],['immersion','Immersion','Servers in fluid']];
const OUTSIDE=[['dry','Dry coolers','No water, fans'],['towers','Cooling towers','Evaporate water'],['hybrid','Hybrid coolers','Dry most hours, wet when hot']];
function waterOf(outside,mw,city){ if(outside==='dry') return [0,0]; const R=BD.eng.R, DW=BD.data.water, fac=[mw*R.pue[0],mw*R.pue[1]], MWh=[fac[0]*8760*R.lfR[0],fac[1]*8760*R.lfR[1]], wet=outside==='hybrid'?DW.wet[city][1]:1, CY=DW.cycles;
  const evap=MWh.map(v=>v*1000*DW.evapLkWh*wet/1000); return [evap[0]*(1+1/(CY[1]-1)),evap[1]*(1+1/(CY[0]-1))]; }    
const readCool=(city)=>m=>{ const A=BD.S.answers, probs=BD.setupProblems(true).concat(m.noise&&m.noise.block?[m.noise.block]:[]), rec=(A.inside||'air')!=='air', mw=m.mwSized, pp=BD.eng.plantPerMW(rec), R=BD.eng.R, cap=(A.inside||'air')==='air'?[0,0]:(A.inside==='immersion'?[1,1]:R.capture.slice());
  return {fit:!probs.length, why:probs[0]||'', capture:[cap[0]*100,cap[1]*100], captureMW:[cap[0]*mw,cap[1]*mw], space:BD.eng.plantArea(mw,rec),     spaceEq:[pp[0]*mw,pp[1]*mw], water:waterOf(A.outside||'dry',mw,city), lw:m.noise&&m.noise.lw?m.noise.lw.slice():null, mit:m.noise&&m.noise.mit&&m.noise.mit.short||'', kit:m.plant&&m.plant.s&&m.plant.s.k?m.plant.s.k.name:'', n:m.plant&&m.plant.s?m.plant.s.n:0}; };
 
async function setPick(over){ Object.assign(BD.S.answers,over); BD.modelReset(); await C.withAnswers({},async()=>null);
  const s=document.querySelector('#f1v .f1v-strip [aria-current="true"]'); if(s) s.click(); }
if(!window.__f1eSet){ window.__f1eSet=true;
  document.addEventListener('click',ev=>{ const b=ev.target.closest&&ev.target.closest('[data-f1e-in],[data-f1e-out]'); if(!b) return;
    if(b.hasAttribute('data-f1e-in')) setPick({inside:b.getAttribute('data-f1e-in')}); else setPick({outside:b.getAttribute('data-f1e-out')}); });
   
  document.addEventListener('change',ev=>{ const t=ev.target; if(!t||!t.matches||!t.matches('[data-f1e-mw]')) return; const v=parseFloat(t.value), fm=BD.fitMax?BD.fitMax():null, cur=BD.model&&BD.model()?BD.model().mwSized:null;
    if(!(v>0)){ if(cur) t.value=(Math.round(cur*10)/10).toFixed(1); return; } const w=Math.max(0.1,fm!=null?Math.min(v,fm):v); t.value=w.toFixed(1); setPick({mw:+w.toFixed(1)}); });
  const st=document.createElement('style'); st.textContent='.f1c-eng-a-set{display:flex;flex-wrap:wrap;gap:8px 18px;align-items:center;font-size:12.5px;color:var(--f-ink2);margin:0 0 14px;padding-bottom:12px;border-bottom:1px solid var(--f-hair)}.f1c-eng-a-set input{width:64px}.f1c-eng-a-set .m{color:var(--f-mute)}.f1c-eng-a-set .g{display:inline-flex;gap:4px;align-items:center}.f1c-eng-a-set .g .m{margin-right:4px}.f1c-eng-a-set button{font:inherit;padding:3px 9px;border:1px solid var(--f-rule);background:#fff;color:var(--f-ink2);cursor:pointer}.f1c-eng-a-set button[aria-pressed="true"]{background:var(--f-ink);color:#fff;border-color:var(--f-ink)}';
  document.head.appendChild(st); }
C.add(T,'Cooling',{async build(x){
  const M=await x.eng(); if(!M||!M.ring) return {draw:'<p class="f1v-empty">No lot loaded.</p>'};
   
  const PUr=BD.data.raw.plant_units||{}, WD=((PUr.winterDesign||{})[x.city]||{}).v, CA=PUr.chillAmbient||{}, cMin=(CA.min||{}).v, cR=(CA.minR1234ze||{}).v;
  const isChill=M.plant&&M.plant.s&&M.plant.s.k&&M.plant.s.k.name==='air-cooled chillers', cold=isChill&&WD!=null&&cMin!=null&&WD<cMin;
  const mn=v=>String(v).replace('-','−');
  const wdSrc=x.city==='edm'?'NBC 2020 App. C, January 2.5 %':'BCBC App. C Table C-2, January 2.5 %';
  const winter=!isChill?null:WD==null?{txt:'design winter temperature not in the tool ?',bad:true}:cold?{txt:`outside the maker’s stated range in design winter (?): design ${mn(WD)} °C (${wdSrc}); the Liebert AFC is stated down to ${mn(cMin)} °C at widest (varies by model), ${mn(cR)} °C with R1234ze`,bad:true}:{txt:`within the maker’s stated range: design ${mn(WD)} °C (${wdSrc}); stated down to ${mn(cMin)} °C at widest, ${mn(cR)} °C with R1234ze`,bad:false};
  const A=BD.S.answers, pi=A.inside||'air', po=A.outside||'dry', city=x.city, rd=readCool(city), I={}, O={};
  for(const [k] of INSIDE) I[k]=await x.withAnswers({inside:k},rd);
  for(const [k] of OUTSIDE) O[k]=await x.withAnswers({outside:k},rd);
   
  const nmI={air:'Air',plate:'Liquid to the chip',immersion:'Immersion'}, nmO={dry:pi==='air'?'Air-cooled chillers':'Dry coolers',towers:'Cooling towers',hybrid:'Hybrid coolers'};
  const rg=(v,u,d)=>v[0]===v[1]||Math.abs(v[0]-v[1])<0.05?`${(d===0?n0:n1)(v[1])} ${u}`:`${(d===0?n0:n1)(v[0])}–${(d===0?n0:n1)(v[1])} ${u}`;
   
  const fm=BD.fitMax?BD.fitMax():null, pb=(set,cur,attr,nm)=>set.map(([k])=>`<button type="button" ${attr}="${k}" aria-pressed="${k===cur}">${esc(nm[k])}</button>`).join('');
   
  let PB=null; try{ PB=BD.f1best?await BD.f1best.forLot(x):null; }catch(e){} const byPlan=PB&&PB.source!=='rough'&&+PB.MW>0&&Math.abs(+PB.MW-M.mwSized)<0.005;
  const hasPlan=PB&&PB.source!=='rough'&&+PB.MW>0;
  const setPick=`<div class="f1c-eng-a-set"><span class="g"><span class="m">Inside</span>${pb(INSIDE,pi,'data-f1e-in',nmI)}</span><span class="g"><span class="m">Outside</span>${pb(OUTSIDE,po,'data-f1e-out',nmO)}</span></div>`;
   
  const PN='#1E2A47', PO='#9AA3B5', PH='#DCDFE5', to=(v,d)=>v[0]===v[1]||Math.abs(v[0]-v[1])<0.5?`${n0(v[1])} ${d}`:`${n0(v[0])} to ${n0(v[1])} ${d}`;
  const chart=(title,keys,set,get,unit,axis)=>{ const ph=!BD.A3&&typeof innerWidth==='number'&&innerWidth<640, W=ph?350:860, X0=0, BW=ph?W:760, vals=keys.map(k=>set[k].fit||(k===po&&hasPlan)?get(set[k]):null)    , mx=Math.max(1,...vals.map(v=>v?v[1]:0));
    const st=[1,2,2.5,5].map(m=>m*Math.pow(10,Math.floor(Math.log10(mx/5)))).find(t=>mx/t<=6)||Math.pow(10,Math.ceil(Math.log10(mx/5))), top=Math.ceil(mx/st)*st, sx=v=>X0+v/top*BW;
    let y=34, o=`<text x="0" y="14" font-size="15" font-weight="600" fill="${K.ink}">${esc(title)}</text>`; const gy0=y;
    keys.forEach((k,i)=>{ const v=vals[i], pick=k===po, nm=nmO[k]+(pick?(hasPlan?' (this layout)':' (this size)'):'');
      o+=`<text x="0" y="${y+12}" font-size="13" font-weight="${pick?600:400}" fill="${K.ink}">${esc(ph?nm.replace(/ \(this (layout|size)\)/,''):nm)}</text>`;
      if(!v) o+=`<text x="0" y="${y+34}" font-size="12.5" fill="${K.mute}">doesn’t fit here</text>`;
      else if(v[1]===0) o+=`<line x1="0.5" y1="${y+20}" x2="0.5" y2="${y+38}" stroke="${PN}" stroke-width="1.5"/><text x="10" y="${y+34}" font-size="13" font-weight="${pick?600:400}" fill="${K.ink}">none</text>`;
      else o+=`<rect x="${X0}" y="${y+22}" width="${Math.max(1,sx(v[1])-X0).toFixed(1)}" height="16" fill="${PH}"/><rect x="${X0}" y="${y+22}" width="${Math.max(1,sx(v[0])-X0).toFixed(1)}" height="16" fill="${pick?PN:PO}"/><text x="${ph||sx(v[1])+10+to(v,unit).length*7.4>W?W:(sx(v[1])+10).toFixed(1)}" y="${ph||sx(v[1])+10+to(v,unit).length*7.4>W?y+12:y+35}"${ph||sx(v[1])+10+to(v,unit).length*7.4>W?' text-anchor="end"':''} font-size="13" font-weight="${pick?600:400}" fill="${pick?K.ink:K.ink2}">${esc(to(v,unit))}</text>`;
      y+=58; });
    let g=''; for(let t=0;t<=top+1e-9;t+=st){ const xx=sx(t).toFixed(1); g+=`<line x1="${xx}" y1="${gy0}" x2="${xx}" y2="${y}" stroke="${K.hair}"/><text x="${xx}" y="${y+18}" font-size="12" fill="${K.mute}" text-anchor="${t===0?'start':'middle'}">${st<1?n1(t):n0(t)}</text>`; }
    return `<svg viewBox="0 0 ${W} ${y+44+(ph?32:0)}" width="100%" style="max-width:${W}px;display:block;overflow:visible" role="img" aria-label="${esc(title)}">${g}${o}${(()=>{ const ln=[]; let cur=''; for(const w of String(axis).split(' ')){ if(ph&&(cur+' '+w).trim().length>52){ ln.push(cur); cur=w; } else cur=(cur+' '+w).trim(); } ln.push(cur); return ln.map((t,i)=>`<text x="0" y="${y+40+i*16}" font-size="12" fill="${K.mute}">${esc(t)}</text>`).join(''); })()}</svg>`; };
  const draw=`<div class="f1c-phw1">${chart('Water used for cooling, by outside option',['dry','towers','hybrid'],O,s=>s.water,'m³','Make-up water, cubic metres a year.')}<div style="height:36px"></div>${chart('Plant space (yard and indoor UPS), by outside option',['dry','towers','hybrid'],O,s=>s.space,'m²','Square metres: cooling units in the yard with the maker’s clear zones, plus UPS and batteries indoors; equipment only.')}</div>`;
  const insFail=INSIDE.filter(([k])=>!I[k].fit).map(([k])=>nmI[k]), outFail=OUTSIDE.filter(([k])=>!O[k].fit).map(([k])=>nmO[k]);
   
  const td=(set,k,get,f)=>set[k].fit?esc(f(get(set[k]))):'doesn’t fit here', tr=(set,keys,nm,pick,cols)=>keys.map(k=>`<tr${k===pick?' class="pk"':''}><th>${esc(nm[k])}${k===pick?(hasPlan?' (this layout)':' (this size)'):''}</th>${cols.map(([g,f])=>`<td>${td(set,k,g,f)}</td>`).join('')}</tr>`).join('');
  const needs=OUTSIDE.map(([k])=>k).filter(k=>O[k].fit).map(k=>`${nmO[k]}: ${O[k].mit?'needs '+O[k].mit:'needs no measure'}`);
  const cmp2=`${setPick}<div class="f1c-cmp2"><h5>Inside: how the heat leaves the servers</h5><p>Outside held at ${esc(nmO[po].toLowerCase())}.</p><table><tr><th></th><th>Heat in liquid</th><th>Plant space</th></tr>${tr(I,['air','plate','immersion'],nmI,pi,[[s=>s.captureMW,v=>v[1]===0?'none':rg(v,'MW')],[s=>s.space,v=>rg(v,'m²',0)]])}</table>
    <h5>Outside: how the heat leaves the building</h5><p>Inside held at ${esc(nmI[pi].toLowerCase())}.</p><table><tr><th></th><th>Water a year</th><th>Sound power</th></tr>${tr(O,['dry','towers','hybrid'],nmO,po,[[s=>s.water,v=>v[1]===0?'none':rg(v,'m³',0)],[s=>s.lw,v=>rg(v,'dBA')]])}</table>
    <p>Noise measure each would need at this lot: ${esc(needs.join('; '))}.</p>
    ${winter?`<p><b>Air-cooled chillers in design winter:</b> ${esc(winter.txt)}.</p>`:''}<p><b>Electricity is not compared:</b> the tool uses one PUE range for every cooling type (${BD.eng.R.pue[0]} to ${BD.eng.R.pue[1]}; industry surveys, not this design).</p></div>`;
   
  const wP=O[po].water, sP=O[po].space, outL=nmO[po].toLowerCase(), carry=pi==='air'?`Air moves the servers’ heat to ${outL} in the yard`:`${nmI[pi]} carries ${pi==='immersion'?'all':'most'} of the servers’ heat to ${outL} in the yard`;
  const mag=v=>v>=1e4?'tens of thousands of cubic metres':v>=1e3?'thousands of cubic metres':`${n0(v)} m³`;
  const alt=OUTSIDE.map(([k])=>k).filter(k=>k!==po&&O[k].fit).map(k=>({k,s:O[k].space,w:O[k].water})).sort((a,b)=>a.s[1]-b.s[1])[0];
  const trade=!alt?'':alt.s[1]<sP[0]?`${nmO[alt.k]} would use less yard${alt.w[1]>wP[1]?` but ${mag(alt.w[1])} of water a year`:''}.`:alt.s[0]>sP[1]?`${nmO[alt.k]} would need more yard${alt.w[1]>wP[1]?` and ${mag(alt.w[1])} of water a year`:''}.`:'';
  const lead1=`${carry}, so ${hasPlan?'the layout':'it'} uses ${wP[1]===0?'no water for cooling':`${to(wP,'m³')} of water a year for cooling`}. ${trade}`.trim();
  const planOf=PB&&PB.source!=='rough'?`Layout: ${PB.label.replace(/^your /,'the ')}.`:'Size: rough size, no layout fits this lot.';
  return {art:true,draw,lead:lead1,
    hero:[{v:wP[1]===0?'0':to(wP,'').trim(),u:' m³',l:`water a year for cooling: ${nmI[pi].toLowerCase()} inside, ${outL} outside`},{v:to(sP,'').trim(),u:' m²',l:`of plant space for the ${outL} (yard, plus UPS and batteries indoors)`}],
    key:[[PN,hasPlan?'This layout’s choice':'The choice at this size'],[PO,'The other options'],[PH,'High end of the range']],
    foot:`Each option is compared with the other side held at ${hasPlan?'this layout’s':'this size’s'} choice. ${planOf}`,
    rows:[...(winter?[['Chillers in design winter',winter.bad?C.q(cold?'outside the maker’s stated range':'not in the tool yet'):'within the stated range']]:[]),['Picked inside',`${nmI[pi]} (${pi==='air'?'the tool’s default':'chosen'})`],['Picked outside',`${nmO[po]}${po==='dry'&&pi==='air'?' (the dry option: with an air-cooled hall the tool places air-cooled chillers, not dry coolers)':''}`],['Size tested',`${mwS(M.mwSized)} MW of servers`],['Fail the fit check here',[...insFail,...outFail].join(', ')||'none']],
    more:[['Try another cooling option',cmp2],['How each figure is found',`<p>Each option is set, the model rebuilt, the figure read, and the answers put back exactly (the tool’s own functions, nothing stored). Heat captured: ${BD.eng.R.capture[0]}–${BD.eng.R.capture[1]} of the heat for liquid to the chip; immersion takes all of it (not verified). Plant space: cooling units with their clear zones (low: units for the low PUE in the most compact block, zones shared between neighbours; high: units for the high PUE in one row), plus UPS and batteries (and heat pump, liquid loop) at their equipment-only m² per MW. The 1.5 m working space in front of the UPS (CEC 2-310) is not added: no UPS unit sizes are held (?). Water: the make-up water of the Water panel. Noise: the Lw of the units the plant layout places. A type that breaks a set-up check at this size shows “doesn’t fit here”.</p>`]],
    src:[...(isChill?[`Chillers in design winter: Vertiv Liebert AFC installer guide SL-70790, s. 1.4.3 and Table 1.1, p. 10 (register vertivAFC_limits, maker claim): ambient −28.9 to 45 °C, varies by model; not below −20 °C with R1234ze. Design temperature: ${x.city==='edm'?'NBC 2020 Div. B App. C, Edmonton, January 2.5 % (register nbc20_climate)':'BCBC App. C Table C-2, Vancouver City Hall, January 2.5 % (register arch_bcbcAppC)'}; tool/data/plant_units.json. A flag, not a block.`]:[]),'Heat captured: the capture share by cooling type (register liquid_capture, peer figures); immersion = all heat to the liquid (register, not verified).','Plant space: cooling units, wall clearances and spacing from tool/data/plant_units.json (EVAPCO layout manual EAEQPTLYT26 Table 1, V-coil 30–40 ft row: 0.9 m end and 2.1 m side to a wall, 1.8 m end to end, 4.3 m side to side; tower walls BAC J74 2.7 m; tower spacing set in plant.js, no register id ?), maker claims; indoor rooms from register component_space, equipment only.',`Water: evaporation and make-up (evaporation ≤ ${BD.data.water.evapLkWh} L per kWh of heat, ${BD.data.water.cycles[0]}–${BD.data.water.cycles[1]} cycles; hybrids wet in the hours above 18 °C; CWEC).`,'Plant noise: Lw per unit (tool/data/noise.json lwUnit, lwUnitDry; maker claims) plus 10 log N, N = the number of units sized for the load; mitigation from the tool’s noise check.','Fit check: the site model’s fit check and the noise check at this size.'],
    missing:['electricity per cooling type (the tool uses one PUE range)',...(cold?['whether a cold-climate version of the chiller exists for this design winter (maker range varies by model)']:[])]}; }});

 
C.add(T,'Backup power',{async build(x){
  const M=await x.eng(); if(!M||!M.ring) return {draw:'<p class="f1v-empty">No lot loaded.</p>'};
  const A=BD.S.answers, R=BD.eng.R, P=M.plant, S=P&&P.s, mw=M.mwSized, eq=BD.eng.equip(mw), none=A.gens==='none', g=S&&S.g, gT=P&&P.genTank;
  const fac=[mw*R.pue[0],mw*R.pue[1]], fuel12=[fac[0]*1000*R.fuelHours*R.fuelLkWh,fac[1]*1000*R.fuelHours*R.fuelLkWh], tankTot=g&&gT?S.gN*gT.L:null;
  const gb=(P&&P.boxes||[]).filter(q=>q.name==='standby generators'), at=none?null:(A.genAt||'yard');
  const upsMWh=[mw/60*10,mw/60*15];    
  const pl=plan(x,M,{aria:'Where the generators sit on the lot',box:q=>q.name==='standby generators'?K.dc:K.neut,leaders:[
    ...(gb.length?[{pts:gb.map(q=>BD.centroid(arr(q.ring))),lines:[`${gb.length} generator sets`,`${n1(g.mw)} MW each · ${at==='roof'?'on the roof':'in the yard'}`]}]:[]),
    ...(M.foot?[{pts:[BD.centroid(arr(M.foot))],lines:['UPS and batteries','inside the building, not drawn']}]:[]),
    {pts:[BD.centroid(arr(x.sel.ring))],lines:[x.addr]}]});
  const key=`<div class="f1c-key">${keyItem(K.dc,'standby generators')}${keyItem('#fff','building','border:1px dashed '+K.ink2)}${keyItem(K.dcSup,'lot','opacity:.5')}<span class="f1c-note">UPS modules and battery cabinets sit inside the building: the tool counts their floor space, it does not draw them.</span></div>`;
  const loadMW=S&&S.Q, capMW=g?S.gN*g.mw:null, carry=g?S.gNeed*g.mw:null;
  const meters=g?[{l:'Generator capacity against the load it carries',v:loadMW,lim:carry,max:capMW*1.05,unit:'MW',pass:loadMW<=carry+1e-9,cap:`${n1(loadMW)} MW load · ${S.gNeed} sets of ${n1(g.mw)} MW carry ${n1(carry)} MW · ${S.gN-S.gNeed} spare`,src:'the tool’s plant sizing'}]:[];
  return {draw:`<div class="f1c-eng-a-wrap">${pl.svg}${key}</div>`,
    lead:none?'No generators are chosen in this set-up, so the batteries carry the load until the utility returns.':'Standby power in three parts: diesel generators outdoors, UPS modules that bridge the first minutes, and batteries behind them.',
    hero:[{v:g?String(S.gN):'0',u:g?` × ${n1(g.mw)} MW`:'',l:'standby generators'},{v:fuel12?fmtL(fuel12[1]):C.q(),u:' L',l:'fuel for 12 h at the high end'},{v:String(eq.ups),u:' × 1 MW',l:'UPS modules'},{v:rng(eq.batt[0],eq.batt[1],0),l:'battery cabinets'}],
    meters,
    rows:[['Generators',g?`${S.gN} sets: ${S.gNeed} carry the load, ${S.gN-S.gNeed} spare · ${n1(g.mw)} MW each, ${n1(g.L)} × ${n1(g.W)} m, ${n1(g.H)} m high (Rehlko KD2000, maker claim)`:'none chosen'],
      ['Where the generators sit',g?`${at==='roof'?'on the roof':'in the yard'}: ${P.placed?P.placed.gy:0} in the yard, ${P.placed?P.placed.gr:0} on the roof (the tool’s plant layout)`:'–'],
      ['Fuel in the set bases',g&&gT?`about ${fmtL(gT.L)} L a set, ${fmtL(tankTot)} L in all (sub-base tanks, maker claim)`:'–'],
      ['Fuel for 12 hours',`${fmtL(fuel12[0])}–${fmtL(fuel12[1])} L (${rng(fac[0],fac[1])} MW × ${R.fuelHours} h × ${R.fuelLkWh} L per kWh at full load; Uptime minimum; Rehlko KD2000 rate, G5-626)`],
      ['Fuel per kWh at part load',`${(BD.data.equipment.fuelPart||[]).map(([pc,l])=>pc+' %: '+l).join(' · ')} L per kWh (Rehlko KD2000, G5-626 9/23, maker claim; our arithmetic). Sets sharing the load run below full load and burn more per kWh; the 12-hour figure uses the full-load rate. Up to 4 % more by volume with renewable diesel.`],
      ['UPS modules',`${eq.ups} of 1,000 kW (load ÷ 1,000 kW, one spare unless set to none or 2N; vendor figure)`],
      ['Battery cabinets',`${rng(eq.batt[0],eq.batt[1],0)} (${R.equip.cabKW[1]}–${R.equip.cabKW[0]} kW each for 15–10 min: Vertiv EnergyCore Li5, 31.1 kWh, maker claim; the rating at these runtimes is our arithmetic)`],
      ['Battery runtime',`10–15 minutes (FM 5-32 3.5.2.1, insurer guidance; the author’s choice, 11 Nov 2026), about ${rng(upsMWh[0],upsMWh[1])} MWh at full load (our arithmetic)`],
      ['Floor space, UPS and batteries',`${rng((R.plant.ups[0]+R.plant.batt[0])*mw,(R.plant.ups[1]+R.plant.batt[1])*mw,0)} m² (${R.plant.ups[0]}–${R.plant.ups[1]} + ${R.plant.batt[0]}–${R.plant.batt[1]} m² per MW; register component_space)`]],
    more:[['Where the fuel rule applies',`<p>In the yard the sets stand at grade, 3 m from the property line and 1.5 m from the building (CSA B139.1.0 Table 2). On a roof each tank is limited to ${BD.data.equipment&&BD.data.equipment.roofTank?n0(BD.data.equipment.roofTank.each):'?'} L and the supply line to ${BD.data.equipment&&BD.data.equipment.roofTank?n0(BD.data.equipment.roofTank.line):'?'} L (CSA B139.1.1 6.5.3).</p>`],['The generator list the plant layout gives',`<p>${(P&&P.genLines||[]).slice(0,2).map(t=>esc(String(t).replace(/<\/?b>/g,''))).join('<br>')||'none'}</p>`]],
    src:['Generator count and size: the tool’s plant sizing (Rehlko KD2000 2,000 kW standby; manufacturer claim; register genset sizing, chosen 29 Oct 2026).','Fuel: hours on site × litres per kWh (register fuel_on_site; NFC 2020 Table 4.3.13.4.-B; fuel rate Rehlko KD2000 spec sheet G5-626 9/23 p. 2, 528.3 L/h at 2,000 kW standby, a manufacturer claim; Uptime ≥ 12 h). Tank per set: the maker’s sub-base tank.','UPS and batteries: module and cabinet counts (register ups_modules, battery_cabinets; vendor claims). Runtime: register ups_flex (operator claims).','Placement: the site model’s plant yard, with CSA C282 and B139.1.0 clearances.',C.CONTEXT_SRC(x.city)],
    missing:['where the UPS and battery rooms sit inside the building (not drawn)']}; }});

 
const NR=260;
 
{ const s0=C.get(T,'Backup power'); C.add(T,'Backup power',{chip:s0.chip,async build(x){ const r=await s0.build(x); if(!r||!r.hero) return r;
  let PB=null, PD=null; try{ PB=BD.f1best?await BD.f1best.forLot(x):null; PD=PB&&BD.f1best.planData?await BD.f1best.planData(PB,x):null; }catch(e){}
  const lot=PD&&PD.site&&PD.site.lot, s1=PD&&(PD.storeys||[]).find(q=>q.st===1);
  if(!lot||lot.length<3||!s1){  
    let L0=null; try{ L0=BD.f1best.layoutGen?await BD.f1best.layoutGen(PB):null; }catch(e){} if(!L0||!L0.gen) return r;
    const M0=await x.eng(), Q=M0&&M0.plant&&M0.plant.s&&M0.plant.s.Q, mw=L0.gen.kw/1000, run=Q?Math.ceil(Q/mw-1e-9):null, n=L0.gen.n, rl=BD.f1best.refugeLine?BD.f1best.refugeLine(PB):'';
    let ES=null; if(PB&&PB.edm&&BD.f1edm){ try{ const L=await BD.f1edm.lot(x.sel.id), Y=await BD.f1edm.layout(PB.plan); if(L&&Y){ BD.f1edm.css(); ES=BD.f1edm.site(L,Y); } }catch(e){} }    
    if(ES) return Object.assign({},r,{draw:`<div style="width:100%">${ES}</div>`,key:[],keyHtml:'',hero:[{v:`${n} × ${n0(L0.gen.kw)}`,u:' kW',l:`diesel standby generators${run==null?'':run<=n?`: ${run} running, ${n-run} spare`:`: ${run} needed, ${run-n} short`}`},...(r.hero||[]).slice(1)],foot:`Generators: the layout’s own plant list${run==null?'':`; running = sets needed for the ${n1(Q)} MW load`}.${rl?' '+rl+'.':''}`});
    return Object.assign({},r,PB&&PB.edm?{draw:`<p class="f1v-empty">No drawing for Edmonton lots yet: the layout’s storeys and plant are not in the tool for Edmonton. The figures are the layout’s own.</p>`,key:[],keyHtml:''}:{},{hero:[{v:`${n} × ${n0(L0.gen.kw)}`,u:' kW',l:`diesel standby generators${run==null?'':run<=n?`: ${run} running, ${n-run} spare`:`: ${run} needed, ${run-n} short`}`},...(r.hero||[]).slice(1)],
      foot:`Generators: the layout’s own plant list${run==null?'':`; running = sets needed for the ${n1(Q)} MW load`}.${rl?' '+rl+'.':''}${r.foot?' '+r.foot:''}`}); }
   
  let LG=null; try{ LG=BD.f1best.layoutGen?await BD.f1best.layoutGen(PB):null; }catch(e){}
  const M=await x.eng(), S=M&&M.plant&&M.plant.s, g=S&&S.g, Y=PD.yard||{}, away=BD.f1best&&BD.f1best.away?BD.f1best.away(PB.plan,x.sel&&x.sel.id):false;    
   
  const pts=lot.concat(...(Y.rings||[])), xs=pts.map(q=>q[1]), ys=pts.map(q=>-q[0]), x0=Math.min(...xs), x1=Math.max(...xs), y0=Math.min(...ys), y1=Math.max(...ys);
  const ph=!BD.A3&&typeof innerWidth==='number'&&innerWidth<640, VW=ph?340:600, VH=ph?420:700, k=Math.min((VW-40)/(x1-x0),(VH-110)/(y1-y0)), ox=20+((VW-40)-(x1-x0)*k)/2-x0*k, oy=60-y0*k;    
  const P=(u,v)=>[(ox+v*k).toFixed(1),(oy-u*k).toFixed(1)], path=ring=>'M'+ring.map(q=>P(q[0],q[1]).join(',')).join('L')+'Z';
  const rects=s1.zones.flatMap(z=>z.rects||[]), rp=q=>{ const a=P(q[0],q[2]), b=P(q[1],q[3]); return `<rect x="${Math.min(a[0],b[0])}" y="${Math.min(a[1],b[1])}" width="${Math.abs(b[0]-a[0]).toFixed(1)}" height="${Math.abs(b[1]-a[1]).toFixed(1)}"`; };
  const yc=(Y.rings||[[]])[0]||[], yx=yc.length?yc.reduce((t,q)=>t+q[1],0)/yc.length:null, yy=yc.length?yc.reduce((t,q)=>t+q[0],0)/yc.length:null, YP=yx!=null?P(yy,yx):null;
  const front=(PD.site.edges||[]).find(e=>e.kind==='front'), street=!away&&x.addr?String(x.addr).replace(/^\s*\d+[A-Za-z]?\s+/,''):'', fm=front?P((front.a[0]+front.b[0])/2,(front.a[1]+front.b[1])/2):null;
  const bx1=Math.max(...rects.flatMap(q=>[q[2],q[3]])), yLeft=YP&&yx<bx1&&Math.max(...(Y.rings||[[]]).flat().map(q=>q[1]))<=Math.min(...rects.flatMap(q=>[q[2],q[3]]))+0.5, yTop=Math.max(...lot.map(q=>q[0])), LY=yLeft?(oy-yTop*k-14).toFixed(1):(YP?YP[1]:0);    
  const lg=LG&&LG.gen, lgMW=lg&&lg.kw?lg.kw/1000:null, lgRun=lg&&S&&S.Q&&lgMW?Math.ceil(S.Q/lgMW-1e-9):null, lgN=lg?lg.n:null;
  const gCount=lg?lgN:(g?S.gN:0), gMW=lg?lgMW:(g?g.mw:null), gRun=lg?lgRun:(g?S.gNeed:null);
  const LX=ph?VW-6:VW+20, genTxt=gCount?`${gCount} standby generators, chillers, transformers`:'chillers, transformers';
  const svg=`<svg viewBox="0 0 ${ph?VW:VW+260} ${VH}" width="100%" style="max-width:${VW+260}px;display:block;margin:0 auto" role="img" aria-label="The lot with its plant yard and the building’s storey 1 outline">
    <defs><clipPath id="f1yclip"><path d="${path(lot)}"/></clipPath></defs><g clip-path="url(#f1yclip)">${(Y.rings||[]).map(q=>`<path d="${path(q)}" fill="#AEB2BA"/>`).join('')}</g>
    <g fill="none" stroke="#1E2A47" stroke-width="3">${rects.map(q=>rp(q)+'/>').join('')}</g><g fill="#fff" stroke="#fff" stroke-width="0.9">${rects.map(q=>rp(q)+'/>').join('')}</g>
    <path d="${path(lot)}" fill="none" stroke="#1E2A47" stroke-width="1.2" stroke-dasharray="14 4 3 4"/>
    ${fm&&street?`<text x="${fm[0]}" y="${(+fm[1]+22).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="600" fill="#4A5672">${esc(street)}</text>`:''}
    ${YP&&!ph?`<polyline points="${YP[0]},${YP[1]} ${yLeft?`${YP[0]},${(oy-yTop*k-14).toFixed(1)} ${VW+12},${(oy-yTop*k-14).toFixed(1)}`:`${VW+12},${YP[1]}`}" fill="none" stroke="#8A94AA" stroke-width="0.8"/><text x="${LX}" y="${LY}" font-size="13" font-weight="600" fill="#1E2A47">Plant yard</text><text x="${LX}" y="${(+LY+17).toFixed(1)}" font-size="11.5" fill="#4A5672">${esc(genTxt)},</text><text x="${LX}" y="${(+LY+32).toFixed(1)}" font-size="11.5" fill="#4A5672">${Y.area?n0(Y.area)+' m²':''}</text>`:''}</svg>`;
  const ups=(PD.storeys||[]).map(q=>({st:q.st,z:(q.zones||[]).map(z=>z.zone)})), upsSt=ups.filter(q=>q.z.some(z=>/^dc$/.test(z))).map(q=>q.st);
  const plan=`Layout: ${PB.label.replace(/^your /,'the ')}.`;
  const pgN=(PD.plant||[]).filter(q=>/^g/.test(q.id||'')).length, oldGen=!away&&PB.board&&lg&&pgN&&pgN!==lgN?` Drawn with an earlier generator size; the figures use ${lgN} × ${n0(lg.kw)} kW.`:'';    
   
   
  const awaySvg=()=>{ const n=gCount||0, run=gRun==null?n:Math.min(n,gRun), hub=LG&&LG.hub&&LG.hub.kw, B=56, G=14, W2=ph?340:860; let o='', yy=26;
    o+=`<text x="0" y="16" font-size="15" font-weight="600" fill="#1E2A47">Standby generators${gMW?`, ${n1(gMW)} MW each`:''}</text>`;
    for(let i=0;i<n;i++){ const xx=i*(B+G), on=i<run; o+=`<rect x="${xx}" y="${yy}" width="${B}" height="${B}" fill="${on?'#1E2A47':'#fff'}" stroke="#1E2A47" stroke-width="1.5"/><text x="${xx+B/2}" y="${yy+B+18}" text-anchor="middle" font-size="12" fill="#4A5672">${on?'running':'spare'}</text>`; }
    if(hub){ const xx=n*(B+G)+28; o+=`<rect x="${xx}" y="${yy+B-34}" width="34" height="34" fill="#fff" stroke="#1E2A47" stroke-width="1.5" stroke-dasharray="4 2"/><text x="${xx+44}" y="${yy+B-20}" font-size="12.5" font-weight="600" fill="#1E2A47">Refuge generator (72 h)</text><text x="${xx+44}" y="${yy+B-5}" font-size="12" fill="#4A5672">${n0(hub)} kW, on its own</text>`; }
    yy+=B+56; if(Y.area){ const side=Math.sqrt(Y.area), kk=Math.min(5,220/side), sq=side*kk, sb=[5,10,20,25,50].find(q=>q*kk>=60)||50;
      o+=`<text x="0" y="${yy}" font-size="15" font-weight="600" fill="#1E2A47">Plant yard, ${n0(Y.area)} m²</text><rect x="0" y="${yy+12}" width="${sq.toFixed(1)}" height="${sq.toFixed(1)}" fill="#AEB2BA"/><text x="${(sq+14).toFixed(1)}" y="${yy+28}" font-size="12" fill="#4A5672">drawn as a square of the same area, to scale;</text><text x="${(sq+14).toFixed(1)}" y="${yy+44}" font-size="12" fill="#4A5672">its real shape is the layout’s own</text>`;
      yy+=12+sq+14; o+=`<rect x="0" y="${yy}" width="${(sb*kk).toFixed(1)}" height="4" fill="#1E2A47"/><text x="0" y="${yy+18}" font-size="12" fill="#4A5672">0</text><text x="${(sb*kk).toFixed(1)}" y="${yy+18}" text-anchor="middle" font-size="12" fill="#4A5672">${sb} m</text>`; yy+=26; }
    return `<svg viewBox="0 0 ${W2} ${yy+4}" width="100%" style="max-width:${W2}px;display:block" role="img" aria-label="The layout’s standby generators, running and spare, and its plant yard area to scale">${o}</svg><p class="f1v-empty" style="margin-top:14px">${AWAYTXT}</p>`; };
  return Object.assign({},r,{art:true,draw:away?(gCount?awaySvg():`<p class="f1v-empty">${AWAYTXT}</p>`):`<div class="f1c-phw3">${svg}</div>`,
    lead:(g?'Diesel generators in the yard take over in a power cut. UPS modules and batteries inside carry the load for the first minutes.':r.lead)+(LG&&LG.hub&&LG.hub.kw?`\nRefuge generator (72 h), ${n0(LG.hub.kw)} kW, own tank: the refuge keeps power when the data centre’s sets do not.`:''),    
    hero:[...(gCount&&gMW?[{v:`${gCount} × ${n1(gMW)}`,u:' MW',l:`standby generators${gRun==null?'':gRun<=gCount?`: ${gRun} running, ${gCount-gRun} spare`:`: ${gRun} needed, ${gRun-gCount} short`}`}]:[r.hero[0]]),...(Y.area?[{v:n0(Y.area),u:' m²',l:`plant yard${away||Y.pctOfLot==null?'':`, ${Y.pctOfLot} % of the lot`}`}]:[])],
    key:away?[]:[['#AEB2BA','Plant yard, outdoor']],
    foot:`${lg?`Generators: the layout’s own plant list, ${lgN} × ${n0(lg.kw)} kW diesel${lg.rule?' (the layout sized them by the tool’s rule)':''}; running = sets needed for the ${n1(S&&S.Q)} MW load. ${LG.hub&&LG.hub.kw?`Refuge generator (72 h), ${n0(LG.hub.kw)} kW, on its own. `:''}`:g?'Generators: rough size, no layout fits this lot; the tool’s own sizing. ':''}${away?'':'Building, storey 1: outline.'+oldGen+' '}UPS and battery rooms sit inside, on the data-centre side (its support rooms or the flexible shell)${upsSt.length?` (storey ${upsSt.join(', ')})`:''}; our reading, as the layout does not name its rooms. ${plan}`,
    more:[['The details: every figure, and how it is worked out',(r.rows||[]).filter(q=>!(lg&&/^(Where the generators sit|Fuel in the set bases)$/.test(q[0]))).map(q=>lg&&q[0]==='Generators'?[q[0],`${lgN} sets of ${n0(lg.kw)} kW${lg.model?' (Rehlko '+lg.model+', maker claim)':''}, from the layout’s plant list: ${lgRun==null?'':lgRun<=lgN?`${lgRun} carry the ${n1(S.Q)} MW load, ${lgN-lgRun} spare`:`${lgRun} needed for the ${n1(S.Q)} MW load, ${lgRun-lgN} short`}${LG.hub&&LG.hub.kw?`. Refuge generator (72 h), ${n0(LG.hub.kw)} kW, on its own`:''}`]:q).map(q=>`<p class="f1e2-n"><b>${esc(q[0])}:</b> ${typeof q[1]==='string'?esc(q[1]):''}</p>`).join('')]].concat((r.more||[]).filter(q=>!(lg&&/generator list the plant layout gives/i.test(q[0]||'')))),rows:[],meters:[]}); }}); }
async function noiseData(x,M){ const s=x.sel, nc=M.noise, pc=nc&&nc.src, r=arr(s.ring); if(!nc||!pc) return null;
  const lots=[], seen=new Set(), blds=new Set(), adj=[];
  for(const k in BD.S.tiles){ if(!k.startsWith(x.city+':')) continue; const t=BD.S.tiles[k];
    for(const p of t.par||[]){ if(isMine(x,p)) continue; const key=(p.id||p.ids)+':'+p.r[0]; if(seen.has(key)) continue; seen.add(key); const bb=p.bb||C.bbox(p.r); if(bb[0]>pc[0]+NR||bb[2]<pc[0]-NR||bb[1]>pc[1]+NR||bb[3]<pc[1]-NR) continue;
      const id=p.ids?p.ids[0]:p.id, a=t.A[id]||[]; lots.push({k2:(p.ids?p.ids[0]:p.id)+':'+p.r[0],r:arr(p.r),id,a,addr:a[0]?C.titleCase(a[0]):'',zone:x.city==='van'?String(a[1]||'').trim():String(a[2]||a[1]||'').trim(),v:null,nb:0}); } }
  for(const k in BD.S.tiles){ if(!k.startsWith(x.city+':')) continue; for(const q of BD.S.tiles[k].bld||[]){ if(blds.has(q)) continue; blds.add(q); const v=BD.eng.noiseLevel(q); if(!v) continue; const c=cen(arr(q.r)); if(Math.hypot(c[0]-pc[0],c[1]-pc[1])>NR) continue;
      const lot=lots.find(l=>pip(c[0],c[1],l.r)); if(!lot) continue; lot.nb++; if(!lot.v||v.d<lot.v.d) lot.v=Object.assign({},v); if(v.hi>lot.v.hi) lot.v.hi=v.hi; q.__eng=v; } }
   
  for(const l of lots){ if(l.v) continue; const v=BD.eng.noiseLot&&BD.eng.noiseLot(l.k2); if(v) l.v=Object.assign({},v); }
   
  for(const l of lots){ if(l.v) continue; if(ringNear(r,l.r)<3) adj.push(l); }
  return {lots:lots.filter(l=>l.v).sort((a,b)=>a.v.d-b.v.d),untested:adj,pc,nc}; }
C.add(T,'Noise',{async build(x){
  const M=await x.eng(); if(!M||!M.ring) return {draw:'<p class="f1v-empty">No lot loaded.</p>'};
  const D=await noiseData(x,M); if(!D) return {draw:'<p class="f1v-empty">The noise check did not run for this set-up.</p>'};
  const nc=D.nc, city=x.city, LOT=D.lots, near=LOT.slice(0,60), R=BD.eng.R;
  const worst=nc.unenclosed||nc.worst, ok=!nc.block, openOver=!!(worst&&worst.lo>worst.L);    
  const emptyNote=nc.emptyLotNote?String(nc.emptyLotNote).split('; next occupied neighbour used')[0].replace(/^limiting neighbour is an empty lot \((.*)\)$/,'$1'):null;
  const bad=l=>l.v.hi0>l.v.L, over=l=>l.v.lo0>l.v.Ls;    
  const UNDER='#E4E7EC', NEAR='#8FA3C8', AMB='#8A3B00', AMB2='#EBCBB0', EMPTY='#D5D4D0', shade=l=>l.v.noBld?EMPTY:over(l)?AMB:bad(l)?AMB2:(l.v.hi0>l.v.L-10?NEAR:UNDER);        
  const gen=(M.notes||[]).filter(n=>/^Generator test/.test(n))[0]||'';
  const GN=(BD.data.raw.noise||{}).gen||{}, gv=GN.van, ge=GN.edm;
  const genRule=city==='van'?(gv?`Generator testing: up to ${gv.test.v} dBA at the point of reception, or 6.1 m from the source if that is farther, once a month for up to 60 minutes in the daytime, plus once a year for up to 180 minutes. By-law 6555 s. 4.1(c).`:null):(ge?`Generator testing, daytime: up to one hour a day at ${ge.resTest1h.v} dB(A) at residential lines and ${ge.nonTest1h.v} at non-residential. At night: ${ge.resNight.v} and ${ge.nonNight.v}, no allowance. Bylaw C14600 ss. 19(3), 21(3), 20, 22; s. 24 has no generator exemption.`:null);
  const lotsSvg=LOT.map(l=>`<path d="${C.pathOf([l.r],()=>[0,0])}"/>`).length&&'';
   
  { const RC=new Map((nc.receivers||[]).map(r=>[String(r.addr||'').toLowerCase(),r])); for(const l of D.lots){ const r=RC.get(String(l.addr||'').toLowerCase()); if(r&&isFinite(r.d)&&l.v) l.v.d=r.d; } }
  const dm=d=>d==null||!isFinite(d)?'?':d<100?String(Math.round(d*10)/10):n0(d);
  const cap=t=>String(t).replace(/^./,c=>c.toUpperCase()), PF=nc.plantFrom||{}, fromLay=!!PF.plan, plantAt=`${nc.where}, ${fromLay?'from the layout':'placed by the tool'}`,    
    plantSits=fromLay?`${cap(nc.where)}, from the layout: its ${PF.units} cooling unit${PF.units===1?'':'s'} at grade, where the layout draws them.`:`${cap(nc.where)}, placed by the tool (position estimated: no layout with drawn plant sizes this lot).`;
   
  const layUnits=P=>{ const NP=BD.S.noisePlan, F=M.F; if(!fromLay||!NP||!F||!F.toW||String(NP.lot)!==String(x.sel.id)) return ''; const ou=NP.origin==='corner'?(F.L||0)/2:0, ov=NP.origin==='corner'?(F.W||0)/2:0;
    return (NP.plant||[]).filter(q=>!q.roof&&(q.rect||[]).length===4).map(q=>{ const [a,b,c,d]=q.rect, pts=[[a,c],[b,c],[b,d],[a,d]].map(([u,v])=>P(...F.toW(u-ou,v-ov)));
      return `<path d="M${pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join('L')}Z" fill="${K.dc}" stroke="#fff" stroke-width="0.5"><title>${esc(q.name||'cooling unit')}</title></path>`; }).join(''); };
  const pl=plan(x,M,{half:Math.max(120,Math.min(NR,(LOT[3]?LOT[3].v.d:80)*1.35+60)),W:620,H:240,aria:'Predicted plant noise at the neighbouring lots against each limit',noBoxes:fromLay,
    under:(P)=>{ let s=''; for(const l of LOT.slice(0,200)){ s+=`<path d="${C.pathOf([l.r],P)}" fill="${shade(l)}" fill-opacity="0.92" stroke="#fff" stroke-width="0.6" style="cursor:pointer" data-noise="${esc((l.addr?C.titleCase(l.addr):'Lot')+'|'+n0(l.v.lo)+'–'+n0(l.v.hi)+'|'+l.v.L+'|'+n0(l.v.lo0)+'–'+n0(l.v.hi0)+'|'+dm(l.v.d))}"><title>${esc((l.addr||'lot')+' · '+n0(l.v.lo0)+'–'+n0(l.v.hi0)+' dBA in open air · limit '+l.v.L)}</title></path>`; } return s; },
    after:(P)=>{ const [px,py]=D.pc?P(D.pc[0],D.pc[1]):[NaN,NaN]; let s=layUnits(P)+(!isFinite(px)||!isFinite(py)?'':`<g stroke="${K.ink}" stroke-width="1.6"><line x1="${px-6}" y1="${py}" x2="${px+6}" y2="${py}"/><line x1="${px}" y1="${py-6}" x2="${px}" y2="${py+6}"/></g><text x="${px+9}" y="${py+4}" font-size="12" fill="${K.ink}" stroke="#fff" stroke-width="3" paint-order="stroke">plant</text>`);    
      for(const u of D.untested){ const c=cen(u.r), [ux,uy]=P(c[0],c[1]); s+=`<path d="${C.pathOf([u.r],P)}" fill="none" stroke="#6B6A66" stroke-width="1.2" stroke-dasharray="4 3"/>`; if(D.untested.length<4) s+=`<text x="${ux.toFixed(1)}" y="${(uy+9).toFixed(1)}" text-anchor="middle" font-size="12" fill="#6B6A66">not tested</text>`; }    
      return s; },
    leaders:[
      ...(worst?[{pts:(()=>{ const w=LOT.find(l=>(l.addr||'').toUpperCase()===(worst.addr||'').toUpperCase()); return w?[cen(w.r)]:[]; })(),lines:[C.titleCase(worst.addr||'worst case'),`${n0(worst.lo)}–${n0(worst.hi)} dBA in open air`,`limit ${worst.L} dBA`]}]:[]),
      {pts:[BD.centroid(arr(x.sel.ring))],lines:[x.addr,`plant: ${plantAt}`]}]});
  const key=`<div class="f1c-key">${keyItem(UNDER,'well under its night limit')}${keyItem(NEAR,'within 10 dBA of the limit')}${keyItem(AMB2,'over the limit with standard-rating units')}${keyItem(AMB,'over the limit with the quieter rating')}${LOT.some(l=>l.v.noBld)?keyItem(EMPTY,'empty lot: not counted'):''}<span>open air: no screen, quieter units or enclosure</span>${D.untested.length?`<span><b class="f1c-q">?</b> not tested</span>`:''}</div>`;
  const tbl=`<div class="f1c-eng-a-mt"><h4>Predicted level at the nearest lots, against each lot’s limit</h4><table class="f1c-eng-a-tbl"><tr><th>Lot (point of reception)</th><th>Zone</th><th>Distance</th><th>Level in open air</th><th>With a measure (unproven)</th><th>Night limit</th></tr>
    ${LOT.slice(0,5).map(l=>`<tr${l.v.noBld?' class="empty"':''}><td>${esc(l.addr||'no address on record')}${l.v.noBld?'<small style="display:block;color:#66696E;font-size:12px">no building on record: tested at its lot line (our reading)</small>':''}</td><td>${esc(l.zone||'?')}</td><td>${dm(l.v.d)} m</td><td class="${l.v.noBld?'':bad(l)?'a':''}">${n0(l.v.lo0)}–${n0(l.v.hi0)} dBA${l.v.noBld?'<small style="display:block;font-size:12px">not counted (empty lot)</small>':''}</td><td>${n0(l.v.lo)}–${n0(l.v.hi)} dBA</td><td>${l.v.L===l.v.Ls?l.v.L:l.v.L+' / '+l.v.Ls} dBA</td></tr>`).join('')}
    ${D.untested.slice(0,1).map(u=>`<tr><td>${esc(u.addr||'lot')}</td><td>${esc(u.zone||'?')}</td><td>adjoins</td><td colspan="3">not tested</td></tr>`).join('')}</table>
    <p class="f1c-eng-a-note">Levels at a lot are at its point nearest the plant, from the tool’s own check, in open air (no screen, quieter units or enclosure). The level with a measure is unproven: a later acoustic study decides. The limit is that lot’s night limit (${esc(nc.sec||'')}). Where two limits show, the first is for the quieter-rated units, the second for standard units.</p></div>`;
   
  const eY=M.edgeYards||[], lineRows=eY.map(e=>{ let b=null; for(const l of LOT){ let d=1e9; for(let i=0,j=l.r.length-2;i<l.r.length;j=i,i+=2) d=Math.min(d,segD(l.r[i],l.r[i+1],e.ax,e.ay,e.bx,e.by),segD(e.ax,e.ay,l.r[j],l.r[j+1],l.r[i],l.r[i+1])); if(!b||d<b.d) b={l,d}; } return {e,b}; });
  const lineTbl=lineRows.length?`<table class="f1c-eng-a-tbl"><tr><th>Lot line</th><th>Faces</th><th>Nearest tested lot beyond it</th><th>Level in open air</th><th>Limit</th></tr>${lineRows.map(({e,b},i)=>`<tr><td>${esc(e.kind||'?')} ${i+1}, ${n0(e.len)} m</td><td>${esc(e.abuts||'?')}</td><td>${b?esc((b.l.addr||'lot')+', '+dm(b.d)+' m away'):'?'}</td><td>${b?`${n0(b.l.v.lo0)}–${n0(b.l.v.hi0)} dBA`:'?'}</td><td>${b?b.l.v.L+' dBA':'?'}</td></tr>`).join('')}</table>`:'<p>no lot lines read</p>';
  const mitTxt=nc.req||nc.block||(nc.mit&&nc.mit.short?`Needs ${nc.mit.short}.`:'No measure needed: the plant is under every limit as drawn.');
  const worstTxt=worst?`${C.titleCase(worst.addr||'a lot')} (${worst.zt}), ${dm(worst.d)} m from the plant: ${n0(worst.lo)}–${n0(worst.hi)} dBA in open air against ${worst.L} dBA`:'no lot is over a limit';
  const plainMeas=nc.mit&&nc.mit.room?'the plant in an enclosed plant room':nc.mit&&nc.mit.fan?'the fans slowed at night':nc.mit&&nc.mit.ln?'quieter-rated units':nc.mit&&nc.mit.screen?'a noise screen around the plant':'a noise measure';    
  const meas=nc.mit&&nc.mit.room?`−${nc.mit.room.dB} dB (plant room)`:nc.mit&&nc.mit.fan?`−${nc.mit.fan.dB} dB (night fan speed)`:nc.mit&&nc.mit.ln?'low-noise chillers':nc.mit&&nc.mit.screen?'screen':null;
  const hint=`<p class="f1-hint">Click any lot to see its predicted noise level and its night limit.</p>`, pick=`<p class="f1c-noise-pick" aria-live="polite">${worst?`${esc(C.titleCase(worst.addr||'The worst-case lot'))}: ${n0(worst.lo)}–${n0(worst.hi)} dBA in open air, night limit ${worst.L} dBA.`:''}</p>`;    
  return {draw:`<div class="f1c-eng-a-wrap">${hint}${pl.svg}${pick}${key}${tbl}</div>`,
    lead:ok?`${worst?`${C.titleCase(worst.addr||'The nearest occupied lot')}, ${dm(worst.d)} m from the plant: ${n0(worst.lo)}–${n0(worst.hi)} dBA in open air, against a night limit of ${worst.L} dBA.`:''} ${openOver?'Needs screening, quieter units or an enclosure to pass; a later acoustic study decides.':'Under the night limit in open air, with no measure.'}${emptyNote?` The empty lot next door (${C.titleCase(emptyNote.split(', ')[0])}${emptyNote.includes(', ')?', '+emptyNote.split(', ').slice(1).join(', '):''}) is not counted: no one lives or works there; the next occupied lot is used.`:''} The plant runs all night, so the night limit governs.`:`${worst?`${C.titleCase(worst.addr||'The nearest occupied lot')}, ${dm(worst.d)} m from the plant: ${n0(worst.lo)}–${n0(worst.hi)} dBA in open air, against a night limit of ${worst.L} dBA. `:''}`+'The plant would be over the night limit even with every measure the tool models; the tool blocks this set-up.',
    hero:[{v:!ok||openOver?'Over':'Under',l:!ok?'the night limit, even with every modelled measure':'the night limit, in open air',red:!ok||openOver},{v:worst?`${n0(worst.lo)}–${n0(worst.hi)}`:C.q(),u:' dBA',l:'in open air, worst occupied neighbour'},{v:worst?String(worst.L):C.q(),u:' dBA',l:'its night limit'},{v:worst?String(dm(worst.d)):C.q(),u:' m',l:'from the plant'}],
    rows:[['Worst case',worstTxt],['A measure that would pass (unproven)',mitTxt.replace(/^Noise: /,'')+' Unproven: a later acoustic study decides.'],...(nc.emptyLotNote?[['Empty lot next door',String(nc.emptyLotNote).replace(/^limiting/,'Limiting')]]:[]),['Cooling plant sits',plantSits],['Sound power of the plant',`${n0(nc.lw[0])}–${n0(nc.lw[1])} dBA (${nc.n} units; maker claims)`],['Lots checked for noise',`${n0(nc.tested)} lots within the check’s radius (not the heat receivers)`],['Generator testing',gen?gen.replace(/^Generator test \(/,'(').split(': ').slice(1).join(': ').slice(0,200):'?']],
    more:[['The lot’s own lines',lineTbl],['Generator test',`<p>${esc(genRule||'not in the tool')}</p>${gen?`<p>${esc(gen)}</p>`:''}`],['Method',`<p>Lp = Lw − 20 log r − 8 (free field over hard ground), r the distance from the plant to the lot’s nearest point, at least 5 m; groups of units are summed in dB. Unit ratings are maker claims (a quieter and a standard rating are both tried). Measures are tried in order: none, low-noise chillers or night fan speed, a screen, then a plant room (−${nc.mit&&nc.mit.room?nc.mit.room.dB:BD.eng.NMIT.room.dB} dB, NSW 2021 terms). Unit housings and silencers get no credit.</p>`]],
    src:['Levels and limits: the tool’s noise check (Lp = Lw − 20 log r − 8; limits from the receiving lot’s zone: '+(city==='van'?'Noise Control By-law 6555 s. 2.3(b)':'Bylaw C14600 ss. 20, 22')+').','Unit Lw: tool/data/noise.json (lwUnit, lwUnitDry; manufacturer claims).','Plant room −25 dB: NSW 2021, Table 4-5.','Generator testing: the generator-test rule (van6555s41c; edm14600s19to24); the note above is the tool’s own check.','Lots, zones and buildings: loaded tiles as the tool holds them.'+(city==='van'?' Every neighbouring lot is tested, with or without a building (8 Nov 2026): By-law 6555 s. 1.2 puts the point of reception outside “the property occupied by the recipient”; that an empty lot has one is our reading (register van6555_por).':''),C.CONTEXT_SRC(city)],
    missing:[...(D.untested.length?[`${D.untested.length} adjoining lot(s) not tested`]:[]),'level at the own lot lines (the tool tests receiving lots, not the lot’s own lines)']}; }});
 
if(!window.__bdNoisePick){ window.__bdNoisePick=1; document.addEventListener('click',e=>{ const t=e.target.closest&&e.target.closest('path[data-noise]'); if(!t) return; const w=t.closest('.f1c-eng-a-wrap'), out=w&&w.querySelector('.f1c-noise-pick'); if(!out) return;
  const [a,lv,L,lv0,d]=t.dataset.noise.split('|'); out.textContent=`${a}, ${d} m from the plant: ${lv0} dBA in open air (${lv} dBA with a measure, unproven), night limit ${L} dBA.`;
  w.querySelectorAll('path[data-noise]').forEach(q=>q.setAttribute('stroke-width',q===t?'2.4':'0.6')); w.querySelectorAll('path[data-noise]').forEach(q=>q.setAttribute('stroke',q===t?'#1E2A47':'#fff')); }); }
 
{ const s0=C.get(T,'Noise'); C.add(T,'Noise',{chip:s0.chip,async build(x){ const r=await s0.build(x); const M=await x.eng(), nc=M&&M.noise; if(!r||!nc||!(nc.receivers||[]).length) return r;
  const U=nc.unenclosed||{}, up=a=>String(a||'').toUpperCase(), rc=nc.receivers.slice(0,3).map(q=>{ const w=up(q.addr)===up(U.addr)&&U.lo!=null; return {addr:C.titleCase(q.addr||'a lot'),d:q.d,zt:String(q.zt||''),lo:w?U.lo:q.openAir,hi:w?U.hi:q.openAir,L:q.limit}; });
  const vals=rc.flatMap(q=>[q.lo,q.hi,q.L]).filter(isFinite), a0=Math.floor((Math.min(...vals)-5)/10)*10, a1=Math.ceil((Math.max(...vals)+3)/10)*10;
  const ph=!BD.A3&&typeof innerWidth==='number'&&innerWidth<640, W=ph?350:860, X0=ph?0:290, BW=ph?W-60:W-X0-80, sx=v=>X0+(v-a0)/(a1-a0)*BW, RH=ph?84:64, f1=v=>(Math.round(v*10)/10).toFixed(1), dm=d=>d==null||!isFinite(d)?'?':d<100?String(Math.round(d*10)/10):n0(d);
  let o=ph?`<text x="0" y="14" font-size="15" font-weight="600" fill="${K.ink}">Plant noise at the nearest occupied</text><text x="0" y="33" font-size="15" font-weight="600" fill="${K.ink}">lots at night, open air, dBA</text>`:`<text x="0" y="14" font-size="15" font-weight="600" fill="${K.ink}">Plant noise at the nearest occupied lots at night, open air, dBA</text>`, y=ph?64:44; const g0=y-10;
  rc.forEach((q,i)=>{ const zt=/quiet/i.test(q.zt)?'quiet zone':q.zt.split(',')[0], ty=ph?y:y, by=ph?y+30:y-10, bx0=sx(q.lo), bx1=Math.max(sx(q.hi),bx0+4), lx=sx(q.L);
    o+=`<text x="0" y="${ty}" font-size="13" font-weight="600" fill="${K.ink}">${esc(q.addr)}</text><text x="0" y="${ty+17}" font-size="12" fill="${K.ink2}">${dm(q.d)} m, ${esc(zt)}</text>`;
    o+=`<line x1="${lx.toFixed(1)}" y1="${by-6}" x2="${lx.toFixed(1)}" y2="${by+30}" stroke="${K.ink}" stroke-width="1.6" stroke-dasharray="3 2"/><text x="${(ph?lx+5:lx-5).toFixed(1)}" y="${by+28}" text-anchor="${ph?'start':'end'}" font-size="12" fill="${K.ink2}"${i?'':' font-weight="600"'}>${i?q.L:'night limit '+q.L}</text>`;
    o+=`<rect x="${bx0.toFixed(1)}" y="${by}" width="${(bx1-bx0).toFixed(1)}" height="13" fill="#1E2A47"/><text x="${(bx1+7).toFixed(1)}" y="${by+11}" font-size="12.5" font-weight="600" fill="${K.ink}">${q.hi-q.lo>0.05?f1(q.lo)+' to '+f1(q.hi):f1(q.lo)}</text>`; y+=RH; });
  let gr=''; for(let t=a0;t<=a1;t+=10){ const xx=sx(t).toFixed(1); gr+=`<line x1="${xx}" y1="${g0}" x2="${xx}" y2="${y-14}" stroke="${K.hair}"/><text x="${xx}" y="${y+2}" text-anchor="middle" font-size="12" fill="${K.mute}">${t}</text>`; }
  const chart=`<svg viewBox="0 0 ${W} ${y+10}" width="100%" style="max-width:${W}px;display:block" role="img" aria-label="Plant noise at the nearest occupied lots against each lot’s night limit">${gr}${o}</svg>`;
  const NP=BD.S.noisePlan, PF=nc.plantFrom||{}, units=PF.plan&&NP?(NP.plant||[]).filter(q=>!q.roof&&/chill|dry/i.test((q.kind||'')+' '+(q.name||''))):[], kind=units.length&&units.every(q=>/dry/i.test((q.kind||'')+' '+(q.name||'')))?'dry coolers':'chillers';
  let PB0=null; try{ PB0=BD.f1best?await BD.f1best.forLot(x):null; }catch(e){} const awayN=!!(PB0&&PB0.plan&&BD.f1best.away&&BD.f1best.away(PB0.plan,x.sel&&x.sel.id));
  const plantLine=PF.plan?`Plant: the layout’s own ${nc.where||'yard'}, ${PF.units} ${kind} at grade.`:awayN?'Plant: placed by the tool in the open on this lot. The layout is not re-planned for this lot, so its own yard positions are not used here.':`Plant: placed by the tool (${nc.where||'position estimated'}); no layout with drawn plant sizes this lot.`;    
  let PB=null; try{ PB=BD.f1best?await BD.f1best.forLot(x):null; }catch(e){}
  const notes=`<p class="f1c-phw-n">Levels at each lot’s point nearest the plant; the limit is that lot’s night limit (${esc(x.city==='van'?'Noise Control By-law 6555 s. 2.3':'Bylaw C14600 ss. 20, 22')}). The plant runs all night, so the night limit governs.</p><p class="f1c-phw-n">${esc(plantLine)} Empty lots never set the limit.</p>`;
  const w0=rc[0], over=w0&&w0.lo>w0.L, block=!!nc.block, wSrc=PF.plan?'in the open '+(nc.where||'yard')+`, the ${kind}`:'the plant, in the open air,';    
  const lead=w0?`${wSrc.replace(/^./,c=>c.toUpperCase())} ${PF.plan?'are':'is'} ${over?'louder':'quieter'} at night than the limit at the nearest occupied lots.${block?' Even with every measure the tool models it stays over; the tool blocks this set-up.':over?' It needs screening, quieter units or an enclosure to pass; a later acoustic study decides.':''}`:r.lead;
  const keyHtml=`<span class="f1m-lg"><svg width="22" height="12" aria-hidden="true"><rect width="22" height="12" fill="#1E2A47"/></svg>Plant in the open air</span><span class="f1m-lg"><svg width="22" height="12" aria-hidden="true"><line x1="1" y1="6" x2="21" y2="6" stroke="${K.ink}" stroke-width="1.6" stroke-dasharray="3 2"/></svg>Night limit at that lot</span>`;
  return Object.assign({},r,{art:true,draw:`<div class="f1c-phw4">${chart}${notes}<details class="f1c-phw-fold"><summary>Map and every lot tested</summary>${r.draw||''}</details></div>`,lead,
    hero:w0?[{v:w0.hi-w0.lo>0.05?`${f1(w0.lo)} to ${f1(w0.hi)}`:f1(w0.lo),u:' dBA',l:`at ${w0.addr} with the plant in the open air; night limit ${w0.L} dBA`},{v:block?'Over':over?'Needs screening':'Under',l:block?'the night limit even with every measure the tool models':over?'quieter units or an enclosure to pass; a later acoustic study decides':'the night limit at every lot, in the open air'}]:r.hero,
    keyHtml,foot:`Plant-room figures are in the details, unproven.${PF.plan?'':' Plant position estimated by the tool.'}${PB&&PB.source!=='rough'?` Layout: ${PB.label.replace(/^your /,'the ')}.`:''}`}); }}); }
})();

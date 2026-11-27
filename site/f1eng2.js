 
(function(){
const BD=window.BD=window.BD||{};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function on(){ return !!(BD.F1FLAGS&&BD.F1FLAGS.engSimple)||/[?&]engSimple\b/.test(location.search); }
const val=v=>v&&typeof v==='object'?(v.q?'not in the tool yet':esc(v.v!=null?v.v:JSON.stringify(v))):esc(v);
const rowsHTML=(rows,title)=>(rows||[]).length?`${title?`<h4 class="f1e2-h">${esc(title)}</h4>`:''}<dl class="f1c-rows">${rows.map(r=>`<dt>${esc(r[0])}</dt><dd>${val(r[1])}</dd>`).join('')}</dl>`:'';
 
const CARDS=[
 {t:'What fits here',q:'How big a data centre can this lot take, with the cooling from the card before?',from:['What fits'],pick:/largest size that fits/i,note:'Assumes: air cooling and racks at the existing average (about 8 kW a rack: Uptime 2024; 7.1 without the densest sites), the default until the cooling choice can be changed on the card before; backup power as on the next card. Equipment sizes are manufacturer figures.'},
 {t:'Cooling and water',q:'How is it cooled, and what does that cost in water, space and noise? The cooling sets the water and power for each MW of servers; your size comes on the next card.',from:['Cooling','Water'],pick:null,note:'Equipment sizes are manufacturer figures.'},
 {t:'When the power fails',q:'What keeps it running in a power cut?',from:['Backup power'],pick:null,note:'Equipment sizes are manufacturer figures. Plant sized on yearly PUE; a later design stage adds margin.'},
 {t:'Noise next door',q:'Is it quiet enough for the neighbours?',from:['Noise'],pick:null},
 {t:'Heat for the neighbours',q:'How much heat could it give its neighbours, and would anyone take it?',from:['Heat offered','Who could take it'],pick:/heat offered/i,note:'Every yearly figure moves with how hard the servers run (the load factor); its low end rests on one survey line.'},
 {t:'Power, cost and carbon',q:'How much power does it use, at what cost and carbon?',from:['Electricity'],pick:null,note:'Every yearly figure moves with how hard the servers run (the load factor).'},
 {t:'Sharing the heat',q:'Could the neighbours share its heat through one loop?',from:['Shared energy district'],pick:null,note:'Each building’s heat demand is an estimate from its use and floor area.'}];
let ORIG=null;
 
async function storeyOne(x,best){ let P=null; if(best.source==='chosen'&&BD.f1pick3&&BD.f1pick3.chosen) P=await BD.f1pick3.chosen(x,{raw:true}); if(!P&&x.city==='van'){ const lot=String(x.sel&&x.sel.id); const r=await fetch((BD.ASSET_BASE||'')+'f1/plans/van_'+lot+'.json'); const D=r.ok?await r.json():null; const want=String(best.plan||''); P=D&&D.plans.find(q=>q.id===want||(/^board/.test(want)&&/board/.test(q.id))); }
  const s1=P&&(P.storeys||[]).find(s=>s.st===1); if(!s1||!BD.f1mass) return ''; let svg=BD.f1mass.plan({st:1,z0:s1.z0,z1:s1.z1,zones:s1.zones.map(z=>({zone:z.zone,rects:z.rects}))},{typology:P.typology,k:4,yard:P.yard,court:P.court,yardLabel:false,label:'Storey 1 of the plan'});
   
  const lot=P.site&&P.site.lot, K=4; if(lot&&lot.length>2){ const m=svg.match(/viewBox="([^"]+)"/); if(m){ let [x0,y0,w,h]=m[1].split(/\s+/).map(Number); const pts=lot.map(q=>[q[1]*K,-q[0]*K]); const xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]); const X0=Math.min(x0,...xs)-8, Y0=Math.min(y0,...ys)-8, X1=Math.max(x0+w,...xs)+8, Y1=Math.max(y0+h,...ys)+40;
    const add=`<path d="M${pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join('L')}Z" fill="none" stroke="#1E2A47" stroke-width="1.2" stroke-dasharray="14 4 3 4"/><g transform="translate(${(X1-8-10*K).toFixed(1)},${(Y1-34).toFixed(1)})"><rect width="${5*K}" height="5" fill="#1E2A47"/><rect x="${5*K}" width="${5*K}" height="5" fill="#fff" stroke="#1E2A47" stroke-width=".6"/><text x="${10*K}" y="24" text-anchor="end" font-size="18" fill="#4A5672">10 m</text></g>`;
    svg=svg.replace(m[0],`viewBox="${X0.toFixed(0)} ${Y0.toFixed(0)} ${(X1-X0).toFixed(0)} ${(Y1-Y0).toFixed(0)}"`).replace(/<\/svg>\s*$/,add+'</svg>'); } } const Y=P.yard||{}, yl=Y.area?`plant yard (grey) ${Math.round(Y.area).toLocaleString('en-CA')} m² · ${Y.pctOfLot} % of the lot; truck court (light grey)`:'';
  return `<figure style="margin:18px 0 0;max-width:420px"><figcaption style="font-size:13px;color:#4A5672;margin-bottom:4px">Storey 1 of that plan on its lot (dash-dot: the lot line), street along the bottom${yl?'; '+yl:''}</figcaption>${svg.replace('<svg ','<svg style="display:block;width:100%;height:auto;max-height:360px" ')}</figure>`; }
function install(){ const C=BD.f1cards; if(!C||!C.get||ORIG) return !!ORIG; ORIG={};
  for(const c of CARDS) for(const f of c.from){ const s=C.get('engineering',f); if(s) ORIG[f]=s; }
  for(const c of CARDS){ if(!c.from.every(f=>ORIG[f])) continue;
    C.add('engineering',c.t,{chip:(ORIG[c.from[0]]||{}).chip,async build(x){ const R=[]; for(const f of c.from){ try{ R.push(await ORIG[f].build(x)); }catch(e){ if(f===c.from[0]) throw e; R.push(null); }     }
      const a=R[0]; if(!a) return a; const rest=R.slice(1).filter(Boolean);
       
      if(a.art){ const det2=rowsHTML(a.rows||[])+rest.map((r,i)=>`${rowsHTML(((r.hero||[]).map(x=>[x.l,`${x.v}${x.u?' '+x.u:''}`])).concat(r.rows||[]),c.from[i+1])}<p class="f1e2-l">${esc(r.lead||'')}</p>`).join('');
        const extraDet=det2+(c.note?`<p class="f1e2-n">${esc(c.note)}</p>`:''), am=(a.more||[]).slice(), di=am.findIndex(m=>/^The details/.test(m[0]||'')); if(di>=0) am[di]=[am[di][0],am[di][1]+extraDet]; else am.unshift(['The details: every figure, and how it is worked out',extraDet]);
        return Object.assign({},a,{rows:[],meters:[],more:am.concat(...rest.map(r=>r.more||[])),
          src:[].concat(a.src||[],...rest.map(r=>r.src||[])),missing:[].concat(a.missing||[],...rest.map(r=>r.missing||[]))}); }
      const heroAll=a.hero||[]; const h=c.pick?heroAll.find(x=>c.pick.test(x.l||''))||heroAll[0]:heroAll[0];
       
      const dropped=heroAll.filter(x=>x!==h).map(x=>[x.l,(x.v&&x.v.q)?{q:1}:`${x.v}${x.u?' '+x.u:''}`]);
      const det=rowsHTML(dropped.concat(a.rows||[]))+rest.map((r,i)=>`${rowsHTML(((r.hero||[]).map(x=>[x.l,`${x.v}${x.u?' '+x.u:''}`])).concat(r.rows||[]),c.from[i+1])}<p class="f1e2-l">${esc(r.lead||'')}</p>`).join('');
       
      let extra=''; if(c.t==='What fits here'&&c.note) extra=' '+c.note.split(' Equipment')[0];     if(c.t==='Heat for the neighbours'){ let pmw=null; try{ const P=x.arch?await x.arch():null, V=P&&BD.f1cards.v1?BD.f1cards.v1(P):null; pmw=V&&V.MW?V.MW:null; }catch(e){}
        extra=` This assumes all the hall’s heat is caught and lifted by a heat pump; how much an air-cooled hall can really give is not yet known.${pmw?` Your chosen layout on this lot: ${(+pmw).toFixed(2)} MW of servers (the Architecture layout, with its public building); the figure above is the data centre on its own.`:''}`; }
       
      let best=null, ownFit='', fitFace='', outline=''; try{ best=BD.f1best?await BD.f1best.forLot(x):null; }catch(e){} let engMW=null; try{ const M=BD.model&&BD.model(); engMW=M&&isFinite(M.mwSized)?+M.mwSized:null; }catch(e){}
      const differs=best&&best.source!=='rough'&&engMW!=null&&Math.abs(engMW-(+best.MW))>0.05;
      const sized=!best?'':(c.t!=='What fits here'&&differs)?` The layout for this lot: ${best.label}, ${(+best.MW).toFixed(2)} MW of servers. This card’s figures still use the tool’s own size (${engMW.toFixed(2)} MW) until the engine takes the layout’s MW.`:' '+BD.f1best.line(best);    
      let hh=h; if(c.t==='What fits here'&&best&&best.source!=='rough'&&best.MW){ try{ outline=await storeyOne(x,best); }catch(e){} hh={v:(+best.MW).toFixed(2),u:' MW',l:`servers, from ${best.label}`};  
        const gl=[best.storeys?best.storeys+' storeys':'',best.footprintM2?Math.round(best.footprintM2).toLocaleString('en-CA')+' m² on storey 1':'',BD.f1best.genLine?BD.f1best.genLine(best):''].filter(Boolean).join(' · '), rl=BD.f1best.refugeLine?BD.f1best.refugeLine(best):'';
         
        let EY=null; if(best.edm&&BD.f1edm){ try{ EY=await BD.f1edm.layout(best.plan); }catch(e){} if(EY) BD.f1edm.css(); }    
        fitFace=best.edm&&EY?`<div style="width:100%;align-self:flex-start;margin:0 0 auto">${BD.f1edm.storeys(EY)}</div>`:best.edm?`<div class="f1e2-fit" style="padding:18px 0"><p style="margin:0;font-size:17px;color:#1E2A47">This layout’s storeys are not drawn here.</p><p style="margin:14px 0 0;font-size:15px;color:#1E2A47">${esc(gl)}</p>${rl?`<p style="margin:6px 0 0;font-size:15px;color:#1E2A47">${esc(rl)}</p>`:''}</div>`    
          :`<div class="f1e2-fit" style="padding:18px 0"><p style="margin:0;font-size:44px;font-weight:600;color:#1E2A47;line-height:1">${(+best.MW).toFixed(2)} MW</p><p style="margin:6px 0 0;font-size:16px;color:#4A5672">of servers, from ${esc(best.label)}</p><p style="margin:14px 0 0;font-size:15px;color:#1E2A47">${esc(gl)}</p>${rl?`<p style="margin:6px 0 0;font-size:15px;color:#1E2A47">${esc(rl)}</p>`:''}<p style="margin:10px 0 0;font-size:13px;color:#4A5672">Every Power, heat and water card is sized from this layout.</p>${outline}</div>`; }    
       
      if(c.t==='What fits here'&&best&&best.source!=='rough'&&BD.f1mass&&BD.f1best.planData){ let PD=null; try{ PD=await BD.f1best.planData(best,x); }catch(e){}
        if(PD&&(PD.storeys||[]).length){ const typ=PD.typology||best.typology, sh=PD.shares||{}, hall=((sh.byZone||[]).find(z=>z.zone==='hall')||{}).pct, tot=sh.total, ns=PD.storeys.length, ph=matchMedia('(max-width:700px)').matches;
          const awayY=!!(BD.f1best.away&&BD.f1best.away(best.plan,x.sel&&x.sel.id)),    
            YD=PD.yard&&awayY?Object.assign({},PD.yard,{pctOfLot:null},PD.yard.truckCourt?{truckCourt:Object.assign({},PD.yard.truckCourt,{pctOfLot:null})}:{}):PD.yard;
          const svg=BD.f1mass.render(PD.storeys,{typology:typ,exploded:true,fs:Math.round(13*Math.max(1,ns/3)*(ns>3?1.15:1)),labels:!ph,court:PD.court||null,yard:YD||null,label:'The layout pulled apart storey by storey, with its plant yard and truck court at ground level'});
          const who=best.source==='chosen'?'your chosen layout':best.board||/board/i.test(best.plan||'')?'the reference layout for this lot':(BD.f1hc?BD.f1hc():'the highest-capacity layout for your filters'), away=awayY;
          return Object.assign({},a,{art:true,draw:`<div class="f1c-phw2">${svg}</div>`,rows:[],meters:[],
            lead:`The data centre in ${who}, storey by storey, with the public part beside it.${away?` The layout is a library variant that fits this lot${best.lotsFitted?` (one of ${best.lotsFitted} lots it fits)`:''}; it is not re-planned for it.`:''}`,
            hero:[{v:(+best.MW).toFixed(2),u:' MW',l:'of servers'},...(tot?[{v:Math.round(tot).toLocaleString('en-CA'),u:' m²',l:`on ${ns} storey${ns===1?'':'s'}${hall!=null?`; data hall ${(+hall).toFixed(1)} % of the floor`:''}`}]:[])],
            keyHtml:BD.f1mass.legend(PD.storeys,typ,PD.shares||null,YD||!!PD.court),foot:`Layout: ${best.label.replace(/^your /,'the ')}.`,
            more:[['The details: every figure, and how it is worked out',`<p class="f1e2-n">${esc(BD.f1best.line(best))}</p>${outline||''}`+(c.note?`<p class="f1e2-n">${esc(c.note)}</p>`:'')]].concat((a.more||[]).filter(m=>!/how the size is found/i.test(m[0]||''))),
            src:[].concat((a.src||[]).filter(t=>!/size search/i.test(String(t))),['The layout: its storeys and zones from the layout export (Code), drawn by the tool’s one massing renderer; floor shares from the same export.']),missing:a.missing||[]}); } }
      return Object.assign({},a,{hero:hh?[hh]:[],rows:[],meters:[],lead:fitFace?(best.board||/board/i.test(best.plan||'')?'The size of the reference layout for this lot.':`The size of ${best.source==='chosen'?'your chosen layout':(BD.f1hc?BD.f1hc():'the highest-capacity layout for your filters')}.`):[c.q,a.lead||'',extra.trim(),sized.trim()].filter(Boolean).join('\n'),
        more:[['The details: every figure, and how it is worked out',(fitFace?`<p class="f1e2-n">${esc(BD.f1best.line(best))}</p>`:det)+(c.note?`<p class="f1e2-n">${esc(c.note)}</p>`:'')+ownFit]].concat((a.more||[]).filter(m=>!(fitFace&&/how the size is found/i.test(m[0]||''))),...rest.map(r=>r.more||[])),
        src:[].concat(a.src||[],...rest.map(r=>r.src||[])),missing:[].concat(a.missing||[],...rest.map(r=>r.missing||[])),draw:c.t==='Sharing the heat'?face()+a.draw:fitFace||a.draw}); }}); }
  if(BD.f1heatnear&&ORIG['Shared energy district']) C.add('engineering','Heat nearby',{chip:(ORIG['Heat offered']||{}).chip,build:x=>BD.f1heatnear.build(x,ORIG)});    
  return true; }
 
const USE={residential:'Housing',commercial:'Commercial',industrial:'Industrial',school:'School',cd:'Use not known (comprehensive development zone)',unknown:'Use not known'};    
function face(){ const S=BD.f1d&&BD.f1d.state&&BD.f1d.state(); if(!S) return ''; const d=b=>Math.hypot(b.c[0]-S.c[0],b.c[1]-S.c[1]), mid=b=>(b.heat[0]+b.heat[1])/2;
  const big=S.B.filter(b=>b.heat&&mid(b)>=500).sort((a,b)=>d(a)-d(b)).slice(0,5); const list=(big.length?big:S.B.filter(b=>b.heat).sort((a,b)=>mid(b)-mid(a)).slice(0,5));
  const n0=v=>Math.round(v).toLocaleString('en-CA');
  setTimeout(()=>{ const bar=document.querySelector('#f1v .f1d-bar'), key=document.querySelector('#f1v .f1d-mapkey'); if(!bar||bar.closest('details')) return; const det=document.createElement('details'); det.className='f1e2-draw';
    det.innerHTML='<summary>Draw your own area</summary>'; bar.parentNode.insertBefore(det,bar); det.appendChild(bar); if(key) det.appendChild(key); },150);
  return `<div class="f1e2-face"><h3>The nearest big heat users</h3><p class="f1e2-fl">Buildings within reach that use the most heat (estimates from use and floor area; 500 MWh a year or more, nearest first).</p><ol>${list.map(b=>`<li><b>${n0(b.heat[0])}–${n0(b.heat[1])} MWh a year</b><span>${esc(USE[b.use]||'Use not known')} · ${b.st} storey${b.st===1?'':'s'}${b.stEst?' (assumed)':''} · ${n0(d(b))} m away</span></li>`).join('')}</ol></div>`; }
 
const LIST=[['Site',['Your parcel']],['Set-up',['Cooling and water','What fits here','When the power fails','Noise next door']],['Exchanges',['Where the heat could go','Heat nearby','Power, cost and carbon']],['Report',['Report']]];
function css(){ if(document.getElementById('f1e2-css')) return; const s=document.createElement('style'); s.id='f1e2-css'; s.textContent=`.f1e2-face{margin:0 0 12px;padding:0 0 10px;border-bottom:1px solid #E3E6EC} .f1e2-face h3{margin:0 0 2px;font-size:15px;font-weight:600;color:#1E2A47} .f1e2-fl{margin:0 0 6px;font-size:12.5px;color:#4A5672} .f1e2-face ol{margin:0;padding-left:20px;display:grid;gap:3px} .f1e2-face li{font-size:13px;color:#1E2A47} .f1e2-face li span{color:#4A5672;margin-left:8px} .f1e2-draw{margin:0 0 8px} .f1e2-draw>summary{display:inline-block;cursor:pointer;font-size:13px;padding:5px 14px;border:1px solid #1E2A47;border-radius:999px;margin-bottom:8px} .f1e2-h{font-size:13px;font-weight:600;margin:12px 0 4px} .f1e2-l{font-size:13px;color:var(--bd-ink-2);margin:4px 0 8px} .f1e2-n{font-size:12.5px;color:var(--bd-ink-3);margin:10px 0 0;font-style:italic}`; document.head.appendChild(s); }
BD.f1eng2={on,install,LIST,CARDS,css};
})();

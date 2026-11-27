 
(function(){
'use strict';
const BD=window.BD; const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const TABS=[['arch','Architecture'],['phw','Power, heat and water'],['both','Both']];
 
const TABOF=t=>({arch:'arch',arch_only:'arch',municipal:'arch',full:'phw',phw:'phw',engineering:'phw'})[t]||'both';
 
const MUNI_CARD={'Your city':['parcel','zone'],'Your parcel':['parcel','zone'],'Is a data centre allowed?':['zoning_status'],'Height and floor area':['envelope','floor_area','roof_equipment_rule'],'Yards by edge':['envelope'],
 'Noise limits around the lot':['noise_limit'],'Storeys and street frontage':['storey_min'],'Approval process':['rezoning_price']};
 
const CARD={ 'Cooling':'setup','Noise':'setup','Backup power':'setup','What fits':'fits','Heat offered':'heat','Who could take it':'heat','Electricity':'energy','Water':'water',  'Heat receivers nearby':'heat','People nearby':'social','Neighbours and views':'social' };
const WORD=[[100,'arithmetic'],[90,'regulation, tariff or standard read directly'],[80,'government dataset'],[70,'peer-reviewed coefficient from another context'],[60,'derived with a stated assumption'],[50,'operator or industry claim'],[40,'proxy'],[20,'judged'],[0,'gap: no source yet']];  
const word=q=>{ if(q==null) return 'no trust score yet'; for(const [v,w] of WORD) if(q>=v) return w; return 'gap: no source yet'; };
let L=null, O=null, UP={}, DN={}, ORDER={}; const S={tab:'both',sel:null,lit:[],label:'',v:null};
const load=async()=>{ if(!L){ L=await fetch('logic.json').then(r=>r.json()); Object.keys(L.nodes).forEach((k,i)=>ORDER[k]=i); for(const [a,b] of L.edges){ (UP[b]=UP[b]||[]).push(a); (DN[a]=DN[a]||[]).push(b); } }
  if(!O) O=await fetch('opps.json').then(r=>r.json()).catch(()=>({sources:{},source_kinds:{}})); };
const live=k=>{ const n=L.nodes[k]; return !!n&&!n.a; };    
const shown=k=>{ if(!live(k)) return false; const p=L.nodes[k].path||'both'; return S.tab==='both'||p==='both'||p===S.tab; };
const walk=(ids,M)=>{ const s=new Set(), st=[...ids]; while(st.length){ const x=st.pop(); if(s.has(x)) continue; s.add(x); (M[x]||[]).forEach(p=>st.push(p)); } return s; };
function visNear(id,V,M){ const out=new Set(), seen=new Set(), st=[...(M[id]||[])]; while(st.length){ const x=st.pop(); if(seen.has(x)) continue; seen.add(x); if(V.has(x)) out.add(x); else (M[x]||[]).forEach(p=>st.push(p)); } return out; }
 
const wrap=(t,n)=>{ const out=['']; for(const x of String(t).split(/\s+/)){ const c=out[out.length-1]; if((c+' '+x).trim().length>n&&c) out.push(x); else out[out.length-1]=(c+' '+x).trim(); } return out; };
 
let MC=null; const mw=t=>{ try{ if(!MC){ MC=document.createElement('canvas').getContext('2d'); const ff=getComputedStyle(document.body).fontFamily||'IBM Plex Sans, sans-serif'; MC.font=`13px ${ff}`; } return MC.measureText(t).width; }catch(e){ return null; } };
const wrapW=(t,px)=>{ if(mw('x')==null) return wrap(t,22); const out=['']; for(const x of String(t).split(/\s+/)){ const c=out[out.length-1], j=(c+' '+x).trim(); if(c&&mw(j)>px) out.push(x); else out[out.length-1]=j; } return out; };
const BW=176, CW=212, GY=8, LH=14, TOP=56, X0=16, RR=6.5, CIRC=2*Math.PI*RR;
 
let MAXH=1500;
function layout(){ const keys=Object.keys(L.nodes).filter(shown).sort((a,b)=>ORDER[a]-ORDER[b]), V=new Set(keys);
  const st=L.stages.map(s=>s[0]), cols={}; st.forEach(s=>cols[s]=[]); keys.forEach(k=>(cols[L.nodes[k].s]||(cols[L.nodes[k].s]=[])).push(k));
  const P={}, HD=[], SH=[]; let H=0, x=X0;
  st.forEach((s,i)=>{ const ks=cols[s]||[], busy=ks.length>12; let y=TOP, g0=null, x0=x;
    if(busy){ const first={}; ks.forEach(k=>{ const g=L.nodes[k].sg||''; if(first[g]==null) first[g]=ORDER[k]; }); ks.sort((a,b)=>first[L.nodes[a].sg||'']-first[L.nodes[b].sg||'']||ORDER[a]-ORDER[b]); }
    ks.forEach(k=>{ const n=L.nodes[k], g=n.sg||'', ln=wrapW(n.n,BW-34), h=Math.max(36,12+ln.length*LH), newG=busy&&g&&g!==g0;
      if(y+h+(newG?26:0)>MAXH&&y>TOP){ x+=CW; y=TOP; if(busy&&g&&!newG){ HD.push([x,y+12,g+' (cont.)']); y+=20; } }
      if(newG){ if(y>TOP) y+=6; HD.push([x,y+12,g]); y+=20; } g0=g;
      P[k]={x,y,h,ln}; y+=h+GY; H=Math.max(H,y); });
    SH.push([x0,i,ks.length]); x+=CW; cols[s]=ks; });
  return {keys,V,st,cols,P,HD,SH,W:x,H:H+12}; }
function diagram(){ const Y=layout(), {keys,V,st,cols,P}=Y;
  const focus=S.sel?[S.sel]:S.lit.filter(k=>V.has(k)), A=focus.length?walk(focus,UP):new Set(); if(S.sel) walk([S.sel],DN).forEach(k=>A.add(k));
  let ed='', el='';
  for(const k of keys){ const b=P[k]; for(const q of visNear(k,V,UP)){ const a=P[q]; if(a.x>=b.x) continue; const sx=a.x+BW, sy=a.y+a.h/2, ex=b.x, ey=b.y+b.h/2, m=(sx+ex)/2;
    const d=`M${sx} ${sy}C${m} ${sy} ${m} ${ey} ${ex} ${ey}`; if(A.has(k)&&A.has(q)) el+=`<path d="${d}"/>`; else ed+=`<path d="${d}"/>`; } }
  const box=k=>{ const n=L.nodes[k], {x,y,h,ln}=P[k], sel=S.sel===k, lit=A.has(k), q=n.q, none=q==null||q===0, cx=x+14, cy=y+h/2;
    const ring=none?`<circle class="rg0" cx="${cx}" cy="${cy}" r="${RR}"/>`:`<circle class="rgt" cx="${cx}" cy="${cy}" r="${RR}"/><circle class="rg" cx="${cx}" cy="${cy}" r="${RR}" stroke-dasharray="${(CIRC*Math.min(100,q)/100).toFixed(2)} ${CIRC.toFixed(2)}" transform="rotate(-90 ${cx} ${cy})"/>`;
    return `<g class="lp${lit?' lit':''}${sel?' sel':''}${none?' gap':''}" data-k="${k}" tabindex="0" role="button" aria-label="${esc(n.n)}, trust ${none?'none yet':q+' of 100'}"><title>${esc(n.n)} · trust ${none?'no score yet':q+' / 100'}</title><rect x="${x}" y="${y}" width="${BW}" height="${h}" rx="2"/>${ring}`+
      ln.map((t,i)=>`<text x="${x+28}" y="${(y+h/2-(ln.length-1)*LH/2+4.5+i*LH).toFixed(1)}">${esc(t)}</text>`).join('')+'</g>'; };
  const heads=Y.SH.map(([x,i,n])=>`<text class="sh" x="${x}" y="20">${esc(L.stages[i][1])}</text><text class="ss" x="${x}" y="36">${n} part${n===1?'':'s'}</text>`).join('')+Y.HD.map(([x,y,g])=>`<text class="sg" x="${x}" y="${y}">${esc(g)}</text>`).join('');
  return {inner:`<g>${heads}</g><g class="we">${ed}</g><g class="wl">${el}</g>${keys.map(box).join('')}`,W:Y.W,H:Y.H,P,n:keys.length,lit:[...A].filter(k=>V.has(k)).length,focus}; }
function srcList(ids){ if(!ids||!ids.length) return '<p class="f1l-none">No source listed for this part.</p>';
  const one=id=>{ const t=(O.sources||{})[id]||id, k=(O.source_kinds||{})[id], m=String(t).match(/https?:\/\/\S+$/), tx0=String(t).replace(/\s*[—-]\s*https?:\/\/\S+$/,''), tx=BD.f1cards&&BD.f1cards.pub?BD.f1cards.pub(tx0):tx0;    
    return `<li>${k?`<span class="f1l-kind">${esc(k)}</span>`:''}${esc(tx.length>260?tx.slice(0,257)+'…':tx)}${m?` <a href="${esc(m[0])}" target="_blank" rel="noopener">link</a>`:''}</li>`; };
   
  return `<ul class="f1l-src">${one(ids[0])}</ul>`+(ids.length>1?`<details class="f1l-more"><summary>More sources (${ids.length-1})</summary><ul class="f1l-src">${ids.slice(1).map(one).join('')}</ul></details>`:''); }
function panel(D){ if(!S.sel){ const t=TABS.find(x=>x[0]===S.tab)[1];
    return `<div class="chap">Full diagram</div><h2>${S.label?esc(S.label):'Source breakdown'}</h2><p class="lead">${S.label?'The parts this card is worked out from are lit. Click a part for its formula, trust and sources.':'One logic runs under both paths, Architecture and Power, heat and water. Every part has a formula, a source and a trust rating. Click a part to see them.'}</p>`+
`<p class="f1l-note">${t}: ${D.n} parts shown.</p>`; }
  const k=S.sel, n=L.nodes[k], stg=(L.stages.find(s=>s[0]===n.s)||[])[1]||n.s, q=n.q, none=q==null||q===0, ins=(UP[k]||[]).filter(x=>live(x)), outs=(DN[k]||[]).filter(x=>live(x));
  return `<div class="chap">${esc(stg)}</div><h2>${esc(n.n)}</h2>${n.w?`<p class="lead">${esc(n.w.charAt(0).toUpperCase()+n.w.slice(1))}.</p>`:''}
   ${S.lot?`<div class="f1l-hero"><div class="hl">On this lot (${esc(S.lot)})</div><div class="f1l-nv${S.val&&S.sel===S.valFor?' has':''}">${S.val&&S.sel===S.valFor?esc(S.val)+' <span class="f1l-vsrc">(as the card shows it)</span>':'not in the tool yet'}</div></div>`:''}
   <section><h3>Trust</h3><p class="f1l-tr">${q==null?'no trust score yet':`Trust ${q} / 100`}</p><div class="f1l-meter"><div class="trk"><div class="bar" style="width:${none?0:q}%"></div></div><div class="cap"><span>${esc(word(q))}</span><span>never higher than its weakest input</span></div></div></section>
   <section><h3>How it is worked out</h3><p class="f1l-f">${esc(n.f||'Read or asked; no formula.')}</p>${ins.length?`<p class="f1l-in">From: ${ins.map(x=>`<button class="f1l-a" data-k="${x}">${esc(L.nodes[x].n)}</button>`).join(', ')}</p>`:''}${outs.length?`<p class="f1l-in">Feeds: ${outs.map(x=>`<button class="f1l-a" data-k="${x}">${esc(L.nodes[x].n)}</button>`).join(', ')}</p>`:''}</section>
   <section><h3>Sources</h3>${srcList(n.src)}</section>`; }
 
const fitTo=(box,D,ks)=>{ const bw=box.clientWidth, bh=box.clientHeight; if(!(bw>0&&bh>0)) return {x:0,y:0,k:1};
  if(ks&&ks.length){ let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; ks.forEach(k=>{ const p=D.P[k]; if(!p) return; x0=Math.min(x0,p.x); y0=Math.min(y0,p.y); x1=Math.max(x1,p.x+BW); y1=Math.max(y1,p.y+p.h); });
    if(x1>x0){ x0-=24; y0-=24; x1+=24; y1+=24; const k=Math.min(1,bw/(x1-x0),bh/(y1-y0)); return {k,x:(bw-(x1-x0)*k)/2-x0*k,y:Math.max(8,(bh-(y1-y0)*k)/2)-y0*k}; } }
  const k=Math.min(bw/D.W,(bh-50)/D.H)*0.98; return {k,x:(bw-D.W*k)/2,y:48}; };    
const apply=W=>{ const g=W.querySelector('.f1l-vp'); if(g&&S.v) g.setAttribute('transform',`translate(${S.v.x.toFixed(1)} ${S.v.y.toFixed(1)}) scale(${S.v.k.toFixed(4)})`); };
const zoomAt=(W,f,px,py)=>{ const v=S.v, k=Math.max(0.05,Math.min(4,v.k*f)); f=k/v.k; v.x=px-(px-v.x)*f; v.y=py-(py-v.y)*f; v.k=k; apply(W); };
let DD=null;
function draw(refit){ const W=document.getElementById('f1l'); if(!W||!L) return; const D=diagram(); DD=D;
  W.innerHTML=`<header class="f1v-head"><a class="f1-app" href="#" data-close="home">Beyond Data</a><span class="tpl">Source breakdown</span>
     <div class="f1l-tabs" role="tablist" aria-label="Path">${TABS.map(([id,nm])=>`<button role="tab" data-tab="${id}" aria-selected="${S.tab===id}">${nm}</button>`).join('')}</div>
     <span class="f1v-where">${S.label?esc(S.label)+' · ':''}${D.lit?D.lit+' of ':''}${D.n} parts</span><button class="f1v-x" data-close>Close</button></header>
   <div class="f1v-body"><main class="f1v-main"><div class="f1l-wrap"><div class="f1l-box"><svg class="f1l-svg" width="100%" height="100%" role="img" aria-label="The tool's logic: ${D.n} parts in ${L.stages.length} stages${D.lit?', '+D.lit+' lit':''}. Drag to move, wheel or pinch to zoom."><g class="f1l-vp">${D.inner}</g></svg>
       <div class="f1l-zoom" role="group" aria-label="Zoom"><button type="button" data-zoom="in" aria-label="Zoom in">+</button><button type="button" data-zoom="out" aria-label="Zoom out">−</button><button type="button" data-zoom="fit">Fit</button></div></div></div>
     <div class="f1l-key"><span><i class="k sel"></i>selected</span><span><i class="k lit"></i>on its path: feeds it or uses it</span><span><i class="k gap"></i>gap: no source yet</span><span><svg width="16" height="16" aria-hidden="true" style="vertical-align:-3px;margin-right:7px"><circle cx="8" cy="8" r="6" fill="none" stroke="#E3E6EC" stroke-width="2.4"/><circle cx="8" cy="8" r="6" fill="none" stroke="#CC746C" stroke-width="2.4" stroke-dasharray="26 38" transform="rotate(-90 8 8)"/></svg>Red ring: how far the sources back this part (full = strong)</span></div>
     <details class="f1v-src"><summary>Sources and assumptions</summary><p>Parts, wires, formulas, trust and path tags: tool/logic.json (built from the register by make_templates.py). Source texts and kinds: tool/opps.json. Trust words: CLAUDE.md §3. Display only.</p></details></main>
    <aside class="f1v-panel">${panel(D)}</aside></div>`;
  const box=W.querySelector('.f1l-box');
  if(refit||!S.mh){ const m=bestMax(box); if(m!==MAXH){ MAXH=m; const D2=diagram(); DD=D2; W.querySelector('.f1l-vp').innerHTML=D2.inner; } S.mh=MAXH; }
  if(refit||!S.v) S.v=fitTo(box,DD,refit==='focus'?DD.focus:null); apply(W); wire(W,box); }
 
function bestMax(box){ const bw=box.clientWidth, bh=box.clientHeight; if(!(bw>0&&bh>0)) return MAXH; const keep=MAXH; let best=keep, bk=0;
  for(let m=700;m<=9000;m+=100){ MAXH=m; const Y=layout(), k=Math.min(bw/Y.W,(bh-50)/Y.H); if(k>bk+1e-6){ bk=k; best=m; } } MAXH=keep; return best; }
function wire(W,box){ const sv=box.querySelector('svg'), pts=new Map(); let moved=false, last=null, pinch=null;
  const at=e=>{ const r=box.getBoundingClientRect(); return [e.clientX-r.left,e.clientY-r.top]; };
  sv.addEventListener('wheel',e=>{ e.preventDefault(); const [px,py]=at(e); zoomAt(W,Math.pow(1.0015,-e.deltaY),px,py); },{passive:false});
  sv.addEventListener('pointerdown',e=>{ pts.set(e.pointerId,at(e)); moved=false; last=at(e); if(pts.size===2){ const [a,b]=[...pts.values()]; pinch=Math.hypot(a[0]-b[0],a[1]-b[1]); } });
  sv.addEventListener('pointermove',e=>{ if(!pts.has(e.pointerId)) return; const p=at(e); pts.set(e.pointerId,p);
    if(pts.size===2){ const [a,b]=[...pts.values()], d=Math.hypot(a[0]-b[0],a[1]-b[1]); if(pinch){ zoomAt(W,d/pinch,(a[0]+b[0])/2,(a[1]+b[1])/2); moved=true; } pinch=d; return; }
    const dx=p[0]-last[0], dy=p[1]-last[1]; if(!moved&&Math.hypot(dx,dy)<4) return; if(!moved){ moved=true; try{ sv.setPointerCapture(e.pointerId); }catch(x){} } S.v.x+=dx; S.v.y+=dy; last=p; apply(W); });
  const up=e=>{ pts.delete(e.pointerId); if(pts.size<2) pinch=null; if(pts.size===1) last=[...pts.values()][0]; };
  sv.addEventListener('pointerup',up); sv.addEventListener('pointercancel',up);
  sv.addEventListener('click',e=>{ if(moved){ e.stopPropagation(); e.preventDefault(); moved=false; } },true);
  box.querySelector('.f1l-zoom').addEventListener('click',e=>{ const b=e.target.closest('[data-zoom]'); if(!b) return; e.preventDefault(); e.stopPropagation(); const z=b.dataset.zoom;
    if(z==='fit'){ S.v=fitTo(box,DD); apply(W); return; } zoomAt(W,z==='in'?1.35:1/1.35,box.clientWidth/2,box.clientHeight/2); }); }
async function open(o){ o=o||{}; await load(); S.tab=o.tab?TABOF(o.tab):S.tab; S.sel=null; S.label=o.label||''; S.lot=o.lot||''; S.val=o.val||''; S.valFor=o.sel||null;   S.lit=(o.ids||[]).filter(k=>L.nodes[k]); if(o.sel&&L.nodes[o.sel]){ S.sel=o.sel; if(!shown(o.sel)) S.tab='both'; } if(S.lit.length&&!S.lit.some(k=>shown(k))) S.tab='both';      
  let W=document.getElementById('f1l'); if(!W){ W=document.createElement('div'); W.id='f1l'; W.setAttribute('role','dialog'); W.setAttribute('aria-modal','true'); document.body.appendChild(W);
    W.addEventListener('click',e=>{ const t=e.target.closest('[data-k],[data-tab],[data-close]'); if(!t) return; e.preventDefault();
      if(t.dataset.close!=null){ W.remove(); return; } if(t.dataset.tab){ S.tab=t.dataset.tab; if(S.sel&&!shown(S.sel)) S.sel=null; draw(true); return; }
      if(t.dataset.k){ S.sel=S.sel===t.dataset.k?null:t.dataset.k; draw(); } });
    if(!window.__f1lEsc){ window.__f1lEsc=true; document.addEventListener('keydown',e=>{ const L=document.getElementById('f1l'); if(L&&e.key==='Escape'){ e.preventDefault(); e.stopImmediatePropagation(); L.remove(); } },true); }    
    W.addEventListener('keydown',e=>{ const g=e.target.closest&&e.target.closest('g[data-k]'); if(g&&(e.key==='Enter'||e.key===' ')){ e.preventDefault(); S.sel=g.dataset.k; draw(); } }); }
  S.v=null; draw((S.sel||S.lit.length)?'focus':true); }
 
 
const SITE={'Your city':{_:['zoning_status','zone']},
 'Your parcel':{_:['parcel','zone','zoning_status'],f:[[/address|lot area/i,['parcel']],[/^zone/i,['zone']],[/data centre|approval|clause/i,['zoning_status']]]}};
const FIG={
 municipal:{'Industrial land':{_:['zoned_land','industrial_jobs'],f:[[/lot zone/i,['zone']],[/lot area/i,['parcel']],[/designation|policy/i,['zoned_land','zoning_status']],[/./,['zoned_land']]]}},
 full:Object.assign({},SITE),
 arch:Object.assign({},SITE,{
 'Programs nearby':{_:['programs_nearby']},
 'What the lot allows':{_:['envelope','floor_area','storey_min'],f:[[/height/i,['envelope']],[/floor space ratio|floor area/i,['floor_area','plot_ratio']],[/yard/i,['envelope']],[/ground floor/i,['storey_min','zoning_status']]]},
 'Ground and flood':{_:['site_grade','flood_exposure'],f:[[/flood|slab/i,['flood_exposure','flood_area']],[/ground|datum/i,['site_grade']]]},
 'Pick a typology':{_:['arch_program_catalogue','typology_spec_rules'],f:[[/minimum ground|cover/i,['arch_space_budget']],[/data centre here/i,['zoning_status']],[/./,['arch_program_catalogue','typology_spec_rules']]]},
 'Variant and add-ons':{_:['arch_placement','arch_space_budget'],f:[[/refuge/i,['arch_placement','refuge_people']],[/heat hub/i,['arch_space_budget','arch_dc_ets']],[/solar/i,['pv_roof']],[/ev charging/i,['ev_stalls']],[/fit/i,['arch_space_budget']]]},
 'Variant':{_:['arch_placement','arch_space_budget'],f:[[/refuge/i,['arch_placement','refuge_people']],[/heat hub/i,['arch_space_budget','arch_dc_ets']],[/solar/i,['pv_roof']],[/ev charging/i,['ev_stalls']],[/fit/i,['arch_space_budget']]]},    
 'The governing principle':{_:['hub_layout'],f:[[/ground floor/i,['storey_min','zoning_status']]]},
 'The numbers':{_:['floor_area','size_fit','heat_delivered'],f:[[/floor area/i,['floor_area']],[/it load/i,['size_fit']],[/envelope/i,['envelope']],[/heat/i,['heat_delivered']]]},
 'What’s left for neighbours':{_:['arch_heat_budget','receivers_nearby'],f:[[/heat made/i,['heat_delivered']],[/left|used by/i,['arch_heat_budget']],[/homes/i,['homes_heated']],[/district energy/i,['competing_sources']],[/demand/i,['receiver_demand']],[/receivers/i,['receivers_nearby']]]},
 'Rooms':{_:['hub_layout'],f:[[/t-reach/i,['t_reach']],[/dead end/i,['dead_ends']],[/t-width|width/i,['room_widths']],[/refuge people/i,['refuge_people','hub_layout']],[/hall/i,['arch_dc_hall','hub_layout']]]},
 'Separations':{_:['fire_separations'],f:[[/battery/i,['fire_separations','battery_code_path']]]},
 'Exits':{_:['travel_distance','exit_separation'],f:[[/t-reach/i,['t_reach']],[/dead end/i,['dead_ends']],[/stair shaft/i,['fire_separations']],[/egress doorway/i,['egress_doorways']],[/travel/i,['travel_distance']],[/apart|discharge/i,['exit_separation']],[/exit doors/i,['hub_layout']]]},
 'Plant and site':{_:['plant_clearances'],f:[[/generator tank/i,['fuel_on_site','plant_clearances']],[/generator/i,['generator_sets','plant_clearances']],[/edmonton cooling/i,['chiller_winter_range']],[/chiller/i,['cooling_units','plant_clearances']],[/loading/i,['loading_need']],[/height/i,['building_height']],[/street|slab|step-free/i,['step_free_entry','site_grade']]]},
 'Heat flow':{_:['heat_delivered','arch_heat_budget'],f:[[/offers/i,['heat_delivered']],[/size tested/i,['size_fit']],[/temperature/i,['heat_temp']],[/./,['arch_heat_budget']]]},
 'Program diagram':{_:['hub_layout','arch_space_budget'],f:[[/asked for/i,['arch_space_budget','arch_program_catalogue']],[/net in the plan|storeys/i,['hub_layout']],[/data hall|data-centre floor/i,['arch_dc_hall']],[/"\?"/i,['typology_spec_rules']],[/height limit/i,['envelope']]]},
 'Drawing styles':{_:['storey_min','envelope'],f:[[/height limit/i,['envelope']],[/storeys/i,['storey_min','hub_layout']],[/./,['massing']]]},
 'Compare':{_:['heat_delivered','arch_heat_budget'],f:[[/offered/i,['heat_delivered']],[/not placed/i,['arch_placement']],[/./,['arch_heat_budget']]]}})};
const step=k=>BD.logic&&BD.logic.stepNodes?BD.logic.stepNodes(k):[];
function cardIds(title,tab){ const F=FIG[tab]&&FIG[tab][title]; if(F) return F._; if(title==='Report') return step('report');    
  if(tab==='municipal') return MUNI_CARD[title]||[]; const k=CARD[title]; return k?step(k):[]; }
function figIds(title,tab,label){ const F=FIG[tab]&&FIG[tab][title]; if(F&&F.f) for(const [rx,ids] of F.f) if(rx.test(label||'')) return ids; return cardIds(title,tab); }
BD.f1logic={open,cardIds,figIds,FIG};
})();

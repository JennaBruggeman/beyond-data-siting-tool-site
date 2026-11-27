 
(function(){
const BD=window.BD=window.BD||{};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let L=null, UP={}, DN={}, LOADING=null;
const load=()=>LOADING||(LOADING=fetch('logic.json').then(r=>r.ok?r.json():null).then(d=>{ if(!d||!d.lanes) return null; L=d; UP={}; DN={};
  for(const [a,b] of d.edges){ (UP[b]=UP[b]||[]).push(a); (DN[a]=DN[a]||[]).push(b); } return d; }).catch(()=>null));
 
const MAIN=['inputs','zoning','server','stacking','fire','trucks','fill','results'], SIDE=['engineering','matcher','neighbours'];
const NUM={inputs:'In',zoning:'1',server:'2',stacking:'3',fire:'4',trucks:'5',fill:'6',results:'✓',engineering:'E',matcher:'M',neighbours:'N'};
 
const RULE_LANES=new Set(['zoning','stacking','fire','trucks','fill']);
const typeOf=(id,n)=>n.k==='input'?'input':n.g==='results'?'result':(RULE_LANES.has(n.g)||n.s==='test'||/^(rule_|row_)/.test(id))?'rule':'value';
const TYPES=[['input','Input','something the tool reads or asks for'],['rule','Rule','a test: pass, flag or fail'],['value','Value','a figure worked out from others'],['result','Result','what a plan ends up as']];
const laneOf=id=>L.nodes[id]&&L.nodes[id].g, laneT=g=>{ const l=L.lanes.find(x=>x[0]===g); return l?l[1]:g; };
const label=id=>{ const n=L.nodes[id]; return n?(n.pl||n.n||id):id; };
const trust=q=>q==null?'':q>=90?'read directly from a code, bylaw or standard':q>=80?'a government dataset':q>=70?'a published study from another place':q>=60?'worked out with a stated assumption':q>=50?'an operator or industry claim':q>=40?'a stand-in figure':q>=20?'a judgement':'a gap: no source yet';
let showArch=false, query='', openLanes=new Set(), sel=null;
function css(){ if(document.getElementById('f1lm-css')) return; const s=document.createElement('style'); s.id='f1lm-css'; s.textContent=`
 #f1lm{position:fixed;inset:0;z-index:2070;background:#fff;color:var(--bd-ink);font-family:var(--bd-font);font-size:15px;line-height:1.5;overflow:auto}
 #f1lm header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--bd-rule);padding:14px 24px;position:sticky;top:0;background:#fff;z-index:3}
 #f1lm header b{font-weight:600} #f1lm .x{font:inherit;font-size:14px;background:none;border:0;color:var(--bd-ink-2);cursor:pointer;text-decoration:underline}
 #f1lm .in{max-width:1180px;margin:0 auto;padding:20px 24px 64px} #f1lm h1{font-size:30px;font-weight:600;margin:6px 0 6px} #f1lm .ld{font-size:16px;color:var(--bd-ink-2);margin:0 0 16px;max-width:760px}
 #f1lm .bar{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;margin:0 0 14px} #f1lm input[type=search]{font:inherit;font-size:15px;padding:8px 12px;border:1.5px solid var(--bd-rule);border-radius:8px;min-width:260px}
 #f1lm .bar label{font-size:14px;color:var(--bd-ink-2);cursor:pointer} #f1lm .cnt{font-size:13px;color:var(--bd-ink-3)}
 #f1lm .lg{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:13px;color:var(--bd-ink-2);margin:0 0 18px} #f1lm .lg span{display:inline-flex;align-items:center;gap:6px}
 #f1lm .mk{display:inline-block;width:12px;height:12px;flex:none;border:1.5px solid var(--bd-ink)} #f1lm .mk.input{border-radius:50%} #f1lm .mk.rule{transform:rotate(45deg);width:9px;height:9px} #f1lm .mk.value{border-radius:2px;background:var(--bd-pale)} #f1lm .mk.result{border-radius:2px;background:var(--bd-ink)}
 #f1lm .strip{display:grid;grid-template-columns:repeat(8,1fr);gap:0;margin:0 0 6px} #f1lm .strip.side{grid-template-columns:repeat(3,minmax(0,1fr));max-width:calc(3 * 1180px / 8);margin-bottom:22px}
 #f1lm .sb{position:relative;font:inherit;text-align:left;background:#fff;border:1.5px solid var(--bd-rule);border-radius:10px;padding:8px 10px;margin-right:18px;cursor:pointer;color:var(--bd-ink);min-height:74px}
 #f1lm .strip:not(.side) .sb:not(:last-child)::after{content:'';position:absolute;right:-16px;top:50%;width:12px;border-top:1.5px solid var(--bd-ghost)} #f1lm .strip:not(.side) .sb:not(:last-child)::before{content:'';position:absolute;right:-17px;top:calc(50% - 4px);border:4px solid transparent;border-left:6px solid var(--bd-ghost);border-right:0}
 #f1lm .sb.on{border-color:var(--bd-ink)} #f1lm .sb .t{font-size:13px;font-weight:600;display:block;line-height:1.25} #f1lm .sb .c{font-size:12px;color:var(--bd-ink-3)} #f1lm .sb.hit{background:var(--bd-ground)} #f1lm .sb.dim{opacity:.45}
 #f1lm .sb.g-fire{border-left:3px solid #B3261E} #f1lm .sb.g-engineering{border-left:3px solid var(--bd-heat)}
 #f1lm .stlab{font-size:12px;color:var(--bd-ink-3);margin:0 0 4px;text-transform:uppercase;letter-spacing:.04em}
 #f1lm .wrap{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:24px;align-items:start} #f1lm .wrap.nosel{grid-template-columns:minmax(0,1fr)}
 #f1lm details.ln{border:1.5px solid var(--bd-rule);border-radius:10px;margin:0 0 10px;background:#fff} #f1lm details.ln[open]{border-color:var(--bd-ghost)}
 #f1lm details.ln>summary{cursor:pointer;list-style:none;padding:10px 14px;display:grid;grid-template-columns:34px 1fr auto;gap:2px 12px;align-items:center} #f1lm details.ln>summary::-webkit-details-marker{display:none}
 #f1lm .num{width:14px;height:14px;margin:8px;border-radius:50%;background:var(--bd-ink);grid-row:1/span 2}   /* project decision */
 #f1lm summary h2{font-size:17px;font-weight:600;margin:0} #f1lm summary p{margin:0;color:var(--bd-ink-2);font-size:14px;grid-column:2} #f1lm summary .n{grid-column:3;grid-row:1/span 2;font-size:13px;color:var(--bd-ink-3);white-space:nowrap}
 #f1lm .flows{font-size:13px;color:var(--bd-ink-3);padding:0 14px 6px 60px}
 #f1lm .grp{padding:0 14px 12px 60px} #f1lm .grp h4{font-size:13px;font-weight:600;color:var(--bd-ink-2);margin:10px 0 6px}
 #f1lm .pts{display:flex;flex-wrap:wrap;gap:6px} #f1lm .pt{font:inherit;font-size:13.5px;display:inline-flex;align-items:center;gap:7px;background:#fff;border:1.5px solid var(--bd-rule);border-radius:999px;padding:4px 11px;cursor:pointer;color:var(--bd-ink);text-align:left}
 #f1lm .pt:hover,#f1lm .pt:focus-visible{border-color:var(--bd-ink)} #f1lm .pt.sel{border-color:var(--bd-ink);background:var(--bd-ground)} #f1lm .pt.up{border-color:var(--bd-ramp-3);border-style:dashed} #f1lm .pt.dn{border-color:var(--bd-ramp-3)} #f1lm .pt.arch{color:var(--bd-ink-3);border-style:dotted}
 #f1lm .ex{display:inline-block;border:1.5px solid var(--bd-ramp-3);border-radius:999px;padding:0 9px;color:var(--bd-ink)} #f1lm .ex.up{border-style:dashed}
 #f1lm mark{background:#FFF1B8;color:inherit;padding:0}
 #f1lm .pnl{position:sticky;top:70px;border:1.5px solid var(--bd-ink);border-radius:10px;padding:14px 16px;max-height:calc(100vh - 100px);overflow:auto;background:#fff}
 #f1lm .pnl h3{font-size:18px;font-weight:600;margin:0 0 2px} #f1lm .pnl .id{font-size:12px;color:var(--bd-ink-3);margin:0 0 10px;word-break:break-all} #f1lm .pnl dl{margin:0} #f1lm .pnl dt{font-size:12px;color:var(--bd-ink-3);margin-top:10px} #f1lm .pnl dd{margin:2px 0 0;font-size:14px}
 #f1lm .pnl .tr{display:inline-block;font-size:12px;border:1.5px solid var(--bd-ink);border-radius:999px;padding:1px 8px;margin-right:6px} #f1lm .pnl .lnk{display:flex;flex-direction:column;gap:4px;margin-top:4px} #f1lm .pnl .lnk button{font:inherit;font-size:13.5px;text-align:left;background:none;border:0;padding:0;color:var(--bd-ink);text-decoration:underline;cursor:pointer}
 #f1lm .pnl .lnk small{color:var(--bd-ink-3)} #f1lm .pnl .ax{margin-top:10px;padding:8px 10px;background:var(--bd-ground);font-size:13px}
 #f1lm .pnl details.tech{margin-top:12px;font-size:13px;color:var(--bd-ink-3)} #f1lm .pnl details.tech summary{cursor:pointer} #f1lm .pnl details.tech p{margin:6px 0 0;word-break:break-word}
 #f1lm .archsec{margin-top:26px} #f1lm .archsec h3{font-size:19px;font-weight:600;margin:0 0 4px} #f1lm .foot{margin-top:24px;font-size:13px;color:var(--bd-ink-3)}
 @media (max-width:980px){ #f1lm .strip{grid-template-columns:repeat(4,1fr);row-gap:10px} #f1lm .strip.side{max-width:none} #f1lm .strip .sb::after,#f1lm .strip .sb::before{display:none} #f1lm .wrap{grid-template-columns:1fr} #f1lm .pnl{position:fixed;left:0;right:0;bottom:0;top:auto;max-height:60vh;border-radius:14px 14px 0 0;z-index:4;box-shadow:0 -6px 24px rgba(30,42,71,.18)} }
 @media (max-width:600px){ #f1lm .in{padding:14px 16px 48px} #f1lm h1{font-size:25px} #f1lm .strip{grid-template-columns:repeat(2,1fr)} #f1lm .sb{margin-right:8px;min-height:0} #f1lm input[type=search]{min-width:0;width:100%} #f1lm .grp,#f1lm .flows{padding-left:14px} }`; document.head.appendChild(s); }
function parts(g){ return Object.keys(L.nodes).filter(id=>{ const n=L.nodes[id]; return n.g===g&&!n.a; }); }
function matches(id){ if(!query) return true; const n=L.nodes[id], q=query.toLowerCase(); return [id,n.pl,n.n,n.w,n.f].some(v=>v&&String(v).toLowerCase().includes(q)); }
function hl(t){ if(!query) return esc(t); const i=t.toLowerCase().indexOf(query.toLowerCase()); return i<0?esc(t):esc(t.slice(0,i))+'<mark>'+esc(t.slice(i,i+query.length))+'</mark>'+esc(t.slice(i+query.length)); }
function chip(id){ const n=L.nodes[id], ty=typeOf(id,n); const c=['pt']; if(sel===id) c.push('sel'); if(sel&&(UP[sel]||[]).includes(id)) c.push('up'); if(sel&&(DN[sel]||[]).includes(id)) c.push('dn'); if(n.a) c.push('arch');
  return `<button type="button" class="${c.join(' ')}" data-lm="pt" data-id="${esc(id)}" title="${esc(n.n||id)}"><span class="mk ${ty}" aria-hidden="true"></span>${hl(label(id))}</button>`; }
 
function flows(g){ const into={}, out={}; for(const [a,b] of L.edges){ const na=L.nodes[a], nb=L.nodes[b]; if(!na||!nb||na.a||nb.a) continue; if(nb.g===g&&na.g!==g) into[na.g]=(into[na.g]||0)+1; if(na.g===g&&nb.g!==g) out[nb.g]=(out[nb.g]||0)+1; }
  const f=o=>Object.entries(o).sort((x,y)=>y[1]-x[1]).map(([k,v])=>`${esc(laneT(k))} (${v})`).join(', ');
  return [f(into),f(out)]; }
function laneBox(g){ const l=L.lanes.find(x=>x[0]===g); const ids=parts(g), hit=ids.filter(matches); if(query&&!hit.length) return '';
  const [fi,fo]=flows(g); const op=openLanes.has(g)||(query&&hit.length);
   
  const grpOf=id=>L.nodes[id].group||L.nodes[id].grp;
  let body; if(hit.some(grpOf)){ const by=new Map(); for(const id of hit){ const k=grpOf(id)||'Other'; if(!by.has(k)) by.set(k,[]); by.get(k).push(id); }
    body=[...by].map(([k,v])=>`<div class="grp"><h4>${esc(k)} <span class="cnt">(${v.length})</span></h4><div class="pts">${v.map(chip).join('')}</div></div>`).join(''); }
  else if(g==='engineering'){ const by={}; for(const id of hit){ const s=L.nodes[id].s||'other'; (by[s]=by[s]||[]).push(id); }
    body=(L.stages||[]).filter(s=>by[s[0]]).map(s=>`<div class="grp"><h4>${esc(s[1])} <span class="cnt">(${by[s[0]].length})</span></h4><div class="pts">${by[s[0]].map(chip).join('')}</div></div>`).join(''); }
  else body=`<div class="grp"><div class="pts">${hit.map(chip).join('')}</div></div>`;
  return `<details class="ln" data-g="${g}"${op?' open':''}><summary><span class="num" aria-hidden="true"></span><h2>${esc(l[1])}</h2><p>${esc(l[2])}</p><span class="n">${query?hit.length+' of ':''}${ids.length} parts</span></summary>
   <div class="flows">${fi?`Uses figures from: ${fi}.`:''}${fi&&fo?' ':''}${fo?`Passes figures to: ${fo}.`:''}</div>${body}</details>`; }
function stripBtn(g){ const l=L.lanes.find(x=>x[0]===g); if(!l) return ''; const ids=parts(g), hit=query?ids.filter(matches).length:0, sl=sel&&laneOf(sel)===g;
  return `<button type="button" class="sb g-${g}${openLanes.has(g)||sl?' on':''}${query?(hit?' hit':' dim'):''}" data-lm="lane" data-g="${g}"><span class="t">${esc(l[1])}</span><span class="c">${query?hit+' of ':''}${ids.length} parts</span></button>`; }
function panel(){ if(!sel||!L.nodes[sel]) return ''; const n=L.nodes[sel], ty=TYPES.find(t=>t[0]===typeOf(sel,n));
  const lst=a=>(a||[]).filter(id=>L.nodes[id]&&(showArch||!L.nodes[id].a)).map(id=>`<button type="button" data-lm="pt" data-id="${esc(id)}">${esc(label(id))}</button> <small>${esc(laneT(laneOf(id)))}</small>`).join('<br>')||'<small>No link recorded in the register yet</small>';
  return `<div class="pnl" role="region" aria-label="Part details"><button class="x" type="button" data-lm="unsel" style="float:right">Close details</button><h3>${esc(label(sel))}</h3>   <dl><dt>Kind</dt><dd><span class="mk ${ty[0]}" aria-hidden="true" style="margin-right:6px;vertical-align:-1px"></span>${esc(ty[1])}: ${esc(ty[2])}</dd>
   <dt>Step</dt><dd>${esc(laneT(n.g))}</dd>
   ${n.w&&/\s/.test(n.w)?`<dt>What it is about</dt><dd>${esc(n.w)}</dd>`:''}
   ${n.f?`<dt>How it is worked out</dt><dd>${esc(n.f)}</dd>`:''}
   ${n.q!=null?`<dt>How sure</dt><dd><span class="tr">${esc(n.q)}</span>${esc(trust(n.q))}</dd>`:''}
   ${n.c?`<dt>Where it comes from</dt><dd>${esc(n.c)}</dd>`:''}
   <dt>Uses</dt><dd class="lnk">${lst(UP[sel])}</dd><dt>Used by</dt><dd class="lnk">${lst(DN[sel])}</dd></dl>
   <details class="tech"><summary>Technical details</summary><p>Rule id: ${esc(sel)}${n.n&&n.n!==label(sel)?`<br>Register name: ${esc(n.n)}`:''}${n.st?`<br>Status: ${esc(n.st)}`:''}</p></details>
   ${n.a?`<div class="ax"><b>Archived:</b> ${esc(n.a)}</div>`:''}</div>`; }
function archived(){ if(!showArch) return ''; const by={}; for(const [id,n] of Object.entries(L.nodes)) if(n.a&&matches(id)) (by[n.a]=by[n.a]||[]).push(id);
  const ks=Object.keys(by).sort((a,b)=>by[b].length-by[a].length); if(!ks.length) return '';
  return `<section class="archsec"><h3>Archived</h3><p class="ld" style="margin-bottom:8px">Parts that no longer drive the zone library. They stay in the register with their sources; only their place here moves.</p>
   ${ks.map(k=>`<details class="ln"${query?' open':''}><summary><span class="num" aria-hidden="true">A</span><h2>${esc(k.charAt(0).toUpperCase()+k.slice(1))}</h2><span class="n">${by[k].length} parts</span></summary><div class="grp"><div class="pts">${by[k].map(chip).join('')}</div></div></details>`).join('')}</section>`; }
function draw(){ const W=document.getElementById('f1lm'); if(!W||!L) return; const B=W.querySelector('.body'); const y=W.scrollTop;
  const sh=L.shown||{}, nA=Object.values(L.nodes).filter(n=>n.a).length;
  B.innerHTML=`<p class="cnt">This map shows ${sh.nodes||'—'} of the tool's ${Object.keys(L.nodes).length} parts and ${sh.edges||'—'} of its ${L.edges.length} links. The other ${nA} parts are archived: they no longer shape the plans.</p>
   <div class="stlab">The rules, in order</div><div class="strip">${MAIN.map(stripBtn).join('')}</div>
   <div class="stlab">Beside the rules</div><div class="strip side">${SIDE.map(stripBtn).join('')}</div>
   <div class="wrap${sel?'':' nosel'}"><div>${[...MAIN,...SIDE].map(laneBox).join('')||'<p>No part matches.</p>'}${archived()}</div>${panel()}</div>
   <p class="foot">Lanes and plain labels: Code, from the register (register/logic_lanes.py), a first reading still being checked. Every part keeps its full name, rule id and sources in the panel. The kind of each part (input, rule, value, result) is read from the register's fields.</p>`;
  W.scrollTop=y; }
function open(opt){ opt=opt||{}; css(); let W=document.getElementById('f1lm'); const opener=document.activeElement;
  if(!W){ W=document.createElement('div'); W.id='f1lm'; W.setAttribute('role','dialog'); W.setAttribute('aria-modal','true'); W.setAttribute('aria-label','Logic map'); document.body.appendChild(W); }
  W.innerHTML=`<header><span><button type="button" data-lm="close" style="font:inherit;font-size:14px;background:none;border:0;padding:0;margin-right:14px;color:var(--bd-ink-2,#4A5672);cursor:pointer;text-decoration:underline">Back</button><b>Beyond Data</b></span><button class="x" type="button" data-lm="close">Close</button></header><div class="in">
   <h1 tabindex="-1">Source breakdown</h1><p class="ld">For anyone who wants to check how Beyond Data decides whether a data centre and its public building fit on a lot. Every figure and rule it uses is here, grouped by the step it belongs to. Open a step to see its parts; click a part to see how it is worked out, how sure the tool is, and which other parts it uses.</p>
   <div class="bar"><input type="search" placeholder="Search parts, e.g. loading, heat pump" aria-label="Search parts" data-lm="q" value="${esc(query)}"><label><input type="checkbox" data-lm="arch"${showArch?' checked':''}> Show archived parts</label></div>
   <div class="lg" aria-label="Legend">${TYPES.map(t=>`<span><span class="mk ${t[0]}" aria-hidden="true"></span><b>${t[1]}</b> ${t[2]}</span>`).join('')}<span>After you click a part: <span class="ex up">dashed outline</span> = a part it uses; <span class="ex dn">blue outline</span> = a part that uses it</span></div>
   <div class="body"><p>Loading…</p></div></div>`;
  W._opener=opener; W.querySelector('h1').focus({preventScroll:true});
  if(!W._wired){ W._wired=true;
    W.addEventListener('click',e=>{ const b=e.target.closest('[data-lm]'); if(!b) return; const k=b.dataset.lm;
      if(k==='close'){ e.preventDefault(); close(); }
      else if(k==='pt'){ e.preventDefault(); sel=b.dataset.id; const g=laneOf(sel); if(g&&!L.nodes[sel].a) openLanes.add(g); if(L.nodes[sel].a) showArch=true; draw(); const c=document.querySelector(`#f1lm .pt.sel`); if(c) c.focus({preventScroll:true}); }
      else if(k==='unsel'){ sel=null; draw(); }
      else if(k==='lane'){ const g=b.dataset.g; openLanes.has(g)?openLanes.delete(g):openLanes.add(g); draw(); const d=document.querySelector(`#f1lm details.ln[data-g="${g}"]`); if(d&&openLanes.has(g)) d.scrollIntoView({block:'start',behavior:'smooth'}); } });
    W.addEventListener('toggle',e=>{ const d=e.target; if(d.matches&&d.matches('details.ln[data-g]')){ const g=d.dataset.g; if(d.open) openLanes.add(g); else openLanes.delete(g); const s=W.querySelector(`.sb[data-g="${g}"]`); if(s) s.classList.toggle('on',d.open); } },true);
    W.addEventListener('input',e=>{ if(e.target.dataset.lm==='q'){ query=e.target.value.trim(); draw(); } if(e.target.dataset.lm==='arch'){ showArch=e.target.checked; draw(); } });
    document.addEventListener('keydown',e=>{ if(e.key!=='Escape'||!document.getElementById('f1lm')) return; if(sel){ sel=null; draw(); } else close(); }); }
  load().then(d=>{ if(!d){ W.querySelector('.body').innerHTML='<p>The logic data has not loaded (it needs Code’s lanes in logic.json).</p>'; return; }
    if(opt.lane) openLanes.add(opt.lane); if(opt.part&&L.nodes[opt.part]){ sel=opt.part; const g=laneOf(sel); if(g) openLanes.add(g); if(L.nodes[sel].a) showArch=true; } draw();
    if(opt.lane||opt.part){ const t=document.querySelector(opt.part?'#f1lm .pt.sel':`#f1lm details.ln[data-g="${opt.lane}"]`); if(t) t.scrollIntoView({block:'center'}); } }); }
function close(){ const W=document.getElementById('f1lm'); if(!W) return; const o=W._opener; W.remove(); if(o&&o.isConnected&&o.focus) try{ o.focus({preventScroll:true}); }catch(e){} }
function on(){ return !!(BD.F1FLAGS&&BD.F1FLAGS.logicMap); }
BD.f1logicmap={open,close,on,load};
})();

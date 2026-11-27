 
(function(){
const BD=window.BD=window.BD||{};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let D=null, LG=null, openStep=null;
const load=async()=>{ if(D) return D; try{ const [a,b]=await Promise.all([fetch((BD.ASSET_BASE||'')+'data/logic_plain.json').then(r=>r.ok?r.json():null),fetch((BD.ASSET_BASE||'')+'logic.json').then(r=>r.ok?r.json():null)]); D=a; LG=b; }catch(e){ D=null; } return D; };
const n0=v=>Number(v||0).toLocaleString('en-CA');
 
const ARTQ={input:'Which lot is it, and what do public records say about it?',size:'How big a data centre fits here, and how much server power?',place:'Can the site supply the power and water it needs?',characterise:'How much heat does it give off, and what else would neighbours notice?',prospect:'Who nearby could use the heat?',opportunity:'What could the heat and spare space do for the neighbourhood?',test:'Do the costs and the city’s rules allow it?',decide:'Who gains, and who pays?'};
 
const CHECKS=[['use','Is the use allowed, and does it fit the zone’s height and size?',['Allowed uses and approvals','Height and floor area','Yards and setbacks']],
 ['fire','Are the data centre and the public rooms separated against fire?',['Fire separations']],
 ['exits','Can everyone get out safely?',['Exits and travel']],
 ['access','Can trucks and fire trucks reach it?',['Fire truck access and hydrants','Site access']],
 ['loading','Are there enough loading spaces?',['Loading and trucks']]];
const CHECK_UNDER='test';
const checkParts=k=>{ const c=CHECKS.find(x=>x[0]===k); if(!c||!LG||!LG.nodes) return []; return Object.entries(LG.nodes).filter(([i,n])=>c[2].includes(n.sg)&&!n.a).map(([i])=>i); };
const checkStep=k=>{ const ids=checkParts(k), cnt={}; ids.forEach(i=>{ const st=LG.nodes[i].s; cnt[st]=(cnt[st]||0)+1; }); const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0]; const ix=top?(D.steps||[]).findIndex(x=>x.id===top[0]):-1; return ix<0?null:ix+1; };

function css(){ if(document.getElementById('f1lp-css')) return; const s=document.createElement('style'); s.id='f1lp-css'; s.textContent=`
#f1lp{position:fixed;inset:0;z-index:2075;background:#fff;color:var(--bd-ink,#1E2A47);font-family:var(--bd-font,"IBM Plex Sans",system-ui,sans-serif);font-size:15px;line-height:1.5;overflow:auto}
#f1lp .lp-hd{position:sticky;top:0;z-index:3;background:#fff;display:flex;align-items:center;gap:22px;padding:0 28px;height:60px;border-bottom:1px solid var(--bd-rule,#D9DDE5)}
#f1lp .lp-hd b{font-weight:600} #f1lp .lp-hd .lp-tpl{color:var(--bd-ink-2,#4A5672);font-size:14px} #f1lp .lp-hd .lp-sp{flex:1}
.f1lp-sw{display:inline-flex;border:1px solid var(--bd-rule,#D9DDE5);border-radius:999px;padding:2px;gap:2px;background:#fff}
.f1lp-sw button{font:inherit;font-size:14px;border:0;background:none;color:var(--bd-ink,#1E2A47);padding:6px 18px;border-radius:999px;cursor:pointer}
.f1lp-sw button[aria-pressed="true"]{background:var(--bd-ink,#1E2A47);color:#fff;font-weight:600}
#f1lp .lp-x{font:inherit;font-size:14px;background:none;border:0;color:var(--bd-ink-2,#4A5672);cursor:pointer}
#f1lp .lp-wrap{display:grid;grid-template-columns:minmax(0,1fr) 400px;min-height:calc(100% - 60px)}
#f1lp .lp-mn{padding:28px 80px 64px;max-width:940px}
#f1lp h1{transform:none;writing-mode:horizontal-tb;font-size:40px;line-height:1.1;font-weight:600;margin:0 0 14px} #f1lp .lp-ld{font-size:16px;color:var(--bd-ink-2,#4A5672);margin:0 0 34px;max-width:620px}
#f1lp .lp-list{list-style:none;margin:0;padding:0;border-top:1px solid var(--bd-rule,#D9DDE5)}
#f1lp .lp-st{border-bottom:1px solid var(--bd-rule,#D9DDE5)}
#f1lp .lp-st{display:block;transform:none;writing-mode:horizontal-tb} #f1lp .lp-row{display:grid;grid-template-columns:56px minmax(0,1fr) auto 28px;gap:0 10px;align-items:start;width:100%;text-align:left;font:inherit;color:inherit;background:none;border:0;padding:22px 0;cursor:pointer}
#f1lp .lp-num{width:14px;height:14px;border-radius:50%;margin:8px;width:14px;height:14px;border:0;background:var(--bd-ink,#1E2A47);font-size:0}   /* project decision */
#f1lp .lp-st.lp-open .lp-num{background:var(--bd-ink,#1E2A47);color:#fff}
#f1lp .lp-q{font-size:20px;font-weight:600;line-height:1.35;display:block} #f1lp .lp-how{display:block;color:var(--bd-ink-2,#4A5672);margin-top:6px;max-width:520px}
#f1lp .lp-cnt{font-size:13px;color:var(--bd-ink-3,#6B7590);white-space:nowrap;margin-top:6px} #f1lp .lp-chev{width:10px;height:10px;border-right:1.5px solid var(--bd-ink,#1E2A47);border-bottom:1.5px solid var(--bd-ink,#1E2A47);transform:rotate(45deg);margin:10px 0 0 6px;transition:transform .15s}
#f1lp .lp-st.lp-open .lp-chev{transform:rotate(-135deg);margin-top:14px}
#f1lp .lp-det{padding:0 0 24px 66px}
#f1lp .lp-det h3{font-size:14px;font-weight:600;margin:0 0 8px} #f1lp .lp-chips{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 10px}
#f1lp .lp-chip{font-size:13px;border:1px solid var(--bd-rule,#D9DDE5);border-radius:999px;padding:3px 12px;background:#fff}
#f1lp .lp-more{font-size:13px;color:var(--bd-ink-2,#4A5672);margin:0 0 4px} #f1lp .lp-go{font:inherit;font-size:14px;font-weight:600;color:var(--bd-ink,#1E2A47);background:#fff;border:1.5px solid var(--bd-ink,#1E2A47);border-radius:999px;padding:7px 22px;margin-top:10px;cursor:pointer}
#f1lp .lp-checks{padding:0 0 22px 66px} #f1lp .lp-checks h3{font-size:14px;font-weight:600;margin:0 0 6px} #f1lp .lp-ck{display:flex;justify-content:space-between;align-items:baseline;gap:16px;width:100%;text-align:left;font:inherit;color:inherit;background:none;border:0;border-top:1px solid var(--bd-rule,#D9DDE5);padding:10px 0;cursor:pointer} #f1lp .lp-ck:hover .lp-ckq{text-decoration:underline} #f1lp .lp-ckq{font-size:16px} #f1lp .lp-cks{font-size:13px;color:var(--bd-ink-3,#6B7590);white-space:nowrap}
#f1lp .lp-side{background:#F4F5F8;padding:28px 36px 48px}
#f1lp .lp-side .lp-in{position:sticky;top:88px} #f1lp .lp-side h2{font-size:13px;font-weight:400;color:var(--bd-ink-3,#6B7590);margin:0 0 14px}
#f1lp .lp-side .lp-gl{margin:0;max-height:calc(100vh - 160px);overflow:auto;padding-right:6px} #f1lp .lp-gl .lp-t{font-weight:600;margin-top:12px} #f1lp .lp-gl .lp-p{margin:2px 0 0;color:var(--bd-ink-2,#4A5672);font-size:14px}
#f1lp .lp-gw,.f1lp-gw{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:help;text-decoration:underline dotted;text-underline-offset:3px}
#f1lp .lp-tip{position:absolute;z-index:5;max-width:300px;background:var(--bd-ink,#1E2A47);color:#fff;font-size:14px;line-height:1.45;padding:10px 12px;border-radius:6px}
#f1lp .lp-words{display:none}
#f1lp button:focus-visible{outline:2px solid var(--bd-navy,#3D5185);outline-offset:2px} #f1lp:focus{outline:none} #f1lp .lp-row:focus{outline:none} #f1lp .lp-row:focus-visible{outline:2px solid var(--bd-navy,#3D5185);outline-offset:4px;border-radius:4px}
@media (max-width:900px){ #f1lp .lp-wrap{grid-template-columns:1fr} #f1lp .lp-side{display:none} #f1lp .lp-mn{padding:22px 16px 48px} #f1lp h1{font-size:30px}
  #f1lp .lp-hd{padding:0 16px;gap:10px} #f1lp .lp-hd .lp-tpl{display:none} .f1lp-sw button{padding:5px 12px}
  #f1lp .lp-row{grid-template-columns:44px minmax(0,1fr)} #f1lp .lp-chev{display:none} #f1lp .lp-cnt{grid-column:2;margin-top:6px} #f1lp .lp-q{font-size:18px} #f1lp .lp-det{padding-left:44px} #f1lp .lp-checks{padding-left:44px} #f1lp .lp-ck{flex-direction:column;gap:2px}
  #f1lp .lp-words{display:block;margin-top:28px} #f1lp .lp-words summary{font-weight:600;cursor:pointer} #f1lp .lp-words .lp-t{font-weight:600;margin-top:10px} #f1lp .lp-words .lp-p{margin:2px 0 0;color:var(--bd-ink-2,#4A5672);font-size:14px} }
@media (prefers-reduced-motion:reduce){ #f1lp .lp-chev{transition:none} }`; document.head.appendChild(s); }

 
function gloss(text,used){ let s=String(text||''); const marks=[]; const G=(D&&D.glossary)||[];
  for(const g of G.slice().sort((a,b)=>b.term.length-a.term.length)){ const re=new RegExp('(^|[^\\w\\u0001])('+g.term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')(?![\\w])','i');
    if(re.test(s)){ s=s.replace(re,(m,a,b)=>{ marks.push([g.term,b]); return a+'\u0001'+(marks.length-1)+'\u0002'; }); used.add(g.term); } }
  return esc(s).replace(/\u0001(\d+)\u0002/g,(m,k)=>`<button type="button" class="lp-gw" data-g="${esc(marks[k][0])}">${esc(marks[k][1])}</button>`); }
const partsOf=id=>{ if(!LG||!LG.nodes) return {all:[],chips:[]}; const all=Object.entries(LG.nodes).filter(([k,n])=>n.s===id&&!n.a); const chips=all.map(([k,n])=>n.pl||n.n||k).filter(t=>t&&t.length<=34).slice(0,14); return {all:all.map(([k])=>k),chips}; };

function draw(){ const W=document.getElementById('f1lp'); if(!W||!D) return; const used=new Set();
  const steps=(D.steps||[]).map((s,i)=>{ const o=openStep===s.id, P=partsOf(s.id);
    return `<div class="lp-st${o?' lp-open':''}" role="listitem" data-id="${esc(s.id)}"><div class="lp-row" role="button" tabindex="0" aria-expanded="${o}" data-open="${esc(s.id)}"><span class="lp-num"></span><span><span class="lp-q">${gloss(ARTQ[s.id]||s.question||s.name,used)}</span><span class="lp-how">${gloss(s.howDecides||'',used)}</span></span><span class="lp-cnt">${n0(s.parts)} parts · ${n0(s.sources)} sources</span><span class="lp-chev" aria-hidden="true"></span></div>`
     +(o?`<div class="lp-det"><h3>What the tool works out in this step</h3><div class="lp-chips">${P.chips.map(c=>`<span class="lp-chip">${gloss(c,used)}</span>`).join('')}</div>${P.all.length>P.chips.length?`<p class="lp-more">and ${n0(P.all.length-P.chips.length)} more in the full diagram.</p>`:''}<p class="lp-more">Each part has a formula, a source and a trust rating.</p><button type="button" class="lp-go" data-full="${esc(s.id)}">See this step in the full diagram</button></div>`:'')
     +(s.id===CHECK_UNDER?`<div class="lp-checks"><h3>The plan checks</h3>${CHECKS.map(([k,q])=>{ const n=checkStep(k), c=checkParts(k).length; return `<button type="button" class="lp-ck" data-check="${k}"><span class="lp-ckq">${esc(q)}</span><span class="lp-cks">${n0(c)} parts →</span></button>`; }).join('')}</div>`:'')+`</div>`; }).join('');
  const G=(D.glossary||[]), dl=`<div class="lp-gl">${G.map(g=>`<div class="lp-t">${esc(g.term)}</div><div class="lp-p">${esc(g.plain)}</div>`).join('')}</div>`;
  W.querySelector('.lp-body').innerHTML=`<div class="lp-mn"><h1>Source breakdown</h1><p class="lp-ld">Eight questions, in the order the tool answers them. Open a question to see what goes into it; the full diagram behind it is there for engineers.</p><div class="lp-list" role="list">${steps}</div><details class="lp-words"><summary>Words used (${G.length})</summary>${dl}</details></div><div class="lp-side" role="complementary" aria-label="Words used"><div class="lp-in"><h2>Words used</h2>${dl}</div></div>`; }

function tip(btn){ const W=document.getElementById('f1lp'); W.querySelectorAll('.lp-tip').forEach(t=>t.remove()); const g=((D&&D.glossary)||[]).find(x=>x.term===btn.dataset.g); if(!g) return;
  const t=document.createElement('div'); t.className='lp-tip'; t.setAttribute('role','tooltip'); t.textContent=g.plain; W.appendChild(t);
  const r=btn.getBoundingClientRect(), w=W.getBoundingClientRect(); t.style.left=Math.max(8,Math.min(r.left-w.left,w.width-316))+'px'; t.style.top=(r.bottom-w.top+W.scrollTop+6)+'px'; }

 
function full(stepId,check){ const ck=check?CHECKS.find(x=>x[0]===check):null; const ids=ck?checkParts(check):stepId?partsOf(stepId).all:[]; const s=(D&&D.steps||[]).find(x=>x.id===stepId); const W=document.getElementById('f1lp'); if(W) W.remove();
  if(!BD.f1logic) return; BD.f1logic.open(Object.assign({tab:'all'},ids.length?{ids,label:ck?ck[1]:(s.t||s.title||s.name||'This step')}:{}));
  const add=()=>{ const L=document.getElementById('f1l'); if(!L) return; const h=L.querySelector('.f1v-head'); if(!h||h.querySelector('.f1lp-sw')) return;
    const sw=document.createElement('div'); sw.className='f1lp-sw'; sw.setAttribute('role','group'); sw.setAttribute('aria-label','View'); sw.innerHTML='<button type="button" aria-pressed="false" data-v="plain">Plain</button><button type="button" aria-pressed="true">Full diagram</button>';
    sw.querySelector('[data-v="plain"]').addEventListener('click',()=>{ clearInterval(full.t); const L=document.getElementById('f1l'); if(L) L.remove(); open({step:ck?CHECK_UNDER:stepId}); });
    const tpl=h.querySelector('.lp-tpl'); if(tpl) tpl.after(sw); else h.appendChild(sw); };
   
  let seen=false, tries=0; clearInterval(full.t); full.t=setInterval(()=>{ const L=document.getElementById('f1l'); tries++; if(L){ seen=true; add(); } else if(seen||tries>100){ clearInterval(full.t); } },150); }

async function open(opt){ opt=opt||{}; css(); let W=document.getElementById('f1lp'); const opener=document.activeElement;
  if(!W){ W=document.createElement('div'); W.id='f1lp'; W.setAttribute('role','dialog'); W.setAttribute('aria-modal','true'); W.setAttribute('aria-label','How it works'); W.tabIndex=-1; document.body.appendChild(W);
    W.innerHTML=`<div class="lp-hd"><button type="button" data-x style="font:inherit;font-size:14px;background:none;border:0;padding:0;margin-right:14px;color:var(--bd-ink-2,#4A5672);cursor:pointer;text-decoration:underline">Back</button><b>Beyond Data</b><span class="lp-tpl">Source breakdown</span><span class="lp-sp"></span><div class="f1lp-sw" role="group" aria-label="View"><button type="button" aria-pressed="true">Plain</button><button type="button" aria-pressed="false" data-v="full">Full diagram</button></div><button type="button" class="lp-x" data-x>Close</button></div><div class="lp-wrap lp-body"><div class="lp-mn"><p>Loading…</p></div></div>`;
    W.addEventListener('click',e=>{ const t=e.target;
      if(t.closest('[data-x]')){ W.remove(); if(opener&&opener.focus) opener.focus(); return; }
      if(t.closest('[data-v="full"]')){ full(null); return; }
      const g=t.closest('.lp-gw'); if(g){ e.stopPropagation(); tip(g); return; }
      const f=t.closest('[data-full]'); if(f){ full(f.dataset.full); return; }
      const c=t.closest('[data-check]'); if(c){ full(null,c.dataset.check); return; }
      const r=t.closest('[data-open]'); if(r){ openStep=openStep===r.dataset.open?null:r.dataset.open; draw(); const nr=W.querySelector(`[data-open="${r.dataset.open}"]`); if(nr) nr.focus(); return; }
      W.querySelectorAll('.lp-tip').forEach(x=>x.remove()); });
    W.addEventListener('keydown',e=>{ if(e.key==='Escape'){ const tp=W.querySelector('.lp-tip'); if(tp){ tp.remove(); return; } e.preventDefault(); W.remove(); if(opener&&opener.focus) opener.focus(); return; }
      const r=e.target.closest&&e.target.closest('[data-open]'); if(r&&(e.key==='Enter'||e.key===' ')&&!e.target.closest('.lp-gw')){ e.preventDefault(); r.click(); } }); }
  openStep=opt.step||null;
  const d=await load(); if(!d||!d.steps){ W.querySelector('.lp-body').innerHTML='<div class="lp-mn"><p>The plain logic data has not loaded. <button type="button" class="lp-go" data-v="full">Open the full diagram</button></p></div>'; return; }
  draw(); if(opt.step){ const r=W.querySelector(`[data-open="${opt.step}"]`); if(r){ r.focus(); return; } } W.focus(); }
BD.f1logicplain={open,load};
})();

 
(function(){
const BD=window.BD; const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const n2=v=>v==null?'?':(+v).toFixed(2), n0=v=>v==null?'?':Math.round(v).toLocaleString('en-CA'), pct=v=>v==null?'?':Math.round(v*100)+' %';
const CITY={van:'Vancouver',edm:'Edmonton'};
let DATA=null;
async function load(){ if(DATA) return DATA; for(const f of ['data/takeaway.json','f1/takeaway_sample.json']){ try{ const r=await fetch(f,{cache:'no-cache'}); if(r.ok){ DATA=await r.json(); DATA._file=f; return DATA; } }catch(e){} } return null; }
const refTxt=r=>!r?'':/^register:/.test(r)?'register '+r.slice(9):/^run:/.test(r)?'run '+r.slice(4):r;
const AW='awaiting the export';
const cellRef=(o,html)=>`<span class="f1f-c" title="${esc(o&&o.ref?'Source: '+refTxt(o.ref):AW)}"${o&&o.ref?` data-ref="${esc(o.ref)}"`:''}>${html}</span>`;
const none=()=>`<span class="f1f-q" title="${AW}">?<small>${AW}</small></span>`;
const tag=q=>{ if(q==null||!BD.f1trust) return ''; const w=BD.f1trust.word(q); return `<span class="f1-tr">confidence ${w[0]} · ${w[1]}</span>`; };
const COLS=[
 ['Where it fits',t=>{ const L=t.lots; if(!L) return none(); const w=L.tested?Math.round(100*L.fit/L.tested):0;
   return cellRef(L,`<b>${L.fit}</b> of ${L.tested} lots<span class="f1f-bar"><i style="width:${w}%"></i></span><small>${Object.entries(L.byCity||{}).map(([c,v])=>`${CITY[c]||c} ${v.fit} of ${v.tested}`).join(' · ')}</small>`); }],
 ['By zone',t=>{ const Z=t.lots&&t.lots.byZone; if(!Z) return none(); return cellRef(t.lots,`<small>${Object.entries(Z).sort((a,b)=>b[1].tested-a[1].tested).map(([z,v])=>`<span style="white-space:nowrap">${esc(z)}: ${v.fit} of ${v.tested}</span>`).join('<br>')}</small>`); }],
 ['Size where it fits',t=>t.mw&&t.mw.range?cellRef(t.mw,`<b>${n2(t.mw.range[0])}–${n2(t.mw.range[1])}</b> MW`):(t.mw&&t.lots&&t.lots.fit===0?cellRef(t.mw,'none fits'):none())],
 ['Heat used on site · offered',t=>t.heat?cellRef(t.heat,`${n0(t.heat.usedOnSiteMWh&&t.heat.usedOnSiteMWh[0])}–${n0(t.heat.usedOnSiteMWh&&t.heat.usedOnSiteMWh[1])} · ${n0(t.heat.offeredMWh&&t.heat.offeredMWh[0])}–${n0(t.heat.offeredMWh&&t.heat.offeredMWh[1])} MWh/yr`):none()],
 ['District potential',t=>t.district?cellRef(t.district,`${n0(t.district.lotsWithReceivers)}<small>${esc(t.district.note||'')}</small>`):none()],
 ['Public program',t=>t.publicProgram&&t.publicProgram.m2?cellRef(t.publicProgram,`${n0(t.publicProgram.m2[0])}–${n0(t.publicProgram.m2[1])} m²`):none()],
 ['Approval path',t=>t.approval?cellRef(t.approval,`<small>permitted ${pct(t.approval.permitted)}<br>conditional ${pct(t.approval.conditional)}<br>rezoning ${pct(t.approval.rezoning)}</small>`):none()],
 ['Main reasons it fails',t=>(t.fails||[]).length?`<ul class="f1f-why">${t.fails.map(f=>`<li>${cellRef(f,`${esc(f.reason)} <b>${f.n}</b>`)}</li>`).join('')}</ul>`:(t.lots&&t.lots.fit===t.lots.tested?'—':none())],
 ['Confidence',t=>t.confidence&&t.confidence.q!=null?cellRef(t.confidence,tag(t.confidence.q)):none()],
 ['Findings',t=>(t.findings||[]).length?`<ul class="f1f-why">${t.findings.map(f=>`<li>${cellRef(f,esc(f.text))}</li>`).join('')}</ul>`:none()]];
const lead=D=>{ const T=D.typologies||[], tested=T.reduce((a,t)=>a+(t.lots?t.lots.tested:0),0), fit=T.reduce((a,t)=>a+(t.lots?t.lots.fit:0),0);
  return `Each of the ${T.length} typologies was laid out by the tool on the same test lots in Vancouver and Edmonton: ${n0(fit)} of ${n0(tested)} tries fit. A cell's source shows on hover; "?" means that column is not exported yet.`; };
const srcList=D=>{ const S=new Set(); (D.typologies||[]).forEach(t=>Object.values(t).forEach(v=>{ if(v&&v.ref) S.add(v.ref); if(Array.isArray(v)) v.forEach(x=>x&&x.ref&&S.add(x.ref)); if(v&&v.lots) 0; })); return [...S]; };
function table(D){ const T=D.typologies||[];
  return `<div class="f1f-wrap"><table class="f1f-t"><thead><tr><th>Typology</th>${COLS.map(c=>`<th>${esc(c[0])}</th>`).join('')}</tr></thead><tbody>${T.map(t=>`<tr><th>${esc(t.name)}</th>${COLS.map(c=>`<td data-l="${esc(c[0])}">${c[1](t)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`; }
const CSS=`
#f1f{position:fixed;inset:0;z-index:2050;background:var(--f-bg,#fff);color:var(--f-ink,#16181B);font-family:var(--f-font,'IBM Plex Sans',sans-serif);font-size:14px;line-height:1.45;overflow:auto;font-variant-numeric:tabular-nums}
#f1f .f1v-head{position:sticky;top:0;background:var(--f-bg,#fff);z-index:2}
#f1f main{display:block!important;max-width:1400px;margin:0 auto;padding:28px 40px 60px;grid-template-columns:none}
#f1f h1{font-size:32px;font-weight:300;margin:6px 0 10px}#f1f .ld{max-width:760px;color:var(--f-ink2,#4A4D52);margin:0 0 8px}
#f1f .f1f-sample{display:inline-block;margin:6px 0 18px;font-size:12.5px;color:var(--f-ink2,#4A4D52);border:1px solid var(--f-rule,#DDDEDF);border-radius:2px;padding:6px 10px}
#f1f .f1f-wrap{overflow-x:auto}#f1f .f1f-t{border-collapse:collapse;width:100%;min-width:1180px}
#f1f .f1f-t th,#f1f .f1f-t td{text-align:left;vertical-align:top;padding:12px 12px 12px 0;border-bottom:1px solid var(--f-rule,#DDDEDF);font-size:13px}
#f1f thead th{font-weight:400;color:var(--f-mute,#66696E);font-size:12.5px;position:sticky;top:0}
#f1f tbody th{font-weight:500;white-space:nowrap}
#f1f .f1f-c{display:block}#f1f .f1f-c[data-ref]{cursor:help}#f1f small{display:block;color:var(--f-mute,#66696E);font-size:12px;margin-top:3px}
#f1f .f1f-q{color:var(--f-mute,#66696E)}#f1f .f1f-bar{display:block;height:4px;background:#EFEFEE;margin:5px 0 2px;max-width:120px}#f1f .f1f-bar i{display:block;height:4px;background:#3268A6}
#f1f .f1f-why{margin:0;padding:0;list-style:none}#f1f .f1f-why li{margin:0 0 4px;font-size:12.5px}
#f1f .f1f-acts{display:flex;gap:16px;margin:20px 0}#f1f .f1f-src{margin-top:26px;font-size:12.5px;color:var(--f-ink2,#4A4D52)}
@media (max-width:760px){ #f1f main{padding:18px 16px 60px} #f1f .f1f-t{min-width:0} #f1f .f1f-t thead{display:none} #f1f .f1f-t tr{display:block;border-bottom:2px solid var(--f-ink,#16181B);padding:10px 0}
  #f1f .f1f-t tbody th{display:block;border:0;font-size:17px;padding:4px 0} #f1f .f1f-t td{display:grid;grid-template-columns:42% 58%;gap:8px;padding:8px 0} #f1f .f1f-t td::before{content:attr(data-l);color:var(--f-mute,#66696E);font-size:12px} }
`;
function css(){ if(document.getElementById('f1f-css')) return; const s=document.createElement('style'); s.id='f1f-css'; s.textContent=CSS; document.head.appendChild(s); }
async function open(){ css(); close(); const D=await load(); const W=document.createElement('div'); W.id='f1f'; W.setAttribute('role','dialog'); W.setAttribute('aria-modal','true'); W.setAttribute('aria-label','What the tool found');
  const S=D?srcList(D):[];
  W.innerHTML=`<header class="f1v-head"><a class="f1-app" href="#" data-close>Beyond Data</a><span class="tpl">What the tool found</span><span style="flex:1"></span><button class="f1v-x" data-close>Close</button></header><main>
   <h1>What the tool found</h1>${D?`<p class="ld">${esc(lead(D))}</p>${D.sample?`<div class="f1f-sample">Sample: built from the fit matrix (${esc((D.source||{}).matrix||'')}) only. Heat, district, public program, approval and confidence come with the tool’s full export.</div>`:''}
   ${table(D)}<div class="f1f-acts"><button class="f1-btn" data-print>The report version</button>${BD.f1logic?'<button class="f1-link" data-logic>How each figure is worked out</button>':''}</div>
   <details class="f1f-src"><summary>Sources</summary><ul>${S.map(r=>`<li>${esc(refTxt(r))}</li>`).join('')}</ul><p>${esc((D.source||{}).note||'')} Each try: the tool’s layout of that typology on that lot, run on the engine named in the export; a timeout counts as tried, not as fitting.</p></details>`
   :'<p class="ld">The findings file is not available.</p>'}</main>`;
  document.body.appendChild(W); W.querySelector('[data-close]').focus();
  W.addEventListener('click',e=>{ if(e.target.closest('[data-close]')){ e.preventDefault(); close(); return; } if(e.target.closest('[data-print]')){ report(); return; }
    if(e.target.closest('[data-logic]')&&BD.f1logic){ BD.f1logic.open({tab:'arch'}); return; }
    const c=e.target.closest('[data-ref^="register:"]'); if(c&&BD.f1logic){ const id=c.dataset.ref.slice(9); BD.f1logic.open({tab:'all',ids:[id],sel:id,label:'What the tool found'}); } });
  W.addEventListener('keydown',e=>{ if(e.key==='Escape') close(); }); }
function close(){ const W=document.getElementById('f1f'); if(W) W.remove(); }
 
async function report(){ const D=await load(); if(!D) return; const W=document.getElementById('f1f'); const T=D.typologies||[], half=Math.ceil(COLS.length/2);
  const tbl=cols=>`<table class="f1c-res-t"><tr><th></th>${cols.map(c=>`<th>${esc(c[0])}</th>`).join('')}</tr>${T.map(t=>`<tr><th>${esc(t.name)}</th>${cols.map(c=>`<td>${c[1](t)}</td>`).join('')}</tr>`).join('')}</table>`;
  const head='BEYOND DATA · WHAT THE TOOL FOUND', N=4, pg=(n,t,b)=>BD.f1reportPage({n,total:N,title:t,head,body:b});
  const pages=[BD.f1reportPage({n:1,total:N,head:'BEYOND DATA',cover:true,body:`<h1>What the tool found</h1><p class="ld">${esc(lead(D))}</p>${D.sample?`<p class="ld">Sample from the fit matrix only; the other columns come with the tool’s full export.</p>`:''}`}),
    pg(2,'Where each typology fits',tbl(COLS.slice(0,half))), pg(3,'What it gives and why it fails',tbl(COLS.slice(half))),
    pg(4,'Sources',`<ol class="ld">${srcList(D).map(r=>`<li>${esc(refTxt(r))}</li>`).join('')}</ol><p class="ld">${esc((D.source||{}).note||'')}</p>${BD.f1trust?BD.f1trust.LEG:''}<p class="ld">${esc(BD.F1LICENCE||'')}</p>`)];
  const R=document.createElement('div'); R.id='f1f-rep'; R.innerHTML=`<div class="f1r-pages">${pages.join('')}</div><button class="f1c-mua-print" type="button" onclick="window.print()">Print the report</button>`;
  const m=W&&W.querySelector('main'); if(m){ const old=m.querySelector('#f1f-rep'); if(old) old.remove(); m.appendChild(R); R.scrollIntoView({behavior:'smooth'}); } }
BD.f1found={open,close,load,report};
})();

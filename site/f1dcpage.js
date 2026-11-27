 
(function(){
'use strict';
const BD=window.BD=window.BD||{};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const CITY={van:'Vancouver',edm:'Edmonton'};
const VIEW0={van:{X0:-7700,X1:7150,Y0:-5650,Y1:7300},edm:{X0:-14400,X1:14900,Y0:-22300,Y1:19700}};    
const S={city:'van',view:null,fac:null,R:null,opener:null,busy:0};

const CSS=`#f1dm{position:fixed;inset:0;z-index:2060;background:#fff;color:var(--bd-ink,#1E2A47);font-family:var(--bd-font,'IBM Plex Sans',sans-serif);font-size:15px;line-height:1.5;display:flex;flex-direction:column}
#f1dm header{display:flex;align-items:center;gap:16px;border-bottom:1px solid var(--bd-rule,#D9DDE3);padding:12px 24px;flex:0 0 auto;flex-wrap:wrap}
#f1dm header b{font-weight:600}#f1dm .dm-back{font:inherit;font-size:14px;background:none;border:0;color:var(--bd-ink-2,#4A5672);cursor:pointer;text-decoration:underline;padding:0}
#f1dm h1{font-size:20px;font-weight:600;margin:0;flex:1 1 auto;min-width:0}#f1dm h1:focus{outline:none}
#f1dm .dm-city{display:flex;gap:0;border:1px solid var(--bd-rule,#D9DDE3)}#f1dm .dm-city button{font:inherit;font-size:14px;background:#fff;border:0;padding:6px 14px;cursor:pointer;color:var(--bd-ink-2,#4A5672)}
#f1dm .dm-city button[aria-pressed=true]{background:var(--bd-ink,#1E2A47);color:#fff}
#f1dm .dm-body{flex:1 1 auto;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,380px)}
#f1dm .dm-main{position:relative;min-width:0;min-height:0;overflow:hidden;padding:16px 24px 8px 24px;display:flex;flex-direction:column}
#f1dm .dm-lead{margin:0 0 10px;font-size:15px;color:var(--bd-ink-2,#4A5672);max-width:70ch}
#f1dm .dm-map{position:relative;flex:1 1 auto;min-height:0;overflow:hidden;touch-action:none;cursor:grab;background:#fff;align-self:center;aspect-ratio:var(--ar,auto);max-width:100%}#f1dm .dm-map.drag{cursor:grabbing}
#f1dm .dm-map svg{width:100%;height:100%!important;max-height:none!important;display:block;overflow:hidden}
#f1dm .dm-ctl{position:absolute;top:8px;right:8px;display:flex;flex-direction:column;gap:4px;z-index:2}
#f1dm .dm-ctl button{width:32px;height:32px;border:1px solid #ccc;background:#fff;color:#333;font:16px/1 'IBM Plex Sans',sans-serif;cursor:pointer;padding:0}
#f1dm .dm-ctl button:hover{border-color:#888}#f1dm .dm-ctl button:focus-visible{outline:2px solid var(--bd-ink,#1E2A47);outline-offset:1px}
#f1dm .dm-rail{border-left:1px solid var(--bd-rule,#D9DDE3);padding:16px 20px 24px;overflow:auto;min-width:0;overflow-wrap:anywhere}
#f1dm .dm-rail .dcm-li{grid-template-columns:minmax(0,1fr) auto}
#f1dm .dm-src{font-size:12px;color:#5E6782;margin:8px 0 0}
#f1dm .dm-body.dm-fac{grid-template-columns:minmax(0,1fr) minmax(300px,460px)}#f1dm .dm-fac .dcp{flex:1 1 auto;min-height:0;overflow:auto}#f1dm .dm-fac .dcp svg{max-height:calc(100vh - 230px)!important}
#f1dm .dm-t{border-collapse:collapse;font-size:13px;width:100%;margin:12px 0 0}#f1dm .dm-t th{font-weight:600;text-align:left;vertical-align:top;padding:5px 10px 5px 0;white-space:nowrap}#f1dm .dm-t td{padding:5px 0;vertical-align:top}
#f1dm .dm-t tr+tr th,#f1dm .dm-t tr+tr td{border-top:1px solid #ECEEF1}
#f1dm .dm-h{font-size:13px;font-weight:600;margin:16px 0 6px}#f1dm .dm-notes{margin:14px 0 0;border-top:1px solid #E3E6EE;padding-top:10px}#f1dm .dm-notes>summary{cursor:pointer;font-size:13px;color:#2B3550}#f1dm .dm-notes ul{margin:8px 0 0;padding:0 0 0 16px;font-size:12px;line-height:1.5;color:#5E6782}#f1dm .dm-notes li{margin:0 0 4px}
#f1dm .dm-wait{color:#5E6782;padding:24px}
@media (max-width:860px){#f1dm .dm-body,#f1dm .dm-body.dm-fac{grid-template-columns:1fr;grid-template-rows:auto auto;overflow:auto}#f1dm .dm-map{flex:none}#f1dm .dm-map svg{height:auto!important}#f1dm .dm-main{overflow:visible}#f1dm{overflow:auto;display:block}#f1dm .dm-body,#f1dm .dm-body.dm-fac{display:block}#f1dm .dm-main{display:block}#f1dm .dm-rail{border-left:0;border-top:1px solid var(--bd-rule,#D9DDE3);overflow:visible}
 #f1dm header{padding:10px 16px}#f1dm .dm-main{padding:12px 16px 8px}#f1dm .dm-fac{grid-template-rows:auto auto}#f1dm .dm-fac .dcp-box{position:static;max-width:none;margin-top:8px}}`;
function css(){ if(document.getElementById('f1dm-css')) return; const s=document.createElement('style'); s.id='f1dm-css'; s.textContent=CSS; document.head.appendChild(s); if(BD.f1dcmap) BD.f1dcmap.css(); }

function shell(){ let W=document.getElementById('f1dm'); if(W) return W;
  W=document.createElement('div'); W.id='f1dm'; W.setAttribute('role','dialog'); W.setAttribute('aria-modal','true'); W.setAttribute('aria-label','Data centres map'); document.body.appendChild(W);
  W.addEventListener('click',onClick); W.addEventListener('keydown',e=>{ if(e.key==='Escape'){ e.preventDefault(); back(); } }); return W; }
function head(title){ return `<header><button class="dm-back" type="button" data-dm="back">Back</button><b>Beyond Data</b><h1 tabindex="-1">${esc(title)}</h1>
  <div class="dm-city" role="group" aria-label="City">${Object.keys(CITY).map(c=>`<button type="button" data-dmcity="${c}" aria-pressed="${c===S.city}">${CITY[c]}</button>`).join('')}</div></header>`; }

 
async function drawMap(keepRail){ const W=shell(), M=BD.f1dcmap; if(!M) return; const n=++S.busy;
  const R=await M.city(S.city,S.view||undefined,innerWidth<860?Math.max(300,innerWidth-32):undefined); if(n!==S.busy) return; if(!R){ W.innerHTML=head('Data centres in '+CITY[S.city])+'<p class="dm-wait">The map could not load.</p>'; return; } S.R=R;
  const map=W.querySelector('.dm-map');
  if(!S.view) S.places=R.groups.length;
  if(keepRail&&map&&!S.fac){ map.querySelector('svg').outerHTML=R.svg; const rl=W.querySelector('.dm-rail'); if(rl) rl.innerHTML=M.rail(R,S.city); return; }    
  W.innerHTML=head(R.title)+`<div class="dm-body"><div class="dm-main"><p class="dm-lead">${R.n} listed data centres with a published site in ${CITY[S.city]}, at ${S.places||R.groups.length} places. Pick one to see its building and what is listed about it.</p>
    <div class="dm-map">${R.svg}<div class="dm-ctl"><button type="button" data-dmz="in" title="Zoom in" aria-label="Zoom in">+</button><button type="button" data-dmz="out" title="Zoom out" aria-label="Zoom out">−</button><button type="button" data-dmz="home" title="Whole map" aria-label="Whole map">⌂</button></div></div>
    <p class="dm-src">${esc(R.M.sources)} ${esc(R.M.licence)}</p></div><aside class="dm-rail" aria-label="List of data centres">${M.rail(R,S.city)}</aside></div>`;
  { const m=W.querySelector('.dm-map'), vb=m&&m.querySelector('svg').viewBox.baseVal; if(vb&&vb.width&&vb.height) m.style.setProperty('--ar',(vb.width/vb.height).toFixed(4)); }    
  wireMap(W.querySelector('.dm-map')); }

 
const cur=()=>S.view||VIEW0[S.city];
function zoomAt(f,fx,fy){ const V=cur(), V0=VIEW0[S.city], w0=V0.X1-V0.X0, w=V.X1-V.X0; let nw=w/f; nw=Math.max(w0/24,Math.min(w0,nw)); const k=nw/w;
  const cx=V.X0+fx*w, cy=V.Y1-fy*(V.Y1-V.Y0), nh=(V.Y1-V.Y0)*k; S.view=clamp({X0:cx-fx*nw,X1:cx+(1-fx)*nw,Y1:cy+fy*nh,Y0:cy+fy*nh-nh}); }
function pan(dxFrac,dyFrac){ const V=cur(), w=V.X1-V.X0, h=V.Y1-V.Y0; S.view=clamp({X0:V.X0-dxFrac*w,X1:V.X1-dxFrac*w,Y0:V.Y0+dyFrac*h,Y1:V.Y1+dyFrac*h}); }
function clamp(V){ const V0=VIEW0[S.city], w=V.X1-V.X0, h=V.Y1-V.Y0; if(w>=V0.X1-V0.X0-1) return null;
  let dx=0, dy=0; if(V.X0<V0.X0) dx=V0.X0-V.X0; if(V.X1>V0.X1) dx=V0.X1-V.X1; if(V.Y0<V0.Y0) dy=V0.Y0-V.Y0; if(V.Y1>V0.Y1) dy=V0.Y1-V.Y1;
  return {X0:V.X0+dx,X1:V.X1+dx,Y0:V.Y0+dy,Y1:V.Y1+dy}; }
 
function frac(box,e){ const svg=box.querySelector('svg'), r=svg.getBoundingClientRect(), vb=svg.viewBox.baseVal, s=Math.min(r.width/vb.width,r.height/vb.height), ox=r.left+(r.width-vb.width*s)/2, oy=r.top+(r.height-vb.height*s)/2;
  return [Math.max(0,Math.min(1,(e.clientX-ox)/(vb.width*s))),Math.max(0,Math.min(1,(e.clientY-oy)/(vb.height*s))),vb.width*s,vb.height*s]; }
let redrawT=null; const redraw=()=>{ clearTimeout(redrawT); redrawT=setTimeout(()=>drawMap(true),40); };
 
function inner(svg){ let g=svg.querySelector(':scope>g[data-pan]'); if(!g){ g=document.createElementNS('http://www.w3.org/2000/svg','g'); g.setAttribute('data-pan',''); [...svg.childNodes].filter(n=>!(n.nodeName==='defs'||n.nodeName==='title')).forEach(n=>g.appendChild(n)); svg.appendChild(g); } return g; }
function unit(svg){ const r=svg.getBoundingClientRect(), vb=svg.viewBox.baseVal; return Math.min(r.width/vb.width,r.height/vb.height)||1; }
function wireMap(box){ if(!box) return; const P=new Map(); let start=null, moved=false;
  box.addEventListener('wheel',e=>{ e.preventDefault(); const [fx,fy]=frac(box,e); zoomAt(e.deltaY<0?1.25:0.8,fx,fy); redraw(); },{passive:false});
  box.addEventListener('pointerdown',e=>{ if(e.target.closest('.dm-ctl')) return; P.set(e.pointerId,{x:e.clientX,y:e.clientY}); if(P.size===1){ start={x:e.clientX,y:e.clientY,d:0}; moved=false; } else if(P.size===2){ const [a,b]=[...P.values()]; start={d:Math.hypot(a.x-b.x,a.y-b.y),mx:(a.x+b.x)/2,my:(a.y+b.y)/2}; } });
  box.addEventListener('pointermove',e=>{ if(!P.has(e.pointerId)||!start) return; P.set(e.pointerId,{x:e.clientX,y:e.clientY}); const svg=box.querySelector('svg');
    if(P.size===1&&!start.d){ const dx=e.clientX-start.x, dy=e.clientY-start.y; if(!moved&&Math.hypot(dx,dy)<5) return; if(!moved){ moved=true; box.classList.add('drag'); try{ box.setPointerCapture(e.pointerId); }catch(_){} } const u=unit(svg); inner(svg).setAttribute('transform',`translate(${(dx/u).toFixed(2)} ${(dy/u).toFixed(2)})`); }
    else if(P.size===2&&start.d){ const [a,b]=[...P.values()], d=Math.hypot(a.x-b.x,a.y-b.y); moved=true; start.k=d/start.d; const r=svg.getBoundingClientRect(), u=unit(svg), vb=svg.viewBox.baseVal, ox=r.left+(r.width-vb.width*u)/2, oy=r.top+(r.height-vb.height*u)/2, px=(start.mx-ox)/u, py=(start.my-oy)/u;
      inner(svg).setAttribute('transform',`translate(${px.toFixed(2)} ${py.toFixed(2)}) scale(${start.k.toFixed(3)}) translate(${(-px).toFixed(2)} ${(-py).toFixed(2)})`); } });
  const end=e=>{ if(!P.has(e.pointerId)) return; const svg=box.querySelector('svg'), was=P.size; P.delete(e.pointerId); box.classList.remove('drag'); if(!start||!moved){ if(!P.size) start=null; return; }
    if(was===1&&!start.d){ const [,, pw,ph]=frac(box,e); pan((e.clientX-start.x)/pw,(e.clientY-start.y)/ph); }
    else if(start.d){ const f=start.k||1, [fx,fy]=frac(box,{clientX:start.mx,clientY:start.my}); zoomAt(f,fx,fy); }
    start=null; setTimeout(()=>{ moved=false; },0); redraw();
    const old=svg; setTimeout(()=>{ if(old.isConnected){ const g=old.querySelector(':scope>g[data-pan]'); if(g) g.removeAttribute('transform'); } },600); };    
  box.addEventListener('pointerup',end); box.addEventListener('pointercancel',end);
  box.addEventListener('click',e=>{ if(moved){ e.stopPropagation(); e.preventDefault(); } },true); }

 
function notesOf(txt){ const out=[]; for(let x of String(txt).replace(/\s+/g,' ').trim().split(/(?<=\.)\s+(?=[A-Z0-9])/)){ const i=x.indexOf(', heights from '); if(i>0){ out.push(x.slice(0,i)+'.'); x='Heights from '+x.slice(i+15); } if(x.trim()) out.push(x.trim()); } return out; }
 
async function drawFac(id){ const W=shell(), C=BD.f1cards, card=C&&C.get&&C.get('resident','What it is'); if(!card) return; S.fac=id; const n=++S.busy;
  (BD.f1res=BD.f1res||{pick:{}}).pick[S.city]=id;
  W.innerHTML=head('Data centres in '+CITY[S.city])+'<p class="dm-wait">Drawing…</p>';
  let r=null; try{ r=await card.build({city:S.city,sel:{}}); }catch(e){ console.warn('dcpage',e); } if(n!==S.busy) return;
  if(!r){ W.querySelector('.dm-wait').textContent='This data centre could not be drawn.'; return; }
  const rows=(r.rows||[]).map(q=>`<tr><th>${esc(q[0])}</th><td>${typeof q[1]==='string'&&/<[a-z\/]/i.test(q[1])?q[1]:esc(q[1])}</td></tr>`).join('');
  const name=((r.rows||[]).find(q=>q[0]==='Name')||[])[1]||'';
  let key=r.keyHtml||'', notes=[]; { const t=document.createElement('div'); t.innerHTML=key; t.querySelectorAll('[data-axolab]').forEach(e=>e.remove());    
    const cr=[...t.querySelectorAll('text[data-credit]')]; if(cr.length){ notes=notesOf(cr.map(e=>e.textContent).join(' ')); cr.forEach(e=>e.remove()); } key=t.innerHTML; }    
  W.innerHTML=head(name||'Data centres in '+CITY[S.city])+`<div class="dm-body dm-fac"><div class="dm-main"><p class="dm-lead">${esc(r.lead||'')}</p>${r.draw||''}</div>
    <aside class="dm-rail" aria-label="About this data centre">${key}<h4 class="dm-h">What is listed</h4><table class="dm-t">${rows}</table>${notes.length?`<details class="dm-notes"><summary>Sources and drawing notes for the 3-D view</summary><ul>${notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul></details>`:''}
    ${(r.src||[]).length?`<h4 class="dm-h">Sources</h4>${r.src.map(s=>BD.f1cards&&BD.f1cards.pub?BD.f1cards.pub(s):s).filter(Boolean).map(s=>`<p class="dm-src">${esc(s)}</p>`).join('')}`:''}</aside></div>`;
  const h=W.querySelector('h1'); if(h) h.focus(); }

function onClick(e){ const t=e.target.closest('[data-dm],[data-dmcity],[data-dmz],[data-fac]'); if(!t) return;
  if(t.dataset.dm==='back'){ e.preventDefault(); back(); return; }
  if(t.dataset.dmcity){ if(t.dataset.dmcity!==S.city){ S.city=t.dataset.dmcity; S.view=null; S.fac=null; drawMap(); } return; }
  if(t.dataset.dmz){ if(t.dataset.dmz==='home') S.view=null; else zoomAt(t.dataset.dmz==='in'?1.6:1/1.6,0.5,0.5); drawMap(true); return; }
  const fa=t.getAttribute('data-fac'); if(fa){ e.preventDefault(); e.stopPropagation(); const [c,id]=fa.split(':'); if(c===S.city) drawFac(id); } }
document.addEventListener('keydown',e=>{ if(e.key!=='Enter'&&e.key!==' ') return; const g=e.target.closest&&e.target.closest('#f1dm g[data-fac]'); if(g){ e.preventDefault(); e.stopPropagation(); const [c,id]=g.getAttribute('data-fac').split(':'); if(c===S.city) drawFac(id); } },true);

function back(){ if(S.fac){ S.fac=null; drawMap(); return; } close(); }
function close(){ const W=document.getElementById('f1dm'); if(W) W.remove(); S.busy++; if(S.opener&&S.opener.isConnected) try{ S.opener.focus(); }catch(_){} }
function open(city){ css(); S.opener=document.activeElement; S.city=CITY[city]?city:'van'; S.view=null; S.fac=null; shell().innerHTML=head('Data centres in '+CITY[S.city])+'<p class="dm-wait">Drawing…</p>'; drawMap().then(()=>{ const h=document.querySelector('#f1dm h1'); if(h) h.focus(); }); }
BD.f1dcpage={open,close};
})();

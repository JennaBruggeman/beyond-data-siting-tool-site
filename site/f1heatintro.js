 
(function(){
'use strict';
const BD=window.BD=window.BD||{};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const INK='#1E2A47', INK2='#4A5672', HEAT='#E5338F', DCB='#3D5185', PALE='#E9EBEE';
const TITLE='Where the heat could go';
const COST='Laying new heat pipe in city streets has cost about $5,500–6,400 per metre of route (City of Surrey contract awards, 2023–2025, incl. GST). Design, building connection equipment and contingency are extra, so more heat users close by means each metre pays back better.';
const SRC_COST='Cost of new heat pipe in city streets: City of Surrey Corporate Reports R187 (20 Nov 2023) and R190 (29 Sep 2025), surrey.ca/sites/default/files/corporate-reports (contract awards, incl. GST)';
const SRC_NEU='District energy area: City of Vancouver GIS, Neighborhood Energy Utility Area; Energy Utility System By-law 9552, Schedule A.';

 
function svg(narrow){ const S=narrow?8.2:15, C=0.866, H=0.5;
  const P=(u,v,z)=>[(u-v)*C*S, (u+v)*H*S-(z||0)*S], f=n=>n.toFixed(1), pts=a=>a.map(q=>{ const p=P(q[0],q[1],0); return f(p[0])+','+f(p[1]); }).join(' ');
  const PTS=[];
  const box=(u,v,w,d,h,top,l,r,cls,delay)=>{ const a=P(u,v,h), b=P(u+w,v,h), c=P(u+w,v+d,h), e=P(u,v+d,h), b0=P(u+w,v,0), c0=P(u+w,v+d,0), e0=P(u,v+d,0), q=x=>f(x[0])+','+f(x[1]); PTS.push(a,b,c,e,b0,c0,e0);
    return `<g class="${cls||''}"${delay!=null?` style="--d:${delay.toFixed(2)}s"`:''}><polygon points="${q(e)} ${q(c)} ${q(c0)} ${q(e0)}" fill="${l}"/><polygon points="${q(b)} ${q(c)} ${q(c0)} ${q(b0)}" fill="${r}"/><polygon points="${q(a)} ${q(b)} ${q(c)} ${q(e)}" fill="${top}"/></g>`; };
  const grey=(u,v,w,d,h,delay)=>box(u,v,w,d,h,'#D3D6DB','#A9AEB7','#BFC3CA','hi-nb',delay);
   
  const R1=[[4,1.5],[14.6,1.5],[14.6,-2.8]]    , R2=[[1.5,0],[1.5,-6],[1.5,-14],[10,-14],[10,-6],[1.5,-6]], R3=[[1.5,4],[1.5,12],[10,12],[10,4],[26,4],[26,20],[10,20],[10,12]];
  const T=[[2,R1,2.2],[4.5,R2,2.4],[7,R3,3]].map(([t0,R,d])=>({t0,R,d}));    
  R1.concat(R2,R3).forEach(q=>PTS.push(P(q[0],q[1],0)));
  const o=[], line=({t0,R,d})=>`<polyline class="hi-ln" points="${pts(R)}" pathLength="1" fill="none" stroke="${HEAT}" stroke-width="${narrow?2.4:3.2}" stroke-linejoin="round" stroke-linecap="round" style="animation-duration:${d}s;animation-delay:${t0}s"/>`;
  T.forEach(t=>o.push(line(t)));
  const a1=T[0].t0+T[0].d*0.9, a2=T[1].t0+T[1].d*0.6, a3=T[2].t0+T[2].d*0.55;
   
  o.push(grey(3,-12.5,2.4,2.4,1.6,a2), grey(6.6,-12.6,2.4,2.4,2.1,a2+0.3), grey(4.2,-9.2,2.4,2.4,1.5,a2+0.6));
  o.push(grey(13.2,-4.2,2.8,2.8,2.1,a1));
  o.push(box(0,0,4,4,3,'#4D63A0','#2E3E6B',DCB));
  [[12,6,2.8,2.8,1.7],[17,5.6,2.6,2.6,2.1],[22,6.4,2.6,2.6,1.6],[13,11.5,2.8,2.8,2.4],[18.6,11,2.8,2.8,2.2],[22.4,14.6,2.4,2.4,1.5],[13.6,16.4,2.4,2.4,1.7]].forEach((b,i)=>o.push(grey(b[0],b[1],b[2],b[3],b[4],a3+i*0.2)));
  const minX=Math.min(...PTS.map(p=>p[0])), maxX=Math.max(...PTS.map(p=>p[0])), minY=Math.min(...PTS.map(p=>p[1])), maxY=Math.max(...PTS.map(p=>p[1]));
   
  const X=maxX+(narrow?14:40), lab=(p,t1,t2,at)=>`<g class="hi-lab" style="animation-delay:${at.toFixed(2)}s"><circle cx="${f(p[0])}" cy="${f(p[1])}" r="2" fill="${INK}"/><line x1="${f(p[0])}" y1="${f(p[1])}" x2="${f(X-6)}" y2="${f(p[1])}" stroke="#8A94AA" stroke-width="0.8"/><text x="${f(X)}" y="${f(p[1]+(t2?-2:4))}" font-size="${narrow?12:14}" font-weight="600" fill="${INK}">${esc(t1)}</text>${t2?`<text x="${f(X)}" y="${f(p[1]+15)}" font-size="12.5" fill="${INK2}">${esc(t2)}</text>`:''}</g>`;
  o.push(narrow?lab(P(10,-10,0),'Several neighbours','',a2+0.8):lab(P(10,-10,0),'Several neighbours','share it on a small loop',a2+0.8));
  o.push(narrow?lab(P(16,-4.2,2.1),'One neighbour','',a1):lab(P(16,-4.2,2.1),'One neighbour','next door takes the heat',a1));
  o.push(narrow?lab(P(26,8,0),'District network','',a3+1.4):lab(P(26,8,0),'A district energy network','existing, or one the data centre helps start',a3+1.4));
  let x0=minX-12; if(!narrow){ const p=P(0,4,1.5); o.push(`<line x1="${f(p[0]-6)}" y1="${f(p[1])}" x2="${f(p[0]-46)}" y2="${f(p[1])}" stroke="#8A94AA" stroke-width="0.8"/><text x="${f(p[0]-52)}" y="${f(p[1]+5)}" font-size="14" font-weight="600" fill="${INK}" text-anchor="end">The data centre</text>`); x0=Math.min(x0,p[0]-52-128); }
  const x1=X+(narrow?156:300), y0=minY-24, y1=maxY+16;
  return `<svg class="hi-svg" viewBox="${f(x0)} ${f(y0)} ${f(x1-x0)} ${f(y1-y0)}" width="100%" role="img" aria-label="Schematic: the heat from the data centre going to one neighbour, to several neighbours on a small loop, or to a district energy network" font-family="IBM Plex Sans, system-ui, sans-serif">${o.join('')}</svg>`; }

const CSS=`.hi-wrap{position:relative} .hi-svg{display:block;max-height:calc(100vh - 220px)}
.hi-ln{stroke-dasharray:1;stroke-dashoffset:1;animation-name:hi-draw;animation-timing-function:linear;animation-fill-mode:forwards}
@keyframes hi-draw{to{stroke-dashoffset:0}}
.hi-nb>polygon{opacity:.4;animation-name:hi-dark;animation-duration:.6s;animation-fill-mode:forwards;animation-timing-function:ease-out}
@keyframes hi-dark{to{opacity:1}}
.hi-lab{opacity:0;animation-name:hi-fade;animation-duration:.6s;animation-fill-mode:forwards}
@keyframes hi-fade{to{opacity:1}}
.hi-replay{position:absolute;right:0;bottom:0;font:inherit;font-size:13px;background:none;border:0;color:${INK2};text-decoration:underline;cursor:pointer;padding:4px}
/* the report page and reduced motion: the last frame, still */
.hi-still .hi-ln{animation:none;stroke-dashoffset:0}.hi-still .hi-nb>polygon,.hi-still .hi-lab{animation:none;opacity:1}
@media (prefers-reduced-motion:reduce){.hi-ln{animation:none;stroke-dashoffset:0}.hi-nb>polygon,.hi-lab{animation:none;opacity:1}.hi-replay{display:none}}
.hi-cost{max-width:640px;margin:8px 0 0}.hi-wrap .hi-svg{max-height:calc(100vh - 330px)}
.hi-ways{list-style:none;margin:6px 0 12px;padding:0}.hi-ways li{display:flex;gap:10px;align-items:baseline;margin:0 0 6px;font-size:14px;color:${INK}}.hi-ways li i{flex:0 0 22px;height:3px;background:${HEAT};transform:translateY(-4px)}
.hi-h{font-size:13px;font-weight:600;margin:12px 0 2px;color:${INK}}.hi-p{font-size:14px;margin:0 0 6px;color:${INK}}.hi-s{font-size:12px;color:#5E6782;margin:0 0 6px}`;
function css(){ if(document.getElementById('hi-css')) return; const s=document.createElement('style'); s.id='hi-css'; s.textContent=CSS; document.head.appendChild(s); }

async function lotLine(x){ let D=null; try{ D=BD.f1heatnear&&BD.f1heatnear.district?await BD.f1heatnear.district(x):null; }catch(e){}
  if(D&&D.inside) return {t:'A district energy system already serves this area; the data centre could feed heat into it. The utility decides.',d:D};
  return {t:'No heat network here today. The heat could go to a neighbour, several neighbours on a shared loop, or seed a future district system.',d:D}; }

async function build(x){ css(); const narrow=(window.innerWidth||1440)<600, L=await lotLine(x);
  const still=!!BD.A3;    
   
  const cost=`<div class="hi-cost"><h4 class="hi-h">Cost of new pipe</h4><p class="hi-p">${esc(COST)}</p><p class="hi-s">Source: City of Surrey Corporate Reports R187 (2023) and R190 (2025).</p><p class="hi-s">A possibility to explore, not a costed network: no pipe routes, no tariffs, no payback years.</p></div>`;
  const draw=`<div class="hi-wrap${still?' hi-still':''}">${svg(narrow&&!still)}${still?'':'<button type="button" class="hi-replay" data-hi-replay>Replay</button>'}</div>${still?'':cost}`;
   
  const LI='display:flex;gap:10px;align-items:baseline;margin:0 0 6px;font-size:14px;color:'+INK+';list-style:none', SW='flex:0 0 22px;height:3px;background:'+HEAT+';display:inline-block;transform:translateY(-4px)';
  const way=t=>`<li style="${LI}"><i style="${SW}"></i><span>${t}</span></li>`;
  const key=`<ul class="hi-ways" style="margin:6px 0 12px;padding:0">${way('One neighbour: next door takes the heat.')}${way('Several neighbours: share it on a small loop.')}${way('A district energy network: existing, or one the data centre helps start.')}</ul>
   <h4 class="hi-h">This lot</h4><p class="hi-p">${esc(L.t)}</p>
   ${still?`<h4 class="hi-h">Cost of new pipe</h4><p class="hi-p">${esc(COST)}</p>`:'<p class="hi-s">A possibility to explore, not a costed network.</p>'}`;
  return {art:true,noZoneFlag:true,draw,lead:'The heat the servers give off can leave the building three ways.',foot:still?'Source: City of Surrey Corporate Reports R187 (2023) and R190 (2025) (cost of new heat pipe). A possibility to explore, not a costed network.':'',hero:[],rows:[],meters:[],keyHtml:key,key:null,
    src:[SRC_COST].concat(x.city==='van'?[SRC_NEU]:[]).concat(L.d&&L.d.note?['District energy, Edmonton: '+L.d.note+'.']:[])}; }

 
const CSS2=`.hi-nb>polygon{animation-delay:var(--d,0s)}`;
document.addEventListener('click',e=>{ const b=e.target.closest&&e.target.closest('[data-hi-replay]'); if(!b) return; const w=b.closest('.hi-wrap'), s=w&&w.querySelector('svg'); if(!s) return; const c=s.cloneNode(true); s.replaceWith(c); });
(function wire(n){ const C=BD.f1cards; if(!C||!C.add){ if((n||0)<100) setTimeout(()=>wire((n||0)+1),100); return; }
  if(!document.getElementById('hi-css2')){ const s=document.createElement('style'); s.id='hi-css2'; s.textContent=CSS2; document.head.appendChild(s); }
  C.add('engineering',TITLE,{chip:'Exchanges',build}); })();
BD.f1heatintro={build,svg,TITLE,COST,SRC_COST,SRC_NEU,lotLine};
})();

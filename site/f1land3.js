 
(function(){
const BD=window.BD=window.BD||{};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const n0=v=>Math.round(v).toLocaleString('en-CA');
const which=()=>{ if(/[?&]landing[12]\b/.test(location.search)) return null;     const m=location.search.match(/[?&]landing3([abc])\b/); if(m) return m[1]; const f=BD.F1FLAGS&&BD.F1FLAGS.landing3; return /^[abc]$/.test(f||'')?f:null; };
function on(){ return !!which(); }
 
const onScroll=fn=>{ const sc=document.getElementById('f1'); let q=false; const go=()=>{ if(q) return; q=true; requestAnimationFrame(()=>{ q=false; fn(); }); }; if(sc) sc.addEventListener('scroll',go,{passive:true}); window.addEventListener('scroll',go,{passive:true}); };
const RM=()=>window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const get=u=>fetch(u,{cache:'no-cache'}).then(r=>r.ok?r.json():null).catch(()=>null);
 
const ZC={public:'#F28C38',clinic:'#FBC9A0',hall:'#8C9DBD',dc:'#B9C5DA',circulation:'#E6E9EF','core-public':'#F4F5F8','core-dc':'#3D5185',loading:'#C9CCD1',plant:'#6B7590',unassigned:'#F7F8FB'};
const ZN={public:'Public program',clinic:'Clinic',hall:'Data hall',dc:'Data-centre support',circulation:'Circulation','core-public':'Public stairs and lifts','core-dc':'Data-centre stairs and lifts',loading:'Loading',plant:'Plant',unassigned:'Not yet assigned'};
const HEAT='#7A4FE0', INK='#1E2A47', INK2='#4A5672', RULE='#D6DEEB';
const shade=(hex,f)=>{ const n=parseInt(hex.slice(1),16); return '#'+[n>>16&255,n>>8&255,n&255].map(v=>Math.max(0,Math.min(255,Math.round(v*f))).toString(16).padStart(2,'0')).join(''); };
const TYPN={emergency_hub:'Emergency hub',community_pool:'Community pool',warm_bath:'Warm bath',heat_cascade:'Heat cascade',aquaponics:'Aquaponics',conservatory:'Conservatory',food_hub:'Food hub',shelter_laundry:'Shelter + laundry'};
const TYPHUE={emergency_hub:'#F28C38',shelter_laundry:'#F2C230',community_pool:'#3FA9E0',warm_bath:'#2EC4B6',heat_cascade:'#F4A6B8',aquaponics:'#6CC24A',conservatory:'#C2D63A',food_hub:'#C9A26B'};

 
const nav=v=>`<header class="l3-head"><a class="l3-brand" href="#" data-go="top">Beyond Data</a><nav aria-label="Site"><a href="#" data-go="lib">Library</a><a href="#" data-go="decides">How each lot is laid out</a><a href="#" data-go="logic">Source breakdown</a><a href="sources.html">Sources</a></nav><button class="l3-cta s" data-start="architecture">Find a lot</button></header>`;
const acts=`<div class="l3-acts"><button class="l3-cta" data-start="architecture">Find a lot</button><button class="l3-ghost" data-go="lib">Browse the library</button></div>`;
 
const fitLine=`<p class="l3-fit" data-l3fit hidden></p>`;
 
const roles=`<section class="l3-ways"><h2>Start from the building, its services or the map</h2><p class="l3-ways-sub">Architecture and Power, heat and water open on the reference layout for 339 1st Ave E; change the lot from either. The map shows the data centres already in Vancouver and Edmonton.</p><div class="l3-ways-g">
 <article><div class="l3-ways-th" data-ways="arch"></div><h3>Architecture</h3><p>What a data centre and a public building look like on one lot, storey by storey, with the checks each layout passes.</p><button class="l3-a" data-start="architecture">Open Architecture</button></article>
 <article><div class="l3-ways-th" data-ways="phw"></div><h3>Power, heat and water</h3><p>What the building draws from the grid, how it is cooled, how loud the plant is at night and who nearby could use its heat.</p><button class="l3-a" data-start="engineering">Open Power, heat and water</button></article>
 <article><div class="l3-ways-th" data-ways="map"></div><h3>Data centres map</h3><p>Data centres around Vancouver and Edmonton, with what is known about each.</p><button class="l3-a" data-go="dcmap">Open the map</button></article></div></section>`;
const typs=`<section class="l3-typ"><h2>Eight public programs a data centre can share its building with</h2><ul data-l3typ>${Object.keys(TYPN).map(k=>`<li><button data-l3t="${k}"><i style="background:${TYPHUE[k]}"></i><img src="f1/l2/i_${k}.svg" alt="" width="20" height="20" onerror="this.remove()">${TYPN[k]}<span data-l3n="${k}"></span></button></li>`).join('')}</ul><p class="l3-note" data-l3typnote hidden></p></section>`;
const decides=`<section class="l3-dec"><div><h2>How a plan gets into the library</h2><p>Six checks, in order: the zoning, the server room, what stacks over what, fire and exits, trucks and loading, and a use for every piece of floor with no use yet. A layout that fails one is turned down, and the reason is kept.</p></div><div class="l3-acts"><button class="l3-ghost" data-go="decides">How each lot is laid out</button><button class="l3-ghost" data-go="logic">Source breakdown</button></div></section>`;
const foot=`<footer class="l3-foot"><div><p>Beyond Data, ARCH 540, UBC School of Architecture and Landscape Architecture, 2026</p>
 <p>Data: City of Vancouver open data and LiDAR 2022. Edmonton results are derived from licensed lot data (outlines simplified). Maker and operator figures are labelled as claims.</p>
 <details><summary>Sources and licences</summary><p>Contains information licensed under the Open Government Licence – Canada (Public Safety Canada, Canada Structures), the Open Government Licence – Vancouver and the Open Government Licence – City of Edmonton. Every figure in the tool names its own source; open the logic map to follow one back. <a href="sources.html">The full list of sources and licences</a></p></details></div>
 <a href="#" data-go="old">The earlier tool (archive)</a></footer>`;

 
 
function axo(P,t,o){ o=o||{}; const k=o.k||6.2, gap=o.gap||9; const boxes=[];
  for(const s of P.storeys){ const lift=t*gap*(s.st-1); for(const z of s.zones) for(const r of z.rects) boxes.push({z:z.zone,u0:r[0],u1:r[1],v0:r[2],v1:r[3],z0:s.z0+lift,z1:s.z1+lift,st:s.st}); }
  const C=Math.cos(Math.PI/6), S=Math.sin(Math.PI/6), pr=(u,v,z)=>[(u-v)*C*k,(u+v)*S*k-z*k];
  boxes.sort((a,b)=>a.z0-b.z0||(a.u0+a.v0)-(b.u0+b.v0));
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9; const faces=[];
  for(const b of boxes){ const c=ZC[b.z]||'#E6E9EF', P4=(pts)=>pts.map(q=>pr(...q)), add=(pts,fill)=>{ const q=P4(pts); for(const [x,y] of q){ x0=Math.min(x0,x); x1=Math.max(x1,x); y0=Math.min(y0,y); y1=Math.max(y1,y); } faces.push(`<polygon points="${q.map(p=>p.map(v=>v.toFixed(1)).join(',')).join(' ')}" fill="${fill}" stroke="${fill}" stroke-width="0.6" stroke-linejoin="round"/>`); };
    add([[b.u1,b.v0,b.z0],[b.u1,b.v1,b.z0],[b.u1,b.v1,b.z1],[b.u1,b.v0,b.z1]],shade(c,0.9));
    add([[b.u0,b.v1,b.z0],[b.u1,b.v1,b.z0],[b.u1,b.v1,b.z1],[b.u0,b.v1,b.z1]],shade(c,0.96));
    add([[b.u0,b.v0,b.z1],[b.u1,b.v0,b.z1],[b.u1,b.v1,b.z1],[b.u0,b.v1,b.z1]],c); }
  const pad=8; return {svg:`<svg viewBox="${(x0-pad).toFixed(0)} ${(y0-pad).toFixed(0)} ${(x1-x0+2*pad).toFixed(0)} ${(y1-y0+2*pad).toFixed(0)}" role="img" aria-label="${esc(o.label||'The plan in three dimensions, storey by storey')}">${faces.join('')}</svg>`,w:x1-x0,h:y1-y0}; }
 
function section(S,o){ o=o||{}; const k=o.k||5, H=o.H||40, W=(S.U1-S.U0)*k, top=H*k, X=u=>(u-S.U0)*k, Y=z=>top-z*k; const g=[];
  const far=[...S.elev].sort((a,b)=>b.w-a.w);
  for(const b of far){ const f=b.w>30?'#E3E7EF':b.w>12?'#D2D8E3':'#BFC7D6'; const side=b.u1<=(S.lot?S.lot[0]:0)?'front':b.u0>=(S.lot?S.lot[1]:0)-20?'back':'beside'; g.push(`<rect data-nb="${side}" x="${X(b.u0).toFixed(1)}" y="${Y(b.h).toFixed(1)}" width="${((b.u1-b.u0)*k).toFixed(1)}" height="${(b.h*k).toFixed(1)}" fill="${f}"/>`); }
  for(const s of S.plan) for(const p of s.parts){ const c=ZC[p.zone]||'#E6E9EF'; g.push(`<rect data-z="${p.zone}" data-st="${s.st}" x="${X(p.u0).toFixed(1)}" y="${Y(s.z1).toFixed(1)}" width="${((p.u1-p.u0)*k).toFixed(1)}" height="${((s.z1-s.z0)*k).toFixed(1)}" fill="${c}" stroke="#fff" stroke-width="1.5"/>`); }
  const L=S.lot||[0,0];
  g.push(`<line x1="${X(S.U0)}" y1="${Y(0)}" x2="${X(S.U1)}" y2="${Y(0)}" stroke="${INK}" stroke-width="2"/>`);
  g.push(`<line x1="${X(L[0])}" y1="${Y(0)+0}" x2="${X(L[0])}" y2="${Y(0)+10}" stroke="${INK}" stroke-width="1.5"/><line x1="${X(L[1])}" y1="${Y(0)}" x2="${X(L[1])}" y2="${Y(0)+10}" stroke="${INK}" stroke-width="1.5"/>`);
  if(S.heightLimit) g.push(`<line x1="${X(L[0]-4)}" y1="${Y(S.heightLimit)}" x2="${X(L[1]+4)}" y2="${Y(S.heightLimit)}" stroke="${INK}" stroke-width="1.2" stroke-dasharray="6 5"/><text x="${X(L[0]-4)}" y="${Y(S.heightLimit)-8}" class="l3-st">height limit ${S.heightLimit} m (outright)</text>`);
  if(S.street) g.push(`<text x="${X(-(S.street.width||10)/2)}" y="${Y(0)+26}" text-anchor="middle" class="l3-st">${esc((S.street.name||'').replace(/\bAV\b/,'Ave').replace(/\b(\w)(\w*)/g,(m,a,b)=>a+b.toLowerCase()))}</text>`);
  g.push(`<text x="${X(L[0])+6}" y="${Y(0)+44}" class="l3-st">front lot line</text><text x="${X(L[1])}" y="${Y(0)+26}" text-anchor="end" class="l3-st">back of the lot</text>`);
  return `<svg viewBox="0 0 ${W.toFixed(0)} ${(top+52).toFixed(0)}" width="${W.toFixed(0)}" height="${(top+52).toFixed(0)}" role="img" aria-label="A section through 339 1st Ave E: the shared building among its neighbours, under the height limit">${g.join('')}</svg>`; }
const legend=P=>{ const seen=[...new Set(P.storeys.flatMap(s=>s.zones.map(z=>z.zone)))]; return `<ul class="l3-lg">${seen.map(z=>`<li><i style="background:${ZC[z]||'#E6E9EF'}"></i>${esc(ZN[z]||z)}</li>`).join('')}</ul>`; };

 
const walkHTML=head=>` <section class="l3a-walk" data-l3walk><div class="l3a-stick">
  <div class="l3a-copy" data-l3copy>${head}</div>
  <p class="l3a-now" data-l3now aria-live="polite"></p>
  <div class="l3a-track" data-l3track><div data-l3sec data-focus="all"></div></div>
  <ol class="l3a-caps" data-l3caps>
   <li data-f="front"><b>The street</b>East 1st Avenue, and the building across it.</li>
   <li data-f="public"><b>Public floor at street level</b>A refuge and day shelter, open to the sidewalk.</li>
   <li data-f="clinic"><b>A clinic above</b>On the data centre’s backup power when the grid is down.</li>
   <li data-f="hall"><b>The data hall on top</b>Servers away from the street, under the height limit.</li>
   <li data-f="back"><b>The back of the lot</b>Loading and the yard, and the neighbours behind.</li></ol>
  <p class="l3a-src">339 1st Ave E, Vancouver: the tool’s emergency-hub plan, cut through the middle, zones not rooms. Neighbours: City of Vancouver LiDAR 2022, simplified to blocks. Ground drawn flat.</p></div></section>`;    
function pageA(){ return `<div class="l3 l3a">${nav('a')}
${walkHTML(`<h1>What else can a data centre exchange with its city?</h1><div class="l3a-side"><p class="l3-lead">Data centres already trade in data. This tool tests the other trades on real lots in Vancouver and Edmonton: waste heat that could warm a public pool, and a ground floor given over to a community hub. Every layout is checked against zoning, fire separation and truck access.</p>${acts}</div>`)}
 ${roles}${typs}${decides}${foot}</div>`; }
function pageB(){ return `<div class="l3 l3b">${nav('b')}
 <section class="l3b-hero"><div class="l3b-copy"><h1>What else can a data centre exchange with its city?</h1><p class="l3-lead">Data centres already trade in data. This tool tests the other trades on real lots in Vancouver and Edmonton: waste heat that could warm a public pool, and a ground floor given over to a community hub. Every layout is checked against zoning, fire separation and truck access.</p>${acts}</div>
  <div class="l3b-path" data-l3path aria-label="The heat from 339 1st Ave E, Vancouver, step by step"></div></section>
 ${roles}${typs}${decides}${foot}</div>`; }
function pageC(){ return `<div class="l3 l3c">${nav('c')}
 <section class="l3c-hero" data-l3build><div class="l3c-stick"><div class="l3c-copy"><h1>What else can a data centre exchange with its city?</h1><p class="l3-lead">Data centres already trade in data. This tool tests the other trades on real lots in Vancouver and Edmonton: waste heat that could warm a public pool, and a ground floor given over to a community hub. Every layout is checked against zoning, fire separation and truck access.</p>${acts}
   <ol class="l3c-steps" data-l3steps></ol></div><figure class="l3c-fig"><div data-l3axo></div><figcaption data-l3cap></figcaption></figure></div></section>
 ${roles}${typs}${decides}${foot}</div>`; }
function html(){ const v=which(); return v==='b'?pageB():v==='c'?pageC():pageA(); }

 
async function ways(L,P){ const a=L.querySelector('[data-ways="arch"]'), h=L.querySelector('[data-ways="phw"]'), m=L.querySelector('[data-ways="map"]');
  if(a&&P&&BD.f1mass){   a.innerHTML=BD.f1mass.render(P.storeys,{typology:P.typology,exploded:true,k:3,labels:false,yardLabel:false,label:'The 339 reference layout, storey by storey'}).replace('<svg ','<svg style="display:block;width:100%;height:100%" '); }
  if(h){ let b=null; try{ const I=await get('f1/lib_best_van.json'); b=I&&I.index&&I.index['63819485']&&I.index['63819485'].best; }catch(e){}
    const u=b&&(b.generatorUnits||[])[0], ht=b&&b.heatOfferedLiquidMWhYr;
    h.innerHTML=b?`<dl class="l3-ways-f"><div><dt>${(+b.MW).toFixed(2)} MW</dt><dd>servers</dd></div>${u?`<div><dt>${u.n} × ${(u.kW/1000)} MW</dt><dd>standby generators</dd></div>`:''}${ht?`<div><dt>${n0(ht[0])} to ${n0(ht[1])} MWh</dt><dd>a year of heat on offer if the hall were liquid-cooled</dd></div>`:''}</dl>`:''; }
  if(m&&BD.f1dcmap&&BD.f1dcmap.city){ try{ const R=await BD.f1dcmap.city('van'); if(R&&R.svg){ m.innerHTML=R.svg.replace(/max-height:[^;"]*;?/,'').replace('style="display:block','style="display:block;width:100%;height:100%'); return; } }catch(e){} }    
  if(m){ const M=await get('f1/dc/map_van.json'); const F=M?M.facilities.filter(q=>q.onMap&&q.xy):[]; if(F.length){ const X0=-7700,X1=7150,Y0=-5650,Y1=7300, W=400,H=240, k=Math.min(W/(X1-X0),H/(Y1-Y0)), ox=(W-(X1-X0)*k)/2;
      m.innerHTML=`<svg viewBox="0 0 ${W} ${H}" style="display:block;width:100%;height:100%" role="img" aria-label="Vancouver: ${F.length} data centres placed on the map"><rect width="${W}" height="${H}" fill="#F0F1F4"/>${F.map(q=>`<circle cx="${(ox+(q.xy[0]-X0)*k).toFixed(1)}" cy="${(H-(q.xy[1]-Y0)*k).toFixed(1)}" r="4" fill="${q.status==='operating'?'#1E2A47':'#fff'}" stroke="#1E2A47" stroke-width="1.4"/>`).join('')}<text x="10" y="${H-10}" font-size="11" fill="#4A5672">Vancouver: ${F.length} placed on the map</text></svg>`; } } }

 
async function after(L){ css(); const v=which();
  L.querySelectorAll('[data-l3t]').forEach(b=>b.addEventListener('click',()=>{ if(BD.f1lib&&BD.f1lib.typology) (BD.f1lib.intro||BD.f1lib.typology)(b.dataset.l3t); else if(BD.f1lib) BD.f1lib.open(); }));
  const [C,P,S,Hh]=await Promise.all([get('data/coverage_public.json'),get('f1/l3/plan339.json'),get('f1/l3/section339.json'),get('f1/l3/heat339.json')]); if(!L.isConnected) return;
  const deep=/[?&]open=(arch|eng)/i.test(location.search), later=fn=>{ if(!deep) return fn(); let seen=false; const t=setInterval(()=>{ if(!L.isConnected){ clearInterval(t); return; } if(document.getElementById('f1v')) seen=true; else if(seen){ clearInterval(t); fn(); } },800); };
  later(()=>ways(L,P).catch(e=>console.warn('ways',e)));
  const CF=C&&String(C.date||'')>='2026-11-24'?C:null, cv0=CF&&CF.van, band=cv0&&cv0.byDensity&&cv0.byDensity['1-3'], cv=cv0&&(band?Object.assign({},cv0,{lotsWithFit:band.lotsWithFit,byTypology:band.byTypology||cv0.byTypology}):cv0), fEl=L.querySelector('[data-l3fit]');     if(fEl&&cv&&cv.lotsTested){ const f=fEl; f.innerHTML=`<b>${n0(cv.lotsWithFit)} of ${n0(cv.lotsTested)}</b> Vancouver lots where a data centre is allowed fit at least one tested layout <span>(${band?'1-3 storeys':'any number of storeys'}, all programs; ${esc([C.round,C.date&&(d=>`${d.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]} ${d.getFullYear()}`)(new Date(C.date+'T12:00:00'))].filter(Boolean).join(', '))})</span>`; f.hidden=false; }
  if(CF&&cv&&cv.byTypology){ for(const [k,n] of Object.entries(cv.byTypology)){ const s=L.querySelector(`[data-l3n="${k}"]`); if(s) s.textContent=`${n0(n)} lots`; } const note=L.querySelector('[data-l3typnote]'); note.textContent=`Vancouver lots each program fits${band?' at 1-3 storeys':''}, from the coverage run named above; a program without a count has no layout in that run yet.`; note.hidden=false;
     
    const T=cv0.totals; if(T){ let all=false; const pick=(k,f)=>{ const o=cv0[k]||{}, b=band&&o.byDensity&&o.byDensity['1-3']; if(b&&b[f]!=null) return b[f]; const v=o[f]!=null?o[f]:(T[k]||{})[f]; if(v!=null) all=true; return v; };    
      const nr=pick('needsRezoning','lotsWithFit'), js=pick('joined','lotsWithFit')??pick('joined','sites'), o=[]; if(nr) o.push(`${n0(nr)} more lots fit if rezoned (tested as if ${esc((T.needsRezoning&&T.needsRezoning.asIf)||'I-2')})`); if(js) o.push(`${n0(js)} sites fit where 2 lots are joined`);
      if(o.length){ const k=document.createElement('p'); k.className=note.className; k.dataset.l3kinds=''; k.textContent=`Counted apart${all?', any number of storeys':band?', at 1-3 storeys':''}: ${o.join('; ')}.`; note.after(k); } } }
  if(v==='a'&&S) walkA(L,S); if(v==='b'&&Hh) pathB(L,Hh,P); if(v==='c'&&P) later(async()=>{ if(/[?&]heroAnim\b/.test(location.search)||(BD.F1FLAGS&&BD.F1FLAGS.heroAnim&&!/[?&]heroStill\b/.test(location.search))){ const X=await get('f1/l3/context339.json'); heroC(L,P,X); } else buildC(L,P); }); }    
 
function walkA(L,S){ const host=L.querySelector('[data-l3sec]'), track=L.querySelector('[data-l3track]'), walk=L.querySelector('[data-l3walk]'), copy=L.querySelector('[data-l3copy]'), caps=[...L.querySelectorAll('[data-l3caps] li')], now=L.querySelector('[data-l3now]');
  let k=0, W=0; const build=()=>{ const ph=track.clientHeight||window.innerHeight*0.34; k=Math.max(4,Math.min(18,(ph-50)/24)); host.innerHTML=section(S,{k,H:24}); W=(S.U1-S.U0)*k; };
  const rm=RM(), uStart=window.innerWidth<600?-8:-26;
  const tick=()=>{ const vw=track.clientWidth; let p=0;
    if(!rm){ const r=walk.getBoundingClientRect(), total=walk.offsetHeight-window.innerHeight; p=Math.max(0,Math.min(1,(-r.top)/Math.max(1,total))); }
    const i=rm?-1:p<0.1?-1:Math.min(caps.length-1,Math.floor((p-0.1)/0.9*caps.length));
     
    const L0=S.lot?S.lot[0]:0, bEnd=Math.max(...S.plan.flatMap(s=>s.parts.map(q=>q.u1))), f=i<0?'all':caps[i].dataset.f;
    const uL=f==='front'?S.U0+4:f==='back'?Math.min(S.U1-vw/k,bEnd-6):(f==='all'?uStart:Math.min(uStart,(L0+bEnd)/2-vw/k/2));
    host.style.transform=`translateX(${(-Math.max(0,Math.min(W-vw,(uL-S.U0)*k))).toFixed(1)}px)`;
    host.dataset.focus=i<0?'all':caps[i].dataset.f; caps.forEach((c,j)=>c.classList.toggle('on',rm||j===i));
    if(now&&!rm){ const t=i<0?'':caps[i].querySelector('b').textContent; if(now.textContent!==t){ now.textContent=t; } now.classList.toggle('on',i>=0); }
    if(copy&&!rm){ const f=Math.max(0,Math.min(1,(p-0.04)/0.08)); copy.style.opacity=(1-f).toFixed(2); copy.style.visibility=f>=1?'hidden':''; copy.style.transform=`translateY(${(-f*12).toFixed(1)}px)`; } };
  if(rm) walk.classList.add('rm'); build(); tick(); onScroll(tick); window.addEventListener('resize',()=>{ build(); tick(); }); }
 
function pathB(L,H,P){ const pmw=P&&P.singleSource&&P.singleSource.MWshown;     const F=H.fig, el=L.querySelector('[data-l3path]'); const v=x=>F[x]&&F[x].v?esc(F[x].v.replace(/(\d)(MWh)/,'$1 $2')):null;
  const step=(t,big,cap,src,ink)=>big?`<li><span class="d" aria-hidden="true"></span><b>${t}</b><em${ink?' class="ink"':''}>${big}</em><span class="c">${cap}</span><span class="s">${esc(src)}</span></li>`:'';
  el.innerHTML=`<p class="l3b-case">339 1st Ave E, Vancouver: the data centre alone, ${v('mw')||''} of servers, air-cooled (the tool’s own sizing)${pmw?`; the emergency-hub plan on this lot, with its public building, holds ${esc(pmw)} of servers`:''}.</p><ol class="l3b-steps">
   ${step('Servers turn power into heat',v('recovered'),'heat recovered from the hall each year',F.recovered.card)}
   ${step('A heat pump lifts it',v('hpPower'),'of electricity a year to do it (COP '+(v('cop')||'')+')',F.hpPower.card,true)}
   ${step('Heat offered to neighbours',v('offered'),'a year, after the heat pump; '+(v('homes')?'equal to heating '+v('homes'):''),F.offered.card)}
   ${step('Who could take it',v('buildings'),'buildings within 3 km; '+(v('networks')||'')+' district energy network nearby',F.buildings.card)}</ol>
   <div class="l3b-ledger"><h2>Beside it, what it costs</h2><dl><div><dt>Cost of the heat, best set-up</dt><dd>${v('cost')||''}</dd></div><div><dt>What the heat is worth</dt><dd>${v('worth')||''}</dd></div><div><dt>Buildings where connecting costs less than the heat is worth</dt><dd>${v('withinWorth')||''}</dd></div></dl>
   <p>At today’s prices, this lot’s heat costs more to deliver than it is worth. The tool shows that beside the benefit instead of netting it away.</p><p class="s">Figures as the tool’s Power, heat and water cards show them for this lot (cards 2, 6 and 7), with their sources and confidence there.</p></div>`;
  const line=document.createElement('span'); line.className='l3b-line'; el.querySelector('.l3b-steps').prepend(line);
  const rm=RM(), lis=[...el.querySelectorAll('.l3b-steps li')];
  const tick=()=>{ const r=el.querySelector('.l3b-steps').getBoundingClientRect(), vh=window.innerHeight; const p=rm?1:Math.max(0,Math.min(1,(vh*0.78-r.top)/Math.max(1,r.height))); line.style.transform=`scaleY(${p.toFixed(3)})`;
    lis.forEach(li=>{ const y=li.getBoundingClientRect().top; li.classList.toggle('on',rm||y<vh*0.8); }); };
  tick(); onScroll(tick); window.addEventListener('resize',tick); }
 
 
function heroC(L,P,X){ const fig=L.querySelector('[data-l3axo]'), cap=L.querySelector('[data-l3cap]'), steps=L.querySelector('[data-l3steps]'); if(!fig||!BD.f1mass) return buildC(L,P);
  const CT=(X&&X.buildings)||[], tot=P.shares&&P.shares.total, SS=P.singleSource||{};
  const PASS=[['program','Program','the orange rooms people come for'],['circ','Circulation','how people move: corridors as a dot field, stairs and lifts in navy'],['fire','Fire separation','only the red line between public and data centre, and the stair and lift enclosures']];
  if(steps) steps.style.display='none';    
  cap.innerHTML=`<span class="l3c-cl">Emergency hub, 339 1st Ave E: ${P.storeys.length} storeys, ${n0(tot||0)} m² of floor, ${esc(SS.MWshown||(P.MW?(+P.MW).toFixed(2)+' MW':''))} of servers, among its neighbours</span><span class="l3h-btns">${PASS.map(q=>`<button type="button" data-pass="${q[0]}"><b>${esc(q[1])}</b><span>${esc(q[2])}</span></button>`).join('')}</span><span class="l3h-src">Neighbours: City of Vancouver building footprints and LiDAR 2022 (Open Government Licence – Vancouver). The full legend is on card 6.</span>`;
  const G='#E6E8EC', PUB='[data-z="public"],[data-z="public-program"],[data-z="public-support"],[data-zf="public"],[data-zf="public-program"],[data-zf="public-support"]';
  const css=document.createElement('style'); css.textContent=`.l3h{width:100%} .l3h>svg{display:block;width:100%;height:auto;max-height:calc(100vh - 170px);-webkit-mask-image:linear-gradient(to right,transparent 0,#000 7%,#000 93%,transparent 100%),linear-gradient(to bottom,transparent 0,#000 7%,#000 93%,transparent 100%);-webkit-mask-composite:source-in;mask-image:linear-gradient(to right,transparent 0,#000 7%,#000 93%,transparent 100%),linear-gradient(to bottom,transparent 0,#000 7%,#000 93%,transparent 100%);mask-composite:intersect}   /* 22e: neighbours fade out at the frame edge (the building sits inside the 10 % margin) */ .l3h [data-z],.l3h [data-zf]{transition:fill .5s,stroke .5s} .l3h [data-circ],.l3h [data-hatch],.l3h [data-fire],.l3h [data-security]{transition:opacity .5s,stroke-width .5s}
   .l3h.p-program [data-z],.l3h.p-program [data-zf]{fill:${G};stroke:${G}} .l3h.p-program :is(${PUB}){fill:#F28C38;stroke:#F28C38} .l3h.p-program [data-z="public-support"],.l3h.p-program [data-zf="public-support"]{fill:#FDE5D0;stroke:#FDE5D0} .l3h.p-program [data-circ],.l3h.p-program [data-hatch],.l3h.p-program [data-fire],.l3h.p-program [data-security]{opacity:.12}
   .l3h.p-circ [data-z],.l3h.p-circ [data-zf]{fill:${G};stroke:${G}} .l3h.p-circ [data-z^="core"],.l3h.p-circ [data-zf^="core"]{fill:#3D5185;stroke:#3D5185} .l3h.p-circ [data-circ]{opacity:1} .l3h.p-circ pattern circle{r:1.15px} .l3h.p-circ [data-circ="public"]:not([data-dots]){fill:#D9D3C7} .l3h.p-circ [data-circ="secure"]:not([data-dots]){fill:#C9D3E6} .l3h.p-circ [data-fire]{opacity:.12}
   .l3h.p-fire [data-z],.l3h.p-fire [data-zf]{fill:${G};stroke:${G}} .l3h.p-fire [data-circ],.l3h.p-fire [data-hatch],.l3h.p-fire [data-security]{opacity:0} .l3h.p-fire [data-fire]{stroke-width:3.4}
   .l3h-btns{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:8px 0} .l3h-btns button{font:inherit;text-align:left;padding:8px 10px;border:1px solid ${RULE};border-radius:8px;background:#fff;color:${INK};cursor:pointer;display:flex;flex-direction:column;gap:2px} .l3h-btns button b{font-size:14px} .l3h-btns button span{font-size:12.5px;color:${INK2};line-height:1.35}
   .l3h-btns button[aria-pressed="true"]{border-color:${INK};box-shadow:inset 0 0 0 1px ${INK}} .l3h-src{display:block;font-size:12px;color:${INK2};margin-top:2px} [data-l3axo]{position:relative} .l3h-pp{position:absolute;right:8px;bottom:8px;display:inline-flex;align-items:center;gap:6px;font:inherit;font-size:13px;padding:6px 10px;border:1px solid ${RULE};border-radius:6px;background:rgba(255,255,255,.92);color:${INK};cursor:pointer} .l3h-pp:hover{border-color:${INK}} @media (max-width:700px){ .l3h-btns{grid-template-columns:1fr 1fr} }`; document.head.appendChild(css);
   
  const OPT={typology:P.typology,k:6,fs:30,labelCol:true,labelWrap:34,plant:P.plant,court:P.court,yard:P.yard};    
  { const fw=fig.clientWidth||fig.getBoundingClientRect().width||1200, fh=Math.max(300,(window.innerHeight||900)-170); if(fw<560){ OPT.noLab=true; OPT.labels=false; OPT.yardLabel=false; }    
  if(fw<640) OPT.labelWrap=18; let best=[0,30]; if(!OPT.noLab) for(let f=30;f<=120;f+=3){ const q=(BD.f1mass.render(P.storeys,Object.assign({},OPT,{fs:f,t:1})).match(/viewBox="([^"]+)"/)||[])[1].split(" ").map(Number), px=f*Math.min(fw/(q[2]*1.2),fh/(q[3]*1.2)); if(px>best[0]) best=[px,f]; if(px>=12.5) break; } OPT.fs=best[1]; }    
  const vb0=(BD.f1mass.render(P.storeys,Object.assign({},OPT,{t:1})).match(/viewBox="([^"]+)"/)||[])[1].split(' ').map(Number), mx=vb0[2]*0.10, my=vb0[3]*0.10, VB=[vb0[0]-mx,vb0[1]-my,vb0[2]+2*mx,vb0[3]+2*my].map(v=>v.toFixed(0)).join(' ');
   
  const rm=RM(), D=22000, START={program:7000,circ:11000,fire:15000}; let acc=0, last=null, playing=!rm, shown='', lastKey='';
  const ease=x=>x<=0?0:x>=1?1:x*x*(3-2*x);
  const phase=ms=>{ const s=(ms%D)/1000; if(s<3) return {t:0,p:''}; if(s<7) return {t:ease((s-3)/4),p:''}; if(s<11) return {t:1,p:'program'}; if(s<15) return {t:1,p:'circ'}; if(s<19) return {t:1,p:'fire'}; return {t:1-ease((s-19)/3),p:''}; };
  fig.innerHTML='<div class="l3h"></div>'; const host=fig.firstChild;
  const draw=(t,p,rot)=>{ const key=t.toFixed(4)+'|'+p+'|'+rot.toFixed(4); if(key===lastKey) return; lastKey=key;
    host.innerHTML=BD.f1mass.render(P.storeys,Object.assign({},OPT,{t,labels:t>0.6&&!OPT.noLab,context:CT,ctxR:130,ctxCullFront:true,yardLabel:!OPT.noLab,rot,label:'The emergency-hub plan for 339 1st Ave E among its neighbours'})).replace(/viewBox="[^"]+"/,`viewBox="${VB}"`);
    if(p!==shown){ host.className='l3h'+(p?' p-'+p:''); shown=p; cap.querySelectorAll('button[data-pass]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pass===p))); } };
  const pp=document.createElement('button'); pp.type='button'; pp.className='l3h-pp';
  const ppSet=()=>{ pp.setAttribute('aria-label',playing?'Pause the animation':'Play the animation'); pp.innerHTML=playing?'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><rect x="2" y="1.5" width="2.6" height="9" fill="currentColor"/><rect x="7.4" y="1.5" width="2.6" height="9" fill="currentColor"/></svg><span>Pause</span>':'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M3 1.5L10.5 6L3 10.5Z" fill="currentColor"/></svg><span>Play</span>'; };
  ppSet(); fig.appendChild(pp);
  const frame=()=>{ const ph=phase(acc); draw(ph.t,ph.p,rm?0:0.30*Math.sin(2*Math.PI*acc/D)); };
  pp.addEventListener('click',()=>{ playing=!playing; last=null; ppSet(); });
  if(!rm) cap.querySelectorAll('button[data-pass]').forEach(b=>b.addEventListener('click',()=>{ acc=START[b.dataset.pass]+1; last=null; frame(); }));
  document.addEventListener('visibilitychange',()=>{ last=null; });
  window.addEventListener('resize',()=>{ lastKey=''; frame(); });
  if(rm){ pp.hidden=true; acc=0; draw(1,'',0); cap.querySelectorAll('button[data-pass]').forEach(b=>b.addEventListener('click',()=>{ draw(1,shown===b.dataset.pass?'':b.dataset.pass,0); })); return; }
  const loop=now=>{ if(!L.isConnected) return; if(document.getElementById('f1v')){ last=null; setTimeout(()=>requestAnimationFrame(loop),500); return; }    
    if(playing&&!document.hidden){ if(last!=null) acc=(acc+Math.min(100,Math.max(0,now-last)))%D; last=now; } else last=null; frame(); requestAnimationFrame(loop); };
  requestAnimationFrame(loop); }
function buildC(L,P){ const fig=L.querySelector('[data-l3axo]'), steps=L.querySelector('[data-l3steps]'), cap=L.querySelector('[data-l3cap]'), host=L.querySelector('[data-l3build]');
  const tot=P.shares&&P.shares.total; steps.innerHTML=P.storeys.slice().reverse().map(s=>{ const by={}; for(const z of s.zones) by[z.zone]=(by[z.zone]||0)+z.area; const main=Object.entries(by).sort((a,b)=>b[1]-a[1]).filter(([z])=>!/core|circ/.test(z)).slice(0,2).map(([z])=>(BD.f1mass&&BD.f1mass.NAME[z])||ZN[z]||z).join(', ');    
    return `<li data-st="${s.st}"><b>Storey ${s.st}</b><span>${esc(main)}</span></li>`; }).join('');
  const share=P.shares&&P.shares.byZone?P.shares.byZone.filter(z=>z.pct>=5).map(z=>`${esc((ZN[z.zone]||z.label).toLowerCase())} ${z.pct} %`).join(', '):'';
  cap.innerHTML=`<span class="l3c-cl">Emergency hub, 339 1st Ave E: ${P.storeys.length} storeys, ${n0(tot||0)} m², ${esc(P.singleSource&&P.singleSource.MWshown?P.singleSource.MWshown:(+P.MW).toFixed(2)+' MW')} of servers</span><span class="l3c-lgg">${BD.f1mass?BD.f1mass.legend(P.storeys,P.typology,P.shares,P.yard||!!(P.plant||P.court)):legend(P)}</span>`;    
  const rm=RM(); let last=-1;
  const draw=t=>{ const q=Math.round(t*40)/40; if(q===last) return; last=q; fig.innerHTML=BD.f1mass?BD.f1mass.render(P.storeys,{typology:P.typology,t:q,k:6,fs:20,plant:P.plant,court:P.court,yard:P.yard,label:'The emergency-hub plan for 339 1st Ave E, '+(q>0.5?'pulled apart storey by storey':'stacked')}):axo(P,q,{}).svg; };    
  const tick=()=>{ let t=1; if(rm) t=0.55; else { const r=host.getBoundingClientRect(), total=host.offsetHeight-window.innerHeight; const p=Math.max(0,Math.min(1,(-r.top)/Math.max(1,total))); t=1-p; }
    draw(t); const on=Math.min(P.storeys.length,Math.max(1,Math.ceil((1-t)*P.storeys.length+0.01))); steps.querySelectorAll('li').forEach(li=>li.classList.toggle('on',rm||+li.dataset.st<=on)); };
  if(!rm) host.classList.add('scr'); tick(); onScroll(tick); window.addEventListener('resize',()=>{ last=-1; tick(); }); }

function css(){ if(document.getElementById('l3-css')) return; const s=document.createElement('style'); s.id='l3-css'; s.textContent=`
 #f1.f1-l3{background:#fff;overflow-x:hidden} .l3{font-family:var(--bd-font);color:${INK};font-size:16px;line-height:1.5;-webkit-font-smoothing:antialiased}
 .l3 ::selection{background:#D5DCEA;color:${INK}} .l3 :focus-visible{outline:2px solid ${INK};outline-offset:3px;border-radius:4px}
 .l3-head{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:28px;padding:14px clamp(16px,4vw,56px);background:rgba(255,255,255,.94);border-bottom:1px solid #EDF0F5}
 .l3-brand{font-weight:600;font-size:17px;color:${INK};text-decoration:none;margin-right:auto} .l3-head nav{display:flex;gap:22px} .l3-head nav a{color:${INK2};text-decoration:none;font-size:15px} .l3-head nav a:hover{color:${INK}}
 .l3-cta{font:inherit;font-weight:600;font-size:16px;background:${INK};color:#fff;border:0;border-radius:999px;padding:12px 22px;cursor:pointer;transition:background .2s} .l3-cta:hover{background:#2E3D63} .l3-cta.s{font-size:14px;padding:8px 16px}
 .l3-ghost{font:inherit;font-size:16px;background:none;border:1.5px solid ${INK};color:${INK};border-radius:999px;padding:10.5px 20px;cursor:pointer} .l3-ghost:hover{background:#F4F6FA}
 .l3-acts{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px} .l3-lead{font-size:clamp(17px,1.5vw,20px);color:${INK2};max-width:62ch;margin:18px 0 0}
 .l3 h1{font-weight:600;letter-spacing:-0.025em;line-height:1.04;margin:0;text-wrap:balance} .l3 h2{font-weight:600;letter-spacing:-0.015em;font-size:clamp(24px,2.4vw,32px);line-height:1.15;margin:0 0 20px;text-wrap:balance}
 .l3-fit{margin:26px 0 0;font-size:15px;color:${INK2};max-width:44ch} .l3-fit b{color:${INK};font-weight:600;font-size:17px} .l3-fit span{color:#5E6782;font-size:13px}
 .l3-ways{padding:clamp(40px,6vw,80px) clamp(16px,4vw,56px) 0;max-width:1320px;margin:0 auto;border-top:1px solid #D9DDE3} .l3-ways h2{font-size:clamp(22px,2.4vw,30px);font-weight:600;margin:0 0 10px;color:#1E2A47} .l3-ways-sub{color:#4A5672;max-width:640px;margin:0 0 28px}
 .l3-ways-g{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px} .l3-ways-g article{border:1px solid #D9DDE3;border-radius:8px;display:flex;flex-direction:column;overflow:hidden} .l3-ways-g h3{font-size:20px;margin:18px 20px 8px;color:#1E2A47} .l3-ways-g p{margin:0 20px 20px;color:#4A5672;line-height:1.5;flex:1} .l3-ways-g .l3-a{margin:0 20px 22px;align-self:flex-start}
 .l3-ways-g .l3-a{background:#1E2A47;color:#fff;border:0;border-radius:22px;padding:11px 22px;text-decoration:none;font-weight:600;cursor:pointer} .l3-ways-g .l3-a:hover{background:#3D5185}
 .l3-ways-th{height:250px;background:#F4F5F7;border-bottom:1px solid #E4E7EC;padding:10px;box-sizing:border-box} .l3-ways-f{margin:8px 12px;display:grid;grid-template-columns:1fr;gap:14px} .l3-ways-f dt{font-size:24px;font-weight:600;color:#1E2A47;white-space:nowrap} .l3-ways-f dd{margin:2px 0 0;font-size:13px;color:#4A5672}
 @media (max-width:900px){ .l3-ways-g{grid-template-columns:1fr} }
 .l3-roles,.l3-typ,.l3-dec{padding:clamp(56px,8vw,112px) clamp(16px,4vw,56px) 0;max-width:1320px;margin:0 auto}
 .l3-roles ul{list-style:none;margin:0;padding:0;border-top:1.5px solid ${INK}} .l3-roles li{display:grid;grid-template-columns:200px 1fr auto;gap:24px;align-items:baseline;padding:20px 0;border-bottom:1px solid ${RULE}} .l3-roles b{font-size:20px;font-weight:600} .l3-roles span{color:${INK2}}
 .l3-a{font:inherit;font-size:15px;background:none;border:0;color:${INK};text-decoration:underline;text-underline-offset:3px;cursor:pointer}
 .l3-typ ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-top:1px solid ${RULE}} .l3-typ li{border-bottom:1px solid ${RULE}} .l3-typ button{font:inherit;font-size:17px;width:100%;text-align:left;background:none;border:0;padding:18px 12px 18px 0;cursor:pointer;color:${INK};display:flex;align-items:center;gap:12px} .l3-typ button:hover{color:#2E3D63} .l3-typ i{width:8px;height:20px;border-radius:2px;flex:none} .l3-typ img{flex:none;margin-left:-6px} .l3-typ span{margin-left:auto;font-size:13px;color:#5E6782}
 .l3-note{font-size:13px;color:#5E6782;margin:10px 0 0}
 .l3-dec{display:grid;grid-template-columns:1fr auto;gap:32px;align-items:end;padding-bottom:clamp(56px,8vw,112px)} .l3-dec p{color:${INK2};max-width:62ch;margin:0}
 .l3-foot{display:flex;justify-content:space-between;gap:24px;padding:28px clamp(16px,4vw,56px) 40px;border-top:1px solid ${RULE};font-size:13px;color:#5E6782} .l3-foot p{margin:0 0 6px;max-width:80ch} .l3-foot a{color:${INK}} .l3-foot summary{cursor:pointer;color:${INK}}
 .l3-lg{list-style:none;margin:10px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:4px 14px;font-size:13px;color:${INK2}} .l3-lg i{display:inline-block;width:11px;height:11px;border-radius:2px;margin-right:6px;vertical-align:-1px;box-shadow:inset 0 0 0 1px rgba(30,42,71,.45)}
 .l3-st{font:500 12.5px var(--bd-font);fill:${INK2}}
 /* a: the street */
 .l3a-walk{height:420vh;position:relative} .l3a-walk.rm{height:auto}
 .l3a-stick{position:sticky;top:64px;height:calc(100vh - 64px);display:grid;grid-template-rows:auto minmax(0,1fr) auto auto;overflow:hidden;background:linear-gradient(#fff 55%,#F4F6FA 100%)}
 .l3a-walk.rm .l3a-stick{position:static;height:auto}
 .l3a-now{grid-row:1;grid-column:1;align-self:end;margin:0;padding:0 clamp(16px,4vw,56px) 18px;font-weight:600;letter-spacing:-0.02em;font-size:clamp(30px,4.2vw,64px);line-height:1.05;color:${INK};opacity:0;transform:translateY(10px);transition:opacity .5s cubic-bezier(.16,1,.3,1),transform .5s cubic-bezier(.16,1,.3,1);pointer-events:none} .l3a-now.on{opacity:1;transform:none}
 .l3a-copy{grid-row:1;grid-column:1;display:grid;grid-template-columns:minmax(0,7fr) minmax(0,5fr);gap:clamp(24px,4vw,64px);align-items:end;padding:clamp(28px,6vh,72px) clamp(16px,4vw,56px) 8px;max-width:1440px;transition:opacity .2s}
 .l3a h1{font-size:clamp(38px,5.4vw,82px);max-width:15ch} .l3a-h2{font-size:clamp(28px,3.2vw,46px);max-width:18ch;margin:0} .l3a-side .l3-lead{margin:0} .l3a-side .l3-acts{margin-top:22px} .l3a-side .l3-fit{margin-top:18px}
 .l3a-track{overflow:hidden;min-height:180px;display:flex;align-items:flex-end} .l3a-walk.rm .l3a-track{overflow-x:auto} .l3a-track>div{will-change:transform;width:max-content;transition:transform .9s cubic-bezier(.16,1,.3,1)}
 .l3a-track rect{transition:opacity .5s cubic-bezier(.16,1,.3,1)}
 [data-focus="public"] rect[data-z]:not([data-z="public"]):not([data-z="circulation"]), [data-focus="clinic"] rect[data-z]:not([data-z="clinic"]), [data-focus="hall"] rect[data-z]:not([data-z="hall"]), [data-focus="back"] rect[data-z]:not([data-z="loading"]), [data-focus="front"] rect[data-z]{opacity:.28}
 [data-focus="public"] rect[data-nb], [data-focus="clinic"] rect[data-nb], [data-focus="hall"] rect[data-nb], [data-focus="front"] rect[data-nb]:not([data-nb="front"]), [data-focus="back"] rect[data-nb]:not([data-nb="back"]){opacity:.4}
 .l3a-caps{list-style:none;margin:14px clamp(16px,4vw,56px) 0;padding:0;display:grid;grid-template-columns:repeat(5,1fr);gap:18px} .l3a-caps li{font-size:14px;color:#5E6782;border-top:2px solid ${RULE};padding-top:10px;transition:color .35s,border-color .35s} .l3a-caps li b{display:block;font-size:16px;margin-bottom:2px}
 .l3a-caps li.on{color:${INK2};border-color:${INK}} .l3a-caps li.on b{color:${INK}} .l3a-src{margin:12px clamp(16px,4vw,56px) 18px;font-size:13px;color:#5E6782;max-width:100ch}
 /* b: the heat */
 .l3b-hero{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,6fr);gap:clamp(32px,5vw,80px);padding:clamp(48px,8vh,96px) clamp(16px,4vw,56px) 0;max-width:1320px;margin:0 auto;align-items:start}
 .l3b-copy{position:sticky;top:110px} .l3b h1{font-size:clamp(40px,5vw,76px);max-width:13ch} .l3b-case{font-size:14px;color:#5E6782;margin:6px 0 18px}
 .l3b-steps{list-style:none;margin:0;padding:0 0 0 34px;position:relative} .l3b-steps::before{content:'';position:absolute;left:9px;top:8px;bottom:8px;width:3px;background:#E2D8FA;border-radius:2px}
 .l3b-line{position:absolute;left:9px;top:8px;bottom:8px;width:3px;background:${HEAT};border-radius:2px;transform-origin:top;transform:scaleY(0)}
 .l3b-steps li{position:relative;padding:0 0 52px;opacity:.38;transform:translateY(12px);transition:opacity .6s cubic-bezier(.16,1,.3,1),transform .6s cubic-bezier(.16,1,.3,1)} .l3b-steps li.on{opacity:1;transform:none}
 .l3b-steps .d{position:absolute;left:-31px;top:6px;width:15px;height:15px;border-radius:50%;background:#fff;border:3px solid ${HEAT}} .l3b-steps b{display:block;font-size:17px;font-weight:600}
 .l3b-steps em{display:block;font-style:normal;font-weight:600;font-size:clamp(26px,3.6vw,52px);overflow-wrap:anywhere;letter-spacing:-0.02em;color:${HEAT};line-height:1.1;margin:6px 0 2px;font-variant-numeric:tabular-nums} .l3b-steps em.ink{color:${INK}} .l3b-steps .c{display:block;color:${INK2};max-width:46ch} .l3b-steps .s{display:block;font-size:13px;color:#5E6782;margin-top:4px}
 .l3b-ledger{border-top:1.5px solid ${INK};padding-top:22px;margin:8px 0 0} .l3b-ledger dl{margin:0;display:grid;gap:0} .l3b-ledger dl>div{display:grid;grid-template-columns:1fr auto;gap:16px;padding:12px 0;border-bottom:1px solid ${RULE}} .l3b-ledger dt{color:${INK2}} .l3b-ledger dd{margin:0;font-weight:600;font-size:20px;font-variant-numeric:tabular-nums} @media (max-width:560px){ .l3b-ledger dl>div{grid-template-columns:minmax(0,1fr);gap:2px} .l3b-ledger dd{overflow-wrap:anywhere} }
 .l3b-ledger p{color:${INK2};max-width:56ch} .l3b-ledger p.s{font-size:13px;color:#5E6782}
 /* c: the plan */
 .l3c-hero{height:auto;position:relative} .l3c-hero.scr{height:260vh} .l3c-stick{position:sticky;top:64px;height:calc(100vh - 64px);display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:clamp(24px,4vw,64px);align-items:center;padding:0 clamp(16px,4vw,56px);max-width:1440px;margin:0 auto}
 .l3c-hero.rm .l3c-stick{position:static;height:auto;padding-top:48px} .l3c h1{font-size:clamp(36px,4.4vw,68px);max-width:16ch}
 .l3c-fig{margin:0;align-self:stretch;display:flex;flex-direction:column;justify-content:center;min-height:0} .l3c-fig>div{flex:1;min-height:0;display:flex;align-items:center} .l3c-fig>div{justify-content:center} .l3c-fig svg{width:auto;max-width:100%;height:auto;max-height:calc(100vh - 290px)} .l3c-fig figcaption{font-size:13px;color:#5E6782;max-width:70ch}
 .l3c-fig figcaption{display:grid;grid-template-columns:1fr;gap:8px;max-width:none} .l3c-cl{max-width:75ch} .l3c-lgg{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:3px 14px} .f1m-lg svg{flex:none} .f1m-lg{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;color:${INK2}} @media (max-width:600px){ .l3c-fig figcaption{grid-template-columns:1fr} .l3c-lgg{grid-template-columns:1fr 1fr} }
 .l3c-steps{list-style:none;margin:28px 0 0;padding:0;border-top:1px solid ${RULE}} .l3c-steps li{display:grid;grid-template-columns:90px 1fr;gap:12px;padding:10px 0;border-bottom:1px solid ${RULE};color:#5E6782;transition:color .35s} .l3c-steps li.on{color:${INK2}} .l3c-steps li.on b{color:${INK}} .l3c-steps b{font-weight:600}
 @media (max-width:1340px){ .l3c-steps{display:none} .l3c-hero{height:auto} .l3c-stick{position:static;height:auto;grid-template-columns:1fr;padding-top:40px;padding-bottom:16px} .l3c-fig svg{max-height:70vh} }   /* ART-59: the hero stacks below 1340 px so the drawing's labels read 12 px or more */
 @media (max-width:900px){ .l3-head nav{display:none} .l3-roles li{grid-template-columns:1fr;gap:4px} .l3-typ ul{grid-template-columns:repeat(2,1fr)} .l3-dec{grid-template-columns:1fr} .l3-foot{flex-direction:column}
  .l3a-copy{grid-template-columns:1fr;gap:14px;padding-top:24px} .l3a-caps{grid-template-columns:1fr;gap:0;min-height:72px} .l3a-caps li{display:none;border:0} .l3a-caps li.on{display:block} .l3a-walk.rm .l3a-caps li{display:block;margin-bottom:10px} .l3a-src{font-size:12px}
  .l3b-hero{grid-template-columns:1fr} .l3b-copy{position:static}
  .l3c-steps{display:none} .l3c-hero{height:auto} .l3c-stick{position:static;height:auto;grid-template-columns:1fr;padding-top:40px;padding-bottom:16px} .l3c-fig svg{max-height:60vh} }
 @media (max-width:520px){ .l3-typ ul{grid-template-columns:1fr} .l3-head{gap:12px} .l3b-steps{padding-left:28px} .l3b-steps .d{left:-25px} .l3b-ledger dl>div{grid-template-columns:1fr} }
 @media (prefers-reduced-motion: reduce){ .l3 *{transition:none!important} }`; document.head.appendChild(s); }
BD.f1land3={html,after,on,which};
})();

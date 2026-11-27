 
(function(){
const BD=window.BD=window.BD||{};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const IMG='f1/l2/';
const ROLES=[
 ['resident','Resident','What is this building next to me?'],
 ['municipal','Municipal','Does it fit the rules?'],
 ['engineering','Power, heat and water','Where can its heat go?'],
 ['architecture','Architecture','What is the building?']];
 
const TYP=[
 ['emergency_hub','Hub','A refuge, a clinic and a day warming shelter, all on the data centre’s backup power.'],
 ['community_pool','Pool','A public 25 m pool and a gym at grade, heated by the data hall beside it.'],
 ['heat_cascade','Heat cascade','Data hall heat used hottest first: spa, then pool, then a greenhouse.'],
 ['warm_bath','Warm bath','A spa (hot pool, steam, sauna, cold plunge) and a warm therapy pool.'],
 ['shelter_laundry','Shelter + laundry','A day shelter for 16 guests and a laundry that serves them.'],
 ['food_hub','Food hub','A greenhouse and a community teaching kitchen with dining.'],
 ['conservatory','Conservatory','A one-storey display glasshouse (biome) with a small production house.'],
 ['aquaponics','Aquaponics','A recirculating fish hall that feeds a greenhouse.']];
const STEPS=[
 ['Pick a lot','Any zoned lot in Vancouver, or one of the Edmonton samples.'],
 ['See what fits','Tested building plans that fit the lot and its rules.'],
 ['See what it shares','Heat for neighbours, public rooms, noise and power limits.'],
 ['Take the report','Every figure with its source, or marked as not yet known.']];
const pic=(n,alt,cls)=>`<img class="${cls||''}" src="${IMG}${n}.png" srcset="${IMG}${n}.png 1x, ${IMG}${n}@2x.png 2x" alt="${esc(alt)}" loading="lazy" decoding="async">`;
function howSvg(){  
  const B=(x,y,t,h)=>`<g><rect x="${x}" y="${y}" width="104" height="30" rx="6" fill="#fff" stroke="${h?'var(--bd-heat)':'var(--bd-ink)'}" stroke-width="1.1"/><text x="${x+52}" y="${y+19.5}" text-anchor="middle" font-size="12.5" font-weight="500" fill="${h?'var(--bd-heat-dark)':'var(--bd-ink)'}">${t}</text></g>`;
  const L=(x1,y1,x2,y2)=>`<path d="M${x1} ${y1} C${(x1+x2)/2} ${y1} ${(x1+x2)/2} ${y2} ${x2} ${y2}" fill="none" stroke="var(--bd-ghost)" stroke-width="1"/>`;
  const lot=[0,30], zon=[0,120], size=[170,0], eq=[170,62], nb=[170,124], heat=[340,30], rules=[340,108], rep=[510,70];
  const r=(p)=>[p[0]+104,p[1]+15], l=(p)=>[p[0],p[1]+15];
  const links=[[lot,size],[lot,eq],[zon,eq],[zon,nb],[size,heat],[eq,heat],[eq,rules],[nb,rules],[heat,rep],[rules,rep]].map(([a,b])=>L(...r(a),...l(b))).join('');
  return `<svg class="f1l2-how" viewBox="-2 -2 620 160" role="img" aria-label="The logic in small: the lot and its zoning feed the size, the equipment and the neighbours; those feed the heat and the rules; both feed the report" font-family="var(--bd-font)">${links}${B(...lot,'Lot')}${B(...zon,'Zoning')}${B(...size,'Size')}${B(...eq,'Equipment')}${B(...nb,'Neighbours')}${B(...heat,'Heat',1)}${B(...rules,'Rules')}${B(...rep,'Report')}</svg>`; }

function html(){ return `<div class="f1l2">
 <header class="f1l2-head"><a class="f1l2-app" href="#" data-go="top">Beyond Data</a>
  <nav class="f1l2-nav" aria-label="Site"><a href="#f1-work">Roles</a><a href="#f1l2-typ">Typologies</a><a href="#f1l2-ex" data-l2ex>Example lots</a><a href="#f1l2-how">How it works</a><a href="#f1l2-find" data-l2findnav>Findings</a></nav></header>
 <section class="f1l2-hero"><div class="f1l2-hero-t"><h1>What could a data centre give the city around it?</h1>
   <p class="f1l2-lead">Test real lots in Vancouver and Edmonton. See what one building could share with its neighbours, and what the rules allow.</p>
   <div class="f1l2-acts"><button class="f1l2-btn" data-go="work">Pick a lot to test</button><button class="f1l2-btn sec" data-go="intro">Watch the intro</button></div></div>
  <figure class="f1l2-heroimg"><picture><source media="(max-width:700px)" srcset="${IMG}hero_v3_390.png 1x, ${IMG}hero_v3_390@2x.png 2x"><img src="${IMG}hero_v3.png" srcset="${IMG}hero_v3.png 1x, ${IMG}hero_v3@2x.png 2x" alt="An isometric drawing of one building on a city street: a data hall on the upper storeys, a pool at grade and a greenhouse on the roof, with heat pipes in violet between them"></picture>
   <figcaption>Illustration: one building on a corner lot. Heat from the data hall (violet) warms the pool and the roof greenhouse. Invented scene.</figcaption></figure></section>
 <section class="f1l2-band f1l2-steps"><div class="f1l2-in"><h2>How a test runs</h2><ol>${STEPS.map(([h,t],i)=>`<li><span class="n" aria-hidden="true">${i+1}</span><h3>${h}</h3><p>${t}</p></li>`).join('')}</ol></div></section>
 <section class="f1l2-sec" id="f1-work"><div class="f1l2-in"><h2>Start from your question</h2><p class="f1l2-sub">Four roles, one tool. Each role asks one question and ends in its own report.</p>
  <div class="f1l2-roles">${ROLES.map(([id,n,q])=>`<article class="f1l2-role">${pic('thumb_'+id+'_v3',`${n}: an isometric drawing of the question this role answers`,'f1l2-thumb')}<div class="b"><span class="k">${n}</span><h3>${q}</h3>
    <div class="r"><button class="f1l2-btn" data-start="${id}">Start as ${id==='engineering'?'engineering':n.toLowerCase().replace('architecture','architect')}</button><span class="m">Ends in a report</span></div></div></article>`).join('')}</div></div></section>
 <section class="f1l2-band" id="f1l2-typ"><div class="f1l2-in"><div class="f1l2-sh"><div><h2>Eight ways to share a building</h2><p class="f1l2-sub">Each typology pairs a data hall with a public program and is tested as a library of plan variants built for awkward lots: narrow, shallow, small, corner.</p></div><a href="#" class="f1l2-a" data-go="lib">Open the library</a></div>
  <div class="f1l2-typs">${TYP.map(([id,n,t])=>`<button type="button" class="f1l2-typ" data-l2typ="${id}"><img class="ax" src="${IMG}${id}_axo.svg" alt="" loading="lazy"><span class="h"><img class="ic" src="${IMG}i_${id}.svg" alt="" width="20" height="20">${n}</span><span class="t">${t}</span></button>`).join('')}</div>
  <p class="f1l2-note">Small massings are illustrative; the library shows each typology’s tested plans.</p></div></section>
 <section class="f1l2-sec" id="f1l2-ex" hidden><div class="f1l2-in"><h2>Example lots</h2><p class="f1l2-sub" data-l2exsub></p><div class="f1l2-exs" data-l2exs></div></div></section>
 <section class="f1l2-find" id="f1l2-find" data-l2find hidden><div class="f1l2-in"><h2 data-l2findh></h2><p data-l2findp></p><div class="r"><button class="f1l2-btn inv" data-go="lib">Open the library</button><span class="m" data-l2findm></span></div></div></section>
 <section class="f1l2-sec f1l2-howsec" id="f1l2-how"><div class="f1l2-in f1l2-how2"><div><h2>How it works</h2><p class="f1l2-sub">One logic runs under all four roles. Every number in it links to its source and its check status.</p><a href="#" class="f1l2-a" data-go="logic">Open the source breakdown</a>${BD.f1decides&&BD.f1decides.on()?` <a href="#" class="f1l2-a" data-go="decides" style="margin-left:18px">How each lot is laid out</a>`:''}</div><div class="f1l2-howw">${howSvg()}</div></div></section>
 <footer class="f1l2-foot"><div class="f1l2-in"><div><p>Beyond Data, ARCH 540, UBC School of Architecture and Landscape Architecture, 2026</p>
   <p>Data: City of Vancouver open data. Edmonton results are derived from licensed lot data (outlines simplified). Maker and operator figures are labelled as claims.</p>
   <details class="f1l2-lic"><summary>Sources and licences</summary><p>Contains information licensed under the Open Government Licence – Canada (Public Safety Canada, Canada Structures), the Open Government Licence – Vancouver and the Open Government Licence – City of Edmonton. Every figure in the tool names its own source; open the source breakdown to follow one back. <a class="f1l2-a" href="sources.html">The full list of sources and licences</a></p></details></div>
  <a href="#" class="f1l2-a" data-go="old">The earlier tool (archive)</a></div></footer></div>`; }

 
async function coverage(){ try{ const r=await fetch('data/coverage_public.json',{cache:'no-cache'}); if(!r.ok) return null; return await r.json(); }catch(e){ return null; } }
const n0=v=>Number(v).toLocaleString('en-CA');
const DT=s=>{ const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(s||''); if(!m) return ''; return `${+m[3]} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m[2]-1]} ${m[1]}`; };
const lotPic=()=>`<div class="f1l2-lotpic"><svg viewBox="0 0 120 88" aria-hidden="true"><defs><pattern id="f1l2-h" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="var(--bd-ghost)" stroke-width="0.6"/></pattern></defs><rect x="14" y="10" width="92" height="62" rx="8" fill="url(#f1l2-h)" stroke="var(--bd-ink)" stroke-width="2"/><line x1="8" y1="82" x2="112" y2="82" stroke="var(--bd-ink)" stroke-width="3"/></svg><span class="st">street</span></div>`;
async function after(L){
  L.querySelectorAll('a[href^="#f1l2-"]').forEach(a=>a.addEventListener('click',e=>{ e.preventDefault(); const s=L.querySelector(a.getAttribute('href')); if(s&&!s.hidden) s.scrollIntoView({behavior:'smooth'}); }));
  L.querySelectorAll('[data-l2typ]').forEach(b=>b.addEventListener('click',()=>{ if(BD.f1lib&&BD.f1lib.typology) (BD.f1lib.intro||BD.f1lib.typology)(b.dataset.l2typ); else if(BD.f1lib) BD.f1lib.open(); }));
  const C=await coverage(); if(!L.isConnected) return; if(!C){ L.querySelectorAll('[data-l2ex],[data-l2findnav]').forEach(a=>a.remove()); return; }    
  const v=C.van||{}, when=[C.round,DT(C.date)].filter(Boolean).join(', '), eng='';    
   
  const exs=[]; const VEX='63819485', vl=v.lots&&v.lots[VEX];
  if(vl&&vl.typologies){ const k=Object.keys(vl.typologies).length;
    exs.push(`<article class="f1l2-ex">${lotPic()}<div class="b"><h3>339 1st Ave E</h3><span class="m">Vancouver${vl.zone?', zone '+esc(vl.zone):''}</span><p class="f">${k} of ${TYP.length} typologies fit</p>${C.date?`<p class="m">Results as of ${DT(C.date)}.</p>`:''}<button type="button" class="f1l2-a" data-exlot="van|${VEX}">Open this lot (Architecture)</button></div></article>`); }
  const E=C.edm||{}; if(E.run&&Array.isArray(E.samples)) for(const s of E.samples.slice(0,1)){ if(s.fits==null) continue;
    exs.push(`<article class="f1l2-ex">${lotPic()}<div class="b"><h3>${esc(s.label||'Edmonton sample lot')}</h3><span class="m">Edmonton${s.zone?', zone '+esc(s.zone):''}</span><p class="f">${n0(s.fits)} of ${TYP.length} typologies fit</p><p class="m">Derived results from licensed lot data, outline simplified.</p></div></article>`); }
  if(exs.length){ L.querySelector('[data-l2exs]').innerHTML=exs.join(''); L.querySelector('[data-l2exsub]').textContent='A lot to start from. Fit counts come from the coverage data.'; L.querySelector('#f1l2-ex').hidden=false; }
  else { const a=L.querySelector('[data-l2ex]'); if(a) a.remove(); }
   
  if(Number.isFinite(v.lotsTested)&&Number.isFinite(v.lotsWithFit)&&v.lotsTested>0){
    const Z=Array.isArray(v.zones)&&v.zones.length?v.zones.map(String):null, zw=Z?(Z.length===1?Z[0]:Z.slice(0,-1).join(', ')+' and '+Z[Z.length-1]):'';    
    L.querySelector('[data-l2findh]').textContent=Z?`${n0(v.lotsWithFit)} of ${n0(v.lotsTested)} candidate lots in Vancouver’s ${zw} zones fit at least one typology.`:`${n0(v.lotsWithFit)} of ${n0(v.lotsTested)} Vancouver lots tested fit at least one typology.`;
    const Bs=v.base||{}, fin=k=>Number.isFinite(Bs[k]);    
    const how=fin('allowedLots')&&fin('notASite')&&fin('noSiteModel')&&fin('tested')&&Bs.allowedLots-Bs.notASite-Bs.noSiteModel===Bs.tested?`Of the ${n0(Bs.allowedLots)} lots in these zones where a data centre may be allowed with the City’s approval, ${n0(Bs.notASite)} were judged not a site and ${n0(Bs.noSiteModel)} could not be modelled; the other ${n0(Bs.tested)} were tested`:'';
    L.querySelector('[data-l2findp]').textContent=(how||(Z?'Tested':'Candidate lots with a site model, tested'))+' against the plans in the library so far. The library grows as more plans are tested, and shows each typology’s tested plans.';
    L.querySelector('[data-l2findm]').textContent=C.date?`Results as of ${DT(C.date)}.`:'';
    L.querySelector('[data-l2find]').hidden=false; }
  else { const a=L.querySelector('[data-l2findnav]'); if(a) a.remove(); } }    
function on(){ if(/[?&]landing1\b/.test(location.search)) return false;     return !!(BD.F1FLAGS&&BD.F1FLAGS.landing2)||/[?&]landing2\b/.test(location.search); }
BD.f1land2={html,after,on};
})();

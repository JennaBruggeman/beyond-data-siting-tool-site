 
(function(){
'use strict';
const BD=window.BD; const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const LOTS={van:{city:'van',tile:'1_1',id:'63819485',name:'Vancouver'},edm:{city:'edm',tile:'-1_1',id:'146402',name:'Edmonton'}};
const C=(chap,list)=>list.map(t=>({chap,t}));
 
BD.F1FLAGS=Object.assign({typoIntro:true  ,landing3:'c',heroAnim:true,arch8:true,engSimple:true,landing2:true,logicMap:true,paletteB:true,addons:false,engOld3d:false,introLive:false,archRecvCard:false,archLeftCard:false,archCompareCard:false},BD.F1FLAGS||{});            
const VARIANT=BD.F1FLAGS.addons?'Variant and add-ons':'Variant';
 
const TELLS={resident:'Find a data centre that already exists in your city. See what it is, who runs it and what’s inside it, and get a short report on the one near you.',
  municipal:'Whether a data centre is allowed on a lot: permitted, conditional or needs a rezoning. Also how much industrial land the city has, what the zoning envelope allows (height, floor area, yards on each edge, storeys and street frontage), the noise limits around the lot, and the approval process it would go through.',
  engineering:'How large a data centre fits on the lot, how it would be cooled, what backup power it needs and how loud it would be. Then how much heat it gives off, which nearby buildings could take that heat, and what electricity and water it draws. Last, what a shared energy district around it would cost and deliver.',
  architecture:'First, who and what is around the lot: people, public programs, buildings that need heat, ground and flood conditions, neighbours and views. Then what the lot allows. You pick one of 8 typologies, each pairing the data centre with a public program such as a pool, food hub or shelter. Each typology comes as pre-drawn variants. You choose a variant, and the tool fits it to the lot, sizing the data centre and rooms to the zoning envelope. It then checks the plan against the building and zoning rules, shows it in 3-D, and puts it in a report.'};
const ABOUT=[['What we believe','Data centres are city infrastructure. Their heat, land and power can serve the neighbourhood around them if they’re planned for it from the start.'],
  ['What it does','It tests real lots in Vancouver and Edmonton. For each lot, it shows whether a data centre is allowed, what fits inside today’s zoning envelope, which public program could share the building, and how far its waste heat could reach.']];
const ABOUT2=[['What it doesn’t do','It isn’t a design, an engineering study, a cost quote or an approval. Every figure is an estimate built from public data, and some of that data comes from elsewhere: national averages applied to one city; costs from Denmark and Ontario converted to local dollars; rules of thumb from UK and European studies. Every figure names its source, so you can see where it came from.']];
const GOALS=['To evolve the data centre as a building type, so it exchanges more with its local context: socially, through public programs that share the building, and systematically, through the heat, power and water it trades with the buildings around it.',
  'To test that on real lots: show where data centres can give back more than digital services, and say plainly where they can’t.'];
const TPL=[
 {id:'resident',name:'Resident',tier:'resident',tab:'resident',step:5,who:'For people who live near a data centre. Where data centres are, how one operates with the information there is, and a report on it.',img:'resident',
  cards:[...C('Find',['Find a data centre']),    ...C('The facility',['What it is','What’s inside','What it means next door']),...C('Report',['Report'])]},
 {id:'municipal',name:'Municipal',tier:null,tab:'municipal',step:3,who:'For planners and councillors. One parcel’s rules, one rule per card: limits, not designs.',img:'municipal',
  cards:[...C('Site',['Your parcel']),...C('Use',['Is a data centre allowed?','Industrial land']),...C('Building rules',['Height and floor area','Yards by edge','Noise limits around the lot','Storeys and street frontage']),...C('Process',['Approval process']),...C('Report',['Report'])]},
 {id:'engineering',name:'Power, heat and water',tier:'full',tab:'full',step:4,who:'For engineers and operators. What fits on the lot, the cooling and backup choices, and what it could exchange with the city.',img:'engineering',
  cards:[...C('Site',['Your parcel']),...C('Set-up',['What fits','Cooling','Backup power','Noise']),...C('Exchanges',['Heat offered','Who could take it','Electricity','Water']),...C('District',['Shared energy district']),...C('Report',['Report'])]},  
 {id:'architecture',name:'Architecture',tier:'arch',tab:'arch',step:2,who:'For architects. A data centre and public programs on one lot, laid out from a library and checked against the main code moves.',img:'architecture',
  cards:[...C('Site',['Your parcel','People nearby','Programs nearby',...(BD.F1FLAGS.archRecvCard?['Heat receivers nearby']:[]),'What the lot allows','Ground and flood','Neighbours and views']),
   ...C('Typology',['Pick a typology',VARIANT,'The governing principle','The numbers',...(BD.F1FLAGS.archLeftCard?['What’s left for neighbours']:[])]),
   ...C('Checks',['Rooms','Separations','Exits','Plant and site']),...C('Visualize',['Heat flow','Program diagram','Massing',...(BD.F1FLAGS.archCompareCard?['Compare']:[])]),...C('Report',['Report'])]}];
 
TPL.forEach(t=>t.chaps=[...new Set(t.cards.map(c=>c.chap))]);
const STEPNAME={2:'step 2 (Architecture cards)',3:'step 3 (Municipal cards)',4:'step 3 (Engineering cards)',5:'step 3 (Resident cards, after the facility inventory)'};

 
function howSvg(){  
  const N={lot:[60,80,'Lot'],zon:[60,190,'Zoning'],size:[230,45,'Size'],eq:[230,135,'Equipment'],nb:[230,225,'Neighbours'],heat:[400,80,'Heat'],rules:[400,190,'Rules'],rep:[570,135,'Report']};
  const E=[['lot','size'],['lot','eq'],['zon','eq'],['zon','nb'],['size','heat'],['eq','heat'],['eq','rules'],['nb','rules'],['heat','rep'],['rules','rep']], w=80, h=26;
  const path=([a,b])=>{ const [x1,y1]=N[a], [x2,y2]=N[b], sx=x1+w/2, ex=x2-w/2, mx=(sx+ex)/2; return `<path d="M${sx} ${y1}C${mx} ${y1} ${mx} ${y2} ${ex} ${y2}" fill="none" stroke="#A9ABAF" stroke-width="1"/>`; };
  return `<svg viewBox="0 0 630 270" role="img" aria-label="How the tool's logic runs: lot and zoning feed size, equipment and neighbours, which feed heat and rules, which feed the report">${E.map(path).join('')}${Object.values(N).map(([x,y,t])=>`<rect x="${x-w/2}" y="${y-h/2}" width="${w}" height="${h}" rx="3" fill="#fff" stroke="#16181B" stroke-width="1"/><text x="${x}" y="${y+4.5}" text-anchor="middle" font-size="12.5" fill="#16181B" font-family="IBM Plex Sans,system-ui,sans-serif">${t}</text>`).join('')}</svg>`; }
 
(function(){ const sync=()=>{ const app=document.querySelector('body > .app'); if(!app) return; const on=!!(document.getElementById('f1')||document.getElementById('f1v')||document.getElementById('f1l'));
    app.inert=on; if(on) app.setAttribute('aria-hidden','true'); else app.removeAttribute('aria-hidden'); app.style.visibility=on?'hidden':''; };
  const go=()=>{ new MutationObserver(sync).observe(document.body,{childList:true}); sync(); };
  if(document.body) go(); else document.addEventListener('DOMContentLoaded',go); })();
function landing(){ let L=document.getElementById('f1'); if(L) L.remove(); L=document.createElement('div'); L.id='f1';
  const L3=!!(BD.f1land3&&BD.f1land3.on()); if(L3) L.classList.add('f1-l3');    
  const L2=!L3&&!!(BD.f1land2&&BD.f1land2.on()); if(L2) L.classList.add('f1-l2');    
  L.innerHTML=L3?BD.f1land3.html():L2?BD.f1land2.html():`<div class="f1-wrap">
   <header class="f1-head"><a class="f1-app" href="#" data-go="top">Beyond Data</a><nav class="f1-nav" aria-label="Site"><a href="#f1-work">Templates</a><a href="#" data-go="typ">Typologies</a><a href="#" data-go="logic">Source breakdown</a><a href="#" data-go="lib">Library</a><a href="#" data-go="found">What the tool found</a></nav></header>
   <section class="f1-hero"><div><h1>What could a data centre give the city around it?</h1>
     <p class="f1-lead">Test real lots in Vancouver and Edmonton: what a data centre could share with its neighbours, and what stands in the way.</p>
     <div class="f1-acts"><button class="f1-btn" data-go="work">Choose a template</button><button class="f1-link" data-go="logic">Source breakdown</button><button class="f1-link quiet" data-go="intro">Watch the intro</button></div></div>
    <figure class="f1-heroimg"><img src="f1/img/hero.png" alt="339 1st Ave E, Vancouver, in the tool's 3-D view: the data centre's massing, cooling plant and generators among the neighbouring buildings"><figcaption class="f1-cap">339 1st Ave E, Vancouver. The tool's 3-D view: a data centre's massing, cooling plant and generators among its neighbours.</figcaption></figure></section>
   <section class="f1-about"><div class="f1-about-t"><h2>Beyond Data</h2><p>A thesis project, M.Arch, UBC School of Architecture and Landscape Architecture, 2027.</p></div>
    ${ABOUT.map(([h,t])=>`<div class="f1-about-r"><h3>${h}</h3><p>${t}</p></div>`).join('')}</section>
   <section id="f1-work"><div class="f1-sechead"><h2>How to use it, and what each template tells you</h2><span>Pick a template, then a lot, and follow the steps along the bottom. Each template ends in its own report.</span></div>
    ${TPL.map(t=>`<div class="f1-row"><h3>${t.name}</h3><div><p class="who">${esc(TELLS[t.id]||t.who)}</p><div class="ract"><button class="f1-btn" data-start="${t.id}">Start</button><button class="f1-link" data-see="${t.id}">See the workflow</button><button class="f1-link" data-logic="${t.tab}">Source breakdown →</button></div></div>
      <div class="meta">${t.cards.length} steps<br>report</div><img src="f1/img/${t.img}.png" alt="${t.name}: the tool's 3-D view of 339 1st Ave E, Vancouver" loading="lazy"></div>`).join('')}
    <div class="f1-typstrip"><span>8 typologies: data centres that share their building with the city</span><button data-go="typ">See the typologies →</button></div></section>
   <section class="f1-about">${ABOUT2.map(([h,t])=>`<div class="f1-about-r"><h3>${h}</h3><p>${t}</p></div>`).join('')}
    <div class="f1-about-r"><h3>The goals</h3><ol>${GOALS.map(g=>`<li>${g}</li>`).join('')}</ol></div></section>
   <section class="f1-ex" id="f1-ex" hidden><div class="f1-sechead"><h2>Example lots with a pre-drawn layout</h2><p>The Architecture template shows a building only where its layout was drawn and checked ahead of time. Open one of these lots.</p></div><ul class="f1-exlots" data-exlist></ul></section>
   <section class="f1-how" id="f1-how"><div><h2>How it works</h2><p>One logic runs under all four templates. Every number in it is tied to a source and a check status, so a reader can follow any figure back to where it came from.</p><button class="f1-link" data-go="logic">Open the source breakdown</button></div>${howSvg()}</section>
   <footer class="f1-foot"><span>Beyond Data · ARCH 540, UBC School of Architecture and Landscape Architecture · 2026</span><span>Data: City of Vancouver and City of Edmonton open data. Contains information licensed under the Open Government Licence – Canada (Public Safety Canada, Canada Structures), the Open Government Licence – Vancouver and the Open Government Licence – City of Edmonton. Maker and operator figures are labelled as claims.</span><a href="#" class="f1-old" data-go="old">Archive: the earlier tool</a></footer></div>`;
  document.body.appendChild(L); if(L3) BD.f1land3.after(L); else if(L2) BD.f1land2.after(L);
   
  try{ document.documentElement.lang='en-CA'; const hush=()=>{ const w=document.getElementById('welcome'); if(!w||!L.isConnected) return; w.setAttribute('inert',''); if(w.contains(document.activeElement)||document.activeElement===document.body) (L.querySelector('a,button')||L).focus({preventScroll:true}); }; hush(); setTimeout(hush,150); setTimeout(hush,800); }catch(e){}
   
  (async()=>{ const ul=L.querySelector('[data-exlist]'); if(!ul) return; let html='';
    for(const city of ['van','edm']){ const PD=await predrawn(city); for(const [id,e] of Object.entries(PD)) html+=`<li><button type="button" data-exlot="${esc(city+'|'+id)}">${esc(e.addr||id)}, ${city==='van'?'Vancouver':'Edmonton'}</button> <span>${esc((e.typologies||[]).map(TYPNAME).join(', '))}</span></li>`; }
    if(html){ ul.innerHTML=html; L.querySelector('#f1-ex').hidden=false; } })();
  L.addEventListener('click',e=>{ const g=e.target.closest('[data-go],[data-start],[data-see],[data-logic]'); if(!g) return;
    if(g.dataset.logic){ e.preventDefault(); if(BD.f1logic) BD.f1logic.open({tab:g.dataset.logic}); return; }  
    if(g.dataset.go==='lib'){ e.preventDefault(); if(BD.f1lib) BD.f1lib.open(); return; }  
    if(g.dataset.go==='found'){ e.preventDefault(); if(BD.f1found) BD.f1found.open(); return; }  
    if(g.dataset.go==='typ'){ e.preventDefault(); if(BD.f1typ) BD.f1typ.open('lib'); return; }  
    if(g.dataset.go==='intro'){ e.preventDefault(); if(BD.f1intro) BD.f1intro.play(); return; }  
    if(g.dataset.go==='old'){ e.preventDefault(); L.remove(); const w=document.getElementById('welcome'); if(w) w.removeAttribute('inert'); return; }
    if(g.dataset.go==='logic'){ e.preventDefault(); if(BD.f1logicplain) BD.f1logicplain.open(); else if(BD.f1logic) BD.f1logic.open({tab:'all'}); return; }    
    if(g.dataset.go==='dcmap'){ e.preventDefault(); if(BD.f1dcpage) BD.f1dcpage.open('van'); return; }    
    if(g.dataset.go==='decides'){ e.preventDefault(); if(BD.f1decides) BD.f1decides.open(); return; }    
    if(g.dataset.go==='work'){ L.querySelector('#f1-work').scrollIntoView({behavior:'smooth'}); return; }
    if(g.dataset.go==='top'){ e.preventDefault(); L.scrollTo({top:0,behavior:'smooth'}); return; }
    if(g.dataset.start){ const t=TPL.find(x=>x.id===g.dataset.start); if(!t) return;  
      viewer(t.id,{pick:true}); return; }
    if(g.dataset.see) viewer(g.dataset.see); });
  L.querySelectorAll('a[href^="#f1-"]').forEach(a=>a.addEventListener('click',e=>{ e.preventDefault(); const s=L.querySelector(a.getAttribute('href')); if(s) s.scrollIntoView({behavior:'smooth'}); }));
  if(BD.f1intro) BD.f1intro.first();   }

 
 
const DNM={'Pick a plan':'Pick a layout','Available plans':'Available layouts','Site at a glance':'Around the lot','On the site':'On the lot'}, DN=t=>DNM[t]||t;
const V={t:null,i:0,city:'van',where:'',own:null,pick:false,pcity:'van',hits:[]};    
let LLT=0; async function loadLot(city){ const S=V.own||LOTS[city], tk=++LLT; V.where='…'; V.ready=false; draw();
  try{ if(BD.S.city!==city&&BD.setCity) await BD.setCity(city,true); await BD.select({city:S.city,tile:S.tile,id:S.id,quiet:true}); if(tk!==LLT) return;     try{ if(BD.f1best&&BD.f1best.onLot) BD.f1best.onLot(BD.S.sel); }catch(e){ console.warn('layout',e); }     BD.modelReset(); const M=BD.model(), a=BD.S.sel&&BD.S.sel.a;
    V.where=[a&&a[0]?titleCase(a[0]):S.id, M&&M.Z&&(M.Z.zone||M.Z.key)].filter(Boolean).join(' · '); V.addr=a&&a[0]?titleCase(a[0]):S.id; }
  catch(e){ V.where=S.id+' (lot not loaded: '+String(e.message||e).slice(0,60)+')'; }
  V.ready=true; draw(); }
const titleCase=s=>String(s).toLowerCase().replace(/\b([a-z])/g,c=>c.toUpperCase()).replace(/\b(\d+)(St|Nd|Rd|Th)\b/g,(m,n,x)=>n+x.toLowerCase()).replace(/\b(Nw|Ne|Sw|Se)\b/g,m=>m.toUpperCase());
function viewer(id,opt){ if(id==='resident'||id==='municipal'){ if(id==='resident'&&BD.f1dcpage) BD.f1dcpage.open('van'); return; }    
  V.t=TPL.find(x=>x.id===id); if(id==='architecture'&&BD.f1arch2&&BD.f1arch2.on()&&BD.f1arch2.install()){ V.t=Object.assign({},V.t,{cards:BD.f1arch2.swap(V.t.cards)}); }     if(id==='engineering'&&BD.f1eng2&&BD.f1eng2.on()&&BD.f1eng2.install()){ BD.f1eng2.css(); V.t=Object.assign({},V.t,{cards:BD.f1eng2.LIST.flatMap(([h,l])=>C(h,l)),chaps:BD.f1eng2.LIST.map(([h])=>h)}); }     V.i=0; V.pick=!!(opt&&opt.pick); V.own=null; V.hits=[]; V.cand=null; V.ready=false; let W=document.getElementById('f1v'); if(!W){ W=document.createElement('div'); W.id='f1v'; W.setAttribute('role','dialog'); W.setAttribute('aria-modal','true'); document.body.appendChild(W);
    W.addEventListener('click',e=>{ const fg=e.target.closest('[data-fig]'); if(fg&&BD.f1logic){ const c=V.t.cards[V.i], k=fg.dataset.k||'', ids=k?[k]:(BD.f1logic.figIds?BD.f1logic.figIds(c.t,V.t.tab,fg.dataset.fig||''):BD.f1logic.cardIds(c.t,V.t.tab));
        BD.f1logic.open({tab:V.t.tab,label:c.t+' · '+(fg.dataset.fig||''),ids,lot:V.where,sel:k||(ids.length===1?ids[0]:null),val:(fg.querySelector('.v')||fg).innerText.replace(/\s+/g,' ').trim()}); return; }  
      const b=e.target.closest('button'); if(!b) return; const d=b.dataset;
      if(d.x!=null){ W.remove(); return; } if(d.how){ const c=V.t.cards[V.i]; if(BD.f1logic) BD.f1logic.open(d.how==='all'?{tab:V.t.tab}:{tab:V.t.tab,label:c.t,ids:BD.f1logic.cardIds(c.t,V.t.tab),lot:V.where}); return; } if(d.city){ if(d.city!==V.city){ V.city=d.city; loadLot(V.city); } return; }
      if(d.relot!=null){ V.pick=true; V.hits=[]; V.cand=null; V.pcity=V.city; draw(); return; } if(d.pcity){ V.pcity=d.pcity; V.hits=[]; V.cand=null; if(V.t.id==='resident'){ V.city=d.pcity; V.pick=false; V.own=null; V.i=0; draw(); loadLot(V.city); return; } draw(); return; }    
      if(d.hit!=null){ const h=V.hits[+d.hit]; if(!h) return; candidate({city:V.pcity,tile:h[1],id:String(h[2]),label:h[0]},true); return; }    
      if(d.usecand!=null){ const c=V.cand; if(!c) return; V.own={city:c.city,tile:c.tile,id:c.id,label:c.label}; V.city=c.city; V.pick=false; V.i=Math.min(V.i||0,V.t.cards.length-1); draw();     loadLot(V.city); return; }
      if(d.to!=null){ V.i=+d.to; draw(); return; } if(d.chap!=null){ V.i=V.t.cards.findIndex(c=>c.chap===d.chap); draw(); return; }
      if(d.step==='back'&&V.i>0){ V.i--; draw(); } if(d.step==='next'&&V.i<V.t.cards.length-1){ V.i++; draw(); } });
    document.addEventListener('keydown',e=>{ if(!document.getElementById('f1v')) return; if(document.getElementById('f1l')) return;    
      if(e.key==='Escape') document.getElementById('f1v').remove(); if(e.key==='ArrowRight'&&V.i<V.t.cards.length-1){ V.i++; draw(); } if(e.key==='ArrowLeft'&&V.i>0){ V.i--; draw(); } }); }
  draw(); if(!V.pick&&!(opt&&opt.noLoad)) loadLot(V.city); }    
 
function pickHtml(){ if(V.t.id==='resident') return `<div class="f1v-pick"><h2>Choose a city</h2><p class="lead">Resident: pick the city to see every data centre on record there, then find one.</p>
  <div class="f1v-city" role="group" aria-label="City">${Object.values(LOTS).map(l=>`<button data-pcity="${l.city}">${l.name}</button>`).join('')}</div></div>`;
  return `<div class="f1v-pick f1v-pickmap"><div class="f1v-pickcol"><h2>Choose a lot</h2><p class="lead">${esc(V.t.name)}: pick the city, then type an address or click a lot on the map. The cards then run on that lot.</p>
  <div class="f1v-city" role="group" aria-label="City">${Object.values(LOTS).map(l=>`<button data-pcity="${l.city}" aria-pressed="${l.city===V.pcity}">${l.name}</button>`).join('')}</div>
  <input id="f1pick-q" type="search" placeholder="${V.pcity==='van'?'e.g. 339 1st Ave E':'e.g. 64 Airport Rd NW'}" autocomplete="off" aria-label="Address">
  <ul class="f1v-hits" role="listbox">${V.hits.map((h,k)=>`<li><button data-hit="${k}">${esc(h[0])}</button></li>`).join('')}</ul>
  <p class="sub" id="f1pick-near"${V.near?'':' hidden'}>No exact match in the City’s records; nearest on that street.</p>
  <div class="f1v-cand" id="f1pick-sel" hidden></div>${V.own?'':`<p class="sub">Or see the cards on an example lot: close this and open one under “Example lots” on the first page.</p>`}</div>
  <figure class="f1v-pickfig"><div id="f1pick-map"><p class="sub">Loading the map…</p></div><figcaption class="sub">Shaded: zones where a data centre can be built. Zoom in to see lot lines${window.BD_PUBLIC&&V.pcity==='edm'?' (Edmonton lot outlines are not open data here: use the address search)':''}; click a lot to pick it.</figcaption></figure></div>`; }
 
async function pickMap(W){ const box=W.querySelector('#f1pick-map'); if(!box) return; const city=V.pcity, tok=V.ptok=(V.ptok||0)+1, C=BD.f1cards;
  try{ if(BD.S.city!==city&&BD.setCity) await BD.setCity(city,true); }catch(e){} const m=BD.S.meta&&BD.S.meta[city]; if(tok!==V.ptok) return;
  if(!m||!C||!BD.f1map){ box.innerHTML='<p class="sub">The map could not be loaded; use the address search.</p>'; return; }
  const e=m.ext, bb=[e[0],e[1],e[2],e[3]], WD=620, HT=620, f=C.frame(bb,WD,HT,8), st=await BD.streets(city); if(tok!==V.ptok) return;
  const zk=z=>city==='van'?String(z||'').trim():String(z||'').trim().split(/\s+/)[0].toUpperCase(); let on='', sd='';
  for(const o of m.ovRaw||[]) if(C.allowed(city,zk(m.zones[o.zi]))) on+=C.pathOf([o.r],f.P);
  if(st) for(const g of st.segs){ let d=''; for(let i=2;i+1<g.length;i+=2){ const [a,b]=f.P(g[i],g[i+1]); d+=(i>2?'L':'M')+a.toFixed(1)+' '+b.toFixed(1); } sd+=d; }
  box.innerHTML=`<svg viewBox="0 0 ${WD} ${HT}" width="${WD}" height="${HT}" data-map data-map-pick data-map-city="${city}" data-map-bb="${bb.join(',')}" data-map-frame="${WD},${HT},8" data-map-max="60" role="img" aria-label="${city==='van'?'Vancouver':'Edmonton'}: zones where a data centre can be built; click a lot to pick it"><rect width="${WD}" height="${HT}" fill="${C.K.ground}"/><path d="${sd}" fill="none" stroke="${C.K.rule}" stroke-width="0.5" pointer-events="none"/><path d="${on}" fill="${C.K.dc}" fill-opacity="0.55" stroke="none" pointer-events="none"/></svg>`;
  const svg=box.querySelector('svg'); BD.f1map.enhance(box);
  svg.addEventListener('f1m-lot',ev=>{ const d=ev.detail||{}; if(d.none){ candMsg('No lot outline there.'); return; } if(!d.a){ candMsg('That outline has no City property record; try another lot or the address search.'); return; } candidate({city,tile:d.tile,id:d.id,label:d.a&&d.a[0]?titleCase(d.a[0]):('lot '+d.id),a:d.a,ring:d.ring},false); });
  if(V.cand&&V.cand.city===city) candidate(V.cand,true); }
const candMsg=t=>{ const el=document.getElementById('f1pick-sel'); if(el){ el.hidden=false; el.innerHTML=`<p class="sub">${esc(t)}</p>`; } };
 
async function candidate(c,zoom){ V.cand=c; const W=document.getElementById('f1v'), svg=W&&W.querySelector('#f1pick-map svg');
  let rings=c.ring?[c.ring]:null, a=c.a;
  if(!rings||!a){ try{ const T=await BD.loadTile(c.city,c.tile); a=a||(T&&T.A&&T.A[c.id]); const R=[]; for(const k in BD.S.tiles){ if(!k.startsWith(c.city+':')) continue;
      for(const p of BD.S.tiles[k].par||[]) if(String(p.id)===c.id||(p.ids&&p.ids.map(String).includes(c.id))) R.push(p.r); } if(R.length&&!rings) rings=R; }catch(e){} }
  if(V.cand!==c) return; c.ring=rings&&rings[0]; c.a=a;
  if(svg&&BD.f1map){ BD.f1map.mark(svg,rings||[]); if(zoom&&rings){ const b=[Infinity,Infinity,-Infinity,-Infinity]; for(const r of rings) for(let i=0;i<r.length;i+=2){ b[0]=Math.min(b[0],r[i]); b[1]=Math.min(b[1],r[i+1]); b[2]=Math.max(b[2],r[i]); b[3]=Math.max(b[3],r[i+1]); }
      const pad=Math.max(60,0.6*Math.max(b[2]-b[0],b[3]-b[1])); BD.f1map.zoomTo(svg,[b[0]-pad,b[1]-pad,b[2]+pad,b[3]+pad],0.9); } }
  const zone=a?BD.f1cards.zoneKey(c.city,a):'', ok=zone&&BD.f1cards.allowed(c.city,zone), el=document.getElementById('f1pick-sel'); if(!el) return; el.hidden=false;
  el.innerHTML=`<div class="lb">Selected</div><b>${esc(titleCase(c.label))}</b><p class="sub">${zone?`Zone ${esc(zone)} · ${ok?'a data centre may be allowed in this zone, outright or with the City’s approval':'a data centre needs a rezoning here'}`:'zone not in the City’s record'}${rings?'':' · outline not in this version'}</p><button class="f1-btn" data-usecand>Open the cards on this lot</button>`; }
function wirePick(W){ const q=W.querySelector('#f1pick-q'); if(!q) return; q.focus(); let tm=null; pickMap(W);
  q.addEventListener('keydown',e=>{ if(e.key!=='Enter') return; e.preventDefault(); const h=W.querySelector('.f1v-hits [data-hit]'); if(h) h.click(); });    
  q.addEventListener('input',()=>{ clearTimeout(tm); tm=setTimeout(async()=>{ const v=q.value.trim(); if(v.length<3||!BD.addrHits) return; const r=await BD.addrHits(V.pcity,v); V.hits=r.hits||[]; V.near=!!r.near;
    const nn=W.querySelector('#f1pick-near'); if(nn) nn.hidden=!(V.near&&V.hits.length);    
    const ul=W.querySelector('.f1v-hits'); if(ul) ul.innerHTML=V.hits.length?V.hits.map((h,k)=>`<li><button data-hit="${k}">${esc(h[0])}</button></li>`).join(''):`<li class="sub">No match in ${V.pcity==='van'?'Vancouver':'Edmonton'}: try the number and street.</li>`; },180); }); }
 
function resWhere(){ const cn=(LOTS[V.city]||{}).name||'', pk=BD.f1res&&BD.f1res.pick&&BD.f1res.pick[V.city], f=pk&&((BD.data.facilities||{})[V.city]||[]).find(g=>g.id===pk);
  return `<button class="f1v-cityname" data-to="0" title="Change the city: back to Find">${esc(cn)}</button>${f&&V.i>=1?' / '+esc(f.name):''}`; }
function draw(){ const W=document.getElementById('f1v'); if(!W||!V.t) return;
  if(V.pick){ W.innerHTML=`<header class="f1v-head"><span class="f1-app">Beyond Data</span><span class="tpl">${V.t.name}</span><span class="f1v-where"></span><button class="f1v-x" data-x aria-label="Close">Close</button></header><div class="f1v-body">${pickHtml()}</div>`; wirePick(W); return; }
  const t=V.t, c=t.cards[V.i], n=t.cards.length, ci=t.chaps.indexOf(c.chap), spec=BD.f1cards&&BD.f1cards.get(t.id,c.t);
  W.innerHTML=`<header class="f1v-head"><span class="f1-app">Beyond Data</span><span class="tpl">${t.name}</span>
     <nav class="f1v-chap" aria-label="Chapters">${t.chaps.map((h,k)=>`<button data-chap="${esc(h)}" class="${k<ci?'past':k===ci?'now':''}"${k===ci?' aria-current="step"':''}>${esc(h)}</button>`).join('')}</nav>
     <span class="f1v-where">${t.id==='resident'?resWhere():V.addr?`<button class="f1v-cityname" data-to="0" title="Change the city: back to step 1">${esc((LOTS[V.city]||{}).name||'')}</button> / ${esc(V.addr)}`:esc(V.where)}</span>
     ${V.own&&t.id!=='resident'?`<button class="f1v-how" data-relot>Change lot</button>`:''}
     <button class="f1v-how" data-how="all">Source breakdown</button><button class="f1v-x" data-x aria-label="Close the cards">Close</button></header>
   <div class="f1v-body"><main class="f1v-main"><div class="f1v-chips">${V.i===0&&!V.own?`<div class="f1v-city" role="group" aria-label="City">${Object.values(LOTS).map(l=>`<button data-city="${l.city}" aria-pressed="${l.city===V.city}">${l.name}</button>`).join('')}</div>`:''}${t.id==='resident'?'':spec?(V.own?'<span class="f1v-chip">Your lot</span>':`<span class="f1v-chip">${esc((spec.chip&&String(spec.chip).replace(/\s*·\s*rule sheet v[\d.]+/i,''))||('Example lot: '+(V.addr||V.where||'')+', '+((LOTS[V.city]||{}).name||'')))}</span><button class="f1v-how" data-relot>Use my own lot</button>`):'<span class="f1v-chip">Preview · not built yet</span>'}</div>
     <div class="f1v-draw">${spec?'<p class="f1v-empty">Drawing… (maps and plans can take a few seconds)</p>':''}${spec?'':`<p class="f1v-empty">This card’s drawing and figures are built in ${STEPNAME[t.step]} of the site build. It will read the example lot above and what the cards before it chose.</p>`}</div>
     <button class="f1v-how" data-how="card">This card in the source breakdown</button><details class="f1v-src"><summary>Sources and assumptions</summary><p>Nothing on this card yet. Every figure will come from the tool, with its source here, or show as a red “?”.</p></details></main>
    <aside class="f1v-panel"><div class="chap">${esc(c.chap)}</div><h2>${esc(DN(c.t))}</h2><div class="f1c-body">${spec?'':`<p class="lead">${t.name} · card ${V.i+1} of ${n}.</p>`}</div><div class="grow"></div>
     <div class="f1v-foot"><div class="f1v-nav"><button class="f1v-back" data-step="back"${V.i?'':' disabled'}>Back</button><button class="f1-btn" data-step="next"${V.i<n-1?'':' disabled'}>${V.i<n-1?'Next':'Last card'}</button></div><div class="f1v-no">${V.i+1} / ${n}</div></div></aside></div>
   <nav class="f1v-strip" aria-label="All cards">${t.cards.map((x,k)=>`<button data-to="${k}"${k===V.i?' aria-current="true"':''}><span class="n">${k+1}</span><span>${esc(DN(x.t))}</span></button>`).join('')}</nav>`;
  const cur=W.querySelector('.f1v-strip [aria-current="true"]'), sp=W.querySelector('.f1v-strip'); if(cur&&sp) sp.scrollLeft=Math.max(0,cur.offsetLeft-sp.clientWidth/2+cur.offsetWidth/2);  
   
  if(spec&&V.ready){ const tok=V.tok=(V.tok||0)+1, dr=W.querySelector('.f1v-draw'), pb=W.querySelector('.f1c-body'), se=W.querySelector('.f1v-src');
    Promise.resolve().then(async()=>{ const x=BD.f1cards.ctx(V.city);  
       
      if(window.BD_PUBLIC&&V.city==='edm'){ const need={municipal:['Yards by edge','Noise limits around the lot'],engineering:['What fits','Backup power','Noise','Heat offered','Who could take it','Water','What fits here','Cooling and water','When the power fails','Noise next door','Heat for the neighbours']}, ip=V.t.cards.findIndex(k=>k.t==='Pick a typology');
        if((need[V.t.id]||[]).includes(c.t)||(V.t.id==='architecture'&&ip>=0&&V.i>=ip&&c.t!=='Report')) return {lead:'Edmonton lot outlines aren’t published as open data (the City stopped in Nov 2021); shown in the full version.',
          draw:V.t.id==='architecture'?(window.BD_PUBLIC?'<p class="f1v-empty">Edmonton test fits: in the full version.</p>':'<p class="f1v-empty">The seven Edmonton test fits are shown as images, with their checked figures, on <a href="edm-test-fits.html">Edmonton test fits</a>.</p>')    :'', hero:[], rows:[], src:['City of Edmonton Open Data notice: “As of November 1st, 2021, the City will no longer provide datasets with land parcel boundary polygon geometry” (data.edmonton.ca, stt5-pzaa). See Sources and licences.'], noZoneFlag:true}; }
      if(await needsLayout(V)) return await noLayoutCard(V.city);    
      if(V.t.id==='architecture'&&BD.f1archNoFit&&V.i>(()=>{ const c=V.t.cards, i=c.findIndex(k=>k.t==='Pick a typology'); return i>=0?i:c.findIndex(k=>k.t==='Pick a plan'); })()){     let nf=await BD.f1archNoFit(x);
         
        if(nf){     let lb=null; try{ lb=BD.f1best?await BD.f1best.forLot(x):null; }catch(e){} if(lb&&lb.source!=='rough') nf=null; }
        if(nf&&V.t.cards[V.i].t==='Who approves it') nf=null;    
        if(nf) return nf;
        const es=BD.f1archEstimate&&await BD.f1archEstimate(x); if(es){ const r=await spec.build(x); if(r){ r.hero=(r.hero||[]).map(h=>Object.assign({},h,{v:h.u&&/MW/.test(h.u)&&/^[\d.]+$/.test(String(h.v))?(+h.v).toFixed(1):h.v,l:(h.l||'')+(es.basis&&es.basis.k==='borrowed'?' (borrowed, not checked here)':' (first pass, not checked)')}));     r.estimate=es; } return r; } }    
      const r0=await spec.build(x); if(r0&&window.BD_PUBLIC&&V.city==='van'&&['Heat receivers nearby','Who could take it'].includes(c.t)) r0.lead=(r0.lead||'')+' The full version also counts commercial and apartment buildings from a licensed assessment list.'; return r0; }).then(res=>{ if(tok!==V.tok||!res) return; BD.f1cardIndex=V.i; BD.f1cards.render(res,dr,pb,se,V.t.id); svgLabels(dr,c.t); svgMin(dr); trustTags(pb,c.t,V.t.tab,res); if(V.t.id==='architecture'&&/^(Rooms|Separations|Exits|Plant and site)$/.test(c.t)) planViews(dr);    
      if(V.t.id==='architecture'&&V.i>V.t.cards.findIndex(k=>k.t==='Pick a typology')&&c.t!=='Report') needsLayout(V).then(no=>{ if(!no) variantBadge(pb,V.city); });         W.dataset.built=c.t; })
      .catch(e=>{ if(tok!==V.tok) return; dr.innerHTML=`<p class="f1v-empty">This card isn’t available for this lot yet: some of the figures it needs are missing. The other cards still apply.</p>`; console.error('f1 card',c.t,e); }); } }

 
const PRE={};
async function predrawn(city){ if(PRE[city]) return PRE[city]; let L=null; try{ const j=await BD.getJSON(`data/predrawn_${city}.json`); L=j&&j.lots||null; }catch(e){}
  if(!L){ L={}; if(window.BD_PUBLIC&&city==='edm') return PRE[city]=L;     try{ const j=await BD.getJSON(`data/hub_frozen_${city}.json`); for(const [id,b] of Object.entries((j&&j.boards)||{})) L[id]={addr:b.addr,typologies:['emergency_hub']}; }catch(e){} }
  return PRE[city]=L; }
BD.f1predrawn=predrawn;
const TYPNAME=t=>({emergency_hub:'Emergency hub',community_pool:'Community pool',heat_cascade:'Heat cascade',warm_bath:'Warm bath',shelter_laundry:'Shelter + laundry',food_hub:'Food hub',conservatory:'Conservatory',aquaponics:'Aquaponics'})[t]||t;
async function noLayoutCard(city){ const PD=await predrawn(city), ids=Object.keys(PD), s=BD.S.sel, own=s&&PD[String(s.id)], typ=(BD.arch&&BD.arch.typology)||'emergency_hub';
  const list=ids.length?`<ul class="f1-exlots">${ids.map(id=>`<li><button type="button" data-exlot="${esc(city+'|'+id)}">${esc(PD[id].addr||id)}</button> <span>${esc((PD[id].typologies||[]).map(TYPNAME).join(', '))}</span></li>`).join('')}</ul>`:'<p class="f1v-empty">No pre-drawn layouts for this city yet.</p>';
  const lead=own?`This lot has a pre-drawn layout for ${(own.typologies||[]).map(TYPNAME).join(', ')} only, not for ${TYPNAME(typ)}. Pick that typology, or one of the example lots below.`
    :`Building layouts are pre-drawn for ${ids.length} example lot${ids.length===1?'':'s'}. This lot has no pre-drawn layout. The zoning envelope, the neighbours and the heat, noise and district analysis still work on any lot.`;
  return {noZoneFlag:true,lead,draw:`<div class="f1-nolay"><h3>Example lots with a pre-drawn layout</h3>${list}</div>`,hero:[],rows:[],src:['Pre-drawn layouts: the engine’s layouts, run offline, checked and frozen; the site does not lay a building out live (project decision, 19 Nov 2026).']}; }
async function needsLayout(V){ if(V.t.id!=='architecture') return false; const ip=V.t.cards.findIndex(k=>k.t==='Pick a typology'); if(ip<0||V.i<=ip) return false;
  const PD=await predrawn(V.city), s=BD.S.sel, own=s&&PD[String(s.id)], typ=(BD.arch&&BD.arch.typology)||'emergency_hub'; return !(own&&(own.typologies||[]).includes(typ)); }
 
async function tileOf(city,id,addr){ try{ const r=await BD.addrHits(city,addr||''); const h=(r.hits||[]).find(q=>String(q[2])===String(id)); if(h) return h[1]; }catch(e){}
  try{ const m=await BD.getJSON(`tiles/${city}/meta.json`); if(BD.S&&BD.S.meta&&!BD.S.meta[city]) BD.S.meta[city]=m;    
    const has=T=>T&&(T.par||[]).some(q=>String(q.id)===String(id)||(q.ids||[]).map(String).includes(String(id)));
    if(city==='edm'&&BD.f1edm&&BD.f1edm.outlines&&m.T){ try{ const O=await BD.f1edm.outlines(), F=O&&O.lots&&O.lots[String(id)]&&O.lots[String(id)].F;    
      if(F){ const i0=Math.floor(F.cx/m.T), j0=Math.floor(F.cy/m.T), set=new Set((m.tiles||[]).map(t=>t[0]+'_'+t[1]));
        for(const [di,dj] of [[0,0],[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]]){ const k=(i0+di)+'_'+(j0+dj); if(!set.has(k)) continue; let T0; try{ T0=await BD.loadTile(city,k); }catch(e){ continue; } if(has(T0)) return k; } } }catch(e){} }
    for(const t of m.tiles||[]){ const k=t[0]+'_'+t[1]; let T; try{ T=await BD.loadTile(city,k); }catch(e){ continue; } if(!T) continue; if((T.par||[]).some(q=>String(q.id)===String(id)||(q.ids||[]).map(String).includes(String(id)))) return k; } }catch(e){} return null; }
BD.f1openExample=async(city,id)=>{ const PD=await predrawn(city), e=PD[id]; if(!e) return; const tile=e.tile||await tileOf(city,id,e.addr); if(!tile) return; if(!document.getElementById('f1v')||V.t.id!=='architecture') viewer('architecture');
  V.own={city,tile,id:String(id),label:e.addr||id}; V.city=city; V.pick=false; draw(); loadLot(city); };
if(!window.__f1ex){ window.__f1ex=true; document.addEventListener('click',e=>{ const b=e.target.closest&&e.target.closest('[data-exlot]'); if(!b) return; e.preventDefault(); const [city,id]=b.dataset.exlot.split('|'); BD.f1openExample(city,id); }); }
 
const PROV=/(named,? not yet checked|not yet checked|named in our notes|behind (a )?sign-in|full text behind|read only via|formulae (only )?read|sources\/\d+|J\.B\.|upload(ed)? \d|our reading only|the assistant|TO_[a-z]|checks\/|CHECK \d|unreachable|source not opened)/i;
function pubSource(t){ t=String(t||''); const cut=t.split(/\s*‖\s*/)[0]; const um=cut.match(/https?:\/\/[^\s)]+/), url=um?um[0].replace(/[.,;]$/,''):null;
  let body=cut.replace(/\s*[—-]\s*https?:\/\/[^\s)]+/g,'').replace(/https?:\/\/[^\s)]+/g,'').replace(/\s*\((sources\/\d+[^)]*|J\.B\.[^)]*)\)/g,'');
  const parts=body.split(/\s+[—–]\s+|;\s+/).filter(x=>x&&!PROV.test(x)); body=parts.join('; ').replace(/\s+([,.;:])/g,'$1').replace(/[;,]\s*$/,'').trim();
  const ci=body.indexOf(': '); const cite=ci>0&&ci<220?body.slice(0,ci):body, use=ci>0&&ci<220?body.slice(ci+2):'';
  return {cite,use,url,full:body}; }
BD.f1pubSource=pubSource;
let OPPS=null, OPPI=null; const oppsIdx=async()=>{ if(OPPI) return OPPI; try{ OPPS=OPPS||await BD.getJSON('opps.json'); }catch(e){ OPPS={}; } const S=(OPPS&&OPPS.sources)||{}; OPPI=Object.values(S).map(t=>[String(t).replace(/\s+/g,' ').slice(0,90),String(t)]); return OPPI; };
async function pubLi(li){ if(li.dataset.pub) return; li.dataset.pub='1'; const kind=li.querySelector('.f1l-kind'), txt=li.textContent.replace(kind?kind.textContent:'','').replace(/\s*link\s*$/,'').replace(/\s+/g,' ').trim();
  const I=await oppsIdx(), hit=I.find(q=>txt.startsWith(q[0].slice(0,Math.min(90,txt.length-1)))||q[1].startsWith(txt.replace(/…$/,''))); const src=hit?hit[1]:txt.replace(/…$/,'');
  const P=pubSource(src); if(!P.cite) return; const short=P.cite+(P.use?`: ${P.use.length>140?P.use.slice(0,137)+'…':P.use}`:'');
  li.innerHTML=`${kind?kind.outerHTML:''}<details class="f1-pubsrc"><summary>${esc(short)}</summary><div>${esc(P.full)}</div></details>${P.url?` <a href="${esc(P.url)}" target="_blank" rel="noopener">link</a>`:''}`; }
if(!window.__f1pub){ window.__f1pub=true; const MO=new MutationObserver(()=>{ document.querySelectorAll('#f1l .f1l-src li:not([data-pub]), #f1v .f1v-src li:not([data-pub]), #f1f .f1f-src li:not([data-pub])').forEach(li=>{ if(PROV.test(li.textContent)||/…\s*(link)?\s*$/.test(li.textContent)||li.closest('#f1l')) pubLi(li); }); });
  MO.observe(document.body,{childList:true,subtree:true}); }
 
function planZoom(root){ if(!root||!BD.f1map) return; root.querySelectorAll('svg[viewBox]').forEach(sv=>{ if(sv.closest('.f1m-wrap')||sv.hasAttribute('data-map')) return; const vb=sv.viewBox.baseVal; if(!vb||vb.width<200) return;
    sv.style.minWidth=''; const sc=sv.parentElement; if(sc&&sc.classList.contains('f1-svgscroll')){ sc.parentNode.insertBefore(sv,sc); sc.remove(); }    
    sv.setAttribute('data-map',''); sv.setAttribute('data-map-max','8'); sv.setAttribute('data-map-detail',''); sv.removeAttribute('width'); sv.removeAttribute('height'); sv.classList.add('f1-pv-svg'); if(vb.height>vb.width*0.9) sv.style.maxHeight='calc(100vh - 150px)'; });    
  try{ BD.f1map.enhance(root); }catch(e){ console.warn('plan zoom',e); } }
function planLink(root){ if(!root||root._pvLink) return; root._pvLink=true; const num=t=>String(t||'').trim();
  const rowsFor=n=>[...root.querySelectorAll('.f1-pv-sch tr')].filter(tr=>tr.firstElementChild&&num(tr.firstElementChild.textContent)===n);
  const textsFor=n=>[...root.querySelectorAll('.f1-pv-svg text')].filter(t=>num(t.textContent)===n);
  const on=(n,v)=>{ rowsFor(n).forEach(r=>r.classList.toggle('f1-pv-hi',v)); textsFor(n).forEach(t=>t.classList.toggle('f1-pv-hi',v)); };
  root.addEventListener('mouseover',e=>{ const tr=e.target.closest&&e.target.closest('.f1-pv-sch tr'); const tx=e.target.closest&&e.target.closest('.f1-pv-svg text'); const n=tr&&tr.firstElementChild?num(tr.firstElementChild.textContent):tx?num(tx.textContent):null; if(n&&/^\d+$/.test(n)){ root.querySelectorAll('.f1-pv-hi').forEach(x=>x.classList.remove('f1-pv-hi')); on(n,true); } });
  root.addEventListener('mouseleave',()=>root.querySelectorAll('.f1-pv-hi').forEach(x=>x.classList.remove('f1-pv-hi')));
   
  root.addEventListener('click',e=>{ const tr=e.target.closest&&e.target.closest('.f1-pv-sch tr'); if(!tr||!tr.firstElementChild) return; const n=num(tr.firstElementChild.textContent); if(!/^\d+$/.test(n)) return;
    const t=textsFor(n).find(x=>{ const sv=x.closest('svg.f1-pv-svg'); return sv&&sv.getBoundingClientRect().width>0; }); if(!t||!BD.f1map||!BD.f1map.zoomBox) return; const sv=t.closest('svg.f1-pv-svg'), bb=t.getBBox();
    BD.f1map.zoomBox(sv,[bb.x-60,bb.y-60,bb.x+bb.width+60,bb.y+bb.height+60],0.8); root.querySelectorAll('.f1-pv-hi').forEach(x=>x.classList.remove('f1-pv-hi')); on(n,true); }); }
function planViews(dr){ const W=dr&&dr.querySelector('.f1c-checks-wrap'); if(!W||W.querySelector('.f1-pv')) return; const set=W.querySelector('.f1p-set'); if(!set) return;
  const schs=[...W.querySelectorAll('.f1c-checks-sch')], grid=document.createElement('div'); grid.className='f1-pv'; set.parentNode.insertBefore(grid,set); const left=document.createElement('div'); left.className='f1-pv-plan'; grid.appendChild(left); left.appendChild(set);
  if(schs.length){ const side=document.createElement('details'); side.className='f1-pv-sch'; side.open=true; side.innerHTML='<summary>Room schedule</summary>'; schs.forEach(s=>side.appendChild(s)); grid.appendChild(side); }
  planZoom(set); planLink(W); }
BD.f1planZoom=planZoom; BD.f1planLink=planLink;
 
if(!window.__f1mk){ window.__f1mk=true; let tip=null; const kill=()=>{ if(tip){ tip.remove(); tip=null; } };
  document.addEventListener('click',e=>{ const t=e.target; if(!t.closest||!t.closest('#f1v .f1v-draw svg, #f1lib svg, #f1f svg')) { kill(); return; }
    if(t.closest('button,a,[data-b],[data-a],[data-hit],[data-fac],[data-mk],[data-lot],[data-pk],.f1m-ctl,.f1m-hit')) return;
    let el=t; while(el&&el.tagName&&el.tagName.toLowerCase()!=='svg'&&!(el.querySelector&&[...el.children].some(c=>c.tagName&&c.tagName.toLowerCase()==='title'))) el=el.parentNode;
    const ti=el&&el.querySelector?[...el.children].find(c=>c.tagName&&c.tagName.toLowerCase()==='title'):null; kill(); if(!ti||!ti.textContent.trim()) return;
    tip=document.createElement('div'); tip.className='f1-marktip'; tip.setAttribute('role','status'); tip.textContent=ti.textContent.trim(); document.body.appendChild(tip);
    const x=Math.min(e.clientX+12,innerWidth-tip.offsetWidth-8), y=Math.min(e.clientY+12,innerHeight-tip.offsetHeight-8); tip.style.left=Math.max(8,x)+'px'; tip.style.top=Math.max(8,y)+'px'; },true);
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') kill(); }); document.addEventListener('scroll',kill,true); }
 
function variantNote(L){ const v=L&&L.variant; if(!v||!(v.flag||v.pilot)) return ''; const nm=v.name||(v.flag?String(v.flag):'this variant');
  return `${nm}: a ${v.pilot?'pilot':'flagged'} variant${v.flag?` (behind the setting ${v.flag})`:''}, not on by default. Its plan is shown here because it is the one that fits.`; }
BD.f1variantNote=variantNote;
async function variantBadge(pb,city){ try{ if(!pb||pb.querySelector('.f1-variant')||(pb.textContent||'').includes('isn’t laid out on this lot')) return; const x=BD.f1cards.ctx(city), P=x&&x.arch?await x.arch():null, V=P&&BD.f1cards.v1?BD.f1cards.v1(P):null, t=variantNote(V&&V.L);
  if(t) pb.insertAdjacentHTML('afterbegin',`<p class="f1-variant"><b>Variant</b> ${esc(t)}</p>`); }catch(e){} }
 
const PXMIN=12;
function svgMin(dr){ if(!dr) return; dr.querySelectorAll('svg').forEach(sv=>{ if(sv.parentElement.closest('svg')||sv.hasAttribute('data-map')||sv.getAttribute('aria-hidden')==='true') return;
  const vb=sv.viewBox&&sv.viewBox.baseVal; if(!vb||!vb.width) return; if(sv.dataset.minw0==null) sv.dataset.minw0=sv.style.minWidth||''; sv.style.minWidth=sv.dataset.minw0;
  const w=sv.getBoundingClientRect().width; if(!w) return; let k=w/vb.width, need=0;
  const T=[...sv.querySelectorAll('text,tspan')].filter(t=>!t.closest('[data-map-static],[data-legend],.f1c-key')&&(t.textContent||'').trim());
  T.forEach(t=>{ if(t.dataset.fs0==null) t.dataset.fs0=t.style.fontSize||''; t.style.fontSize=t.dataset.fs0; });
  const fs=T.map(t=>parseFloat(getComputedStyle(t).fontSize)||0).filter(Boolean); if(!fs.length) return; const mn=Math.min(...fs);
  if(mn*k>=PXMIN-0.05) return;
  if(k<0.7){ need=vb.width*(PXMIN/mn); if(!sv.parentElement.classList.contains('f1-svgscroll')){ const d=document.createElement('div'); d.className='f1-svgscroll'; sv.parentNode.insertBefore(d,sv); d.appendChild(sv); }
    sv.style.minWidth=Math.ceil(need)+'px'; k=PXMIN/mn; }
  T.forEach((t,i)=>{ const f=parseFloat(getComputedStyle(t).fontSize)||0; if(f&&f*k<PXMIN-0.05) t.style.fontSize=(PXMIN/k).toFixed(2)+'px'; }); }); }
BD.f1svgMin=svgMin;    
let SVGMT=null; window.addEventListener('resize',()=>{ clearTimeout(SVGMT); SVGMT=setTimeout(()=>{ const d=document.querySelector('#f1v .f1v-draw'); if(d) svgMin(d); },200); });
 
function svgLabels(dr,title){ if(!dr) return; dr.querySelectorAll('svg').forEach(sv=>{ if(sv.closest('button,a')||sv.parentElement.closest('svg')){ if(!sv.parentElement.closest('svg')) sv.setAttribute('aria-hidden','true'); return; }
  if(!sv.getAttribute('role')) sv.setAttribute('role','img'); if(!sv.getAttribute('aria-label')&&!sv.getAttribute('aria-labelledby')){ const t=sv.querySelector('title'), h=sv.querySelector('text');
    sv.setAttribute('aria-label',title+': '+((t&&t.textContent)||(h&&h.textContent)||'drawing').replace(/\s+/g,' ').trim().slice(0,120)); } }); }
 
const TRW=[[100,'arithmetic'],[90,'regulation read directly'],[80,'government data'],[70,'research, other context'],[60,'derived, stated assumption'],[50,'operator or industry claim'],[40,'proxy'],[20,'judgement'],[0,'gap']];
const trWord=q=>(TRW.find(w=>q>=w[0])||TRW[TRW.length-1]);
let TRL=null; const trLoad=()=>TRL||(TRL=fetch('logic.json').then(r=>r.json()).then(d=>d.nodes||{}).catch(()=>({})));
const CODEQ={GOV:80,OC:50,BRK:50,PR:50,ENG:50,DIR:40};
let TRN=null; const TAB={resident:'resident',municipal:'municipal',engineering:'full',architecture:'arch'};
 
function trustOf(tab,title,lab,txt,res){ const N=TRN||{}, k=null, F=((BD.f1logic&&BD.f1logic.FIG)||{})[tab], G=F&&F[title], hit=G&&G.f?G.f.find(([rx])=>rx.test(lab||'')):null;
  const gap=/^(?:not published|\?|none on record)$/i.test(txt||'')||/^(?:zone )?not (?:in the public data|published)\b/i.test(txt||''), given=res&&res.trust&&res.trust[lab];
  const codes=tab==='resident'?(String(txt||'').match(/\b(?:GOV|OC|BRK|PR|ENG|DIR)\b/g)||[]).map(c=>CODEQ[c]):[];
  const qs=hit?hit[1].map(i=>N[i]&&N[i].q).filter(q=>typeof q==='number'):[];
  const q=gap?0:given?given[0]:codes.length?Math.min(...codes):qs.length?Math.min(...qs):null; if(q==null) return null; const w=trWord(q);
  return [w[0],w[1],gap?'Not published: a gap.':given?given[1]:codes.length?'From the source labels in the text (GOV government record 80; OC operator, BRK broker, PR press release, ENG engineer’s sheet: claims, 50; DIR directory listing 40).':'The lowest of this figure’s inputs in the register.']; }
const trSpan=t=>t?`<span class="f1-tr" title="Confidence ${t[0]} of 100: ${t[1]}. ${esc(t[2])}">confidence ${t[0]} · ${t[1]}</span>`:'';
 
const TRFULL=`Confidence, 0–100, under each figure: never higher than its weakest input. ${TRW.map(w=>w[0]+' '+w[1]).join(' · ')}. A figure with no tag is not yet linked to its sources in the tool’s register.`;
const TRLEG=`<details class="f1-trl"><summary>What the confidence numbers mean</summary><p>${TRFULL}</p></details>`;
const TRLINE=`<p class="f1-trl">What the confidence numbers mean: see the Sources page.</p>`;
const trReady=async()=>{ if(!TRN) TRN=await trLoad(); return TRN; };
async function trustTags(pb,title,tab,res){ if(!pb) return; await trReady(); let n=0;
  pb.querySelectorAll('[data-fig]').forEach(el=>{ if(el.querySelector('.f1-tr')) return; const t=trustOf(tab,title,el.dataset.fig||'',el.innerText.replace(/\s+/g,' ').trim(),res); if(!t) return; n++; el.insertAdjacentHTML('beforeend',trSpan(t)); });
  if(n&&!pb.querySelector('.f1-trl')){ const dl=pb.querySelector('.f1c-rows')||pb.querySelector('.f1c-hero'); if(dl) dl.insertAdjacentHTML('beforebegin',TRLEG); } }
 
BD.f1trust={tags:trustTags,word:trWord,TRW,ready:trReady,TAB,LEG:`<p class="f1-trl">${TRFULL}</p>`,LINE:TRLINE,cell:(tpl,title,lab,txt,res)=>trSpan(trustOf(TAB[tpl]||tpl,title,lab,String(txt||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(),res))};

 
function boot(){ if(!BD||!BD.S||!BD.select) return setTimeout(boot,200); let skip=false; try{ skip=localStorage.getItem('bd-f1-skip')==='1'; }catch(e){}
  if(skip||/[?&]old\b/.test(location.search)||BD.S.sel) return; landing(); }
 
async function openLot(tpl,city,id,addr){ const tile=(LOTS[city]&&LOTS[city].id===String(id)?LOTS[city].tile:null)||await tileOf(city,id,addr); if(!tile) return false;     viewer(tpl,{noLoad:true}); V.own={city,tile,id:String(id),label:addr||id}; V.city=city; V.pick=false; draw(); await loadLot(city); return true; }
BD.f1={landing,viewer,openLot,TPL,redraw:()=>draw(),cur:()=>(document.getElementById('f1v')&&V.t)?V.t.id:null};    
boot();
})();

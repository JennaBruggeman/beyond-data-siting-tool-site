 
(function(){
'use strict';
const BD=window.BD; const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const K={ink:'#16181B',ink2:'#4A4D52',mute:'#7B7E83',faint:'#A9ABAF',rule:'#DDDEDF',hair:'#ECECEC',bg:'#FFFFFF',panel:'#FAFAFA',plant:'#E6E4E0',dc:'#3268A6',dcSup:'#A9C0DA',pub:'#B0802A',clin:'#22927A',neut:'#C9CACC',red:'#CC746C',
  fillHall:'#B9CCE1',fillSup:'#E2EAF3',fillPub:'#E7D9BF',fillClin:'#C1E0DA',ground:'#F4F3F0',bld:'#E9E8E5'};  
const REG={};
const add=(tpl,title,spec)=>{ (REG[tpl]=REG[tpl]||{})[title]=spec; };
const has=(tpl,title)=>!!(REG[tpl]&&REG[tpl][title]);
const n0=x=>x==null||!isFinite(x)?'?':Math.round(x).toLocaleString('en-CA');
const n1=x=>x==null||!isFinite(x)?'?':(Math.round(x*10)/10).toLocaleString('en-CA');
const titleCase=s=>String(s).toLowerCase().replace(/\b([a-z])/g,c=>c.toUpperCase()).replace(/\b(\d+)(St|Nd|Rd|Th)\b/g,(m,n,x)=>n+x.toLowerCase()).replace(/\b(Nw|Ne|Sw|Se|Bc|Ubc|Yvr|Ymca|Ywca)\b/g,m=>m.toUpperCase()).replace(/\(licensed property records (local only); Address Not Shown\)/g,'(licensed property records (local only); address not shown)');
 
const ZR=()=>(BD.data&&BD.data.raw&&BD.data.raw.zones)||{ZV:{},ZE:{}};
const zoneKey=(city,a)=>city==='van'?String(a[1]||'').trim():String(a[2]||a[1]||'').trim().split(/\s+/)[0].toUpperCase();
const allowed=(city,key)=>{ const r=(city==='van'?ZR().ZV:ZR().ZE)[key]; return !!r&&r.path!=='rezoning'; };  
const dcStatus=(city,key)=>{ const r=(city==='van'?ZR().ZV:ZR().ZE)[key]||{}, c=(r.cl||[]).find(x=>/data centre/i.test(x[0])), t=c?c[1]:''; return {word:r.path==='rezoning'?'rezoning needed':r.path==='permitted'?'permitted use':/discretionary/i.test(t)?'discretionary use':/conditional/i.test(t)?'conditional use':/permitted/i.test(t)?'permitted use':'?',clause:c?c[2]:'',text:t,src:r.src||[]}; };
 
function frame(bb,w,h,pad){ pad=pad||0; const sx=(w-2*pad)/(bb[2]-bb[0]), sy=(h-2*pad)/(bb[3]-bb[1]), s=Math.min(sx,sy), ox=pad+((w-2*pad)-(bb[2]-bb[0])*s)/2, oy=pad+((h-2*pad)-(bb[3]-bb[1])*s)/2;
  return {s,P:(x,y)=>[ox+(x-bb[0])*s, oy+(bb[3]-y)*s],I:(sx,sy)=>[bb[0]+(sx-ox)/s, bb[3]-(sy-oy)/s]}; }
function pathOf(rings,P){ let d=''; for(const r of rings){ for(let i=0;i<r.length;i+=2){ const [x,y]=P(r[i],r[i+1]); d+=(i?'L':'M')+x.toFixed(1)+' '+y.toFixed(1); } d+='Z'; } return d; }
function bbox(r){ let a=1e18,b=1e18,c=-1e18,d=-1e18; for(let i=0;i<r.length;i+=2){ a=Math.min(a,r[i]); b=Math.min(b,r[i+1]); c=Math.max(c,r[i]); d=Math.max(d,r[i+1]); } return [a,b,c,d]; }
const hit=(b,q)=>!(q[0]>b[2]||q[2]<b[0]||q[1]>b[3]||q[3]<b[1]);
function scaleBar(x,y,m,s,lab){ const L=m*s; return `<g font-family="IBM Plex Sans,system-ui,sans-serif" font-size="11" fill="${K.mute}"><rect x="${x}" y="${y}" width="${(L/2).toFixed(1)}" height="4" fill="${K.ink}"/><rect x="${(x+L/2).toFixed(1)}" y="${y}" width="${(L/2).toFixed(1)}" height="4" fill="#fff" stroke="${K.ink}" stroke-width="0.8"/><text x="${x}" y="${y+16}">0</text><text x="${(x+L).toFixed(1)}" y="${y+16}" text-anchor="end">${lab||m+' m'}</text><text x="${x}" y="${y-8}">N ↑</text></g>`; }
 
let CTXN=0;
function context(x,P,I,box,o){ o=o||{}; const [X,Y,W,H]=box, a=I(X,Y), b=I(X+W,Y+H), wb=[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])];
  const pth=r=>{ let d=''; for(let i=0;i<r.length;i+=2){ const [u,v]=P(r[i],r[i+1]); d+=(i?'L':'M')+u.toFixed(1)+' '+v.toFixed(1); } return d+'Z'; };
  let lots='', alw='', blds=''; const seen=new Set();
  for(const k in BD.S.tiles){ if(!k.startsWith(x.city+':')) continue; const t=BD.S.tiles[k];
    for(const p of t.par||[]){ const key=p.id+':'+p.r[0]; if(seen.has(key)) continue; seen.add(key); if(o.skip&&p.id===o.skip) continue; if(!hit(wb,p.bb||bbox(p.r))) continue;
      const ok=o.tint&&allowed(x.city,zoneKey(x.city,t.A[p.id]||[])); if(ok) alw+=pth(p.r); else lots+=pth(p.r); }
    for(const q of t.bld||[]){ if(!hit(wb,q.bb||bbox(q.r))) continue; blds+=pth(q.r); } }
  const id='f1c-ctx'+(++CTXN);
  return `<g class="f1c-ctx"><defs><clipPath id="${id}"><rect x="${X}" y="${Y}" width="${W}" height="${H}"/></clipPath></defs><g clip-path="url(#${id})"><rect x="${X}" y="${Y}" width="${W}" height="${H}" fill="${K.ground}"/>`+
    `<path d="${lots}" fill="#fff" stroke="${K.hair}" stroke-width="0.6"/>${alw?`<path d="${alw}" fill="${K.fillSup}" stroke="${K.dcSup}" stroke-width="0.6"/>`:''}<path d="${blds}" fill="${K.bld}" stroke="none"/></g></g>`; }
const CONTEXT_SRC=c=>`Site context (streets as the ground between lots, neighbouring lots and building footprints): ${c==='van'?'City of Vancouver property parcels and building footprints (open data)':(window.BD_PUBLIC?'City of Edmonton parcel points (open data; lot outlines are not in the public version) and building footprints':'City of Edmonton parcels as the tool shows them (lot outlines: licensed lot outlines (not published), academic use only) and building footprints')}, as the "Your parcel" card draws them.`;
 
function meter(m){ const max=m.max||(m.lim?m.lim/0.87:Math.max(1,m.v||1)), pct=x=>Math.max(0,Math.min(100,100*x/max)), pass=m.pass!==false, col=pass?K.ink:K.red;    
  return `<div class="f1c-m"><div class="t"><span>${esc(m.l)}</span><span style="color:${col}">${m.v==null?'<b class="f1c-q">?</b>':pass?(m.tight?'tight: check in design':'pass'):'to fix'}</span></div>
   <div class="trk">${m.v==null?'':`<div class="bar" style="width:${pct(m.v)}%;background:${col}"></div>`}${m.lim!=null?`<i style="left:${pct(m.lim)}%"></i>`:''}</div>
   <div class="c"><span>${m.v==null?'not in the tool yet':esc(m.cap||`${n1(m.v)} ${m.unit||''} · limit ${n1(m.lim)} ${m.unit||''}`)}</span><span>${esc(m.src||'')}</span></div></div>`; }
const q=(why)=>({q:true,why:why||'not in the tool yet'});
const val=v=>v&&v.q?`<b class="f1c-q" title="${esc(v.why)}">?</b><span class="f1c-qn">${esc(v.why)}</span>`:esc(v);
 
 
const oneEnd=h=>String(h).replace(/(^|[^\d.,])(\d[\d,]*(?:\.\d+)?)–\2(?![\d.,])/g,'$1$2');
 
function fitSheets(root){ root.querySelectorAll('.f1r-sheet').forEach(sh=>{ let w=sh.querySelector(':scope > .f1r-fit'); if(!w){ w=document.createElement('div'); w.className='f1r-fit'; while(sh.firstChild) w.appendChild(sh.firstChild); sh.appendChild(w); }
  w.style.zoom=''; const cs=getComputedStyle(sh), avail=sh.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom)-24; if(!(avail>0)) return;     let k=1;
  for(let it=0;it<6;it++){ const need=w.getBoundingClientRect().height/(parseFloat(w.style.zoom||'1')||1)*k; if(w.scrollHeight*k<=avail+1&&need<=avail+1) break; k=Math.max(0.4,k*Math.min(0.98,avail/(w.scrollHeight*k))); w.style.zoom=String(k); } }); }
function render(res,dr,pb,srcEl,tpl){ dr.innerHTML=oneEnd(res.draw||''); try{ if(BD.f1map) BD.f1map.enhance(dr); }catch(e){ console.warn('f1map',e); }     [60,600,2000].forEach(t=>setTimeout(()=>{ try{ fitSheets(dr); }catch(e){} },t));
  const hero=(res.hero||[]).length?`<div class="f1c-hero">${res.hero.map(h=>`<div data-fig="${esc(h.l||'')}"${h.k?` data-k="${esc(h.k)}"`:''} role="button" tabindex="0" title="Open the interactive logic diagram at this figure"><div class="v${h.red?' red':''}">${h.v&&h.v.q?'<b class="f1c-q">?</b>':esc(h.v)}${h.u?`<span>${esc(h.u)}</span>`:''}</div><div class="l">${esc(h.l)}${h.v&&h.v.q?' · not in the tool yet':''}</div></div>`).join('')}</div>`:'';
  const rows=(res.rows||[]).length?`<dl class="f1c-rows">${res.rows.map(r=>`<dt>${esc(r[0])}</dt><dd data-fig="${esc(r[0])}"${r[2]?` data-k="${esc(r[2])}"`:''} role="button" tabindex="0" title="Open the interactive logic diagram at this figure">${val(r[1])}</dd>`).join('')}</dl>`:'';
  const met=(res.meters||[]).map(meter).join('');
  const more=(res.more||[]).map(m=>`<details class="f1c-more"><summary>${esc(m[0])}</summary><div>${m[1]}</div></details>`).join('');
  let M0=null; try{ M0=BD.model(); }catch(e){} const first=!(BD.f1cardIndex>0);    
  const mix=first&&tpl==='architecture'&&!res.noZoneFlag&&BD.archTest&&BD.archTest.mixRezone&&BD.archTest.mixRezone(), nz=first&&!mix&&M0&&M0.Z&&M0.Z.notAllowed&&!res.noZoneFlag;    
  pb.innerHTML=oneEnd((mix?`<p class="f1c-zflag"><span class="f1c-q">?</span> Needs rezoning: no Edmonton zone allows a data centre with public uses (IH and EETC: no Community, Health or Emergency Service; BE: no Major Industrial). Shown as if rezoned: a flagged option, not a prediction.</p>`:nz?`<p class="f1c-zflag"><span class="f1c-q">?</span> Not allowed here; rezoning needed. Shown as if rezoned: a flagged option, not a prediction.</p>`:'')+(res.estimate?`<p class="f1c-est">${esc((res.estimate.basis||{}).t||'First pass, not checked: the engine doesn’t have this lot’s layout yet')}.${res.estimate.transplant?' Its plan is placed on this lot along the street, not re-planned.':''}${(res.estimate.names||[]).length?` Layout this lot needs: ${esc(res.estimate.names.join('; '))}.`:''}</p>`:'')+(res.lead?`<p class="lead">${esc(res.lead)}</p>`:'')+hero+rows+met+more);
  if(srcEl) srcEl.innerHTML=`<summary>Sources and assumptions</summary><ul>${(res.src||[]).map(s=>`<li>${pubSrc(s)}</li>`).join('')}${(res.missing||[]).length?`<li class="f1c-miss">Not in the tool yet: ${esc(res.missing.join('; '))}</li>`:''}</ul>`; }
 
const AR={key:null,P:null,busy:null};
const EXAMPLE_PICKS=['refuge','warming_shelter','clinic'];
 
function frontFlag(dflt){ try{ const q=new URLSearchParams(location.search).get('front')||localStorage.getItem('bd-front'); return q==='yard'?true:q==='off'?false:!!dflt; }catch(e){ return !!dflt; } }    
BD.frontFlag=frontFlag;
async function arch(){ const s=BD.S.sel; if(!s) return null; const key=s.city+':'+s.id; if(AR.key===key&&AR.P&&AR.gen===GEN) return AR.P;   if(AR.busy&&AR.bkey===key) return AR.busy;
  AR.bkey=key; AR.busy=(async()=>{ const keepT=BD.tier&&BD.tier(), wait=ms=>new Promise(r=>setTimeout(r,ms));
    try{ if(BD.setTier) BD.setTier('arch'); await BD.arch.ready; const An=BD.S.answers; for(const k of Object.keys(An)) delete An[k]; Object.assign(An,{built:'new',extent:'whole',floor:'',mw:null});
      BD.modelReset(); if(BD.flow.findFit) BD.flow.findFit();  
      BD.arch.ratio=null; BD.arch.picks=[]; BD.arch.rezone=BD.arch.rezone||{}; BD.arch.rezone[key]=true;   BD.modelReset(); await BD.views.arat(); await wait(300);
       
      if(frontFlag(true)){ const M0=BD.model(), mw0=An.mw||(M0&&M0.mwSized)||null; An.front='yard'; if(mw0&&!An.mw) An.mw=mw0; BD.modelReset(); }
      const A=BD.arch; A.picks=[]; EXAMPLE_PICKS.forEach(id=>BD.archTest.add(id)); const rf=A.picks.find(q=>q.id==='refuge'); if(rf) rf.opt='side_by_side';
      BD.modelReset(); const P=BD.archTest.place(); AR.key=key; AR.P=P; GEN++; AR.gen=GEN; return P; }
    finally{ if(keepT&&BD.setTier&&keepT!=='arch') BD.setTier(keepT); AR.busy=null; } })();
  return AR.busy; }
 
const EG={key:null,gen:-1,M:null,busy:null}; let GEN=0;
async function eng(){ const s=BD.S.sel; if(!s) return null; const key=s.city+':'+s.id; if(EG.key===key&&EG.gen===GEN&&EG.M) return EG.M; if(EG.busy&&EG.bkey===key) return EG.busy;
  EG.bkey=key; EG.busy=(async()=>{ try{ if(BD.setTier) BD.setTier('full'); const An=BD.S.answers; for(const k of Object.keys(An)) delete An[k]; Object.assign(An,{built:'new',extent:'whole',floor:'',mw:null},frontFlag(false)?{front:'yard'}:{});    
      BD.modelReset(); if(BD.flow.findFit) BD.flow.findFit(); BD.modelReset(); GEN++; EG.key=key; EG.gen=GEN; EG.M=BD.model(); EG.A=Object.assign({},An); return EG.M; }
    finally{ EG.busy=null; } })();
  return EG.busy; }
 
async function withAnswers(over,fn){ await eng(); const A=BD.S.answers, keep={}; for(const k in over) keep[k]=A[k];
  try{ Object.assign(A,over); BD.modelReset(); return await fn(BD.model()); }
  finally{ for(const k in keep){ if(keep[k]===undefined) delete A[k]; else A[k]=keep[k]; } BD.modelReset(); EG.M=BD.model(); } }
 
function ctx(city){ const M=BD.model(), sel=BD.S.sel||{}, a=sel.a||[], key=zoneKey(city,a);
  return {city,M,sel,a,key,addr:a[0]?titleCase(a[0]):'?',zone:key,status:dcStatus(city,key),arch,eng,withAnswers,K,n0,n1,q,esc,frame,pathOf,bbox,hit,scaleBar,allowed,zoneKey,titleCase}; }
 
const V1C=new WeakMap();
const hubOnP=P=>!!(BD.hub&&P&&(P.boxes||[]).some(b=>b.id==='refuge')&&(!BD.arch||!BD.arch.typology||BD.arch.typology==='emergency_hub'));
function v1(P){ if(!P) return null; if(V1C.has(P)) return V1C.get(P); let out=null;
  try{ const H=hubOnP(P)?BD.hub.build(P):null, L=H&&H.hub; if(L&&!L.doesntFit&&BD.S.sel) BD.f1hubLast={id:BD.S.sel.id,nb:L.nb};    
    if(L&&L.rooms){ const ra=r=>(r[1]-r[0])*(r[3]-r[2]), all=f=>Object.keys(L.rooms).reduce((t,st)=>t+(L.rooms[st]||[]).filter(f).reduce((a,x)=>a+x.r.reduce((b,r)=>b+ra(r),0),0),0);
      const dock=all(x=>x.id==='dock'&&x.block==='data centre');
      const areas={refuge:all(x=>/^ref/.test(x.id)&&x.block==='hub'),warming_shelter:all(x=>/^shel/.test(x.id)&&x.block==='hub'),clinic:L.clin||0,hall:L.hall,dock,support:Math.max(0,(L.dcArea||0)-L.hall-dock),dcAll:L.dcArea||0};
      const worst=Math.max(0,...(L.travel||[]).map(t=>t.worst||0));
      out={H,L,MW:L.MW,areas,storeys:H.storeys,exitSep:H.exitSep||[],travelWorst:worst||null,travel:L.travel||[],flags:H.flags||[],variant:L.variant||null}; } }
  catch(e){ console.warn('v1 layout',e); out=null; }
  V1C.set(P,out); return out; }
 
function budgetsV1(P){ const V=v1(P); if(!V) return BD.archTest.budgets(P);
  const A=BD.arch, An=BD.S.answers, keep={picks:A.picks, mw:An.mw, hall:P.s.hallM2};
  try{ A.picks=(keep.picks||[]).map(q=>V.areas[q.id]!=null?Object.assign({},q,{m2:V.areas[q.id]}):q); An.mw=V.MW; P.s.hallM2=V.areas.hall; return BD.archTest.budgets(P); }
  finally{ A.picks=keep.picks; if(keep.mw===undefined) delete An.mw; else An.mw=keep.mw; P.s.hallM2=keep.hall; if(BD.modelReset) BD.modelReset(); } }
const V1CHIP='Draft plan';    
 
const CODEW={OC:'operator',GOV:'government record',BRK:'broker',OBS:'observed',PR:'press release by the operator',DIR:'directory listing',ENG:'engineer’s project sheet'};
 
let RIDS=null; const rids=()=>{ if(RIDS) return RIDS; RIDS=new Set(); try{ const x=new XMLHttpRequest(); x.open('GET','data/register_ids.json',false); x.send(null); if(x.status===200) RIDS=new Set(JSON.parse(x.responseText).ids||[]); }catch(e){} return RIDS; };
const IDLIKE=/\b(?:[a-z][a-z0-9]*_[A-Za-z0-9_*]+|[a-z][a-z0-9]*[A-Z][A-Za-z0-9]*)\b/g;
const UNITS=/^(?:kW|kWh|kWe|kWth|kVA|kV|dB|dBA|mW|mWh|mL|pH|eCO2|kPa|mJ|kJ|kN|kg|kgCO2e|tCO2e|gCO2e)$/;
const isRid=m=>rids().has(m)||/\d/.test(m)||/_/.test(m)||/^(?:van|edm|bc|bch|ab|arch|metro|nrcan|statcan|cov|coe|od|eh)[A-Z]/.test(m);    
const keepTok=m=>UNITS.test(m)||isRid(m);
function pub(t){ let s=String(t==null?'':t).replace(/&quot;/g,'"').replace(/&amp;/g,'&');
  s=s.replace(/\bOBS\s+fieldJB\b/g,'site visit (author)').replace(/\bfieldJB\b/g,'site visit (author)').replace(/J\.B\.[’']s (?:own )?site visit/g,'site visit (author)');
  s=s.replace(/J\.B\.[’']s (?:final )?gate/g,'the author’s review').replace(/\bJ\.B\.,?\s+(\d{1,2}\s+[A-Z][a-z]{2}(?:\s+\d{4})?)/g,'decision of the author, $1').replace(/\bJ\.B\.[’']s\b/g,'the author’s').replace(/\bJ\.B\.(?=[\s,;:)])/g,'the author');
  s=s.replace(/\(?\bEH-FREEZE-2026-11-11[a-z]\)?/g,'the checked hub test fits');    
  s=s.replace(/\s*\bvia\s+sources\/\d+\s*§\s*[\w.]+/g,'').replace(/\bsources\/\d+(?:\s*§\s*[\w.]+)?/g,'the source file');    
  s=s.replace(/\s*\(?\b(?:the test-fit study|the project)(?:[’']s)?,?\s*(?:\d{1,2}\s+[A-Z][a-z]{2}(?:\s+\d{4})?)?\)?/g,'');
  s=s.replace(/(?:project files\/)?(?:[\w.\-]+\/)*specs\/([\w\-]+)\.md/g,(m,n)=>'the '+n.replace(/_/g,' ').replace(/^\w/,c=>c.toUpperCase())+' specification');
  s=s.replace(/(?:\b[\w.\-<>]+\/)*[\w\-*<>]+\.(?:json|geojson|csv)\b/g,'the tool’s data').replace(/\btool tiles [\w*]+/g,'the tool’s data').replace(/\btiles\/[\w\/*.\-<>]*/g,'the tool’s data');
  s=s.replace(/(?:project files\s*\/?\s*)?\b(?:tool|checks|register|reports|eh|docs)\/[\w.\/*\-]+/g,'').replace(/\bproject files\b/g,'');
  s=s.replace(/\b[\w\-*]+\.(?:js|py|md)\b(?:\s+[a-z_][\w]*(?:\(\))?(?=[\s,;:).]|$))?(?:\s*§\s*[\w.]+(?:\s+and\s+§\s*[\w.]+)?)?/g,'').replace(/\bthe research file\b[^,;.)]*/g,'');
  s=s.replace(/\b(?:BD|Z|M|R|S|HS|ECON|C|F|L|P|T|A|PL|X|G)\.[A-Za-z_][\w.]*(?:\(\))?/g,'').replace(/\(\(\{[^)]*\}\)\)/g,'');    
  s=s.replace(IDLIKE,m=>keepTok(m)?m:'');
  s=s.replace(/(the tool’s data)(?:\s*[,;\/]?\s*(?:and\s+)?the tool’s data)+/g,'$1');
   
  for(let k=0;k<3;k++) s=s.replace(/\(\s*(?:[,;:·\/]\s*)*\)/g,'').replace(/\(\s*[,;:]\s*/g,'(').replace(/\s*[,;:]\s*\)/g,')').replace(/\s+(?:from|through|by|in|with|of|via|as|and|or|to|on|at|through)\s*(?=[;,.)]|$)/g,'').replace(/:\s*[,;.]/g,':').replace(/:\s*(?=and\b)/g,': ').replace(/([,;])\s*[,;.]+/g,'$1').replace(/\s+([,.;:)])/g,'$1').replace(/\(\s+/g,'(').replace(/\s{2,}/g,' ');
  s=s.replace(/:\s*and\s+/g,': ').replace(/:\s*\./g,'.').replace(/^[\s,;:]+|[\s,;:]+$/g,'').replace(/\s+\./g,'.');
  return s; }
 
const passName=n=>{ const t=String(n==null?'':n); if(!/exit passage/i.test(t)||/rated/i.test(t)) return t; const two=/\b2 h\b/.test(t);
  return t.replace(/\s*\(2 h\)/,'').replace(/,\s*2 h\b/,'')+(two?', rated 2 h (VBBL 3.4.4.1)':', rated min. 45 min (VBBL 3.4.4.1)'); };
const pubSrc=t=>esc(pub(t)).replace(IDLIKE,m=>!UNITS.test(m)&&isRid(m)?`<span class="f1c-rid">${m}</span>`:m);
 
function words(t){ let s=pub(t).replace(/\barch_inv_\w+:?/g,'').replace(/\b(OC|GOV|BRK|OBS|PR|DIR|ENG)\b(?=[\s:;,)])/g,(m,k)=>CODEW[k]).replace(/\s\?(?=[\s;,)]|$)/g,'; not confirmed');
  return s.replace(/\(\s*(?:[,;:]\s*)*\)/g,'').replace(/\(\s*[,;:]\s*/g,'(').replace(/\s*[,;:]\s*\)/g,')').replace(/\s+([,.;:)])/g,'$1').replace(/\s{2,}/g,' ').replace(/(operator|government record|broker|observed)\s+(?=[;)])/g,'$1').trim(); }
BD.f1cards={pub,pubSrc,passName,words,context,CONTEXT_SRC,arch,eng,withAnswers,v1,budgetsV1,V1CHIP,EXAMPLE_PICKS,add,has,get:(tpl,title)=>REG[tpl]&&REG[tpl][title],render,ctx,K,meter,frame,pathOf,bbox,hit,scaleBar,allowed,zoneKey,dcStatus,q,n0,n1,esc,titleCase};
})();

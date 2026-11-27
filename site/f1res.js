 
(function(){
'use strict';
const BD=window.BD, C=BD.f1cards, K=C.K, esc=C.esc, T='resident';
const CITYN={van:'Vancouver',edm:'Edmonton'};
const FAC=city=>((BD.data.facilities||{})[city]||[]);
const RAW=city=>((BD.data.raw.facilities||{})[city]||[]);
const META={}; const meta=async c=>META[c]||(META[c]=await BD.getJSON(`tiles/${c}/meta.json`));
const NP='not published';
const STAT={operating:'operating',approved:'approved',permitted:'permitted','use approved':'use approved',proposed:'proposed',rezoning:'rezoning',announced:'announced','plant approved':'plant approved',closed:'closed','?':'status not confirmed'};
const solid=f=>f.status==='operating';
const TYPE={tower:'inside a shared building (floors or a suite in a building with other occupants)',standalone:'stand-alone building','?':'type not confirmed'};
 
const PICK=BD.f1res=BD.f1res||{pick:{}};
 
const POS={};
async function posOf(f){ if(POS[f.id]!==undefined) return POS[f.id]; let p=null;
  try{ if(f.city==='edm'&&f.xy){ const m=await meta('edm'), k=Math.cos(m.lat0*Math.PI/180)*111320; p=[(f.xy[1]-m.lon0)*k,(f.xy[0]-m.lat0)*110540]; }
    else if(f.city==='van'&&f.parcel){ const t=await BD.loadTile('van',f.parcel.tile), q=t&&t.par.find(x=>x.id===f.parcel.id); if(q) p=BD.centroid(q.r); } }
  catch(e){ p=null; } POS[f.id]=p; return p; }
async function placed(city){ const L=FAC(city).filter(f=>f.inMap); const out=[]; for(const f of L){ const p=await posOf(f); if(p) out.push({f,p}); } return out; }
 
async function grouped(city){ const P=await placed(city), G=new Map(); for(const o of P){ const k=o.f.parcel?o.f.parcel.id:o.p.map(v=>v.toFixed(0)).join(','); if(!G.has(k)) G.set(k,{k,p:o.p,fs:[]}); G.get(k).fs.push(o.f); } return [...G.values()]; }
 
async function picked(x){ const city=x.city, L=FAC(city); let f=L.find(g=>g.id===PICK.pick[city]); if(f) return f;
   
  const DEF={van:'van1'}; f=L.find(g=>g.id===DEF[city]&&g.inMap); if(f) return (PICK.pick[city]=f.id,f);
  const sel=x.sel||{}; f=L.find(g=>g.parcel&&g.parcel.id===sel.id); if(f) return (PICK.pick[city]=f.id,f);
  const P=await placed(city), b=sel.ring?C.bbox(sel.ring):null, c=b?[(b[0]+b[2])/2,(b[1]+b[3])/2]:null;
  const cand=P.filter(o=>solid(o.f)); let best=null; for(const o of (cand.length?cand:P)){ const d=c?Math.hypot(o.p[0]-c[0],o.p[1]-c[1]):0; if(!best||d<best.d) best={d,f:o.f}; }
  if(best){ PICK.pick[city]=best.f.id; return best.f; } return L[0]||null; }
 
if(!window.__f1resPick){ window.__f1resPick=true;
  document.addEventListener('click',e=>{ const b=e.target.closest&&e.target.closest('[data-fac]'); if(!b) return; const [city,id]=b.getAttribute('data-fac').split(':'); PICK.pick[city]=id; const gg=b.getAttribute('data-facg'); PICK.grp=PICK.grp||{}; if(gg) PICK.grp[city]=gg.split(':')[1].split(','); else if(!b.closest('[data-facg-list]')) PICK.grp[city]=null;
    const cur=document.querySelector('#f1v .f1v-strip [aria-current="true"]'); if(cur) cur.click(); });
  document.addEventListener('input',e=>{ const t=e.target; if(!t||!t.matches||!t.matches('input[data-facq]')) return; const v=t.value.trim().toLowerCase();
    let n=0; document.querySelectorAll('[data-facl] li').forEach(li=>{ const on=!v||li.textContent.toLowerCase().includes(v); li.style.display=on?'':'none'; if(on) n++; });
     
    const box=t.closest('.f1c-res-list'); if(box){ let m=box.querySelector('.f1c-res-none'); if(!m){ m=document.createElement('p'); m.className='f1c-res-none'; m.setAttribute('role','status'); m.style.cssText='font-size:13px;color:var(--bd-ink-2);margin:8px 0'; t.after(m); } m.textContent=v&&!n?'No data centre in this list matches. To test an address as a lot, start the Municipal or Power, heat and water role from the first page.':''; } }); }
const dot=(f,P,o)=>{ const [x,y]=P(o[0],o[1]), cur=PICK.pick[f.city]===f.id;
  return `<g data-fac="${f.city}:${f.id}" style="cursor:pointer"><title>${esc(f.name+(f.operator?' · '+f.operator:'')+' · '+(STAT[f.status]||f.status))}</title><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${cur?6:4.2}" fill="${solid(f)?K.dc:'#fff'}" stroke="${K.dc}" stroke-width="${cur?2.2:1.4}"/></g>`; };
const gdot=(g,P)=>{ if(g.fs.length===1) return dot(g.fs[0],P,g.p); const [x,y]=P(g.p[0],g.p[1]), city=g.fs[0].city, cur=g.fs.some(f=>PICK.pick[city]===f.id), op=g.fs.some(solid);
  return `<g data-fac="${city}:${g.fs[0].id}" data-facg="${city}:${g.fs.map(f=>f.id).join(',')}" style="cursor:pointer"><title>${esc((g.fs[0].addr||'')+': '+g.fs.length+' facilities · '+g.fs.map(f=>f.name).join(', '))}</title><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${cur?9:8}" fill="${op?K.dc:'#fff'}" stroke="${cur?K.ink:K.dc}" stroke-width="${cur?2:1.4}"/><text x="${x.toFixed(1)}" y="${(y+3.5).toFixed(1)}" font-size="9.5" fill="${op?'#fff':K.dc}" text-anchor="middle">${g.fs.length}</text></g>`; };
const dotKey=`<div class="f1c-key"><span><svg width="12" height="12"><circle cx="6" cy="6" r="4.2" fill="${K.dc}" stroke="${K.dc}"/></svg> operating</span><span><svg width="12" height="12"><circle cx="6" cy="6" r="4.2" fill="#fff" stroke="${K.dc}" stroke-width="1.4"/></svg> approved, permitted, proposed or status not confirmed</span></div>`;
const counts=city=>{ const L=FAC(city), C0=L.filter(f=>!f.where); return {n:C0.length,op:C0.filter(solid).length,opMap:C0.filter(f=>solid(f)&&f.inMap).length,map:L.filter(f=>f.inMap).length,out:L.filter(f=>f.where).length,nc:C0.filter(f=>!f.inMap).length}; };    
const opName=t=>{ const m=/operator\s+[‘'"]([^’'"]+)[’'"]/.exec(String(t||'')); let n=m?m[1]:String(t||'').split(' (')[0]; return n.replace(/\s*\([^)]*\)\s*$/,'').trim(); };
const notMapped=c=>`${c.nc} more ${c.nc===1?'is':'are'} on record without a confirmed address, and ${c.out} ${c.out===1?'sits':'sit'} outside city limits; neither is mapped.`;
const BEYOND={van:'Metro Vancouver, listed (beyond the city: Burnaby, Coquitlam, UBC)',edm:'Edmonton region, listed (beyond the city)'};
const SRC_INV='Facilities: the tool’s data-centre inventory, from operator, government, broker and engineer sources (researched 2–3 Nov 2026; addresses and published floors 12 Nov 2026). Each cell keeps its label: OC operator claim, GOV government record, BRK broker claim, ENG engineer’s project sheet, DIR directory listing, ? not confirmed.';
const SRC_PLACE='Placed: Vancouver by address in the City’s records (the parcel the tool’s own address search finds first: our method); Edmonton by the City permit geocode (arch_inv_edmPermitRows). No coordinates are published for the Vancouver rows.';

 
C.add(T,'Your city',{async build(x){
  const base=await C.get('municipal','Your city').build(x); let draw=base.draw||''; const W=470,H=520;
  for(const city of ['van','edm']){ const m=await meta(city), e=m.ext, f=C.frame([e[0],e[1],e[2],e[3]],W,H,8), P=await placed(city);
    const dots=(await grouped(city)).map(g=>gdot(g,f.P)).join(''); let n=0; const tag=`aria-label="${city==='van'?'Vancouver':'Edmonton'}:`;
    const i=draw.indexOf(tag); if(i<0) continue; const j=draw.indexOf('</svg>',i); if(j<0) continue; draw=draw.slice(0,j)+dots+draw.slice(j); n++; }
  draw+=dotKey;
  const cv=counts('van'), ce=counts('edm');
  return {noZoneFlag:true,draw,lead:`Data centres on record: Vancouver ${cv.n} (${cv.op} operating), Edmonton ${ce.n} (${ce.op} operating); those beyond each city are listed, not mapped. Several at one address share one marker with their count. The shaded zones are where a data centre can be built.`,
    rows:[['Vancouver, on record',`${cv.n} (${cv.op} operating); ${cv.map} on the map, ${cv.nc} not placed (listed with the reason)`],['Metro Vancouver, beyond the city',`${cv.out}: listed, not mapped`],
          ['Edmonton, on record',`${ce.n} (${ce.op} operating); ${ce.map} on the map, ${ce.nc} not placed`],['Edmonton region, beyond the city',`${ce.out}: listed, not mapped`]],
    src:[SRC_INV,SRC_PLACE].concat(base.src||[]),missing:[]}; }});

 
C.add(T,'Find a data centre',{async build(x){
  const city=x.city, m=await meta(city), e=m.ext, W=640,H=640, f=C.frame([e[0],e[1],e[2],e[3]],W,H,8), st=await BD.streets(city), GR=await grouped(city), cur=await picked(x);
  let sd=''; if(st) for(const g of st.segs){ let d=''; for(let i=2;i+1<g.length;i+=2){ const [a,b]=f.P(g[i],g[i+1]); d+=(i>2?'L':'M')+a.toFixed(1)+' '+b.toFixed(1); } sd+=d; }
  const svg=`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" data-map data-map-city="${city}" data-map-bb="${[e[0],e[1],e[2],e[3]].join(',')}" data-map-frame="${W},${H},8" data-map-max="40" role="img" aria-label="${CITYN[city]}: data centres on record"><rect width="${W}" height="${H}" fill="${K.ground}"/><path d="${sd}" fill="none" stroke="${K.rule}" stroke-width="0.5"/>${GR.filter(g=>!g.fs.some(z=>cur&&z.id===cur.id)).map(g=>gdot(g,f.P)).join('')}${GR.filter(g=>g.fs.some(z=>cur&&z.id===cur.id)).map(g=>gdot(g,f.P)).join('')}</svg>`;
  const li=g=>`<li><button type="button" data-fac="${g.city}:${g.id}" class="${cur&&cur.id===g.id?'on':''}"><b>${esc(g.name)}</b>${g.operator&&opName(g.operator)&&opName(g.operator)!==g.name?' · '+esc(opName(g.operator)):''} · ${esc(g.addr||'no street address')} · <em>${esc(STAT[g.status]||g.status)}</em>${!g.inMap&&!g.where&&g.addrNote?`<br><span style="color:#66696E">${esc(g.addrNote)}</span>`:''}</button></li>`;
  const L=FAC(city), grp=[['Operating',L.filter(g=>g.inMap&&solid(g))],['Approved, permitted or proposed',L.filter(g=>g.inMap&&!solid(g)&&g.status!=='?'&&g.status!=='closed')],['Status not confirmed or closed',L.filter(g=>g.inMap&&(g.status==='?'||g.status==='closed'))]].filter(g=>g[1].length);    
  const gsel=(PICK.grp&&PICK.grp[city])||null, gl=gsel?L.filter(g=>gsel.includes(g.id)):null;
  const list=`<div class="f1c-res-list"><input type="search" data-facq placeholder="Search by name, operator or address" aria-label="Search the list">${gl&&gl.length>1?`<div data-facg-list><h4>At ${esc(gl[0].addr||'')}: ${gl.length} facilities</h4><ul>${gl.map(li).join('')}</ul></div>`:''}<div data-facl>${grp.map(([h,a])=>`<h4>${esc(h)} (${a.length})</h4><ul>${a.map(li).join('')}</ul>`).join('')}</div></div>`;
  const c=counts(city);
  return {noZoneFlag:true,draw:`<div class="f1c-res-find"><figure>${svg}${dotKey}</figure>${list}</div>`,
    lead:`${CITYN[city]}: ${c.n} data centres on record (${c.map} on the map, ${c.nc} without a confirmed address), ${c.op} operating (${c.opMap} of them on the map). ${c.out} more beyond the city are listed, not counted. Click a dot or a name to pick one; the next card describes it.`,
    hero:[{v:String(c.n),l:'on record'},{v:String(c.op),l:'operating'},{v:String(c.map),l:'on the map'}],
    rows:[['Picked',cur?`${cur.name}${cur.operator&&opName(cur.operator)?' · '+opName(cur.operator):''}`:'none']],
    src:[notMapped(c),SRC_INV,SRC_PLACE,'Streets: tool/streets_'+city+'.json.'],missing:[]}; }});    

 
const pip=(x,y,r)=>BD.pip(x,y,r);
const R3=230, BLUE='#3366A3';
const ringPts=r=>{ const o=[]; for(let i=0;i<r.length;i+=2) o.push([r[i],r[i+1]]); return o; };
const areaP=P=>{ let a=0; for(let i=0;i<P.length;i++){ const q=P[i], w=P[(i+1)%P.length]; a+=q[0]*w[1]-w[0]*q[1]; } return a/2; };
const cenP=P=>{ let a=0,x=0,y=0; for(let i=0;i<P.length;i++){ const q=P[i], w=P[(i+1)%P.length], c=q[0]*w[1]-w[0]*q[1]; a+=c; x+=(q[0]+w[0])*c; y+=(q[1]+w[1])*c; } return Math.abs(a)<1e-9?P[0]:[x/(3*a),y/(3*a)]; };
const hull=P=>{ const Q=P.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]), cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]), lo=[], up=[];
  for(const q of Q){ while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],q)<=0) lo.pop(); lo.push(q); }
  for(let i=Q.length-1;i>=0;i--){ const q=Q[i]; while(up.length>1&&cr(up[up.length-2],up[up.length-1],q)<=0) up.pop(); up.push(q); }
  return lo.slice(0,-1).concat(up.slice(0,-1)); };
 
const clipC=(S,Cp)=>{ let out=S; for(let i=0;i<Cp.length&&out.length;i++){ const a=Cp[i], b=Cp[(i+1)%Cp.length], inn=q=>(b[0]-a[0])*(q[1]-a[1])-(b[1]-a[1])*(q[0]-a[0])>=0;
    const X=(p1,p2)=>{ const d1=(b[0]-a[0])*(p1[1]-a[1])-(b[1]-a[1])*(p1[0]-a[0]), d2=(b[0]-a[0])*(p2[1]-a[1])-(b[1]-a[1])*(p2[0]-a[0]), t=d1/(d1-d2); return [p1[0]+t*(p2[0]-p1[0]),p1[1]+t*(p2[1]-p1[1])]; };
    const inp=out; out=[]; for(let k=0;k<inp.length;k++){ const c=inp[k], pv=inp[(k+inp.length-1)%inp.length]; if(inn(c)){ if(!inn(pv)) out.push(X(pv,c)); out.push(c); } else if(inn(pv)) out.push(X(pv,c)); } }
  return out; };
const ccwP=P=>areaP(P)<0?P.slice().reverse():P;
 
 
const dedupe=P=>{ const o=[]; for(const q of P) if(!o.length||Math.hypot(q[0]-o[o.length-1][0],q[1]-o[o.length-1][1])>1e-6) o.push(q); while(o.length>1&&Math.hypot(o[0][0]-o[o.length-1][0],o[0][1]-o[o.length-1][1])<=1e-6) o.pop(); return o; };
function earTri(P){ P=ccwP(dedupe(P)); const V=P.map((q,i)=>i), T=[], cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]); let g=0;
  while(V.length>3&&g++<5000){ let cut=false; for(let k=0;k<V.length;k++){ const a=P[V[(k+V.length-1)%V.length]], b=P[V[k]], c=P[V[(k+1)%V.length]]; if(cr(a,b,c)<=1e-9) continue;
      let ok=true; for(const m of V){ const q=P[m]; if(q===a||q===b||q===c) continue; if(cr(a,b,q)>=0&&cr(b,c,q)>=0&&cr(c,a,q)>=0){ ok=false; break; } } if(!ok) continue;
      T.push([a,b,c]); V.splice(k,1); cut=true; break; } if(!cut) break; }
  if(V.length===3) T.push(V.map(m=>P[m])); return T; }
 
function joinParts(parts){ if(parts.length<2) return parts; const key=q=>Math.round(q[0]*100)+','+Math.round(q[1]*100), pts=new Map();
  for(const P of parts) for(const q of P) pts.set(key(q),q); const PT=[...pts.values()];
  const split=(a,b)=>{ const dx=b[0]-a[0], dy=b[1]-a[1], L=dx*dx+dy*dy; if(L<1e-8) return [a,b]; const on=[];
    for(const q of PT){ const t=((q[0]-a[0])*dx+(q[1]-a[1])*dy)/L; if(t<=1e-6||t>=1-1e-6) continue; if(Math.abs((q[0]-a[0])*dy-(q[1]-a[1])*dx)/Math.sqrt(L)>0.01) continue; on.push([t,q]); }
    on.sort((u,v)=>u[0]-v[0]); return [a,...on.map(u=>u[1]),b]; };
  const E=new Map(), add=(a,b)=>{ const ka=key(a), kb=key(b); if(ka===kb) return; const r=kb+'>'+ka; if(E.has(r)){ const n=E.get(r); if(n.c>1) n.c--; else E.delete(r); return; } const k=ka+'>'+kb; if(E.has(k)) E.get(k).c++; else E.set(k,{a,b,c:1}); };
  for(const P of parts) for(let i=0;i<P.length;i++){ const S=split(P[i],P[(i+1)%P.length]); for(let j=0;j+1<S.length;j++) add(S[j],S[j+1]); }
  const out=new Map(); for(const [k,e] of E){ const ka=k.split('>')[0]; for(let c=0;c<e.c;c++){ if(!out.has(ka)) out.set(ka,[]); out.get(ka).push(e); } }
  const rings=[]; let left=[...out.values()].reduce((t,v)=>t+v.length,0), g=0;
  while(left>0&&g++<1000){ const k0=[...out.keys()].find(k=>out.get(k).length); if(k0==null) break; const L=[]; let k=k0, h=0;
    do{ const lst=out.get(k); if(!lst||!lst.length) return parts; const e=lst.pop(); left--; L.push(e.a); k=key(e.b); }while(k!==k0&&h++<20000);
    if(k!==k0) return parts; const R=dedupe(L); if(R.length>2&&Math.abs(areaP(R))>1e-3) rings.push(R); }
  return rings.length?rings:parts; }
 
const clipH=(S,a,b)=>{ const inn=q=>(b[0]-a[0])*(q[1]-a[1])-(b[1]-a[1])*(q[0]-a[0])>=0, out=[];
  for(let k=0;k<S.length;k++){ const c=S[k], pv=S[(k+S.length-1)%S.length], X=()=>{ const d1=(b[0]-a[0])*(pv[1]-a[1])-(b[1]-a[1])*(pv[0]-a[0]), d2=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]), t=d1/(d1-d2); return [pv[0]+t*(c[0]-pv[0]),pv[1]+t*(c[1]-pv[1])]; };
    if(inn(c)){ if(!inn(pv)) out.push(X()); out.push(c); } else if(inn(pv)) out.push(X()); } return out; };
function minusParcel(P,par){ const H=ccwP(hull(dedupe(par))), parts=[];
  for(let i=0;i<H.length;i++){ let S=clipH(ccwP(P),H[(i+1)%H.length],H[i]); for(let j=0;j<i&&S.length>2;j++) S=clipH(S,H[j],H[(j+1)%H.length]); if(S.length>2&&Math.abs(areaP(S))>1) parts.push(S); }
  return joinParts(parts); }
function clipToParcel(Q,par){ const tris=earTri(par); let area=0; const parts=[]; for(const t of tris){ const c=clipC(Q,t); if(c.length>2){ const a=Math.abs(areaP(c)); if(a>1e-3){ area+=a; parts.push(c); } } }
  return {area,parts:joinParts(parts)}; }
 
function mrrAngle(P){ const H=hull(P); let best=null; for(let i=0;i<H.length;i++){ const a=H[i], b=H[(i+1)%H.length], an=Math.atan2(b[1]-a[1],b[0]-a[0]), c=Math.cos(-an), s=Math.sin(-an);
    let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9; for(const q of H){ const x=q[0]*c-q[1]*s, y=q[0]*s+q[1]*c; x0=Math.min(x0,x); x1=Math.max(x1,x); y0=Math.min(y0,y); y1=Math.max(y1,y); }
    const A=(x1-x0)*(y1-y0); if(!best||A<best.A) best={A,an}; } return best?best.an:0; }
const CTX={};    
 
const CTXT={};
async function ctxNear(city,p,R){ let idx=CTXT[city+'#'];
  if(idx===undefined){ try{ idx=await BD.getJSON(`context/${city}/index.json`); }catch(e){ idx=null; } CTXT[city+'#']=idx; }
  if(!idx){ if(CTX[city]!==undefined) return CTX[city]; try{ return CTX[city]=await BD.getJSON(`context/${city}_structures.json`); }catch(e){ return CTX[city]=null; } }
  const T=idx.T, have=new Set(idx.tiles.map(k=>k.join('_'))), out=[];
  for(let i=Math.floor((p[0]-R)/T);i<=Math.floor((p[0]+R)/T);i++) for(let j=Math.floor((p[1]-R)/T);j<=Math.floor((p[1]+R)/T);j++){ const k=i+'_'+j; if(!have.has(k)) continue;
    if(!CTXT[city+k]) CTXT[city+k]=BD.getJSON(`context/${city}/c_${k}.json`).then(J=>J.b.map(o=>{ const r=[], q=o[5]; let x=0, y=0;
      for(let n=0;n<q.length;n+=2){ if(n){ x+=q[n]; y+=q[n+1]; } else { x=q[0]; y=q[1]; } r.push(i*T+x/J.Q,j*T+y/J.Q); } return {id:o[0],h:o[1],hl:o[2],hs:o[3],src:o[4],r}; })).catch(()=>[]);
    out.push(...await CTXT[city+k]); }
  return {b:out}; }
async function block(f){ const p=await posOf(f); if(!p) return null; const m=await meta(f.city), R=R3+40;
  const keys=T=>{ const ks=new Set(); for(const dx of [-R,0,R]) for(const dy of [-R,0,R]) ks.add(Math.floor((p[0]+dx)/T)+'_'+Math.floor((p[1]+dy)/T)); return ks; };
  const tiles=[]; for(const k of keys(m.T)){ if(!(m.tiles||[]).some(t=>t[0]+'_'+t[1]===k)) continue; try{ const t=await BD.loadTile(f.city,k); if(t) tiles.push(t); }catch(e){} }
  let ring=null; for(const t of tiles){ if(f.parcel&&!ring){ const q=t.par.find(z=>z.id===f.parcel.id); if(q) ring=q.r; } }
   
  const raw=[]; let lid=false; const FOOT=f.city==='van';
  if(f.city==='van'&&!FOOT){ for(const k of keys(m.T)){ try{ const J=await BD.getJSON(`tiles/van/lid_${k}.json`); lid=true; for(const b of J.B) raw.push({h:b[0],P:ringPts(b.slice(2))}); }catch(e){} } }
   
  let csE=null; if(f.city==='edm'){ let CX=null; CX=await ctxNear('edm',p,R3+80);
    if(CX&&CX.b){ csE={n:0,hq:0}; for(const o of CX.b){ if(!o.P){ o.P=[]; for(let i=0;i<o.r.length;i+=2) o.P.push([o.r[i],o.r[i+1]]); o.P=ccwP(dedupe(o.P)); o.a=Math.abs(areaP(o.P)); o.c=cenP(o.P); }
        if(Math.hypot(o.c[0]-p[0],o.c[1]-p[1])>R3+60) continue; const hq=!(o.h>0); raw.push({h:hq?4:o.h,hq,P:o.P,cs:true}); csE.n++; if(hq) csE.hq++; } lid=false; } }
  if(!lid&&!csE){ const seen=new Set(); for(const t of tiles) for(const b of t.bld){ const c=b.c||BD.centroid(b.r), k=c[0].toFixed(1)+','+c[1].toFixed(1); if(seen.has(k)) continue; seen.add(k); if(FOOT&&b.f===3) continue; raw.push({h:b.h>0?b.h:4,hq:!(b.h>0),fl:b.f||0,P:ringPts(b.r)}); } }
  const par=ring?ccwP(ringPts(ring)):null, pc=par?cenP(par):p, items=[];
  for(const b of raw){ const P=ccwP(b.P), a=Math.abs(areaP(P)); if(a<25) continue; const c=cenP(P); if(Math.hypot(c[0]-pc[0],c[1]-pc[1])>R3) continue;
    if(par){ const ov=clipToParcel(P,par), pa=Math.abs(areaP(par));
      if(ov.area>0.5*a||ov.area>0.3*pa){ const sid=raw.indexOf(b); if(FOOT&&ov.area>0.5*a){ items.push({P,h:b.h,tgt:true,sid,fl:b.fl}); continue; }    
        for(const q of ov.parts) items.push({P:ccwP(q),h:b.h,tgt:true,sid,clip:true}); if(FOOT) for(const q of minusParcel(P,par)) items.push({P:ccwP(q),h:b.h,tgt:false,fl:b.fl}); continue; }    
      if(ov.area>0.2*a) continue; }    
    items.push({P,h:b.h,tgt:false,fl:b.fl,hq:b.hq}); }
  let fill=null; if(FOOT){ fill={n:0,cs:0,low:0,none:0}; let CX=null; CX=await ctxNear(f.city,pc,R3+20);
    if(CX&&CX.b){ const city=items.map(it=>it.P), cc=city.map(cenP), ca=city.map(P=>Math.abs(areaP(P)));
      for(const o of CX.b){ if(!o.P){ o.P=[]; for(let i=0;i<o.r.length;i+=2) o.P.push([o.r[i],o.r[i+1]]); o.P=ccwP(dedupe(o.P)); o.a=Math.abs(areaP(o.P)); o.c=cenP(o.P); }
        if(o.a<40||Math.hypot(o.c[0]-pc[0],o.c[1]-pc[1])>R3) continue;
        if(city.some(P=>pip(o.c[0],o.c[1],P.flat()))) continue;    
        let cov=0; for(let k=0;k<city.length;k++) if(pip(cc[k][0],cc[k][1],o.P.flat())) cov+=ca[k]; if(cov>0.2*o.a) continue;
         
        const lid=o.hs!=null&&o.hs>=0.3, kind=lid?'lidar':o.hs==null?'cs':'low', h=lid?o.hl:o.h; if(!(h>0)){ fill.none++; continue; }
        items.push({P:o.P,h,tgt:false,fill:kind}); fill.n++; if(kind==='cs') fill.cs++; if(kind==='low') fill.low++; } } }
  if(!par){  
    let own=null; for(const it of items) if(pip(p[0],p[1],it.P.flat())&&(!own||Math.abs(areaP(it.P))>Math.abs(areaP(own.P)))) own=it;
    if(!own){ let bd=30; const dE=(P)=>{ let m=1e9; for(let i=0;i<P.length;i++){ const a=P[i], q=P[(i+1)%P.length], dx=q[0]-a[0], dy=q[1]-a[1], L=dx*dx+dy*dy, t=L?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/L)):0; m=Math.min(m,Math.hypot(a[0]+t*dx-p[0],a[1]+t*dy-p[1])); } return m; };
      for(const it of items){ const d=dE(it.P); if(d<bd){ bd=d; own=it; } } if(own) own.near=Math.round(bd); }    
    if(own){ own.tgt=true; own.sid=-1; } }
   
  const T0=items.filter(it=>it.tgt), amax=Math.max(0,...T0.map(it=>Math.abs(areaP(it.P)))), T_=T0.filter(it=>Math.abs(areaP(it.P))>=0.2*amax); let own=null; for(const it of T_) if(!own||it.h>own.h+0.5||(Math.abs(it.h-own.h)<=0.5&&Math.abs(areaP(it.P))>Math.abs(areaP(own.P)))) own=it;
  if(own) for(const it of T0) it.mine=FOOT||it.sid===own.sid;        
   
  const roads=[]; let trees=[]; try{ const st=await BD.streets(f.city); for(const g of (st&&st.segs)||[]){ const P=[]; for(let i=2;i+1<g.length;i+=2) P.push([g[i],g[i+1]]); if(P.length>1&&P.some(q=>Math.abs(q[0]-pc[0])<R3+80&&Math.abs(q[1]-pc[1])<R3+80)) roads.push(P); } }catch(e){}
  try{ if(BD.f1d&&BD.f1d.treesNear) trees=((await BD.f1d.treesNear(f.city,pc,R3+20))||[]).filter(t=>Math.abs(t[0]-pc[0])<R3&&Math.abs(t[1]-pc[1])<R3); }catch(e){}
  return {p:pc,items,own,par,ang:par?mrrAngle(par):0,lidar:lid,foot:FOOT,raw,fill,csE,roads,trees}; }    
 
const storeysOf=f=>{ const m=/(\d+)[- ](?:storey|floor)/i.exec(f.building||''); return m?+m[1]:null; };
let AXN=0;    
function axo(f,B,o){ o=o||{}; const W=900,H=640, small=!!o.small;
  if(!B.items.length) return null;
  const pr=(x,y,z)=>[(x-y)*0.8660,(x+y)*0.5-z];    
   
  const turnTo=t=>{ const an=-B.ang+t*Math.PI/2, c=Math.cos(an), s=Math.sin(an); return q=>{ const x=q[0]-B.p[0], y=q[1]-B.p[1], X=x*c-y*s, Y=x*s+y*c; return [X,-Y]; }; };
  const sil=(P,h)=>hull(P.flatMap(q=>[pr(q[0],q[1],0),pr(q[0],q[1],h)]));
  let best=null;
  for(let t=0;t<4;t++){ const fn=turnTo(t), its=B.items.map(it=>({it,P:ccwP(it.P.map(fn)),h:Math.max(2,it.h||4)})), me=its.find(z=>z.it===B.own); if(!me){ best={its,me:null,fn,score:0}; break; }
    const mine=its.filter(z=>z.it.mine), tb=ccwP(hull(mine.flatMap(z=>sil(z.P,z.h)))), td=cenP(me.P), dep=td[0]+td[1]; let score=0;
    for(const z of its){ if(z.it.tgt) continue; const c=cenP(z.P); if(c[0]+c[1]<=dep) continue; const o2=clipC(ccwP(sil(z.P,z.h)),tb); if(o2.length>2) score+=Math.abs(areaP(o2)); }
    if(!best||score<best.score) best={its,me,fn,score,tb,dep}; }
  const {its,me,fn}=best;
  const all=its.flatMap(z=>z.P.flatMap(q=>[pr(q[0],q[1],0),pr(q[0],q[1],z.h)]));
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; for(const [a,b] of all){ x0=Math.min(x0,a); y0=Math.min(y0,b); x1=Math.max(x1,a); y1=Math.max(y1,b); }
  const padR=small?20:260, k=Math.min((W-padR-30)/(x1-x0),(H-90)/(y1-y0)), ox=30-x0*k, oy=(H-60-(y1-y0)*k)/2-y0*k;
  const S=(x,y,z)=>{ const q=pr(x,y,z); return [ox+q[0]*k,oy+q[1]*k]; };
  const pts=Q=>Q.map(q=>q[0].toFixed(1)+','+q[1].toFixed(1)).join(' ');
  const ply=(Q,fill,st,sw,dash)=>`<polygon points="${pts(Q)}" fill="${fill}" stroke="${st}" stroke-width="${sw}"${dash?` stroke-dasharray="${dash}"`:''} stroke-linejoin="round"/>`;
  const ln=(a,b,col,sw)=>`<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${col}" stroke-width="${sw}"/>`;
  const INK=K.ink||'#18191B', MUTE=K.mute||'#75746F', st0=storeysOf(f), fl=(f.floors&&f.floors.list)||[], num=fl.filter(v=>typeof v==='number').sort((a,b)=>a-b), below=fl.filter(v=>typeof v!=='number');
  let svg=`<rect width="${W}" height="${H}" fill="#F6F5F2"/>`, ghosts='', lab='', label=null, cut=0; const CUT=3;    
   
  const gid='f1g'+(++AXN); { const g=ccwP([[-R3,-R3],[R3,-R3],[R3,R3],[-R3,R3]].map(q=>fn([B.p[0]+q[0],B.p[1]+q[1]]))).map(q=>S(q[0],q[1],0)), c0=S(0,0,0), rr=Math.max(...g.map(q=>Math.hypot(q[0]-c0[0],q[1]-c0[1])));
    svg+=`<defs><radialGradient id="${gid}f" gradientUnits="userSpaceOnUse" cx="${c0[0].toFixed(1)}" cy="${c0[1].toFixed(1)}" r="${rr.toFixed(1)}"><stop offset="0.5" stop-color="#EAE8E3"/><stop offset="0.86" stop-color="#EAE8E3" stop-opacity="0"/></radialGradient>
      <clipPath id="${gid}c"><polygon points="${pts(g)}"/></clipPath><mask id="${gid}m"><rect width="${W}" height="${H}" fill="url(#${gid}w)"/></mask>
      <radialGradient id="${gid}w" gradientUnits="userSpaceOnUse" cx="${c0[0].toFixed(1)}" cy="${c0[1].toFixed(1)}" r="${rr.toFixed(1)}"><stop offset="0.5" stop-color="#fff"/><stop offset="0.86" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>`;
    svg+=ply(g,`url(#${gid}f)`,'none',0);
     
    const rw=Math.max(1,9*k*0.7); let rd=''; for(const P of (B.roads||[])){ const Q=P.map(q=>fn(q)).map(q=>S(q[0],q[1],0)); rd+=`<polyline points="${pts(Q)}"/>`; }
    if(rd) svg+=`<g clip-path="url(#${gid}c)" mask="url(#${gid}m)" fill="none" stroke="#DCD9D1" stroke-width="${rw.toFixed(1)}" stroke-linecap="round" stroke-linejoin="round">${rd}</g>`; }
   
  const TR=(B.trees||[]).map(t=>{ const q=fn([t[0],t[1]]), h=t[2]||Math.min(14,Math.max(5,(t[3]||25)*0.25)), r=Math.max(1.4,Math.min(4.5,t[3]?t[3]/100*9:h*0.22)), b0=S(q[0],q[1],0), c=S(q[0],q[1],h*0.72);
    return {d:q[0]+q[1],s:`<g mask="url(#${gid}m)"><line x1="${b0[0].toFixed(1)}" y1="${b0[1].toFixed(1)}" x2="${c[0].toFixed(1)}" y2="${c[1].toFixed(1)}" stroke="#A8A196" stroke-width="0.7"/><ellipse cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" rx="${(r*k).toFixed(1)}" ry="${(r*k*0.86).toFixed(1)}" fill="#CFDDBE" stroke="#9EB487" stroke-width="0.45"/></g>`}; }).sort((a,b)=>a.d-b.d); let ti=0;
  if(B.par){ const pp=ccwP(B.par.map(fn)); svg+=ply(pp.map(q=>S(q[0],q[1],0)),'#F6F5F2','#9C9B97',0.8); }
  const mine=its.filter(z=>z.it.mine), tb=me?ccwP(hull(mine.flatMap(z=>sil(z.P,z.h)))):null, tA=tb?Math.abs(areaP(tb)):0, dep=me?(cenP(me.P)[0]+cenP(me.P)[1]):-1e9;
  const ek=(a,b)=>Math.round(a[0]*20)+','+Math.round(a[1]*20)+'>'+Math.round(b[0]*20)+','+Math.round(b[1]*20), inner=new Set(); for(const z of mine) for(let i=0;i<z.P.length;i++) inner.add(ek(z.P[i],z.P[(i+1)%z.P.length]));
   
  const stEst=!st0&&me&&num.length?Math.max(1,Math.round(me.h/4)):null, st=st0||stEst;
  const mode=!me?null:f.type==='standalone'?'whole':f.type==='?'?'outline':(fl.length&&st&&num.length)?'floors':(below.length&&!num.length)?'below':'tint';
  for(const z of its.slice().sort((a,b)=>(cenP(a.P)[0]+cenP(a.P)[1])-(cenP(b.P)[0]+cenP(b.P)[1]))){ const P=z.P, h=z.h, isMe=!!z.it.mine, c=cenP(P);
    while(ti<TR.length&&TR[ti].d<=c[0]+c[1]) svg+=TR[ti++].s;    
    if(!z.it.tgt&&me&&c[0]+c[1]>dep){ const o2=clipC(ccwP(sil(P,h)),tb); if(o2.length>2&&Math.abs(areaP(o2))>0.02*tA){    
        const hc=Math.min(h,CUT); let gc=''; for(let i=0;i<P.length;i++){ const a=P[i], b=P[(i+1)%P.length]; if((b[1]-a[1])+(-(b[0]-a[0]))<=0) continue; gc+=ply([S(a[0],a[1],0),S(b[0],b[1],0),S(b[0],b[1],hc),S(a[0],a[1],hc)],'#E2E1DC','#B4B3AE',0.4); }
        svg+=gc+ply(P.map(q=>S(q[0],q[1],hc)),'#EFEEEA','#B4B3AE',0.4); cut++; continue; } }
    const own=z.it.tgt, ec=own?INK:'#8A8985', ew=own?0.7:0.5; let g='';
    for(let i=0;i<P.length;i++){ const a=P[i], b=P[(i+1)%P.length], nx=b[1]-a[1], ny=-(b[0]-a[0]); if(nx+ny<=0) continue; if(isMe&&inner.has(ek(b,a))&&!(B.foot&&(mine.find(w=>w!==z&&w.P.some((q,j)=>ek(q,w.P[(j+1)%w.P.length])===ek(b,a)))||{h:h}).h<h-0.5)) continue;    
      const wall=nx>ny?'#F3F2EE':'#E3E2DD';
      if(isMe&&mode==='whole'){ g+=ply([S(a[0],a[1],0),S(b[0],b[1],0),S(b[0],b[1],h),S(a[0],a[1],h)],BLUE,INK,0.7); continue; }
      if(isMe&&mode==='tint'){ g+=ply([S(a[0],a[1],0),S(b[0],b[1],0),S(b[0],b[1],h),S(a[0],a[1],h)],K.fillSup||'#E4EAF2',INK,0.7); continue; }
      g+=ply([S(a[0],a[1],0),S(b[0],b[1],0),S(b[0],b[1],h),S(a[0],a[1],h)],isMe&&mode==='outline'?'none':wall,isMe&&mode==='outline'?BLUE:ec,ew,isMe&&mode==='outline'?'4 3':null);
      if(isMe&&mode==='floors'){ const fh=(me?me.h:h)/st; for(let q=1;q<st&&q*fh<h-0.01;q++) g+=ln(S(a[0],a[1],q*fh),S(b[0],b[1],q*fh),'#C9C8C3',0.25);
        for(const n of num) if(n*fh<=h+0.01) g+=ply([S(a[0],a[1],(n-1)*fh),S(b[0],b[1],(n-1)*fh),S(b[0],b[1],n*fh),S(a[0],a[1],n*fh)],BLUE,INK,0.5); }
      if(isMe&&mode==='below') g+=ply([S(a[0],a[1],0),S(b[0],b[1],0),S(b[0],b[1],Math.min(3,h)),S(a[0],a[1],Math.min(3,h))],BLUE,INK,0.5); }
    const roof=isMe&&mode==='whole'?BLUE:isMe&&mode==='outline'?'none':'#FFFFFF';    
    svg+=g+ply(P.map(q=>S(q[0],q[1],h)),roof,isMe&&mode==='outline'?BLUE:ec,own?0.9:0.5,isMe&&mode==='outline'?'4 3':null);
    if(z===me){ const MP=mine.flatMap(w=>w.P), sx=MP.reduce((m2,q)=>S(q[0],q[1],0)[0]>S(m2[0],m2[1],0)[0]?q:m2,MP[0]), fh=st?h/st:h;    
      const zl=mode==='floors'?(num[0]-0.5)*fh:mode==='below'?1.5:h*0.6, [lx,ly]=S(sx[0],sx[1],zl);
      const op=f.operator?String(f.operator).split(' (')[0]:'', nm0=op&&op.length<=20&&!/['’"]/.test(op)&&!String(f.name).includes(op)?op+' '+f.name:f.name, nm=nm0.length>30?nm0.slice(0,29)+'…':nm0, t1=mode==='floors'?`Floor${num.length>1?'s':''} ${num.join(', ')}: ${nm}`:nm;
      const t2=[f.addr,(/(Harbour Centre|TELUS Garden|[A-Z][\w’']+ (?:Centre|Tower|Building|Place))/.exec(f.building||'')||[])[1]].filter(Boolean).join(', ');
      if(!small) lab=`<g data-axolab="1">`+ln([lx,ly],[W-230,ly],INK,0.8)+`<text x="${W-222}" y="${(ly-4).toFixed(1)}" font-size="14" fill="${INK}">${esc(t1)}</text>`+(t2?`<text x="${W-222}" y="${(ly+13).toFixed(1)}" font-size="12" fill="${MUTE}">${esc(t2)}</text>`:'')+'</g>';
      label=mode==='floors'?(stEst?`Floor${num.length>1?'s':''} ${num.join(', ')} of about ${st} (storey count not published: estimated at 4 m a storey from the building’s height, our reading)`:`Floor${num.length>1?'s':''} ${num.join(', ')} of ${st}, our reading`):mode==='whole'?'the whole building':mode==='outline'?'type not confirmed: outline only':mode==='below'?`${below.join(', ')} (below grade; drawn as a band at ground level)`:fl.length?`data centre inside: floors ${fl.join(', ')} named, the storey count not published, so not placed`:'data centre inside: floors not published'; } }
  while(ti<TR.length) svg+=TR[ti++].s;
  svg+=ghosts+lab;
  if(!me) label='no building footprint found at this location in the City data (?)';
  const FL=B.fill||{n:0,cs:0}, src=B.foot?`Buildings within ${R3} m: City of Vancouver building footprints 2009, heights from City LiDAR 2022 (90th percentile of roof points) where measured (City of Vancouver Open Data).${FL.n?` Added from Public Safety Canada, Canada Structures (Open Government Licence – Canada), missing from the 2009 footprints: ${FL.n}${FL.n-FL.low-FL.cs?`, ${FL.n-FL.low-FL.cs} with heights from the same LiDAR`:''}.${FL.low?` ${FL.low} building${FL.low>1?'s':''} from Canada Structures 2024 not seen by the 2022 LiDAR, probably newer (Canada Structures’ height).`:''}${FL.cs?` ${FL.cs} outside the LiDAR (Canada Structures’ height).`:''}`:''}${cut?` One building in front is cut away at ${CUT} m so the facility shows.`:''}`
    :B.lidar?`Buildings: City of Vancouver LiDAR 2022, within ${R3} m.${cut?` One building in front is cut away at ${CUT} m so the facility shows.`:''}`
    :B.csE?`Buildings within ${R3} m: Public Safety Canada, Canada Structures (Open Government Licence – Canada), outlines and heights as given.${B.items.some(i=>i.hq)?` ${B.items.filter(i=>i.hq).length} building${B.items.filter(i=>i.hq).length>1?'s':''} with no height in Canada Structures, drawn one storey.`:''}${cut?` One building in front is cut away at ${CUT} m so the facility shows.`:''}`
    :`Buildings: City of Edmonton footprints and heights, within ${R3} m.${cut?` One building in front is cut away at ${CUT} m so the facility shows.`:''}`;
  const nb=me?`Named building: ${B.foot?'the City footprint(s) at the address':B.par?'its parcel at the LiDAR height (tower and podium not separated yet)':B.own&&B.own.near!=null?`the nearest footprint, ${B.own.near} m from the facility’s geocoded point (our reading)`:'the footprint at the facility’s location'}. ${label.charAt(0).toUpperCase()+label.slice(1)}.`:label;
  if(!small){ const wrap=(t,n)=>{ const o=[]; let l=''; for(const w of String(t).split(' ')){ if(l&&(l+' '+w).length>n){ o.push(l); l=w; } else l=l?l+' '+w:w; } if(l) o.push(l); return o; };    
    const ctxT=(B.roads&&B.roads.length?`Streets: City of ${f.city==='van'?'Vancouver':'Edmonton'} centrelines, drawn 9 m wide (a drawing choice).`:'')+(TR.length?` Trees: ${TR.length} from the City’s public trees (open data).`:'');
    const L=wrap(src,118).concat(wrap(nb,118)).concat(ctxT?wrap(ctxT.trim(),118):[]); L.forEach((t,i)=>{ svg+=`<text data-credit="1" x="${W-20}" y="${H-12-(L.length-1-i)*16}" font-size="12" fill="${MUTE}" text-anchor="end">${esc(t)}</text>`; }); }
  return {svg:`<svg viewBox="0 0 ${W} ${H}" width="${o.w||'100%'}" font-family="'IBM Plex Sans', system-ui, sans-serif" role="img" aria-label="Axonometric of ${esc(f.addr||f.name)} among its neighbours${mode==='floors'?', the data centre floor highlighted':''}">${svg}</svg>`,label,src,nb}; }

 
async function ctxMap(f,B,o){ o=o||{}; const W=o.W||704, H=o.H||704, half=240, p=B.p, bb=[p[0]-half,p[1]-half,p[0]+half,p[1]+half], fr=C.frame(bb,W,H,0), P=fr.P;
  const pth=Q=>Q.map((q,i)=>{ const [x,y]=P(q[0],q[1]); return (i?'L':'M')+x.toFixed(1)+' '+y.toFixed(1); }).join('')+'Z';
  const inbb=q=>q[0]>=bb[0]-50&&q[0]<=bb[2]+50&&q[1]>=bb[1]-50&&q[1]<=bb[3]+50;
  let par='', npar=0; const seen=new Set(); for(const k in BD.S.tiles){ if(!k.startsWith(f.city+':')) continue; for(const q of BD.S.tiles[k].par||[]){ const b=q.bb; if(!b||b[2]<bb[0]||b[0]>bb[2]||b[3]<bb[1]||b[1]>bb[3]) continue;
      const key=q.id+':'+q.r[0]; if(seen.has(key)) continue; seen.add(key); par+=pth(ringPts(q.r)); npar++; } }
  let bl='', me=''; for(const it of B.items){ if(!it.P.some(inbb)) continue; if(it.tgt&&it.mine!==false) me+=pth(it.P); else bl+=pth(it.P); }
  const st=await BD.streets(f.city); let sd=''; const lab=[];
  if(st) st.segs.forEach((g,si)=>{ let d='', inside=false; for(let i=2;i+1<g.length;i+=2){ const [x,y]=P(g[i],g[i+1]); if(x>-40&&x<W+40&&y>-40&&y<H+40) inside=true; d+=(i>2?'L':'M')+x.toFixed(1)+' '+y.toFixed(1); }
    if(!inside) return; sd+=d; const nm=st.names&&st.nameOf?st.names[st.nameOf[si]]:null; if(nm&&g.length>=6) lab.push({nm,g}); });
   
  const done=new Set(), at=[]; let names='';
  for(const {nm,g} of lab){ if(done.has(nm)||at.length>=24) continue; const k=2+2*Math.floor((g.length-2)/4), [X,Y]=P(g[k],g[k+1]), [X2,Y2]=P(g[Math.min(k+2,g.length-2)],g[Math.min(k+3,g.length-1)]);
    if(X<40||X>W-40||Y<40||Y>H-60||at.some(q=>Math.hypot(q[0]-X,q[1]-Y)<90)) continue; let an=Math.atan2(Y2-Y,X2-X)*180/Math.PI; if(an>90) an-=180; if(an<-90) an+=180;
    const t=nm.toLowerCase().replace(/\b[a-z]/g,c=>c.toUpperCase()).replace(/(\d)([A-Za-z]+)/g,(m,a,b)=>a+b.toLowerCase()).replace(/\b(Nw|Ne|Sw|Se)\b/g,m=>m.toUpperCase());
    names+=`<text x="${X.toFixed(1)}" y="${Y.toFixed(1)}" font-size="10.5" fill="#5F6166" stroke="#fff" stroke-width="3" paint-order="stroke" text-anchor="middle" dominant-baseline="middle" transform="rotate(${an.toFixed(1)} ${X.toFixed(1)} ${Y.toFixed(1)})">${esc(t)}</text>`; at.push([X,Y]); done.add(nm); }
  const [fx,fy]=P(p[0],p[1]), lx=Math.min(W-230,fx+70), ly=Math.max(30,fy-60), ad=String(f.addr||'').split(' (')[0], adS=ad.length>34?ad.slice(0,33)+'…':ad;
  const sb=100*fr.s, scale=`<g font-size="11" fill="${K.mute}"><rect x="20" y="${H-34}" width="${(sb/2).toFixed(1)}" height="4" fill="${K.ink}"/><rect x="${(20+sb/2).toFixed(1)}" y="${H-34}" width="${(sb/2).toFixed(1)}" height="4" fill="#fff" stroke="${K.ink}" stroke-width="0.8"/><text x="20" y="${H-18}">0</text><text x="${(20+sb).toFixed(1)}" y="${H-18}" text-anchor="end">100 m</text></g>`;
  const north=`<g transform="translate(${W-34},40)"><path d="M0 -18 L7 6 L0 1 L-7 6 Z" fill="${K.ink}"/><text x="0" y="22" font-size="11" fill="${K.ink}" text-anchor="middle">N</text></g>`;
  const svg=`<svg viewBox="0 0 ${W} ${H}" width="100%" font-family="'IBM Plex Sans', system-ui, sans-serif" role="img" aria-label="Map of ${esc(f.addr||f.name)} and the blocks around it, north up">
    <defs><clipPath id="cm${f.id}"><rect width="${W}" height="${H}"/></clipPath></defs><rect width="${W}" height="${H}" fill="#F6F5F2"/>
    <g clip-path="url(#cm${f.id})"><path d="${par}" fill="none" stroke="#D9D8D3" stroke-width="0.6"/><path d="${sd}" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="${sd}" fill="none" stroke="#C9CACC" stroke-width="0.8"/>
    <path d="${bl}" fill="#E4E3DF" stroke="#A9ABAF" stroke-width="0.5"/><path d="${me}" fill="${BLUE}" stroke="${K.ink}" stroke-width="1"/>${names}</g>
    <line x1="${fx.toFixed(1)}" y1="${fy.toFixed(1)}" x2="${lx}" y2="${ly}" stroke="${K.ink}" stroke-width="0.8"/><text x="${lx+4}" y="${ly-4}" font-size="13" fill="${K.ink}" stroke="#fff" stroke-width="3" paint-order="stroke">${esc(f.name)}</text><text x="${lx+4}" y="${ly+11}" font-size="11" fill="${K.mute}" stroke="#fff" stroke-width="3" paint-order="stroke">${esc(adS)}</text>
    ${north}<rect x="14" y="${H-44}" width="${(sb+24).toFixed(0)}" height="34" fill="#F6F5F2" opacity="0.9"/>${scale}</svg>`;
  const parSrc=f.city==='van'?'City of Vancouver property parcels (open data)':window.BD_PUBLIC?'not shown (Edmonton lot outlines are not open data)':'licensed lot data (local only; academic use, not for redistribution)';
  const blSrc=B.foot?'City of Vancouver building footprints 2009, with buildings missing from them added from Public Safety Canada, Canada Structures (2024)':B.csE?'Public Safety Canada, Canada Structures (2024; Open Government Licence – Canada)':'City of Edmonton rooflines';
  const cap=`Map about ${2*half} m across, north up. Buildings: ${blSrc}. Parcels: ${npar?parSrc:'none in the tool here'}. Streets: City of ${f.city==='van'?'Vancouver':'Edmonton'} street centrelines and names (open data).`;
  return {svg,cap}; }
PICK._block=block; PICK._axo=axo; PICK._ctxMap=ctxMap; PICK._geo={earTri,clipToParcel,dedupe,areaP,ccwP};    
 
const v=(t)=>t&&String(t).trim()&&String(t).trim()!=='?'?t:NP;
function sizeWords(f){ const s=f.size, mw=s.mw[0]===s.mw[1]?String(s.mw[0]):s.mw[0]+'–'+s.mw[1], sc=String(s.scope||'');
  const fig=/^up to$/i.test(sc)?`up to ${mw} MW`:/IT$/i.test(sc)?`${mw} MW of servers`:/^total$/i.test(sc)?`${mw} MW in total`:/^initial$/i.test(sc)?`${mw} MW at first`:`${mw} MW ${sc}`.trim();
  const m=/^(.*?)\s*\((.*)\)\s*$/.exec(String(s.label||'')), main=m?m[1]:String(s.label||''), extra=m?m[2]:'';
  return `${fig}${main?` (${main})`:''}${extra?`; ${extra}`:''}`+(/implausible/i.test(f.sizeText||'')?'. The two figures don’t agree.':''); }    
function factRows(f){ const sz=f.size?sizeWords(f):v(f.sizeText);
  return [['Name',f.name],['Operator',v(f.operator)],['Status',v(f.statusText)],['Address',(f.addr||'address not confirmed')+(f.addrNote?' · '+f.addrNote:'')+(f.placed?' · '+f.placed:'')+(f.alsoTenant?' · '+f.alsoTenant:'')],
    ['Type',TYPE[f.type]+(f.typeNote?' ('+f.typeNote+')':'')+(f.fenced?' · fenced site: '+f.fenced.text:'')],['Floors',f.floors?f.floors.text:(f.type==='standalone'?'the whole building':NP)],
    ['Size',sz],['Cooling and backup power',v(f.cooling)],['Heat reuse',v(f.heat)],['Who it serves',v(f.serves)],['Opened',v(f.opened)],['Building',v(f.building)]].map((r,i)=>i?[r[0],(t=>C.pub?C.pub(t):t)(C.words(r[1]).replace(/&quot;/g,'"').replace(/&amp;/g,'&'))]:r); }        
const srcLine=f=>{ const ids=(f.src||[]).concat((f.size&&f.size.src)||[],(f.floors&&f.floors.src)||[],(f.fenced&&f.fenced.src)||[]).filter((s,i,a)=>a.indexOf(s)===i); return ids.length?'This facility’s sources (register ids): '+ids.join(', ')+'.':null; };
C.add(T,'What it is',{async build(x){
  const f=await picked(x); if(!f) return {draw:'<p class="f1v-empty">No data centre on record in this city.</p>'};
  const B=f.inMap?await block(f):null, A=B?axo(f,B):null;
  const draw=A?`<figure class="f1c-res-axo">${A.svg}</figure>`
    :`<div style="max-width:560px;margin:40px auto"><p class="f1v-empty" style="text-align:left">${esc(f.name)} is not on the map: ${esc(f.addrNote||f.where||'its location is not confirmed')}.</p></div>`;
  return {noZoneFlag:true,draw,lead:`${f.name}${f.operator?', run by '+(C.words(f.operator)||f.operator):''}: ${STAT[f.status]||f.status}. ${TYPE[f.type].charAt(0).toUpperCase()+TYPE[f.type].slice(1)}. Facts as the sources state them; missing ones are “not published”.`,
    rows:factRows(f),    
    src:[SRC_INV,SRC_PLACE,srcLine(f)].filter(Boolean).concat([`3-D massing: ${B&&B.foot?'City of Vancouver building footprints 2009 with City LiDAR 2022 heights (90th percentile of roof points), and buildings missing from them added from Public Safety Canada, Canada Structures 2024 (heights from the same LiDAR where it saw them)':B&&B.csE?'Public Safety Canada, Canada Structures 2024 (Open Government Licence – Canada), outlines and heights as given':'the City footprints the tool holds'}. Floors drawn only where a source names them and gives the storey count, at height × floor ÷ storeys (our reading; project decision, 11 Nov 2026).`]),missing:[]}; }});

 
const PARTS=[
 {k:'rack',n:'Servers in racks',does:'The computers. Almost all the power they draw leaves as heat.',needs:'power, cool air in front, warm air out the back',re:/server|rack|colocation|suite|cabinet|ft²|ft2|white space|IT load/i,always:true},
 {k:'crah',n:'Cooling: room units',does:'Units along the walls or between the racks take the heat out of the room air into a water or glycol loop, or straight outdoors.',needs:'floor space beside the racks, a pipe or refrigerant loop, power',re:/CRAC|CRAH|in-row|perimeter|room unit|air handler|computer room air/i},
 {k:'dry',n:'Cooling: outdoor units',does:'Dry coolers, chillers or towers release the heat to the outdoor air, usually on the roof or in a yard.',needs:'roof or yard space, open air around them, power; water for towers',re:/dry cooler|chiller|cooling tower|condenser|evaporat|free cooling|adiabatic/i,kAlt:t=>/chiller/i.test(t)?'chill':'dry'},
 {k:'ups',n:'UPS (battery-backed power)',does:'Keeps the servers running in the seconds between a power cut and the generators starting.',needs:'its own room, cooling, batteries behind it',re:/\bUPS\b|uninterrupt/i},
 {k:'battery',n:'Batteries',does:'Store the energy the UPS uses for those first minutes.',needs:'a fire-separated room, cooling',re:/batter|li-ion|lithium|VRLA/i},
 {k:'genset',n:'Standby generators',does:'Diesel engines that take over when the grid fails; they are run now and then for testing (each city’s noise by-law sets when tests may run).',needs:'fuel on site, air, a place where noise and exhaust can go',re:/generator|genset|diesel/i},
 {k:'transformer',n:'Utility power',does:'Feeds from the electric utility; transformers step the voltage down for the building.',needs:'a vault or pad, clearances, a utility connection',re:/\bkV\b|feeder|feed|substation|transformer|BC Hydro|EPCOR|utility power/i}];
function partHere(f,P){ const txt=[f.cooling,f.sizeText,f.serves,f.building].filter(Boolean).join('; ');
  if(!P.re.test(txt)) return P.always&&(f.src||[]).length?{here:'a data centre’s servers; rack count ?',src:'the facility’s listing'}:null;
  const bits=txt.split(/;\s*|,\s+|\s+(?:and|with|plus|to)\s+/).filter(b=>P.re.test(b)).map(b=>C.words(b).replace(/&quot;/g,'"').replace(/&amp;/g,'&')).filter(Boolean);
  const here=bits.join('; ').replace(/\s+/g,' ').slice(0,180);
  const code=/\bOC\b/.test(txt)?'operator':/\bGOV\b/.test(txt)?'government record':/\bBRK\b/.test(txt)?'broker':'the facility’s sources';    
  return {here:here+(/\d[\d,.]*\s*(?:kW|MW|kV|kVA|ton|ft²|m²|L\b|kWh|MWh|%)/.test(here)?'':'; size ?'),src:code,kind:P.kAlt?P.kAlt(txt):P.k}; }
 
C.add(T,'What it means next door',{async build(x){
  const f=await picked(x); if(!f) return {draw:'<p class="f1v-empty">No data centre picked.</p>'};
  let ring=null, zone=null, own=null; if(f.city==='van'&&f.parcel){ try{ const t=await BD.loadTile('van',f.parcel.tile), q=t&&t.par.find(z=>z.id===f.parcel.id); if(q){ ring=q.r; own=q.id; const a=t.A[q.id]; zone=a?String(a[1]||'').trim()||null:null; } }catch(e){} }
  let N=null; try{ if(ring&&BD.f1noiseAround) N=await BD.f1noiseAround(f.city,ring,zone,own); }catch(e){}
  const gen=((BD.data.raw.noise||{}).gen||{})[f.city], gp=partHere(f,PARTS.find(P=>P.k==='genset')), lf=(BD.eng.R&&BD.eng.R.lfR&&BD.eng.R.lfR[0]<1&&BD.eng.R.lfR[1]<1)?BD.eng.R.lfR:[0.4,0.6],     mw=f.size&&f.size.mw;
  const heat=mw?[mw[0]*8760*lf[0],mw[1]*8760*lf[1]]:null, n0=v=>Math.round(v).toLocaleString('en-CA'), P=(BD.f1proc||{})[f.city]||{}, zc=zone&&BD.f1zoneClass?BD.f1zoneClass(f.city,zone):null, st=zc?{word:zc.name.toLowerCase()}:null, rz=!!(zc&&/rezoning/i.test(zc.name)), rzStep=rz&&P.rezone?P.rezone.find(r=>/hearing/i.test(r.n)):null;
  const NP2='not published', G=N&&(N.gov||N.strict), noiseTxt=N&&N.gov?`${N.gov.L} dBA at night at ${N.gov.addr||'the lot next door'}${N.adj.length>1?` (the strictest of the ${N.adj.length} lots next door)`:''}`:N&&N.near?`no lot shares a boundary; the strictest nearby is ${N.strict.L} dBA at night, ${Math.round(N.strict.d)} m away${N.strict.addr?' ('+N.strict.addr+')':''}; the nearest lot, ${Math.round(N.near.d)} m away across the lane or street${N.near.addr?' ('+N.near.addr+')':''}, has ${N.near.L} dBA`:N?'no lot within '+N.R+' m on record':f.city==='edm'?'not in the public data (Edmonton lot outlines are licensed, local only)':NP2;
  const genRule=f.city==='van'?(gen?`tests up to ${gen.test.v} dBA where it is heard, once a month for up to an hour in the daytime, plus once a year for up to three hours (Noise Control By-law 6555 s. 4.1(c))`:NP2)
    :(gen?`daytime tests up to ${gen.resTest1h.v} dB(A) at homes and ${gen.nonTest1h.v} at other lots, an hour a day; no allowance at night (Bylaw C14600)`:NP2);
  const tile=(h,v,s)=>`<div class="f1c-res-nd"><div class="h">${esc(h)}</div><div class="v">${esc(v)}</div><div class="s">${esc(s)}</div></div>`;
  const draw=`<div class="f1c-res-ndw">${tile(N&&!N.gov&&N.strict?'Strictest noise limit nearby':'Noise at the lot line',G?G.L+' dBA at night':f.city==='edm'?'no public lot data':NP2,'the limit, not a measurement'+(G&&G.sec?': '+G.sec:''))}${tile('Heat given off',heat?`about ${n0(heat[0])}–${n0(heat[1])} MWh a year`:NP2,'nearly all the power its servers draw ends up as heat')}${tile('A new data centre here',st?st.word:'zone not in the public data',rz?'neighbours: a public hearing':P.notice?'neighbours: '+P.notice.split(/\. (?=[A-Z])/)[0]:'')}</div>`;
  const sq=f.size&&/operator|claim/i.test(f.size.label||'')?50:f.size&&/GOV|government/.test(f.size.label||'')?80:50, R9=[90,'the City’s by-law, read directly'];
  const trust={'Noise limit next door':R9,'Quietest limit nearby':R9,'Generator testing (the City’s rule)':R9,'Heat given off':[Math.min(sq,80),'the facility’s size as its source states it ('+(f.size&&f.size.label||'?')+'), times the average load (80, research figure)'],'Zone and approval':[80,'the City’s zoning data'],'Notices neighbours get':[90,'the by-law or charter, read directly']};
  return {noZoneFlag:true,trust,draw,lead:'What a data centre here means for the people next door: the noise limit at their lot line, generator tests and exhaust, the heat it gives off, and the permits and notices they get. Rules from the City’s by-laws; facts about this facility as its sources state them.',
    rows:[['Noise limit next door',noiseTxt],['Quietest limit nearby',N&&N.strict?`${N.strict.L} dBA at night, ${N.strict.d<1?'next door':Math.round(N.strict.d)+' m away'}${N.strict.addr?' ('+N.strict.addr+')':''}`:NP2],['Measured noise from this facility',NP2],
      ['Generator testing (the City’s rule)',genRule],['Generators here',gp?gp.here:NP2],['Exhaust','diesel exhaust during tests and outages; the tool has no air-permit data for this site: '+NP2],
      ['Heat given off',heat?`about ${n0(heat[0])}–${n0(heat[1])} MWh a year, about what its servers draw (${mw[0]===mw[1]?mw[0]:mw[0]+'–'+mw[1]} MW × 8,760 h × ${lf[0]}–${lf[1]} average load)`:NP2],['Heat reuse',v(f.heat)],
      ['Zone and approval',zone?`${zone}: a new data centre here ${st?st.word:'?'}${rz?`: ${rzStep?rzStep.w:'Council'} decides at a public hearing${rzStep?' ('+rzStep.c+')':''}`:P.decides?'; '+P.decides+' decides':''}`:(f.city==='edm'?'zone not in the public data here':NP2)],['Notices neighbours get',(rzStep?`for a rezoning, a public hearing (${rzStep.c}). Then for the permit: `:'')+(P.notice||NP2)],['This facility’s permit or status',v(f.statusText)]],
    src:['Noise: the same rule as the Municipal card “Noise limits around the lot” (Vancouver Noise Control By-law 6555 ss. 2.3, 4.1(c); Edmonton Bylaw C14600); the limit at each lot, not a measurement.','Heat given off: the servers’ power over a year, size × 8,760 h × the average load 0.4–0.6 (the same load as the Engineering cards). The Engineering card “Heat offered” is larger: it adds the heat pumps’ own electricity.','Approval and notices: the Municipal card “Approval process” (Zoning and Development By-law s. 4; Edmonton Zoning Bylaw 20001 s. 7.160).',SRC_INV],
    missing:['measured noise from this facility','air permit and exhaust data','the permits this facility actually holds, where not in its sources']}; }});
C.add(T,'What’s inside',{async build(x){
  const f=await picked(x); if(!f) return {draw:'<p class="f1v-empty">No data centre picked.</p>'};
  const rows=PARTS.map(P=>({P,h:partHere(f,P)}));
  const tile=({P,h})=>`<figure class="f1c-res-part${h?'':' off'}"><img src="f1/kit/one_${h&&h.kind||P.k}.png" width="300" height="210" alt="${esc(P.n)}: a generic unit"><figcaption><b>${esc(P.n)}</b><span class="d">${esc(P.does)}</span><span class="n">Needs: ${esc(P.needs)}</span><span class="h">Here: ${h?esc(h.here).replace(/\?/g,'<i>?</i>'):'<i>not published</i>'}</span><span class="s">${h?esc(h.src):'no source names it'}</span></figcaption></figure>`;
  const named=rows.filter(r=>r.h).length, SPEC=/\d[\d,.]*\s*(?:kW|MW|kV|kVA|ton|ft²|m²|L\b|kWh|MWh|%)/, specs=rows.filter(r=>r.h&&SPEC.test(r.h.here)).length;    
  return {noZoneFlag:true,draw:`<div class="f1c-res-parts">${rows.map(tile).join('')}</div>`,
    lead:`The equipment the sources name for ${f.name}, drawn as generic units: what each part does and what it needs. Types only, not counts; “?” where a spec is not published.`,
    rows:[['Named by a source',`${named} of ${PARTS.length} parts`],['Specs published',specs?`${specs} with a figure; the rest read “?”`:'none: every spec reads “?”'],['Drawings','generic units from the tool’s 3-D kit, not this facility’s models'],['Heat reuse',esc(C.words(v(f.heat)))]],
    more:[['How the parts connect: power in, heat out','<p>Power comes in from the utility through transformers, passes the UPS (batteries behind it, generators for longer outages) and reaches the servers. Almost all of it leaves the servers as heat: room units move it into a loop, and the outdoor units release it to the air unless a neighbour takes it.</p>'],
          ['Why the specs are missing','<p>Operators publish little about their equipment; permits name units without sizes, and spec sheets are claims. The card shows what a source names and marks the rest “?”; nothing is estimated.</p>']],
    src:[SRC_INV,srcLine(f),'Drawings: the tool’s 3-D kit (generic units at their real scale class), rendered one at a time; not this facility’s equipment. Parts: named only where the facility’s sources name them (types, not counts).'].filter(Boolean),missing:[]}; }});

 
const SCOPE=s=>/IT/.test(s)?'MW of IT':/grid|requested|allocation/.test(s)?'MW requested or allocated from the grid':'MW of site capacity or design';
C.add(T,'Report',{async build(x){
  const f=await picked(x); if(!f) return {draw:'<p class="f1v-empty">No data centre picked.</p>'};
  const B=f.inMap?await block(f):null, A=B?axo(f,B,{small:true,w:300}):null, city=f.city;
  const rows=factRows(f).map(r=>`<tr><th>${esc(r[0])}</th><td>${esc(r[1])}</td></tr>`).join('');
   
  const compareChart=(f,city)=>{ let p3='<p class="ld">This facility publishes no size figure: no chart.</p>';
  if(f.size){ const kind=SCOPE(f.size.scope), L=FAC(city).filter(g=>g.size&&SCOPE(g.size.scope)===kind).sort((a,b)=>b.size.mw[1]-a.size.mw[1]), none=FAC(city).length-L.length, mx=Math.max(...L.map(g=>g.size.mw[1]));
    const bw=260, rh=16; p3=`<div class="lb">${esc(kind)}, ${esc(CITYN[city])} (${L.length} facilities; ${none} publish no figure of this kind)</div><svg viewBox="0 0 ${bw+180} ${L.length*rh+8}" width="100%" role="img" aria-label="${esc(kind)}">`+
      L.map((g,i)=>{ const me=g.id===f.id, a=g.size.mw[0]/mx*bw, b=g.size.mw[1]/mx*bw, y=i*rh+4; return `<text x="0" y="${y+11}" font-size="10" fill="${me?K.ink:K.mute}">${esc(g.name.slice(0,24))}</text><rect x="150" y="${y+3}" width="${Math.max(1,a).toFixed(1)}" height="9" fill="${me?K.ink:K.neut}"/>${b>a+0.5?`<rect x="${(150+a).toFixed(1)}" y="${y+3}" width="${(b-a).toFixed(1)}" height="9" fill="none" stroke="${me?K.ink:K.neut}"/>`:''}<text x="${(156+b).toFixed(1)}" y="${y+11}" font-size="10" fill="${me?K.ink:K.mute}">${g.size.mw[0]===g.size.mw[1]?g.size.mw[0]:g.size.mw[0]+'–'+g.size.mw[1]}</text>`; }).join('')+`</svg><p class="ld">Each figure as its source gives it (claims labelled on page 1); an outlined end is the range where sources differ.</p>`; } return p3; };
   
  const AB=B?axo(f,B,{W:704,H:560}):null, CM=B?await ctxMap(f,B):null;    
   
  const card=async t=>{ const sp=C.get(T,t); if(!sp) return null; try{ return await sp.build(x); }catch(e){ console.warn('resident report',t,e); return null; } };
  if(BD.f1trust) await BD.f1trust.ready(); const TC=BD.f1trust&&BD.f1trust.cell;    
  const W1=await card('What it is'), W2=await card('What’s inside'), W3=await card('What it means next door'), tbl=(r,ct)=>(r&&(r.rows||[]).length)?`<table class="f1c-res-t">${r.rows.map(q=>`<tr><th>${esc(q[0])}</th><td>${typeof q[1]==='string'&&!/<[a-z\/]/i.test(q[1])?esc(q[1]):q[1]}${TC&&ct?TC('resident',ct,q[0],q[1],r):''}</td></tr>`).join('')}</table>`:'';
  const PG=[[f.name,`${AB?AB.svg.replace(/min-width:s*d+px;?/,'max-width:100%;height:auto;'):''}<p class="ld">${esc(W1&&W1.lead||'')}</p>`,'cover: the building in 3-D'],
    ['What it is',tbl(W1,'What it is')||`<table class="f1c-res-t">${rows}</table>`,'what it is, as the sources state it'],
    ...(W2&&W2.draw?[['What’s inside',`<p class="ld">${esc(W2.lead||'')}</p><div class="f1r-dr">${W2.draw}</div>${tbl(W2,'What’s inside')}`,'what’s inside: the equipment the sources name']]:[]),
    ...(W3&&(W3.rows||[]).length?[['What it means next door',`<p class="ld">${esc(W3.lead||'')}</p>${tbl(W3,'What it means next door')}`,'what it means next door: noise, generators, heat, permits']]:[]),
    ['Where it is',CM?`${CM.svg}<p class="ld">${esc(CM.cap)}</p>`:`<p class="ld">Not on the map: ${esc(f.addrNote||f.where||'location not confirmed')}.</p>`,'where it is: a map of the blocks around it'],
    ['Sources',[...new Set([SRC_INV,SRC_PLACE,srcLine(f)].concat(W1&&W1.src||[],W2&&W2.src||[],W3&&W3.src||[]).filter(Boolean))].map(q=>`<p class="ld">${C.pubSrc(q)}</p>`).join('')+(BD.f1trust?BD.f1trust.LEG:'')+(CM?`<p class="ld">${esc(CM.cap)}</p>`:'')+`<p class="ld" style="margin-top:14px">${esc(BD.F1LICENCE||'')}</p>`,'sources']];
  { const k=PG.findIndex(q=>/class="f1-tr"/.test(q[1])); if(k>=0&&BD.f1trust&&BD.f1trust.LINE) PG[k][1]=BD.f1trust.LINE+PG[k][1]; }    
  const NP=PG.length, WORD=['','One','Two','Three','Four','Five','Six','Seven','Eight'][NP]||String(NP);
   
  const pg=(n,t,body)=>BD.f1reportPage({n,total:NP,title:t,head:`BEYOND DATA · RESIDENT REPORT · ${String(f.name).toUpperCase()}`,body:n===1?`<h1>${esc(t)}</h1>${body}`:body,cover:n===1});
  const draw=`<div class="f1r-pages">${PG.map((q,i)=>pg(i+1,q[0],q[1])).join('')}</div>
    <button class="f1c-mua-print" type="button" onclick="window.print()">Print the report</button>`;
  return {noZoneFlag:true,draw,lead:`${WORD} pages: ${PG.map(q=>q[2].split(':')[0].replace('what it is, as the sources state it','what it is')).join(', ').replace(/, ([^,]*)$/,', and $1')}. No comparisons to homes or cars (no sourced conversion). Print or save as PDF.`,
    hero:[{v:String(NP),l:'pages'}],rows:PG.map((q,i)=>[`Page ${i+1}`,q[2]]),
    src:[SRC_INV,SRC_PLACE,srcLine(f)].filter(Boolean),missing:[]}; }});
})();

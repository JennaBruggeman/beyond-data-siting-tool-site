 
(function(){
const BD=window.BD=window.BD||{};
const J={}; const get=f=>J[f]||(J[f]=fetch((BD.ASSET_BASE||'')+f).then(r=>r.ok?r.json():null).catch(()=>null));
 
async function placeOf(lot,plan,city){ city=city||'van'; const id=String(plan||''); if(!id) return null;
  const B=await get(`data/lib_best_${city}.json`), e=B&&B.index&&B.index[String(lot)];
  const cand=[]; if(e){ cand.push(e.best,...(e.alternatives||[])); for(const b of Object.values(e.byDensity||{})){ if(b){ cand.push(b.best||b,...((b.alternatives)||[])); } } }
  let hit=cand.find(c=>c&&String(c.plan)===id&&c.place);
  if(!hit){ const L=await get(`data/lib_lots_${city}.json`), l=L&&L.lots&&L.lots[String(lot)]; if(l) for(const v of Object.values(l.byTypology||{})){ if(!v||typeof v!=='object') continue; for(const c of [v,...Object.values(v.byDensity||{})]) if(c&&String(c.plan)===id&&c.place){ hit=c; break; } if(hit) break; } }
  return hit?{placement:hit.placement||'default',place:hit.place}:null; }
 
async function siteHere(x){ if(!BD.hub||!BD.hub.siteOf||!x||!x.arch) return null; const P=await x.arch(); if(!P||!P.s) return null; const S=BD.hub.siteOf(P); if(!S||!S.ring||S.ring.length<3) return null;
  let north=null; try{ const F=S.F, c=F.toW(0,0), n=F.toW(0,0); const a=F.toL(c[0],c[1]), b=F.toL(n[0],n[1]+1); const d=[b[0]-a[0],b[1]-a[1]], L=Math.hypot(d[0],d[1])||1; north=[+(d[0]/L).toFixed(3),+(d[1]/L).toFixed(3)]; }catch(e){}
  return {lot:S.ring,edges:(S.edges||[]).map(e=>({kind:e.kind,abuts:e.abuts,a:e.a,b:e.b,yard:e.d})),north}; }
 
function onLot(raw,pl,site){ if(!raw||!pl||!pl.place||!site) return null; const m=pl.place.m||[1,0,0,1], t=pl.place.t||[0,0];
  const T=(u,v)=>[m[0]*u+m[1]*v+t[0], m[2]*u+m[3]*v+t[1]], r2=x=>Math.round(x*100)/100;
  const q=JSON.parse(JSON.stringify(raw)), pt=a=>{ if(!Array.isArray(a)||a.length<2) return; const w=T(+a[0],+a[1]); a[0]=r2(w[0]); a[1]=r2(w[1]); };
  const rect=r=>{ if(!Array.isArray(r)||r.length<4) return; const A=T(r[0],r[2]), B=T(r[1],r[3]); r[0]=r2(Math.min(A[0],B[0])); r[1]=r2(Math.max(A[0],B[0])); r[2]=r2(Math.min(A[1],B[1])); r[3]=r2(Math.max(A[1],B[1])); };
  const rings=R=>(R||[]).forEach(ring=>(ring||[]).forEach(pt));
  for(const s of q.storeys||[]){ for(const z of s.zones||[]){ (z.rects||[]).forEach(rect); rings(z.rings); }
    for(const k of ['circulation','separations']) for(const c of (Array.isArray(s[k])?s[k]:[])){ if(Array.isArray(c.rects)) c.rects.forEach(rect); if(Array.isArray(c.rect)) rect(c.rect); rings(c.rings); if(Array.isArray(c.a)) pt(c.a); if(Array.isArray(c.b)) pt(c.b); if(Array.isArray(c.line)) c.line.forEach(pt); } }
  if(q.yard){ rings(q.yard.rings); if(q.yard.truckCourt&&Array.isArray(q.yard.truckCourt.rect)) rect(q.yard.truckCourt.rect); }
  if(Array.isArray(q.court)) rect(q.court);
  if(q.truckAccess&&Array.isArray(q.truckAccess.path)) q.truckAccess.path.forEach(pt);
  for(const d of q.doors||[]) if(Array.isArray(d.at)) pt(d.at);
  if(q.street&&Array.isArray(q.street.door)) pt(q.street.door);
  q.site=Object.assign({},q.site||{},{lot:site.lot,edges:site.edges,north:site.north||null,lotAreaM2:null});
   
  const fr=site.edges.filter(e=>e.kind==='front'); if(fr.length){ const mu=fr.reduce((s,e)=>s+(e.a[0]+e.b[0])/2,0)/fr.length, mv=fr.reduce((s,e)=>s+(e.a[1]+e.b[1])/2,0)/fr.length;
    q.street=Object.assign({},q.street||{},{side:Math.abs(mu)>=Math.abs(mv)?(mu<0?'u-low':'u-high'):(mv<0?'v-low':'v-high')}); }
   
  const lotA=Math.abs(site.lot.reduce((s,p,i)=>{ const n=site.lot[(i+1)%site.lot.length]; return s+p[0]*n[1]-n[0]*p[1]; },0))/2;
  if(q.yard) q.yard=Object.assign({},q.yard,{pctOfLot:lotA>0&&+q.yard.area>0?Math.round(+q.yard.area/lotA*100):undefined}); q.site.lotAreaM2=lotA?Math.round(lotA):null;
  if(q.yard&&q.yard.truckCourt&&lotA>0&&+q.yard.truckCourt.area>0) q.yard.truckCourt=Object.assign({},q.yard.truckCourt,{pctOfLot:Math.round(+q.yard.truckCourt.area/lotA*100)});
  q._placed=pl.placement; return q; }
 
function outside(q,tol){ tol=tol==null?0.05:tol; const R=q&&q.site&&q.site.lot; if(!R) return null; const pts=[];
  for(const s of q.storeys||[]) for(const z of s.zones||[]) for(const ring of z.rings||[]) for(const p of ring) pts.push(p);
  for(const ring of (q.yard&&q.yard.rings)||[]) for(const p of ring) pts.push(p); const c=q.court; if(Array.isArray(c)) pts.push([c[0],c[2]],[c[1],c[2]],[c[1],c[3]],[c[0],c[3]]);
  const pip=p=>{ let k=false; for(let i=0,j=R.length-1;i<R.length;j=i++){ const [xi,yi]=R[i],[xj,yj]=R[j]; if((yi>p[1])!==(yj>p[1])&&p[0]<(xj-xi)*(p[1]-yi)/(yj-yi)+xi) k=!k; } return k; };
  const dseg=(p,a,b)=>{ const dx=b[0]-a[0], dy=b[1]-a[1], L=dx*dx+dy*dy; let s=L?((p[0]-a[0])*dx+(p[1]-a[1])*dy)/L:0; s=Math.max(0,Math.min(1,s)); return Math.hypot(p[0]-a[0]-s*dx,p[1]-a[1]-s*dy); };
  let worst=0; for(const p of pts){ if(pip(p)) continue; let d=Infinity; for(let i=0;i<R.length;i++) d=Math.min(d,dseg(p,R[i],R[(i+1)%R.length])); worst=Math.max(worst,d); } return worst>tol?worst:0; }
 
const WORDS={default:'',shifted:'moved along the lot to fit',mirrored:'mirrored to fit','mirrored+shifted':'mirrored and moved to fit'};
async function placedFor(x){ try{ if(!x||x.city!=='van'||!x.sel||!BD.f1pick3||!BD.f1pick3.chosen) return null; const raw=await BD.f1pick3.chosen(x,{raw:true}); if(!raw||!raw.id) return null;
  const away=BD.f1best&&BD.f1best.away?BD.f1best.away(raw.id,String(x.sel.id)):false; if(!away) return null;
  const pl=await placeOf(x.sel.id,raw.id,'van'); if(!pl) return null; const site=await siteHere(x); const q=onLot(raw,pl,site); if(!q) return null;
  return {q,pl,out:outside(q),words:WORDS[pl.placement]||''}; }catch(e){ console.warn('f1place',e); return null; } }
 
const note=P=>P?`A library layout drawn where it fits on this lot${P.words?' ('+P.words+')':''}; not re-planned for it.${P.out?` One corner sits ${P.out.toFixed(2)} m past the lot line in the stored placement: being checked.`:''}`:'';
BD.f1place={placeOf,siteHere,onLot,outside,placedFor,note};
})();

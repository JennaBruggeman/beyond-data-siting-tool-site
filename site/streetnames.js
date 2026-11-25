 
(function(root){
'use strict';
const PROBE=35, MIN_EDGE=0.5, MIN_VOTES=2, LANE=/^(lane|alley)$/i;
const DIR=/^(N|S|E|W|NE|NW|SE|SW)$/;
function pip(x,y,r){ let c=false; for(let i=0,j=r.length-2;i<r.length;j=i,i+=2){ const xi=r[i],yi=r[i+1],xj=r[j],yj=r[j+1]; if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi)) c=!c; } return c; }
function sarea(r){ let s=0; for(let i=0,j=r.length-2;i<r.length;j=i,i+=2) s+=(r[j]*r[i+1]-r[i]*r[j+1]); return s/2; }
 
function streetOf(addr){ const s=String(addr||'').replace(/,.*$/,'').trim().replace(/\s+/g,' '); if(!/^\S*\d\S*\s+\S/.test(s)) return null; const t=s.replace(/^\S*\d\S*\s+/,'').trim(); return t||null; }
 
function fmt(n){ return String(n||'').split(' ').map(w=>DIR.test(w)?w:/^\d/.test(w)?w.toLowerCase():w.charAt(0)+w.slice(1).toLowerCase()).join(' '); }
 
function piecesNear(G,cx,cy,R){ const P=[]; G.segs.forEach((g,si)=>{ for(let i=2;i+3<g.length;i+=2){ const x0=g[i],y0=g[i+1],x1=g[i+2],y1=g[i+3]; if(Math.min(x0,x1)>cx+R||Math.max(x0,x1)<cx-R||Math.min(y0,y1)>cy+R||Math.max(y0,y1)<cy-R) continue; P.push([x0,y0,x1,y1,si]); } }); return P; }
 
function facing(P,ax,ay,bx,by,ccw,blocked){ const dx=bx-ax, dy=by-ay, L=Math.hypot(dx,dy); if(L<MIN_EDGE) return null; const nx=ccw?dy/L:-dy/L, ny=ccw?-dx/L:dx/L, mx=(ax+bx)/2, my=(ay+by)/2; let best=null;
  for(const [x0,y0,x1,y1,si] of P){ const ux=x1-x0, uy=y1-y0, l2=ux*ux+uy*uy||1; let t=((mx-x0)*ux+(my-y0)*uy)/l2; t=Math.max(0,Math.min(1,t)); const px=x0+ux*t, py=y0+uy*t, vx=px-mx, vy=py-my, d=Math.hypot(vx,vy);
    if(d>PROBE||d<1e-6||(vx*nx+vy*ny)<0.5*d) continue; if(best&&d>=best.d) continue; if(blocked&&blocked(mx+vx*0.5,my+vy*0.5)) continue; best={si,d}; }
  return best; }
 
function nameNear(G,tiles,city,cx,cy,R){ const RP=R+PROBE+120, P=piecesNear(G,cx,cy,R+PROBE), lots=[];
  for(const k in tiles){ if(!k.startsWith(city+':')) continue; const T=tiles[k]; for(const p of T.par){ const b=p.bb; if(b[0]>cx+RP||b[2]<cx-RP||b[1]>cy+RP||b[3]<cy-RP) continue;
      const ids=p.ids||[p.id], addrs=[]; for(const id of ids){ let a=T.A&&T.A[id]; if(!a) for(const k2 in tiles){ if(k2.startsWith(city+':')&&tiles[k2].A&&tiles[k2].A[id]){ a=tiles[k2].A[id]; break; } } const s=a&&a[0]?String(a[0]).trim():''; if(s&&!addrs.includes(s)) addrs.push(s); }
      if(addrs.length) lots.push({r:p.r,bb:b,addrs}); } }
  const inOther=(me,x,y)=>lots.some(q=>q!==me&&!q.addrs.some(a=>me.addrs.includes(a))&&x>=q.bb[0]&&x<=q.bb[2]&&y>=q.bb[1]&&y<=q.bb[3]&&pip(x,y,q.r));
  const cls=G.classes||[], isLane=si=>LANE.test(cls[G.segs[si][0]]||'');
   
  const FR=new Map(); for(const L of lots){ const r=L.r, n=r.length/2, ccw=sarea(r)>0, segs=new Set();
    for(let i=0;i<n;i++){ const j=(i+1)%n, f=facing(P,r[2*i],r[2*i+1],r[2*j],r[2*j+1],ccw,(x,y)=>inOther(L,x,y)); if(f&&!isLane(f.si)) segs.add(f.si); }
    for(const a of L.addrs){ let S=FR.get(a); if(!S){ S=new Set(); FR.set(a,S); } segs.forEach(x=>S.add(x)); } }
   
  const V=new Map(); for(const [a,S] of FR){ const st=streetOf(a); if(!st||S.size!==1) continue; const si=[...S][0]; let m=V.get(si); if(!m){ m=new Map(); V.set(si,m); } m.set(a,st); }
  const out=new Map();
  for(const si of new Set(P.map(p=>p[4]))){ const lane=isLane(si), m=V.get(si), votes={}; if(m) for(const s of m.values()) votes[s]=(votes[s]||0)+1;
    const n=Object.values(votes).reduce((a,b)=>a+b,0), top=Object.entries(votes).sort((a,b)=>b[1]-a[1])[0];
    const cn=G.nameOf&&G.names&&G.nameOf[si]>=0?G.names[G.nameOf[si]]:null;
    if(cn&&!lane){ out.set(si,{name:fmt(cn),src:'city',lane,votes,n}); continue; }
    const name=!lane&&top&&top[1]>=MIN_VOTES&&top[1]>n/2?fmt(top[0]):null; out.set(si,{name,src:name?'addr':null,lane,votes,n}); }
  return out; }
 
function edgeNames(G,tiles,city,ring,R){ let cx=0,cy=0; const n=ring.length/2; for(let i=0;i<n;i++){ cx+=ring[2*i]; cy+=ring[2*i+1]; } cx/=n; cy/=n;
  const N=nameNear(G,tiles,city,cx,cy,R||200), P=piecesNear(G,cx,cy,(R||200)+PROBE), ccw=sarea(ring)>0;
  const at=(ax,ay,bx,by)=>{ const f=facing(P,ax,ay,bx,by,ccw,null); if(!f) return null; const v=N.get(f.si)||{}; return {si:f.si,name:v.name||null,src:v.src||null,lane:!!v.lane,votes:v.votes,n:v.n}; };
   
  const own=new Set(); for(let i=0;i<n;i++){ const j=(i+1)%n, f=facing(P,ring[2*i],ring[2*i+1],ring[2*j],ring[2*j+1],ccw,null); if(f&&!N.get(f.si)?.lane) own.add(f.si); }
  return {N,at,cx,cy,ownSegs:own.size}; }
const api={streetOf,fmt,nameNear,edgeNames,PROBE,MIN_VOTES,method:'named from fronting lot addresses (our method)'};
if(typeof module!=='undefined'&&module.exports) module.exports=api; if(root.BD) root.BD.streetNames=api; else root.BD={streetNames:api};
})(typeof window!=='undefined'?window:globalThis);

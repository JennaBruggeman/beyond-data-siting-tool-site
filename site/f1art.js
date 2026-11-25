 
(function(){
const BD=window.BD=window.BD||{};
const NAVY='#1E2A47', TOP='#FFFFFF', SIDE_A='#E4E9F3', SIDE_B='#CBD4E6', GROUND='#FFFFFF', ACC='#7A5AF0', ACC_L='#D9CFFB', ACC_M='#B6A2F6', ACC_D='#5B3FD0';
const C30=Math.cos(Math.PI/6), S30=0.5;
function cam(c,s,W,H,off,rot){ const [cx,cy]=c, ox=W/2+(off?off[0]:0), oy=H/2+(off?off[1]:0), cr=Math.cos(rot||0), sr=Math.sin(rot||0);
  const pr=(x,y,z)=>{ const u0=x-cx, v0=y-cy, u=u0*cr-v0*sr, v=u0*sr+v0*cr; return [ox+(u-v)*C30*s, oy-(u+v)*S30*s-(z||0)*s]; };
  pr.rot=rot||0; pr.depth=(x,y)=>{ const u0=x-cx, v0=y-cy; return (u0*cr-v0*sr)+(u0*sr+v0*cr); }; return pr; }
 
const rotV=(x,y,r)=>[x*Math.cos(r)-y*Math.sin(r),x*Math.sin(r)+y*Math.cos(r)];
 
function faces(a,b,pr){ const n=rotV(b[1]-a[1],-(b[0]-a[0]),pr.rot||0); return {front:n[0]+n[1]<0,west:Math.abs(n[0])>Math.abs(n[1])}; }
 
function gridRot(streets,c,R){ const H=new Array(90).fill(0); for(const g of streets||[]) for(let i=0;i+3<g.length;i+=2){ const a=[g[i],g[i+1]], b=[g[i+2],g[i+3]], m=[(a[0]+b[0])/2,(a[1]+b[1])/2]; if(Math.hypot(m[0]-c[0],m[1]-c[1])>R) continue;
    const L=Math.hypot(b[0]-a[0],b[1]-a[1]); if(L<1) continue; let d=Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI; d=((d%90)+90)%90; H[Math.floor(d)%90]+=L; }
  let best=0,bi=0; for(let i=0;i<90;i++){ const v=H[(i+89)%90]*.5+H[i]+H[(i+1)%90]*.5; if(v>best){ best=v; bi=i; } } return -(bi+.5)*Math.PI/180; }
const ptsOf=r=>{ const o=[]; for(let i=0;i+1<r.length;i+=2) o.push([r[i],r[i+1]]); if(o.length>2&&o[0][0]===o[o.length-1][0]&&o[0][1]===o[o.length-1][1]) o.pop(); return o; };
const area=P=>{ let a=0; for(let i=0;i<P.length;i++){ const p=P[i], q=P[(i+1)%P.length]; a+=p[0]*q[1]-q[0]*p[1]; } return a/2; };
const path=(Q)=>'M'+Q.map(q=>q[0].toFixed(1)+' '+q[1].toFixed(1)).join('L')+'Z';
function defs(){ return `<defs>
 <pattern id="f1aDots" width="4" height="4" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".75" fill="${NAVY}" fill-opacity=".55"/></pattern>
 <pattern id="f1aDotsL" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".6" fill="${NAVY}" fill-opacity=".35"/></pattern>
 <pattern id="f1aGlass" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)"><line x1="0" y1="0" x2="0" y2="6" stroke="${NAVY}" stroke-width=".5" stroke-opacity=".5"/></pattern></defs>`; }
 
function prism(P,z0,z1,pr,o){ o=o||{}; if(area(P)<0) P=P.slice().reverse(); const top=o.top||TOP, sa=o.sa||SIDE_A, sb=o.sb||SIDE_B, sw=o.sw||0.9, out=o.stroke||NAVY;
  let s=''; const sides=[];
  for(let i=0;i<P.length;i++){ const a=P[i], b=P[(i+1)%P.length], F=faces(a,b,pr); if(!F.front) continue;    
    const Q=[pr(a[0],a[1],z0),pr(b[0],b[1],z0),pr(b[0],b[1],z1),pr(a[0],a[1],z1)]; sides.push(`<path d="${path(Q)}" fill="${F.west?sa:sb}" stroke="${out}" stroke-width="${sw}" stroke-linejoin="round"/>`); }
  s+=sides.join(''); s+=`<path d="${path(P.map(p=>pr(p[0],p[1],z1)))}" fill="${top}" stroke="${out}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  if(o.windows&&z1-z0>6){  
    for(let i=0;i<P.length;i++){ const a=P[i], b=P[(i+1)%P.length]; if(!faces(a,b,pr).front) continue; const L=Math.hypot(b[0]-a[0],b[1]-a[1]); if(L<6) continue;
      for(let z=z0+3.5;z<z1-1;z+=3.5){ const t0=0.12, t1=0.88, A=[a[0]+(b[0]-a[0])*t0,a[1]+(b[1]-a[1])*t0], B=[a[0]+(b[0]-a[0])*t1,a[1]+(b[1]-a[1])*t1]; const p1=pr(A[0],A[1],z), p2=pr(B[0],B[1],z);
        s+=`<line x1="${p1[0].toFixed(1)}" y1="${p1[1].toFixed(1)}" x2="${p2[0].toFixed(1)}" y2="${p2[1].toFixed(1)}" stroke="${out}" stroke-width=".45" stroke-opacity=".55"/>`; } } }
  return s; }
function shadow(P,h,pr){ const d=rotV(h*0.55,-h*0.35,-(pr.rot||0)); const Q=P.map(p=>pr(p[0]+d[0],p[1]+d[1],0)); const B=P.map(p=>pr(p[0],p[1],0));
  return `<path d="${path(Q)}" fill="url(#f1aDots)"/><path d="${path(B)}" fill="url(#f1aDots)"/>`; }
function street(seg,pr,s){ const Q=[]; for(let i=0;i+1<seg.length;i+=2) Q.push(pr(seg[i],seg[i+1],0)); if(Q.length<2) return ['','',''];
  const d='M'+Q.map(q=>q[0].toFixed(1)+' '+q[1].toFixed(1)).join('L'); const w=Math.max(6,11*s);
  return [`<path d="${d}" fill="none" stroke="${NAVY}" stroke-width="${(w+1.6).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/>`,`<path d="${d}" fill="none" stroke="${GROUND}" stroke-width="${w.toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/>`,
    `<path d="${d}" fill="none" stroke="${NAVY}" stroke-width=".7" stroke-dasharray="5 6" stroke-opacity=".6"/>`]; }
function tree(x,y,pr,s,k){ const b=pr(x,y,0), h=Math.max(10,7*s), r=Math.max(4.5,2.6*s); const t=pr(x,y,0); const shp=`<ellipse cx="${(b[0]+r*.9).toFixed(1)}" cy="${(b[1]+1).toFixed(1)}" rx="${(r*1.1).toFixed(1)}" ry="${(r*.45).toFixed(1)}" fill="url(#f1aDotsL)"/>`;
  if(k%3===0) return shp+`<line x1="${t[0]}" y1="${t[1]}" x2="${t[0]}" y2="${(t[1]-h*.45).toFixed(1)}" stroke="${NAVY}" stroke-width=".9"/><path d="M${(t[0]-r).toFixed(1)} ${(t[1]-h*.35).toFixed(1)}L${t[0].toFixed(1)} ${(t[1]-h*1.15).toFixed(1)}L${(t[0]+r).toFixed(1)} ${(t[1]-h*.35).toFixed(1)}Z" fill="${SIDE_A}" stroke="${NAVY}" stroke-width=".9" stroke-linejoin="round"/>`;
  return shp+`<line x1="${t[0]}" y1="${t[1]}" x2="${t[0]}" y2="${(t[1]-h*.5).toFixed(1)}" stroke="${NAVY}" stroke-width=".9"/><circle cx="${t[0].toFixed(1)}" cy="${(t[1]-h*.75).toFixed(1)}" r="${r.toFixed(1)}" fill="${TOP}" stroke="${NAVY}" stroke-width=".9"/><path d="M${(t[0]-r*.2).toFixed(1)} ${(t[1]-h*.75+r).toFixed(1)}a${r.toFixed(1)} ${r.toFixed(1)} 0 0 0 ${(r*1.15).toFixed(1)} ${(-r*1.6).toFixed(1)}" fill="${SIDE_A}" stroke="none"/>`; }
function person(x,y,pr,s,acc,cls){ const b=pr(x,y,0), h=Math.max(14,1.75*s*3.4);     return `<g class="${cls||''}"><ellipse cx="${(b[0]+2).toFixed(1)}" cy="${(b[1]+.5).toFixed(1)}" rx="${(h*.22).toFixed(1)}" ry="${(h*.08).toFixed(1)}" fill="url(#f1aDots)"/><rect x="${(b[0]-h*.14).toFixed(1)}" y="${(b[1]-h*.8).toFixed(1)}" width="${(h*.28).toFixed(1)}" height="${(h*.62).toFixed(1)}" rx="${(h*.12).toFixed(1)}" fill="${acc?ACC:NAVY}"/><line x1="${(b[0]-h*.06).toFixed(1)}" y1="${(b[1]-h*.25).toFixed(1)}" x2="${(b[0]-h*.08).toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${NAVY}" stroke-width="1.3" stroke-linecap="round"/><line x1="${(b[0]+h*.06).toFixed(1)}" y1="${(b[1]-h*.25).toFixed(1)}" x2="${(b[0]+h*.09).toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${NAVY}" stroke-width="1.3" stroke-linecap="round"/><circle cx="${b[0].toFixed(1)}" cy="${(b[1]-h*.92).toFixed(1)}" r="${(h*.13).toFixed(1)}" fill="${NAVY}"/></g>`; }
function car(x,y,ang,pr,s,cls){ const L=6.4, Wd=2.7, c=Math.cos(ang), sn=Math.sin(ang); const R=(dx,dy)=>[x+dx*c-dy*sn,y+dx*sn+dy*c]; const base=[R(-L/2,-Wd/2),R(L/2,-Wd/2),R(L/2,Wd/2),R(-L/2,Wd/2)];
  const cab=[R(-L*.2,-Wd*.42),R(L*.22,-Wd*.42),R(L*.22,Wd*.42),R(-L*.2,Wd*.42)]; return `<g class="${cls||''}">${shadow(base,1.4,pr)}${prism(base,0.3,1.0,pr,{sw:.8})}${prism(cab,1.0,1.55,pr,{sw:.8,top:SIDE_A})}</g>`; }
function ring(P,pr,z,o){ o=o||{}; return `<path d="${path(P.map(p=>pr(p[0],p[1],z||0)))}" fill="${o.fill||'none'}" stroke="${o.stroke||NAVY}" stroke-width="${o.w||1}" ${o.dash?`stroke-dasharray="${o.dash}"`:''} stroke-linejoin="round" ${o.op!=null?`fill-opacity="${o.op}"`:''}/>`; }
function svg(sc,o){ const W=o.W||960, H=o.H||600, s=o.s||2, rot=o.rot==='auto'?gridRot(sc.streets,sc.c,o.gridR||160):(o.rot||0), pr=cam(sc.c,s,W,H,o.off,rot), R=o.R||200;
  const inView=(x,y)=>{ const p=pr(x,y,0); return p[0]>-60&&p[0]<W+60&&p[1]>-60&&p[1]<H+160; };
  let g='', st=['','',''];
  for(const seg of sc.streets||[]){ let ok=false; for(let i=0;i+1<seg.length;i+=2) if(inView(seg[i],seg[i+1])){ ok=true; break; } if(!ok) continue; const t=street(seg,pr,s); st[0]+=t[0]; st[1]+=t[1]; st[2]+=t[2]; }
  g+=st.join('');
   
  g+=(sc.under||[]).map(f=>f(pr,s)).join('');
   
  const B=(sc.bld||[]).map(b=>({b,P:ptsOf(b.r),c:b.c||null})).filter(o=>o.P.length>2).map(o=>{ const cx=o.P.reduce((t,p)=>t+p[0],0)/o.P.length, cy=o.P.reduce((t,p)=>t+p[1],0)/o.P.length; return Object.assign(o,{cx,cy}); }).filter(o=>inView(o.cx,o.cy));
  const items=(sc.items||[]).map(it=>Object.assign({},it));
  g+=B.map(o=>shadow(o.P,Math.min(o.b.h||4,60),pr)).join('')+items.filter(i=>i.shadow).map(i=>i.shadow(pr,s)).join('');
  const draw=B.map(o=>({d:pr.depth(o.cx,o.cy),f:()=>prism(o.P,0,Math.max(3,o.b.h||4),pr,Object.assign({windows:(o.b.h||0)>9},o.b.style||{}))}))
    .concat(items.map(i=>({d:i.d,f:()=>i.draw(pr,s)})))
    .concat((sc.trees||[]).filter(t=>inView(t[0],t[1])).map((t,k)=>({d:pr.depth(t[0],t[1]),f:()=>tree(t[0],t[1],pr,s,k)})))
    .concat((sc.people||[]).map((p,k)=>({d:p[3]==='in'?(sc.inDepth||0)-0.5:pr.depth(p[0],p[1])-1,f:()=>person(p[0],p[1],pr,s,p[2],p[3])})))
    .concat((sc.cars||[]).map(c=>({d:pr.depth(c[0],c[1]),f:()=>car(c[0],c[1],c[2]||0,pr,s,c[3])})));
  draw.sort((a,b)=>b.d-a.d); g+=draw.map(x=>x.f()).join('');
  g+=(sc.over||[]).map(f=>f(pr,s)).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${(o.label||'').replace(/"/g,'')}" style="background:${GROUND}">${defs()}<clipPath id="f1aClip"><rect x="0" y="0" width="${W}" height="${H}" rx="${o.rx==null?18:o.rx}"/></clipPath><g clip-path="url(#f1aClip)"><rect width="${W}" height="${H}" fill="${GROUND}"/>${g}</g></svg>`; }
BD.f1art={svg,prism,shadow,ring,person,car,tree,ptsOf,area,faces,gridRot,rotV,K:{NAVY,TOP,SIDE_A,SIDE_B,ACC,ACC_L,ACC_M,ACC_D}};
})();

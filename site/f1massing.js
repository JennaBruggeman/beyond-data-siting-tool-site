 
(function(){
const BD=window.BD=window.BD||{};
const HUE={emergency_hub:['#F28C38','#FBC9A0'],shelter_laundry:['#F2C230','#F9E3A0'],community_pool:['#3FA9E0','#BFE0F5'],warm_bath:['#2EC4B6','#B8EAE2'],heat_cascade:['#F4A6B8','#F9D0DA'],aquaponics:['#6CC24A','#CDEBB8'],conservatory:['#C2D63A','#E4EDA8'],food_hub:['#C9A26B','#E8D5BC']};
const BASE={hall:'#8C9DBD',dc:'#B9C5DA',circulation:'#E4E0D8','circ-pub':'#E4E0D8','circ-dc':'#D5DCEA','core-public':'#8E949C','core-dc':'#3D5185',loading:'#ABA59C',plant:'#6B7590',unassigned:'#E9ECF1',flex:null};    
const DCSIDE=new Set(['hall','dc','core-dc','loading','plant','circ-dc']), PUBSIDE=new Set(['public','public-program','public-support','clinic','core-public','circ-pub','flex','circulation']);
const NAME={'public-program':'public program','public-support':'public support','circ-pub':'public circulation','circ-dc':'data-centre circulation',hall:'data hall',dc:'data-centre support',public:'public program',clinic:'clinic',circulation:'circulation','core-public':'public stairs and lifts','core-dc':'data-centre stairs and lifts',loading:'loading',plant:'plant','shell-dc':'data-centre support','heat-recovery':'heat-recovery room',unassigned:'data-centre support'};    
const tint=(hex,f)=>{ const n=parseInt(hex.slice(1),16); return '#'+[n>>16&255,n>>8&255,n&255].map(v=>Math.round(v+(255-v)*f).toString(16).padStart(2,'0')).join(''); };
const TK=()=>BD.TOK||{pubProgram:'#F28C38',pubSupport:'#FDE5D0'};
const colour=(z,typ)=>{ const t=TK(); if(z==='public'||z==='flex'||z==='clinic'||z==='public-program') return t.pubProgram; if(z==='public-support') return t.pubSupport; if(z==='shell-dc') return BASE.dc||'#E9ECF1'; return BASE[z]||'#E9ECF1'; };        
const shade=(hex,f)=>{ const n=parseInt(hex.slice(1),16); return '#'+[n>>16&255,n>>8&255,n&255].map(v=>Math.max(0,Math.min(255,Math.round(v*f))).toString(16).padStart(2,'0')).join(''); };
const ORDER=['unassigned','circulation','circ-pub','circ-dc','loading','plant','dc','shell-dc','hall','clinic','public-support','public','public-program','core-public','core-dc'];    
let UID=0;
 
function grid(st){ const us=new Set(), vs=new Set(); for(const z of st.zones) for(const r of z.rects){ us.add(+r[0].toFixed(3)); us.add(+r[1].toFixed(3)); vs.add(+r[2].toFixed(3)); vs.add(+r[3].toFixed(3)); }
  const U=[...us].sort((a,b)=>a-b), V=[...vs].sort((a,b)=>a-b), cell=[];
  for(let i=0;i<U.length-1;i++){ cell[i]=[]; const cu=(U[i]+U[i+1])/2; for(let j=0;j<V.length-1;j++){ const cv=(V[j]+V[j+1])/2; let own=null, rank=-1;
      for(const z of st.zones){ const k=ORDER.indexOf(z.zone); for(const r of z.rects) if(cu>r[0]-1e-6&&cu<r[1]+1e-6&&cv>r[2]-1e-6&&cv<r[3]+1e-6&&k>=rank){ own=z.zone; rank=k; } }
      cell[i][j]=own; } }
   
  const inRing=(x,y,R)=>{ let c=false; for(let i=0,j=R.length-1;i<R.length;j=i++){ const [xi,yi]=R[i],[xj,yj]=R[j]; if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi)) c=!c; } return c; };
  const CR=st.circulation; if(CR) for(let i=0;i<cell.length;i++) for(let j=0;j<(cell[i]||[]).length;j++){ if(cell[i][j]!=='circulation') continue; const cu=(U[i]+U[i+1])/2, cv=(V[j]+V[j+1])/2; if((CR.secure||[]).some(R=>inRing(cu,cv,R))) cell[i][j]='circ-dc'; else if((CR.public||[]).some(R=>inRing(cu,cv,R))) cell[i][j]='circ-pub'; }
   
  for(let pass=0;pass<3;pass++) for(let i=0;i<cell.length;i++) for(let j=0;j<(cell[i]||[]).length;j++){ if(cell[i][j]!=='unassigned') continue; const n={};
    for(const [a,b] of [[i-1,j],[i+1,j],[i,j-1],[i,j+1]]){ const z=cell[a]&&cell[a][b]; if(z&&z!=='unassigned'&&!/^core/.test(z)) n[z]=(n[z]||0)+1; } const best=Object.entries(n).sort((x,y)=>y[1]-x[1])[0]; if(best) cell[i][j]=best[0]; }
  return {U,V,cell}; }
 
const norm=storeys=>{ const split=storeys.some(s=>s.zones.some(z=>z.zone==='circulation-dc')); return storeys.map(s=>Object.assign({},s,{zones:s.zones.map(z=>Object.assign({},z,{zone:z.zone==='circulation-dc'?'circ-dc':(split&&z.zone==='circulation'?'circ-pub':z.zone)}))})); };
function render(storeys,o){ o=o||{}; storeys=norm(storeys); const typ=o.typology, T=o.t!=null?Math.max(0,Math.min(1,o.t)):(o.exploded?1:0), ex=T>0, k=o.k||5, C=Math.cos(Math.PI/6), S=Math.sin(Math.PI/6), id='m'+(++UID);
  const sts=storeys.slice().sort((a,b)=>a.z0-b.z0), Hmax=Math.max(...sts.map(s=>s.z1-s.z0));
   
  const all=sts.flatMap(s=>s.zones.flatMap(z=>z.rects||[])); if(!all.length) return '<p class="f1c-note">This layout has no storey shapes to draw.</p>';
  const uR=Math.max(...all.map(r=>r[1]))-Math.min(...all.map(r=>r[0])), vR=Math.max(...all.map(r=>r[3]))-Math.min(...all.map(r=>r[2]));
  const gap=o.gap||Math.max(Hmax*1.15,(uR+vR)*S*(o.spread||1.02)), thick=o.thick||0.9;        
  const RC=[(Math.min(...all.map(r=>r[0]))+Math.max(...all.map(r=>r[1])))/2,(Math.min(...all.map(r=>r[2]))+Math.max(...all.map(r=>r[3])))/2], cR=Math.cos(o.rot||0), sR=Math.sin(o.rot||0);
  const rot=(u,v)=>o.rot?[RC[0]+(u-RC[0])*cR-(v-RC[1])*sR,RC[1]+(u-RC[0])*sR+(v-RC[1])*cR]:[u,v];    
  const pq=(u,v,z)=>{ [u,v]=rot(u,v); return [o.plan?v*k:(u-v)*C*k, o.plan?-u*k:(u+v)*S*k-z*k]; };    
  let X0=1e9,X1=-1e9,Y0=1e9,Y1=-1e9; const pr=(u,v,z)=>{ [u,v]=rot(u,v); const x=o.plan?v*k:(u-v)*C*k, y=o.plan?-u*k:(u+v)*S*k-z*k;     X0=Math.min(X0,x); X1=Math.max(X1,x); Y0=Math.min(Y0,y); Y1=Math.max(Y1,y); return [x,y]; };     const out=[], labels=[];
  const poly=(pts,fill,stroke,sw,extra)=>{ const q=pts.map(p=>pr(...p)); for(const [x,y] of q){ X0=Math.min(X0,x); X1=Math.max(X1,x); Y0=Math.min(Y0,y); Y1=Math.max(Y1,y); }
    out.push(`<polygon points="${q.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="${sw||0.6}" stroke-linejoin="round"`:` stroke="${fill}" stroke-width="0.4"`}${extra||''}/>`); };
   
  const YL=[], TG=[], CL=[];     { const yz=sts.length?sts[0].z0*(1-T):0, Y=o.yard, eq=(o.plant||[]).filter(q=>!q.roof&&q.rect);
    let rings=Y&&Y.rings&&Y.rings.length?Y.rings:null;     if(!rings&&eq.length){ const A=eq.map(q=>q.rect), m=1.5; rings=[[[Math.min(...A.map(r=>r[0]))-m,Math.min(...A.map(r=>r[2]))-m],[Math.max(...A.map(r=>r[1]))+m,Math.min(...A.map(r=>r[2]))-m],[Math.max(...A.map(r=>r[1]))+m,Math.max(...A.map(r=>r[3]))+m],[Math.min(...A.map(r=>r[0]))-m,Math.max(...A.map(r=>r[3]))+m]]]; }
    const ct=(Y&&Y.truckCourt&&Y.truckCourt.rect)||o.court; if(ct) poly([[ct[0],ct[2],yz],[ct[1],ct[2],yz],[ct[1],ct[3],yz],[ct[0],ct[3],yz]],'#DEE0E4','#8A94AA',0.6,' data-court="1"'); if(ct&&o.yardLabel!==false){ const c=pr((ct[0]+ct[1])/2,(ct[2]+ct[3])/2,yz); CL.push({x:c[0],y:c[1]}); }    
    if(rings){ for(const R of rings) poly(R.map(q=>[q[0],q[1],yz]),'#C9CCD1','#8A94AA',0.6,' data-yard="1"');
      if(o.yardLabel!==false){ const all=rings.flat().map(q=>pr(q[0],q[1],yz)), P0=o.yardFigures?all.reduce((m,q)=>q[0]>m[0]?q:m):all.reduce((m,q)=>q[1]>m[1]?q:m);         YL.push({x:P0[0],y:P0[1],t:['Plant yard',Y&&Y.area?Math.round(Y.area).toLocaleString('en-CA')+' m\u00b2':'',Y&&Y.pctOfLot!=null?Y.pctOfLot+' % of the lot':''].filter(Boolean).join(' \u00b7 ')});         } } }
   
  const CTXB=[]; const CTX=[], ctxDraw=(list,front)=>{ for(const b of list){ let R=b.ring.map(q=>rot(q[0],q[1])); let A=0; for(let i=0;i<R.length;i++){ const j=(i+1)%R.length; A+=R[i][0]*R[j][1]-R[j][0]*R[i][1]; } if(A<0) R=R.slice().reverse();
      const P=(q,z)=>{ const x=(q[0]-q[1])*C*k, y=(q[0]+q[1])*S*k-z*k; return x.toFixed(1)+','+y.toFixed(1); }, h=Math.max(3,b.h||6), f=[];
      for(let i=0;i<R.length-1;i++){ const a=R[i], c=R[i+1], nx=c[1]-a[1], ny=-(c[0]-a[0]); if(nx+ny<=0) continue; f.push([a[0]+a[1]+c[0]+c[1],`<polygon points="${P(a,0)} ${P(c,0)} ${P(c,h)} ${P(a,h)}" fill="${nx>ny?'#DCDFE4':'#E6E8EC'}" stroke="#D0D4DB" stroke-width="0.3"/>`]); }
      { const xs=[], ys=[]; for(const q of R) for(const z of [0,h]){ const t=P(q,z).split(','); xs.push(+t[0]); ys.push(+t[1]); } CTXB.push({i:out.length,x0:Math.min(...xs),x1:Math.max(...xs),y0:Math.min(...ys),y1:Math.max(...ys)}); }    
      f.sort((p,q)=>p[0]-q[0]); out.push(`<g data-ctx="1"${front?' opacity="0.5"':''}>${f.map(z=>z[1]).join('')}<polygon points="${R.map(q=>P(q,h)).join(' ')}" fill="${b.roof||'#F1F2F5'}" stroke="#D0D4DB" stroke-width="0.3"/></g>`); } };
  if(o.context){ const dc=RC[0]+RC[1]; const ds=b=>{ const c=b.ring.reduce((t,q)=>[t[0]+q[0]/b.ring.length,t[1]+q[1]/b.ring.length],[0,0]); const r=rot(c[0],c[1]); return r[0]+r[1]; };
    const near=o.context.filter(b=>{ const c=b.ring[0]; return Math.hypot(c[0]-RC[0],c[1]-RC[1])<(o.ctxR||140); }).map(b=>[ds(b),b]).sort((p,q)=>p[0]-q[0]);
    ctxDraw(near.filter(x=>x[0]<dc).map(x=>x[1])); CTX.push(...near.filter(x=>x[0]>=dc).map(x=>x[1])); }
  const corners=[];
  sts.forEach((st,si)=>{ out.push(`<g class="f1m-st" data-st="${st.st}">`);    
    const G=grid(st), zbE=si*(gap+thick), zb=st.z0+(zbE-st.z0)*T, zt=st.z1+(zbE+thick-st.z1)*T, {U,V,cell}=G, ni=U.length-1, nj=V.length-1, own=(i,j)=>i>=0&&j>=0&&i<ni&&j<nj?cell[i][j]:null;
     
     
    const faces=[];
    for(let i=0;i<ni;i++){ let run=null; for(let j=0;j<=nj;j++){ const z=j<nj?cell[i][j]:null, vis=z&&!own(i+1,j), c=vis?colour(z,typ):null;
        if(run&&(c!==run.c)){ faces.push({d:U[i+1]+(V[run.j0]+V[j])/2,pts:[[U[i+1],V[run.j0],zb],[U[i+1],V[j],zb],[U[i+1],V[j],zt],[U[i+1],V[run.j0],zt]],f:shade(T>0.5&&/^core/.test(run.z||'')?'#B9BFCB':run.c,0.86),z:run.z}); run=null; }
        if(c&&!run) run={j0:j,c,z}; } }
    for(let j=0;j<nj;j++){ let run=null; for(let i=0;i<=ni;i++){ const z=i<ni?cell[i][j]:null, vis=z&&!own(i,j+1), c=vis?colour(z,typ):null;
        if(run&&(c!==run.c)){ faces.push({d:V[j+1]+(U[run.i0]+U[i])/2,pts:[[U[run.i0],V[j+1],zb],[U[i],V[j+1],zb],[U[i],V[j+1],zt],[U[run.i0],V[j+1],zt]],f:shade(T>0.5&&/^core/.test(run.z||'')?'#B9BFCB':run.c,0.94),z:run.z}); run=null; }
        if(c&&!run) run={i0:i,c,z}; } }
    if(!o.plan) faces.sort((a,b)=>a.d-b.d).forEach(f=>poly(f.pts,f.f,null,null,` data-zf="${f.z||''}"`));    
     
    const byZ={}; for(let i=0;i<ni;i++) for(let j=0;j<nj;j++){ const z=cell[i][j]; if(!z) continue; const q=[[U[i],V[j],zt],[U[i+1],V[j],zt],[U[i+1],V[j+1],zt],[U[i],V[j+1],zt]].map(p=>pr(...p)); (byZ[z]=byZ[z]||[]).push('M'+q.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join('L')+'Z'); }
    for(const z of ORDER) if(byZ[z]){ const c=colour(z,typ); out.push(`<path data-z="${z}" d="${byZ[z].join('')}" fill="${c}" stroke="${c}" stroke-width="0.5"/>`); if(z==='circulation'||z==='circ-pub') out.push(`<path d="${byZ[z].join('')}" fill="url(#${id}d)"/>`); if(z==='circ-dc') out.push(`<path d="${byZ[z].join('')}" fill="url(#${id}n)"/>`); }
     
    for(const z of ['core-public','core-dc']) if(byZ[z]) out.push(`<path data-hatch="1" d="${byZ[z].join('')}" fill="url(#${id}${z==='core-dc'?'hw':'hk'})"/>`);
     
    if(st.circulation&&o.circ!==false){ const ring=R=>'M'+R.map(q=>pr(q[0],q[1],zt)).map(q=>q[0].toFixed(1)+','+q[1].toFixed(1)).join('L')+'Z';
      for(const [k,fill,pat] of [['public','#E4E0D8','d'],['secure','#D5DCEA','n']]) for(const R of (st.circulation[k]||[])){ if(!R||R.length<3) continue; const d=ring(R); out.push(`<path data-circ="${k}" d="${d}" fill="${fill}"/><path data-circ="${k}" data-dots="1" d="${d}" fill="url(#${id}${pat})"/>`); if(k==='secure') out.push(`<path d="${d}" fill="none" stroke="#3D5185" stroke-width="0.9" data-security="1"/>`); } }
     
    const edge=[]; for(let i=0;i<ni;i++) for(let j=0;j<nj;j++){ if(!cell[i][j]) continue; const E=(a,b)=>{ const p=pr(...a), q=pr(...b); edge.push(`M${p[0].toFixed(1)},${p[1].toFixed(1)}L${q[0].toFixed(1)},${q[1].toFixed(1)}`); };
      if(!own(i-1,j)) E([U[i],V[j],zt],[U[i],V[j+1],zt]); if(!own(i+1,j)) E([U[i+1],V[j],zt],[U[i+1],V[j+1],zt]); if(!own(i,j-1)) E([U[i],V[j],zt],[U[i+1],V[j],zt]); if(!own(i,j+1)) E([U[i],V[j+1],zt],[U[i+1],V[j+1],zt]); }
    out.push(`<path d="${edge.join('')}" fill="none" stroke="#1E2A47" stroke-width="0.7" stroke-linecap="round"/>`);
     
    if(o.fire!==false){ const red=[], navy=[], SEP=st.separations&&(st.separations.fire2h||st.separations.enclosures)?st.separations:null; const L=(a,b,arr)=>{ const p=pr(...a), q=pr(...b); arr.push(`M${p[0].toFixed(1)},${p[1].toFixed(1)}L${q[0].toFixed(1)},${q[1].toFixed(1)}`); };
      const kind=(x,y)=>{ const z=own(x,y); return !z?null:DCSIDE.has(z)?'dc':PUBSIDE.has(z)?'pub':null; };
      for(let i=0;i<ni;i++) for(let j=0;j<nj;j++){ const z=cell[i][j]; if(!z) continue;
        for(const [di,dj] of [[1,0],[0,1]]){ const z2=own(i+di,j+dj); if(!z2||z2===z) continue; const a=di?[U[i+1],V[j],zt]:[U[i],V[j+1],zt], b=[U[i+1],V[j+1],zt];
          const k1=kind(i,j), k2=kind(i+di,j+dj), core=/^core/.test(z)||/^core/.test(z2);
          if(!SEP&&(core||(k1&&k2&&k1!==k2))) L(a,b,red); else if((z==='circ-pub'&&z2==='circ-dc')||(z==='circ-dc'&&z2==='circ-pub')) L(a,b,navy); } }
       
      if(SEP){ for(const g of SEP.fire2h||[]) L([g[0],g[1],zt],[g[2],g[3],zt],red); for(const R of SEP.enclosures||[]) for(let q=0;q<R.length;q++) L([R[q][0],R[q][1],zt],[R[(q+1)%R.length][0],R[(q+1)%R.length][1],zt],red); }
      else for(let i=0;i<ni;i++) for(let j=0;j<nj;j++){ const z=cell[i][j]; if(!z||!/^core/.test(z)) continue;
        if(!own(i-1,j)) L([U[i],V[j],zt],[U[i],V[j+1],zt],red); if(!own(i+1,j)) L([U[i+1],V[j],zt],[U[i+1],V[j+1],zt],red); if(!own(i,j-1)) L([U[i],V[j],zt],[U[i+1],V[j],zt],red); if(!own(i,j+1)) L([U[i],V[j+1],zt],[U[i+1],V[j+1],zt],red); }
      if(navy.length) out.push(`<path d="${navy.join('')}" fill="none" stroke="#3D5185" stroke-width="0.9"/>`);
      if(red.length) out.push(`<path d="${red.join('')}" fill="none" stroke="#C0262D" stroke-width="1.3" stroke-linecap="round" data-fire="1"/>`); }
     
    if(T>0.5){ const area={}; for(const z of st.zones) for(const r of z.rects) area[z.zone]=(area[z.zone]||0)+(r[1]-r[0])*(r[3]-r[2]); const main=Object.entries(area).filter(([z])=>!/core|circulation/.test(z)).sort((a,b)=>b[1]-a[1])[0];
      const byN={}; for(const [z,a] of Object.entries(area)) if(!/core|circ/.test(z)){ const n=NAME[z]||z; byN[n]=(byN[n]||0)+a; }    
      const ranked=Object.entries(byN).sort((a,b)=>b[1]-a[1]), top=ranked.slice(0,2), pubz=ranked.find(([n])=>n===NAME['public-program']); if(pubz&&!top.includes(pubz)) top.push(pubz); const two=top.map(([n])=>n).join(', ');    
      const lp=pr(U[0],V[nj],zt); if(o.labels!==false) labels.push({x:lp[0],y:lp[1],n:st.st,t:two});
      corners.push({st,zb,zt,G}); }
    if(o.tags) for(const g of o.tags) if(g.st===st.st){ const P0=pr(g.u,g.v,zt); TG.push({x:P0[0],y:P0[1],t:g.t,st:st.st}); }
    out.push('</g>'); });
  if(CTX.length&&!o.ctxCullFront) ctxDraw(CTX,true);    
   
   
  let guides=''; if(T>0.5&&corners.length>1){ const inside=(u,v,G)=>{ const {U,V,cell}=G; let i=U.findIndex((x,k)=>k<U.length-1&&u>=U[k]-1e-6&&u<=U[k+1]+1e-6), j=V.findIndex((x,k)=>k<V.length-1&&v>=V[k]-1e-6&&v<=V[k+1]+1e-6);
      if(i<0||j<0) return false; for(const di of [0,-1]) for(const dj of [0,-1]){ const a=i+di+(u>U[i]+1e-6?0:0), b=j+dj; if(cell[a]&&cell[a][b]) return true; } for(const di of [0,1]) for(const dj of [0,1]){ const a=i-1+di, b=j-1+dj; if(a>=0&&b>=0&&cell[a]&&cell[a][b]) return true; } return false; };
    const top=corners[corners.length-1].G, cand=[]; for(let i=0;i<top.U.length;i++) for(let j=0;j<top.V.length;j++){ const u=top.U[i], v=top.V[j]; if(corners.every(c=>inside(u,v,c.G))) cand.push([u,v]); }
    if(cand.length){ const L=cand.reduce((m,q)=>(q[0]-q[1])<(m[0]-m[1])?q:m), Rr=cand.reduce((m,q)=>(q[0]-q[1])>(m[0]-m[1])?q:m), seg=[];
      for(const [u,v] of (L===Rr?[L]:[L,Rr])) for(let k=0;k<corners.length-1;k++){ const p=pr(u,v,corners[k].zt), q=pr(u,v,corners[k+1].zb); seg.push(`M${p[0].toFixed(1)},${p[1].toFixed(1)}L${q[0].toFixed(1)},${q[1].toFixed(1)}`); }
      guides=`<path d="${seg.join('')}" stroke="#8A94AA" stroke-width="0.7" stroke-dasharray="3 3" fill="none" data-guide="1"/>`; } }
  const ylab=YL.map(l=>{ const f=(o.fs||12); const side=!!o.yardFigures, hw=Math.max(l.t.length,(l.t2||'').length)*f*0.27, tx=side?Math.max(l.x+f*0.6,X1+f*0.8):l.x, ty=side?l.y+f*0.35:l.y+f*1.9;     if(side){ const w=Math.max(l.t.length,(l.t2||'').length,(l.t3||'').length)*f*0.54; X1=Math.max(X1,tx+w); Y1=Math.max(Y1,ty+f*2.6); }     else { X0=Math.min(X0,l.x-hw); X1=Math.max(X1,l.x+hw); Y1=Math.max(Y1,l.y+f*(l.t2?3.5:2.3)); } return `${side?`<line x1="${l.x.toFixed(1)}" y1="${l.y.toFixed(1)}" x2="${(tx-f*0.3).toFixed(1)}" y2="${l.y.toFixed(1)}" stroke="#8A94AA" stroke-width="0.8"/><circle cx="${l.x.toFixed(1)}" cy="${l.y.toFixed(1)}" r="1.8" fill="#1E2A47"/>`:''}<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="${side?'start':'middle'}" font-size="${f.toFixed(1)}" fill="#4A5672" stroke="#fff" stroke-width="${(f*0.3).toFixed(1)}" paint-order="stroke" stroke-linejoin="round" font-family="IBM Plex Sans,system-ui,sans-serif">${l.t}${l.t2?`<tspan x="${tx.toFixed(1)}" dy="${(f*1.2).toFixed(1)}">${l.t2}</tspan>`:''}${l.t3?`<tspan x="${tx.toFixed(1)}" dy="${(f*1.2).toFixed(1)}">${l.t3}</tspan>`:''}</text>`; }).join('');
  const clab=CL.map(l=>{ const f=(o.fs||12)*(o.labelCol?1.05:0.9), tx=Math.max(l.x+f*3,X1+f*0.6); X1=Math.max(X1,tx+f*0.56*11+4); return `<line x1="${l.x.toFixed(1)}" y1="${l.y.toFixed(1)}" x2="${(tx-f*0.3).toFixed(1)}" y2="${l.y.toFixed(1)}" stroke="#8A94AA" stroke-width="0.8"/><circle cx="${l.x.toFixed(1)}" cy="${l.y.toFixed(1)}" r="1.6" fill="#1E2A47"/><text x="${tx.toFixed(1)}" y="${(l.y+f*0.35).toFixed(1)}" text-anchor="start" font-size="${f.toFixed(1)}" fill="#1E2A47" font-family="IBM Plex Sans,system-ui,sans-serif" data-courtlabel="1">Truck court</text>`; }).join('');    
  const tlab=o.labelCol?'':TG.map(l=>{ const f=(o.fs||12)*0.9; X1=Math.max(X1,l.x-f+l.t.length*f*0.56); return `<text x="${(l.x-f).toFixed(1)}" y="${(l.y-f*0.7).toFixed(1)}" text-anchor="start" font-size="${f.toFixed(1)}" font-weight="600" fill="#1E2A47" stroke="#fff" stroke-width="${(f*0.22).toFixed(1)}" paint-order="stroke" font-family="IBM Plex Sans,system-ui,sans-serif" data-tag="1">${l.t}</text>`; }).join('');
  const fs=o.fs||12; const XG=X0; const WR=t=>{ if(!o.labelWrap) return [t]; const out=[]; for(const w of String(t).split(', ')){ const k=out.length-1; if(k>=0&&(out[k]+', '+w).length<=o.labelWrap) out[k]+=', '+w; else out.push(w); } return out.map((q,i)=>i<out.length-1?q+',':q); };    
  const lab=labels.map(l=>{ const x=o.labelCol?XG-fs*0.9:l.x-fs*2.2, LT=WR(l.t), ML=Math.max(...LT.map(q=>q.length));     X0=Math.min(X0,x-Math.max(8,ML)*fs*0.56); Y0=Math.min(Y0,l.y-fs*1.4); return `<line x1="${(o.labelCol?x+fs*0.4:l.x-fs*1.8).toFixed(1)}" y1="${l.y.toFixed(1)}" x2="${(l.x-4).toFixed(1)}" y2="${l.y.toFixed(1)}" stroke="#8A94AA" stroke-width="0.8"/><text x="${x.toFixed(1)}" y="${(l.y-2).toFixed(1)}" text-anchor="end" font-size="${fs*1.08}" font-weight="600" fill="#1E2A47" stroke="#fff" stroke-width="${(fs*0.28).toFixed(1)}" paint-order="stroke" stroke-linejoin="round" font-family="IBM Plex Sans,system-ui,sans-serif">Storey ${l.n}</text><text x="${x.toFixed(1)}" y="${(l.y+fs*1.05).toFixed(1)}" text-anchor="end" font-size="${fs}" fill="#4A5672" stroke="#fff" stroke-width="${(fs*0.28).toFixed(1)}" paint-order="stroke" stroke-linejoin="round" font-family="IBM Plex Sans,system-ui,sans-serif">${LT.length>1?LT.map((q,i)=>`<tspan x="${x.toFixed(1)}" dy="${i?(fs*1.1).toFixed(1):0}">${q}</tspan>`).join(''):l.t}</text>`+(o.labelCol?TG.filter(t=>t.st===l.n).map((t,ti)=>{ const ty=l.y+fs*(2.25+(LT.length-1)*1.1+ti*1.15); X0=Math.min(X0,x-t.t.length*fs*0.56); return `<line x1="${(x+fs*0.4).toFixed(1)}" y1="${(ty-fs*0.35).toFixed(1)}" x2="${t.x.toFixed(1)}" y2="${t.y.toFixed(1)}" stroke="#1E2A47" stroke-width="0.7" stroke-dasharray="2 2"/><circle cx="${t.x.toFixed(1)}" cy="${t.y.toFixed(1)}" r="${(fs*0.18).toFixed(1)}" fill="#1E2A47"/><text x="${x.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="end" font-size="${fs}" font-weight="600" fill="#1E2A47" stroke="#fff" stroke-width="${(fs*0.28).toFixed(1)}" paint-order="stroke" font-family="IBM Plex Sans,system-ui,sans-serif" data-tag="1">${t.t}</text>`; }).join(''):''); }).join('');      
  if(o.ctxPad){ const w=X1-X0, h=Y1-Y0; X0-=w*o.ctxPad; X1+=w*o.ctxPad; Y0-=h*o.ctxPad*0.6; Y1+=h*o.ctxPad*0.6; }
  if(o.ctxFit) for(const e of CTXB) if(e.x0<X0-6||e.x1>X1+6||e.y0<Y0-6||e.y1>Y1+6) out[e.i]='';    
  const pad=6, defs=`<defs><pattern id="${id}d" width="4" height="4" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="0.65" fill="#1E2A47"/></pattern><pattern id="${id}n" width="4" height="4" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="0.65" fill="#3D5185"/></pattern><pattern id="${id}hw" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><line x1="0" y1="0" x2="0" y2="3" stroke="#FFFFFF" stroke-opacity=".45" stroke-width="0.8"/></pattern><pattern id="${id}hk" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><line x1="0" y1="0" x2="0" y2="3" stroke="#1E2A47" stroke-opacity=".35" stroke-width="0.8"/></pattern></defs>`;
  return `<svg viewBox="${(X0-pad).toFixed(0)} ${(Y0-pad).toFixed(0)} ${(X1-X0+2*pad).toFixed(0)} ${(Y1-Y0+2*pad).toFixed(0)}"${o.w?` width="${o.w}"`:''}${o.h?` height="${o.h}"`:''} role="img" aria-label="${o.label||(ex?'The plan, storey by storey':'The building\u2019s massing')}">${defs}${guides}${out.join('')}${lab}${ylab}${clab}${tlab}</svg>`; }
 
function legend(storeys,typ,shares,yard){ storeys=norm(storeys).map(s=>Object.assign({},s,{zones:s.zones.map(z=>Object.assign({},z,{zone:z.zone==='clinic'||z.zone==='public-program'?'public':z.zone}))}));     let seen=[...new Set(storeys.flatMap(s=>s.zones.map(z=>z.zone)))].filter(z=>z!=='unassigned').flatMap(z=>z==='circulation'&&storeys.some(s=>s.circulation)?['circ-pub']:[z]); if(storeys.some(s=>s.circulation&&(s.circulation.secure||[]).length)&&!seen.includes('circ-dc')) seen.push('circ-dc'); if(storeys.some(s=>s.circulation&&(s.circulation.public||[]).length)&&!seen.includes('circ-pub')) seen.push('circ-pub'); const pct={}; for(const z of (shares&&shares.byZone)||[]) pct[z.zone]=z.pct; if(pct.circulation!=null&&pct['circ-pub']==null) pct['circ-pub']=pct.circulation; if(pct['circulation-dc']!=null) pct['circ-dc']=pct['circulation-dc']; for(const k of ['clinic','public-program']) if(pct[k]!=null){ pct.public=+(((pct.public||0)+pct[k]).toFixed(1)); delete pct[k]; }
  { const byName={}; seen=seen.filter(z=>{ const n=String(NAME[z]||z).toLowerCase(); if(byName[n]==null){ byName[n]=z; return true; } const k=byName[n]; if(pct[z]!=null) pct[k]=+(((pct[k]||0)+pct[z]).toFixed(1)); return false; }); }    
  return seen.sort((a,b)=>(pct[b]||0)-(pct[a]||0)).map(z=>`<span class="f1m-lg"><svg width="12" height="12" aria-hidden="true"><rect x=".5" y=".5" width="11" height="11" rx="2" fill="${colour(z,typ)}" stroke="rgba(30,42,71,.35)"/>${/circ/.test(z)?'<circle cx="3.5" cy="3.5" r=".8" fill="#1E2A47"/><circle cx="8" cy="3.5" r=".8" fill="#1E2A47"/><circle cx="3.5" cy="8" r=".8" fill="#1E2A47"/><circle cx="8" cy="8" r=".8" fill="#1E2A47"/>':''}</svg>${(NAME[z]||z).replace(/^./,c=>c.toUpperCase())}${pct[z]!=null?' '+pct[z]+' %':(z==='circ-dc'?' (in support)':'')}</span>`).join('')+`<span class="f1m-lg"><svg width="16" height="12" aria-hidden="true"><line x1="1" y1="6" x2="15" y2="6" stroke="#3D5185" stroke-width="1.6"/></svg>Security line, where data-centre circulation meets public</span><span class="f1m-lg"><svg width="16" height="12" aria-hidden="true"><line x1="1" y1="6" x2="15" y2="6" stroke="#C0262D" stroke-width="2"/></svg>Fire separation, stair and lift enclosures</span>${yard?`<span class="f1m-lg"><svg width="12" height="12" aria-hidden="true"><rect x=".5" y=".5" width="11" height="11" rx="2" fill="#C9CCD1" stroke="#8A94AA"/></svg>Plant yard (outdoor, at grade)${yard&&yard.area?' \u00b7 '+Math.round(yard.area).toLocaleString('en-CA')+' m\u00b2'+(yard.pctOfLot!=null?' \u00b7 '+yard.pctOfLot+' % of the lot':''):''}</span><span class="f1m-lg"><svg width="12" height="12" aria-hidden="true"><rect x=".5" y=".5" width="11" height="11" rx="2" fill="#DEE0E4" stroke="#8A94AA"/></svg>Truck court${yard&&yard.truckCourt&&yard.truckCourt.area?' \u00b7 '+Math.round(yard.truckCourt.area).toLocaleString('en-CA')+' m\u00b2'+(yard.truckCourt.pctOfLot!=null?' \u00b7 '+yard.truckCourt.pctOfLot+' % of the lot':''):''}</span>`:''}`; }
 
function fromRooms(S,H,zoneOf){ const sts=Object.keys(S).map(Number).sort((a,b)=>a-b); let z=0; return sts.map((st,i)=>{ const h=(H&&H[i])||4; const z0=z; z+=h; const by={};
  for(const rm of S[st]){ const zn=zoneOf(rm); if(!zn) continue; (by[zn]=by[zn]||[]).push(...(rm.r||[])); } return {st,z0,z1:z,zones:Object.entries(by).map(([zone,rects])=>({zone,rects}))}; }); }
 
function plan(st,o){ o=o||{}; return render([st],Object.assign({},o,{plan:true,labels:false,exploded:false,t:0})); }
BD.f1mass={render,legend,colour,fromRooms,NAME,plan};
})();

 
(function(){ const BD=window.BD=window.BD||{}; if(!BD.f1mass) return;
  const UC={'homes':'#EADFC3','shops and food':'#C8DCCF','offices and business':'#D5DCEA','industry and warehouses':'#ABA59C','schools, health, community':'#CFC4DA','other':'#E4E0D8'};
  const light=(hx,k)=>'#'+[1,3,5].map(i=>{ const c=parseInt(hx.slice(i,i+2),16); return Math.round(c+(255-c)*k).toString(16).padStart(2,'0'); }).join('');
  BD.f1mass.useRoofs=(list,roof)=>!Array.isArray(list)||!Array.isArray(roof)?list:list.map((b,i)=>{ const r=roof[i]; return r&&UC[r[0]]?Object.assign({},b,{roof:light(UC[r[0]],r[1]==='rec'?0.3:0.72)}):b; });
})();

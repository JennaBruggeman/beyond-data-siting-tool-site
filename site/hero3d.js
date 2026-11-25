 
(function(){
'use strict';
const BD=window.BD=window.BD||{};
const TH='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const load=src=>new Promise((ok,no)=>{ if(window.THREE) return ok(); const s=document.createElement('script'); s.src=src; s.onload=ok; s.onerror=()=>no(new Error('could not load '+src)); document.head.appendChild(s); });

const C={paper:0xF6F5F2,ground:0xF0EEE9,lot:0xF8F7F3,street:0xDAD9D5,walk:0xE8E6E1,
  hallF:0xC5D6EC,rack:0x2F5F99,rackFace:0x3F74B3,grille:0x24497A,led:0x7FE3A0,ledB:0x8EC7FF,cont:0xB9D3F0,
  pubF:0xD3E8C4,ghF:0xCBE2BA,fishF:0xC4E6E3,classF:0xDCEBD0,headF:0xE6DCC6,lobF:0xF4F2EC,supF:0xE4E1DA,circF:0xFAF9F6,loadF:0xDCDAD5,spareF:0xF0EFEB,wcF:0xE7EEF2,
  wall:0xFBFAF7,cap:0x2B2D31,glass:0xCFE4EC,core:0xD8D6D1,
  green:0x4F9446,green2:0x6DB35C,green3:0x8CC873,stem:0x3E7D3A,soil:0x7A5C45,bed:0xE9E0D0,tomato:0xD9534F,
  tankW:0xF3F5F5,water:0x4FB3B0,waterTop:0x8ED2CF,steel:0xC4C6C8,steelD:0x8D9094,
  wood:0xCFAE80,woodL:0xE3CBA6,white:0xFFFFFF,chair:0x6E8FB5,chair2:0x9BB86E,board:0xF7F7F7,boardF:0x9C9B97,crate:0xB98B5A,
  screen:0x3A3D42,plant:0xCFCECA,fan:0x4A4D52,edge:0x3E4146,
  skin:[0xF1C9A5,0xD9A57E,0xA8754F,0x7A4E32,0xE8B98F],shirt:[0xCC746C,0x3268A6,0x6DB35C,0xE3B23C,0x7B5EA7,0xFFFFFF,0x1F9A9A,0xE07B39],pants:[0x3A3D42,0x4F5D75,0x6B5B4B,0x2B2D31],
  poolW:0x56C1D6,poolTop:0x9FE0EC,deck:0xE4EEF0,lane:0xF4F4F4,warmWalk:0xF2D8C2,heatLine:0xE07B39,
  house:[0xF3E9DC,0xE4ECF2,0xF2E3E0,0xE9EFE1,0xEFE6CF],roof:[0x8F6F5E,0x6E7F8E,0xA35E4E,0x6B7F5A],school:0xEDE4D3,schoolTrim:0xCC746C,yard:0xE8E2D2,court:0xD9E8D0,
  hiVis:0xE8E23A,guard:0x23324A,fishO:0xE58B3A,fishG:0x7D8C94,van:0xFFFFFF,tyre:0x2B2D31,awnA:0x5E9E4F,awnB:0xF7F5EE,pallet:0xC9A06A,cardboard:0xC8A27A,videoW:0x6FA8DC};

 
const STYLES={
  pastel:{bg:0xF6F5F2,edge:0x3E4146,e1:.62,e2:.3},
  white:{bg:0xF4F4F2,edge:0x8A8C90,e1:.7,e2:.35,col:(c,heat,TC)=>heat?c:(()=>{ const k=new TC(c), l=.299*k.r+.587*k.g+.114*k.b; const v=.86+.12*l; return new TC(v,v,v*.995).getHex(); })()},
  ink:{bg:0xFFFFFF,edge:0x16181B,e1:.95,e2:.75,col:(c,heat,TC)=>heat?c:(()=>{ const k=new TC(c), l=.299*k.r+.587*k.g+.114*k.b; const v=l<.35?.78:.985; return new TC(v,v,v).getHex(); })()},
  vivid:{bg:0xF3EFE6,edge:0x2B2D31,e1:.8,e2:.45,col:(c,heat,TC)=>{ const k=new TC(c), h={}; k.getHSL(h); return new TC().setHSL(h.h,Math.min(1,h.s*1.7+.08),Math.max(.12,h.l*.88)).getHex(); }},
  iso:{bg:0xFFFFFF,edge:0x1E2A47,e1:.9,e2:.45,heatTo:0x7A5AF0,col:(c,heat,TC)=>{ if(heat) return 0x7A5AF0; if([C.paper,C.ground,C.lot,C.street,C.walk,C.yard].includes(c)) return 0xFFFFFF;     const k=new TC(c), l=.299*k.r+.587*k.g+.114*k.b;
    if(l<.3) return 0x9AA6C2;    
    const v=.9+.1*l; return new TC(v*.915,v*.945,v).getHex(); }},
  night:{bg:0x141A26,edge:0x8EA3BF,e1:.35,e2:.18,col:(c,heat,TC)=>{ if(heat) return c; const k=new TC(c), h={}; k.getHSL(h); return new TC().setHSL(h.h,h.s*.6,h.l*.32+.04).getHex(); },
    glow:{0x9DB6D6:0xFFD27A,0x9FC3DC:0xFFE2A0,0x9FE0EC:0x5FD3E8,0x56C1D6:0x2FA9C4,0x7FE3A0:0x7FE3A0,0x8EC7FF:0x8EC7FF,0xFFF3C4:0xFFF3C4,0x6FA8DC:0x6FA8DC,0xF2E6B8:0xFFF0B8}}};
function build(T,D,style){
  const ST_=STYLES[style]||STYLES.pastel, HEATS=new Set([0xE07B39,0xD9822B]);
  const scene=new T.Scene(); scene.background=new T.Color(ST_.bg);
  const MAT={}, mat=(c,o)=>{ const k=c+':'+(o?JSON.stringify(o):''); if(MAT[k]) return MAT[k]; const heat=HEATS.has(c); let col=ST_.col?ST_.col(c,heat,T.Color):c, opt=Object.assign({},o||{});
      if(ST_.glow&&ST_.glow[c]!=null){ col=ST_.glow[c]; opt.emissive=ST_.glow[c]; opt.emissiveIntensity=.85; } if(heat&&style==='night'){ opt.emissive=0xE07B39; opt.emissiveIntensity=1; }
      return MAT[k]=new T.MeshLambertMaterial(Object.assign({color:col,flatShading:true},opt)); };
  const E1=new T.LineBasicMaterial({color:ST_.edge,transparent:true,opacity:ST_.e1}), E2=new T.LineBasicMaterial({color:ST_.edge,transparent:true,opacity:ST_.e2});
  const root=new T.Group(); scene.add(root);
  let PN=0; const pick=a=>a[(PN++)%a.length];
  const gbox=(g,w,h,d,x,y,z,col,edge)=>{ const geo=new T.BoxGeometry(w,h,d), m=new T.Mesh(geo,mat(col)); m.position.set(x,y,z); g.add(m); if(edge){ const e=new T.LineSegments(new T.EdgesGeometry(geo),E2); e.position.copy(m.position); g.add(e); } return m; };
  const add=(g,col,pos,o)=>{ const m=new T.Mesh(g,mat(col,o&&o.m)); m.position.copy(pos); root.add(m);
    if(!(o&&o.noEdge)){ const e=new T.LineSegments(new T.EdgesGeometry(g,25),o&&o.faint?E2:E1); e.position.copy(pos); root.add(e); } return m; };
   
  const box=(x0,x1,y0,y1,z0,z1,col,o)=>add(new T.BoxGeometry(Math.max(.02,x1-x0),Math.max(.02,z1-z0),Math.max(.02,y1-y0)),col,new T.Vector3((x0+x1)/2,(z0+z1)/2,-(y0+y1)/2),o);
  const cyl=(x,y,r,z0,h,col,o)=>add(new T.CylinderGeometry(r,(o&&o.r2)||r,h,(o&&o.seg)||22),col,new T.Vector3(x,z0+h/2,-y),o);
  const ball=(x,y,z,r,col)=>add(new T.IcosahedronGeometry(r,1),col,new T.Vector3(x,z,-y),{noEdge:true});

  const H=D.H, Z=[0]; for(let i=0;i<H.length;i++) Z.push(Z[i]+H[i]);
  const FL=.12, CUTW=.95;    
   
  const DCB=(D.S[3]||[]).flatMap(r=>r.r), GX0=Math.min(...DCB.map(q=>q[0])), GX1=Math.max(...DCB.map(q=>q[1]));
  const CUTX={1:-1e9,2:GX0+(GX1-GX0)*.30,3:GX0+(GX1-GX0)*.45,4:GX0+(GX1-GX0)*.60};
  const clipR=(r,st)=>{ const c=CUTX[st]; if(r[1]<=c+.3) return null; return [Math.max(r[0],c),r[1],r[2],r[3]]; };

   
  const L=D.LOTPOLY, lx=L.map(p=>p[0]), ly=L.map(p=>p[1]), FX=Math.min(...lx);
  box(-170,170,-170,170,-.3,-.06,C.ground,{noEdge:true});
  { const sh=new T.Shape(); L.forEach((p,i)=>i?sh.lineTo(p[0],p[1]):sh.moveTo(p[0],p[1])); const g=new T.ShapeGeometry(sh); g.rotateX(-Math.PI/2); const m=new T.Mesh(g,mat(C.lot)); m.position.y=-.04; root.add(m); }

  const POOLROOM=r=>r.prog==='class_room'&&/_c[123]$/.test(r.id);
  const floorCol=r=>POOLROOM(r)?C.deck:r.prog==='greenhouse'?C.ghF:r.prog==='fish_hall'?C.fishF:r.prog==='headhouse'?C.headF:r.prog==='class_room'?C.classF:r.g==='hall'?C.hallF:/wc/.test(r.prog||r.id)?C.wcF:r.kind==='lobby'?C.lobF:r.g==='pub'?C.pubF:r.g==='circ'?C.circF:r.kind==='bay'?C.loadF:r.g==='spare'?C.spareF:C.supF;
   
  const cutWall=(x0,x1,y0,y1,z)=>{ box(x0,x1,y0,y1,z,z+CUTW,C.wall,{faint:true}); box(x0,x1,y0,y1,z+CUTW,z+CUTW+.06,C.cap,{noEdge:true}); };

  for(const st of Object.keys(D.S).map(Number)){
    const z0=Z[st-1], z1=Z[st], rs=D.S[st]||[];
    const all=rs.flatMap(r=>r.r).map(q=>clipR(q,st)).filter(Boolean); if(!all.length) continue;
    const bx0=Math.min(...all.map(q=>q[0])), bx1=Math.max(...all.map(q=>q[1])), by0=Math.min(...all.map(q=>q[2])), by1=Math.max(...all.map(q=>q[3]));
    if(st>1){  
      box(bx0,bx1,by0,by1,z0-.35,z0,C.wall,{faint:true}); box(bx0,bx0+.12,by0,by1,z0-.36,z0+.01,C.cap,{noEdge:true});
      box(bx0,bx1,by1-.2,by1,z0,z1-.35,C.wall,{faint:true}); box(bx1-.2,bx1,by0,by1,z0,z1-.35,C.wall,{faint:true});
      box(bx0,bx1,by0,by0+.05,z0,z1-.35,C.glass,{m:{transparent:true,opacity:.28},faint:true}); }
    for(const r of rs){ r._q0=null; for(const q0 of r.r){ const q=clipR(q0,st); if(!q) continue; if(!r._q0) r._q0=q;
        const zf=z0+FL; box(q[0],q[1],q[2],q[3],z0,zf,floorCol(r),{faint:true});
        if(r.kind==='score'){ box(q[0]+.15,q[1]-.15,q[2]+.15,q[3]-.15,zf,z1-.4,C.core,{faint:true}); continue; }
         
        if(!r.sky&&!(st===1&&(r.g==='pub'||r.g==='circ'))){ const t=.12; cutWall(q[0],q[1],q[3]-t,q[3],zf); cutWall(q[1]-t,q[1],q[2],q[3],zf); if(st===1||q[0]>CUTX[st]+.4) cutWall(q[0],q[0]+t,q[2],q[3],zf); if(st===1) cutWall(q[0],q[1],q[2],q[2]+t,zf); }
        furnish(r,q,zf,z1,st); } } }

   
   
  function person(x,y,z,o){ o=o||{}; const g=new T.Group(), sk=o.skin||pick(C.skin), sh=o.shirt||pick(C.shirt), pa=o.pants||pick(C.pants), s=o.kid?.68:1, pose=o.pose||'stand';
    const hip=pose==='sit'?.45:.82;
    if(pose==='sit'){ gbox(g,.16,.16,.42,-.1,.45,.12,pa); gbox(g,.16,.16,.42,.1,.45,.12,pa); gbox(g,.14,.45,.14,-.1,.22,.32,pa); gbox(g,.14,.45,.14,.1,.22,.32,pa); }
    else if(pose==='walk'){ const a=.32; const l1=gbox(g,.15,.82,.17,-.1,.41,0,pa); l1.rotation.x=a; const l2=gbox(g,.15,.82,.17,.1,.41,0,pa); l2.rotation.x=-a; }
    else { gbox(g,.15,.82,.17,-.1,.41,0,pa); gbox(g,.15,.82,.17,.1,.41,0,pa); }
    const torso=new T.Group(); torso.position.set(0,hip,0); g.add(torso);
    gbox(torso,.44,.6,.24,0,.3,0,sh,true); if(o.vest) gbox(torso,.46,.42,.26,0,.32,0,C.hiVis);
    const head=new T.Mesh(new T.IcosahedronGeometry(.13,1),mat(sk)); head.position.set(0,.76,0); torso.add(head);
    if(o.cap) gbox(torso,.28,.06,.28,0,.88,0,o.cap);
    const arm=(sx,rx,rz)=>{ const a=new T.Group(); a.position.set(sx*.27,.56,0); torso.add(a); const m=gbox(a,.12,.55,.13,0,-.27,0,sh); a.rotation.x=rx; a.rotation.z=rz; const hnd=new T.Mesh(new T.IcosahedronGeometry(.06,0),mat(sk)); hnd.position.set(0,-.56,0); a.add(hnd); return a; };
    if(pose==='swim'){ arm(-1,3.0,0); arm(1,-.4,0); }
    else if(pose==='bend'){ torso.rotation.x=.75; arm(-1,.9,0); arm(1,.6,0); }
    else if(pose==='push'){ torso.rotation.x=.25; arm(-1,1.1,0); arm(1,1.1,0); }
    else if(pose==='reach'){ arm(-1,0,0); arm(1,2.6,0); }
    else if(pose==='sit'){ arm(-1,.9,0); arm(1,.9,0); }
    else if(pose==='walk'){ arm(-1,-.35,0); arm(1,.35,0); }
    else { arm(-1,.1,.05); arm(1,.1,-.05); }
    if(o.carry){ gbox(torso,.4,.3,.3,0,.3,.32,o.carry,true); }
    if(pose==='swim'){ g.rotation.order='YXZ'; g.rotation.x=-Math.PI/2; }
    g.scale.setScalar(s); g.position.set(x,z,-y); g.rotation.y=((o.face||0)+90)*Math.PI/180;     root.add(g); return g; }
  function fish(x,y,z,col,rot){ const m=new T.Mesh(new T.SphereGeometry(.12,8,6),mat(col)); m.scale.set(1.9,.55,.8); m.position.set(x,z,-y); m.rotation.y=rot||0; root.add(m);
    const tail=new T.Mesh(new T.ConeGeometry(.08,.14,4),mat(col)); tail.rotation.z=Math.PI/2; tail.position.set(x-.26*Math.cos(rot||0),z,-y+.26*Math.sin(rot||0)); root.add(tail); }
  function van(x0,y0,len,dir){  
    const x1=x0+len, cab=dir>0?[x1-1.4,x1]:[x0,x0+1.4], body=dir>0?[x0,x1-1.4]:[x0+1.4,x1];
    box(body[0],body[1],y0,y0+2,.35,2.5,C.van,{}); box(cab[0],cab[1],y0,y0+2,.35,1.9,C.van,{}); box(dir>0?cab[1]-.05:cab[0],dir>0?cab[1]:cab[0]+.05,y0+.2,y0+1.8,1.1,1.75,C.glass,{noEdge:true});
    box(body[0]+.2,body[1]-.2,y0-.01,y0,1.2,1.6,C.awnA,{noEdge:true});
    for(const wx of [x0+.8,x1-.8]) for(const wy of [y0-.02,y0+2.02]){ const t=new T.Mesh(new T.CylinderGeometry(.36,.36,.24,14),mat(C.tyre)); t.rotation.x=Math.PI/2; t.position.set(wx,.36,-wy); root.add(t); } }
  function stall(x,y,z,w,d,awn){  
    box(x,x+w,y,y+d,z,z+.85,C.woodL,{}); for(let i=0;i<Math.floor(w/.55);i++) crate(x+.05+i*.55,y+.1,z+.85,[C.green2,C.tomato,0xE3B23C,C.green][i%4]);
    for(const [a,b] of [[x,y],[x+w,y],[x,y+d],[x+w,y+d]]) box(a-.04,a+.04,b-.04,b+.04,z,z+2.3,C.steelD,{noEdge:true});
    const n=6; for(let i=0;i<n;i++) box(x+i*w/n,x+(i+1)*w/n,y-.2,y+d+.2,z+2.3,z+2.38,i%2?C.awnB:awn,{noEdge:true}); }
  function pallet(x,y,z,n){ box(x,x+1.2,y,y+1,z,z+.14,C.pallet,{faint:true}); for(let i=0;i<n;i++){ const k=i%4, l=Math.floor(i/4); box(x+.05+(k%2)*.56,x+.6+(k%2)*.56,y+.05+(k>1?.46:0),y+.5+(k>1?.46:0),z+.14+l*.42,z+.54+l*.42,C.cardboard,{faint:true}); } }
  function pool(x0,x1,y0,y1,z){  
    const bx0=x0+1.0, bx1=x1-1.2, by0=y0+1.2, by1=Math.min(y1-1.0,by0+25);
    for(const [a,b,c,d] of [[bx0-.3,bx1+.3,by0-.3,by0],[bx0-.3,bx1+.3,by1,by1+.3],[bx0-.3,bx0,by0,by1],[bx1,bx1+.3,by0,by1]]) box(a,b,c,d,z,z+.2,C.white,{});
    box(bx0,bx1,by0,by1,z,z+.13,C.poolW,{noEdge:true}); box(bx0,bx1,by0,by1,z+.13,z+.15,C.poolTop,{noEdge:true,m:{transparent:true,opacity:.6}});
    const nl=Math.max(2,Math.floor((bx1-bx0)/1.9)); for(let i=1;i<nl;i++){ const lx=bx0+i*(bx1-bx0)/nl; for(let y=by0;y<by1;y+=.5) box(lx-.04,lx+.04,y,y+.25,z+.15,z+.2,(Math.floor((y-by0)/.5)%2)?C.lane:C.tomato,{noEdge:true}); }
    for(let i=0;i<nl;i++){ const lx=bx0+(i+.5)*(bx1-bx0)/nl; person(lx,by0+3+i*5.5,z+.18,{pose:'swim',face:i%2?90:270,shirt:pick(C.shirt)}); }
    box(x1-.9,x1-.3,cy0(y0,y1)-.4,cy0(y0,y1)+.4,z,z+1.9,C.white,{}); person(x1-.6,cy0(y0,y1),z+1.9,{pose:'sit',face:180,shirt:C.tomato});
    box(x0+.15,x0+.6,y1-6,y1-1.5,z,z+.45,C.woodL,{faint:true}); person(x0+.4,y1-3,z,{pose:'sit',face:0,kid:true}); person(x0+.4,y1-4.2,z,{pose:'sit',face:0});
    person(bx0-.5,by1-2,z,{face:0,shirt:0x1F9A9A}); }
  function cy0(a,b){ return (a+b)/2; }
  function house(x0,y0,w,d,fl,col,rc){  
    const h=fl*3; box(x0,x0+w,y0,y0+d,0,h,col,{});
    const sh=new T.Shape(); sh.moveTo(0,0); sh.lineTo(w+.6,0); sh.lineTo(w/2+.3,2.2); sh.lineTo(0,0); const g=new T.ExtrudeGeometry(sh,{depth:d+.6,bevelEnabled:false}); const m=new T.Mesh(g,mat(rc)); m.position.set(x0-.3,h,-(y0-.3)); m.rotation.y=Math.PI; m.position.x=x0+w+.3; root.add(m);
    const e=new T.LineSegments(new T.EdgesGeometry(g),E1); e.position.copy(m.position); e.rotation.copy(m.rotation); root.add(e);
    for(let f=0;f<fl;f++) for(let k=0;k<2;k++) box(x0+w-.01,x0+w+.02,y0+1+k*(d-3),y0+2+k*(d-3),f*3+1,f*3+2.1,0x9DB6D6,{noEdge:true});
    box(x0+w-.01,x0+w+.02,y0+d/2-.5,y0+d/2+.5,0,2.1,0x8C6E52,{noEdge:true}); }
  function school(x0,x1,y0,y1){  
    box(x0,x1,y0,y1,0,7.6,C.school,{}); box(x0,x1,y0,y1,7.6,7.8,0xE2DED5,{}); box(x0-.03,x1+.03,y0-.03,y1+.03,6.6,6.95,C.schoolTrim,{noEdge:true});
    for(let f=0;f<2;f++) for(let y=y0+1.2;y<y1-1;y+=2.4) box(x1-.01,x1+.03,y,y+1.5,1.2+f*3.6,2.8+f*3.6,0x9DB6D6,{noEdge:true});
    box(x1,x1+2,(y0+y1)/2-2,(y0+y1)/2+2,3,3.2,C.schoolTrim,{}); box(x1-.01,x1+.03,(y0+y1)/2-1,(y0+y1)/2+1,0,2.4,0x8C6E52,{noEdge:true}); }
   
  const HEATMAT=()=>mat(C.heatLine,{emissive:style==='iso'?0x2A1470:0x7A3300});    
  function heatPath(pts,r){ r=r||.22; for(let i=0;i+1<pts.length;i++){ const a=pts[i], b=pts[i+1], A=new T.Vector3(a[0],a[2],-a[1]), B=new T.Vector3(b[0],b[2],-b[1]), L=A.distanceTo(B); if(L<.01) continue;
      const c=new T.Mesh(new T.CylinderGeometry(r,r,L,10),HEATMAT()); c.position.copy(A).add(B).multiplyScalar(.5); c.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),B.clone().sub(A).normalize()); root.add(c);
      const sp=new T.Mesh(new T.SphereGeometry(r*1.05,10,8),HEATMAT()); sp.position.copy(B); root.add(sp);
      for(let t=3;t<L-1;t+=5){ const P=A.clone().lerp(B,t/L), cn=new T.Mesh(new T.ConeGeometry(r*2.1,r*4,10),HEATMAT()); cn.position.copy(P); cn.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),B.clone().sub(A).normalize()); root.add(cn); } } }
  function jack(x,y,z){ box(x,x+.55,y,y+1.1,z+.05,z+.12,C.tomato,{noEdge:true}); box(x+.2,x+.35,y+1.05,y+1.15,z,z+1.0,C.tomato,{noEdge:true}); }

   
  function rack(x,y,z,face){  
    box(x,x+.6,y,y+1.2,z,z+2.0,C.rack,{faint:true}); const fy=face>0?y+1.2:y, d=face>0?.02:-.02;    
    box(x+.05,x+.55,Math.min(fy,fy+d),Math.max(fy,fy+d),z+.1,z+1.9,C.rackFace,{noEdge:true});
    for(let k=0;k<6;k++) box(x+.08,x+.52,Math.min(fy+d,fy+2*d),Math.max(fy+d,fy+2*d),z+.22+k*.27,z+.27+k*.27,C.grille,{noEdge:true});
    box(x+.42,x+.48,Math.min(fy+d,fy+2.5*d),Math.max(fy+d,fy+2.5*d),z+1.72,z+1.78,(Math.floor(x*7)%3)?C.led:C.ledB,{noEdge:true}); }
  function plantClump(x,y,z,s,ripe){ box(x-.02,x+.02,y-.02,y+.02,z,z+.35*s,C.stem,{noEdge:true});
    ball(x,y,z+.45*s,.26*s,C.green); ball(x+.15*s,y+.1*s,z+.55*s,.2*s,C.green2); ball(x-.14*s,y-.08*s,z+.58*s,.18*s,C.green3); if(ripe){ ball(x+.18*s,y-.12*s,z+.38*s,.07*s,C.tomato); ball(x-.1*s,y+.14*s,z+.44*s,.06*s,C.tomato); } }
  function chairAt(x,y,z,rot,col){ box(x-.22,x+.22,y-.22,y+.22,z+.42,z+.47,col,{noEdge:true}); for(const [a,b] of [[-.18,-.18],[.18,-.18],[-.18,.18],[.18,.18]]) box(x+a-.02,x+a+.02,y+b-.02,y+b+.02,z,z+.42,C.steelD,{noEdge:true});
    const by=rot>0?y+.2:y-.2; box(x-.22,x+.22,by-.03,by+.03,z+.47,z+.9,col,{noEdge:true}); }
  function crate(x,y,z,c){ box(x,x+.5,y,y+.35,z,z+.28,C.crate,{faint:true}); for(let i=0;i<3;i++) ball(x+.1+i*.15,y+.17,z+.3,.07,c); }

  function furnish(r,q,z,ztop,st){ const [x0,x1,y0,y1]=q, w=x1-x0, d=y1-y0, cx=(x0+x1)/2, cy=(y0+y1)/2;
    if(r.g==='hall'){  
      for(let y=y0+1.3,k=0;y+1.2<y1-.9;y+=3.4,k++){ for(let x=x0+.9;x+.6<x1-.9;x+=.62) rack(x,y,z,k%2?1:-1); }
      for(let y=y0+2.4;y+1<y1-.9;y+=6.6) box(x0+.9,x1-.9,y,y+1.0,z+2.0,z+2.04,C.cont,{m:{transparent:true,opacity:.55},faint:true});
      if(q===r._q0&&st===3){ person(x0+1.6,y0+2.85,z,{face:90,shirt:0xFFFFFF}); box(x0+1.9,x0+2.4,y0+2.6,y0+3.0,z,z+.9,C.steelD,{}); }
      return; }
    if(r.prog==='greenhouse'){  
      for(let x=x0+.6,k=0;x+1.1<x1-.3;x+=1.9,k++){ box(x,x+1.1,y0+.8,y1-.8,z,z+.6,C.bed,{faint:true}); box(x+.05,x+1.05,y0+.85,y1-.85,z+.6,z+.66,C.soil,{noEdge:true});
        for(let y=y0+1.2;y<y1-1.0;y+=.75) plantClump(x+.55+((Math.round(y*4)%2)?.18:-.18),y,z+.66,1.25,k%2===1); }
      const fz=z+4.2, rz=z+6.0; for(let y=y0;y<=y1+.01;y+=3){ const P=[[x0,z],[x0,fz],[cx,rz],[x1,fz],[x1,z]].map(p=>new T.Vector3(p[0],p[1],-y)); root.add(new T.Line(new T.BufferGeometry().setFromPoints(P),new T.LineBasicMaterial({color:0xA9BFC6}))); }
      for(const [xx,zz] of [[x0,fz],[cx,rz],[x1,fz]]) root.add(new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(xx,zz,-y0),new T.Vector3(xx,zz,-y1)]),new T.LineBasicMaterial({color:0xA9BFC6})));
      for(let x=x0+1.15;x<x1-.3;x+=1.9) box(x-.04,x+.04,y0+1,y1-1,z+2.6,z+2.66,0xF2E6B8,{noEdge:true});
      person(x0+1.95,y0+4,z,{pose:'bend',face:180,cap:0xE3B23C}); person(x0+3.85,y0+9.5,z,{pose:'bend',face:0}); person(x0+5.8,y0+6.5,z,{pose:'stand',face:200,carry:C.crate});
      box(x0+1.75,x0+2.4,y1-3.2,y1-2.3,z+.25,z+.75,C.steel,{}); crate(x0+1.8,y1-3.1,z+.75,C.tomato); crate(x0+1.8,y1-2.7,z+.75,C.green2);
      for(const [a,b] of [[x0+1.85,y1-3.1],[x0+2.3,y1-3.1],[x0+1.85,y1-2.4],[x0+2.3,y1-2.4]]){ const t=new T.Mesh(new T.CylinderGeometry(.08,.08,.06,10),mat(C.tyre)); t.rotation.x=Math.PI/2; t.position.set(a,z+.1,-b); root.add(t); }
      return; }
    if(r.prog==='fish_hall'){  
      let ti=0; for(let tx=x0+1.2;tx<x1-1.6;tx+=2.2) for(let ty=y0+1.2;ty<y1-.9;ty+=2.2,ti++){
        { const g=new T.CylinderGeometry(.95,.95,1.15,28,1,true), m=new T.Mesh(g,mat(C.tankW,{side:T.DoubleSide})); m.position.set(tx,z+.575,-ty); root.add(m); const e=new T.LineSegments(new T.EdgesGeometry(g,30),E1); e.position.copy(m.position); root.add(e);
          const rim=new T.Mesh(new T.TorusGeometry(.95,.04,6,28),mat(C.white)); rim.rotation.x=Math.PI/2; rim.position.set(tx,z+1.15,-ty); root.add(rim); cyl(tx,ty,.94,z,.05,0x2E8C89,{seg:28,noEdge:true}); }
        for(let f=0;f<4;f++){ const a=f*1.6+ti; fish(tx+.45*Math.cos(a),ty+.45*Math.sin(a),z+1.0,f%3?C.fishG:C.fishO,a+1.57); }
        cyl(tx,ty,.93,z+.98,.04,C.waterTop,{seg:28,noEdge:true,m:{transparent:true,opacity:.45}}); }
      person(x0+.6,y0+2.3,z,{pose:'reach',face:0,shirt:C.teal}); box(x0+1.0,x0+1.04,y0+2.25,y0+2.35,z+1.5,z+2.6,C.steelD,{noEdge:true});
      box(x1-1.4,x1-.3,y0+.5,y0+2.4,z,z+1.3,C.steel,{}); cyl(x1-.85,y0+3.2,.35,z,1.5,C.steel,{seg:14}); box(x1-1.3,x1-.4,y0+2.5,y0+2.6,z+1.1,z+1.2,C.steelD,{noEdge:true});
      return; }
    if(r.prog==='headhouse'){  
      box(x0+.5,x1-.5,cy-.35,cy+.35,z,z+.95,C.woodL,{}); for(let x=x0+.7;x<x1-1;x+=.65) crate(x,cy-.17,z+.95,(Math.round(x*3)%2)?C.green2:C.tomato);
      box(x0+.4,x0+1.4,y1-.5,y1-.15,z,z+1.6,C.wood,{faint:true}); for(let k=0;k<3;k++) box(x0+.45,x0+1.35,y1-.5,y1-.15,z+.4+k*.45,z+.43+k*.45,C.woodL,{noEdge:true});
      person(cx+1.6,cy+.75,z,{face:270,shirt:C.green2,cap:C.green}); person(cx-1.2,cy-.85,z,{face:90}); person(cx+.4,cy-.95,z,{face:80,carry:0xF7F5EE});
      return; }
    if(POOLROOM(r)){ if(/_c3$/.test(r.id)){ const P=(D.S[1]||[]).filter(POOLROOM).flatMap(k=>k.r), px0=Math.min(...P.map(q=>q[0])), px1=Math.max(...P.map(q=>q[1])), py0=Math.min(...P.map(q=>q[2])), py1=Math.max(...P.map(q=>q[3])); pool(px0,px1,py0,py1,z); } return; }
    if(r.prog==='class_room'){  
      const cols=Math.max(1,Math.floor((w-1.2)/2.2)), rows=Math.max(1,Math.floor((d-2.0)/1.9));
      for(let i=0;i<cols;i++) for(let j=0;j<rows;j++){ const x=x0+.9+i*2.2, y=y0+.9+j*1.9; box(x,x+1.5,y,y+.7,z+.7,z+.75,C.white,{faint:true}); for(const [a,b] of [[.08,.08],[1.42,.08],[.08,.62],[1.42,.62]]) box(x+a-.02,x+a+.02,y+b-.02,y+b+.02,z,z+.7,C.steelD,{noEdge:true});
        chairAt(x+.4,y-.35,z,-1,(i+j)%2?C.chair:C.chair2); chairAt(x+1.1,y-.35,z,-1,(i+j)%2?C.chair2:C.chair); }
      box(x0+1,x1-1,y1-.2,y1-.16,z+.3,z+.95,C.board,{}); box(x0+1,x1-1,y1-.2,y1-.14,z+.28,z+.3,C.boardF,{noEdge:true});
      box(cx-.6,cx+.6,y1-1.2,y1-.7,z+.72,z+.76,C.woodL,{faint:true});
      if(/c6$|c9$/.test(r.id)){ for(let i=0;i<cols;i++) for(let j=0;j<rows;j++){ const x=x0+.9+i*2.2, y=y0+.9+j*1.9; person(x+.4,y-.35,z,{pose:'sit',face:90,kid:true}); if((i+j)%2) person(x+1.1,y-.35,z,{pose:'sit',face:90,kid:true}); } person(cx+.9,y1-.9,z,{face:270,shirt:0x7B5EA7}); }
      return; }
    if(r.kind==='lobby'){ box(cx-1.5,cx+1.5,cy-.45,cy+.35,z,z+1.05,C.woodL,{}); box(cx-1.5,cx+1.5,cy-.45,cy+.35,z+1.05,z+1.1,C.wood,{noEdge:true});
      for(const px of [x0+.7,x1-.7]){ cyl(px,y0+.7,.35,z,.5,C.white,{seg:14}); ball(px,y0+.7,z+.85,.42,C.green2); }
      box(x0+.5,x0+2.5,y1-.7,y1-.3,z,z+.45,C.chair,{faint:true}); person(cx,cy+.85,z,{face:270,shirt:C.white}); person(cx-.6,cy-1.3,z,{pose:'walk',face:80}); person(cx+.8,cy-1.6,z,{pose:'walk',face:100,kid:true}); return; }
    if(/wc/.test(r.prog||r.id)){ box(x0+.3,x0+.8,cy-.2,cy+.2,z,z+.42,C.white,{faint:true}); box(x1-.9,x1-.3,y1-.45,y1-.25,z+.75,z+.85,C.white,{faint:true}); return; }
    if(r.kind==='entry'){ box(x0+.6,x0+1.4,cy-.3,cy+.3,z,z+1.05,C.steel,{}); for(let y=y0+.6;y<y1-.4;y+=.9) box(cx+.4,cx+.5,y,y+.08,z,z+1.0,C.steelD,{noEdge:true}); person(x0+1.0,cy+.8,z,{face:180,shirt:C.guard,pants:C.guard,cap:C.guard}); return; }
    if(r.kind==='bay'){ if(/b1$/.test(r.id)){ van(x0+.6,y0+.3,6.2,-1); person(x1-1.2,y0+1.3,z,{pose:'push',face:0,vest:true}); jack(x1-.6,y0+.8,z); pallet(x1-.6,y0+2.2,z,6); }
      if(/b2$/.test(r.id)){ pallet(x0+1,y0+.8,z,8); pallet(x0+2.5,y0+.8,z,4); person(x0+4.4,y0+1.6,z,{face:200,vest:true,carry:C.cardboard}); } for(let y=y0+.3;y<y1;y+=1.0) box(x0+.3,x0+.36,y,y+.5,z,z+.01,0xFFFFFF,{noEdge:true}); return; }
    if(r.kind==='sroom'){ const p=r.prog||'';
      if(/mv|valv/.test(p)){ for(let x=x0+.4;x+.8<x1-.3;x+=.88){ box(x,x+.8,y1-1.0,y1-.35,z,z+2.1,C.steel,{faint:true}); box(x+.1,x+.7,y1-1.02,y1-1.0,z+1.2,z+1.8,C.steelD,{noEdge:true}); } return; }
      if(/noc/.test(p)){  
        for(let i=0;i<4;i++) for(let k=0;k<2;k++) box(x0+.6+i*1.15,x0+1.65+i*1.15,y1-.25,y1-.2,z+1.0+k*.65,z+1.58+k*.65,C.videoW,{noEdge:true,m:{emissive:0x24497A}});
        box(x0+.8,x1-.8,cy-.1,cy+.5,z,z+.78,C.white,{faint:true}); for(let i=0;i<3;i++) box(x0+1.2+i*1.3,x0+2.1+i*1.3,cy+.35,cy+.4,z+.78,z+1.25,C.screen,{noEdge:true});
        chairAt(x0+2,cy-.4,z,-1,C.chair); person(x0+2,cy-.4,z,{pose:'sit',face:90,shirt:C.guard,pants:C.guard}); person(x1-1.2,cy-.6,z,{face:150,shirt:C.guard,pants:C.guard,cap:C.guard}); return; }
      if(/ship/.test(p)){  
        pallet(x0+.6,y0+.6,z,8); pallet(x0+2.1,y0+.6,z,6); pallet(x0+.6,y0+2.1,z,4); box(x0+3.8,x0+4.6,y0+.6,y0+2.6,z,z+1.8,C.rack,{}); box(x0+3.8,x0+4.6,y0+.58,y0+.6,z+.1,z+1.7,C.cardboard,{noEdge:true});
        for(let x=x0+.5;x+.5<x1-.3;x+=1.6){ box(x,x+.5,y1-1.1,y1-.4,z,z+2.0,C.steel,{faint:true}); for(let k=0;k<3;k++) box(x+.03,x+.47,y1-1.08,y1-.42,z+.5+k*.55,z+.85+k*.55,C.cardboard,{faint:true}); }
        jack(x0+5.4,y0+1.2,z); person(x0+5.6,y0+.6,z,{pose:'push',face:180,vest:true}); person(x0+2.8,y0+3.6,z,{face:300,carry:C.cardboard}); person(x1-1.4,y1-1.6,z,{pose:'reach',face:90,vest:true}); return; }
      if(/doff|brk/.test(p)){ for(let x=x0+.6;x+1.4<x1-.3;x+=2){ box(x,x+1.4,cy-.35,cy+.35,z+.72,z+.76,C.white,{faint:true}); box(x+.2,x+1.2,cy+.15,cy+.2,z+.76,z+1.2,C.screen,{noEdge:true}); chairAt(x+.7,cy-.7,z,-1,C.chair); } return; }
      if(/ship|dcstor|mmr|garb|jan/.test(p)){ for(let x=x0+.4;x+.5<x1-.3;x+=1.4){ box(x,x+.5,y0+.4,y1-.4,z,z+2.0,C.steel,{faint:true}); for(let k=0;k<4;k++) box(x+.02,x+.48,y0+.45,y1-.45,z+.4+k*.45,z+.43+k*.45,C.steelD,{noEdge:true}); } return; } }
  }

   
  { const gh=(D.S[1]||[]).find(r=>r.prog==='greenhouse'), lob=(D.S[1]||[]).find(r=>r.kind==='lobby');
    if(gh){ const ex=gh.r[0][0], sx=FX+4.2; stall(sx,1.5,0,3.2,1.4,C.awnA); stall(sx,6.0,0,3.2,1.4,C.tomato); stall(sx,10.5,0,3.2,1.4,0xE3B23C); stall(sx+5,8.2,0,2.6,1.2,C.awnA);
      person(sx+1.6,.6,0,{face:90}); person(sx+1.0,.6,0,{face:90,kid:true}); person(sx+2.2,5.1,0,{face:90,carry:C.green2}); person(sx+4.2,3.4,0,{pose:'walk',face:300}); person(sx+1.2,9.6,0,{face:90}); person(sx+6.3,7.3,0,{face:90,carry:C.tomato});
      person(sx+1.4,3.4,0,{face:270,shirt:C.green2,cap:C.green}); person(sx+1.4,7.9,0,{face:270,shirt:C.green2,cap:C.green}); person(sx+1.4,12.4,0,{face:270,shirt:C.green2,cap:C.green});
      person(FX-1.5,-14,0,{pose:'walk',face:90}); person(FX-2.6,-2,0,{pose:'walk',face:270}); person(FX+1.5,-15.8,0,{pose:'walk',face:0}); person(FX+1.9,-16.3,0,{pose:'walk',face:0,kid:true});
      person(ex-2.2,lob?(lob.r[0][2]+lob.r[0][3])/2:-12,0,{pose:'walk',face:0});
       
      for(let i=0;i<4;i++){ const by=-13+i*.9; const t=new T.Mesh(new T.TorusGeometry(.32,.03,6,16),mat(C.steelD)); t.position.set(ex-3.5,.32,-by); t.rotation.y=Math.PI/2; root.add(t); }
      box(ex-6,ex-4.6,-8,-4,0,.5,C.bed,{}); for(let y=-7.6;y<-4;y+=.8) plantClump(ex-5.3,y,.5,1.1,false); } }

   
  const ST={x0:FX-16,x1:FX-4}, SY={y0:-66,y1:-54}, R0=-150, R1=150;
  {  
    box(ST.x0,ST.x1,R0,R1,-.05,-.01,C.street,{noEdge:true}); box(R0,R1,SY.y0,SY.y1,-.05,-.01,C.street,{noEdge:true});
    for(let y=R0;y<R1;y+=6) if(y<SY.y0-1||y>SY.y1+1) box((ST.x0+ST.x1)/2-.08,(ST.x0+ST.x1)/2+.08,y,y+3,0,.01,0xF7F5EE,{noEdge:true});
    for(let x=R0;x<R1;x+=6) if(x<ST.x0-1||x>ST.x1+1) box(x,x+3,(SY.y0+SY.y1)/2-.08,(SY.y0+SY.y1)/2+.08,0,.01,0xF7F5EE,{noEdge:true});
    box(ST.x1-1.8,ST.x1-1.7,R0,R1,0,.012,0x6DB35C,{noEdge:true});    
    for(let i=0;i<7;i++){ box(ST.x0+.6+i*1.6,ST.x0+1.4+i*1.6,SY.y1+.4,SY.y1+3.4,0,.015,0xF7F5EE,{noEdge:true}); box(ST.x0-3.4,ST.x0-.4,SY.y0+.6+i*1.6,SY.y0+1.4+i*1.6,0,.015,0xF7F5EE,{noEdge:true}); }
    const walk=(a,b,c,d,col)=>box(a,b,c,d,-.04,.15,col||C.walk,{faint:true});
    walk(ST.x0-3.5,ST.x0,R0,SY.y0); walk(ST.x0-3.5,ST.x0,SY.y1,R1); walk(ST.x1+4,ST.x1+4,R0,SY.y0);
    walk(R0,ST.x0,SY.y1,SY.y1+3.5); walk(ST.x1,R1,SY.y1,SY.y1+3.5); walk(R0,ST.x0,SY.y0-3.5,SY.y0); walk(ST.x1,R1,SY.y0-3.5,SY.y0);
    walk(ST.x1,ST.x1+4,SY.y1+3.5,Math.min(...ly)-.5); walk(ST.x1,ST.x1+4,Math.max(...ly)+.5,R1); walk(ST.x1,ST.x1+4,R0,SY.y0-3.5);
     
    box(ST.x1,ST.x1+4,Math.min(...ly)-.5,Math.max(...ly)+.5,-.04,.16,C.warmWalk,{noEdge:true});
    for(let y=Math.min(...ly)+1;y<Math.max(...ly)-2;y+=3) for(let k=0;k<3;k++) box(ST.x1+.5+k*1.1,ST.x1+.62+k*1.1,y,y+2.4,.16,.18,C.heatLine,{noEdge:true,m:{transparent:true,opacity:.45}}); }

   
  function midrise(x0,x1,y0,y1,fl,col,o){ o=o||{}; const g0=4.5, h=g0+3*(fl-1);
    box(x0,x1,y0,y1,0,h,col,{}); box(x0-.02,x1+.02,y0-.02,y1+.02,h,h+.5,0xE8E5DE,{});    
    if(o.shopW!==false){ box(x0-.03,x0,y0+.6,y1-.6,.3,3.6,0x9FC3DC,{noEdge:true,m:{transparent:true,opacity:.85}}); box(x0-1.4,x0,y0+.6,y1-.6,3.6,3.75,o.awn||C.awnA,{noEdge:true}); box(x0-.04,x0,y0+.6,y1-.6,3.9,4.3,0x3A3D42,{noEdge:true}); }
    if(o.shopS!==false){ box(x0+.6,x1-.6,y0-.03,y0,.3,3.6,0x9FC3DC,{noEdge:true,m:{transparent:true,opacity:.85}}); box(x0+.6,x1-.6,y0-1.4,y0,3.6,3.75,o.awn2||o.awn||C.tomato,{noEdge:true}); }
    for(let f=1;f<fl;f++){ const z=g0+3*(f-1)+.8;
      for(let y=y0+1;y<y1-1.2;y+=2.4) box(x0-.03,x0,y,y+1.4,z,z+1.5,0x9DB6D6,{noEdge:true});
      for(let x=x0+1;x<x1-1.2;x+=2.4) box(x,x+1.4,y0-.03,y0,z,z+1.5,0x9DB6D6,{noEdge:true});
      if(o.balc&&f%1===0) for(let x=x0+1.6;x<x1-2;x+=4.8){ box(x-.4,x+1.8,y0-1.2,y0,z-.8,z-.65,0xFFFFFF,{faint:true}); box(x-.4,x+1.8,y0-1.22,y0-1.15,z-.65,z+.2,0xFFFFFF,{faint:true,m:{transparent:true,opacity:.6}}); } }
    for(let k=0;k<2;k++) box(x0+2+k*4,x0+4+k*4,y1-6,y1-4,h+.5,h+1.6,C.plant,{faint:true});    
    const rf=o.roof||['green','solar','plain'][(Math.round(x0+y0)%3+3)%3];
    if(rf==='green'){ box(x0+.8,x1-.8,y0+.8,y1-.8,h+.02,h+.12,0xCFE3BF,{noEdge:true}); for(let x=x0+2;x<x1-2;x+=3.5) for(let y=y0+2;y<y1-7;y+=3.5) ball(x,y,h+.5,.5,(Math.round(x+y)%2)?C.green2:C.green3); }
    else if(rf==='solar'){ for(let x=x0+1.5;x<x1-2.5;x+=2.4) for(let y=y0+1.5;y<y1-7.5;y+=1.6) box(x,x+2.0,y,y+1.3,h+.25,h+.32,0x34495E,{faint:true}); } }

  {  
    const wx1=ST.x0-3.5, sx1=wx1-3, sx0=sx1-18; school(sx0,sx1,-24,-4); box(sx0-6,sx1,-48,-25,-.04,.02,C.yard,{noEdge:true}); box(sx0,sx0+12,-46,-28,.02,.04,C.court,{noEdge:true});
    for(let i=0;i<10;i++) person(sx0+2+(i%5)*2.4,-44+Math.floor(i/5)*4+(i%2),0,{kid:true,pose:i%3?'walk':'stand',face:i*40});
    midrise(wx1-20,wx1-1,0,24,5,0xEAD9C6,{awn:C.awnA,balc:true}); midrise(wx1-20,wx1-1,27,52,6,0xDCE3E8,{awn:0xE3B23C,balc:true});
    midrise(wx1-20,wx1-1,-50,-28,4,0xE7DDE6,{awn:C.tomato,shopS:true});
     
    midrise(wx1-22,wx1-1,-100,-70,6,0xE9E4D6,{awn:C.awnA,balc:true}); }
  {  
    const yb=Math.min(...ly)-4; midrise(ST.x1+5,-20,-50,yb,3,0xE4E9E1,{awn:0xE3B23C,balc:true}); midrise(-16,14,-50,yb,3,0xEFE3D3,{awn:C.tomato,shopW:false});
    midrise(18,52,-50,yb,6,0xDDE5EC,{awn:C.awnA,balc:true,shopW:false});
    midrise(ST.x1+5,-10,-100,-70,7,0xE6DFD3,{awn:C.tomato,balc:true}); midrise(-6,40,-100,-70,5,0xE2E8EE,{awn:C.awnA,balc:true}); }
  {  
    const yt=Math.max(...ly)+4; midrise(ST.x1+5,-20,yt,yt+24,6,0xE9E1D5,{awn:C.awnA,balc:true}); midrise(-16,22,yt,yt+24,7,0xDFE6EA,{awn:0xE3B23C,balc:true}); midrise(26,60,yt,yt+24,5,0xEBE5DA,{awn:C.tomato});
    midrise(62,92,-40,20,6,0xE4E1EA,{awn:C.awnA,balc:true}); }

   
  function streetLight(x,y,dir){ cyl(x,y,.07,0,7,0x6E7176,{seg:8,noEdge:true}); box(x,x+dir*1.6,y-.05,y+.05,6.9,7,0x6E7176,{noEdge:true}); box(x+dir*1.4-.25,x+dir*1.4+.25,y-.15,y+.15,6.75,6.9,0xFFF3C4,{noEdge:true}); }
  function car(x,y,along,col,park){  
    const L=4.2,W=1.8; const [a0,a1,b0,b1]=along==='y'?[x-W/2,x+W/2,y-L/2,y+L/2]:[x-L/2,x+L/2,y-W/2,y+W/2];
    box(a0,a1,b0,b1,.3,1.0,col,{}); const [c0,c1,d0,d1]=along==='y'?[a0+.1,a1-.1,b0+1.0,b1-1.2]:[a0+1.0,a1-1.2,b0+.1,b1-.1]; box(c0,c1,d0,d1,1.0,1.55,0xBFD4E0,{});
    for(const [wx,wy] of along==='y'?[[a0,b0+.9],[a1,b0+.9],[a0,b1-.9],[a1,b1-.9]]:[[a0+.9,b0],[a0+.9,b1],[a1-.9,b0],[a1-.9,b1]]){ const t=new T.Mesh(new T.CylinderGeometry(.32,.32,.22,12),mat(C.tyre)); if(along==='y') t.rotation.z=Math.PI/2; else t.rotation.x=Math.PI/2; t.position.set(wx,.32,-wy); root.add(t); } }
  function bike(x,y,rider){ for(const d of [-.55,.55]){ const t=new T.Mesh(new T.TorusGeometry(.33,.035,6,14),mat(C.tyre)); t.position.set(x,.35,-(y+d)); t.rotation.y=Math.PI/2; root.add(t); } box(x-.03,x+.03,y-.5,y+.5,.55,.6,0x3268A6,{noEdge:true});
    if(rider) person(x,y,.35,{pose:'sit',face:90}); }
  function bench(x,y){ box(x-.25,x+.25,y-.9,y+.9,.42,.48,C.wood,{noEdge:true}); box(x-.03,x+.03,y-.9,y+.9,.48,.85,C.wood,{noEdge:true}); }
  function cafe(x,y,col){ cyl(x,y,.4,.7,.04,0xFFFFFF,{seg:12,noEdge:true}); cyl(x,y,.04,0,.7,0x6E7176,{seg:6,noEdge:true}); cyl(x,y,.05,0,2.3,0x6E7176,{seg:6,noEdge:true}); add(new T.ConeGeometry(1.2,.5,8),col,new T.Vector3(x,2.45,-y),{noEdge:true}); }
  function busStop(x,y){ box(x-.9,x+.9,y-2,y+2,2.5,2.62,0xDCE6F2,{}); box(x-.9,x-.84,y-2,y+2,0,2.5,0xCFE4EC,{m:{transparent:true,opacity:.5},noEdge:true}); box(x+.2,x+.6,y-1.5,y+1.5,.42,.48,C.wood,{noEdge:true}); }
  { const cars=[0xCC746C,0x3268A6,0xFFFFFF,0x4A4D52,0xE3B23C,0x6DB35C,0xD9D8D4];
     
    let n=0; for(let y=-46;y<60;y+=7.5) if(Math.abs(y-(-14))>4){ car(ST.x0+1.1,y,'y',cars[n++%cars.length]); if(y<-28||y>26) car(ST.x1-1.1-1.8,y+3,'y',cars[n++%cars.length]); }
    car(ST.x0+4.5,-30,'y',0xFFFFFF); car(ST.x1-4.3,12,'y',0x3268A6); car(ST.x1-4.3,-40,'y',0xCC746C); car(-30,SY.y0+3,'x',0x4A4D52); car(10,SY.y1-3,'x',0xE3B23C); car(-80,SY.y1-3,'x',0x6DB35C);
    bike(ST.x1-1,-8,true); bike(ST.x1-1,30,true); bike(ST.x0-1.5,-20,false);
     
    for(let y=-50;y<60;y+=16){ streetLight(ST.x1+.6,y,-1); streetLight(ST.x0-.6,y+8,1); }
    for(let x=-30;x<60;x+=18) streetLight(x,SY.y1+.6,0);
    bench(ST.x1+3.3,-4); bench(ST.x1+3.3,18); busStop(ST.x1+2.6,30); person(ST.x1+2.8,29.2,.15,{pose:'sit',face:180}); person(ST.x1+2.0,31.5,.15,{face:180});
    for(const y of [4,13]) for(let k=0;k<2;k++){ cafe(ST.x0-3.5-2.2-k*2.6,y,[C.tomato,C.awnA][k]); person(ST.x0-3.5-2.8-k*2.6,y-.6,0,{pose:'sit',face:90}); }
    for(let y=-40;y<56;y+=9.5){ const ty=y+2; cyl(ST.x0-2.5,ty,.12,0,2.6,0x8C6E52,{seg:8,noEdge:true}); add(new T.IcosahedronGeometry(1.7,1),(Math.round(ty)%2)?C.green2:C.green3,new T.Vector3(ST.x0-2.5,3.6,-ty),{noEdge:true}); }
    for(let x=-26;x<56;x+=10){ cyl(x,SY.y1+2.5,.12,0,2.6,0x8C6E52,{seg:8,noEdge:true}); add(new T.IcosahedronGeometry(1.6,1),C.green2,new T.Vector3(x,3.5,-(SY.y1+2.5)),{noEdge:true}); }
    for(const [x,y] of [[ST.x1+3.4,-20],[ST.x0-.7,-2],[ST.x1+.5,40]]){ cyl(x,y,.18,.15,.6,0xCC746C,{seg:10,noEdge:true}); }
    for(let i=0;i<14;i++){ const y=-48+i*7.3, side=i%2; person(side?ST.x0-1.6:ST.x1+2.2,y,.15,{pose:i%3?'walk':'stand',face:side?90:270,shirt:pick(C.shirt)}); }
    for(let i=0;i<8;i++) person(-24+i*9,SY.y1+1.6,.15,{pose:'walk',face:i%2?0:180}); }

   
  { const yS=-14.6, xR=CUTX[3]+.6, zH=Z[2]+.8, g=.25; const pl=(D.S[1]||[]).filter(r=>/_c[123]$/.test(r.id)).flatMap(r=>r.r);
    const px=pl.length?(Math.min(...pl.map(q=>q[0]))+Math.max(...pl.map(q=>q[1])))/2:-28, fh=(D.S[1]||[]).find(r=>r.prog==='fish_hall'), gh=(D.S[1]||[]).find(r=>r.prog==='greenhouse');
    const xc=-32.3;    
    heatPath([[xR,yS,zH+2],[xR,yS,zH],[xR,yS,g],[xc,yS,g],[xc,10,g]]);
    if(pl.length) heatPath([[xc,-2,g],[px-2,-2,g],[px-2,-2,.9]],.18);
    if(fh){ const f=fh.r[0]; heatPath([[xc,(f[2]+f[3])/2,g],[f[0]+1.2,(f[2]+f[3])/2,g],[f[0]+1.2,(f[2]+f[3])/2,.9]],.18); }
    if(gh){ const q=gh.r[0]; heatPath([[xc,6,g],[q[0]+.4,6,g],[q[0]+.4,-1,g]],.18); }
    const xw=FX-2.2; heatPath([[xc,yS,g],[xw,yS,g]]); heatPath([[xw,yS,g],[xw,22,g]],.18); heatPath([[xw,yS,g],[xw,-22,g]],.18);
    const wx1=FX-16-3.5, sx1=wx1-3; heatPath([[xw,-14,g],[sx1,-14,g],[sx1,-14,1.2]]);    
    heatPath([[xw,12,g],[wx1-1,12,g],[wx1-1,12,1.2]]); heatPath([[xw,38,g],[wx1-1,38,g],[wx1-1,38,1.2]],.18);    
    heatPath([[xw,-22,g],[xw,-32,g],[-25,-32,g],[-25,-32,1.2]],.18); }    

   
  for(const [x,y,h,dcm] of (D.trees||[])){ const hh=h||6, cr=Math.max(1.2,Math.min(4,(dcm?dcm/100*9:hh*.22))); cyl(x,y,.12+(dcm||20)/1000,0,hh*.45,0x8C6E52,{seg:8,noEdge:true});
    add(new T.IcosahedronGeometry(cr,1),(Math.round(x+y)%2)?C.green2:C.green3,new T.Vector3(x,hh*.45+cr*.75,-y),{noEdge:true}); }

   
  { const PL=D.PLANT.map(p=>p.r), YX0=Math.min(...PL.map(q=>q[0]))-3, YX1=Math.max(...PL.map(q=>q[1]))+3, YY0=Math.min(...PL.map(q=>q[2]))-3, YY1=Math.max(...PL.map(q=>q[3]))+3;
    const CT=D.COURT||[-1.2,4.9,-15.4,15.1], inCourt=(x,y)=>x>CT[0]-.5&&x<CT[1]+.5&&y>CT[2]-.5&&y<CT[3]+.5, clear=(x,y)=>!(x>YX0&&x<YX1&&y>YY0&&y<YY1)&&!inCourt(x,y);
    const inLot=(x,y)=>{ let c=false; for(let i=0,j=L.length-1;i<L.length;j=i++){ const a=L[i], b=L[j]; if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) c=!c; } return c; };
    const shrub=(x,y,s)=>{ ball(x,y,.45*s,.55*s,(Math.round(x*3+y)%3)?C.green:C.green2); ball(x+.35*s,y-.2*s,.38*s,.4*s,C.green3); };
    const tree=(x,y,h)=>{ cyl(x,y,.13,0,h*.45,0x8C6E52,{seg:8,noEdge:true}); add(new T.IcosahedronGeometry(h*.24,1),(Math.round(x+y)%2)?C.green2:C.green,new T.Vector3(x,h*.45+h*.17,-y),{noEdge:true}); };
     
    for(let x=CT[1]+1;x<58;x+=2) for(let y=-23;y<24;y+=2) if(inLot(x+1,y+1)&&clear(x+1,y+1)&&inLot(x,y)&&inLot(x+2,y+2)) box(x,x+2,y,y+2,-.03,.03,0xD6E8C6,{noEdge:true});
     
    { const y=YY0-.3, x0=Math.max(YX0,CT[1]+1), x1=Math.min(YX1,30); box(x0,x1,y-.08,y,0,3,0x8FBF7A,{faint:true,m:{transparent:true,opacity:.55}});
      for(let x=x0;x<=x1;x+=2.5) box(x-.06,x+.06,y-.12,y+.04,0,3.1,0x6E7176,{noEdge:true}); for(let x=x0+.6;x<x1;x+=.9) for(let z=.5;z<3;z+=.8) ball(x+((z*3)%.6),y-.2,z,.32,(Math.round(x+z)%2)?C.green:C.green2); }
     
    for(let i=0;i<L.length-1;i++){ const a=L[i], b=L[i+1], len=Math.hypot(b[0]-a[0],b[1]-a[1]), nx=-(b[1]-a[1])/len, ny=(b[0]-a[0])/len;
      for(let t=1.5;t<len-1.5;t+=1.6){ const x=a[0]+(b[0]-a[0])*t/len+nx*1.5, y=a[1]+(b[1]-a[1])*t/len+ny*1.5; if(x<CT[1]+1||!inLot(x,y)||!clear(x,y)) continue; shrub(x,y,1); } }
     
    for(let x=CT[1]+3;x<46;x+=7){ const y=YY1+1.8; if(inLot(x,y)&&clear(x,y)) tree(x,y,7); }
    for(let t=.15;t<.95;t+=.18){ const x=9.02+(56.11-9.02)*t-2.6, y=-23.05+(1.25+23.05)*t+3.2; if(inLot(x,y)&&clear(x,y)) tree(x,y,6.5); }
     
    box(-20,CT[0]-1,-21.6,-19.4,-.05,.02,0x9BC8C0,{noEdge:true}); for(let x=-19.4;x<CT[0]-1.5;x+=.7) for(const y of [-21.1,-20.4,-19.8]){ add(new T.ConeGeometry(.18,.7,5),(Math.round(x*2)%2)?0x7DAA5A:0x9CC27A,new T.Vector3(x,.35,-y),{noEdge:true}); } }

   
  for(const p of D.PLANT){ const [x0,x1,y0,y1]=p.r;
     
    if(p.kind==='gen'){ box(x0,x1,y0,y1,0,4.777,C.plant,{}); for(let x=x0+2;x<x1-1;x+=1.4) box(x,x+.9,y0-.01,y0,.8,3.6,0xBDBCB8,{noEdge:true}); }
    else if(p.kind==='pad'){ const cx=(x0+x1)/2, cy=(y0+y1)/2; box(x0,x1,y0,y1,0,.2,C.plant,{faint:true}); box(cx-1.2825,cx+1.2825,cy-1.2575,cy+1.2575,.2,.2+1.854,C.steel,{}); }
    else if(p.kind==='chiller'){ box(x0,x1,y0,y1,0,2.896,C.plant,{}); for(let y=y0+1.1;y<y1-.6;y+=2.0){ cyl((x0+x1)/2,y,.8,2.896,.06,C.fan,{seg:18,noEdge:true}); } } }
  return {scene};
}

async function render(el,opt){ opt=opt||{};
  await load(TH); const T=window.THREE, D=await (await fetch(opt.data||'f1/hero/aquaponics_v339.json')).json();
  const W=el.clientWidth||960, Hh=el.clientHeight||Math.round(W*.66);
  const style=opt.style||'pastel', {scene}=build(T,D,style);
  if(style==='night'){ scene.add(new T.HemisphereLight(0x8FA6D6,0x1A2233,.55)); scene.add(new T.AmbientLight(0xFFFFFF,.08)); const moon=new T.DirectionalLight(0xB8C8FF,.25); moon.position.set(-40,70,35); scene.add(moon); }
  else if(style==='ink'){ scene.add(new T.AmbientLight(0xFFFFFF,1.0)); }
  else if(style==='iso'){ scene.add(new T.AmbientLight(0xFFFFFF,.74)); const k=new T.DirectionalLight(0xFFFFFF,.34); k.position.set(-20,80,45); scene.add(k); const k2=new T.DirectionalLight(0xE8EEFF,.1); k2.position.set(40,30,-60); scene.add(k2); }
  else { scene.add(new T.HemisphereLight(0xFFFFFF,0xDCD8CF,style==='vivid'?.6:.7)); scene.add(new T.AmbientLight(0xFFFFFF,.14)); const sun=new T.DirectionalLight(0xFFFFFF,style==='vivid'?.5:.38); sun.position.set(-40,70,35); scene.add(sun); }
  const fr=opt.frame||36, asp=W/Hh, cam=new T.OrthographicCamera(-fr*asp,fr*asp,fr,-fr,-500,500);
  const tgt=new T.Vector3(opt.tx!=null?opt.tx:-24,opt.ty!=null?opt.ty:8,opt.tz!=null?opt.tz:-2); const az=opt.az!=null?opt.az:(style==='iso'?-135:-132)*Math.PI/180, el2=opt.el!=null?opt.el:(style==='iso'?35.264:36)*Math.PI/180;    
  cam.position.set(tgt.x+100*Math.cos(el2)*Math.cos(az), tgt.y+100*Math.sin(el2), tgt.z-100*Math.cos(el2)*Math.sin(az)); cam.lookAt(tgt);
  const rn=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true}); rn.setPixelRatio(Math.min(2,window.devicePixelRatio||1)); rn.setSize(W,Hh);
  el.innerHTML=''; el.appendChild(rn.domElement); rn.render(scene,cam);
  if(style==='iso') isoShadows(T,scene,cam,rn,el,W,Hh);
  const key=document.createElement('div'); key.innerHTML='<span style="display:inline-block;width:22px;height:4px;background:'+(style==='iso'?'#7A5AF0':'#E07B39')+';border-radius:2px;vertical-align:middle;margin-right:8px"></span>Heat from the data hall: to the pool, fish tanks, greenhouse, the heated sidewalk, the school and the buildings around it';
  key.style.cssText='position:absolute;left:12px;top:10px;font:400 12.5px/1.4 "IBM Plex Sans",sans-serif;color:#4A4D52;background:rgba(246,245,242,.85);padding:6px 10px'; el.appendChild(key);
  const tag=document.createElement('div'); tag.textContent='Illustrative'; tag.style.cssText='position:absolute;left:12px;bottom:10px;font:500 11px/1 "IBM Plex Sans",sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#7B7E83'; el.style.position='relative'; el.appendChild(tag);
  return {renderer:rn,scene,camera:cam}; }

 
function isoShadows(T,scene,cam,rn,el,W,H){ try{
  const pr=rn.getPixelRatio(), cw=Math.round(W*pr), ch=Math.round(H*pr), base=document.createElement('canvas'); base.width=cw; base.height=ch; const bx=base.getContext('2d'); bx.drawImage(rn.domElement,0,0);
  const sun=new T.DirectionalLight(0xFFFFFF,1); sun.position.set(-60,90,70); sun.castShadow=true; const sc=sun.shadow.camera; sc.left=-120; sc.right=120; sc.top=120; sc.bottom=-120; sc.near=1; sc.far=400; sun.shadow.mapSize.set(2048,2048);
  const white=new T.MeshBasicMaterial({color:0xFFFFFF}), keep=[]; scene.traverse(o=>{ if(o.isLight) { keep.push([o,o.visible]); o.visible=false; } else if(o.isLineSegments||o.isLine){ keep.push([o,o.visible]); o.visible=false; } else if(o.isMesh){ keep.push([o,o.material,o.castShadow,o.receiveShadow]); o.material=white; o.castShadow=true; o.receiveShadow=false; } });
  const ground=new T.Mesh(new T.PlaneGeometry(1200,1200),new T.ShadowMaterial({opacity:1,color:0x000000})); ground.rotation.x=-Math.PI/2; ground.position.y=.02; ground.receiveShadow=true; scene.add(ground); scene.add(sun); scene.add(sun.target);
  const bg=scene.background; scene.background=new T.Color(0xFFFFFF); rn.shadowMap.enabled=true; rn.render(scene,cam);
  const m=document.createElement('canvas'); m.width=cw; m.height=ch; const mx=m.getContext('2d'); mx.drawImage(rn.domElement,0,0); const md=mx.getImageData(0,0,cw,ch).data;
  scene.remove(ground); scene.remove(sun); scene.remove(sun.target); scene.background=bg; rn.shadowMap.enabled=false;
  for(const k of keep){ if(k.length===2) k[0].visible=k[1]; else { k[0].material=k[1]; k[0].castShadow=k[2]; k[0].receiveShadow=k[3]; } }
  const step=Math.round(4*pr), r=.85*pr; bx.fillStyle='rgba(30,42,71,.55)';
  for(let y=0;y<ch;y+=step) for(let x=((y/step)%2?step/2:0);x<cw;x+=step){ const i=(Math.floor(y)*cw+Math.floor(x))*4; if(md[i]<90){ bx.beginPath(); bx.arc(x,y,r,0,6.2832); bx.fill(); } }
  base.style.width=W+'px'; base.style.height=H+'px'; el.replaceChild(base,rn.domElement);
}catch(e){ console.warn('hero iso shadows',e); } }
BD.hero3d={render};
})();

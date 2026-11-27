 
(function(){
const BD=window.BD=window.BD||{};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const n0=v=>Math.round(v).toLocaleString('en-CA');
const INK='#1E2A47', INK2='#4A5672', RED0='#B3261E', FONT="'IBM Plex Sans', system-ui, sans-serif";
 
const ZONES=[
 ['hall','Data hall','#B9CCE1'],
 ['dcsup','Data-centre support','#D9E4F1'],
 ['load','Loading','#D3DEEC'],
 ['pub','Public program','#E7D9BF'],
 ['psup','Public support','#FDE5D0'],
 ['flex','Flexible community space','#E7D9BF'],
 ['clin','Clinic','#C1E0DA'],
 ['hrr','Heat-recovery room','#D9E4F1'],
 ['plant','Plant','#E6E4E0'],
 ['circ','Circulation','#DCE3CC'],
 ['core','Cores (stairs, lifts, shafts)','#C9CED9'],
 ['spare','Data-centre support','#D9E4F1']];    
const ZN=Object.fromEntries(ZONES.map(z=>[z[0],z])), DCZK=new Set(['hall','dcsup','load','hrr','spare']);    
let RED=RED0;
 
const TYPO_HUE={};
 
const PB={typo:{emergency_hub:['#F28C38','#FBC9A0'],shelter_laundry:['#F2C230','#F9E3A0'],community_pool:['#3FA9E0','#BFE0F5'],warm_bath:['#2EC4B6','#B8EAE2'],heat_cascade:['#F4A6B8','#F9D0DA'],aquaponics:['#6CC24A','#CDEBB8'],conservatory:['#C2D63A','#E4EDA8'],food_hub:['#C9A26B','#E8D5BC']},
  hall:'#8C9DBD',dcsup:'#B9C5DA',dccirc:'#D5DCEA',dcdots:'#3D5185',dccore:'#3D5185',plant:'#6B7590',load:'#C9CCD1',pubcirc:'#FFFFFF',pubcore:'#FFFFFF',red:'#C0262D'};
const usePB=()=>!!(BD.F1FLAGS&&BD.F1FLAGS.paletteB)||/[?&]paletteB\b/.test(location.search);    
const colOf=(z,typ,side)=>{ if(usePB()){ const t=PB.typo[typ]||PB.typo.emergency_hub;
    if(z==='pub'||z==='clin'||z==='flex') return (BD.TOK&&BD.TOK.pubProgram)||t[0]; if(z==='psup') return (BD.TOK&&BD.TOK.pubSupport)||t[1]; if(z==='hrr'||z==='spare') return PB.dcsup;     if(z==='hall') return PB.hall; if(z==='dcsup') return PB.dcsup; if(z==='plant') return PB.plant; if(z==='load') return PB.load;
    if(z==='circ') return side==='dc'?PB.dccirc:PB.pubcirc; if(z==='core') return side==='dc'?PB.dccore:PB.pubcore; return '#FFFFFF'; }
  return z==='pub'&&typ&&TYPO_HUE[typ]?TYPO_HUE[typ]:(ZN[z]||ZN.spare)[2]; };
const DC=new Set(['hall','dcsup','load']);
const HEAD=rm=>String(rm.n||rm.id||'').split('(')[0];
const isStair=rm=>!!rm.stair||rm.role==='stair'||/\bstair\b/i.test(HEAD(rm));
const isLift=rm=>!isStair(rm)&&/\blift\b|elevator/i.test(HEAD(rm));
const isShaft=rm=>rm.role==='shaft'||(!rm.fromExport&&/shaft|riser/i.test(HEAD(rm)));
const isCirc=rm=>rm.role!==undefined&&rm.role!==null?rm.role==='circulation':(BD.f1plans&&BD.f1plans.isCirc?BD.f1plans.isCirc(rm):(rm.g==='circ'));
function zoneOf(rm){ if(isStair(rm)||isLift(rm)||isShaft(rm)) return 'core'; if(isCirc(rm)) return 'circ';
  const g=rm.g; if(g==='hall') return 'hall'; if(g==='sup') return 'dcsup'; if(g==='load') return 'load'; if(g==='pub'||g==='grow'||g==='gym') return 'pub'; if(g==='clin') return 'clin'; if(g==='plant') return 'plant'; if(g==='circ') return 'circ'; return 'spare'; }
 
function sideOf(rm){ const g=rm.g; if(g==='hall'||g==='sup'||g==='load') return 'dc'; if(g==='spare') return 'none'; return 'hub'; }
const ra=r=>(r[1]-r[0])*(r[3]-r[2]);
const E=0.05;
 
function outline(rects,others){ const out=[]; const sub=(a0,a1,cuts)=>{ let segs=[[a0,a1]]; for(const [c0,c1] of cuts){ segs=segs.flatMap(([s0,s1])=>c1<=s0+E||c0>=s1-E?[[s0,s1]]:[[s0,Math.max(s0,c0)],[Math.min(s1,c1),s1]].filter(q=>q[1]-q[0]>E)); } return segs; };
  for(const r of rects){ const [u0,u1,v0,v1]=r;
    for(const [v,dir] of [[v0,-1],[v1,1]]){ const cuts=others.filter(o=>o!==r&&Math.abs((dir<0?o[3]:o[2])-v)<E).map(o=>[o[0],o[1]]); for(const [a,b] of sub(u0,u1,cuts)) out.push([[a,v],[b,v]]); }
    for(const [u,dir] of [[u0,-1],[u1,1]]){ const cuts=others.filter(o=>o!==r&&Math.abs((dir<0?o[1]:o[0])-u)<E).map(o=>[o[2],o[3]]); for(const [a,b] of sub(v0,v1,cuts)) out.push([[u,a],[u,b]]); } }
  return out; }
 
function shared(A,B){ const out=[]; for(const r of A) for(const o of B){
    if(Math.abs(r[1]-o[0])<E||Math.abs(r[0]-o[1])<E){ const u=Math.abs(r[1]-o[0])<E?r[1]:r[0], a=Math.max(r[2],o[2]), b=Math.min(r[3],o[3]); if(b-a>E) out.push([[u,a],[u,b]]); }
    if(Math.abs(r[3]-o[2])<E||Math.abs(r[2]-o[3])<E){ const v=Math.abs(r[3]-o[2])<E?r[3]:r[2], a=Math.max(r[0],o[0]), b=Math.min(r[1],o[1]); if(b-a>E) out.push([[a,v],[b,v]]); } }
  return out; }
 
function pieces(items){ const n=items.length, par=items.map((_,i)=>i), f=i=>par[i]===i?i:(par[i]=f(par[i]));
  const touch=(a,b)=>{ const ov=(p0,p1,q0,q1)=>Math.min(p1,q1)-Math.max(p0,q0)>E; return (Math.abs(a[1]-b[0])<E||Math.abs(a[0]-b[1])<E)&&ov(a[2],a[3],b[2],b[3])||(Math.abs(a[3]-b[2])<E||Math.abs(a[2]-b[3])<E)&&ov(a[0],a[1],b[0],b[1])||(Math.min(a[1],b[1])-Math.max(a[0],b[0])>E&&Math.min(a[3],b[3])-Math.max(a[2],b[2])>E); };
  for(let i=0;i<n;i++) for(let j=i+1;j<n;j++) if(touch(items[i].r,items[j].r)) par[f(i)]=f(j);
  const g={}; items.forEach((it,i)=>{ (g[f(i)]=g[f(i)]||[]).push(it); }); return Object.values(g); }
function coreTag(rm){ const id=String(rm.id||''); const m=id.match(/^([a-z])(\d+)$/i); if(m) return m[1].toUpperCase()+m[2]; if(isShaft(rm)) return ''; return isLift(rm)?'E':'S'; }
 
function maxRect(rs){ const xs=[...new Set(rs.flatMap(r=>[r[0],r[1]]))].sort((a,b)=>a-b), ys=[...new Set(rs.flatMap(r=>[r[2],r[3]]))].sort((a,b)=>a-b);
  if(xs.length>32||ys.length>32) return rs.reduce((a,b)=>ra(b)>ra(a)?b:a,rs[0]);
  const nx=xs.length-1, ny=ys.length-1, cov=[]; for(let i=0;i<nx;i++){ cov[i]=[]; const cx=(xs[i]+xs[i+1])/2; for(let j=0;j<ny;j++){ const cy=(ys[j]+ys[j+1])/2; cov[i][j]=rs.some(r=>cx>r[0]&&cx<r[1]&&cy>r[2]&&cy<r[3]); } }
  let best=null, bestA=-1;
  for(let i0=0;i0<nx;i0++) for(let j0=0;j0<ny;j0++){ if(!cov[i0][j0]) continue; let jmax=ny;
    for(let i1=i0;i1<nx;i1++){ if(!cov[i1][j0]) break; let j=j0; while(j<jmax&&cov[i1][j]) j++; jmax=j; const a=(xs[i1+1]-xs[i0])*(ys[jmax]-ys[j0]); if(a>bestA){ bestA=a; best=[xs[i0],xs[i1+1],ys[j0],ys[jmax]]; } } }
  return best||rs[0]; }
 
function wrap(t,n){ const ws=String(t).split(' '), out=[]; for(const w of ws){ const k=out.length-1; if(k>=0&&(out[k]+' '+w).length<=n) out[k]+=' '+w; else out.push(w); } return out; }
function plan(G,st,o){ o=o||{}; RED=usePB()?'#C0262D':RED0; const w=o.w||760, rooms=(G.S[st]||G.S[String(st)]||[]); if(!rooms.length) return null;
  const all=rooms.flatMap(rm=>rm.r), U0=Math.min(...all.map(r=>r[0])), U1=Math.max(...all.map(r=>r[1])), V0=Math.min(...all.map(r=>r[2])), V1=Math.max(...all.map(r=>r[3]));
  const fs=o.fs||12, per=fs*0.56;
   
  const CZ=G.Z&&(G.Z[st]||G.Z[String(st)]), MAPZ={hall:'hall',dc:'dcsup','shell-dc':'dcsup','heat-recovery':'hrr',clinic:'clin',public:'pub','public-program':'pub',flex:'flex','public-support':'psup',circulation:'circ','circulation-dc':'circ','circ-dc':'circ','circ-pub':'circ','core-public':'core','core-dc':'core',loading:'load',plant:'plant',unassigned:'spare'};
  const DCZ=new Set(['hall','dc','shell-dc','heat-recovery','circulation-dc','circ-dc','core-dc','loading']);
  const items=CZ&&CZ.length?CZ.flatMap(b=>(b.rects||[]).map(r=>{ const lab=String(b.label||''), stairish=/\b[SP]\d/i.test(lab); return {rm:{id:lab,n:lab,stair:stairish&&b.zone.startsWith('core'),core:b.zone.startsWith('core'),block:b},r,z:MAPZ[b.zone]||'spare',side:DCZ.has(b.zone)?'dc':(MAPZ[b.zone]||'spare')==='spare'?'none':'hub'}; }))
    :rooms.flatMap(rm=>rm.r.map(r=>({rm,r,z:zoneOf(rm),side:sideOf(rm)})));
  const wallLen=(A,B)=>shared(A,B).reduce((t,s)=>t+Math.abs(s[1][0]-s[0][0])+Math.abs(s[1][1]-s[0][1]),0);
  const groupBy=()=>{ const m={}; items.forEach(it=>{ (m[it.z]=m[it.z]||[]).push(it); }); return m; };
   
  { const g=groupBy(); for(const pc of pieces(g.spare||[])){ const rs=pc.map(it=>it.r), dcL=wallLen(rs,items.filter(it=>it.side==='dc'&&it.z!=='core').map(it=>it.r)), hubL=wallLen(rs,items.filter(it=>it.side==='hub'&&it.z!=='core').map(it=>it.r));
      for(const it of pc){ if(hubL>dcL){ it.z='flex'; it.side='hub'; } else { it.z='dcsup'; it.side='dc'; } } } }
   
  { const g=groupBy(); for(const z of Object.keys(g)){ if(z==='core') continue; for(const pc of pieces(g[z])){ const rs=pc.map(it=>it.r); if(rs.reduce((t,r)=>t+ra(r),0)>=2) continue;
      let best=null, bl=0; for(const it of items){ if(it.z===z||it.z==='core') continue; const L=wallLen(rs,[it.r]); if(L>bl){ bl=L; best=it; } } if(best) for(const it of pc){ it.z=best.z; it.side=best.side; } } } }
  const byZ=groupBy();
   
  const zoneList=[]; for(const z of Object.keys(byZ)){ if(z==='core') continue; for(const pc of pieces(byZ[z])){ const rs=pc.map(it=>it.r); zoneList.push({key:z,name:(ZN[z]||ZN.spare)[1],m2:rs.reduce((t,r)=>t+ra(r),0),R:maxRect(rs),rs}); } }
  const coreBlocks=[]; { const seen=new Set(); for(const it of byZ.core||[]){ const b=it.rm.block; if(b){ if(seen.has(b)) continue; seen.add(b); coreBlocks.push({tag:String(b.label||'').trim(),rs:b.rects,rm:it.rm}); } else coreBlocks.push({tag:coreTag(it.rm),rs:[it.r],rm:it.rm}); } }
  const longest=Math.max(0,...zoneList.map(z=>(z.name+' '+n0(z.m2)+' m²').length),...coreBlocks.map(c=>c.tag.length));
  const padL=88,padT=80,padB=60, padR=30, k=(w-padL-padR)/(U1-U0), X=u=>padL+(u-U0)*k, Y=v=>padT+(V1-v)*k, f1=x=>(+x).toFixed(1);
  const base=padT+(V1-V0)*k+padB; let hgt=base;    
  const out=[`<svg width="${w}" height="@@H@@" viewBox="0 0 ${w} @@H@@" font-family="${FONT}" role="img" aria-label="Storey ${st}: zones, circulation, cores and fire separations">`];
  const rect=(r,fill)=>`<rect x="${f1(X(r[0]))}" y="${f1(Y(r[3]))}" width="${f1((r[1]-r[0])*k)}" height="${f1((r[3]-r[2])*k)}" fill="${fill}" stroke="${fill}" stroke-width="0.5"/>`;
  const line=([a,b],col,sw,dash)=>`<line x1="${f1(X(a[0]))}" y1="${f1(Y(a[1]))}" x2="${f1(X(b[0]))}" y2="${f1(Y(b[1]))}" stroke="${col}" stroke-width="${sw}"${dash?` stroke-dasharray="${dash}"`:''} stroke-linecap="square"/>`;
   
  for(const it of items) out.push(rect(it.r,colOf(it.z,o.typology,it.side)));
  if(usePB()) for(const it of items) if(it.z==='circ'){ const r=it.r, x0=X(r[0]), x1=X(r[1]), y0=Y(r[3]), y1=Y(r[2]), c=it.side==='dc'?PB.dcdots:INK; for(let yy=y0+2.5;yy<y1;yy+=5) for(let xx=x0+2.5;xx<x1;xx+=5) out.push(`<circle cx="${f1(xx)}" cy="${f1(yy)}" r="0.6" fill="${c}" fill-opacity="0.55"/>`); }
  for(const z of zoneList) for(const s of outline(z.rs,z.rs)) out.push(line(s,INK,1.1));
   
  const redCore=it=>isStair(it.rm)||it.rm.stair||isLift(it.rm)||/\b[SPE]\d/i.test(String(it.rm.block?it.rm.block.label:''));
  for(const it of byZ.core||[]){ const r=it.r, x0=X(r[0]), x1=X(r[1]), y0=Y(r[3]), y1=Y(r[2]);
    if(isStair(it.rm)||it.rm.stair){ for(let y=y0+3;y<y1;y+=4) out.push(`<line x1="${f1(x0)}" y1="${f1(y)}" x2="${f1(x1)}" y2="${f1(y)}" stroke="${INK2}" stroke-width="0.5" stroke-opacity="0.55"/>`); }
    else out.push(`<path d="M${f1(x0)} ${f1(y0)}L${f1(x1)} ${f1(y1)}M${f1(x1)} ${f1(y0)}L${f1(x0)} ${f1(y1)}" stroke="${INK2}" stroke-width="${isLift(it.rm)?0.9:0.6}" fill="none"/>`);
    out.push(`<rect x="${f1(x0)}" y="${f1(y0)}" width="${f1(x1-x0)}" height="${f1(y1-y0)}" fill="none" stroke="${redCore(it)?RED:INK}" stroke-width="${redCore(it)?2:1.1}"/>`); }
   
  const hub=items.filter(it=>it.side==='hub'&&it.z!=='core').map(it=>it.r), dc=items.filter(it=>it.side==='dc'&&it.z!=='core').map(it=>it.r);
  let sepM=0; for(const s of shared(hub,dc)){ sepM+=Math.abs(s[1][0]-s[0][0])+Math.abs(s[1][1]-s[0][1]); out.push(line(s,RED,3,'7 3')); }
  for(const s of outline(all,all)) out.push(line(s,INK,2));
   
  const KEY=[], TXT=[], BOX=[];    
  for(const z of zoneList){ const R=z.R, wpx=(R[1]-R[0])*k-8, hpx=(R[3]-R[2])*k-6, cx=X((R[0]+R[1])/2), cy=Y((R[2]+R[3])/2), t2=n0(z.m2)+' m²', n=Math.floor(wpx/per), L=wrap(z.name,n);
    const fits=L.length<=2&&L.every(q=>q.length<=n)&&t2.length<=n&&(L.length+1)*fs*1.25<=hpx;
    const dark=usePB()&&z.key==='plant', c1=dark?'#FFFFFF':INK, c2=dark?'#FFFFFF':INK2;
    if(fits){ const y0=cy-((L.length+1)*fs*1.25)/2+fs*0.95, hw=Math.max(t2.length,...L.map(q=>q.length))*per/2; BOX.push({x0:cx-hw,x1:cx+hw,y0:y0-fs,y1:y0+L.length*fs*1.25+fs*0.3}); L.forEach((q,i)=>TXT.push(`<text x="${f1(cx)}" y="${f1(y0+i*fs*1.25)}" font-size="${fs}" font-weight="600" fill="${c1}" text-anchor="middle">${esc(q)}</text>`)); TXT.push(`<text x="${f1(cx)}" y="${f1(y0+L.length*fs*1.25)}" font-size="${fs}" fill="${c2}" text-anchor="middle">${t2}</text>`); }
    else KEY.push({z,cx,cy,wpx,hpx}); }
  for(const c of coreBlocks){ if(!c.tag) continue; const R=maxRect(c.rs), wpx=(R[1]-R[0])*k-4, hpx=(R[3]-R[2])*k-2, cx=X((R[0]+R[1])/2), cy=Y((R[2]+R[3])/2), parts=c.tag.split(/\s+/);
    const box=(lines,f)=>{ f=f||fs; const bw=Math.max(...lines.map(q=>q.length))*f*0.66+6, bh=lines.length*f*1.2+2, y0=cy-bh/2; BOX.push({x0:cx-bw/2,x1:cx+bw/2,y0,y1:y0+bh}); TXT.push(`<rect x="${f1(cx-bw/2)}" y="${f1(y0)}" width="${f1(bw)}" height="${f1(bh)}" fill="#fff" stroke="none"/>`); lines.forEach((q,i)=>TXT.push(`<text x="${f1(cx)}" y="${f1(y0+f*1.02+i*f*1.2)}" font-size="${f.toFixed(1)}" font-weight="600" fill="${INK}" text-anchor="middle">${esc(q)}</text>`)); };
     
    let done=false; for(let f=fs;f>=7&&!done;f-=1){ if(c.tag.length*f*0.66+6<=wpx&&f*1.3<=hpx){ box([c.tag],f); done=true; } else if(parts.length>1&&Math.max(...parts.map(q=>q.length))*f*0.66+6<=wpx&&parts.length*f*1.2+2<=hpx){ box(parts,f); done=true; } }
    if(!done) box([c.tag],7); }
  out.push(...TXT);
   
  { const ord=Object.fromEntries(ZONES.map((z,i)=>[z[0],i])); KEY.sort((a,b)=>(ord[a.z.key]??99)-(ord[b.z.key]??99)||b.z.m2-a.z.m2);
    const colZ=z=>colOf(z.key,o.typology,DCZK.has(z.key)?'dc':'hub'), shared=e=>zoneList.some(q=>q!==e.z&&colZ(q)===colZ(e.z)); let nn=0;
    const rows=KEY.map(e=>{ let num=''; if(shared(e)){ num=String(++nn); const tf=Math.max(7,Math.min(fs,e.hpx-1,e.wpx/ (num.length*0.62+0.4))); out.push(`<text x="${f1(e.cx)}" y="${f1(e.cy+tf*0.36)}" font-size="${tf.toFixed(1)}" font-weight="600" fill="${INK}" text-anchor="middle">${num}</text>`); }
      return {sw:`<rect width="22" height="12" fill="${colOf(e.z.key,o.typology,DCZK.has(e.z.key)?'dc':'hub')}" stroke="${INK}" stroke-width="0.8"/>`,t:`${num?num+' ':''}<tspan font-weight="600">${esc(e.z.name)}</tspan> ${n0(e.z.m2)} m²`}; });
    const hasCirc=items.some(it=>it.z==='circ'&&it.side!=='dc'), hasCircDC=items.some(it=>it.z==='circ'&&it.side==='dc'), dotsSw=c=>`<rect width="22" height="12" fill="#fff" stroke="${INK}" stroke-width="0.8"/>`+[5,11,17].map(x=>`<circle cx="${x}" cy="6" r="1" fill="${c}"/>`).join('');
    if(usePB()&&hasCirc) rows.push({sw:dotsSw(INK),t:'Public circulation'}); if(usePB()&&hasCircDC) rows.push({sw:dotsSw(PB.dcdots).replace('fill="#fff"',`fill="${PB.dccirc}"`),t:'Data-centre circulation'});
    if(sepM>0) rows.push({sw:`<line x1="0" y1="6" x2="22" y2="6" stroke="${RED}" stroke-width="3" stroke-dasharray="7 3"/>`,t:'Fire separation'});
    const cols=w>=600?2:1, cw=(w-padL-padR)/cols, rh=fs*1.7, top=base+2;
    rows.forEach((r,i)=>{ const x=padL+(i%cols)*cw, y=top+Math.floor(i/cols)*rh; out.push(`<g transform="translate(${f1(x)} ${f1(y)})">${r.sw}<text x="30" y="${f1(fs*0.85)}" font-size="${fs}" fill="${INK}">${r.t}</text></g>`); });
    if(rows.length) hgt=top+Math.ceil(rows.length/cols)*rh+6; }
   
  const sb=10*k; out.push(`<line x1="${f1(X(U1)-sb)}" y1="${f1(base-22)}" x2="${f1(X(U1))}" y2="${f1(base-22)}" stroke="${INK}" stroke-width="1.6"/><text x="${f1(X(U1)-sb-6)}" y="${f1(base-18)}" font-size="13" fill="${INK2}" text-anchor="end">10 m</text>`);
   
  const AREA=(U1-U0)*(V1-V0), BIG=zoneList.filter(z=>z.key!=='circ'&&z.m2>=0.06*AREA).map(z=>z.rs).concat(coreBlocks.map(c=>c.rs));
  const breaks=(lo,hi,i0,i1)=>{ let b=[lo,hi]; for(const rs of BIG) for(const r of rs) for(const e of [r[i0],r[i1]]) if(e>lo+0.3&&e<hi-0.3&&!b.some(q=>Math.abs(q-e)<0.3)) b.push(e); b.sort((p,q)=>p-q);
    const seg=()=>b.slice(1).map((e,i)=>e-b[i]); let g;
    while(b.length>2&&((g=seg()).some(x=>x<3)||g.length>5)){ const sm=g.indexOf(Math.min(...g)); const kill=sm===0?1:sm===g.length-1?b.length-2:(g[sm-1]<g[sm+1]?sm:sm+1); b.splice(kill,1); }
    const parts=seg(), tot=Math.round((hi-lo)*10)/10, r=parts.map(x=>Math.round(x*10)/10), big=r.indexOf(Math.max(...r)); r[big]=Math.round((tot-r.reduce((t,x,i)=>i===big?t:t+x,0))*10)/10; return {b,r}; };
  const tick=(x,y,vert)=>vert?`<line x1="${f1(x-4)}" y1="${f1(y+4)}" x2="${f1(x+4)}" y2="${f1(y-4)}" stroke="${INK2}" stroke-width="0.9"/>`:`<line x1="${f1(x-4)}" y1="${f1(y+4)}" x2="${f1(x+4)}" y2="${f1(y-4)}" stroke="${INK2}" stroke-width="0.9"/>`;
   
  { const yO=padT-46, yI=padT-14; out.push(`<text x="${f1((X(U0)+X(U1))/2)}" y="${f1(yO-6)}" font-size="13" fill="${INK2}" text-anchor="middle">${(U1-U0).toFixed(1)} m</text><line x1="${f1(X(U0))}" y1="${f1(yO)}" x2="${f1(X(U1))}" y2="${f1(yO)}" stroke="${INK2}" stroke-width="0.6"/>`+tick(X(U0),yO)+tick(X(U1),yO));
    const D=breaks(U0,U1,0,1); if(D.b.length>2){ out.push(`<line x1="${f1(X(U0))}" y1="${f1(yI)}" x2="${f1(X(U1))}" y2="${f1(yI)}" stroke="${INK2}" stroke-width="0.6"/>`); D.b.forEach(e=>out.push(tick(X(e),yI)));
      D.r.forEach((v,i)=>{ const a=X(D.b[i]), c=X(D.b[i+1]); if(c-a>v.toFixed(1).length*7+6) out.push(`<text x="${f1((a+c)/2)}" y="${f1(yI-5)}" font-size="12" fill="${INK2}" text-anchor="middle">${v.toFixed(1)}</text>`); }); } }
   
  { const xO=padL-46, xI=padL-14, cy=(Y(V0)+Y(V1))/2; out.push(`<text x="${f1(xO-6)}" y="${f1(cy)}" font-size="13" fill="${INK2}" text-anchor="middle" transform="rotate(-90 ${f1(xO-6)} ${f1(cy)})">${(V1-V0).toFixed(1)} m</text><line x1="${f1(xO)}" y1="${f1(Y(V1))}" x2="${f1(xO)}" y2="${f1(Y(V0))}" stroke="${INK2}" stroke-width="0.6"/>`+tick(xO,Y(V0))+tick(xO,Y(V1)));
    const D=breaks(V0,V1,2,3); if(D.b.length>2){ out.push(`<line x1="${f1(xI)}" y1="${f1(Y(V1))}" x2="${f1(xI)}" y2="${f1(Y(V0))}" stroke="${INK2}" stroke-width="0.6"/>`); D.b.forEach(e=>out.push(tick(xI,Y(e))));
      D.r.forEach((v,i)=>{ const a=Y(D.b[i]), c=Y(D.b[i+1]), my=(a+c)/2; if(Math.abs(a-c)>v.toFixed(1).length*7+6) out.push(`<text x="${f1(xI-5)}" y="${f1(my)}" font-size="12" fill="${INK2}" text-anchor="middle" transform="rotate(-90 ${f1(xI-5)} ${f1(my)})">${v.toFixed(1)}</text>`); }); } }
  out.push('</svg>');
   
  const sum={}; for(const z of zoneList) sum[z.key]=(sum[z.key]||0)+z.m2; const cores=(byZ.core||[]).map(it=>it.rm.block||it.rm).filter((rm,i,a)=>a.indexOf(rm)===i);
  const coreM2=(byZ.core||[]).reduce((t,it)=>t+ra(it.r),0);
  const zones=ZONES.filter(z=>sum[z[0]]>0).map(z=>({key:z[0],name:z[1],m2:sum[z[0]]})).concat(cores.length?[{key:'core',name:`Cores: ${cores.map(c=>c.label||coreTag(c)).filter(Boolean).join(', ')||cores.length}`,m2:coreM2}]:[]);
  return {svg:out.join('').split('@@H@@').join(hgt.toFixed(0)),zones,sepM:Math.round(sepM*10)/10,k,U0,V1,padL,padT}; }
function legend(typ){ if(usePB()) return legendB(typ); const sw=inner=>`<svg width="26" height="12" style="vertical-align:-2px;margin-right:6px" aria-hidden="true">${inner}</svg>`;
  const items=ZONES.filter(z=>z[0]!=='core').map(z=>[sw(`<rect x="1" y="1" width="24" height="10" fill="${z[2]}" stroke="${INK}" stroke-width="0.8"/>`),z[1]]).concat([
    [sw(`<rect x="1" y="1" width="24" height="10" fill="#C9CED9" stroke="${RED}" stroke-width="1.6"/>`+[3,6,9].map(y=>`<line x1="2" y1="${y}" x2="24" y2="${y}" stroke="${INK2}" stroke-width="0.5"/>`).join('')),'exit stair (S, P), its enclosure a fire separation'],
    [sw(`<rect x="1" y="1" width="24" height="10" fill="#C9CED9" stroke="${RED}" stroke-width="1.6"/><path d="M1 1L25 11M25 1L1 11" stroke="${INK2}" stroke-width="0.9"/>`),'lift (E), its enclosure a fire separation'],
    [sw(`<rect x="1" y="1" width="24" height="10" fill="#C9CED9" stroke="${INK}" stroke-width="0.9"/><path d="M1 1L25 11M25 1L1 11" stroke="${INK2}" stroke-width="0.9"/>`),'shaft'],
    [sw(`<line x1="1" y1="6" x2="25" y2="6" stroke="${RED}" stroke-width="3" stroke-dasharray="7 3"/>`),'Fire separation']]);
  return `<div class="f1z-legend" style="display:flex;flex-wrap:wrap;gap:4px 18px;font-size:12px;color:${INK2};margin:6px 0">${items.map(([a,b])=>`<span style="white-space:nowrap">${a}${b}</span>`).join('')}</div>`; }
function legendB(typ){ const t=PB.typo[typ]||PB.typo.emergency_hub, sw=inner=>`<svg width="26" height="12" style="vertical-align:-2px;margin-right:6px" aria-hidden="true">${inner}</svg>`, box=(c,extra)=>sw(`<rect x="1" y="1" width="24" height="10" fill="${c}" stroke="${INK}" stroke-width="0.8"/>${extra||''}`), dots=c=>[5,10,15,20].map(x=>`<circle cx="${x}" cy="6" r="0.9" fill="${c}"/>`).join('');
  const TK=BD.TOK||{}, redBox=c=>sw(`<rect x="1" y="1" width="24" height="10" fill="${c}" stroke="${PB.red}" stroke-width="1.6"/>`);    
  const items=[[box(TK.pubProgram||t[0])+icon(typ,14),'Public program'],[box(TK.pubSupport||t[1]),'Public support'],[box(PB.hall),'Data hall'],[box(PB.dcsup),'Data-centre support'],[box(PB.dccirc,dots(PB.dcdots)),'Data-centre circulation'],[box('#FFFFFF',dots(INK)),'Public circulation'],[redBox(PB.dccore),'Data-centre stair or lift'],[redBox(PB.pubcore),'Public stair or lift'],[box(PB.plant),'Plant'],[box(PB.load),'Loading'],[sw(`<line x1="1" y1="6" x2="25" y2="6" stroke="${PB.red}" stroke-width="3" stroke-dasharray="7 3"/>`),'Fire separation']];
  return `<div class="f1z-legend" style="display:flex;flex-wrap:wrap;gap:4px 18px;font-size:12px;color:${INK2};margin:6px 0">${items.map(([a,b])=>`<span style="white-space:nowrap">${a}${b}</span>`).join('')}</div>`; }
 
const icon=(typ,px)=>typ?`<img class="f1z-ico" src="f1/l2/i_${typ}.svg" alt="" width="${px||16}" height="${px||16}" style="vertical-align:-3px;margin-right:5px" onerror="this.remove()">`:'';
const hueOf=typ=>usePB()?(PB.typo[typ]||PB.typo.emergency_hub)[0]:(TYPO_HUE[typ]||'#F28C38');
BD.f1zones={plan,legend,ZONES,zoneOf,TYPO_HUE,usePB,icon,hueOf};
})();

 
(function(){
const BD=window.BD=window.BD||{};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const INK='#1E2A47', INK2='#4A5672', INK3='#8A94AA', POCHE='#2E3440', YARD='#AEB3BB', COURT='#D3D6DA', NB='#E3E5E9', STREET='#F1F2F4';
const m1=v=>(Math.round(v*10)/10).toLocaleString('en-CA');
function render(S,o){ o=o||{}; const lot=S.lot, us=lot.map(p=>p[0]), vs=lot.map(p=>p[1]), U0=Math.min(...us), U1=Math.max(...us), V0=Math.min(...vs), V1=Math.max(...vs);
  const pad=o.pad!=null?o.pad:24, W=o.W||640, RES=o.sideLabels?250:0, k=Math.min((W-RES-2*pad*4)/(V1-V0+2*pad),((o.H||760)-80)/(U1-U0+2*pad+14));
  const LM=o.left!=null?o.left:20, X=v=>(v-V0+pad)*k+LM, Y=u=>(U1-u+pad)*k+10, Hh=o.key?Math.max(Y(U0-pad-10)+40,Y(U0)+10*k+(o.fs||12)*5.2+46):Y(U0-pad-10)+40, P=q=>`${X(q[1]).toFixed(1)},${Y(q[0]).toFixed(1)}`, ring=R=>'M'+R.map(P).join('L')+'Z';
  const out=[], fs=o.fs||12; let capS=''; const SIDE=[];    
  const pip=(u,v,R)=>{ let c=false; for(let i=0,j=R.length-1;i<R.length;j=i++){ const [ui,vi]=R[i],[uj,vj]=R[j]; if(((vi>v)!==(vj>v))&&(u<(uj-ui)*(v-vi)/(vj-vi)+ui)) c=!c; } return c; };
  const id='sp'+Math.random().toString(36).slice(2,7);
  out.push(`<defs><clipPath id="${id}o"><path d="M0,0H${(W+200)}V${Hh+200}H0Z ${ring(lot)}" clip-rule="evenodd"/></clipPath></defs>`);
   
  out.push(`<rect data-nocrop="1" x="0" y="${Y(U0).toFixed(1)}" width="${W+200}" height="${(10*k).toFixed(1)}" fill="${STREET}"/>`);
  if(S.streetName) out.push(`<text x="${(X(V1)+16).toFixed(1)}" y="${(Y(U0)+5.5*k).toFixed(1)}" text-anchor="start" font-size="${fs+2}" font-weight="600" fill="${INK2}">${esc(S.streetName)}</text>`);
   
  if(S.neighbours&&S.neighbours.length) out.push(`<g data-nocrop="1" clip-path="url(#${id}o)">${S.neighbours.map(R=>`<path d="${ring(R)}" fill="${NB}"/>`).join('')}</g>`);
   
  out.push(`<path d="${ring(lot)}" fill="#fff" stroke="${INK}" stroke-width="1.2" stroke-dasharray="14 4 3 4"/>`);
  let front=lot.filter(p=>p[0]<=U0+1.5).sort((a,b)=>a[1]-b[1]); if(front.length<2) front=lot.slice().sort((a,b)=>a[0]-b[0]).slice(0,2).sort((a,b)=>a[1]-b[1]);     if(front.length>1) out.push(`<path d="M${P(front[0])}L${P(front[front.length-1])}" stroke="${INK}" stroke-width="2.2" fill="none"/>`);
   
  const crt=Array.isArray(S.court)&&typeof S.court[0]==='number'?[[[S.court[0],S.court[2]],[S.court[1],S.court[2]],[S.court[1],S.court[3]],[S.court[0],S.court[3]]]]:(S.court||[]);
  if(S.farm&&(S.farm.rects||[]).length){ out.push(`<path d="${S.farm.rects.map(r=>`M${X(r[2])},${Y(r[0])}H${X(r[3])}V${Y(r[1])}H${X(r[2])}Z`).join('')}" fill="#D6E9C6"/>`); }    
  for(const R of crt) out.push(`<path d="${ring(R)}" fill="${COURT}" stroke="${INK3}" stroke-width="0.7"/>`);
  if(S.yard&&S.yard.rings) for(const R of S.yard.rings) out.push(`<path d="${ring(R)}" fill="${YARD}" stroke="${INK3}" stroke-width="0.7"/>`);
  const KX=[];    
  if(o.key&&S.farm&&(S.farm.rects||[]).length){ const R=S.farm.rects, big=R.slice().sort((a,b)=>(b[1]-b[0])*(b[3]-b[2])-(a[1]-a[0])*(a[3]-a[2]))[0];
    if(o.sideLabels) SIDE.push({u:(big[0]+big[1])/2,v:(big[2]+big[3])/2,box:[big[0],big[1],big[2],big[3]],t:esc(S.farm.label||'Suggested: urban farm')}); else KX.push(`Light green: ${esc(S.farm.label||'suggested urban farm')}`); if(S.farm.tag) KX.push(`Urban farm: ${esc(S.farm.tag)}`); }
  if(o.key&&S.driveOffStreet) KX.push('Truck route: drawn as the layout gives it; its street end does not meet a street or lane edge on this lot');
  if(o.key&&S.driveCrosses){ KX.push(esc((S.driveLabel||'Truck route').replace(/^Truck drive/,'Truck route'))+': not drawn (a straight line from the court would cross the building)'); }
  else if(S.drive&&S.drive.length>1){ if(S.driveW) out.push(`<path d="M${S.drive.map(P).join('L')}" fill="none" stroke="${COURT}" stroke-opacity=".85" stroke-width="${(S.driveW*k).toFixed(1)}" stroke-linejoin="round"/>`);    
    out.push(`<path d="M${S.drive.map(P).join('L')}" fill="none" stroke="${INK2}" stroke-width="1.6" stroke-dasharray="6 4" marker-end="url(#${id}a)"/>`);
    const m=S.drive[Math.min(1,S.drive.length-1)]; if(o.key&&o.sideLabels) SIDE.push({u:m[0],v:m[1],box:[Math.min(...S.drive.map(q=>q[0])),Math.max(...S.drive.map(q=>q[0])),Math.min(...S.drive.map(q=>q[1])),Math.max(...S.drive.map(q=>q[1]))],t:esc(S.driveLabel||'Truck route')}); else if(o.key) KX.push('Dashed arrow: '+esc(S.driveLabel||'truck route')); else if(o.sideLabels) SIDE.push({u:m[0],v:m[1],t:esc(S.driveLabel||'Truck route')}); else out.push(`<text x="${(X(S.drive[0][1])+6).toFixed(1)}" y="${(Y(S.drive[0][0])-4).toFixed(1)}" font-size="${(fs*0.9).toFixed(1)}" fill="${INK2}" stroke="#fff" stroke-width="3" paint-order="stroke">${esc(S.driveLabel||'Truck route')}</text>`); }
  if(o.key&&(S.lanes||[]).length) KX.push('Thick grey line: the lane');
  for(const L of S.lanes||[]){ const mu=(L.a[0]+L.b[0])/2, mv=(L.a[1]+L.b[1])/2; out.push(`<path d="M${P(L.a)}L${P(L.b)}" stroke="${INK3}" stroke-width="5" stroke-opacity=".35"/>`); if(o.key) continue; out.push(`<text x="${X(mv).toFixed(1)}" y="${(Y(mu)-6).toFixed(1)}" text-anchor="middle" font-size="${(fs*0.9).toFixed(1)}" fill="${INK2}" stroke="#fff" stroke-width="3" paint-order="stroke">${esc(L.label||'Lane')}</text>`); }
   
  if(S.footprint) out.push(`<path d="${S.footprint.map(ring).join('')}" fill="${POCHE}" stroke="${POCHE}" stroke-width="0.6"/>`);
   
  const fu=S.footprint?S.footprint.flat():[], bu0=fu.length?Math.min(...fu.map(p=>p[0])):null, bu1=fu.length?Math.max(...fu.map(p=>p[0])):null, bv0=fu.length?Math.min(...fu.map(p=>p[1])):null, bv1=fu.length?Math.max(...fu.map(p=>p[1])):null;
  const bFits=fu.length&&(X(bv1)-X(bv0))>fs*0.56*16&&(Y(bu0)-Y(bu1))>fs*3;
  if(fu.length&&(!o.key||bFits)) out.push(`<text x="${X((bv0+bv1)/2).toFixed(1)}" y="${Y((bu0+bu1)/2).toFixed(1)}" text-anchor="middle" font-size="${fs}" font-weight="600" fill="#fff">Building</text><text x="${X((bv0+bv1)/2).toFixed(1)}" y="${(Y((bu0+bu1)/2)+fs*1.2).toFixed(1)}" text-anchor="middle" font-size="${fs}" fill="#fff">storey 1 outline</text>`);
  if(S.yard&&S.yard.rings&&S.yard.rings.length){ const yp=S.yard.rings.flat(), cu=(Math.min(...yp.map(p=>p[0]))+Math.max(...yp.map(p=>p[0])))/2, cv=(Math.min(...yp.map(p=>p[1]))+Math.max(...yp.map(p=>p[1])))/2;
    const yTxt=`${S.yard.area?` \u00b7 ${Math.round(S.yard.area).toLocaleString('en-CA')} m\u00b2${S.yard.pctOfLot!=null?` \u00b7 ${S.yard.pctOfLot} % of the lot`:''}`:''}`;
    if(o.key&&!o.sideLabels) KX.push(`<b style="font-weight:600">Plant yard</b> (mid grey)${yTxt}`);
    else if(o.sideLabels) SIDE.push({u:cu,v:cv,box:[Math.min(...yp.map(p=>p[0])),Math.max(...yp.map(p=>p[0])),Math.min(...yp.map(p=>p[1])),Math.max(...yp.map(p=>p[1]))],t:`<tspan font-weight="600">Plant yard</tspan>${yTxt}`}); else { const ut=Math.max(...yp.map(p=>p[0])), yl=('Plant yard'+(S.yard.area?' \u00b7 0000 m\u00b2 \u00b7 00.0 % of the lot':'')).length*fs*0.5, VW=W+60, yx=Math.max(4+yl/2,Math.min(VW-4-yl/2,X(cv))); out.push(`<text x="${yx.toFixed(1)}" y="${(Y(cu)+fs*0.35).toFixed(1)}" text-anchor="middle" font-size="${fs}" fill="${INK}" stroke="#fff" stroke-width="3.5" paint-order="stroke"><tspan font-weight="600">Plant yard</tspan>${S.yard.area?` \u00b7 ${Math.round(S.yard.area).toLocaleString('en-CA')} m\u00b2 \u00b7 ${S.yard.pctOfLot} % of the lot`:''}</text>`); } }    
  if(crt.length){ const cp=crt.flat(), cu=(Math.min(...cp.map(p=>p[0]))+Math.max(...cp.map(p=>p[0])))/2, cv=(Math.min(...cp.map(p=>p[1]))+Math.max(...cp.map(p=>p[1])))/2, cw=(Math.max(...cp.map(p=>p[1]))-Math.min(...cp.map(p=>p[1])))*k, ch=(Math.max(...cp.map(p=>p[0]))-Math.min(...cp.map(p=>p[0])))*k;
    const onDoor=(S.doors||[]).some(d=>d.kind&&d.p&&Math.abs(X(d.p[1])-X(cv))<fs*0.56*11/2+fs*1.6&&Math.abs(Y(d.p[0])-Y(cu))<fs*1.8);    
    if(o.key){ if(o.sideLabels) SIDE.push({u:cu,v:cv,box:[Math.min(...cp.map(p=>p[0])),Math.max(...cp.map(p=>p[0])),Math.min(...cp.map(p=>p[1])),Math.max(...cp.map(p=>p[1]))],t:'Truck court'}); else KX.push('Truck court (light grey)'); } else out.push(`<text x="${X(cv).toFixed(1)}" y="${Y(cu).toFixed(1)}" text-anchor="middle" font-size="${fs}" fill="${INK2}" stroke="#fff" stroke-width="3" paint-order="stroke">Truck court</text>`); }
  const DOORLAB={'public entry':'Public entry','public exit':'Exit','staff entry':'Staff entry','staff entry or data-centre exit':'Staff entry','dock door':'Dock','exit stair discharge':'Stair exit'};
  const fp1=S.footprint||[], inFP=(u,v)=>fp1.some(R=>pip(u,v,R));
  const DORD=['Public entry','Exit','Staff entry','Dock','Stair exit'], kinds=[...new Set((S.doors||[]).filter(d=>d.kind).map(d=>d.label||DOORLAB[d.kind]||d.kind))].sort((a,b)=>(DORD.indexOf(a)+99*(DORD.indexOf(a)<0))-(DORD.indexOf(b)+99*(DORD.indexOf(b)<0))), DNUM=l=>kinds.indexOf(l)+1;
  const PLACED=[], MARG={};
  const named=new Set(); for(const d of S.doors||[]){ if(!d.kind){ const x=X(d.p[1]), y=Y(d.p[0]); out.push(`<path d="M${x-6},${y+10}L${x+6},${y+10}L${x},${y+2}Z" fill="${INK}"/><text x="${x}" y="${y+12+fs*1.2}" text-anchor="middle" font-size="${fs}" font-weight="600" fill="${INK}" stroke="#fff" stroke-width="3" paint-order="stroke">${esc(d.label||'Entrance')}</text>`); continue; }
     
    const [u,v]=d.p, w=(d.width||1.2)/2, alongV=d.wall==='v';    
    let nu=0, nv=0; if(alongV){ nu=inFP(u+1,v)?-1:1; } else { nv=inFP(u,v+1)?-1:1; }    
    const g=alongV?[[u,v-w],[u,v+w]]:[[u-w,v],[u+w,v]]; out.push(`<path d="M${P(g[0])}L${P(g[1])}" stroke="#fff" stroke-width="3.2"/>`);
    const tip=[u+nu*0.4,v+nv*0.4], tail=[u+nu*4.2,v+nv*4.2], tx=X(tail[1]), ty=Y(tail[0]), main=d.kind==='public entry';
    out.push(`<path d="M${P(tail)}L${P(tip)}" stroke="${main?INK:INK2}" stroke-width="${main?1.6:1}" marker-end="url(#${id}d${main?'m':''})"/>`);
    const lab=d.label||DOORLAB[d.kind]||d.kind;
    if(o.key){ const n=DNUM(lab), r=fs*0.55;
      const u1=u+nu*1.2, v1=v+nv*1.2, run=sd=>{ const L=sd==='R'?V1-v1:sd==='L'?v1-V0:sd==='B'?u1-U0:U1-u1; if(L<0) return null; for(let d=0.2;d<L;d+=0.4){ const q=sd==='R'?[u1,v1+d]:sd==='L'?[u1,v1-d]:sd==='B'?[u1-d,v1]:[u1+d,v1]; if(inFP(q[0],q[1])) return null; } return L; };
      const outw=nv>0?'R':nv<0?'L':nu<0?'B':'T', opts=[outw,'R','L'].filter((x,i,a)=>a.indexOf(x)===i).map(sd=>[sd,run(sd)]).filter(x=>x[1]!=null).sort((a,b)=>a[1]-b[1]);
      const side=opts.length?opts[0][0]:outw; const ox=side==='R'||side==='L'?X(v1):tx, oy=side==='R'||side==='L'?Y(u1):ty;
       
      let mx=side==='R'?X(V1)+r+10:side==='L'?X(V0)-r-10:ox, my=side==='B'?Y(U0)+5*k:side==='T'?Y(U1)-r-10:oy;
      if(PLACED.some(q=>q.n===n&&q.side===side&&Math.hypot(q.x-mx,q.y-my)<r*4)) continue;
      for(let t=0;t<5&&PLACED.some(q=>Math.hypot(q.x-mx,q.y-my)<r*2.3);t++){ if(side==='R') mx+=r*2.4; else if(side==='L') mx-=r*2.4; else if(side==='B') my+=r*2.4; else my-=r*2.4; }    
      PLACED.push({n,x:mx,y:my,side}); MARG[side]=Math.max(MARG[side]||0,side==='R'?mx+r-X(V1):side==='L'?X(V0)-(mx-r):side==='B'?my+r-Y(U0):Y(U1)-(my-r));
      out.push(`<line x1="${ox.toFixed(1)}" y1="${oy.toFixed(1)}" x2="${(side==='R'?mx-r:side==='L'?mx+r:mx).toFixed(1)}" y2="${(side==='B'?my-r:side==='T'?my+r:my).toFixed(1)}" stroke="${INK3}" stroke-width="0.6"/><circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="${r.toFixed(1)}" fill="#fff" stroke="${main?INK:INK2}" stroke-width="0.9"/><text x="${mx.toFixed(1)}" y="${(my+fs*0.32).toFixed(1)}" text-anchor="middle" font-size="${(fs*0.8).toFixed(1)}" font-weight="600" fill="${INK}">${n}</text>`); continue; }    
    if(named.has(lab)) continue; named.add(lab);    
    out.push(`<text x="${(tx+nv*4).toFixed(1)}" y="${(ty+(nu?-nu*fs*0.9:fs*0.35)).toFixed(1)}" text-anchor="${nv>0?'start':nv<0?'end':'middle'}" font-size="${(fs*0.9).toFixed(1)}" font-weight="${main?600:400}" fill="${main?INK:INK2}" stroke="#fff" stroke-width="3" paint-order="stroke">${esc(d.label||DOORLAB[d.kind]||d.kind)}</text>`); }
  const xDepth=X(V1)+(MARG.R||0)+fs*1.8;    
  if(o.key&&SIDE.length){ const x0=xDepth+fs*1.6, used=[];
    for(const q of SIDE.sort((a,b)=>b.u-a.u)){ const B=q.box||[q.u,q.u,q.v,q.v]; let hit=null;
      for(let i=0;i<=12&&!hit;i++){ const f0=0.5+(i%2?1:-1)*Math.ceil(i/2)/14, u=B[0]+(B[1]-B[0])*Math.max(0.05,Math.min(0.95,f0)), y=Y(u);
        if(used.some(z=>Math.abs(z-y)<fs*1.5)) continue; let clear=true; for(let v=B[3]+0.3;v<=V1+3;v+=0.5){ if(inFP(u,v)){ clear=false; break; } } if(clear) hit={u,y,v:B[3]}; }
      if(!hit){ KX.push(q.t.replace(/<[^>]+>/g,'')); continue; } used.push(hit.y); const tx=X(hit.v);
      out.push(`<line x1="${tx.toFixed(1)}" y1="${hit.y.toFixed(1)}" x2="${(x0-4).toFixed(1)}" y2="${hit.y.toFixed(1)}" stroke="${INK3}" stroke-width="0.7"/><circle cx="${tx.toFixed(1)}" cy="${hit.y.toFixed(1)}" r="2" fill="${INK2}"/><text x="${x0.toFixed(1)}" y="${(hit.y+fs*0.35).toFixed(1)}" font-size="${fs}" fill="${INK}">${q.t}</text>`); } }
  else if(SIDE.length){ SIDE.sort((a,b)=>b.u-a.u); const x0=X(V1+5+(o.key?fs*2.2/k:0))+16; let last=-1e9; for(const q of SIDE){ let y=Math.max(Y(q.u),last+fs*1.5); last=y; const tx=X(q.v), ty=Y(q.u);
    out.push(`<path d="M${tx.toFixed(1)},${ty.toFixed(1)}L${(x0-4).toFixed(1)},${y.toFixed(1)}" stroke="${INK3}" stroke-width="0.7" fill="none"/><circle cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" r="2" fill="${INK2}"/><text x="${x0.toFixed(1)}" y="${(y+fs*0.35).toFixed(1)}" font-size="${fs}" fill="${INK}" stroke="#fff" stroke-width="3" paint-order="stroke">${q.t}</text>`); } }
   
  const dimH=(v0,v1,u,lab,ext)=>{ const y=Y(u), a=X(v0), b=X(v1); return `<g><line x1="${a}" y1="${y}" x2="${b}" y2="${y}" stroke="${INK}" stroke-width="0.7"/>${ext?`<line x1="${a}" y1="${Y(ext[0])}" x2="${a}" y2="${y+3}" stroke="${INK3}" stroke-width="0.6"/><line x1="${b}" y1="${Y(ext[1])}" x2="${b}" y2="${y+3}" stroke="${INK3}" stroke-width="0.6"/>`:''}<path d="M${a-3},${y+3}L${a+3},${y-3}M${b-3},${y+3}L${b+3},${y-3}" stroke="${INK}" stroke-width="1.2"/><text x="${(a+b)/2}" y="${y-4}" text-anchor="middle" font-size="${fs}" font-weight="600" fill="${INK}" stroke="#fff" stroke-width="3" paint-order="stroke">${lab}</text></g>`; };
  const dimV=(u0,u1,v,lab)=>{ const x=X(v), a=Y(u0), b=Y(u1), m=(a+b)/2; return `<g><line x1="${x}" y1="${a}" x2="${x}" y2="${b}" stroke="${INK}" stroke-width="0.7"/><path d="M${x-3},${a+3}L${x+3},${a-3}M${x-3},${b+3}L${x+3},${b-3}" stroke="${INK}" stroke-width="1.2"/><text x="${x-5}" y="${m}" text-anchor="middle" font-size="${fs}" font-weight="600" fill="${INK}" stroke="#fff" stroke-width="3" paint-order="stroke" transform="rotate(-90 ${x-5} ${m})">${lab}</text></g>`; };
  const yS=Math.max(Y(U0)+10*k,Y(U0)+(MARG.B||0)+4), yF=yS+fs*1.9, yB=yF+fs*1.9;    
  const dimHp=(v0,v1,y,lab,y0a,y0b)=>{ const a=X(v0), b=X(v1); return `<g><line x1="${a}" y1="${y0a}" x2="${a}" y2="${y+3}" stroke="${INK3}" stroke-width="0.6"/><line x1="${b}" y1="${y0b}" x2="${b}" y2="${y+3}" stroke="${INK3}" stroke-width="0.6"/><line x1="${a}" y1="${y}" x2="${b}" y2="${y}" stroke="${INK}" stroke-width="0.7"/><path d="M${a-3},${y+3}L${a+3},${y-3}M${b-3},${y+3}L${b+3},${y-3}" stroke="${INK}" stroke-width="1.2"/><text x="${(a+b)/2}" y="${y-4}" text-anchor="middle" font-size="${fs}" font-weight="600" fill="${INK}" stroke="#fff" stroke-width="3" paint-order="stroke">${lab}</text></g>`; };
  const dimVp=(u0,u1,x,lab,xa)=>{ const a=Y(u0), b=Y(u1), m=(a+b)/2; return `<g><line x1="${xa}" y1="${a}" x2="${x-3}" y2="${a}" stroke="${INK3}" stroke-width="0.6"/><line x1="${xa}" y1="${b}" x2="${x-3}" y2="${b}" stroke="${INK3}" stroke-width="0.6"/><line x1="${x}" y1="${a}" x2="${x}" y2="${b}" stroke="${INK}" stroke-width="0.7"/><path d="M${x-3},${a+3}L${x+3},${a-3}M${x-3},${b+3}L${x+3},${b-3}" stroke="${INK}" stroke-width="1.2"/><text x="${x-5}" y="${m}" text-anchor="middle" font-size="${fs}" font-weight="600" fill="${INK}" stroke="#fff" stroke-width="3" paint-order="stroke" transform="rotate(-90 ${x-5} ${m})">${lab}</text></g>`; };
  const fd=fs*0.85, tw=t=>String(t).length*fd*0.56;
  const dimHk=(v0,v1,y,lab,y0a,y0b)=>{ const a=X(v0), b=X(v1), fit=tw(lab)<(b-a)-8; return `<g><line x1="${a}" y1="${y0a}" x2="${a}" y2="${y+3}" stroke="${INK3}" stroke-width="0.5"/><line x1="${b}" y1="${y0b}" x2="${b}" y2="${y+3}" stroke="${INK3}" stroke-width="0.5"/><line x1="${a}" y1="${y}" x2="${b}" y2="${y}" stroke="${INK}" stroke-width="0.6"/><path d="M${a-2.5},${y+2.5}L${a+2.5},${y-2.5}M${b-2.5},${y+2.5}L${b+2.5},${y-2.5}" stroke="${INK}" stroke-width="1"/><text x="${fit?(a+b)/2:b+6}" y="${fit?y-4:y+fd*0.35}" text-anchor="${fit?'middle':'start'}" font-size="${fd.toFixed(1)}" fill="${INK}">${lab}</text></g>`; };
  const dimVk=(u0,u1,x,lab,xa,top)=>{ const a=Y(u0), b=Y(u1), m=(a+b)/2, fit=!top&&tw(lab)<(a-b)+40;     return `<g>${xa!=null?`<line x1="${xa}" y1="${a}" x2="${x-3}" y2="${a}" stroke="${INK3}" stroke-width="0.5"/><line x1="${xa}" y1="${b}" x2="${x-3}" y2="${b}" stroke="${INK3}" stroke-width="0.5"/>`:''}<line x1="${x}" y1="${a}" x2="${x}" y2="${b}" stroke="${INK}" stroke-width="0.6"/><path d="M${x-2.5},${a+2.5}L${x+2.5},${a-2.5}M${x-2.5},${b+2.5}L${x+2.5},${b-2.5}" stroke="${INK}" stroke-width="1"/>${fit?`<text x="${x-4}" y="${m}" text-anchor="middle" font-size="${fd.toFixed(1)}" fill="${INK}" transform="rotate(-90 ${x-4} ${m})">${lab}</text>`:top?`<text x="${x+7}" y="${(b+fd*0.35).toFixed(1)}" text-anchor="start" font-size="${fd.toFixed(1)}" fill="${INK}">${lab}</text>`:`<text x="${x}" y="${b-6}" text-anchor="middle" font-size="${fd.toFixed(1)}" fill="${INK}">${lab}</text>`}</g>`; };    
  if(o.key){ if(front.length>1) out.push(dimHk(front[0][1],front[front.length-1][1],yF,`Frontage ${m1(front[front.length-1][1]-front[0][1])} m`,Y(front[0][0]),Y(front[front.length-1][0])));
    out.push(dimVk(U0,U1,xDepth,`Lot depth ${m1(U1-U0)} m`,null,SIDE.length>0));        
    if(fu.length){ out.push(dimHk(bv0,bv1,yB,`Building ${m1(bv1-bv0)} m`,Y(bu0),Y(bu0))); out.push(dimVk(bu0,bu1,X(V0)-(MARG.L||0)-fs*1.1,`${m1(bu1-bu0)} m deep`,X(bv0)-2));
      const fsb=bu0-U0, sl=bv0-V0, sr=V1-bv1, rr=U1-bu1; capS=`Measured from the drawing: front setback ${m1(Math.max(0,fsb))} m, side ${m1(sl)} m (left), side ${m1(sr)} m (right), rear ${m1(rr)} m (to the farthest lot point).`; } }
  else { if(front.length>1) out.push(dimH(front[0][1],front[front.length-1][1],U0-13,`Frontage ${m1(front[front.length-1][1]-front[0][1])} m`));
  out.push(dimV(U0,U1,V1+5,`Lot depth ${m1(U1-U0)} m`));
  if(fu.length){ out.push(dimH(bv0,bv1,U0-17.5,`Building ${m1(bv1-bv0)} m`)); out.push(dimV(bu0,bu1,bv0-3,`${m1(bu1-bu0)} m deep`));
    const fsb=bu0-U0; if(fsb>0.05) out.push(`<text x="${((X(bv0)+X(bv1))/2).toFixed(1)}" y="${(Y(U0-17.5)+fs*1.9).toFixed(1)}" text-anchor="middle" font-size="${fs}" font-weight="400" fill="${INK}" stroke="#fff" stroke-width="3" paint-order="stroke">Front setback ${m1(fsb)} m</text>`);
    const sl=bv0-V0, sr=V1-bv1, rr=U1-bu1; const sides=[sl>0.05?`side ${m1(sl)} m (left)`:'',sr>0.05?`side ${m1(sr)} m (right)`:''].filter(Boolean).join(' \u00b7 ');
    if(sides&&o.capSetbacks) capS=`Measured from the drawing: ${sides}${rr>0.05?`, rear ${m1(rr)} m (to the farthest lot point)`:''}.`;
    else if(sides) out.push(`<text x="${X(V0)}" y="${(Y(U1)-6).toFixed(1)}" font-size="${fs}" fill="${INK2}" stroke="#fff" stroke-width="3" paint-order="stroke">${sides}${rr>0.05?` \u00b7 rear ${m1(rr)} m (to the farthest lot point)`:''}</text>`); } }
   
  const sb=o.key?yB+fs*2.6:Hh-22, sx=o.key?X(V0)+(S.north!=null?fs*3:0):o.scaleRight?(W+60-30*k-24):20; for(let i=0;i<3;i++) out.push(`<rect x="${sx+i*10*k}" y="${sb}" width="${10*k}" height="6" fill="${i%2?'#fff':INK}" stroke="${INK}" stroke-width="0.6"/>`);
  out.push(`<text x="${sx}" y="${sb+6+fs*1.1}" font-size="${fs}" fill="${INK2}">0</text><text x="${sx+30*k}" y="${sb+6+fs*1.1}" text-anchor="middle" font-size="${fs}" fill="${INK2}">30 m</text>`);
  if(S.north!=null){ const nx=o.key?X(V0)+12:o.scaleRight?sx-30:sx+30*k+40, ny=sb, ang=Array.isArray(S.north)?Math.atan2(S.north[1],S.north[0])*180/Math.PI:S.north; out.push(`<g transform="rotate(${ang.toFixed(1)} ${nx} ${ny})"><path d="M${nx},${ny-14}L${nx+6},${ny+4}L${nx},${ny}L${nx-6},${ny+4}Z" fill="${INK}"/></g><text x="${nx}" y="${ny+18}" text-anchor="middle" font-size="${fs}" font-weight="600" fill="${INK}">N</text>`); }
  out.push(`<defs><marker id="${id}a" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0L8,4L0,8Z" fill="${INK2}"/></marker><marker id="${id}d" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0L6,3L0,6Z" fill="${INK2}"/></marker><marker id="${id}dm" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0L7,3.5L0,7Z" fill="${INK}"/></marker></defs>`);
  return `<svg viewBox="0 0 ${W+60} ${Hh}"${o.key?' data-spcrop="1"':''} role="img" aria-label="${esc(o.label||'Site plan at street level')}" style="font-family:'IBM Plex Sans',system-ui,sans-serif">${out.join('')}</svg>${o.key&&kinds.length?`<p class="sp-key" style="font-size:12px;color:${INK};margin:4px 0 0"><b style="font-weight:600">Doors</b> ${kinds.map((l,i)=>`<span style="white-space:nowrap;margin-left:8px"><span style="display:inline-block;width:15px;height:15px;line-height:13px;border:1px solid ${INK2};border-radius:50%;text-align:center;font-size:10.5px;font-weight:600">${i+1}</span> ${esc(l)}</span>`).join('')}${o.key&&fu.length&&!bFits?'<span style="white-space:nowrap;margin-left:12px">charcoal: the building, storey 1 outline</span>':''}</p>`:''}${o.key&&KX.length?`<p class="sp-key" style="font-size:12px;color:${INK};margin:4px 0 0">${KX.join(' · ')}</p>`:''}<p class="sp-cr" style="font-size:12px;color:${INK2};margin:4px 0 0">${o.noCredit?'':esc(S.credit||'Contains information licensed under the Open Government Licence \u2013 Vancouver.')}${S.note?' '+esc(S.note):''}${capS?' '+esc(capS):''}</p>`; }

 
let C339=null; const get=u=>fetch(u).then(r=>r.ok?r.json():null).catch(()=>null);
async function board339(){ if(C339) return C339; const [P,X,LG]=await Promise.all([get('f1/l3/plan339.json'),get('f1/l3/context339lot.json'),get('f1/lag_van.json')]); if(!P||!X) return null;
  const s1=P.storeys.find(s=>s.st===1), fp=s1.zones.flatMap(z=>(z.rings&&z.rings.length)?z.rings:(z.rects||[]).map(r=>[[r[0],r[2]],[r[1],r[2]],[r[1],r[3]],[r[0],r[3]]])); const L=LG&&LG.lots&&LG.lots['63819485'], road=L&&L.facing&&L.facing.find(f=>f.as==='front');
  C339={lot:X.lot,streetName:road&&road.road?road.road.replace(/\bAV\b/,'Ave').toLowerCase().replace(/\b[a-z]/g,c=>c.toUpperCase()).replace(/(\d)(St|Nd|Rd|Th)\b/,(m,a,b)=>a+b.toLowerCase()):'',
    footprint:fp.length?fp:null, yard:P.yard, court:P.yard&&P.yard.truckCourt?P.yard.truckCourt.rect:P.court, doors:P.street&&P.street.door?[{p:P.street.door,label:'Main entrance'}]:[], north:null, neighbours:X.neighbours||[]}; return C339; }
 
 
function turn(P){ const side=P.street&&P.street.side; if(!side||side==='u-low') return P; const q=JSON.parse(JSON.stringify(P));
  const T=side==='u-high'?(u,v)=>[-u,-v]:side==='v-low'?(u,v)=>[v,-u]:(u,v)=>[-v,u], pt=a=>{ const [u,v]=T(a[0],a[1]); a[0]=u; a[1]=v; };
  const rect=r=>{ const c=[T(r[0],r[2]),T(r[1],r[3])]; r[0]=Math.min(c[0][0],c[1][0]); r[1]=Math.max(c[0][0],c[1][0]); r[2]=Math.min(c[0][1],c[1][1]); r[3]=Math.max(c[0][1],c[1][1]); };
  for(const s of q.storeys||[]) for(const z of s.zones||[]){ (z.rects||[]).forEach(rect); (z.rings||[]).forEach(R=>R.forEach(pt)); }
  if(q.farm&&Array.isArray(q.farm.rects)) q.farm.rects.forEach(rect);    
  if(q.court) rect(q.court); if(q.yard){ (q.yard.rings||[]).forEach(R=>R.forEach(pt)); if(q.yard.truckCourt&&q.yard.truckCourt.rect) rect(q.yard.truckCourt.rect); }
  if(q.site){ (q.site.lot||[]).forEach(pt); (q.site.edges||[]).forEach(e=>{ if(e.a) pt(e.a); if(e.b) pt(e.b); }); if(Array.isArray(q.site.north)) pt(q.site.north); }
  if(q.truckAccess&&q.truckAccess.path) q.truckAccess.path.forEach(pt); const swap=side==='v-low'||side==='v-high'; for(const d of q.doors||[]){ if(d.at) pt(d.at); if(swap&&d.wall) d.wall=d.wall==='h'?'v':'h'; }
  q.street=Object.assign({},q.street,{side:'u-low'}); return q; }
function fromPlan(P,o){ o=o||{}; if(o.turn!==false) P=turn(P); const st=P.site; if(!st||!st.lot) return null;
  const s1=(P.storeys||[]).find(s=>s.st===1)||{zones:[]}, fp=(s1.zones||[]).flatMap(z=>(z.rings&&z.rings.length)?z.rings:(z.rects||[]).map(r=>[[r[0],r[2]],[r[1],r[2]],[r[1],r[3]],[r[0],r[3]]]));
  const ct=(P.yard&&P.yard.truckCourt&&P.yard.truckCourt.rect)||P.court||null;
  const E=st.edges||[], isRoad=e=>e.kind==='front'||/street|lane|alley|road/i.test(e.abuts||''), road=E.filter(isRoad);
  const pipR=(u,v,R)=>{ let c=false; for(let i=0,j=R.length-1;i<R.length;j=i++){ const [ui,vi]=R[i],[uj,vj]=R[j]; if(((vi>v)!==(vj>v))&&(u<(uj-ui)*(v-vi)/(vj-vi)+ui)) c=!c; } return c; };
   
  const TA=P.truckAccess||{}, to=TA.to||(TA.kind==='lane'?'lane':'street');
  const want=E.filter(e=>to==='lane'?/lane|alley/i.test(e.abuts||''):(e.kind==='front'||/street/i.test(e.abuts||''))), RE=want.length?want:road;
  let drive=null, driveW=null, crosses=false, offStreet=false;
  if(ct&&RE.length){ const c=[(ct[0]+ct[1])/2,(ct[2]+ct[3])/2];
    const foot=q=>{ let best=null; for(const e of RE){ const [au,av]=e.a,[bu,bv]=e.b, du=bu-au, dv=bv-av, L2=du*du+dv*dv||1, t=Math.max(0,Math.min(1,((q[0]-au)*du+(q[1]-av)*dv)/L2)), f=[au+t*du,av+t*dv], d=Math.hypot(f[0]-q[0],f[1]-q[1]); if(!best||d<best.d) best={e,f,d}; } return best; };
    const path=(TA.path||[]).slice();
    if(path.length>=2){ if(Math.hypot(path[0][0]-c[0],path[0][1]-c[1])<Math.hypot(path[path.length-1][0]-c[0],path[path.length-1][1]-c[1])) path.reverse(); const b=foot(path[0]); drive=path; driveW=TA.width||null; if(b.d>2) offStreet=true; }    
    else { const b=foot(c), f=b.f, cl=[Math.max(ct[0],Math.min(ct[1],f[0])),Math.max(ct[2],Math.min(ct[3],f[1]))], du=f[0]-c[0], dv=f[1]-c[1], n=Math.hypot(du,dv)||1, out=[f[0]+du/n*5,f[1]+dv/n*5];
      drive=[out,[cl[0]+(c[0]-cl[0])*0.3,cl[1]+(c[1]-cl[1])*0.3]]; if(TA.width&&/^drive/.test(TA.kind||'')) driveW=TA.width;
      for(let i=1;i<20;i++){ const u=f[0]+(cl[0]-f[0])*i/20, v=f[1]+(cl[1]-f[1])*i/20; if(fp.some(R=>pipR(u,v,R))){ crosses=true; break; } } } }
  if(o.flag) Object.assign(o.flag,{crosses,hasCourt:!!ct,road:road.length,toward:to,kind:TA.kind||null});
  const lanes=E.filter(e=>/lane|alley/i.test(e.abuts||'')).map(e=>({a:e.a,b:e.b,label:'Lane'}));
  const m1d=v=>(Math.round(v*10)/10).toLocaleString('en-CA');
  const dl=/^drive/.test(TA.kind||'')?`Truck drive${TA.width?', '+m1d(TA.width)+' m wide,':''} from the ${to}`:TA.kind==='direct'?`Trucks enter from the ${to}`:TA.kind==='lane'?'Loading from the lane':`Truck route from the ${to}`;
  return {lot:st.lot, streetName:o.streetName||'', footprint:fp.length?fp:null, yard:P.yard, court:ct,
    doors:(P.doors||[]).filter(d=>d.storey===1&&d.at).map(d=>({p:d.at,kind:d.kind,wall:d.wall,width:d.width})),
    north:st.north||null, neighbours:o.neighbours||[], lanes, drive, driveW,
    driveLabel:dl, driveCrosses:crosses, driveOffStreet:offStreet, farm:P.farm||null,
    credit:o.credit, note:o.note}; }
function crop(root,pad){ pad=pad==null?14:pad; (root||document).querySelectorAll('svg[data-spcrop]').forEach(svg=>{ try{ let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(const el of svg.children){ if(el.tagName==='defs'||el.hasAttribute('data-nocrop')) continue; const b=el.getBBox(); if(!b.width&&!b.height) continue; x0=Math.min(x0,b.x); y0=Math.min(y0,b.y); x1=Math.max(x1,b.x+b.width); y1=Math.max(y1,b.y+b.height); }
  if(x1>x0&&y1>y0){ svg.setAttribute('viewBox',`${(x0-pad).toFixed(1)} ${(y0-pad).toFixed(1)} ${(x1-x0+2*pad).toFixed(1)} ${(y1-y0+2*pad).toFixed(1)}`); svg.removeAttribute('data-spcrop'); } }catch(e){} }); }
const FARM={}; async function farmFor(lot,plan){ lot=String(lot||''); if(!lot||!plan) return null; if(!(lot in FARM)) FARM[lot]=fetch((BD.ASSET_BASE||'')+'f1/farm/van_'+lot+'.json').then(r=>r.ok?r.json():null).catch(()=>null); const d=await FARM[lot]; const f=d&&d.plans&&d.plans[plan]; return f&&(f.rects||[]).length?{rects:f.rects,label:f.label,tag:f.tag,m2:f.m2}:null; }    
BD.f1siteplan={render,board339,fromPlan,turn,crop,farmFor};
})();

 
(function(){
const BD=window.BD=window.BD||{};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let DATA=null, LOADING=null;
const load=()=>LOADING||(LOADING=fetch((BD.ASSET_BASE||'')+'data/street_labels_van.json').then(r=>r.ok?r.json():null).then(d=>(DATA=d)).catch(()=>null));
const SRC='Street names: City of Vancouver Open Data, Public streets (Open Government Licence – Vancouver).';

function pip(x,y,R){ let c=false; for(let i=0,j=R.length-1;i<R.length;j=i++){ const [xi,yi]=R[i],[xj,yj]=R[j]; if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi)) c=!c; } return c; }
function segD(px,py,ax,ay,bx,by){ const dx=bx-ax, dy=by-ay, L=dx*dx+dy*dy||1, t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/L)); return Math.hypot(px-ax-t*dx,py-ay-t*dy); }
const edgeD=(x,y,R)=>{ let d=1e9; for(let i=0,j=R.length-1;i<R.length;j=i++) d=Math.min(d,segD(x,y,R[j][0],R[j][1],R[i][0],R[i][1])); return d; };
const norm=a=>{ while(a>90) a-=180; while(a<-90) a+=180; return a; };

 
function forLot(id,max){ const L=DATA&&DATA.lots&&DATA.lots[String(id)]; if(!L) return []; const seen=new Set(), out=[];
  for(const l of L.labels||[]){ if(!l.name||seen.has(l.name)) continue; seen.add(l.name); out.push(l); if(out.length>=(max||6)) break; } return out; }

 
function svg(id,P,o){ o=o||{}; const W=o.W, H=o.H, fs=o.fs||12, cf=o.collFs||fs, pad=o.pad==null?cf*0.8:o.pad, avoid=o.avoid||[], lotPts=o.lotPts||[], lotFrame=o.frame==='lot', placed=[], out=[];
  for(const l of forLot(id,o.max)){ const lines=(lotFrame?l.linesLot:l.lines)||[], an=lotFrame?l.anchorLot:l.anchor; const half=String(l.name).length*cf*0.29+cf*0.4, hh=cf*0.62;    
     
    const C=[]; if(an){ const ang=lotFrame?l.angleDegLot:l.angleDeg; C.push([an[0],an[1],ang,null]); }
    for(const ln of lines) for(let i=1;i<ln.length;i++){ const a=ln[i-1], b=ln[i]; for(const t of [0.5,0.3,0.7]) C.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,null,[a,b]]); }
    for(const [x0,y0,ang0,seg] of C){ const [x,y]=P(x0,y0); let a;
      if(seg){ const p=P(seg[0][0],seg[0][1]), q=P(seg[1][0],seg[1][1]); if(Math.hypot(q[0]-p[0],q[1]-p[1])<half*(o.minRun==null?1.2:o.minRun)) continue; a=norm(Math.atan2(q[1]-p[1],q[0]-p[0])*180/Math.PI); }
      else { const p=P(x0,y0), q=P(x0+Math.cos(ang0*Math.PI/180),y0+Math.sin(ang0*Math.PI/180)); a=norm(Math.atan2(q[1]-p[1],q[0]-p[0])*180/Math.PI); }
      const ca=Math.cos(a*Math.PI/180), sa=Math.sin(a*Math.PI/180);
       
      const lc=lotPts.length?lotPts.reduce((m,q)=>[m[0]+q[0]/lotPts.length,m[1]+q[1]/lotPts.length],[0,0]):null, d=hh*1.25;
      const away=lc&&((x-lc[0])*-sa+(y-lc[1])*ca)>0?1:-1, offs=[0,away*d,-away*d];
      let ok=false, X=x, Y=y;
      for(const o of offs){ X=x-sa*o; Y=y+ca*o;
      const pts=[]; for(const u of [-1,-0.5,0,0.5,1]) for(const v of [-1,0,1]) pts.push([X+ca*u*half-sa*v*hh, Y+sa*u*half+ca*v*hh]);
      if(pts.some(([px,py])=>px<pad||py<pad||px>W-pad||py>H-pad)) continue;
      if(lotPts.length>2&&pts.some(([px,py])=>pip(px,py,lotPts)||edgeD(px,py,lotPts)<cf*0.4)) continue;
      if(avoid.some(([x0,y0,x1,y1])=>pts.some(([px,py])=>px>x0-cf*0.2&&px<x1+cf*0.2&&py>y0-cf*0.2&&py<y1+cf*0.2))) continue;
      if(placed.some(b=>pts.some(([px,py])=>Math.abs((px-b.x)*b.ca+(py-b.y)*b.sa)<b.half+cf*0.3&&Math.abs(-(px-b.x)*b.sa+(py-b.y)*b.ca)<b.hh+cf*0.2))) continue;
      ok=true; break; }
      if(!ok) continue; const x1=X, y1=Y;
      placed.push({x:x1,y:y1,ca,sa,half,hh});
      out.push(`<text class="f1st" x="${x1.toFixed(1)}" y="${y1.toFixed(1)}" transform="rotate(${a.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)})" text-anchor="middle" dominant-baseline="central" font-size="${fs}" font-weight="500" fill="#4A5672" stroke="#fff" stroke-width="${(fs*0.28).toFixed(2)}" stroke-linejoin="round" paint-order="stroke" pointer-events="none">${esc(l.name)}</text>`);
      break; } }
  return out.length?`<g class="f1st-g${o.cls?' '+o.cls:''}" aria-label="Street names">${out.join('')}</g>`:''; }

BD.f1streets={load,forLot,svg,SRC};
load();
})();

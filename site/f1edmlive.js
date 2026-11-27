 
(function(){
'use strict';
const BD=window.BD=window.BD||{};
const INK='#1E2A47', INK2='#4A5672', INK3='#6B7590', LAND='#F0F1F4', YARD='#AEB2BA', COURT='#DEE0E4';
const NOTE='Simplified lot shape for academic purposes; the real lot lines are not published.';
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const n0=v=>Math.round(+v||0).toLocaleString('en-CA');
let D=null; const data=async()=>{ if(D!==null) return D; try{ const r=await fetch((BD.ASSET_BASE||'')+'data/edm_public.json'); D=r.ok?await r.json():false; if(D){ D.byId={}; for(const l of D.layouts) D.byId[l.id]=l; } }catch(e){ D=false; } return D; };
 
let OL=null; const outlines=async()=>{ if(OL!==null) return OL; try{ const r=await fetch((BD.ASSET_BASE||'')+'f1/plans/edm_lot_outlines.json'); OL=r.ok?await r.json():false; }catch(e){ OL=false; } return OL; };
const NOTE_OL='Lot outline lightly simplified.'; outlines();    
const noteFor=L=>L&&L.ring?NOTE_OL:NOTE;
async function lot(id){ const E=await data(); const L=E&&E.lots[String(id)]||null; if(!L) return null; const O=await outlines(), o=O&&O.lots&&O.lots[String(id)];
  if(!o||!o.ring||o.ring.length<3) return L; const us=o.ring.map(q=>q[0]), vs=o.ring.map(q=>q[1]), u0=Math.min(...us), v0=Math.min(...vs);
  return Object.assign({},L,{ring:o.ring.map(q=>[q[1]-v0,q[0]-u0]),widthM:Math.max(...vs)-v0,depthM:Math.max(...us)-u0,outlineAreaM2:o.areaM2}); }
async function layout(id){ const E=await data(); return E&&E.byId[id]||null; }
const col=z=>BD.f1mass&&BD.f1mass.colour?BD.f1mass.colour(z):'#C3CAD6';
 
const kinds=st=>{ const m=new Map(); for(const z of st.zones||[]){ const k=z.zone, lab=/^core-|^circulation/.test(k)?({'core-dc':'Data-centre stairs and lifts','core-public':'Public stairs and lifts','circulation':'Public circulation','circulation-dc':'Data-centre circulation'}[k]||z.label):z.label; const o=m.get(k)||{zone:k,label:lab,a:0}; o.a+=+z.areaM2||0; m.set(k,o); } return [...m.values()].sort((a,b)=>b.a-a.a); };
 
function site(L,Y,o){ o=o||{}; const w=L.widthM, d=L.depthM, s1=(Y.storeys||[]).find(q=>q.st===1)||{}, fp=+s1.areaM2||0, ya=+(Y.yard&&Y.yard.areaM2)||0, ta=+(Y.yard&&Y.yard.truckCourtM2)||0;
   
  const m=Math.min(6,w*0.04,d*0.04);
  let bw=Math.min(w-2*m,Math.max(Math.sqrt(fp*1.4),fp/(d*0.45))), bd=fp/bw; if(bd>d-2*m){ bd=d-2*m; bw=Math.min(w-2*m,fp/bd); }
  let bx=(w-bw)/2, by=m; let yw=bw, yd=ya/yw; if(by+bd+yd>d-m){ yd=Math.max(1,d-m-(by+bd)); yw=Math.min(w-2*m,ya/yd); }
  let yx=(w-yw)/2, yy=by+bd, tw=Math.sqrt(ta), td=tw; let tx=Math.min(w-m-tw,yx+yw+2); if(tx<m) tx=m; let ty=yy;
  if(L.ring){  
    const R=L.ring, inP=(x,y)=>{ let c=false; for(let i=0,j=R.length-1;i<R.length;j=i++){ const [xi,yi]=R[i],[xj,yj]=R[j]; if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi)) c=!c; } return c; };
    const ok=(dx,dy)=>[[bx,by,bw,bd],[yx,yy,yw,yd],...(ta?[[tx,ty,tw,td]]:[])].every(([x,y,ww,hh])=>[[x,y],[x+ww,y],[x,y+hh],[x+ww,y+hh],[x+ww/2,y],[x+ww/2,y+hh]].every(([px,py])=>inP(px+dx,py+dy)));
    let best=null; for(let dy=0;dy<=d&&!best;dy+=0.5) for(const dx of [0,...[...Array(Math.ceil(w))].flatMap((_,i)=>[i+1,-(i+1)])]){ if(ok(dx,dy)){ best=[dx,dy]; break; } }
    if(best){ bx+=best[0]; yx+=best[0]; tx+=best[0]; by+=best[1]; yy+=best[1]; ty+=best[1]; } }
  const ext=[Math.min(bx,yx,tx),0,Math.max(bx+bw,yx+yw,tx+tw),Math.max(by+bd,yy+yd,ty+td)];    
  const VW=o.W||620, VH=o.H||560, LW=(()=>{ const pl=Y.plant||{}, t=[[pl.generator,'generators'],[pl.chiller,'chillers'],[pl.transformerPad,'transformer pads']].filter(q=>q[0]>0).map(q=>q[0]+' '+q[1]).join(', '); return Math.max(200,Math.ceil(t.length*6.6+24)); })(),     kLot=Math.min((VW-40)/w,(VH-80)/d), small=(ext[2]-ext[0])*kLot<120;
  const parts=[], lab=[];
   
  const frame=(x0,y0,x1,y1,px0,py0,pw,ph)=>{ const k=Math.min(pw/(x1-x0),ph/(y1-y0)), ox=px0+(pw-(x1-x0)*k)/2-x0*k, oy=py0+ph-(ph-(y1-y0)*k)/2+y0*k; return {k,P:(x,y)=>[ox+x*k,oy-y*k]}; };
  const rect=(F,x,y,ww,hh,f,st)=>{ const [ax,ay]=F.P(x,y+hh); return `<rect x="${ax.toFixed(1)}" y="${ay.toFixed(1)}" width="${Math.max(1,ww*F.k).toFixed(1)}" height="${Math.max(1,hh*F.k).toFixed(1)}" fill="${f}"${st||''}/>`; };
  const lotR=(F,rx)=>{ if(L.ring) return `<polygon points="${L.ring.map(q=>F.P(q[0],q[1]).map(n=>n.toFixed(1)).join(',')).join(' ')}" fill="${LAND}" stroke="${INK}" stroke-width="1.4" stroke-dasharray="10 4 3 4" stroke-linejoin="round"/>`;    
    const [ax,ay]=F.P(0,d); return `<rect x="${ax.toFixed(1)}" y="${ay.toFixed(1)}" width="${(w*F.k).toFixed(1)}" height="${(d*F.k).toFixed(1)}" rx="${rx}" fill="${LAND}" stroke="${INK}" stroke-width="1.4" stroke-dasharray="10 4 3 4"/>`; };
   
  const name=(F,x,y,ww,hh,t1,t2,rightX)=>{ const [ax,ay]=F.P(x,y+hh), pw=ww*F.k, ph=hh*F.k, need=Math.max(t1.length,t2.length)*7.2+12;
    if(pw>=need&&ph>=36) return `<text x="${(ax+6).toFixed(1)}" y="${(ay+17).toFixed(1)}" font-size="13" font-weight="600" fill="${INK}">${esc(t1)}</text><text x="${(ax+6).toFixed(1)}" y="${(ay+33).toFixed(1)}" font-size="12" fill="${INK2}">${esc(t2)}</text>`;
    const cy=ay+ph/2, x0=ax+pw; return `<line x1="${x0.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${(rightX-6).toFixed(1)}" y2="${cy.toFixed(1)}" stroke="#8A94AA" stroke-width="0.8"/><text x="${rightX.toFixed(1)}" y="${(cy-2).toFixed(1)}" font-size="13" font-weight="600" fill="${INK}">${esc(t1)}</text><text x="${rightX.toFixed(1)}" y="${(cy+14).toFixed(1)}" font-size="12" fill="${INK2}">${esc(t2)}</text>`; };
  const blocks=(F,rightX)=>{ const o2=[]; if(ya) o2.push(rect(F,yx,yy,yw,yd,YARD)); if(ta) o2.push(rect(F,tx,ty,tw,td,COURT,` stroke="${INK3}" stroke-width="0.6"`)); o2.push(rect(F,bx,by,bw,bd,'#FFFFFF',` stroke="${INK}" stroke-width="2"`));
    o2.push(name(F,bx,by,bw,bd,'Building, storey 1',`${n0(fp)} m²`,rightX)); if(ya){ const pl=Y.plant||{}, u=[[pl.generator,'generator'],[pl.chiller,'chiller'],[pl.transformerPad,'transformer pad']].filter(q=>q[0]>0).map(q=>`${q[0]} ${q[1]}${q[0]>1?'s':''}`).join(', ');    
      o2.push(name(F,yx,yy+(ta?yd*0.55:0),yw,ta?yd*0.45:yd,`Plant yard, ${n0(ya)} m²`,u||'',rightX)); } if(ta) o2.push(name(F,tx,ty,tw,td,'Truck court',`${n0(ta)} m²`,rightX)); return o2.join(''); };
  let H=VH;
  if(!small){ const F=frame(0,0,w,d,20,20,VW-40,VH-70); parts.push(lotR(F,Math.min(14,Math.min(w,d)*F.k*0.06).toFixed(1))); parts.push(blocks(F,VW+10));
    const [sx,sy]=F.P(w/2,0); lab.push(`<text x="${sx.toFixed(1)}" y="${(sy+18).toFixed(1)}" text-anchor="middle" font-size="12" fill="${INK2}">Street</text>`); var Fs=F, sy0=sy; }
  else {  
    const F=frame(0,0,w,d,20,40,200,200); parts.push(lotR(F,'6')); const [m0x,m0y]=F.P(ext[0],ext[3]), [m1x,m1y]=F.P(ext[2],0);
    parts.push(`<rect x="${(m0x-4).toFixed(1)}" y="${(m0y-4).toFixed(1)}" width="${(m1x-m0x+8).toFixed(1)}" height="${(m1y-m0y+8).toFixed(1)}" fill="none" stroke="${INK}" stroke-width="1.6"/>`);
    lab.push(`<text x="20" y="28" font-size="12" font-weight="600" fill="${INK}">Whole lot, ${n0(w)} × ${n0(d)} m</text>`);
    const pad=Math.max(8,(ext[2]-ext[0])*0.12), I=frame(ext[0]-pad,0,ext[2]+pad,ext[3]+pad,250,40,VW-260,VH-110);
    const [ia,ib]=I.P(ext[0]-pad,ext[3]+pad), [ic,id]=I.P(ext[2]+pad,0);
    parts.push(`<rect x="${ia.toFixed(1)}" y="${ib.toFixed(1)}" width="${(ic-ia).toFixed(1)}" height="${(id-ib).toFixed(1)}" fill="${LAND}" stroke="${INK}" stroke-width="1.6"/>`);
    lab.push(`<text x="${ia.toFixed(1)}" y="28" font-size="12" font-weight="600" fill="${INK}">The marked spot, enlarged</text>`); parts.push(blocks(I,VW+10));
    const [sx,sy]=I.P((ext[0]+ext[2])/2,0); lab.push(`<text x="${sx.toFixed(1)}" y="${(sy+18).toFixed(1)}" text-anchor="middle" font-size="12" fill="${INK2}">Street</text>`); var Fs=I, sy0=sy; }
   
  const sb=[5,10,20,25,50,100,200,250,500].find(q=>q*Fs.k>=70)||500; lab.push(`<rect x="${small?250:20}" y="${(sy0+30).toFixed(1)}" width="${(sb*Fs.k).toFixed(1)}" height="4" fill="${INK}"/><text x="${small?250:20}" y="${(sy0+48).toFixed(1)}" font-size="12" fill="${INK2}">0</text><text x="${((small?250:20)+sb*Fs.k).toFixed(1)}" y="${(sy0+48).toFixed(1)}" font-size="12" fill="${INK2}" text-anchor="middle">${sb} m</text>`);
  return `<svg viewBox="0 0 ${VW+LW} ${Math.ceil(sy0+60)}" width="100%" style="display:block;max-width:${VW+LW}px" role="img" aria-label="${L.ring?'Lot outline':'Simplified lot'}, ${n0(w)} by ${n0(d)} m, with the building, plant yard and truck court sized to the layout" font-family="IBM Plex Sans, system-ui, sans-serif">${parts.join('')}${lab.join('')}</svg><p class="edl-note">${L.ring?`${esc(NOTE_OL)} Building, plant yard and truck court sized to the layout’s own areas and placed schematically.`:`${esc(NOTE)} Lot ${n0(w)} × ${n0(d)} m (rounded to 2 m); building, plant yard and truck court sized to the layout’s own areas and placed schematically.`}</p>`; }
 
function storeys(Y,o){ o=o||{}; const sts=(Y.storeys||[]).slice().sort((a,b)=>b.st-a.st), max=Math.max(...sts.map(s=>+s.areaM2||0),1), W=o.W||760, BW=W-230, rows=[];
  let y=10; const seen=new Map();
  for(const s of sts){ let x=150; const ks=kinds(s); rows.push(`<text x="0" y="${y+16}" font-size="13" font-weight="600" fill="${INK}">Storey ${s.st}</text><text x="0" y="${y+32}" font-size="12" fill="${INK2}">${n0(s.areaM2)} m²</text>`);
    for(const z of ks){ const ww=z.a/max*BW; if(ww<0.5) continue; rows.push(`<rect x="${x.toFixed(1)}" y="${y+4}" width="${ww.toFixed(1)}" height="28" fill="${col(z.zone)}" stroke="#fff" stroke-width="0.8"><title>${esc(z.label)}: ${n0(z.a)} m²</title></rect>`); if(ww>z.label.length*6.4+12) rows.push(`<text x="${(x+6).toFixed(1)}" y="${y+22}" font-size="11.5" fill="${/^(dc|core-dc|hall)$/.test(z.zone)?'#fff':INK}">${esc(z.label)}</text>`);     x+=ww; if(!seen.has(z.zone)) seen.set(z.zone,z.label); }
    y+=48; }
  const key=[...seen].map(([z,l])=>`<span class="edl-k"><i style="background:${col(z)}"></i>${esc(l)}</span>`).join('');
  return `<svg viewBox="0 0 ${W} ${y}" width="100%" style="display:block;max-width:${W}px" role="img" aria-label="Floor area of each storey by zone" font-family="IBM Plex Sans, system-ui, sans-serif">${rows.join('')}</svg><div class="edl-key">${key}</div><p class="edl-note">Storeys as bars of the layout’s zone areas (to scale by area, not plans).</p>`; }
const CSS=`.edl-note{font-size:12px;color:#6B7590;margin:6px 0 0;max-width:820px}.edl-key{display:flex;flex-wrap:wrap;gap:4px 14px;margin:6px 0 0;font-size:12px;color:#1E2A47}.edl-k i{display:inline-block;width:12px;height:12px;margin-right:6px;vertical-align:-1px}`;
function css(){ if(document.getElementById('edl-css')) return; const s=document.createElement('style'); s.id='edl-css'; s.textContent=CSS; document.head.appendChild(s); }
 
const TNM={aquaponics:'Aquaponics',community_pool:'Community pool',conservatory:'Conservatory',emergency_hub:'Emergency hub',food_hub:'Food hub',heat_cascade:'Heat cascade',shelter_laundry:'Shelter and laundry',warm_bath:'Warm bath'};
let PK=null;
const pubPct=Y=>{ const z=(Y.shares&&Y.shares.byZone)||[]; return z.filter(q=>/^public/.test(q.zone)).reduce((a,q)=>a+(+q.pct||0),0); };
function mini(Y){ const sts=(Y.storeys||[]).slice().sort((a,b)=>b.st-a.st), max=Math.max(...sts.map(q=>+q.areaM2||0),1); let y=0, o='';
  for(const st of sts){ let x=0; for(const z of kinds(st)){ const w=z.a/max*150; o+=`<rect x="${x.toFixed(1)}" y="${y}" width="${Math.max(0.5,w).toFixed(1)}" height="9" fill="${col(z.zone)}"/>`; x+=w; } y+=12; }
  return `<svg viewBox="0 0 150 ${y}" width="150" height="${y}" aria-hidden="true">${o}</svg>`; }
function card(Y,chosen,old){ return `<button type="button" class="edp-c${chosen?' on':''}" onclick="BD.f1edm.open('${esc(Y.id)}')"><span class="edp-h">${esc(TNM[Y.typology]||Y.typology)}</span><span class="edp-s">${Y.security==='shared'?'Shared entrance':'Separate entrances'} · ${esc(Y.density||'standard')} density${Y.compact?' · compact':''}</span>${mini(Y)}<span class="edp-n">${(+Y.MW).toFixed(2)} MW · ${n0(Y.shares&&Y.shares.totalM2)} m² · ${(Y.storeys||[]).length} storeys · public ${pubPct(Y).toFixed(0)} %${Y.fitsLots?` · fits ${n0(Y.fitsLots)} lots`:''}</span>${old?`<span class="edp-o">${esc(BD.f1best.oldLine(old))}</span>`:''}${chosen?'<span class="edp-ch">Chosen</span>':''}</button>`; }
function paint(){ const h=document.querySelector('#f1v [data-edp]'); if(!h||!PK) return; if(PK.open){ const Y=PK.list.find(q=>q.Y.id===PK.open); if(Y){ h.innerHTML=`<div class="edp-top"><button type="button" class="edp-b" onclick="BD.f1edm.open(null)">Back to the layouts</button><button type="button" class="edp-go" onclick="BD.f1edm.choose('${esc(Y.Y.id)}')">${PK.chosen===Y.Y.id?'Chosen':'Choose this layout'}</button></div><h3 class="edp-dh">${esc(TNM[Y.Y.typology]||Y.Y.typology)} · ${(+Y.Y.MW).toFixed(2)} MW · ${n0(Y.Y.shares&&Y.Y.shares.totalM2)} m² · ${(Y.Y.storeys||[]).length} storeys</h3>${Y.old?`<p class="edp-o">${esc(BD.f1best.oldLine(Y.old))}.</p>`:''}<div class="edp-d">${storeys(Y.Y,{W:640})}</div><div class="edp-d">${site(PK.L,Y.Y,{W:520,H:420})}</div><p class="edl-note">A library variant that fits this lot; not yet reviewed.</p>`; return; } }
  const left=PK.list.length-PK.lim; h.innerHTML=`<div class="edp-g">${PK.list.slice(0,PK.lim).map(q=>card(q.Y,PK.chosen===q.Y.id,q.old)).join('')}</div>${left>0?`<p class="edp-more"><button type="button" class="edp-b" onclick="BD.f1edm.more()">Show ${Math.min(48,left)} more (${n0(left)} not shown)</button></p>`:''}${PK.none&&PK.none.length?`<details class="edp-why"><summary>Typologies that don’t fit this lot (${PK.none.length})</summary><ul>${PK.none.map(([t,r])=>`<li><b>${esc(TNM[t]||t)}</b>${r?': '+esc(r):''}</li>`).join('')}</ul></details>`:''}<p class="edl-note">${OL===false?esc(NOTE):''}</p>`; }
async function picker(x,mode){ const E=await data(); if(!E) return null; const L=await lot(x.sel&&x.sel.id); if(!L) return null; css();
  if(!document.getElementById('edp-css')){ const st=document.createElement('style'); st.id='edp-css'; st.textContent=`.edp-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}.edp-c{display:flex;flex-direction:column;gap:6px;text-align:left;background:#fff;border:1px solid #D9DDE3;padding:12px;cursor:pointer;font:inherit}.edp-c.on{border:2px solid #1E2A47}.edp-h{font-weight:600;font-size:15px;color:#1E2A47}.edp-s,.edp-n{font-size:12.5px;color:#4A5672}.edp-o{font-size:12px;color:#8A3B00}.edp-ch{font-size:12px;font-weight:600;color:#1E2A47}.edp-top{display:flex;justify-content:space-between;margin:0 0 10px}.edp-b,.edp-go{border:1px solid #1E2A47;background:#fff;border-radius:18px;padding:6px 14px;cursor:pointer;font:inherit;font-size:13px}.edp-go{background:#1E2A47;color:#fff}.edp-dh{font-size:17px;margin:4px 0 8px;color:#1E2A47}.edp-d{margin:10px 0}[data-edp]{max-height:calc(100vh - 250px);overflow:auto;padding-right:6px}.edp-why{margin:10px 0;font-size:13px}`; document.head.appendChild(st); }
  const I=await BD.f1best.index('edm'), e=I&&I.index&&I.index[String(x.sel.id)]; if(!e||!e.best) return {draw:`<p class="f1v-empty">No library layout fits this lot.</p>`,lead:'No layout fits this lot in the library.'};
  await BD.f1best.oldF(); let LL=null; try{ const r=await fetch((BD.ASSET_BASE||'')+'data/lib_lots_edm.json'); LL=r.ok?await r.json():null; }catch(err){}
  const bt=LL&&LL.lots&&LL.lots[String(x.sel.id)]&&LL.lots[String(x.sel.id)].byTypology||{}, none=[], typs=[];
  for(const [t,v] of Object.entries(bt)){ if(!v||v.none||typeof v==='string') none.push([t,String((v&&v.none)||v||'').replace(/^none:\s*/,'')]); else typs.push({plan:v.plan,lotsFitted:v.fitsLots,oldLibrary:!!v.oldLibrary,MW:v.MW}); }
  typs.sort((a,b)=>(+b.MW||0)-(+a.MW||0));
  let rest=[]; try{ const r=await fetch((BD.ASSET_BASE||'')+'data/layout_filters.json'); const F=r.ok?await r.json():null, rows=F&&F.lots&&F.lots.edm&&F.lots.edm[String(x.sel.id)]; if(Array.isArray(rows)) rest=rows.map(i=>F.plans[i]).map(q=>({plan:String(q[F.fields.indexOf('id')]),MW:+q[F.fields.indexOf('MW')]})).sort((a,b)=>b.MW-a.MW); }catch(err){}    
  const all=[...typs,e.best,...(e.alternatives||[]),...rest].filter(Boolean), seen=new Set(), list=[];    
  for(const p of all){ if(seen.has(p.plan)) continue; seen.add(p.plan); const Y=await layout(p.plan); if(!Y) continue; const old=p.oldLibrary?['earlier']:null; list.push({Y:Object.assign({},Y,{fitsLots:p.lotsFitted||null}),old,MW:+Y.MW}); }
  const keep=list.filter(q=>!q.old), shown=keep.length?keep:list, pulled=list.length-shown.length;
  PK={lot:String(x.sel.id),L,list:shown,lim:48,missing:rest.filter(q=>!list.some(z=>z.Y.id===q.plan)).length,open:null,chosen:BD.f1best.current(String(x.sel.id)),none};
  setTimeout(paint,0);
  return {draw:'<div data-edp></div>',lead:`The library layouts that fit this lot. Open one to see its storeys and the simplified site, then choose it.${pulled?` ${pulled} layout${pulled>1?'s':''} from the earlier library ${pulled>1?'are':'is'} left out: being redone.`:''}`,
    rows:[['Layouts fitted to this lot',n0(shown.length)],['Typologies',n0(new Set(shown.map(q=>q.Y.typology)).size)],['Chosen',PK.chosen?(TNM[(shown.find(q=>q.Y.id===PK.chosen)||{Y:{}}).Y.typology]||'—'):'none yet']],
    src:['Layouts: the tool’s merged library (Edmonton public export, 25 Nov 2026): storey and zone areas, no lot geometry. Lot: rounded rectangle at its size bin.']}; }
function open(id){ if(!PK) return; PK.open=id; paint(); }
function more(){ if(!PK) return; PK.lim+=48; paint(); }
function choose(id){ if(!PK) return; PK.chosen=id; BD.f1best.setCurrent(PK.lot,id,{push:true}); paint(); }
BD.f1edm={data,lot,layout,site,storeys,css,NOTE,NOTE_OL,noteFor,outlines,picker,open,more,choose,CSS};
})();

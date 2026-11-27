 
(function(){
'use strict';
const BD=window.BD=window.BD||{};
const INK='#1E2A47', INK2='#4A5672', INK3='#6B7590', DC='#3D5185', LAND='#F0F1F4', WATER='#DCE7F3';
const ZCOL={1:'#97A2BE',2:'#C3CAD6'};
const VIEW={van:{X0:-7700,X1:7150,Y0:-5650,Y1:7300,title:'Data centres in Vancouver'},edm:{X0:-14400,X1:14900,Y0:-22300,Y1:19700,title:'Data centres in Edmonton'}};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const J={}; const get=u=>J[u]||(J[u]=fetch((BD.ASSET_BASE||'')+u).then(r=>r.ok?r.json():null).catch(()=>null));
const t=(x,y,s,size,w,fill,anchor,halo,rot)=>`<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${size||12}" font-weight="${w||400}" fill="${fill||INK}" text-anchor="${anchor||'start'}"${halo?` stroke="${halo}" stroke-width="3.5" stroke-linejoin="round" paint-order="stroke"`:''}${rot?` transform="rotate(${rot.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})"`:''}>${esc(s)}</text>`;
function mark(x,y,typ,oper,r){ r=r||6.5; const f=oper?DC:'#FFFFFF', st=oper?'':` stroke="${DC}" stroke-width="2"`; if(typ==='hyperscale / cloud') r=9.5;
  if(typ==='colocation'||typ==='hyperscale / cloud') return `<rect x="${(x-r).toFixed(1)}" y="${(y-r).toFixed(1)}" width="${(2*r).toFixed(1)}" height="${(2*r).toFixed(1)}" fill="${f}"${st}/>`;
  if(typ==='enterprise / on-premises') return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r+0.5).toFixed(1)}" fill="${f}"${st}/>`;
  if(typ==='telecom exchange') return `<path d="M${x.toFixed(1)} ${(y-r-2).toFixed(1)}l${r+2} ${r+2}l${-(r+2)} ${r+2}l${-(r+2)} ${-(r+2)}z" fill="${f}"${st}/>`;
  return `<path d="M${x.toFixed(1)} ${(y-r-2).toFixed(1)}l${r+2} ${2*r+2}l${-2*(r+2)} 0z" fill="${f}"${st}/>`; }
const nice=n=>String(n).split(/\s+/).filter(w=>!/^(EASTBOUND|WESTBOUND|NORTHBOUND|SOUTHBOUND)$/.test(w)).map(w=>/^(N|S|E|W|NW|SW|NE|SE)$/.test(w)?w:w==='AV'?'Ave':w==='ST'?'St':/^\d+[A-Z]?(ST|ND|RD|TH)$/.test(w)?w.slice(0,-2)+w.slice(-2).toLowerCase():/^\d+[A-Z]?$/.test(w)?w:w.charAt(0)+w.slice(1).toLowerCase()).join(' ');
const mwTxt=f=>{ const m=f.mw; if(!m) return 'size not published'; return m[0]===m[1]?`${m[0]} MW`:`${m[0]} to ${m[1]} MW`; };
const STW={operating:'operating',permitted:'permitted',proposed:'proposed','?':'status not published',approved:'approved','use approved':'use approved',rezoning:'rezoning',closed:'closed'};

let CN=0;
async function city(cityId,view,px){ const CID='-'+cityId+'-'+(++CN);        
  const V=VIEW[cityId]; if(!V) return null;
  const [M,ST,SH,WV]=await Promise.all([get(`f1/dc/map_${cityId}.json`),get(`streets_${cityId}.json`),cityId==='edm'?get('shore.json'):null,cityId==='van'?get('f1/dc/water_van.json'):null]);
  if(!M) return null;
  const KF=px?px/1000:1, H=(cityId==='van'?1070:940)*KF, S0=Math.min(H/(V.Y1-V.Y0),1000*KF/(V.X1-V.X0)), MW=(V.X1-V.X0)*S0, MH=(V.Y1-V.Y0)*S0, {X0,X1,Y0,Y1}=view||V, MX=0, MY=0, S=MW/(X1-X0), _MH0=(Y1-Y0)*S;
  const P=(x,y)=>[MX+(x-X0)*S, MY+MH-(y-Y0)*S], pth=pts=>'M'+pts.map(q=>{ const p=P(q[0],q[1]); return p[0].toFixed(1)+' '+p[1].toFixed(1); }).join('L')+'Z';
  const o=[`<rect x="0" y="0" width="${MW.toFixed(1)}" height="${MH.toFixed(1)}" fill="${LAND}"/>`];
   
  if(WV&&WV.rings){ o.push(`<path d="${WV.rings.map(r=>{ const q=[]; for(let i=0;i<r.length;i+=2) q.push([r[i],r[i+1]]); return pth(q); }).join('')}" fill="${WATER}" fill-rule="evenodd"/>`); }
  if(SH&&SH.lines&&SH.lines.edm){ const L=SH.lines.edm, pr=l=>{ const q=[]; for(let i=0;i+1<l.length;i+=2) q.push([l[i],l[i+1]]); return q; }; const rings=[pr(L[0]).concat(pr(L[1])),pr(L[2]).concat(pr(L[3])),pr(L[4]||[]),pr(L[5]||[])].filter(r=>r.length>2); o.push(`<path d="${rings.map(pth).join('')}" fill="${WATER}" fill-rule="evenodd"/>`); }
   
  const zd={1:'',2:''}, ZN={1:0,2:0}; for(const [c,ring] of M.zones){ let x=ring[0]/M.Q, y=ring[1]/M.Q; const pts=[[x,y]]; for(let i=2;i+1<ring.length;i+=2){ x+=ring[i]/M.Q; y+=ring[i+1]/M.Q; pts.push([x,y]); } zd[c]+=pth(pts); ZN[c]++; }
  for(const c of [1,2]) if(zd[c]) o.push(`<path d="${zd[c]}" fill="${ZCOL[c]}" fill-rule="evenodd"/>`);
   
  const WID=cityId==='van'?{'Residential':0.7,'Collector':1.1,'Secondary Arterial':1.8,'Arterial':2.4}:{'Local':0.5,'Collector':0.9,'Road':0.9,'Arterial':1.9};
  const boxes=[]; let labels='';
  if(ST&&ST.segs){ const cls=ST.classes;
    for(const c of Object.keys(WID).sort((a,b)=>WID[a]-WID[b])){ const ci=cls.indexOf(c); if(ci<0) continue; let d=''; for(const s of ST.segs){ if(s[0]!==ci) continue; for(let i=2;i+1<s.length;i+=2){ const p=P(s[i],s[i+1]); d+=(i>2?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1); } } o.push(`<path d="${d}" fill="none" stroke="#FFFFFF" stroke-width="${WID[c]}" stroke-linecap="round" stroke-linejoin="round"/>`); }
  }
   
  const FAC=M.facilities.filter(f=>f.onMap&&f.xy);
  for(const f of FAC){ const [x,y]=P(f.xy[0],f.xy[1]); boxes.push([x-18,y-18,x+34,y+18]); }
  const hit=b=>boxes.some(c=>!(b[2]<c[0]||b[0]>c[2]||b[3]<c[1]||b[1]>c[3]));
   
  if(ST&&ST.segs&&ST.names&&ST.nameOf){ const cls=ST.classes, want=new Set(['Arterial','Secondary Arterial']), pts=new Map();
    ST.segs.forEach((s,k)=>{ if(!want.has(cls[s[0]])) return; const ni=ST.nameOf[k]; if(ni==null||ni<0) return; const a=pts.get(ni)||[]; for(let i=2;i+1<s.length;i+=2) a.push(P(s[i],s[i+1])); pts.set(ni,a); });
    const axis=ps=>{ const mx=ps.reduce((a,p)=>a+p[0],0)/ps.length, my=ps.reduce((a,p)=>a+p[1],0)/ps.length; let sxx=0,syy=0,sxy=0; for(const p of ps){ sxx+=(p[0]-mx)**2; syy+=(p[1]-my)**2; sxy+=(p[0]-mx)*(p[1]-my); } return [mx,my,0.5*Math.atan2(2*sxy,sxx-syy)]; };
    const extent=(ps,th)=>{ const u=ps.map(p=>p[0]*Math.cos(th)+p[1]*Math.sin(th)); return Math.max(...u)-Math.min(...u); };
    const cand=[]; for(const [ni,ps] of pts){ if(ps.length<4) continue; const [,,th]=axis(ps); cand.push([extent(ps,th),ni,ps]); }
    let nl=0; const CAP=cityId==='van'?34:30, done=new Set();
    for(const [ext,ni,ps] of cand.sort((a,b)=>b[0]-a[0])){ if(nl>=CAP) break; const name=nice(ST.names[ni]), tw=name.length*6.6; if(done.has(name)||ext<tw*1.6) continue;
      const [mx,my]=axis(ps), order=ps.slice().sort((a,b)=>((a[0]-mx)**2+(a[1]-my)**2)-((b[0]-mx)**2+(b[1]-my)**2));
      for(let j=0;j<order.length;j+=Math.max(1,Math.floor(order.length/12))){ const c0=order[j], win=ps.filter(p=>Math.hypot(p[0]-c0[0],p[1]-c0[1])<tw*0.7); if(win.length<3) continue;
        const [cx,cy,th]=axis(win); if(extent(win,th)<tw*0.9) continue; if(Math.max(...win.map(p=>Math.abs(-(p[0]-cx)*Math.sin(th)+(p[1]-cy)*Math.cos(th))))>3) continue;
        let ang=th*180/Math.PI; if(ang>90) ang-=180; if(ang<-90) ang+=180; if(!(cx>50&&cx<MW-50&&cy>30&&cy<MH-50)) continue;
        const ca=Math.abs(Math.cos(th)), sa=Math.abs(Math.sin(th)), hw=(tw/2)*ca+8*sa, hh=(tw/2)*sa+8*ca, bb=[cx-hw,cy-hh,cx+hw,cy+hh]; if(hit(bb)) continue;
        boxes.push(bb); nl++; done.add(name); labels+=t(cx,cy+4,name,12,400,INK3,'middle',LAND,ang); break; } } }
  o.push(labels);
  const groups=[]; for(const f of FAC.slice().sort((a,b)=>(b.xy[1]-a.xy[1])||(a.xy[0]-b.xy[0]))){ const [px,py]=P(f.xy[0],f.xy[1]); const g=groups.find(g=>{ const q=P(g.xy[0],g.xy[1]); return Math.hypot(q[0]-px,q[1]-py)<10; }); if(g) g.fs.push(f); else groups.push({xy:f.xy,fs:[f]}); }
   
  if(M.ref){ const [sx,sy]=P(M.ref.xy[0],M.ref.xy[1]); o.push(`<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="10" fill="none" stroke="${INK}" stroke-width="1.8"/><circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="2.5" fill="${INK}"/><line x1="${(sx-11).toFixed(1)}" y1="${sy.toFixed(1)}" x2="${(sx-40).toFixed(1)}" y2="${sy.toFixed(1)}" stroke="${INK}" stroke-width="0.8"/>`+t(sx-44,sy+4,M.ref.name,12,600,INK,'end',LAND)); boxes.push([sx-130,sy-12,sx+12,sy+12]); }
  const MB=FAC.map(f=>{ const [x,y]=P(f.xy[0],f.xy[1]); return [x-11,y-11,x+11,y+11]; }), placed=[];
  groups.forEach((g,k0)=>{ const k=k0+1, [x,y]=P(g.xy[0],g.xy[1]);
    let marks=''; g.fs.forEach((f,j)=>{ const [fx,fy]=P(f.xy[0],f.xy[1]), same=Math.abs(fx-x)<0.5&&Math.abs(fy-y)<0.5; marks+=same?mark(x+j*5,y-j*5,f.type,f.status==='operating'):mark(fx,fy,f.type,f.status==='operating'); });
    const mx=x+5*(g.fs.length-1), my=y-5*(g.fs.length-1), lw=8*String(k).length, top=my-5*(g.fs.length-1);
    const free=(x0,y0)=>!MB.concat(placed).some(bb=>!(x0+lw<bb[0]||x0-2>bb[2]||y0+6<bb[1]||y0-8>bb[3]));
    const cands=[[mx+14,my,0],[x-14-lw,y,0],[x-lw/2,top-15,0],[x-lw/2,y+22,0]].concat([1,2,3,4,5,6,7].map(i=>[mx+14+10*i,my,1]));
    const [lx,ly,ld]=cands.find(c=>free(c[0],c[1]))||cands[cands.length-1]; placed.push([lx-2,ly-8,lx+lw,ly+6]);
    o.push(`<g class="dcm-g" data-fac="${cityId}:${g.fs[0].id}" data-facg="${cityId}:${g.fs.map(f=>f.id).join(',')}" data-dcgo="1" style="cursor:pointer" role="button" tabindex="0" aria-label="${esc(k+': '+g.fs.map(f=>f.name).join(', '))}"><rect x="${(x-14).toFixed(1)}" y="${(top-14).toFixed(1)}" width="${(28+5*(g.fs.length-1)).toFixed(1)}" height="${(28+5*(g.fs.length-1)).toFixed(1)}" fill="transparent"/>${marks}${ld?`<line x1="${(mx+11).toFixed(1)}" y1="${ly.toFixed(1)}" x2="${(lx-3).toFixed(1)}" y2="${ly.toFixed(1)}" stroke="${INK}" stroke-width="0.8"/>`:''}${t(lx,ly+4,String(k),12,600,INK,'start',LAND)}</g>`); });
   
  const km=[100,200,500,1000,2000,5000,10000].filter(m=>m*S<=190).pop()||100, bx=20, by=MH-30;
  o.push(`<rect x="${bx}" y="${by.toFixed(1)}" width="${(km/2*S).toFixed(1)}" height="5" fill="${INK}"/><rect x="${(bx+km/2*S).toFixed(1)}" y="${by.toFixed(1)}" width="${(km/2*S).toFixed(1)}" height="5" fill="#FFFFFF" stroke="${INK}" stroke-width="0.6"/>`+t(bx,by+19,'0',12,400,INK2,'middle',LAND)+t(bx+km*S,by+19,`${km>=1000?km/1000+' km':km+' m'}`,12,400,INK2,'middle',LAND));
  const nx=30, ny=30;     o.push(`<path d="M${nx.toFixed(1)} ${ny-10}l7 18l-14 0z" fill="${INK}"/>`+t(nx,ny+24,'N',12,600,INK,'middle'));
  const svg=`<svg viewBox="0 0 ${MW.toFixed(0)} ${MH.toFixed(0)}" width="100%" style="display:block;max-height:calc(100vh - 290px)" role="img" aria-label="${esc(V.title)}: ${FAC.length} facilities at ${groups.length} places" font-family="IBM Plex Sans, system-ui, sans-serif"><defs><clipPath id="dcm-c${CID}"><rect width="${MW.toFixed(1)}" height="${MH.toFixed(1)}"/></clipPath></defs><g clip-path="url(#dcm-c${CID})">${o.join('')}</g></svg>`;
  const off=M.facilities.filter(f=>!(f.onMap&&f.xy));
  return {svg,groups,off,n:FAC.length,ZN,M,title:V.title}; }

 
function rail(R,cityId){ const item=f=>`<button type="button" class="dcm-li" data-fac="${cityId}:${f.id}" data-dcgo="1"><span class="dcm-nm">${esc(f.name)}</span><span class="dcm-mw">${esc(mwTxt(f))}</span><span class="dcm-st">${esc(STW[f.status]||f.status)}</span></button>`;
  const lg=(typ,lab)=>`<li><svg width="56" height="22" aria-hidden="true">${mark(10,11,typ,true)}${mark(40,11,typ,false)}</svg>${esc(lab)}</li>`;
  return `<ol class="dcm-list">${R.groups.map((g,i)=>`<li><span class="dcm-n">${i+1}</span><div>${g.fs.map(item).join('')}</div></li>`).join('')}</ol>
  <p class="dcm-off">${R.off.length} more are listed outside the city or with no published site; they are not on the map.</p>
  <h4 class="dcm-h">Shape is the type, fill is the status</h4><ul class="dcm-lg">${lg('colocation','Colocation')}${lg('hyperscale / cloud','Hyperscale or cloud')}${lg('enterprise / on-premises','Enterprise, own use')}${lg('telecom exchange','Telecom exchange')}${lg('type not published','Type not published')}</ul>
  <p class="dcm-off">Filled: operating. Open: not yet operating, closed, or status not published.</p>
  <h4 class="dcm-h">Zoning for a data centre</h4><ul class="dcm-lg">${R.ZN[1]?`<li><i style="background:${ZCOL[1]}"></i>Allowed outright</li>`:''}${R.ZN[2]?`<li><i style="background:${ZCOL[2]}"></i>Conditional, with City approval</li>`:''}<li><i style="background:${LAND};border:0.6px solid #C9CDD3"></i>Needs a rezoning (no tint)</li>${cityId==='edm'?'<li class="dcm-note">Direct Control zones (DC1, DC2) depend on each site’s own provisions; left untinted.</li>':''}${R.M.ref?`<li><svg width="56" height="22" aria-hidden="true"><circle cx="10" cy="11" r="8" fill="none" stroke="${INK}" stroke-width="1.8"/><circle cx="10" cy="11" r="2.5" fill="${INK}"/></svg>Reference lot (${esc(R.M.ref.name)})</li>`:''}</ul>`; }

const CSS=`.dcm-list{list-style:none;margin:0;padding:0}.dcm-list>li{display:flex;gap:10px;padding:4px 0}.dcm-n{font-weight:600;font-size:12px;width:18px;flex:0 0 18px;padding-top:3px}.dcm-list>li>div{flex:1}
.dcm-li{display:grid;grid-template-columns:1fr auto;gap:0 10px;width:100%;text-align:left;background:none;border:0;padding:3px 0;cursor:pointer;font:inherit}.dcm-li:hover .dcm-nm,.dcm-li:focus .dcm-nm{text-decoration:underline}
.dcm-nm{font-weight:600;font-size:12.5px;color:#1E2A47}.dcm-mw{font-size:12px;color:#4A5672;text-align:right}.dcm-st{font-size:12px;color:#6B7590;grid-column:1}
.dcm-off{font-size:12px;color:#6B7590;margin:10px 0}.dcm-h{font-size:13px;font-weight:600;margin:14px 0 6px;color:#1E2A47}.dcm-lg{list-style:none;margin:0;padding:0}.dcm-lg li{display:flex;align-items:center;gap:8px;font-size:12px;color:#1E2A47;padding:3px 0}
.dcm-lg i{display:inline-block;width:22px;height:14px}.dcm-lg .dcm-note{color:#4A5672;display:block}.dcm-src{font-size:12px;color:#6B7590;margin:8px 0 0}
.f1c-key2:has(.dcm-list)>h4{display:none}.f1c-key2 .dcm-list>li{display:flex;align-items:flex-start;padding:3px 0;margin:0;border:0}.f1c-key2 .dcm-li{line-height:1.3;padding:2px 0;margin:0}.f1c-key2 .dcm-lg li{padding:2px 0;margin:0;border:0}`;
function css(){ if(document.getElementById('dcm-css')) return; const s=document.createElement('style'); s.id='dcm-css'; s.textContent=CSS; document.head.appendChild(s); }
 
if(!window.__dcmGo){ window.__dcmGo=true; document.addEventListener('click',e=>{ const g=e.target.closest&&e.target.closest('[data-dcgo]'); if(!g) return; setTimeout(()=>{ const bs=[...document.querySelectorAll('#f1v .f1v-strip button')], b=bs.find(x=>/What it is/.test(x.textContent)); if(b) b.click(); },60); },true);
  document.addEventListener('keydown',e=>{ if(e.key!=='Enter'&&e.key!==' ') return; const g=e.target.closest&&e.target.closest('g[data-dcgo]'); if(g){ e.preventDefault(); g.dispatchEvent(new MouseEvent('click',{bubbles:true})); } }); }
 
(function wire(n){ const C=BD.f1cards, s0=C&&C.get&&C.get('resident','Find a data centre'); if(!s0){ if((n||0)<100) setTimeout(()=>wire((n||0)+1),100); return; }
  C.add('resident','Find a data centre',{chip:s0.chip,async build(x){ const r=await s0.build(x); let R=null; try{ R=await city(x.city); }catch(e){ console.warn('dcmap',e); } if(!R) return r; css();
    return Object.assign({},r,{draw:`<figure class="dcm" style="margin:0">${R.svg}<figcaption class="dcm-src">${esc(R.M.sources)} ${esc(R.M.licence)}</figcaption></figure>`,
      lead:`${R.n} listed facilities with a published site in the city, at ${R.groups.length} places. Pick one to see its building and what it says it does.`,
      hero:[],rows:[],meters:[],keyHtml:rail(R,x.city),key:null}); }}); })();
BD.f1dcmap={city,rail,css,mwTxt};
})();

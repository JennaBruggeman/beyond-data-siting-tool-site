 
(function(){
'use strict';
const BD=window.BD=window.BD||{};
const INK='#1E2A47', INK2='#4A5672', INK3='#6B7590', DC='#3D5185', LAND='#F0F1F4';
const USE={'shops and food':['#C9DDC9','Shops and food'],'offices and business':['#D5DCEA','Offices and business'],'schools, health, community':['#D6C9E0','Schools, health, community'],'homes':['#F1E4C4','Homes'],'other':['#E8E2D2','Other'],'not recorded':['#DCDFE4','No source']};
const ORDER=['shops and food','offices and business','schools, health, community','homes','other','not recorded'];
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const J={}; const get=u=>J[u]||(J[u]=fetch((BD.ASSET_BASE||'')+u).then(r=>r.ok?r.json():null).catch(()=>null));
const nice=n=>String(n).split(/\s+/).filter(w=>!/^(EASTBOUND|WESTBOUND|NORTHBOUND|SOUTHBOUND)$/.test(w)).map(w=>/^(N|S|E|W|NW|SW|NE|SE)$/.test(w)?w:w==='AV'?'Ave':w==='ST'?'St':/^\d+[A-Z]?(ST|ND|RD|TH)$/.test(w)?w.slice(0,-2)+w.slice(-2).toLowerCase():/^\d+[A-Z]?$/.test(w)?w:w.charAt(0)+w.slice(1).toLowerCase()).join(' ');
async function uses(fid,cityId){
  const D=await get(`f1/dc/ctx/${fid}.json`); if(!D||!D.buildings) return null;
  const ST=await get(`streets_${cityId}.json`), R=230, W=760, H=760, k=W/(2*R), c=D.point;
  const P=(x,y)=>[W/2+x*k, H/2-y*k], ring=r=>{ let d=''; for(let i=0;i+1<r.length;i+=2){ const p=P(r[i],r[i+1]); d+=(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1); } return d+'Z'; };
  const o=[`<rect width="${W}" height="${H}" fill="#FFFFFF"/>`, `<circle cx="${W/2}" cy="${H/2}" r="${(D.radius||200)*k}" fill="${LAND}"/>`];
   
  const WM={'Residential':14,'Collector':16,'Secondary Arterial':18,'Arterial':22,'Lane':6,'Local':12,'Alley':6,'Road':14}; const lab=new Map();
  if(ST&&ST.segs){ const cls=ST.classes; const byW={};
    ST.segs.forEach((s,i)=>{ const w=WM[cls[s[0]]]; if(!w) return; let near=false; for(let j=2;j+1<s.length;j+=2) if(Math.abs(s[j]-c[0])<R*1.4&&Math.abs(s[j+1]-c[1])<R*1.4){ near=true; break; } if(!near) return;
      let d=''; for(let j=2;j+1<s.length;j+=2){ const p=P(s[j]-c[0],s[j+1]-c[1]); d+=(j>2?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1); } (byW[w]=byW[w]||[]).push(d);
      const ni=ST.nameOf&&ST.nameOf[i]; if(ni!=null&&ni>=0&&w>=12){ for(let j=2;j+3<s.length;j+=2){ const a=P(s[j]-c[0],s[j+1]-c[1]), b=P(s[j+2]-c[0],s[j+3]-c[1]), L=Math.hypot(b[0]-a[0],b[1]-a[1]), m=[(a[0]+b[0])/2,(a[1]+b[1])/2];
        if(m[0]<40||m[0]>W-40||m[1]<40||m[1]>H-40) continue; const cur=lab.get(ni); if(!cur||L>cur.L) lab.set(ni,{L,m,ang:Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI}); } } });
    for(const w of Object.keys(byW).sort((a,b)=>a-b)) o.push(`<path d="${byW[w].join('')}" fill="none" stroke="#FFFFFF" stroke-width="${(w*k).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/>`); }
   
  const defs=ORDER.map(u=>`<pattern id="dcp-h-${u.replace(/\W+/g,'')}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#FFFFFF"/><line x1="0" y1="0" x2="0" y2="6" stroke="${(USE[u]||USE.other)[0]}" stroke-width="3"/></pattern>`).join('');
  const cnt={rec:{},zon:{}}; let fac='';
  for(const b of D.buildings){ if(b.d>(D.radius||200)+30) continue; if(b.facility){ fac+=`<path d="${ring(b.ring)}" fill="${DC}" stroke="#FFFFFF" stroke-width="0.8"/>`; continue; }
    const u=USE[b.use]?b.use:'other', zoned=b.useSource==='zoning', none=b.use==='not recorded'||!b.useSource; (zoned?cnt.zon:cnt.rec)[none?'not recorded':u]=((zoned?cnt.zon:cnt.rec)[none?'not recorded':u]||0)+1;
    o.push(`<path d="${ring(b.ring)}" fill="${none?USE['not recorded'][0]:zoned?`url(#dcp-h-${u.replace(/\W+/g,'')})`:USE[u][0]}" stroke="#FFFFFF" stroke-width="0.6"/>`); }
  o.push(fac);
  o.push(`<circle cx="${W/2}" cy="${H/2}" r="${(D.radius||200)*k}" fill="none" stroke="${INK3}" stroke-width="1" stroke-dasharray="5 4"/>`);
  const placedL=[]; for(const [ni,l] of lab){ if(placedL.some(q=>Math.hypot(q[0]-l.m[0],q[1]-l.m[1])<90)) continue; placedL.push(l.m); let a=l.ang;     if(a>90) a-=180; if(a<-90) a+=180; o.push(`<text x="${l.m[0].toFixed(1)}" y="${(l.m[1]+4).toFixed(1)}" font-size="12" fill="${INK2}" text-anchor="middle" stroke="#FFFFFF" stroke-width="3" paint-order="stroke" transform="rotate(${a.toFixed(1)} ${l.m[0].toFixed(1)} ${l.m[1].toFixed(1)})">${esc(nice(ST.names[ni]))}</text>`); }
   
  o.push(`<path d="M${W-40} ${22}l7 18l-14 0z" fill="${INK}"/><text x="${W-40}" y="${58}" font-size="12" font-weight="600" fill="${INK}" text-anchor="middle">North</text>`);
  o.push(`<rect x="24" y="${H-34}" width="${(25*k).toFixed(1)}" height="5" fill="${INK}"/><rect x="${(24+25*k).toFixed(1)}" y="${H-34}" width="${(25*k).toFixed(1)}" height="5" fill="#FFFFFF" stroke="${INK}" stroke-width="0.6"/><text x="24" y="${H-14}" font-size="12" fill="${INK2}" text-anchor="middle">0</text><text x="${(24+50*k).toFixed(1)}" y="${H-14}" font-size="12" fill="${INK2}" text-anchor="middle">50 m</text>`);
  const svg=`<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;max-height:calc(100vh - 340px)" role="img" aria-label="${esc(D.name)} and what is at street level within ${D.radius||200} m" font-family="IBM Plex Sans, system-ui, sans-serif"><defs>${defs}</defs>${o.join('')}</svg>`;
  const S=D.useShare||{}; const row=u=>{ const r=cnt.rec[u]||0, z=cnt.zon[u]||0; if(!r&&!z) return ''; return `<tr><td>${r?`<i style="background:${USE[u][0]}"></i>${r}`:''}</td><td>${z?`<i style="background:repeating-linear-gradient(45deg,${USE[u][0]} 0 3px,#fff 3px 6px)"></i>${z}`:''}</td><td>${esc(USE[u][1])}</td></tr>`; };
  const box=`<div class="dcp-box"><h4>What’s at street level</h4><p class="dcp-s"><b>${Math.round(S.recorded||0)} % recorded, ${Math.round(S.zoned||0)} % from zoning, ${Math.round(S.none||0)} % no source</b></p><p class="dcp-n">Recorded: shop, office and public-place points (OpenStreetMap) and City business licences inside each outline. Zoned for: the City zone, a permission, not a recorded use.</p><table><tr><th>recorded</th><th>zoned for</th><th></th></tr>${ORDER.map(row).join('')}</table></div>`;
  const src=`Street map. Footprints: Canada Structures (Public Safety Canada, OGL-Canada), including data from OpenStreetMap contributors and Microsoft. Heights: ${cityId==='van'?'City of Vancouver LiDAR 2022 (OGL-Vancouver), else Canada Structures':'City of Edmonton 3D buildings and rooflines (OGL-Edmonton), else Canada Structures'}. Uses: OpenStreetMap contributors (ODbL) and City business licences (recorded); City zoning (zoned for); use classes our reading.`;
  return {svg,box,src,name:D.name}; }
const CSS=`.dcp{position:relative}.dcp-box{position:absolute;right:8px;bottom:8px;background:#fff;border:1px solid #D9DDE3;padding:12px 14px;max-width:310px;font-size:12px;color:#1E2A47}
.dcp-box h4{margin:0 0 4px;font-size:13px}.dcp-s{margin:0 0 4px}.dcp-n{margin:0 0 6px;color:#4A5672}.dcp-box table{border-collapse:collapse;font-size:12px;line-height:1.35}.dcp-box th{white-space:nowrap}.dcp-box h4{font-size:13px}.dcp-box p{font-size:12px}.dcp-box th,.dcp-box td{font-size:12px}.dcp-box th{font-weight:400;color:#4A5672;text-align:left;padding:2px 10px 2px 0}
.dcp-box td{padding:2px 10px 2px 0}.dcp-box td i{display:inline-block;width:22px;height:12px;margin-right:6px;vertical-align:-1px}.dcp-src{font-size:12px;color:#6B7590;margin:8px 0 0}
.f1c-key2:has(.dcp-axo)>h4{display:none}.dcp-axo svg{max-width:100%;min-width:0!important;height:auto}.dcp-axo,.dcp-axo *{text-align:left!important}.dcp-axo figcaption,.dcp-axo .f1-cap,.dcp-axo p{font-size:12px;color:#6B7590}`;
(function wire(n){ const C=BD.f1cards, s0=C&&C.get&&C.get('resident','What it is'); if(!s0){ if((n||0)<100) setTimeout(()=>wire((n||0)+1),100); return; }
  C.add('resident','What it is',{chip:s0.chip,async build(x){ const r=await s0.build(x); const id=BD.f1res&&BD.f1res.pick&&BD.f1res.pick[x.city]; if(!id) return r; let U=null; try{ U=await uses(id,x.city); }catch(e){ console.warn('dcpanel',e); } if(!U) return r;
    if(!document.getElementById('dcp-css')){ const s=document.createElement('style'); s.id='dcp-css'; s.textContent=CSS; document.head.appendChild(s); }
    return Object.assign({},r,{draw:`<div class="dcp">${U.svg}${U.box}</div><p class="dcp-src">${esc(U.src)}</p>`,keyHtml:`<div class="dcp-axo">${r.draw||''}</div>${r.keyHtml||''}`,src:[].concat(r.src||[],[U.src])}); }}); })();
BD.f1dcpanel={uses};
})();

 
(function(){
const BD=window.BD=window.BD||{};
 
const AB=()=>BD.ASSET_BASE||'';
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const n0=v=>Math.round(+v||0).toLocaleString('en-CA');
const tc=s=>String(s||'').toLowerCase().replace(/\b([a-z])/g,(m,a)=>a.toUpperCase()).replace(/(\d)(St|Nd|Rd|Th)\b/g,(m,a,b)=>a+b.toLowerCase());
const INK='#1E2A47', INK2='#4A5672', MUTE='#8A94AA', LINE='#C9CED8', BASE='#F3F4F6', BLD='#DADDE3';
const R=260, W=400, H=400;    
let SITE=null, ABOUT=null, PRINT=false;    

 
const FAM=z=>{ z=String(z||''); if(/^(RS|RT|RM|FM|R1|R-|RA)/.test(z)) return 'res'; if(/^C-|^C\d|^FC/.test(z)) return 'com'; if(/^I-|^IC|^M-|^MC|^I\d/.test(z)) return 'ind'; if(/^CD/.test(z)) return 'cd'; return 'oth'; };
const FAMC={res:'#EADFC3',com:'#C8DCCF',ind:'#C3CAD6',cd:'#E2E2E2',oth:'#EEEEEE'}, FAMN={res:'Residential',com:'Commercial',ind:'Industrial',cd:'Comprehensive development (CD-1)',oth:'Other or no zone'};
const NOISE={quiet:'#5E7F6C',intermediate:'#A9BDB1',activity:'#E2EAE4'}    , NOISEN={quiet:'Quiet',intermediate:'Intermediate',activity:'Activity'};
const ramp=(t,a,b)=>{ const A=parseInt(a.slice(1),16), B=parseInt(b.slice(1),16); return '#'+[16,8,0].map(s=>Math.round(((A>>s)&255)+(((B>>s)&255)-((A>>s)&255))*t).toString(16).padStart(2,'0')).join(''); };
 
const UORD=['h','s','o','i','p','x'], UCLS={h:'Homes',s:'Shops and food',o:'Offices and business',i:'Industry and warehouses',p:'Schools, health, community',x:'Other'}, UCOL={h:'#EADFC3',s:'#C8DCCF',o:'#D5DCEA',i:'#ABA59C',p:'#CFC4DA',x:'#E4E0D8'}, UNONE='#D3D7DE';
let USES=null, SHARE=null; const lvl=(u,sr)=>!u||u==='u'||!sr||sr==='-'?'none':sr==='z'?'zon':'rec';
const PEOPLE=v=>ramp(Math.min(1,v/60),'#F1F3F7','#3D5185');    
const HEIGHT=h=>ramp(Math.min(1,(h||0)/40),'#E6E8EC','#4A5672');

async function tilesFor(c){ const m=(BD.S&&BD.S.meta&&BD.S.meta.van)||await BD.getJSON('tiles/van/meta.json'); const T=m.T, have=new Set((m.tiles||[]).map(t=>t[0]+'_'+t[1])), keys=[];
  for(let i=Math.floor((c[0]-R-60)/T);i<=Math.floor((c[0]+R+60)/T);i++) for(let j=Math.floor((c[1]-R-60)/T);j<=Math.floor((c[1]+R+60)/T);j++) if(have.has(i+'_'+j)) keys.push(i+'_'+j);
  const ts=(await Promise.all(keys.map(k=>BD.loadTile('van',k).catch(()=>null)))).filter(Boolean); return ts; }

function frame(c){ const bb=[c[0]-R,c[1]-R,c[0]+R,c[1]+R], s=W/(2*R); return {bb,P:(x,y)=>[(x-bb[0])*s,(bb[3]-y)*s]}; }
const ring=(r,P)=>{ let d=''; for(let i=0;i<r.length;i+=2){ const [x,y]=P(r[i],r[i+1]); d+=(i?'L':'M')+x.toFixed(1)+' '+y.toFixed(1); } return d+'Z'; };

function maps(S,tiles){ const F=frame(S.c), P=F.P, hit=b=>!(b[2]<F.bb[0]||b[0]>F.bb[2]||b[3]<F.bb[1]||b[1]>F.bb[3]);
  const PI=Object.fromEntries(S.P.map(p=>[p.id,p])), BI=Object.fromEntries(S.B.map(b=>[b.id,b]));
  const USEOF=id=>{ const b=id&&BI[id], o=b&&b.osm&&b.osm.length?b.osm:null; return o?o.slice(0,3).map(x=>{ const t=String(x[0]).split('=').pop().replace(/_/g,' '); return t.charAt(0).toUpperCase()+t.slice(1).toLowerCase()+(x[1]?': '+x[1]:''); }).join('; ')+' · OpenStreetMap':'No named use recorded'; };    
  const par=[], bld=[]; let selfR=null;
  for(const t of tiles){ (t.par||[]).forEach((p,n)=>{ if(!p.bb||!hit(p.bb)) return; const id=PI[p.id]?p.id:(PI['~'+t.key+':'+n]?'~'+t.key+':'+n:null); par.push({d:ring(p.r,P),id,self:p.id===S.lot}); if(p.id===S.lot) selfR=p.r; });
    (t.bld||[]).forEach((b,n)=>{ const bb=[Math.min(...b.r.filter((v,i)=>!(i%2))),Math.min(...b.r.filter((v,i)=>i%2)),Math.max(...b.r.filter((v,i)=>!(i%2))),Math.max(...b.r.filter((v,i)=>i%2))]; if(!hit(bb)) return; const id=t.key+':'+n, UT=USES&&USES.tiles&&USES.tiles[t.key], u=UT&&UT.u?UT.u[n]:null, sr=UT&&UT.s?UT.s[n]:null; bld.push({d:ring(b.r,P),id:BI[id]?id:null,c:P(b.c[0],b.c[1]),u,sr,lv:lvl(u,sr)}); }); }
   
  const lotPts=[]; if(selfR) for(let i=0;i<selfR.length;i+=2) lotPts.push(P(selfR[i],selfR[i+1]));
  const ST=BD.f1streets?BD.f1streets.svg(S.lot,P,PRINT?{W,H,fs:6,collFs:6,lotPts,max:6,minRun:0.4,cls:'f1m-lab'}:{W,H,fs:6,collFs:21,lotPts,max:6,minRun:0.4}):'';
  const lot=par.filter(p=>p.self).map(p=>`<path d="${p.d}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`).join('');
  const pk=(m,kind,id)=>id?` data-pk="${m}|${kind}|${esc(id)}" style="cursor:pointer"`:'';
  const svg=(m,body,label)=>`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}" data-map data-map-city="van" data-map-bb="${F.bb.join(',')}" data-map-frame="${W},${H},0" data-map-detail="labels" data-map-max="8" data-site-map="${m}"><rect x="0" y="0" width="${W}" height="${H}" fill="${BASE}"/>${body}${lot}${ST}</svg>`;
   
  const cells=S.cells.map(([i,j,v])=>{ const a=P(i*100,(j+1)*100), b=P((i+1)*100,j*100); return `<rect x="${a[0].toFixed(1)}" y="${a[1].toFixed(1)}" width="${(b[0]-a[0]).toFixed(1)}" height="${(b[1]-a[1]).toFixed(1)}" fill="${PEOPLE(v)}"/>`; }).join('');
  const m1=svg(1,cells+par.map(p=>`<path d="${p.d}" fill="transparent" stroke="${LINE}" stroke-width=".6"${pk(1,'p',p.id)}/>`).join('')+bld.map(b=>`<path d="${b.d}" fill="#fff" fill-opacity=".55" stroke="${MUTE}" stroke-width=".4"/>`).join(''),'People nearby');
   
  const m2=svg(2,par.map(p=>{ const q=PI[p.id]; return `<path d="${p.d}" fill="${q?FAMC[FAM(q.z)]:'#F7F7F8'}" stroke="#fff" stroke-width=".8"${pk(2,'p',p.id)}><title>${esc(q&&q.z?'Zone '+q.z:'Zone not recorded')}</title></path>`; }).join('')+bld.map(b=>`<path d="${b.d}" fill="${BLD}" fill-opacity=".7" stroke="${MUTE}" stroke-width=".35"${pk(2,'b',b.id)}><title>${esc(USEOF(b.id))}</title></path>`).join('')
    +S.B.filter(b=>b.osm&&b.osm.length).map(b=>{ const [x,y]=P(b.c[0],b.c[1]); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="${INK}" stroke="#fff" stroke-width=".8"${pk(2,'b',b.id)}><title>${esc(USEOF(b.id))}</title></circle>`; }).join(''),'Zoning and what nearby buildings are used for');
   
  const uid='s2u'+Math.random().toString(36).slice(2,6), CNT={rec:{},zon:{},none:0};
  const udefs=`<defs>${UORD.map(k=>`<pattern id="${uid}${k}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#FFFFFF"/><line x1="0" y1="0" x2="0" y2="5" stroke="${UCOL[k]==='#ABA59C'?'#8F887E':UCOL[k]}" stroke-width="2.4"/></pattern>`).join('')}</defs>`;
  const ub=bld.map(b=>{ const k=UCLS[b.u]?b.u:'x'; if(b.lv==='none') CNT.none++; else CNT[b.lv][k]=(CNT[b.lv][k]||0)+1; const fill=b.lv==='none'?UNONE:b.lv==='rec'?UCOL[k]:`url(#${uid}${k})`, t=b.lv==='none'?'No use recorded and no zone class':`${UCLS[k]}: ${b.lv==='rec'?'recorded (OpenStreetMap or a City business licence)':'zoned for (the City zone; a permission, not a recorded use)'}`;
    return `<path d="${b.d}" fill="${fill}" stroke="#fff" stroke-width=".5"${pk(2,'b',b.id)}><title>${esc(t)}</title></path>`; }).join('');
  const m2u=svg(2,udefs+par.map(p=>`<path d="${p.d}" fill="#F7F7F8" stroke="${LINE}" stroke-width=".5"${pk(2,'p',p.id)}/>`).join('')+ub,'What is at street level around the lot');
  maps.CNT=CNT;
   
  const hid='s2h'+Math.random().toString(36).slice(2,6);
  const m3=svg(3,`<defs><pattern id="${hid}" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="4" fill="#EEF0F2"/><line x1="0" y1="0" x2="0" y2="4" stroke="#C9CDD3" stroke-width="1"/></pattern></defs>`+par.map(p=>`<path d="${p.d}" fill="none" stroke="${LINE}" stroke-width=".6"/>`).join('')+bld.map(b=>{ const q=b.id&&BI[b.id], h=q&&q.q&&!q.self?HBAND((q.q[0]+q.q[1])/2):-1;
    return `<path d="${b.d}" fill="${h<0?`url(#${hid})`:HRAMP[h]}" stroke="#fff" stroke-width=".4"${pk(3,'b',b.id)}><title>${esc((USEOF(b.id)==='No named use recorded'?'Use not named':USEOF(b.id).replace(/ · OpenStreetMap$/,''))+' · '+(h<0?'no heat estimate':'heat demand '+HLAB[h]+' MWh a year (estimate)'))}</title></path>`; }).join(''),'Heat demand a year, estimated');
   
  const m4=svg(4,par.map(p=>{ const q=PI[p.id]; return `<path d="${p.d}" fill="${q&&q.nc?NOISE[q.nc]:'#F7F7F8'}" stroke="#fff" stroke-width=".8"${pk(4,'p',p.id)}/>`; }).join('')+bld.map(b=>`<path d="${b.d}" fill="none" stroke="${MUTE}" stroke-width=".35"/>`).join(''),'Noise limits at nearby buildings');
  return [m1,{u:m2u,z:m2},m3,m4]; }

const key=(c,t)=>`<span class="s2-k"><i style="background:${c}"></i>${esc(t)}</span>`;
const KEYS=[
  ()=>[key(PEOPLE(5),'few'),key(PEOPLE(30),''),key(PEOPLE(60),'60+ people a hectare')].join('')+'<span class="s2-n">2021 census, spread evenly over each area: an estimate</span>',
  ()=>{ const C=maps.CNT||{rec:{},zon:{}}, SH=SHARE&&SITE&&SHARE[SITE.lot], hz=k=>`repeating-linear-gradient(45deg,${k==='i'?'#8F887E':UCOL[k]} 0 2.5px,#fff 2.5px 5px)`;
    const rows=UORD.filter(k=>C.rec[k]||C.zon[k]).map(k=>`<tr><td>${C.rec[k]?`<i style="background:${UCOL[k]}"></i>${C.rec[k]}`:''}</td><td>${C.zon[k]?`<i style="background:${hz(k)}"></i>${C.zon[k]}`:''}</td><td>${esc(UCLS[k])}</td></tr>`).join('')+(C.none?`<tr><td><i style="background:${UNONE}"></i>${C.none}</td><td></td><td>No source</td></tr>`:'');
    return `<div class="s2-u"><b class="s2-ut">What’s at street level</b>${SH?`<span class="s2-us">${Math.round(SH[1])} % recorded, ${Math.round(SH[1]+SH[2])-Math.round(SH[1])} % from zoning <span>(${n0(SH[0])} buildings within 300 m)</span></span>`:''}<span class="s2-n">Recorded: shop, office and public-place points (OpenStreetMap) and City business licences inside each outline. Zoned for: the City zone, a permission, not a recorded use.</span><table class="s2-ut2"><tr><th>recorded</th><th>zoned for</th><th>buildings on this map</th></tr>${rows}</table></div><div class="s2-z">${Object.keys(FAMC).map(k=>key(FAMC[k],FAMN[k])).join('')}<span class="s2-k"><svg width="10" height="10"><circle cx="5" cy="5" r="3" fill="${INK}"/></svg>a named use (OpenStreetMap)</span></div>`; },
  ()=>'<span class="s2-n" style="width:100%">Heat demand a year (estimate)</span>'+HRAMP.map((c,i)=>key(c,HLAB[i]+' MWh')).join('')+`<span class="s2-k"><svg width="10" height="10"><rect width="10" height="10" fill="#EEF0F2"/><path d="M0,10L10,0M-2,4L4,-2M6,12L12,6" stroke="#C9CDD3"/></svg>no estimate</span>`,
  ()=>Object.keys(NOISE).map(k=>key(NOISE[k],NOISEN[k])).join('')+'<span class="s2-n">receiving class under the Noise Control By-law</span>'];
const TITLES=['People nearby','Zoning and use','Heat demand','Noise limits'];
 
const HRAMP=['#F9CFE3','#F3A2C8','#EC6FAB','#E5338F','#A3155F'], HEDGE=[100,250,500,1000], HLAB=['under 100','100–250','250–500','500–1,000','1,000 or more'], HBAND=v=>{ let i=0; while(i<HEDGE.length&&v>=HEDGE[i]) i++; return i; };

function panel(m,kind,id){ const S=SITE; if(!S) return; const box=document.querySelector('#f1v [data-s2-panel]'); if(!box) return;
  const p=kind==='p'?S.P.find(q=>q.id===id):null, b=kind==='b'?S.B.find(q=>q.id===id):null, par=p||(b&&S.P.find(q=>q.id===b.p));
  const L=ABOUT&&ABOUT.layers||{}, rows=[]; const where=par&&par.ad?tc(par.ad):(b?'A building':'A parcel');
  if(m===1){ rows.push(['People in its 100 m cell',par&&par.ppl!=null?`${n0(par.ppl)} (people a hectare)`:'not known']); rows.push(['Within 250 m of the lot',`${n0(S.pop)} people`]); rows.push(['Source','Statistics Canada, Census of Population 2021, spread over 100 m cells by the tool']); rows.push(['Note','An estimate: each census area’s count spread evenly over its area.']); }
  if(m===2){ rows.push(['Zone',par?`${par.z||'?'}${par.zc?' ('+par.zc+')':''}`:'?']);
    const osm=[].concat((b&&b.osm)||[],(par&&par.osm)||[]); rows.push(['Use (OpenStreetMap)',osm.length?osm.map(o=>tc(String(o[0]).replace(/_/g,' '))+(o[1]?': '+o[1]:'')).join('; '):'none recorded']);
    if(par&&par.lic) rows.push(['Business licences (City, 2026)',Object.entries(par.lic).map(([k,v])=>`${k} ${v}`).join('; ')]);
    rows.push(['Source','City of Vancouver Open Data (parcels and zoning, business licences 2026); © OpenStreetMap contributors']); }
  if(m===3){ if(!b){ rows.push(['','Click a building.']); } else { rows.push(['Height',b.h!=null?`${b.h} m (${b.hf===0?'City footprint 2009':'LiDAR 2022'})`:'not measured']); rows.push(['Storeys',`${b.st}${b.ste?' (assumed)':''}, height ÷ 3.5 m`]); rows.push(['Floor area',`${n0(b.gfa)} m² (footprint × storeys)`]);
    rows.push(['Heat demand',b.q?`${n0(b.q[0])}–${n0(b.q[1])} MWh a year (estimate${b.qp?'; industrial: warehousing intensity as a proxy':''})`:'no estimate (zone has no sourced intensity)']); if(b.qm!=null) rows.push(['Measured (City energy report)',`${n0(b.qm)} MWh a year`]);
    rows.push(['Source','City of Vancouver LiDAR 2022 and building footprints; heat from floor area × NRCan energy use intensity by use (BC, 2023), an estimate']); } }
  if(m===4){ const q=S.P.find(z=>z.id===(par&&par.id)); rows.push(['Receiving class',par&&par.nc?NOISEN[par.nc]:'no zoning record']); if(q&&q.sec!=='self') rows.push(['Limit from this lot',`${q.ni} dBA at night, ${q.dy} dBA by day (s. ${q.sec}${q.sec==='u'?': no zoning record, the looser limit':''})`]); if(q&&q.sec==='self') rows.push(['','This is the lot itself.']);
    rows.push(['This lot as a noise source',`${tc(S.src)} (s. ${S.srcSec})`]); rows.push(['Source','City of Vancouver Noise Control By-law 6555 (receiving class from the parcel’s zone)']); }
  box.innerHTML=`<p class="s2-ph"><b>${esc(TITLES[m-1])}</b> · ${esc(where)}</p><dl>${rows.filter(r=>r[1]).map(r=>`<dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd>`).join('')}</dl>`; }

function reset(){ document.querySelectorAll('#f1v [data-site-map]').forEach(s=>{ const w=s.closest('.f1m-wrap'), b=w&&w.querySelector('[data-z="home"]'); if(b) b.click(); }); }

const CSS=`.s2{display:flex;flex-direction:column;gap:10px} .s2-top{display:flex;align-items:center;gap:12px;flex-wrap:wrap} .s2-top p{margin:0;font-size:13px;color:${INK2}} .s2-reset{font:inherit;font-size:13px;padding:5px 14px;border:1px solid ${INK};border-radius:999px;background:#fff;color:${INK};cursor:pointer}
.s2-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px} .s2-m h3{margin:0 0 4px;font-size:13px;font-weight:600;color:${INK}} .s2-m [data-site-map]{display:block;width:100%;height:auto;border:1px solid #E3E6EC} .s2-k svg{flex:none;width:auto;height:auto}
.s2-keys{display:flex;flex-wrap:wrap;gap:3px 10px;margin-top:5px;font-size:12px;color:${INK2}} .s2-k{display:inline-flex;align-items:center;gap:5px} .s2-k i{width:10px;height:10px;border-radius:2px;display:block;border:1px solid rgba(30,42,71,.15)} .s2-n{color:#5E6782;flex-basis:100%}
.s2-panel{border-top:1px solid #E3E6EC;padding-top:8px;font-size:13px;color:${INK2};min-height:60px} .s2-ph{margin:0 0 4px;color:${INK}} .s2-panel dl{display:grid;grid-template-columns:200px 1fr;gap:3px 12px;margin:0} .s2-panel dt{color:#5E6782} .s2-panel dd{margin:0}
.s2-src{font-size:12px;color:#5E6782;margin:0}
.s2-hd{display:flex;align-items:center;justify-content:space-between;gap:6px;margin:0 0 4px} .s2-hd h3{margin:0} .s2-tg{display:inline-flex;gap:3px;margin:-4px 0} .s2-tg button{font:inherit;font-size:12px;padding:1px 9px;border:1px solid ${INK};border-radius:999px;background:#fff;color:${INK};cursor:pointer} .s2-tg button[aria-pressed="true"]{background:${INK};color:#fff}
.s2-m[data-v="u"] .s2-vz,.s2-m[data-v="u"] .s2-z,.s2-m[data-v="z"] .s2-vu,.s2-m[data-v="z"] .s2-u{display:none} .s2-z{display:flex;flex-wrap:wrap;gap:3px 10px}
.s2-u{display:flex;flex-direction:column;gap:3px;width:100%} .s2-ut{color:${INK};font-size:13px} .s2-us{color:${INK};font-weight:600} .s2-us span{font-weight:400;color:#5E6782} .s2-ut2{border-collapse:collapse;font-size:12px} .s2-ut2 th{font-weight:400;color:#5E6782;text-align:left;padding:0 10px 1px 0;white-space:nowrap} .s2-ut2 td{padding:1px 10px 1px 0;white-space:nowrap} .s2-ut2 td:last-child,.s2-ut2 th:last-child{white-space:normal;padding-right:0} .s2-ut2 i{display:inline-block;width:10px;height:10px;border-radius:2px;border:1px solid rgba(30,42,71,.15);margin-right:4px;vertical-align:-1px}
@media (max-width:1100px){ .s2-grid{grid-template-columns:repeat(2,minmax(0,1fr))} } @media (max-width:560px){ .s2-grid{grid-template-columns:minmax(0,1fr)} .s2-panel dl{grid-template-columns:1fr} }`;

async function build(x,o){ PRINT=!!(o&&o.print);
  if(!document.getElementById('s2-css')){ const st=document.createElement('style'); st.id='s2-css'; st.textContent=CSS; document.head.appendChild(st); }
  if(x.city!=='van') return {draw:'<p class="f1v-empty">Around the lot covers Vancouver lots only.</p>',lead:'The lot’s surroundings: shown for Vancouver lots.'};
  const id=x.sel&&String(x.sel.id); let S=null; try{ const r=await fetch(`${AB()}f1/site/van_${id}.json`); S=r.ok?await r.json():null; }catch(e){}
  if(!S) return {draw:'<p class="f1v-empty">No site data for this lot yet.</p>',lead:'The lot’s surroundings on four maps.'};
  if(!ABOUT){ try{ ABOUT=await (await fetch(AB()+'f1/site/about_van.json')).json(); }catch(e){ ABOUT={}; } }
  if(!USES){ try{ USES=await (await fetch(AB()+'data/uses_van.json')).json(); }catch(e){ USES={}; } }    
  if(!SHARE){ try{ SHARE=(await (await fetch(AB()+'data/uses_share_van.json')).json()).share||{}; }catch(e){ SHARE={}; } }
  SITE=S; const tiles=await tilesFor(S.c); if(BD.f1streets) await BD.f1streets.load(); const M=maps(S,tiles);
  const draw=`<div class="s2"><div class="s2-top"><p>The lot (outlined) and about 250 m around it. Hover over a building to see what’s in it (shops, restaurants and other named uses from OpenStreetMap); click a parcel or building for its facts. Drag or zoom any map; Reset puts all four back.</p><button type="button" class="s2-reset" onclick="BD.f1site2.reset()">Reset all four</button></div>
   <div class="s2-grid" onclick="const t=event.target.closest('[data-pk]'); if(t){ const [m,k,i]=t.dataset.pk.split('|'); BD.f1site2.panel(+m,k,i); }">${M.map((svg,i)=>typeof svg==='string'?`<figure class="s2-m" style="margin:0"><h3>${i+1} · ${TITLES[i]}</h3>${svg}<div class="s2-keys">${KEYS[i]()}</div></figure>`:`<figure class="s2-m" style="margin:0" data-v="u"><div class="s2-hd"><h3>${i+1} · ${TITLES[i]}</h3>${PRINT?'':`<div class="s2-tg" role="group" aria-label="Map view"><button type="button" aria-pressed="true" onclick="BD.f1site2.view(this,'u')">Uses</button><button type="button" aria-pressed="false" onclick="BD.f1site2.view(this,'z')">Zoning</button></div>`}</div><div class="s2-vu">${svg.u}</div>${PRINT?'':`<div class="s2-vz">${svg.z}</div>`}<div class="s2-keys">${PRINT?KEYS[i]().replace(/<div class="s2-z">[\s\S]*$/,''):KEYS[i]()}</div></figure>`).join('')}</div>
   <div class="s2-panel" data-s2-panel><p class="s2-ph">Click a parcel or building on any map.</p></div>
   <p class="s2-src">Base: City of Vancouver Open Data (parcels, building footprints, LiDAR 2022), Open Government Licence – Vancouver. People: Statistics Canada, 2021 Census. Uses: © OpenStreetMap contributors (ODbL) and City of Vancouver business licences 2026 (OGL-Vancouver), recorded; zoned for: City of Vancouver zoning, zone to class our reading. Noise: City of Vancouver Noise Control By-law 6555. Heat: an estimate from floor area and the zone’s use (NRCan intensities).</p></div>`;
  const near=S.P.filter(p=>p.id!==S.lot), cls={}; for(const p of near) if(p.nc) cls[p.nc]=(cls[p.nc]||0)+1;
  const heat=S.B.filter(b=>b.q&&!b.self).reduce((a,b)=>[a[0]+b.q[0],a[1]+b.q[1]],[0,0]);
  return {draw,lead:'What is around the lot: who lives nearby, what the buildings are used for, how tall they are and how much heat they need, and the noise limits next door.',
    rows:[['People within 250 m',`${n0(S.pop)} (estimate)`],['Parcels within 250 m',n0(near.length)],['Quiet / intermediate / activity',`${cls.quiet||0} / ${cls.intermediate||0} / ${cls.activity||0} parcels`],['Heat demand nearby',`${n0(heat[0])}–${n0(heat[1])} MWh a year (estimate)`]],
    src:['Code’s site layers for this lot (21 Nov 2026): '+String(ABOUT.rules||'').replace(/,?\s*no Edmonton or Al[t]alis data/i,'').replace(/\bAl[t]alis\b/gi,'licensed')]}; }    

function view(btn,v){ const f=btn.closest('.s2-m'); if(!f) return; f.dataset.v=v; f.querySelectorAll('.s2-tg button').forEach(b=>b.setAttribute('aria-pressed',String(b.textContent===(v==='u'?'Uses':'Zoning')))); }
BD.f1site2={build,panel,reset,view};
})();

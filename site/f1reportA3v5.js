 
(function(){
const BD=window.BD=window.BD||{};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const INK='#1E2A47', INK2='#4A5672', MUTE='#6B7590', RULE='#E3E6EC', AMBER='#8A3B00';
const T=`font-size:15px;line-height:1.5;color:${INK}`;
const get=async f=>{ try{ const r=await fetch((BD.ASSET_BASE||'')+f); return r.ok?await r.json():null; }catch(e){ return null; } };

 
const DEFS=[
 ['The parts of the building',[
  ['Data hall','The room that holds the servers. Its floor area sets the size of the data centre in MW.'],
  ['Data-centre support','Rooms that run the data centre, such as electrical and battery rooms, cooling equipment rooms, staff rooms and storage.'],
  ['Data-centre circulation','Corridors on the data-centre side, behind the security line.'],
  ['Data-centre stairs and lifts','Fire-rated stair and lift cores that serve only the data-centre side.'],
  ['Flexible shell (data-centre side)','Floor on the data-centre side that the layout does not need yet. It is built as an empty shell for later use.'],
  ['Public program','The rooms the public comes for, such as the spa hall, the clinic or the greenhouse.'],
  ['Public support','Rooms that serve the public program: change rooms, washrooms, storage, staff and plant rooms for the public part.'],
  ['Public circulation, stairs and lifts','Lobbies, corridors and the fire-rated stair and lift cores of the public part.'],
  ['Loading','The loading dock and its bays, where trucks deliver to the data centre.'],
  ['Plant and plant yard','Outdoor equipment (generators, chillers, transformers) and the open yard at grade that holds it.'],
  ['Truck court and drive','The paved area where trucks turn and back up to the dock, and the drive that joins it to the street or lane.'],
  ['Security line','Where data-centre circulation meets the public part. Only staff cross it.'],
  ['Fire separation (2 h)','A wall or floor rated to hold back fire for two hours. It runs between the public part and the data centre, and round every stair and lift.']]],
 ['Sizes and measures',[
  ['MW of servers','The electrical load of the servers at full use (the IT load), in megawatts. The tool sets it from the data hall’s floor area (see Assumptions).'],
  ['PUE','Power usage effectiveness: all the power the building draws, divided by the power the servers use. 1.5 means half as much again goes to cooling and losses.'],
  ['Zone stage','The layout as zones: areas with outlines and floor areas, before any room is designed. Every figure in this report is at the zone stage.'],
  ['Storey','One floor of the building. Storey 1 is at street level.'],
  ['Height limit','The tallest the building may be under the zoning: outright, or higher with the City’s approval.'],
  ['Upper bound','The most a figure could be. The real value is lower and not yet known.']]],
 ['Check results',[
  ['Pass','The rule is met.'],
  ['Tight','The rule is met with little margin.'],
  ['Flag','Worth a look at a later design stage. Not a failure.'],
  ['Fail','The rule is not met.'],
  ['Not checked at zone stage','The rule needs rooms, doors or corridors that a zone layout does not have yet.'],
  ['Did not apply','The rule is about something this layout does not have, such as a sky room.']]]];
function definitions(){ const sec=([h,rows])=>`<section style="margin:0 0 22px"><h3 style="margin:0 0 8px;font-size:19px;font-weight:600">${esc(h)}</h3>${rows.map(([t,d])=>`<div style="display:block;padding:5px 0;border-top:1px solid ${RULE}"><div style="font-weight:600">${esc(t)}</div><div style="margin:2px 0 0;color:${INK2}">${esc(d)}</div></div>`).join('')}</section>`;
  return `<div style="width:100%;align-self:flex-start;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:56px;font-size:14px;line-height:1.42;color:${INK}"><div>${sec(DEFS[0])}</div><div>${sec(DEFS[1])}${sec(DEFS[2])}</div></div>`; }

 
const MAPSRC=['People: Statistics Canada, Census of Population 2021, spread over 100 m cells by the tool (an estimate). Base: City of Vancouver Open Data (parcels, building footprints), Open Government Licence – Vancouver.',
 'Buildings: City of Vancouver Open Data (Open Government Licence – Vancouver). Uses: © OpenStreetMap contributors (ODbL) and City of Vancouver business licences 2026 (Open Government Licence – Vancouver), recorded; zoned for: City of Vancouver zoning, zone to class our reading.',
 'Heat: an estimate from floor area (City of Vancouver LiDAR 2022 and building footprints) × NRCan energy use intensity by use (BC, 2023).',
 'Noise: City of Vancouver Noise Control By-law 6555, receiving classes. Base: City of Vancouver Open Data (Open Government Licence – Vancouver).'];
const MAPCAP=['How many people live within about 250 m of the lot.','What is at street level around the lot: a recorded use (solid) where a shop, office or public place is recorded, the zone’s use (hatched) where nothing is.','How much heat the buildings around the lot use in a year: the neighbours who could take the data centre’s heat.','The noise limit each neighbour sets for the data centre’s plant.'];
function mapPages(html){ if(!html) return []; const d=document.createElement('div'); d.innerHTML=html; const ms=[...d.querySelectorAll('.s2-m')]; if(ms.length<2) return [];
  return ms.slice(0,4).map((m,i)=>{ const h=m.querySelector('h3'); const t=h?h.textContent.replace(/^\s*\d+\s*·\s*/,'').trim():`Layer ${i+1}`; if(h) h.remove();
    return {sec:t,hero:`<div class="a3draw a3maps a3map1 a3mapi${i}" style="width:100%">${m.outerHTML}</div>`,cap:MAPCAP[i]||'',src:(MAPSRC[i]||'')+(BD.f1streets?' '+BD.f1streets.SRC:'')}; }); }

 
const SAY=[
 [/^2 h line between public and data centre/i,'A 2-hour fire separation is drawn between the public part and the data centre'],
 [/^Nothing wet over the data hall/i,'Nothing wet sits over the data hall'],
 [/^No pool, spa or therapy room under the data hall/i,'No pool, spa or therapy room sits under the data hall (wet support rooms may)'],
 [/^Upper public part: two stairs and a lift/i,'The upper public floor has two stairs and a lift'],
 [/^Every upper room stands on the storey below/i,'Every room above grade stands on the storey below'],
 [/^Loading spaces vs Parking By-law 6059/i,'Enough loading spaces for the floor area'],
 [/^Truck court access to a street or lane/i,'The truck court reaches a street or lane'],
 [/^Library admission: at least 3 storeys/i,'The building has at least 3 storeys'],
 [/^unassigned zone/i,'No floor is left unassigned'],
 [/^Sky rooms have nothing above/i,'Sky rooms have nothing above them'],
 [/^Rooms kept apart from the data hall/i,'Rooms that must be kept apart from the data hall are'],
 [/^Chemical stores not under or over data-centre rooms/i,'Chemical stores are not under or over data-centre rooms'],
 [/^On this lot: at least 30 % of the zone FAR/i,'The layout uses at least 30 % of the zone’s floor area ratio'],
 [/^Exit opens onto the truck drive or court/i,'An exit opens onto the truck drive or court'],
 [/^Exterior stair discharges apart/i,'Exterior stairs come out apart from each other'],
 [/^Two exits from every zone/i,'Every zone has two ways out'],
 [/^Exits apart/i,'Exits are far enough apart']];
const say=n=>{ const s=String(n||'').replace(/\s*\[check [^\]]*\]/gi,''); for(const [re,t] of SAY) if(re.test(s)) return t; return s.charAt(0).toUpperCase()+s.slice(1); };
const SRCW=s=>{ s=String(s||''); let m=s.match(/^stack (R\d+)$/i); if(m) return `the tool’s stacking rule ${m[1]}`; if(s==='export') return 'the layout record'; if(s==='self-review') return 'the layout record (compact-fill review)'; if(s==='engine') return 'the tool’s own check'; return BD.f1cards&&BD.f1cards.pubFull?BD.f1cards.pubFull(s):s; };    
 
const CODEY=/\b[a-z]+[A-Z]\w*|\w+_\w+|\b(?:wc|ul|uf|xp|pub|dc)\w*\d\w*|\bruling \d|->/;
const NA=[[/^Sky rooms/i,'this layout has no sky rooms'],[/^Rooms kept apart/i,'this layout has no rooms that must be kept apart'],[/^Chemical stores/i,'this layout has no chemical store'],[/30 % of the zone FAR/i,'the zone’s floor area ratio is not regulated or not sourced']];
const plainD=r=>{ if(r.status==='n/a'){ for(const [re,t] of NA) if(re.test(r.name)) return t; return ''; } const d=String(r.detail||''); return CODEY.test(d)?'':d; };
const BYLAW=r=>/Parking By-law 6059/i.test(r.name)?'City of Vancouver Parking By-law 6059, s. 5.2.5':/Bylaw 20001/i.test(r.name)?'City of Edmonton Zoning Bylaw 20001, Table 7.2':null;
const NOROWS={exits:'Exit stairs: the layout record has no result for their number and spacing yet.',corridors:'Corridor widths: set when rooms and corridors are drawn, a later design stage.',room:'Room-level rules: they need rooms, and the layout is zones only.'};
function checks(ch){ const G=ch.checks||{}, P=[], F=[], X=[], NA=[], N=[];
  for(const [k,g] of Object.entries(G)){ const rows=g.rows||[];
    if(!rows.length){ if(k!=='dd') N.push(NOROWS[k]||`${g.label||k}: no result in the layout record.`); continue; }
    if(k==='room'){ N.push(NOROWS.room+` (${rows.length} in the layout record, not judged.)`); continue; }
    for(const r of rows){ const PF_=t=>BD.f1cards&&BD.f1cards.pubFull?BD.f1cards.pubFull(String(t||"")):t, row={t:PF_(say(r.name)),d:PF_(plainD(r)),s:BYLAW(r)||SRCW(r.src),st:r.status};
      if(r.status==='pass'||r.status==='tight') P.push(row); else if(r.status==='flag') F.push(row); else if(r.status==='fail') X.push(row); else if(r.status==='n/a') NA.push(row); else if(k==='dd') N.push(`${row.t}: decided at a later design stage.`); else N.push(`${row.t}: ${r.status==='?'?'the data is missing':'not judged'}.`); } }
  const PB_=t=>BD.f1cards&&BD.f1cards.pubFull?BD.f1cards.pubFull(String(t||'')):String(t||'');    
  const li=(r,word)=>`<li style="padding:5px 0;border-top:1px solid ${RULE};line-height:1.4"><div>${esc(PB_(r.t))}${word?`: <b style="font-weight:600${r.st==='fail'?`;color:${AMBER}`:''}">${word}</b>`:''}${r.st==='tight'?' (with little margin)':''}.</div>${r.d?`<div style="color:${INK2};font-size:13px">${esc(PB_(r.d))}</div>`:''}${r.s?`<div style="color:${MUTE};font-size:12.5px">Source: ${esc(r.s)}</div>`:''}</li>`;
  const col=(h,n,body)=>`<section style="break-inside:avoid"><h3 style="margin:0 0 4px;font-size:20px;font-weight:600">${h} <span style="color:${MUTE};font-weight:400">${n}</span></h3><ul style="list-style:none;margin:0 0 20px;padding:0">${body}</ul></section>`;
  const html=`<div style="width:100%;align-self:flex-start;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:36px;${T}">`
   +`<div>${X.length?col(`<span style="color:${AMBER}">Fails</span>`,X.length,X.map(r=>li(r,'fails')).join('')):''}${col('Passed',P.length,P.map(r=>li(r,'passes')).join(''))}</div>`
   +`<div>${col('Flagged for a later stage',F.length,F.length?F.map(r=>li(r,'')).join(''):`<li style="padding:8px 0;border-top:1px solid ${RULE};color:${INK2}">Nothing flagged.</li>`)}</div>`
   +`<div>${col('Not checked at zone stage',N.length,N.map(t=>`<li style="padding:8px 0;border-top:1px solid ${RULE}">${esc(t)}</li>`).join(''))}${NA.length?`<h4 style="margin:6px 0 4px;font-size:16px;font-weight:600">Did not apply to this layout <span style="color:${MUTE};font-weight:400">${NA.length}</span></h4><ul style="list-style:none;margin:0;padding:0">${NA.map(r=>`<li style="padding:6px 0;border-top:1px solid ${RULE};font-size:14px">${esc(r.t)}<span style="color:${INK2}">: ${esc(r.d)}</span></li>`).join('')}</ul>`:''}</div></div>`;
  return {html,counts:{pass:P.length,flag:F.length,fail:X.length,notChecked:N.length,na:NA.length}}; }

 
const OPEN=[
 ['City of Vancouver Open Data: property parcels and building footprints','Open Government Licence – Vancouver','The lot outline, the site plan and every map’s base',['Site plan','The four layers stacked','People nearby','Zoning and use','Heat demand','Noise limits']],
 ['City of Vancouver LiDAR 2022','Open Government Licence – Vancouver','Neighbour heights on the title page; floor areas behind the heat estimate',['Heat demand']],
 ['Statistics Canada, Census of Population 2021','Statistics Canada Open Licence','People nearby, spread over 100 m cells by the tool',['People nearby']],
 ['City of Vancouver Open Data: zoning districts; business licences 2026','Open Government Licence – Vancouver','Zoning and named uses',['Zoning and use']],
 ['OpenStreetMap contributors','Open Database Licence (ODbL)','Named uses around the lot',['Zoning and use']],
 ['City of Vancouver Open Data: Public streets','Open Government Licence – Vancouver','Street names on the maps',['People nearby','Zoning and use','Heat demand','Noise limits','Heat nearby']],
 ['NRCan energy use intensity by building use (BC, 2023)','cited only','Heat demand estimate (floor area × intensity)',['Heat demand']]];
const RULES=[
 [/Parking By-law No\. 6059, Section 5/i,'Loading spaces counted from the floor area (Class B, s. 5.2.5)',['Checks']],
 [/Noise Control By-law 6555/i,'Receiving classes on the noise map',['Noise limits']],
 [/Zoning and Development By-law 3575, Section 2/i,'Definitions behind the zoning checks and height limit',['Section','Section A','Section B','Checks']],
 [/I-3 District Schedule, ss\. 3\.1\.2\.1 and 3\.1\.2\.10/i,'Height limit: outright, and higher with the City’s approval (Code 23au)',['Section','Section A','Section B','Checks']],
 [/district schedules, s\. 2\.1, s\. 2\.2\.7/i,'Uses and storey heights',['Section','Section A','Section B','Checks']]];
async function sources(pageOf){ const S=await get('data/sources_public.json'), A=await get('data/assumptions_public.json'); const L=(S&&S.sources)||[];
  const pg=secs=>secs.map(s=>pageOf(s)).filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join(', ');
  const tr=(a,b,c,d)=>`<tr><td style="padding:4px 10px 7px 0;border-top:1px solid ${RULE};vertical-align:top">${a}</td><td style="padding:4px 10px;border-top:1px solid ${RULE};vertical-align:top;color:${INK2}">${b}</td><td style="padding:4px 10px;border-top:1px solid ${RULE};vertical-align:top;color:${INK2}">${c}</td><td style="padding:4px 0 7px 10px;border-top:1px solid ${RULE};vertical-align:top;color:${MUTE};white-space:nowrap">${d}</td></tr>`;
  const head=(a,b,c,d)=>`<tr style="font-size:13px;color:${MUTE};text-align:left"><th style="font-weight:400;padding:0 10px 4px 0">${a}</th><th style="font-weight:400;padding:0 10px 4px">${b}</th><th style="font-weight:400;padding:0 10px 4px">${c}</th><th style="font-weight:400;padding:0 0 4px 10px">${d}</th></tr>`;
  const LIC=l=>/^cited only/i.test(l||'')?'cited only':(l||'');
  const rules=RULES.map(([re,used,secs])=>{ const s=L.find(x=>re.test(x.citation)); return s?tr(esc(s.citation),esc(LIC(s.licence)),esc(used),pg(secs)):''; }).join('');
  const ids=[...new Set(((A&&A.assumptions)||[]).flatMap(a=>Array.isArray(a.source)?a.source.map(s=>s.id):[]))];
  const AS=((A&&A.assumptions)||[]).filter(a=>!/cap was dropped|2,325/i.test(String(a.value)+a.what)), uses=id=>AS.filter(a=>Array.isArray(a.source)&&a.source.some(x=>x.id===id)).map(a=>a.what).join('; ');
  const res=ids.map(id=>L.find(x=>x.id===id)).filter(Boolean).filter(s=>uses(s.id)).map(s=>`<tr><td style="padding:4px 10px 4px 0;border-top:1px solid ${RULE};vertical-align:top;width:52%">${esc(s.citation)}</td><td style="padding:4px 10px;border-top:1px solid ${RULE};vertical-align:top;color:${INK2}">${esc(uses(s.id))}</td><td style="padding:4px 0 4px 10px;border-top:1px solid ${RULE};vertical-align:top;color:${MUTE};white-space:nowrap">${pg(['Assumptions','Assumptions, continued','Assumptions, continued (3)'])}</td></tr>`).join('');
  const tab=(h,body,c3)=>`<h3 style="margin:0 0 6px;font-size:19px;font-weight:600">${h}</h3><table style="width:100%;border-collapse:collapse;margin:0 0 22px;font-size:13.5px;line-height:1.4">${head('Source','Licence',c3,'Pages')}${body}</table>`;
  const foot=`<p style="margin:0;font-size:13px;color:${MUTE}">The full list of ${S?Number(S.n).toLocaleString('en-CA'):'the'} sources the tool uses is on the Sources page of the tool. “Cited only”: the publisher keeps all rights; the report quotes or summarizes it.</p>`;
  const wrap=h=>`<div style="width:100%;align-self:flex-start;${T}">${h}</div>`;
  return [wrap(tab('Open data in the maps and drawings',OPEN.map(([a,b,c,d])=>tr(esc(a),esc(b),esc(c),pg(d))).join(''),'Used for')+tab('By-laws and clauses',rules,'Used for')+foot)].concat(res?[wrap(`<h3 style="margin:0 0 6px;font-size:19px;font-weight:600">Research and industry figures behind the assumptions <span style="font-weight:400;color:${MUTE};font-size:15px">all cited only</span></h3><table style="width:100%;border-collapse:collapse;font-size:13.5px;line-height:1.4"><tr style="font-size:13px;color:${MUTE};text-align:left"><th style="font-weight:400;padding:0 10px 4px 0">Source</th><th style="font-weight:400;padding:0 10px 4px">Behind</th><th style="font-weight:400;padding:0 0 4px 10px">Pages</th></tr>${res}</table>`)]:[]); }    

 
async function assumptions(city){ const A=await get('data/assumptions_public.json'); const L=((A&&A.assumptions)||[]).filter(a=>!/cap was dropped|2,325/i.test(String(a.value)+a.what))
    .filter(a=>!city||!(city==='edm'?/\bVancouver\b/:/\bEdmonton\b/).test(String(a.what)));        
  if(!L.length) return '';
   
  L.forEach((a,i)=>{ if(/^Flood construction level/i.test(String(a.what))&&/CGVD28/.test(String(a.value))) L[i]=Object.assign({},a,{value:String(a.value).split('4.6 m (CGVD28, the regional datum)').join('flood construction level 4.6 m (GVRD datum)')}); });
  const unit=a=>{ const u=a.unit; if(!u||u==='None'||u==='null') return ''; if(/[A-Za-z%]/.test(String(a.value).replace(/\b(to|or|and)\b/g,''))) return '';     return String(a.value).trim().endsWith(' '+u)||String(a.value).trim().endsWith(u)?'':' '+u; };
  const PW=t=>(BD.f1cards&&BD.f1cards.pub?BD.f1cards.pub(String(t||'')):String(t||'')).replace(/kept-plan/g,'kept-layout');    
   
  const KEY=t=>String(t||'').toLowerCase().replace(/city of vancouver|city of edmonton|\b(19|20)\d\d\b|read directly/g,'').replace(/[^a-z0-9]+/g,'');
  const who=a=>{ if(typeof a.source==='string') return esc(PW(a.basis||a.source)); const seen=[KEY(a.basis)]; const cs=[]; for(const c of a.source){ const k=KEY(c.citation); if(!k||seen.some(z=>z.includes(k))) continue; seen.push(k); cs.push(String(c.citation).trim()); }
    const b=String(a.basis||'').trim().replace(/[.;,\s]+$/,''); return esc(PW((b?b+(cs.length?'. ':'.'):'')+cs.join(' ')).replace(/\.\s*\./g,'.').replace(/\.\s*,\s*/g,'. ').replace(/^\s*,\s*/,'')); };    
   
  const len=a=>String(a.what).length+String(a.value).length+String(a.usedFor).length+(typeof a.source==='string'?String(a.basis||a.source).length:String(a.basis||'').length+a.source.map(x=>x.citation).join(' ').length);
  const MAX=3600, tot=L.reduce((t,a)=>t+len(a)+120,0), LIM=tot/Math.ceil(tot/MAX)+200, parts=[]; let cur=[], n=0;     for(const a of L){ const l=len(a)+120; if(cur.length&&n+l>LIM){ parts.push(cur); cur=[]; n=0; } cur.push(a); n+=l; } if(cur.length) parts.push(cur);
  return parts.map((L,pi)=>`<div style="width:100%;align-self:flex-start;${T}"><table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.45"><tr style="font-size:13px;color:${MUTE};text-align:left"><th style="font-weight:400;padding:0 10px 4px 0;width:22%">Assumption</th><th style="font-weight:400;padding:0 10px 4px;width:18%">Value</th><th style="font-weight:400;padding:0 10px 4px;width:22%">Where it is used</th><th style="font-weight:400;padding:0 10px 4px">Basis and source</th><th style="font-weight:400;padding:0 0 4px 10px">Trust</th></tr>${L.map(a=>`<tr><td style="padding:7px 10px 7px 0;border-top:1px solid ${RULE};vertical-align:top;font-weight:600">${esc((BD.f1cards&&BD.f1cards.pub?BD.f1cards.pub(String(a.what||'')).replace(/kept-plan/g,'kept-layout'):a.what))}</td><td style="padding:7px 10px;border-top:1px solid ${RULE};vertical-align:top">${esc((BD.f1cards&&BD.f1cards.pub?BD.f1cards.pub(String(a.value||'')).replace(/kept-plan/g,'kept-layout'):a.value))}${esc(unit(a))}</td><td style="padding:7px 10px;border-top:1px solid ${RULE};vertical-align:top;color:${INK2}">${esc(BD.f1cards&&BD.f1cards.pub?BD.f1cards.pub(a.usedFor):a.usedFor)}</td><td style="padding:7px 10px;border-top:1px solid ${RULE};vertical-align:top;color:${INK2}">${who(a)}</td><td style="padding:7px 0 7px 10px;border-top:1px solid ${RULE};vertical-align:top;color:${MUTE}">${a.trust==null?'project rule':a.trust}</td></tr>`).join('')}</table><p style="margin:12px 0 0;font-size:13px;color:${MUTE}">Trust, 0–100: 100 arithmetic; 90 a code, by-law, tariff or standard read directly; 80 a government dataset; 70 a peer-reviewed figure from another context; 60 derived with a stated assumption; 50 an operator or maker claim; 40 a proxy; 20 judged; 0 not known. Every part of the tool, not only these, is in the project register.</p></div>`); }

 
async function withSimplifications(city){ const pages=await assumptions(city), P=(Array.isArray(pages)?pages:[pages]).filter(Boolean); const A=await get('data/assumptions_public.json');
  const PW=t=>(BD.f1cards&&BD.f1cards.pub?BD.f1cards.pub(String(t||'')):String(t||''));
  const srcT=v=>Array.isArray(v)?v.map(c=>typeof c==='string'?(/^our reading.?$/i.test(c.trim())?'Our reading.':c):(c&&c.citation)||'').filter(Boolean).join(' '):String(v||'').replace(/^our reading$/i,'Our reading.');
  const SIM=((A&&A.simplifications)||[]).map(x=>typeof x==='string'?{t:x}:{w:x.what||'',t:x.text||x.line||'',src:srcT(x.source||x.src),city:x.city}).filter(x=>x.t&&(!x.city||!city||x.city===city));
  if(SIM.length) P.push(`<div style="width:100%;align-self:flex-start"><h3 style="font-size:20px;font-weight:600;margin:0 0 12px">What the tool simplifies</h3><ul style="margin:0;padding-left:1.2em;font-size:15px;line-height:1.5">${SIM.map(x=>`<li style="margin:0 0 10px">${x.w?`<b>${esc(PW(x.w))}.</b> `:''}${esc(PW(x.t))}${x.src?` <span style="color:${MUTE};font-size:13px">${esc(PW(x.src))}</span>`:''}</li>`).join('')}</ul></div>`);
  return P; }
BD.f1a3v5={definitions,mapPages,checks,sources,assumptions:withSimplifications};
})();

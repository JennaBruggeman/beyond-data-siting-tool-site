 
(function(){
const BD=window.BD=window.BD||{};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 
const FIRM={code:['A building code or bylaw','code'],sourced:['A published figure','sourced'],rule:['A design rule we set','rule'],assumption:['An assumption, labelled on the card','assume'],derived:['Our arithmetic from published figures','derived'],open:['Open data from the City','data'],todo:['Source still being checked','todo'],notyet:['Not checked by the tool yet','todo']};
const P=(q,value,source,firm,note)=>({q,value,source,firm,note});
const STEPS=[
 {n:0,mark:'In',t:'Before the steps: what the tool starts from',lead:'Every check uses two things: the lot, and the kind of building being tested on it.',pieces:[
   P('Where on the lot can the building go?','The lot outline, less the required setbacks','City of Vancouver lot data and the zoning rules','code'),
   P('Which sides face a street or lane?','Read from the lot and street maps','City open data','open'),
   P('What zone is the lot in?','I-2, I-3, I-1C, FC-2 (tested); M-2, C-3A, C-2A (added)','Vancouver Zoning and Development By-law','code'),
   P('Is the lot in a flood area?','The level the ground floor must sit above','City floodplain data','open'),
   P('Is the lot in a district heating area?','Shown as a note only','The area map is not in the tool yet','todo'),
   P('What does this kind of building hold?','Its rooms, their sizes, its server power and its stacking rules','Each building type’s own list (the tool calls a building type a typology)','rule'),
   P('What did you choose?','Security, building density, rack density','Your filters','rule')]},
 {n:1,t:'Does the zoning allow it?',lead:'The building has to fit the lot and stay inside the zone’s limits.',pieces:[
   P('Is a data centre allowed in this zone?','With the City’s approval in I-2, I-3, I-1C and FC-2; a rezoning in M-2, C-3A and C-2A','The zone’s rules','code','A needed approval is flagged, not failed.'),
   P('Is the building under the height limit?','The zone’s maximum height','The zone’s rules','code'),
   P('Is the total floor area under the zone’s limit?','The zone’s floor-area limit (3 to 5 times the lot in the tested zones)','The zone’s rules','code'),
   P('Does it stay back from the lot lines?','The zone’s setbacks','The zone’s rules','code'),
   P('Is the building tall enough to be worth it?','At least 3 storeys','A design rule we set (19 Nov)','rule'),
   P('Does it use enough of what the zone allows?','At least 30 % of the floor area the zone allows on that lot','A design rule we set (19 Nov)','rule'),
   P('How much of the floor is public space?','Shown on each layout as a share; not passed or failed','The layout’s own zones','derived')]},
 {n:2,t:'How big is the server room?',lead:'The server room’s size comes from how much power it holds and how much each rack of servers uses.',pieces:[
   P('How much power does the data centre hold?','Fixed for each layout (339 1st Ave E: 1.76 MW)','The typology and the checked layout','rule'),
   P('How much power does one rack use, normally?','7.1 to 8 kW','Uptime Institute survey, 2024','sourced'),
   P('And in a dense, liquid-cooled room?','30 kW (the low end of 30 to 60 kW)','Bryden Wood, 2025','sourced','The 30 kW level is still to be confirmed.'),
   P('How much floor does a rack need, with its aisles?','2.32 m² a rack, about 290 to 330 m² for each MW at normal density','Schneider Electric White Paper 46, and our arithmetic','derived'),
   P('How much room does liquid cooling need?','About 2.7 m² for each MW, plus one spare unit','Trane equipment manual, and our arithmetic','derived'),
   P('How much heat does the cooling plant give off?','About 1.55 times the server power','Source still being checked','todo'),
   P('How much of the servers’ heat can be caught?','57 to 75 % measured; 70 to 90 % claimed by industry','Lawrence Berkeley National Laboratory; Tetra Tech 2024','sourced')]},
 {n:3,t:'Can the floors stack this way?',lead:'Some spaces can’t sit on top of others.',pieces:[
   P('Does every upper floor sit on the floor below?','Nothing hangs over open ground','A design rule we set (19 Nov)','rule'),
   P('Is the building a solid shape, with no holes or notches?','Upper floors fill the outline','A design rule we set (20 Nov)','rule','The one exception: if filling a hole would break a zone limit, the hole stays and the layout is flagged for a person to decide.'),
   P('Is anything built above a pool or a greenhouse?','Not allowed','A design rule we set (19 Nov)','rule'),
   P('Are pool chemicals kept away from the servers?','Never above or below a server room','A design rule we set (17 Nov)','rule'),
   P('Is there any room with water (pools, showers, washrooms) above the servers?','Not allowed','A design rule written into each building type','rule'),
   P('Are the stairs and lifts (elevators) outside the server room?','Preferred, not required: if they can’t be, the layout is flagged, not turned down','A design rule we set (20 Nov)','rule'),
   P('In a pool building, are the wet side (pools, change rooms) and the dry side (desk, offices) apart?','On opposite sides of the public corridor; first aid can be on either','A design rule we set (20 Nov)','rule')]},
 {n:4,t:'Is it safe in a fire, and can people get out?',lead:'The fire-rated walls and the ways out are checked for each zone of the building.',pieces:[
   P('Is there a fire-rated wall between the public side and the servers?','A 2-hour fire-rated wall','Source still being checked','todo'),
   P('Is each exit stair walled off from fire?','Yes, for every exit stair','National Building Code, exits (clause still being checked)','todo'),
   P('Are different uses walled off from each other where needed?','For example a clinic and a hall, or pool chemicals','National Building Code (clause still being checked)','todo'),
   P('Are there enough ways out?','At least 2 stairs where required','National Building Code (clause still being checked)','todo'),
   P('Is every spot close enough to an exit?','A walking limit for each use (339 1st Ave E passes)','National Building Code (limits still being checked)','todo'),
   P('Does the corridor reach every part and every exit?','Yes, all connected','A design rule we set','rule'),
   P('Does each exit lead straight outside?','Never through another room','National Building Code (clause still being checked)','todo'),
   P('Can the fire department reach the front door?','The tool can’t check this yet','National Building Code','notyet')]},
 {n:5,t:'Can trucks deliver and service it?',lead:'A truck has to reach the loading bay from a street, and the generators have to be reachable for service.',pieces:[
   P('Is there a loading bay for a delivery truck?','At least one bay, 10.2 m long, 3.4 m wide, 3.8 m high','Vancouver Parking By-law 6059','code'),
   P('Does the truck yard open onto a street or lane?','Yes, with no dead end','A design rule we set','rule'),
   P('Can the lane count as the truck aisle?','Yes, but those layouts are counted separately','Parking By-law 6059 (our reading)','assumption'),
   P('Are the generators reachable for service?','A 6.1 m wide way','Source still being checked','todo'),
   P('Can deliveries reach the freight lift without crossing public space?','Yes, all connected','A design rule we set','rule'),
   P('Is the freight lift big enough for a rack of servers?','8 m² today, which looks small','A maker’s sheet still to find','todo'),
   P('Can the truck turn in the yard?','The tool can’t check this yet','—','notyet')]},
 {n:6,t:'Is every space given a use?',lead:'No layout may leave floor without a use. Each piece with no use yet gets one, by one test: can the public reach it?',pieces:[
   P('Floor with no use yet that the public can reach?','Becomes flexible community space','A design rule we set (20 Nov)','rule','Only if it reaches public space without crossing the fire-rated wall.'),
   P('Floor with no use yet only on the data-centre side?','Becomes the flexible shell (data-centre side), never public','A design rule we set (20 Nov)','rule'),
   P('Floor with no use yet on a pool’s wet side?','Joins the wet side','A design rule we set (20 Nov)','rule'),
   P('How many people can use the community space?','About 0.95 m² a person, counted for exits too','A published figure (in our register)','sourced'),
   P('Is any floor left without a use?','If so, the layout fails','A design rule we set (20 Nov)','rule')]}];
const WORDS=[['Building type (typology)','A kind of building the data centre is paired with, such as an emergency hub or a community pool'],['Zone','The City’s rules for a lot: what can be built, how tall and how big'],['Rack','A tall cabinet of servers; kW is how much power it uses'],['Server room (data hall)','The room that holds the racks'],['Fire-rated wall','A wall built to stop fire spreading, rated by how many hours it holds. The building code calls it a fire separation'],['Flagged','Allowed for now, but someone must approve or decide'],['Tight','Passes, but only just']];
const RESULTS=[['pass','Pass','Meets the rule'],['tight','Tight','Passes, with little room to spare'],['flag','Flagged','Needs an approval or a decision'],['q','Not checked','The tool can’t check it yet'],['fail','Fail','Breaks the rule: the layout is turned down, and the reason is kept']];
const TAGS=[['Security','Separate entrances, or a shared entrance','Shared if the public and the data centre share a lobby, or a room has doors on both sides of the fire-rated wall between them'],['Building density','High or standard','High at 4 or more storeys, or two server floors'],['Rack density','Existing average about 8 kW (Uptime 2024; 7.1 without the densest sites) or new-build design (about 30 kW; consulting engineer and Bryden Wood 2025)','Set by which version of the layout was run']];
function css(){ if(document.getElementById('f1dc-css')) return; const s=document.createElement('style'); s.id='f1dc-css'; s.textContent=`
 #f1dc{position:fixed;inset:0;z-index:2060;background:#fff;color:var(--bd-ink);font-family:var(--bd-font);font-size:15px;line-height:1.5;overflow:auto}
 #f1dc .in{max-width:860px;margin:0 auto;padding:24px 24px 64px} #f1dc header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--bd-rule);padding:14px 24px;position:sticky;top:0;background:#fff;z-index:2}
 #f1dc header b{font-weight:600} #f1dc .x{font:inherit;font-size:14px;background:none;border:0;color:var(--bd-ink-2);cursor:pointer;text-decoration:underline}
 #f1dc h1{font-size:32px;font-weight:600;margin:12px 0 8px} #f1dc h1:focus{outline:none} #f1dc .ld{font-size:17px;color:var(--bd-ink-2);margin:0 0 24px}
 #f1dc ol.flow{list-style:none;margin:0;padding:0;position:relative} #f1dc ol.flow>li{position:relative;padding-left:52px;margin:0 0 14px}
 #f1dc ol.flow>li:not(:last-child)::before{content:'';position:absolute;left:17px;top:38px;bottom:-14px;border-left:2px solid var(--bd-rule)}
 #f1dc .num{position:absolute;left:11px;top:15px;width:14px;height:14px;border-radius:50%;background:var(--bd-ink)}   /* project decision: a marker, no number */
 #f1dc details{border:1.5px solid var(--bd-rule);border-radius:10px;background:#fff} #f1dc details[open]{border-color:var(--bd-ghost)}
 #f1dc summary{cursor:pointer;padding:12px 16px;list-style:none} #f1dc summary::-webkit-details-marker{display:none} #f1dc summary h2{font-size:19px;font-weight:600;margin:0}
 #f1dc summary p{margin:4px 0 0;color:var(--bd-ink-2);font-size:15px} #f1dc summary .more{font-size:13px;color:var(--bd-ink-3);margin-top:6px}
 #f1dc .pcs{padding:0 16px 14px} #f1dc .pc{border-top:1px solid var(--bd-rule);padding:10px 0;display:grid;grid-template-columns:1fr auto;gap:2px 16px}
 #f1dc .pc .q{font-weight:600} #f1dc .pc .v{grid-column:1;color:var(--bd-ink)} #f1dc .pc .s{grid-column:1;font-size:13px;color:var(--bd-ink-3)} #f1dc .pc .n{grid-column:1;font-size:13px;color:var(--bd-ink-2);font-style:italic}
 #f1dc .firm{grid-column:2;grid-row:1/span 2;align-self:start;font-size:12px;border-radius:999px;padding:3px 10px;white-space:nowrap;border:1.5px solid var(--bd-rule);color:var(--bd-ink-2)}
 #f1dc .firm.code,#f1dc .firm.sourced{border-color:var(--bd-ink);color:var(--bd-ink)} #f1dc .firm.todo{border-style:dashed;color:var(--bd-ink-3)}
 #f1dc .reject{margin:8px 0 28px 52px;padding:12px 16px;border-left:3px solid #8A3B00;background:#FBF1E8} #f1dc h3{font-size:19px;font-weight:600;margin:28px 0 10px}
 #f1dc table{border-collapse:collapse;width:100%;font-size:15px} #f1dc td{padding:8px 10px 8px 0;border-top:1px solid var(--bd-rule);vertical-align:top} #f1dc td:first-child{font-weight:600;width:28%}
 #f1dc .k{display:inline-block;width:12px;height:12px;border-radius:2px;margin-right:8px;vertical-align:-1px;border:1.5px solid var(--bd-ink)} #f1dc .k.tight{background:#E6EBF3} #f1dc .k.flag{background:#D6DEEB} #f1dc .k.q{border-style:dashed} #f1dc .k.fail{border-color:#8A3B00;background:#8A3B00} #f1dc .k.pass{background:var(--bd-ink)}
 #f1dc .fn-h{font-size:22px;font-weight:600;margin:40px 0 6px} #f1dc .foot{margin-top:28px;font-size:13px;color:var(--bd-ink-3)} #f1dc a.lk{color:var(--bd-ink);text-decoration:underline;cursor:pointer}
 @media (max-width:700px){ #f1dc .in{padding:16px 16px 48px} #f1dc h1{font-size:26px} #f1dc ol.flow>li{padding-left:44px} #f1dc .pc{grid-template-columns:1fr} #f1dc .firm{grid-column:1;grid-row:auto;justify-self:start;margin-top:4px} #f1dc .reject{margin-left:0} }`; document.head.appendChild(s); }
function open(stepN){ css(); let W=document.getElementById('f1dc'); if(!W){ W=document.createElement('div'); W.id='f1dc'; W.setAttribute('role','dialog'); W.setAttribute('aria-modal','true'); W.setAttribute('aria-label','How each lot is laid out'); document.body.appendChild(W); }
  const opener=document.activeElement;
  const pc=p=>{ const f=FIRM[p.firm]||FIRM.rule; return `<div class="pc"><div class="q">${esc(p.q)}</div><span class="firm ${f[1]}">${esc(f[0])}</span><div class="v">${esc(p.value)}</div><div class="s">${esc(p.source)}</div>${p.note?`<div class="n">${esc(p.note)}</div>`:''}</div>`; };
  W.innerHTML=`<header><span><button type="button" data-dc="close" style="font:inherit;font-size:14px;background:none;border:0;padding:0;margin-right:14px;color:var(--bd-ink-2,#4A5672);cursor:pointer;text-decoration:underline">Back</button><b>Beyond Data</b></span><button class="x" type="button" data-dc="close">Close</button></header><div class="in">
   <h1 tabindex="-1">How each lot is laid out</h1><div data-fn></div>
   <h2 class="fn-h">The rules, step by step</h2><p class="ld">Every layout in the library went through these six steps, in this order. Open a step to see the questions it asks, the number it uses and where that number comes from.</p>
   <ol class="flow">${STEPS.map(s=>`<li><span class="num" aria-hidden="true"></span><details${s.n===stepN?' open':''}><summary><h2>${esc(s.t)}</h2><p>${esc(s.lead)}</p><div class="more">${s.pieces.length} questions · open</div></summary><div class="pcs">${s.pieces.map(pc).join('')}${LM()?`<p class="foot" style="margin:10px 0 0"><a class="lk" data-dc="lane" data-g="${LANE[s.n]}">See the parts behind this step in the source breakdown</a></p>`:''}</div></details></li>`).join('')}</ol>
   <h3>Words used here</h3><table>${WORDS.map(w=>`<tr><td>${esc(w[0])}</td><td>${esc(w[1])}</td></tr>`).join('')}</table>
   <p class="foot" style="margin-top:10px">Why one particular layout passed: open it in the library; its own list of checks shows each answer.</p>
   <div class="reject"><b>If any step fails, the layout is turned down.</b> The reason is kept, so you can see which rule it broke. A step can also flag a layout instead (for example when the City must approve the use).</div>
   <h3>What each answer means</h3><table>${RESULTS.map(r=>`<tr><td><span class="k ${r[0]}" aria-hidden="true"></span>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')}</table>
   <h3>How the layouts are sorted</h3><table>${TAGS.map(t=>`<tr><td>${esc(t[0])}</td><td>${esc(t[1])}. ${esc(t[2])}.</td></tr>`).join('')}</table>
   <p class="foot">This page explains the rules in plain words. For every number, its full source and how sure it is, see the <a class="lk" data-dc="logic">Source breakdown</a>. Values marked “source still being checked” are not used as facts on the public site.</p></div>`;
  W.querySelector('h1').focus({preventScroll:true});
  if(BD.f1funnel){ BD.f1funnel.html().then(h=>{ const d=W.querySelector('[data-fn]'); if(d&&h) d.innerHTML=h; }).catch(()=>{}); }    
  if(!W._wired){ W._wired=true; W.addEventListener('click',e=>{ const b=e.target.closest('[data-dc]'); if(!b) return; e.preventDefault(); if(b.dataset.dc==='close') close(); if(b.dataset.dc==='logic'){ close(); if(LM()) BD.f1logicmap.open(); else if(BD.f1logic) BD.f1logic.open({tab:'all'}); } if(b.dataset.dc==='lane'){ close(); BD.f1logicmap.open({lane:b.dataset.g}); } });
    document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&document.getElementById('f1dc')) close(); }); }
  W._opener=opener; }
 
const LANE={0:'inputs',1:'zoning',2:'server',3:'stacking',4:'fire',5:'trucks',6:'fill'}, LM=()=>!!(BD.f1logicmap&&BD.f1logicmap.on());
function close(){ const W=document.getElementById('f1dc'); if(!W) return; const o=W._opener; W.remove(); if(o&&o.isConnected&&o.focus) try{ o.focus({preventScroll:true}); }catch(e){} }
function on(){ return !(BD.F1FLAGS&&BD.F1FLAGS.howDecides===false); }
BD.f1decides={open,close,on,STEPS};
})();

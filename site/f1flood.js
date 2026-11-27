 
(function(){
const BD=window.BD=window.BD||{};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let COV=null;
const cov=()=>COV||(COV=fetch('data/coverage_public.json').then(r=>r.ok?r.json():null).catch(()=>null));
const SRC='City of Vancouver, Flood Plain Standards and Requirements (amended 7 March 2023), s. 3.3 and 4.0. Floodplain outline: City of Vancouver Open Data, designated floodplain (file of 26 Nov 2026).';
const SRC_SC='City of Vancouver, Flood Plain Standards and Requirements (amended 7 March 2023): Still Creek’s level is the one shown on the Building By-law’s map for each lot. Floodplain outline: City of Vancouver Open Data, designated floodplain (file of 26 Nov 2026).';
 
const TYP={emergency_hub:'For an Emergency hub this includes the refuge floor.',heat_cascade:'For a heat cascade this includes the spa hall and hot pool.',
  aquaponics:'For aquaponics this includes the fish hall and greenhouse.',conservatory:'For a conservatory this includes the display biome.',
  community_pool:'For a pool or bath this includes the pool plant and hall floor.',warm_bath:'For a pool or bath this includes the pool plant and hall floor.'};
 
const tc=a=>String(a||'').toLowerCase().replace(/\b([a-z])/g,m=>m.toUpperCase()).replace(/\b(\d+)(St|Nd|Rd|Th)\b/g,(m,n,x)=>n+x.toLowerCase());
async function kindOf(sel,C,r){ const K={};
  if(r&&r.kind==='rezoning'){ K.chip='Needs rezoning'; const zn=(/^([A-Z0-9-]+) · /.exec(String(r.label||''))||[])[1]||r.zone||''; K.line=`${zn?`Zone ${zn} does not allow a data centre; `:''}tested as if rezoned to ${r.asIf||'I-2'}.`;
    const fc=r.floodCheck; if(fc===false||/^not run/i.test(String(fc||''))||(fc&&typeof fc==='object'&&fc.ran===false)) K.flood='The flood check did not run on this lot: the tool has no ground heights for it.'; else if(typeof fc==='string'&&fc&&fc!=='ran') K.flood=fc.replace(/\.?$/,'.'); }
  else if(r&&r.kind==='joined'){ const A=(r.pair&&r.pair.addresses)||[]; K.chip='Needs 2 lots joined'; K.line=`${r.label||'Needs 2 lots joined'}${A.length?': '+A.map(tc).join(' + '):''}. Every layout listed fits the two lots as one site.`; }
  else { try{ const I=BD.f1best&&BD.f1best.index?await BD.f1best.index('van'):null, e=I&&I.index&&I.index[String(sel.id)], j=e&&e.joinedSite; if(j){ const P=C&&C.van&&C.van.lots&&C.van.lots[j], A=(P&&P.pair&&P.pair.addresses)||[], Ls=(P&&P.pair&&P.pair.lots)||[], other=A.filter((a,i)=>String(Ls[i])!==String(sel.id));
      K.line=`No layout fits this lot alone. It fits joined with ${other.length?tc(other[0]):'the lot beside it'} (Needs 2 lots joined).`; K.joinedSite=j; } }catch(e){} }
  return K.line?K:null; }
 
async function forLot(sel){ if(!sel||sel.city!=='van') return null; const C=await cov(), r=C&&C.van&&C.van.lots&&C.van.lots[String(sel.id)];
  const K=await kindOf(sel,C,r); const F0=floodOf(r); if(!F0&&!K) return null; return Object.assign(F0||{none:true,line:'',src:''},{kind:K}); }
function floodOf(r){
  if(!r||!r.flood) return null; const f=r.flood;
  if(!f.inFloodplain) return {inside:false,line:'Not in a designated floodplain.',src:'Floodplain outline: City of Vancouver Open Data, designated floodplain (file of 26 Nov 2026).'};
  const still=/still creek/i.test(f.which||'')&&!(+f.fcl_m>0);
  const chip=still?'Floodplain (Still Creek)':'Floodplain (coastal)', body=still?'the ground floor and fixed electrical and plant equipment must sit at or above the flood construction level shown on the City’s map for this lot (not read by the tool).'
    :`the ground floor and fixed electrical and plant equipment must sit at or above the flood construction level ${(+f.fcl_m||4.6).toFixed(1)} m (GVRD datum).`, line=chip+': '+body;
  return {inside:true,still,chip,body,line,wave:f.waveZone?'Wave effect zone: wave run-up may raise the level further.':'',src:still?SRC_SC:SRC}; }
const typLine=(F,typology)=>F&&F.inside&&TYP[typology]||'';
 
function html(F,o){ o=o||{}; if(!F) return ''; const t=typLine(F,o.typology), K=F.kind;
  const kh=K?`<p class="f1-flood f1-kind in">${K.chip?`<span class="f1-flood-chip">${esc(K.chip)}</span> `:''}${esc(K.line)}${K.flood?' '+esc(K.flood):''}</p>`:'';
  if(F.none) return kh;
  return kh+`<p class="f1-flood${F.inside?' in':''}">${F.inside?`<span class="f1-flood-chip">${esc(F.chip)}<span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">:</span></span> ${esc(F.body)}`:esc(F.line)}${F.wave?' '+esc(F.wave):''}${t?' '+esc(t):''}${o.src===false?'':`<span class="f1-flood-src">${esc(F.src)}</span>`}</p>`; }
 
function text(F,typology){ if(!F) return ''; const K=F.kind; return [K&&K.line,K&&K.flood,F.line,F.wave,typLine(F,typology)].filter(Boolean).join(' '); }
const CSS=`.f1-flood{font-size:13px;line-height:1.45;color:var(--bd-ink-2,#4A5672);border-left:2px solid var(--bd-rule,#D6DEEB);padding:2px 0 2px 10px;margin:0 0 14px;max-width:72ch}
.f1-flood.in{color:var(--bd-ink,#1E2A47);border-left-color:var(--bd-ink,#1E2A47)}
.f1-flood-chip{display:inline-block;font-size:12px;font-weight:600;color:var(--bd-ink,#1E2A47);border:1px solid var(--bd-ink,#1E2A47);border-radius:999px;padding:0 8px;margin-right:4px;line-height:18px}
.f1-flood-src{display:block;font-size:12px;color:var(--bd-ink-3,#5E6782);margin-top:2px}`;
(function(){ try{ const s=document.createElement('style'); s.textContent=CSS; document.head.appendChild(s); }catch(e){} })();
BD.f1flood={forLot,typLine,html,text,TYP,kindOf};
})();

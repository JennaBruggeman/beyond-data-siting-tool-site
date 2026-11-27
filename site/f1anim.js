 
(function(){
const BD=window.BD=window.BD||{};
const A=BD.anim=BD.anim||{_reg:{}};
A._reg=A._reg||{}; A.register=function(n,f){ this._reg[n]=f; };
const AB=()=>BD.ASSET_BASE||'';
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const reduced=()=>{ try{ return matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } };
const phone=()=>{ try{ return matchMedia('(max-width:760px)').matches; }catch(e){ return false; } };
const script=src=>new Promise((ok,no)=>{ const s=document.createElement('script'); s.src=src; s.onload=ok; s.onerror=()=>no(new Error('load '+src)); document.head.appendChild(s); });
let THREEP=null; const three=()=>THREEP||(THREEP=window.THREE?Promise.resolve(window.THREE):script('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js').then(()=>window.THREE));
let KITP=null; const kit=()=>KITP||(KITP=BD.kit?Promise.resolve(BD.kit):script(AB()+'kit3d.js').then(()=>BD.kit));
const JS={}; const piece=n=>JS[n]||(JS[n]=A._reg[n]?Promise.resolve(A._reg[n]):script(`${AB()}f1/anim/${n}/${n}.js`).then(()=>A._reg[n]));
const meta=n=>fetch(`${AB()}f1/anim/${n}/${n}.json`).then(r=>r.ok?r.json():null).catch(()=>null);

 
async function slot(el){ const n=el.dataset.anim; if(!n||el.dataset.ready) return; el.dataset.ready='1'; const M=await meta(n)||{}; const S=M.steps||[];
  el.classList.add('an'); el.innerHTML=`<div class="an-stage"><img class="an-still" src="${AB()}f1/anim/${esc(n)}/${esc(n)}_still.png" alt="${esc(M.alt||M.title||'')}" loading="lazy"></div>
    <p class="an-cap" aria-live="polite"></p>
    <ol class="an-list">${S.map(s=>`<li>${esc(s.caption)}</li>`).join('')}</ol>
    <div class="an-bar"><button type="button" class="an-rep" hidden>Replay</button></div>`;
  const live=!reduced()&&!phone(); el.classList.toggle('an-static',!live); if(!live) return;
  const stage=el.querySelector('.an-stage'), cap=el.querySelector('.an-cap'), rep=el.querySelector('.an-rep');
  let P=null, loading=null, vis=false;
  const onStep=(i,s)=>{ const t=(s&&s.caption)||(S[i]&&S[i].caption)||''; if(cap.textContent!==t) cap.textContent=t; };
  const load=()=>loading||(loading=(async()=>{ const [T,K,F]=await Promise.all([three(),kit(),piece(n)]); if(!F) throw new Error('piece '+n+' did not register');
      P=F; stage.querySelector('.an-still').style.display='none'; P.mount(stage,{THREE:T,kit:K,tokens:BD.TOK||{},reduced:false,onStep}); rep.hidden=false; if(S[0]) onStep(0,S[0]); return P; })().catch(e=>{ console.warn('anim',n,e); el.classList.add('an-static'); }));
  rep.addEventListener('click',()=>{ if(P){ P.replay(); } });
  const io=new IntersectionObserver(es=>es.forEach(e=>{ vis=e.intersectionRatio>=0.4; if(vis) load().then(()=>{ if(vis&&P) P.play(); }); else if(P) P.stop(); }),{threshold:[0,0.4]});
  io.observe(el);
   
  const pre=new IntersectionObserver(es=>{ if(es.some(e=>e.isIntersecting)){ pre.disconnect(); three().catch(()=>{}); } },{rootMargin:'600px 0px'}); pre.observe(el); }

function mountAll(root){ (root||document).querySelectorAll('[data-anim]').forEach(el=>{ slot(el).catch(e=>console.warn('anim slot',e)); }); }
const CSS=`.an{margin:0}.an-stage{position:relative;background:var(--bd-ground,#F4F6FA);aspect-ratio:16/9;overflow:hidden}.an-stage canvas{display:block;width:100%!important;height:auto!important}
.an-still{display:block;width:100%;height:100%;object-fit:contain}
.an-cap{font-family:var(--bd-font,"IBM Plex Sans",sans-serif);font-size:23px;line-height:1.35;color:var(--bd-ink,#1E2A47);min-height:2.7em;margin:14px 0 6px;max-width:44ch}
.an-list{display:none;margin:12px 0 0;padding-left:1.4em;font-size:18px;line-height:1.45;color:var(--bd-ink,#1E2A47)}.an-list li{margin:0 0 6px}
.an-static .an-cap,.an-static .an-bar{display:none}.an-static .an-list{display:block}
.an-bar{display:flex;gap:10px}.an-rep{font:inherit;font-size:14px;color:var(--bd-ink,#1E2A47);background:#fff;border:1.5px solid var(--bd-rule,#D6DEEB);border-radius:999px;padding:8px 18px;min-height:40px;cursor:pointer}
@media (max-width:760px){ .an-cap{font-size:18px} }`;
(function(){ try{ const s=document.createElement('style'); s.textContent=CSS; document.head.appendChild(s); }catch(e){} })();
A.mountAll=mountAll; A.slot=slot;
})();

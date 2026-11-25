 
(function(){
'use strict';
const BD=window.BD; const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const KEY='bd-f1-intro', DC='#3268A6', STOP={stop:1};
const reduced=()=>{ try{ return matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } };
let RUN=0, R=null, TXT=null, COUNTS=null, MAPS={}, firstDone=false;
const alive=t=>t===RUN&&R;
const $=s=>document.querySelector(s);

 
const CSS=`
#f1i{position:fixed;inset:0;z-index:2300;font-family:var(--f-font,'IBM Plex Sans',system-ui,sans-serif);color:var(--f-ink,#16181B);font-variant-numeric:tabular-nums;-webkit-font-smoothing:antialiased;transition:opacity .8s}
#f1i *{box-sizing:border-box}
#f1i.out{opacity:0}
#f1i .f1i-bg{position:absolute;inset:0;background:#fff;transition:opacity .6s}
#f1i.clear .f1i-bg{opacity:0}
#f1i .f1i-stage{position:absolute;left:0;right:0;top:64px;bottom:190px;display:flex;align-items:center;justify-content:center;padding:0 64px;transition:opacity .5s}
#f1i.clear .f1i-stage{opacity:0;pointer-events:none}
#f1i .f1i-cap{position:absolute;left:50%;bottom:72px;transform:translateX(-50%);width:min(940px,calc(100% - 32px));text-align:center}
#f1i .f1i-cap p{margin:0;font-size:26px;font-weight:300;line-height:1.35;transition:opacity .45s}
#f1i .f1i-cap p+p{margin-top:10px}
#f1i .f1i-cap p.hide{opacity:0}
#f1i.dock .f1i-cap{bottom:auto;width:auto;max-width:620px;text-align:left;background:#fff;border:1px solid var(--f-rule,#DDDEDF);border-radius:2px;padding:14px 18px;box-shadow:0 8px 24px rgba(22,24,27,.08)}
#f1i.dock .f1i-cap p{font-size:16px;font-weight:400;line-height:1.5}
#f1i.float .f1i-cap{top:auto;bottom:44px;left:50%;transform:translateX(-50%);text-align:center}
#f1i.dock:not(.float) .f1i-skip{top:72px}
#f1i .f1i-skip{position:absolute;top:16px;right:20px;z-index:3;background:#fff;border:1px solid var(--f-rule,#DDDEDF);border-radius:999px;padding:6px 14px;font:inherit;font-size:12.5px;color:var(--f-ink2,#4A4D52);cursor:pointer}
#f1i .f1i-skip:hover,#f1i .f1i-skip:focus-visible{color:var(--f-ink,#16181B);border-color:var(--f-ink,#16181B);outline:none}
#f1i .f1i-prog{position:absolute;left:0;bottom:0;height:2px;background:${DC};width:0}
#f1i .f1i-nav{display:flex;gap:22px;align-items:center;justify-content:center;margin-top:18px;font-size:12.5px;color:var(--f-mute,#66696E)}
#f1i.dock .f1i-nav{justify-content:flex-start;margin-top:10px}
#f1i.float .f1i-nav{justify-content:center}
#f1i .f1i-nav button{font:inherit;font-size:13px;background:none;border:0;color:var(--f-ink,#16181B);cursor:pointer;padding:4px 0;border-bottom:1px solid var(--f-ink,#16181B)}
#f1i .f1i-nav button[disabled]{color:var(--f-faint,#A9ABAF);border-color:transparent;cursor:default}
#f1i .f1i-ptr{position:absolute;left:50%;top:50%;width:22px;height:22px;margin:-2px 0 0 -3px;opacity:0;z-index:2;pointer-events:none;transition:left .7s cubic-bezier(.4,0,.2,1),top .7s cubic-bezier(.4,0,.2,1),opacity .3s}
#f1i .f1i-ptr.on{opacity:1}
#f1i .f1i-ptr i{position:absolute;left:3px;top:2px;width:26px;height:26px;margin:-13px 0 0 -13px;border:2px solid ${DC};border-radius:50%;opacity:0}
#f1i .f1i-ptr.tap i{animation:f1i-tap .6s ease-out}
@keyframes f1i-tap{from{opacity:.9;transform:scale(.3)}to{opacity:0;transform:scale(1.5)}}
#f1i.still *,#f1i.still{transition:none!important;animation:none!important}
/* scene 1 */
#f1i .f1i-sky{width:min(980px,100%);height:auto}
#f1i .f1i-sky .dc{fill:#A9ABAF;transition:fill 1.2s ease .6s}
#f1i .f1i-sky.lit .dc{fill:${DC}}
#f1i .f1i-sky .ray{opacity:0;transition:opacity .7s}
#f1i .f1i-sky.rays .ray{opacity:1}
#f1i .f1i-sky.rays .ray.r2{transition-delay:.35s}#f1i .f1i-sky.rays .ray.r3{transition-delay:.7s}
/* scene 2 */
#f1i .f1i-two{display:grid;grid-template-columns:1fr 1fr;gap:56px;width:min(1120px,100%);height:100%}
#f1i .f1i-two figure{margin:0;display:flex;flex-direction:column;min-height:0}
#f1i .f1i-two figcaption{font-size:15px;margin-bottom:6px}
#f1i .f1i-two svg{flex:1 1 auto;min-height:0;width:100%}
#f1i .f1i-two .z{opacity:0;transition:opacity .9s}
#f1i .f1i-two.lit .z{opacity:1}
#f1i .f1i-two .n{font-size:30px;font-weight:300;line-height:1.1;margin-top:6px}
#f1i .f1i-two .n span{font-size:12.5px;color:var(--f-mute,#66696E);margin-left:8px}
#f1i .f1i-key{position:absolute;left:64px;right:64px;bottom:-30px;display:flex;gap:22px;justify-content:center;font-size:12px;color:var(--f-mute,#66696E)}
#f1i .f1i-key i{display:inline-block;width:12px;height:12px;border-radius:2px;background:${DC};vertical-align:-2px;margin-right:6px}
/* scene 3 */
#f1i .f1i-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;width:min(1160px,100%)}
#f1i .f1i-card{border:1px solid var(--f-hair,#ECECEC);border-radius:3px;background:#fff;padding:0 0 18px;transition:transform .6s cubic-bezier(.3,.7,.3,1),box-shadow .6s,border-color .6s;opacity:.55}
#f1i .f1i-card img{width:100%;aspect-ratio:9/5;object-fit:cover;object-position:center 55%;display:block;background:var(--f-panel,#FAFAFA)}
#f1i .f1i-card h3{font-size:26px;font-weight:300;margin:16px 18px 8px}
#f1i .f1i-card p{font-size:14px;line-height:1.55;color:var(--f-ink2,#4A4D52);margin:0 18px 12px;min-height:44px}
#f1i .f1i-card .m{font-size:12px;color:var(--f-mute,#66696E);margin:0 18px}
#f1i .f1i-card.up{transform:translateY(-18px);border-color:${DC};box-shadow:0 16px 34px rgba(22,24,27,.10);opacity:1}
#f1i .f1i-card.seen{opacity:1}
/* scenes 4–6: the real interface, marked in blue */
body.f1i-strip #f1v .f1v-strip{box-shadow:inset 0 0 0 2px ${DC}}
body.f1i-strip #f1v .f1v-strip button{border-color:#A9C0DA}
body.f1i-strip #f1v .f1v-strip button[aria-current="true"]{border-color:${DC};color:var(--f-ink,#16181B);background:linear-gradient(#E2EAF3,#E2EAF3) no-repeat left/0% 100%;animation:f1i-fill 1.3s ease-out forwards}
@keyframes f1i-fill{to{background-size:100% 100%}}
body.f1i-how #f1v .f1v-head .f1v-how{color:${DC};text-decoration-color:${DC};outline:1.5px solid ${DC};outline-offset:6px;border-radius:2px}
body.f1i-on #f1l{animation:f1i-slide .8s cubic-bezier(.3,.7,.3,1)}
@keyframes f1i-slide{from{transform:translateX(100%)}to{transform:none}}
body.f1i-still #f1l{animation:none}
body.f1i-still #f1v .f1v-strip button[aria-current="true"]{animation:none;background-size:100% 100%}
body.f1i-fade #f1v,body.f1i-fade #f1l{opacity:0;transition:opacity .6s}
#f1.f1i-zoom{transform:scale(1.32);transform-origin:50% 30%}
#f1.f1i-zoom.go{transform:none;transition:transform 1.6s cubic-bezier(.3,.7,.3,1)}
#f1.f1i-ways .f1-row .ract [data-see],#f1.f1i-ways .f1-row .ract [data-logic]{outline:1.5px solid ${DC};outline-offset:5px;border-radius:2px}
#f1.f1i-ways .f1-row .ract [data-logic]{color:${DC};border-bottom-color:${DC}}
/* the built intro (19c): a schematic tool frame, schematic cards, drawn pages, a source tag, a logic node */
#f1i .f1i-mock{width:min(1100px,100%);height:100%;max-height:560px;display:grid;grid-template-rows:auto 1fr auto;border:1px solid var(--f-rule,#DDDEDF);background:#fff;box-shadow:0 12px 32px rgba(22,24,27,.07)}
#f1i .f1i-mock .hd{display:flex;gap:22px;align-items:center;padding:10px 18px;border-bottom:1px solid var(--f-hair,#ECECEC);font-size:13px;color:var(--f-mute,#66696E)}#f1i .f1i-mock .hd b{color:var(--f-ink,#16181B);font-weight:500}#f1i .f1i-mock .hd .w{margin-left:auto}
#f1i .f1i-mock .bd{display:grid;grid-template-columns:3fr 2fr;min-height:0}
#f1i .f1i-mock .dr{padding:16px;display:flex;align-items:center;justify-content:center;transition:opacity .26s}#f1i .f1i-mock .dr svg{width:100%;height:100%;max-height:340px}
#f1i .f1i-mock .pn{background:#FAFAF8;border-left:1px solid var(--f-hair,#ECECEC);padding:22px 24px;transition:opacity .26s;overflow:hidden}
#f1i .f1i-mock .out{opacity:0}
#f1i .f1i-mock .pn .ch{font-size:12px;color:var(--f-mute,#66696E)}#f1i .f1i-mock .pn h3{font-size:26px;font-weight:300;margin:6px 0 10px}#f1i .f1i-mock .pn p{font-size:14px;line-height:1.5;color:var(--f-ink2,#4A4D52);margin:0 0 14px}
#f1i .f1i-mock .pn .r{display:flex;justify-content:space-between;gap:12px;border-top:1px solid var(--f-hair,#ECECEC);padding:7px 0;font-size:13px;color:var(--f-mute,#66696E)}#f1i .f1i-mock .pn .r b{font-weight:400;color:var(--f-ink,#16181B);text-align:right}
#f1i .f1i-mock .f1i-strip2{display:flex;gap:6px;padding:10px 12px;border-top:1px solid var(--f-hair,#ECECEC);overflow:hidden}
#f1i .f1i-mock .f1i-strip2 span{flex:0 0 auto;min-width:96px;border:1px solid var(--f-rule,#DDDEDF);padding:6px 8px;font-size:12px;color:var(--f-ink2,#4A4D52);transition:border-color .4s,background .4s}
#f1i .f1i-mock .f1i-strip2 span i{display:block;font-style:normal;color:var(--f-mute,#66696E);font-size:12px}
#f1i .f1i-mock .f1i-strip2 span.on{border-color:${DC};background:#E2EAF3;color:var(--f-ink,#16181B)}
#f1i .f1i-mock .lasso{stroke-dasharray:6 4;animation:f1i-draw 1.6s ease-out both}#f1i .f1i-mock .loop{stroke-dasharray:400;stroke-dashoffset:400;animation:f1i-loop 1s ease-out 1.6s forwards}
@keyframes f1i-draw{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}@keyframes f1i-loop{to{stroke-dashoffset:0}}
#f1i .f1i-mock .flow{stroke-dasharray:8 6;animation:f1i-flow 1.1s linear infinite}
#f1i .f1i-pages .pg{width:200px;height:258px;background:#fff;border:1px solid var(--f-rule,#DDDEDF);box-shadow:0 8px 20px rgba(22,24,27,.07);padding:14px;text-align:left}
#f1i .f1i-pages .pg .ph{font-size:7px;letter-spacing:.08em;color:#8A8984;border-bottom:1px solid #ECECEC;padding-bottom:6px}#f1i .f1i-pages .pg .pt{font-size:14px;margin:10px 0}
#f1i .f1i-pages .pg svg{width:100%;height:auto;margin:6px 0}#f1i .f1i-pages .pg .ln{height:5px;background:#ECEBE7;margin:7px 0;width:90%}#f1i .f1i-pages .pg .ln.s{width:60%}
#f1i .f1i-src{text-align:center}#f1i .f1i-src .fig{display:inline-flex;align-items:baseline;gap:14px}#f1i .f1i-src .v{font-size:72px;font-weight:300}#f1i .f1i-src .u{font-size:18px;color:var(--f-mute,#66696E)}
#f1i .f1i-src .tag{font:inherit;font-size:12px;border:1px solid ${DC};color:${DC};background:#fff;border-radius:999px;padding:3px 12px}
#f1i .f1i-src .open{max-width:640px;margin:22px auto 0;font-size:15px;line-height:1.5;color:var(--f-ink2,#4A4D52);border-left:2px solid ${DC};padding:10px 16px;text-align:left;background:#F6F8FB;opacity:0;transform:translateY(-8px);transition:opacity .6s,transform .6s}
#f1i .f1i-src.on .open{opacity:1;transform:none}#f1i .f1i-src.on .tag{background:${DC};color:#fff}
#f1i .f1i-logic{position:relative;width:min(1100px,100%)}#f1i .f1i-logic svg{width:72%;height:auto}
#f1i .f1i-logic .node{position:absolute;right:0;top:0;width:30%;background:#fff;border:1px solid var(--f-rule,#DDDEDF);padding:16px 18px;font-size:13px;line-height:1.5;color:var(--f-ink2,#4A4D52);opacity:0;transform:translateX(30px);transition:opacity .6s,transform .6s}
#f1i .f1i-logic.on .node{opacity:1;transform:none}#f1i .f1i-logic .node h4{font-size:20px;font-weight:300;margin:4px 0 10px;color:var(--f-ink,#16181B)}#f1i .f1i-logic .node .k{font-size:12px;color:var(--f-mute,#66696E)}
/* the 18 Nov sequence */
#f1i .f1i-title{text-align:center}#f1i .f1i-title h1{font-size:64px;font-weight:300;margin:0 0 14px}#f1i .f1i-title p{font-size:16px;color:var(--f-mute,#66696E);margin:0}
#f1i .f1i-sky.rays .ray path{animation:f1i-flow 1.1s linear infinite}
@keyframes f1i-flow{to{stroke-dashoffset:-16}}
#f1i .f1i-two figure{transition:opacity .8s;overflow:hidden}#f1i .f1i-two.zoom figure.e{opacity:0}
#f1i .f1i-two svg{transition:transform 2.2s cubic-bezier(.4,0,.2,1)}
#f1i .f1i-two .lot{opacity:0;transition:opacity .6s}#f1i .f1i-two.zoom .lot{opacity:1}
#f1i .f1i-pages{width:100%;overflow:hidden}#f1i .f1i-pages .row{display:flex;gap:22px;width:max-content;animation:f1i-pages 9s linear forwards}
#f1i .f1i-pages figure{margin:0;text-align:center}#f1i .f1i-pages img{height:min(52vh,391px);display:block;border:1px solid var(--f-rule,#DDDEDF);box-shadow:0 8px 20px rgba(22,24,27,.07)}
#f1i .f1i-pages figcaption{font-size:12px;color:var(--f-mute,#66696E);margin-top:8px}
@keyframes f1i-pages{from{transform:translateX(30vw)}to{transform:translateX(calc(-100% + 70vw))}}
#f1i .f1i-goals{max-width:820px;text-align:left}#f1i .f1i-goals h2{font-size:15px;font-weight:500;color:var(--f-mute,#66696E);margin:0 0 16px;letter-spacing:.04em;text-transform:uppercase}
#f1i .f1i-goals ol{margin:0;padding-left:26px;font-size:21px;font-weight:300;line-height:1.5}#f1i .f1i-goals li+li{margin-top:14px}
body.f1i-src #f1v details{outline:1.5px solid ${DC};outline-offset:4px}
@media (max-width:760px){
 #f1i .f1i-mock{max-height:none}#f1i .f1i-mock .hd .w{display:none}#f1i .f1i-mock .bd{grid-template-columns:1fr;grid-template-rows:auto auto}
 #f1i .f1i-mock .dr{padding:8px;max-height:200px}#f1i .f1i-mock .pn{border-left:0;border-top:1px solid var(--f-hair,#ECECEC);padding:12px 14px}
 #f1i .f1i-mock .pn h3{font-size:19px;margin:2px 0 6px}#f1i .f1i-mock .pn p{font-size:12.5px;margin:0 0 8px}#f1i .f1i-mock .pn .r{font-size:12px;padding:5px 0}
 #f1i .f1i-mock .f1i-strip2 span{min-width:84px;font-size:12px}
 #f1i .f1i-logic svg{width:100%}#f1i .f1i-logic .node{position:static;width:auto;margin-top:10px;font-size:12px;padding:10px 12px}#f1i .f1i-logic .node h4{font-size:16px}
 #f1i .f1i-src .v{font-size:48px}#f1i .f1i-src .fig{flex-wrap:wrap;justify-content:center}#f1i .f1i-src .open{font-size:13px}
 #f1i .f1i-pages .pg{width:150px;height:200px}
 #f1i .f1i-title h1{font-size:40px}#f1i .f1i-goals ol{font-size:16px}
 #f1i .f1i-stage{padding:0 16px;top:56px;bottom:200px}
 #f1i .f1i-cap p{font-size:19px}
 #f1i .f1i-two{gap:14px}
 #f1i .f1i-cards{grid-template-columns:1fr 1fr;gap:12px}
 #f1i .f1i-card h3{font-size:18px;margin:10px 10px 4px}#f1i .f1i-card p{font-size:12px;margin:0 10px 6px;min-height:0}#f1i .f1i-card .m{margin:0 10px}
 #f1i .f1i-key{left:16px;right:16px;flex-wrap:wrap}
 #f1i.dock .f1i-cap{left:16px!important;right:16px;width:auto!important;transform:none}
}
/* intro v3: the frozen real cards sit under the overlay; nothing in them answers a click */
.f1i-frozen{pointer-events:none!important;user-select:none}
body.f1i-still #f1i .f1i-ptr{display:none!important}   /* the slides (still mode) show no pointer ( item 4) */
#f1i .f1i-lasso{position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:2}
.f1i-frozen .f1i-page{transition:transform .42s ease-in,opacity .42s ease-in;transform-origin:left center}
.f1i-frozen .f1i-page.turn{transform:perspective(1800px) rotateY(-75deg);opacity:0}
.f1i-frozen .f1i-page.in{animation:f1iPageIn .35s ease-out}
@keyframes f1iPageIn{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}
#f1l.f1i-closed .f1l-f,#f1l.f1i-closed .f1l-a,#f1l.f1i-closed .f1l-src{visibility:hidden}
#f1i .f1i-mute{position:absolute;top:16px;right:150px;z-index:3;background:#fff;border:1px solid var(--f-rule,#DDDEDF);border-radius:999px;padding:6px 14px;font:inherit;font-size:12.5px;color:var(--f-ink2,#4A4D52);cursor:pointer}
#f1i .f1i-mute[aria-pressed="true"]{color:var(--f-mute,#66696E)}
@media (max-width:600px){ #f1i .f1i-mute{right:auto;left:16px} }
`;
function css(){ if(document.getElementById('f1i-css')) return; const s=document.createElement('style'); s.id='f1i-css'; s.textContent=CSS; document.head.appendChild(s); }

 
async function text(){ if(!TXT) TXT=await fetch('f1/intro.json').then(r=>r.json()); return TXT; }
async function counts(){ if(!COUNTS) COUNTS=await fetch('data/approval_counts.json').then(r=>r.json()).catch(()=>null); return COUNTS; }
 
const zl=(c,city)=>{ const z=c&&c[city]&&c[city].zones; if(!Array.isArray(z)||!z.length) return ''; const w=z.map(String); return w.length===1?w[0]:w.slice(0,-1).join(', ')+' and '+w[w.length-1]; };
const lotsAllowed=(c,city)=>{ const r=c&&c[city]; return r&&isFinite(r.permitted)&&isFinite(r.conditional)?r.permitted+r.conditional:null; };
const zkey=(city,z)=>city==='van'?String(z||'').trim():String(z||'').trim().split(/\s+/)[0].toUpperCase();  
 
async function cityMap(city){ if(MAPS[city]) return MAPS[city]; const C=BD.f1cards, m=await BD.getJSON(`tiles/${city}/meta.json`), Q=m.Q||1, st=await BD.streets(city);
  const dec=a=>{ const r=new Float64Array(a.length); let x=0,y=0; for(let i=0;i<a.length;i+=2){ x+=a[i]; y+=a[i+1]; r[i]=x/Q; r[i+1]=y/Q; } return r; };
  const W=520, H=470, f=C.frame(m.ext,W,H,6), zs=m.overview.filter(([zi])=>C.allowed(city,zkey(city,m.zones[zi]))).map(([,a])=>dec(a));
  let sd=''; if(st) for(const g of st.segs){ for(let i=2;i+1<g.length;i+=2){ const [a,b]=f.P(g[i],g[i+1]); sd+=(i>2?'L':'M')+a.toFixed(1)+' '+b.toFixed(1); } }
   
  const xs=zs.map(r=>r[0]), lo=Math.min(...xs), hi=Math.max(...xs), B=[[],[],[],[],[]]; zs.forEach(r=>B[Math.min(4,Math.floor((r[0]-lo)/((hi-lo)||1)*5))].push(r));
  MAPS[city+'_f']=f;
  return MAPS[city]=`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${city==='van'?'Vancouver':'Edmonton'}: streets, and the zones where a data centre is allowed"><path d="${sd}" fill="none" stroke="#DDDEDF" stroke-width="0.5"/>${B.map((b,i)=>b.length?`<path class="z" style="transition-delay:${(i*0.35).toFixed(2)}s" d="${C.pathOf(b,f.P)}" fill="${DC}"/>`:'').join('')}</svg>`; }

 
function wait(ms){ const t=RUN; if(R&&R.still) ms=0; return new Promise((res,rej)=>setTimeout(()=>alive(t)?res():rej(STOP),ms)); }
async function until(fn,ms){ const t0=Date.now(); while(Date.now()-t0<ms){ if(!R) throw STOP; try{ if(fn()) return true; }catch(e){} await new Promise(r=>setTimeout(r,150)); } return false; }
function overlay(still){ css(); let O=document.getElementById('f1i'); if(O) O.remove(); O=document.createElement('div'); O.id='f1i'; O.setAttribute('role','dialog'); O.setAttribute('aria-modal','true'); O.setAttribute('aria-label','Intro');
  if(still) O.className='still';
  O.innerHTML=`<div class="f1i-bg"></div><div class="f1i-stage"></div><div class="f1i-cap"><div class="f1i-txt" aria-live="polite"></div>${still?'<nav class="f1i-nav" aria-label="Intro slides"><button data-prev>Back</button><span class="no"></span><button data-next>Next</button></nav>':''}</div><div class="f1i-ptr" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 22 22"><path d="M3 2L3 18L7.5 13.8L10.6 20.5L13.4 19.2L10.4 12.6L16.5 12.4Z" fill="${DC}" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg><i></i></div>
   <button class="f1i-skip" data-skip>${esc((TXT&&TXT.skip)||'Skip intro')}&nbsp;&nbsp;✕</button>${still?'':'<div class="f1i-prog"></div>'}`;
  document.body.appendChild(O); O.querySelector('.f1i-skip').focus();
  O.addEventListener('click',e=>{ if(e.target.closest('[data-skip]')) return stop(); if(e.target.closest('[data-next]')) return R&&R.go(R.i+1); if(e.target.closest('[data-prev]')) return R&&R.go(R.i-1); });
  return O; }
function onKey(e){ if(!R) return; if(e.key==='Escape'){ e.preventDefault(); e.stopImmediatePropagation(); stop(); return; }
  if(R.still&&(e.key==='ArrowRight'||e.key==='ArrowLeft')){ e.preventDefault(); e.stopImmediatePropagation(); R.go(R.i+(e.key==='ArrowRight'?1:-1)); } }
function caption(lines,mode){ const O=R.O, cap=O.querySelector('.f1i-cap'); O.classList.toggle('dock',mode==='dock'||mode==='float'); O.classList.toggle('float',mode==='float'); cap.style.left=cap.style.top=cap.style.width=cap.style.transform='';
  cap.querySelector('.f1i-txt').innerHTML=lines.map((t,i)=>`<p${i&&!R.still?' class="hide"':''}>${esc(t)}</p>`).join(''); }
function showLine(i){ const p=R.O.querySelectorAll('.f1i-cap p')[i]; if(p) p.classList.remove('hide'); }
function dockCaption(over){   const cap=R.O.querySelector('.f1i-cap'), m=$('#f1v .f1v-main')||$('#f1l .f1v-main'), sp=$('#f1v .f1v-strip');
  if(!m) return; const r=m.getBoundingClientRect(), ft=$('#f1v .f1v-foot'), lim=ft&&ft.getBoundingClientRect().top>0?ft.getBoundingClientRect().top:innerHeight-20;
  const b=Math.min(over?over.getBoundingClientRect().top:(sp?sp.getBoundingClientRect().top:innerHeight-20), lim-8);    
  cap.style.left=Math.round(r.left+24)+'px'; cap.style.transform='none'; cap.style.width=Math.min(620,r.width-48)+'px'; cap.style.top=Math.max(70,Math.round(b-cap.offsetHeight-18))+'px'; }
function stage(html,clear){ R.O.classList.toggle('clear',!!clear); R.O.querySelector('.f1i-stage').innerHTML=html||''; return R.O.querySelector('.f1i-stage'); }
async function point(el,tap){ const P=R.O.querySelector('.f1i-ptr'); if(!el){ P.classList.remove('on'); return; } const r=el.getBoundingClientRect();
  P.style.left=Math.round(r.left+Math.min(r.width/2,60))+'px'; P.style.top=Math.round(r.top+r.height/2)+'px'; P.classList.add('on'); await wait(800);
  if(tap){ P.classList.remove('tap'); void P.offsetWidth; P.classList.add('tap'); } }
const body=(c,on)=>document.body.classList.toggle(c,on);

 
const closeLogic=()=>{ const l=$('#f1l'); if(l) l.remove(); };
async function ensureViewer(tpl){ let W=$('#f1v'); if(!W||!(BD.f1&&BD.f1.TPL)) { BD.f1.viewer(tpl); W=$('#f1v'); R.opened=true; }
  else if(!W.querySelector('.f1v-head .tpl')||W.querySelector('.f1v-head .tpl').textContent!==BD.f1.TPL.find(t=>t.id===tpl).name){ BD.f1.viewer(tpl); R.opened=true; }
  const van=()=>$('#f1v [data-city="van"]'); await until(()=>van(),3000);  
  if(van()&&van().getAttribute('aria-pressed')!=='true') van().click();
  return until(()=>{ const w=$('#f1v .f1v-where'), d=$('#f1v .f1v-draw'); return w&&w.textContent&&w.textContent!=='…'&&d&&!/Drawing…/.test(d.textContent); },20000); }
const strip=k=>$(`#f1v .f1v-strip [data-to="${k}"]`);
const built=()=>{ const d=$('#f1v .f1v-draw'); return d&&!/Drawing…/.test(d.textContent); };

 
const stripBy=re=>[...document.querySelectorAll('#f1v .f1v-strip [data-to]')].find(b=>re.test(b.textContent));
async function card(re,ms){ const b=stripBy(re); if(!b) return false; if(b.getAttribute('aria-current')!=='true'){ if(!R.still) await point(b,true); b.click(); } dockCaption(); await until(built,ms||30000); dockCaption(); return true; }
async function viewer(tpl,sc){ R.O.classList.add('clear'); caption(sc.captions,'dock'); closeLogic(); await ensureViewer(tpl); body('f1i-strip',true); dockCaption(); }
const LOT339=[1726,2036];    
const S_LIVE=[
  
 async function(sc){ caption(sc.captions); stage(`<div class="f1i-title"><h1>Beyond Data</h1><p>${esc(sc.thesis)}</p></div>`); await wait(4500); },
  
 async function(sc){ caption(sc.captions); stage(skyline(sc.labels)); const sky=R.O.querySelector('.f1i-sky'); await wait(60); sky.classList.add('lit'); await wait(1600); sky.classList.add('rays'); await wait(3900); },
  
 async function(sc){ caption(sc.captions); const c=await counts(), [mv,me]=await Promise.all([cityMap('van'),cityMap('edm')]);
   const fig=(city,name,svg,cl)=>{ const n=lotsAllowed(c,city); return `<figure class="${cl}"><figcaption>${name}</figcaption>${svg}<div class="n" data-n="${n==null?'':n}">${n==null?'?':R.still?n.toLocaleString('en-CA'):'0'}<span>${esc(zl(c,city)?`lots in ${zl(c,city)} zones, where a data centre ${(c[city].permitted||0)>0&&!(c[city].conditional>0)?'is allowed outright':'may be allowed with approval'}`:sc.count)}</span></div></figure>`; };
   const st=stage(`<div class="f1i-two">${fig('van','Vancouver',mv,'v')}${fig('edm','Edmonton',me,'e')}</div><div class="f1i-key"><span><i></i>${esc(sc.key)}</span><span>${esc(sc.source)}</span></div>`);
   await wait(300); st.querySelector('.f1i-two').classList.add('lit'); countUp(st); await wait(2600);
   const f=MAPS.van_f, sv=st.querySelector('figure.v svg'); if(f&&sv){ const [px,py]=f.P(LOT339[0],LOT339[1]), vb=sv.viewBox.baseVal;
     sv.insertAdjacentHTML('beforeend',`<circle class="lot" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="2.2" fill="none" stroke="#16181B" stroke-width=".8"/>`);
     sv.style.transformOrigin=`${(px/vb.width*100).toFixed(1)}% ${(py/vb.height*100).toFixed(1)}%`; st.querySelector('.f1i-two').classList.add('zoom'); if(!R.still) sv.style.transform='scale(3)'; }
   await wait(2800); },
  
 async function(sc){ await viewer('resident',sc); await card(/Find a data centre/); await wait(2200); await card(/What.s inside/); await wait(2600); },
  
 async function(sc){ await viewer('municipal',sc); await card(/Is a data centre allowed/); await wait(1800); await card(/Yards by edge/); await wait(1800); await card(/Approval process/); await wait(2000); },
  
 async function(sc){ await viewer('engineering',sc); await card(/Heat offered/); await wait(1800); await card(/Shared energy/,60000); await wait(900);
   const lb=$('#f1v [data-f1d="lasso"]'), svg=$('#f1v .f1d-svg svg');
   if(lb&&svg&&!R.still){ await point(lb,true); lb.click(); const r=svg.getBoundingClientRect(), pts=[[.30,.30],[.62,.28],[.66,.55],[.40,.62],[.28,.48],[.30,.31]].map(([a,b])=>[r.left+r.width*a,r.top+r.height*b]);
     const ev=(t,[x,y])=>svg.dispatchEvent(new PointerEvent(t,{bubbles:true,cancelable:true,clientX:x,clientY:y,pointerId:7,pointerType:'mouse',isPrimary:true}));
     ev('pointerdown',pts[0]); for(let i=1;i<pts.length;i++){ const [a,b]=pts[i-1], [c,d]=pts[i]; for(let k=1;k<=8;k++){ ev('pointermove',[a+(c-a)*k/8,b+(d-b)*k/8]); await wait(35); } } ev('pointerup',pts[pts.length-1]);
     await wait(400); await until(built,30000); }
   await wait(1400); const vb=$('#f1v [data-f1d="view"]'); if(vb){ if(!R.still) await point(vb,true); vb.click(); await until(()=>$('#f1v .f1d-svg canvas')||/could not load/.test(($('#f1v .f1d-svg')||{}).textContent||''),20000); } await wait(2600); },
  
 async function(sc){ await viewer('architecture',sc); await card(/Pick a typology/,60000); await wait(2200); await card(/^\s*\d*\s*Variant/,60000); await wait(1800); await card(/Program diagram/,60000); await wait(2400); },
  
 async function(sc){ R.O.classList.remove('clear'); body('f1i-strip',false); caption(sc.captions);
   stage(`<div class="f1i-pages"><div class="row">${sc.pages.map(q=>`<figure><img src="f1/intro/${esc(q.f)}" alt="${esc(q.t)}"><figcaption>${esc(q.t)}</figcaption></figure>`).join('')}</div></div>`); await wait(6000); },
  
 async function(sc){ await viewer('engineering',sc); await card(/Shared energy/,60000); await wait(600);
   const d=[...document.querySelectorAll('#f1v details')].find(x=>/Sources/.test(x.textContent))||$('#f1v details'); if(d){ body('f1i-src',true); await point(d.querySelector('summary')||d,true); d.open=true; d.scrollIntoView({block:'center'}); dockCaption(); }
   const li=d&&[...d.querySelectorAll('li,p,div')].find(x=>/DEA|Danish/.test(x.textContent)&&x.children.length<3); if(li){ await wait(700); await point(li); }
   await wait(3800); body('f1i-src',false); if(d) d.open=false; },
  
 async function(sc){ await viewer('engineering',sc); body('f1i-strip',false); await card(/Heat offered/,60000);
   if(!$('#f1l')){ body('f1i-how',true); dockCaption(); await point($('#f1v .f1v-head .f1v-how')); await wait(1200);
     const fig=$('#f1v .f1c-hero [data-fig]')||$('#f1v [data-fig]'); if(fig){ await point(fig,true); await wait(300); }
     const V=BD.f1.TPL.find(t=>t.id==='engineering'), c=V.cards.find(q=>/Heat offered/.test(q.t)), ids=BD.f1logic.cardIds(c.t,V.tab);
      
     await BD.f1logic.open({tab:V.tab,label:c.t+' · heat delivered',ids,lot:($('#f1v .f1v-where')||{}).textContent||'',sel:ids.find(i=>/heat_delivered/.test(i))||ids[0]||null});
     body('f1i-how',false); }
   await until(()=>$('#f1l .f1l-box svg'),8000);
   const box=$('#f1l .f1l-box'), sel=box&&(box.querySelector('.lp.sel')||box.querySelector('.lp.lit'));
   if(sel){ const br=box.getBoundingClientRect(), r=sel.getBoundingClientRect(); box.scrollLeft+=r.left-br.left-br.width/2+r.width/2; box.scrollTop+=r.top-br.top-br.height/2+r.height/2; }
   dockCaption($('#f1l .f1l-key')); await wait(900); if(sel) await point(sel.querySelector('rect')||sel); await wait(4200); },
  
 async function(sc){ R.O.querySelector('.f1i-ptr').classList.remove('on'); R.O.classList.remove('clear'); body('f1i-strip',false); body('f1i-how',false); closeLogic();
   caption(sc.captions); stage(`<div class="f1i-goals"><h2>The goals</h2><ol>${sc.goals.map(g=>`<li>${esc(g)}</li>`).join('')}</ol></div>`); await wait(5500); }
];
 
const STEPS=id=>((BD.f1&&BD.f1.TPL.find(t=>t.id===id))||{cards:[]}).cards.map(c=>c.t);
const G='#9C9B97', GL='#D7D6D2', INKC='#16181B', ORG='#E07B39';
function mock(tpl,name,o){ const st=STEPS(tpl);
  return `<div class="f1i-mock"><div class="hd"><b>Beyond Data</b><span>${esc(name)}</span><span class="w">Vancouver / 339 1st Ave E</span></div>
    <div class="bd"><div class="dr" data-dr></div><div class="pn" data-pn></div></div>
    <div class="f1i-strip2">${st.map((s,i)=>`<span data-k="${esc(s)}"><i>${i+1}</i>${esc(s)}</span>`).join('')}</div></div>`; }
async function showCard(title,draw,panel,ms){ const O=R.O, dr=O.querySelector('[data-dr]'), pn=O.querySelector('[data-pn]'); if(!dr) return;
  O.querySelectorAll('.f1i-mock .f1i-strip2 span').forEach(s=>s.classList.toggle('on',s.dataset.k===title));
  const on=O.querySelector('.f1i-mock .f1i-strip2 span.on'); if(on) on.scrollIntoView({block:'nearest',inline:'center'});
  dr.classList.add('out'); pn.classList.add('out'); await wait(R.still?0:260);
  dr.innerHTML=draw; pn.innerHTML=panel; dr.classList.remove('out'); pn.classList.remove('out'); await wait(ms); }
const panel=(chap,t,lead,rows)=>`<div class="ch">${esc(chap)}</div><h3>${esc(t)}</h3><p>${esc(lead)}</p>${(rows||[]).map(r=>`<div class="r"><span>${esc(r[0])}</span><b>${esc(r[1])}</b></div>`).join('')}`;
const svgW=(w,h,inner)=>`<svg viewBox="0 0 ${w} ${h}" role="img" aria-hidden="true">${inner}</svg>`;
const grid=()=>{ let s=''; for(let i=0;i<9;i++) s+=`<line x1="${20+i*60}" y1="10" x2="${i*60-40}" y2="330" stroke="${GL}" stroke-width="1.4"/>`; for(let j=0;j<6;j++) s+=`<line x1="0" y1="${30+j*60}" x2="520" y2="${50+j*60}" stroke="${GL}" stroke-width="1.4"/>`; return s; };
const iso=(x,y,w,d,h,fill,st)=>{ const X=(a,b)=>[x+(a-b)*0.87,y+(a+b)*0.5]; const p=(...q)=>q.map(v=>v.map(n=>n.toFixed(1)).join(',')).join(' ');
  const A=X(0,0),B=X(w,0),C=X(w,d),D=X(0,d); const up=q=>[q[0],q[1]-h];
  return `<polygon points="${p(D,C,up(C),up(D))}" fill="${fill||'#EEEDEA'}" stroke="${st||G}" stroke-width=".8"/><polygon points="${p(B,C,up(C),up(B))}" fill="${fill||'#F6F5F2'}" stroke="${st||G}" stroke-width=".8"/><polygon points="${p(up(A),up(B),up(C),up(D))}" fill="#fff" stroke="${st||G}" stroke-width=".8"/>`; };
const S_BUILT=[
 S_LIVE[0], S_LIVE[1],
  
 S_LIVE[2],
  
 async function(sc){ caption(sc.captions); stage(mock('resident','Resident')); await wait(150);
   const dots=[[120,90],[180,130],[230,80],[260,170],[300,120],[340,200],[150,220],[210,260],[380,150],[420,90],[90,160],[460,220],[320,270],[250,215],[400,260],[170,60]].map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="${i===4?7:5}" fill="${i===4?DC:'#fff'}" stroke="${i===4?DC:INKC}" stroke-width="1.3"/>`).join('');
   await showCard('Find a data centre',svgW(520,330,grid()+dots),panel('Find','Find a data centre','Vancouver: 19 data centres on record, 12 operating. Click a dot to pick one.',[['On record','19'],['Operating','12'],['Picked','VAN1 · Cologix']]),2400);
   const unit=(x,y,t)=>`<rect x="${x}" y="${y}" width="96" height="58" rx="3" fill="#fff" stroke="${G}"/><text x="${x+48}" y="${y+34}" text-anchor="middle" font-size="13" fill="${INKC}">${t}</text>`;
   await showCard('What’s inside',svgW(520,330,unit(40,40,'Power in')+unit(212,40,'UPS')+unit(384,40,'Servers')+unit(40,200,'Generators')+unit(212,200,'Cooling')+unit(384,200,'Heat out')+`<path d="M136 69H212M308 69H384M432 98V200M384 229H308M136 229H212M88 200V98" fill="none" stroke="${DC}" stroke-width="1.6" stroke-dasharray="5 4"/>`),
     panel('The facility','What’s inside','The equipment the sources name for VAN1, drawn as generic units.',[['Named by a source','6 of 7 parts'],['Heat reuse','none claimed']]),2600); },
  
 async function(sc){ caption(sc.captions); stage(mock('municipal','Municipal')); await wait(150);
   const box=(x,t,on)=>`<rect x="${x}" y="110" width="150" height="90" rx="4" fill="${on?'#E2EAF3':'#fff'}" stroke="${on?DC:G}" stroke-width="${on?2:1}"/><text x="${x+75}" y="160" text-anchor="middle" font-size="15" fill="${INKC}">${t}</text>`;
   await showCard('Is a data centre allowed?',svgW(520,330,box(15,'permitted')+box(185,'conditional',1)+box(355,'needs a rezoning')),panel('Use','Is a data centre allowed?','A conditional use: the City decides. No rezoning is needed.',[['Zone','I-3'],['Vancouver lots that can, with approval','696 of about 93,400']]),2000);
   await showCard('Yards by edge',svgW(520,330,`<polygon points="70,60 450,40 470,280 60,300" fill="#fff" stroke="${INKC}" stroke-width="1.4"/><polygon points="76,66 444,47 425,250 105,268" fill="#E2EAF3" stroke="${DC}" stroke-dasharray="5 4"/><text x="260" y="320" text-anchor="middle" font-size="13" fill="${INKC}">front 0.6 m</text><text x="30" y="180" font-size="13" fill="${INKC}" transform="rotate(-88 30 180)">side 7.6 m</text><text x="262" y="34" text-anchor="middle" font-size="13" fill="${INKC}">rear 3.1 m</text><text x="262" y="165" text-anchor="middle" font-size="16" fill="${DC}">2,740 m² inside the yards</text>`),
     panel('Building rules','Yards by edge','Each lot line is classed as front, side or rear; each class has its own yard.',[['Front yard','0.6 m'],['Side yard','7.6 m'],['Rear yard','3.1 m']]),2000);
   let st=''; for(let i=0;i<6;i++) st+=`<circle cx="${60+i*80}" cy="165" r="14" fill="${i===5?DC:'#fff'}" stroke="${DC}" stroke-width="1.5"/><text x="${60+i*80}" y="170" text-anchor="middle" font-size="12" fill="${i===5?'#fff':INKC}">${i+1}</text>`;
   await showCard('Approval process',svgW(520,330,`<line x1="60" y1="165" x2="460" y2="165" stroke="${G}"/>${st}`),panel('Process','Approval process','The Director of Planning decides, or the Development Permit Board.',[['Steps on this lot’s path','6'],['Appeal window','30 days']]),2200); },
  
 async function(sc){ caption(sc.captions); stage(mock('engineering','Engineering')); await wait(150);
   await showCard('Heat offered',svgW(520,330,`${iso(70,150,90,70,90,'#DCE6F2',DC)}<path d="M200 160 C 290 120, 360 120, 450 160" fill="none" stroke="${ORG}" stroke-width="3" class="flow"/><text x="320" y="110" text-anchor="middle" font-size="15" fill="${INKC}">11,300–19,700 MWh/yr</text><text x="320" y="200" text-anchor="middle" font-size="12" fill="${G}">heat offered, after the heat pump</text>`),
     panel('Exchanges','Heat offered','The heat the data centre gives off, raised by a heat pump for a neighbour to use.',[['Heat offered','11,300–19,700 MWh/yr'],['Size','2.5 MW, air-cooled']]),1900);
   const blds=[[80,60,60,40],[170,70,50,60],[300,50,70,40],[120,170,70,50],[260,160,60,60],[380,170,60,40],[90,250,50,40],[200,250,80,40],[350,250,60,40]].map(([x,y,w,h],i)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${[1,3,4].includes(i)?'#E79C66':'#F0EEE9'}" stroke="${G}"/>`).join('');
   await showCard('Shared energy district',svgW(520,330,grid()+blds+`<rect x="236" y="120" width="16" height="16" fill="${DC}"/><path class="lasso" d="M150 60 L270 52 L340 150 L330 240 L110 235 L100 140 Z" fill="none" stroke="${ORG}" stroke-width="1.6" stroke-dasharray="6 4"/><path class="loop" d="M244 136 L244 190 L160 195 M244 190 L290 190 L290 175" fill="none" stroke="${ORG}" stroke-width="3.2"/>`),
     panel('District','Shared energy district','What would happen if this existing area became a shared energy district?',[['Buildings in the group','3'],['Loop along the streets','792 m'],['Cost per MWh of heat','$44–150']]),2500);
   await showCard('Shared energy district',svgW(520,330,iso(90,170,70,50,40)+iso(170,215,60,60,95,'#E79C66')+iso(250,150,60,40,60,'#E79C66')+iso(310,220,80,50,35)+iso(200,120,40,40,30,'#DCE6F2',DC)+`<path d="M232 165 L232 205 L262 222" fill="none" stroke="${ORG}" stroke-width="3"/><text x="400" y="80" font-size="13" fill="${INKC}">the data centre: the heat source</text><line x1="230" y1="110" x2="396" y2="76" stroke="${INKC}" stroke-width=".8"/>`),
     panel('District','The area in 3-D','The group in 3-D: the loop in orange, the buildings shaded by demand.',[['Loop','792 m'],['Not to a design','estimates']]),1900); },
  
 async function(sc){ caption(sc.captions); stage(mock('architecture','Architecture')); await wait(150);
   let names=TYPN; try{ const d=await BD.getJSON('data/typologies.json'); if(d&&d.list) names=d.list.map(t=>t.name); }catch(e){}
   const tiles=names.slice(0,8).map((n,i)=>{ const x=20+(i%4)*125, y=40+Math.floor(i/4)*140; return `<rect x="${x}" y="${y}" width="112" height="120" rx="3" fill="${i===0?'#E2EAF3':'#fff'}" stroke="${i===0?DC:G}"/>${iso(x+28,y+62,30,24,26,i===0?'#DCE6F2':'#F3F2EE',i===0?DC:G)}<text x="${x+56}" y="${y+108}" text-anchor="middle" font-size="12" fill="${INKC}">${esc(n)}</text>`; }).join('');
   await showCard('Pick a typology',svgW(520,330,tiles),panel('Typology','Pick a typology','8 typologies, each pairing the data centre with a public program.',[['Picked','Emergency hub'],['Shares','backup power']]),2100);
   await showCard('Variant',svgW(520,330,`<polygon points="120,250 300,160 470,245 290,330" fill="none" stroke="${INKC}" stroke-dasharray="6 4"/>${iso(230,250,110,80,45,'#D9E7CF','#7FA36A')}${iso(230,205,110,80,55,'#DCE6F2',DC)}<text x="60" y="80" font-size="14" fill="${INKC}">stacked: the data hall over the refuge and clinic</text>`),
     panel('Typology','Variant','The variant sets where the refuge stands; the tool fits it to the lot.',[['Variant','stacked'],['Lot','339 1st Ave E']]),1800);
   const sl=(y,f,s,t)=>`<polygon points="120,${y} 260,${y-60} 400,${y} 260,${y+60}" fill="${f}" stroke="${s}"/><text x="420" y="${y+4}" font-size="13" fill="${INKC}">${t}</text>`;
   await showCard('Program diagram',svgW(520,330,sl(250,'#F6F5F2',G,'storey 1: refuge, day shelter, lobby')+sl(175,'#D9E7CF','#7FA36A','storey 2: clinic + support')+sl(100,'#DCE6F2',DC,'storey 3: data hall, 1.98 MW')),
     panel('Visualize','Program diagram','Who uses which floor, pulled apart by storey.',[['Storeys','3'],['Data hall','storey 3']]),2200); },
  
 async function(sc){ R.O.classList.remove('clear'); caption(sc.captions);
   const pg=(t,k)=>`<figure><div class="pg"><div class="ph">BEYOND DATA · ${esc(t.split(':')[0].toUpperCase())}</div><div class="pt">${esc(t.split(': ')[1]||t)}</div>${k===0?svgW(160,90,iso(50,60,40,30,30,'#DCE6F2',DC)):k===1?svgW(160,90,`<polygon points="20,15 140,10 145,80 15,85" fill="#E2EAF3" stroke="${DC}"/>`):svgW(160,90,'<rect x="10" y="20" width="140" height="6" fill="#ECEBE7"/><rect x="10" y="36" width="110" height="6" fill="#ECEBE7"/><rect x="10" y="52" width="125" height="6" fill="#ECEBE7"/>')}<div class="ln"></div><div class="ln s"></div><div class="ln"></div></div><figcaption>${esc(t.split(':')[0])}</figcaption></figure>`;
   stage(`<div class="f1i-pages"><div class="row">${sc.built_pages.map((t,i)=>pg(t,i%3)).join('')}</div></div>`); await wait(5000); },
  
 async function(sc){ R.O.classList.remove('clear'); caption(sc.captions);
   const st=stage(`<div class="f1i-src"><div class="fig"><span class="v">$101</span><span class="u">per kW of backup boiler</span><button class="tag" type="button" tabindex="-1">source</button></div>
     <div class="open">DEA Technology Data (Denmark), sheet 44, 2020 €, converted to Canadian dollars × 1.5782 · register econ_backup_plant · confidence 70 of 100: a coefficient from another context</div></div>`);
   await wait(1300); st.querySelector('.f1i-src').classList.add('on'); await wait(3600); },
  
 async function(sc){ R.O.classList.remove('clear'); caption(sc.captions);
   const col=(x,t,n,hl)=>{ let s=`<text x="${x}" y="24" font-size="12" fill="${G}">${t}</text>`; for(let i=0;i<n;i++) s+=`<rect x="${x}" y="${40+i*40}" width="150" height="30" rx="2" fill="#fff" stroke="${hl&&hl.includes(i)?ORG:GL}"/>`; return s; };
   const st=stage(`<div class="f1i-logic">${svgW(720,380,col(10,'How big it can be',8,[2,3])+col(190,'What it gives off',8,[1,4])+`<rect x="190" y="200" width="150" height="30" rx="2" fill="#fff" stroke="${INKC}" stroke-width="2"/><text x="265" y="220" text-anchor="middle" font-size="12" fill="${INKC}">Heat after heat pump</text>`+col(370,'Who is nearby',8,[])+col(550,'What it could become',8,[])+`<path d="M160 135 C 175 135, 175 215, 190 215 M160 175 C 175 175, 175 215, 190 215" fill="none" stroke="${ORG}"/>`)}
     <div class="node"><div class="k">What it gives off</div><h4>Heat available after heat pump</h4><p><b>How it is worked out</b><br>heat out = heat captured × COP ÷ (COP − 1)</p><p><b>Trust</b> 70 of 100: a peer-reviewed coefficient from another context</p><p><b>Sources</b><br>BCUC Order C-1-13 (TELUS Garden thermal energy system)</p></div></div>`);
   await wait(1500); st.querySelector('.f1i-logic').classList.add('on'); await wait(3600); },
 S_LIVE[10]
];
 
let SNAPCSS=null; const SNAP={};
const snapCss=()=>SNAPCSS||(SNAPCSS=fetch('f1/intro/snap/styles.json').then(r=>r.json()).catch(()=>[]).then(L=>{ const have=new Set([...document.querySelectorAll('head style')].map(s=>s.id?'#'+s.id:s.textContent));
  for(const x of L){ const k=x.id?'#'+x.id:x.t; if(have.has(k)) continue; const s=document.createElement('style'); if(x.id) s.id=x.id; s.setAttribute('data-f1i-snap',''); s.textContent=x.t; document.head.appendChild(s); } }));
const snap=id=>SNAP[id]||(SNAP[id]=fetch(`f1/intro/snap/${id}.html`).then(r=>r.ok?r.text():null).catch(()=>null));
const SNAPS=['res_find','res_next','mun_allowed','mun_yards','mun_approval','eng_fits','eng_district','arc_pick','arc_program','arc_styles','res_report','logic'];
function holdReal(){ const v=document.querySelector('#f1v:not(.f1i-frozen)'); if(v){ v.id='f1v-held'; v.style.visibility='hidden'; } const l=document.querySelector('#f1l:not(.f1i-frozen)'); if(l){ l.id='f1l-held'; l.style.visibility='hidden'; } }
function releaseReal(){ document.querySelectorAll('.f1i-frozen').forEach(e=>e.remove()); const v=document.getElementById('f1v-held'); if(v){ v.id='f1v'; v.style.visibility=''; } const l=document.getElementById('f1l-held'); if(l){ l.id='f1l'; l.style.visibility=''; } }
async function frozen(id){ await snapCss(); const h=await snap(id); if(!h||!R) return null; holdReal(); const t=document.createElement('template'); t.innerHTML=h.trim(); const el=t.content.firstElementChild;
  el.classList.add('f1i-frozen'); el.setAttribute('inert',''); el.setAttribute('aria-hidden','true'); el.style.opacity='0'; el.style.transition='opacity .28s';
  const old=[...document.querySelectorAll('.f1i-frozen')]; document.body.appendChild(el); try{ if(BD.f1svgMin) BD.f1svgMin(el.querySelector('.f1v-draw')||el); }catch(e){}
  requestAnimationFrame(()=>{ el.style.opacity='1'; }); setTimeout(()=>old.forEach(o=>o.remove()),300); await wait(R.still?0:320); return el; }
const fz=s=>{ const f=[...document.querySelectorAll('.f1i-frozen')].pop(); return f?f.querySelector(s):null; };
const fzStrip=re=>{ const f=[...document.querySelectorAll('.f1i-frozen')].pop(); return f?[...f.querySelectorAll('.f1v-strip [data-to]')].find(b=>re.test(b.textContent)):null; };
async function fview(id,sc){ R.O.classList.add('clear'); if(sc) caption(sc.captions,'dock'); body('f1i-strip',true); const el=await frozen(id); dockCaption(); return el; }
 
async function fstep(re,id){ const b=fzStrip(re); if(b&&!R.still) await point(b,true); await frozen(id); dockCaption(); }
 
async function lasso(){ const sv=fz('.f1d-svg svg')||fz('.f1v-draw svg'); if(!sv||R.still) return; const r=sv.getBoundingClientRect(), pts=[[.30,.30],[.62,.28],[.66,.55],[.40,.62],[.28,.48],[.30,.31]].map(([a,b])=>[r.left+r.width*a,r.top+r.height*b]);
  const d='M'+pts.map(p=>p.map(n=>n.toFixed(1)).join(' ')).join('L'), L=document.createElementNS('http://www.w3.org/2000/svg','svg'); L.setAttribute('class','f1i-lasso'); L.innerHTML=`<path d="${d}" fill="rgba(224,123,57,.10)" stroke="#E07B39" stroke-width="2" stroke-dasharray="1400" stroke-dashoffset="1400"/>`;
  R.O.appendChild(L); const lb=fz('[data-f1d="lasso"]'); if(lb) await point(lb,true); await wait(200); L.querySelector('path').style.transition='stroke-dashoffset 1.6s ease-in-out'; requestAnimationFrame(()=>{ L.querySelector('path').style.strokeDashoffset='0'; }); await wait(1900); }
 
async function turnPages(){ const box=fz('.f1r-pages')||fz('.f1v-draw'); const pg=[...((box&&box.querySelectorAll('.f1r-pg'))||[])].slice(0,3); if(!pg.length) return;
  pg.forEach((p,i)=>{ p.classList.add('f1i-page'); p.style.display=i?'none':''; }); for(let i=0;i+1<pg.length;i++){ await wait(1100); pg[i].classList.add('turn'); await wait(R.still?0:420); pg[i].style.display='none'; pg[i+1].style.display=''; pg[i+1].classList.add('in'); } await wait(900); }
 
async function openLegend(){ const d=fz('details.f1-trl'); if(!d) return; d.scrollIntoView({block:'center'}); dockCaption(); await point(d.querySelector('summary')||d,true); d.open=true; await wait(1200); const tg=fz('.f1-tr'); if(tg){ tg.scrollIntoView({block:'center'}); await point(tg); } await wait(1000); }
 
async function libPage(){ if(!BD.f1lib||!BD.f1lib.open||!R) return; try{ await BD.f1lib.open(); }catch(e){ return; } const W=document.getElementById('f1lib'); if(!W||!R) return;
  W.classList.add('f1i-frozen'); W.setAttribute('inert',''); W.setAttribute('aria-hidden','true'); W.style.zIndex='2290'; dockCaption(); await wait(R.still?0:2600); }
const S_REAL=[
 S_BUILT[0], S_BUILT[1], S_BUILT[2],
  
 async function(sc){ await fview('res_find',sc); await wait(1500); await fstep(/What it means next door/,'res_next'); await wait(1500); },
  
 async function(sc){ await fview('mun_allowed',sc); await wait(1200); await fstep(/Yards by edge/,'mun_yards'); await wait(1200); await fstep(/Approval process/,'mun_approval'); await wait(1500); },
  
 async function(sc){ await fview('eng_fits',sc); await wait(1200); await fstep(/Shared energy/,'eng_district'); await wait(300); await lasso(); await wait(1000); const l=R.O.querySelector('.f1i-lasso'); if(l) l.remove(); },
  
 async function(sc){ await fview('arc_pick',sc); await wait(1300); await fstep(/Program diagram/,'arc_program'); await wait(1300); await fstep(/Massing/,'arc_styles'); await wait(1400); await libPage(); },
  
 async function(sc){ await fview('res_report',sc); const p=fz('.f1r-pg'); if(p){ p.scrollIntoView({block:'start'}); dockCaption(); } await turnPages(); },
  
 async function(sc){ await fview('res_next',sc); await wait(600); await openLegend(); },
  
 async function(sc){ body('f1i-strip',false); R.O.classList.add('clear'); caption(sc.captions,'dock'); await snapCss(); const h=await snap('logic'); if(!h) return; holdReal();
   const t=document.createElement('template'); t.innerHTML=h.trim(); const el=t.content.firstElementChild; el.classList.add('f1i-frozen','f1i-closed'); el.setAttribute('inert',''); el.setAttribute('aria-hidden','true'); document.body.appendChild(el);
   const box=el.querySelector('.f1l-box'), sel=box&&box.querySelector('.lp.sel'); if(sel){ const br=box.getBoundingClientRect(), r=sel.getBoundingClientRect(); box.scrollLeft+=r.left-br.left-br.width/2+r.width/2; box.scrollTop+=r.top-br.top-br.height/2+r.height/2; }
   dockCaption(el.querySelector('.f1l-key')); await wait(900); if(sel) await point(sel.querySelector('rect')||sel,true); el.classList.remove('f1i-closed'); await wait(2400); },
  
 async function(sc){ releaseReal(); await S_BUILT[10](sc); }
];
 
const VO={on:false,muted:false,voice:null,ready:null,cur:null};
function voices(){ try{ return speechSynthesis.getVoices()||[]; }catch(e){ return []; } }
function pickVoice(){ const vs=voices().filter(v=>/^en([-_]|$)/i.test(v.lang||'')); const by=f=>vs.find(f);
  return by(v=>/Natural|Neural|Online/i.test(v.name)&&/en[-_]CA/i.test(v.lang))||by(v=>/Natural|Neural|Online/i.test(v.name))||by(v=>/Google/i.test(v.name))||by(v=>/Enhanced|Premium/i.test(v.name))||by(v=>/en[-_]CA/i.test(v.lang))||by(v=>/en[-_]US/i.test(v.lang))||by(v=>/en[-_]GB/i.test(v.lang))||vs[0]||null; }
function voiceReady(){ if(VO.ready) return VO.ready; VO.ready=new Promise(res=>{ if(!('speechSynthesis' in window)) return res(null); if(voices().length) return res(pickVoice());
  const t=setTimeout(()=>res(pickVoice()),1500); try{ speechSynthesis.addEventListener('voiceschanged',()=>{ clearTimeout(t); res(pickVoice()); },{once:true}); }catch(e){} }).then(v=>{ VO.voice=v; console.info('Beyond Data intro voice:',v?`${v.name} (${v.lang})`:'none: captions only'); return v; }); return VO.ready; }
function say(sc){ if(!VO.on||VO.muted||!sc) return Promise.resolve(); const text=(sc.captions||[]).join(' '), cap=Math.max(4000,text.split(/\s+/).length*520);
  if(sc.audio){ return new Promise(res=>{ const a=new Audio('f1/intro/audio/'+sc.audio); VO.cur=a; const t=setTimeout(res,cap+4000); a.onended=a.onerror=()=>{ clearTimeout(t); res(); }; a.play().catch(()=>{ clearTimeout(t); res(); }); }); }
  if(!VO.voice) return Promise.resolve();
  return new Promise(res=>{ try{ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.voice=VO.voice; u.lang=VO.voice.lang; u.rate=0.95; u.pitch=1; const t=setTimeout(res,cap); u.onend=u.onerror=()=>{ clearTimeout(t); res(); }; speechSynthesis.speak(u); }catch(e){ res(); } }); }
function hush(){ try{ speechSynthesis.cancel(); }catch(e){} if(VO.cur&&VO.cur.pause){ try{ VO.cur.pause(); }catch(e){} } VO.cur=null; }
function muteButton(O){ if(!VO.on) return; const b=document.createElement('button'); b.className='f1i-mute'; b.type='button'; const set=()=>{ b.setAttribute('aria-pressed',String(VO.muted)); b.textContent=VO.muted?'Sound off':'Sound on'; b.title=VO.muted?'Turn the voice on':'Turn the voice off'; };
  set(); b.addEventListener('click',e=>{ e.stopPropagation(); VO.muted=!VO.muted; if(VO.muted) hush(); set(); }); O.appendChild(b); }

const TYPN=['Emergency hub','Community pool','Heat cascade','Warm bath','Aquaponics','Food hub','Conservatory','Shelter + laundry'];    
const S=BD.F1FLAGS&&BD.F1FLAGS.introLive?S_LIVE:(BD.F1FLAGS&&BD.F1FLAGS.introBuilt?S_BUILT:S_REAL);    

const S_TXT=i=>TXT.scenes[i];
function skyline(labels){ const H=[64,98,76,120,58,142,88,70,110,92,0,84,128,66,104,150,72,96,60,118,86,100,74,132,90,62]; let s='', x=40; const base=300;
  H.forEach((h,i)=>{ if(i===10){ s+=`<rect class="dc" x="${x}" y="${base-96}" width="92" height="96"/>`; x+=100; return; } s+=`<rect x="${x}" y="${base-h}" width="26" height="${h}" fill="#A9ABAF"/>`; x+=34; });
  const cx=40+10*34+46, L=labels||['heat','space','power'], T=[[cx-220,380],[cx,390],[cx+220,380]];
  const rays=T.map(([tx,ty],i)=>`<g class="ray r${i+1}"><path d="M${cx+(i-1)*30} ${base} L${tx} ${ty-18}" stroke="${DC}" stroke-width="1.4" stroke-dasharray="4 4" fill="none"/><text x="${tx}" y="${ty}" text-anchor="middle" font-size="17" fill="${DC}">${esc(L[i])}</text></g>`).join('');
  return `<svg class="f1i-sky" viewBox="0 0 ${x+40} 400" role="img" aria-label="A skyline; one building, a data centre, in blue, with lines out to ${L.join(', ')}"><line x1="20" y1="${base}" x2="${x+20}" y2="${base}" stroke="#DDDEDF"/>${s}${rays}</svg>`; }
function countUp(st){ const t=RUN; st.querySelectorAll('.n[data-n]').forEach(el=>{ const n=+el.dataset.n, sp=el.querySelector('span'); if(!el.dataset.n||R.still) return; const t0=performance.now();
  const f=now=>{ if(!alive(t)) return; const k=Math.min(1,(now-t0)/1400), v=Math.round(n*(1-Math.pow(1-k,3))); el.firstChild.nodeValue=v.toLocaleString('en-CA'); if(k<1) requestAnimationFrame(f); }; requestAnimationFrame(f); }); }

 
function begin(still){ stop(true); RUN++; const hadV=!!$('#f1v'); R={still,i:0,O:overlay(still),opened:false,hadV,t:RUN,d:BD.f1d?BD.f1d.snap():null}; body('f1i-on',true); body('f1i-still',!!still); document.addEventListener('keydown',onKey,true); return R; }
async function play(opts){ if(reduced()) return still(); await text().catch(()=>null); if(!TXT) return; VO.on=!!(opts&&opts.voice===true);     VO.muted=false; if(VO.on) await voiceReady(); const me=begin(false), t=RUN; muteButton(me.O); counts(); cityMap('van').catch(()=>{}); cityMap('edm').catch(()=>{}); if(S===S_REAL){ snapCss(); SNAPS.forEach(snap); }
  const total=TXT.scenes.reduce((a,s)=>a+s.s,0), prog=me.O.querySelector('.f1i-prog'); prog.style.transition=`width ${total}s linear`; requestAnimationFrame(()=>{ prog.style.width='100%'; });
  try{ for(let i=0;i<S.length;i++){ if(!alive(t)) return; me.i=i; me.O.dataset.scene=i+1; await Promise.all([S[i](TXT.scenes[i]),say(TXT.scenes[i])]); }
    if(!alive(t)) return; me.O.classList.add('out'); await wait(800); stop(); }
  catch(e){ if(e!==STOP){ console.error('f1 intro',e); if(alive(t)) stop(); } } }
async function still(){ await text().catch(()=>null); if(!TXT) return; const me=begin(true), t=RUN;
  me.go=async i=>{ if(!alive(t)||i<0||i>=S.length) return; me.i=i; me.O.dataset.scene=i+1; const nav=me.O.querySelector('.f1i-nav');
    nav.querySelector('.no').textContent=`${i+1} / ${S.length} · ${TXT.scenes[i].title}`; nav.querySelector('[data-prev]').disabled=i===0;
    const nx=nav.querySelector('[data-next]'); nx.textContent=i===S.length-1?'Done':'Next'; if(i===S.length-1) nx.dataset.skip=''; else delete nx.dataset.skip;
    me.O.querySelector('.f1i-ptr').classList.remove('on'); me.O.classList.remove('clear');
    if(i<3||i===7||i===10){   body('f1i-strip',false); body('f1i-how',false); }
    const tk=me.tk=(me.tk||0)+1; try{ me.busy=true; await S[i](TXT.scenes[i]); }catch(e){ if(e!==STOP) console.error('f1 intro',e); } if(tk===me.tk) me.busy=false; };
  me.go(0); }
function stop(quiet){ if(!R) return; const me=R; R=null; hush(); VO.on=false; releaseReal(); try{ if(BD.f1d) BD.f1d.restore(me.d); }catch(e){}     RUN++; document.removeEventListener('keydown',onKey,true); me.O.remove();
  ['f1i-on','f1i-still','f1i-strip','f1i-how','f1i-fade','f1i-src'].forEach(c=>body(c,false)); const L=$('#f1'); if(L) L.classList.remove('f1i-zoom','go','f1i-ways');
  if(me.opened&&!me.hadV){ closeLogic(); const v=$('#f1v'); if(v) v.remove(); }
  if(!quiet){ const b=L&&L.querySelector('[data-go="intro"]'); if(b) b.focus({preventScroll:true}); } }
 
function first(){ if(firstDone) return; firstDone=true; let seen=false;
  try{ seen=localStorage.getItem(KEY)==='seen'; }catch(e){}
  if(seen||navigator.webdriver||window.BD_NO_INTRO||/[?&](old|nointro)\b/.test(location.search)) return;
  try{ localStorage.setItem(KEY,'seen'); }catch(e){}
  play({voice:false}); }    
BD.f1intro={play,still,stop,first,reset:()=>{ try{ localStorage.removeItem(KEY); }catch(e){} }};
if(document.getElementById('f1')) first();
})();

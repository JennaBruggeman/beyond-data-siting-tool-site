 
(function(){ const q=new URLSearchParams(location.search), o=(q.get('open')||'').toLowerCase(); if(!o) return;
  const tpl=o.startsWith('eng')?'engineering':o.startsWith('arch')?'architecture':null;     if(!tpl){ try{ const u=new URL(location.href); ['open','card','city','lot','addr'].forEach(k=>u.searchParams.delete(k)); history.replaceState(null,'',u.pathname+(u.search||'')+u.hash); }catch(e){} return; }
  const city=q.get('city')||'van', lot=q.get('lot')||'63819485', addr=q.get('addr')||(lot==='63819485'?'339 1st Ave E':''), card=+q.get('card')||0;
  let n=0; const go=()=>{ if(!(window.BD&&BD.f1&&BD.f1.openLot&&document.querySelector('#f1'))){ if(++n<100) setTimeout(go,100); return; }
    BD.f1.openLot(tpl,city,lot,addr); if(!card) return;
    let m=0; const pick=()=>{ const b=document.querySelectorAll('#f1v .f1v-strip button')[card-1]; if(b) b.click(); else if(++m<100) setTimeout(pick,100); }; setTimeout(pick,300); };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',go); else go(); })();

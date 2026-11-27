 
(function(){
const FILE=/(?:\b(?:tool|data|checks|register|redline|f1|l3|tiles)\/)*[\w.-]+\.(?:js|json|py|csv|html)\b/;
const PAREN=new RegExp('\\s*\\((?:[^()]*?'+FILE.source+'[^()]*)\\)','g');    
const BARE=new RegExp('\\s*'+FILE.source,'g');
const SKIP=/^(SCRIPT|STYLE|TEXTAREA|CODE|PRE)$/;
function clean(t){ if(!FILE.test(t)) return t; let s=t.replace(PAREN,m=>{ const inner=m.replace(/^\s*\(|\)$/g,''); const left=inner.replace(new RegExp(FILE.source,'g'),'').replace(/[\s,;:·]+/g,''); return left.length>2?m.replace(new RegExp('(?:,\\s*)?'+FILE.source,'g'),'').replace(/\(\s*,\s*/,'('):''; });
  s=s.replace(BARE,''); return s.replace(/\s{2,}/g,' ').replace(/\s+([.,;:)])/g,'$1').replace(/:\s*,\s*/g,': ').replace(/,\s*\./g,'.'); }
function walk(root){ const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentNode&&!SKIP.test(n.parentNode.nodeName)&&FILE.test(n.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT}); const L=[]; while(w.nextNode()) L.push(w.currentNode); for(const n of L){ const c=clean(n.nodeValue); if(c!==n.nodeValue) n.nodeValue=c; } }
 
const inSvg=n=>{ for(let e=n.nodeType===1?n:n.parentNode;e;e=e.parentNode){ if(e.nodeName==='svg'||e.nodeName==='SVG') return true; if(e===document.body) return false; } return false; };
let Q=new Set(), pending=false; const run=()=>{ pending=false; const q=[...Q]; Q.clear(); for(const n of q){ if(!n.isConnected||inSvg(n)) continue; if(n.nodeType===3){ if(FILE.test(n.nodeValue)){ const c=clean(n.nodeValue); if(c!==n.nodeValue) n.nodeValue=c; } } else if(n.nodeType===1) walk(n); } };
new MutationObserver(recs=>{ for(const r of recs){ if(r.type==='characterData') Q.add(r.target); else for(const n of r.addedNodes) if(n.nodeType===1?n.nodeName!=='svg'&&n.nodeName!=='SCRIPT'&&n.nodeName!=='STYLE':n.nodeType===3) Q.add(n); } if(Q.size&&!pending){ pending=true; requestAnimationFrame(run); } }).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
if(document.body) walk(document.body); else document.addEventListener("DOMContentLoaded",()=>walk(document.body));
window.BD=window.BD||{}; window.BD.f1scrub={clean};
})();

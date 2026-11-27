 
(function(){
const BD=window.BD=window.BD||{};
const ON=()=>{ const c=BD.f1&&BD.f1.cur?BD.f1.cur():null; return c==='engineering'||c==='municipal'; };
const SAID='not settled|not known|not tested|not in the tool yet|not modelled|not confirmed|not shown|assumed';
const R=[
  [/\s*[“"]\?[”"]\s*=\s*no source read\.?/g,''],
  [/\b(our reading)\s*(?:\(\?\)|\?)/gi,'$1, not confirmed'],
  [new RegExp('\\b('+SAID+')\\s*\\(\\?\\)','gi'),'$1'],
  [new RegExp('\\b('+SAID+')\\s+\\?','gi'),'$1'],
  [/\s*\(\?\)/g,' (not confirmed)'],
  [/^\s*\?\s*(?=(?:not|no)\b)/,''],
  [/(\S)\s+\?\s*(?=(?:not|no)\b)/g,'$1: '],
  [/(\S)\s+\?(?=\s*(?:$|[),.;:]))/g,'$1 (not confirmed)'],
  [/^\s*\?\s*$/,'not known'],
  [/^\s*\?\s+(\S.*?)\s*$/,'$1 not known']
];
const HAS=/(^|[\s(“"])\?/;
function plain(t){ if(!HAS.test(t)) return t; let s=t; for(const [re,to] of R) s=s.replace(re,to); return s; }
const inClosedDrawer=el=>{ for(let e=el;e&&e.id!=='f1v';e=e.parentElement){ if(e.classList&&e.classList.contains('f1r-pg')) return false; if(e.nodeName==='DETAILS'&&!e.open) return true; } return false; };
const inViewer=el=>!!(el&&el.closest&&el.closest('#f1v'));
 
function glyph(el){ if(!el.isConnected||el.textContent.trim()!=='?'||inClosedDrawer(el)) return; let nx=el.nextSibling; while(nx&&nx.nodeType===3&&!nx.nodeValue.trim()) nx=nx.nextSibling;
  const said=nx&&((nx.nodeType===1&&nx.textContent.trim())||(nx.nodeType===3&&nx.nodeValue.trim()));
  if(said){ const sp=el.previousSibling; el.remove(); if(nx.nodeType===3) nx.nodeValue=nx.nodeValue.replace(/^\s+/,sp&&sp.nodeType===3&&/\S$/.test(sp.nodeValue)?' ':''); }
  else { el.textContent='not known'; el.removeAttribute('title'); } }
function text(n){ const el=n.parentElement; if(!el||/^(SCRIPT|STYLE|TEXTAREA)$/.test(el.nodeName)||inClosedDrawer(el)) return; if(el.classList.contains('f1c-q')) return glyph(el);
  if(el.nodeName.toLowerCase()==='text'&&n.nodeValue.trim()==='?'){ const nx=el.nextElementSibling; if(nx&&nx.nodeName.toLowerCase()==='text'&&nx.textContent.trim()){ n.nodeValue=''; return; } }
  const c=plain(n.nodeValue); if(c!==n.nodeValue) n.nodeValue=c; }
function walk(root){ if(root.nodeType===3) return text(root); root.querySelectorAll&&root.querySelectorAll('.f1c-q').forEach(glyph);
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.nodeValue.includes('?')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT}); const L=[]; while(w.nextNode()) L.push(w.currentNode); L.forEach(text); }
let Q=new Set(), pending=false;
const run=()=>{ pending=false; const q=[...Q]; Q.clear(); if(!ON()) return; for(const n of q) if(n.isConnected&&inViewer(n.nodeType===1?n:n.parentElement)) walk(n); };
new MutationObserver(recs=>{ for(const r of recs){ if(r.type==='characterData'){ if(r.target.nodeValue.includes('?')) Q.add(r.target); } else for(const n of r.addedNodes) if(n.nodeType===1?!/^(SCRIPT|STYLE)$/.test(n.nodeName):n.nodeType===3) Q.add(n); }
  if(Q.size&&!pending){ pending=true; requestAnimationFrame(run); } }).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
BD.f1noq={plain};
})();

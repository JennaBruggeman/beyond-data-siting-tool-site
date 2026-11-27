 
(function(){
'use strict';
const BD=window.BD=window.BD||{};
const INK='#1E2A47', INK2='#4A5672', INK3='#6B7590', GREY='#B9BEC6', ORANGE='#F28C38', RULE='#D9DDE3';
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const T=(x,y,s,size,w,fill,anchor)=>`<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${size||12}" font-weight="${w||400}" fill="${fill||INK}" text-anchor="${anchor||'start'}">${esc(s)}</text>`;
function para(x,y,s,size,width,fill,lh,w){ lh=lh||size*1.4; const cw=size*0.53, words=String(s||'').split(/\s+/), out=[]; let line='';
  for(const wd of words){ if(line&&(line.length+wd.length+1)>width/cw){ out.push(line); line=wd; } else line=(line+' '+wd).trim(); } if(line) out.push(line);
  return [out.map((l,i)=>T(x,y+i*lh,l,size,w||400,fill||INK2)).join(''), y+out.length*lh]; }
const PATHW={permitted:['Permitted','As of right'],conditional:['Conditional','The City decides'],rezoning:['Rezoning','Council decides']};
function pathOf(x){ const P=BD.f1PROC; if(P&&x.status) return P.pathOf(x); const w=(x.status&&x.status.word)||''; return /permitted/.test(w)?'permitted':/conditional|discretionary/.test(w)?'conditional':'rezoning'; }
 
function route(x,w){ const P=BD.f1PROC, city=x.city==='edm'?'edm':'van', D=P.PROC[city], path=pathOf(x), o=[];
  const cond=city==='edm'?'Discretionary':'Conditional';
  const PATHS=[['permitted','Permitted','As of right','No decision on the use; a development permit is still needed.'],['conditional',cond,'The City decides',D.decides+'.'],['rezoning','Rezoning','Council decides','After a public hearing.']];
  const zoneLine=path==='rezoning'?`Zone ${x.zone||'?'} does not list a data centre`:`Zone ${x.zone||'?'} lists a data centre as ${path==='permitted'?'a permitted':city==='edm'?'a discretionary':'a conditional'} use`;
  let y=20; o.push(T(0,y,zoneLine,13,600,INK)); const cw=(w-40)/3, ty=y+26, by=y+70, onK=PATHS.findIndex(p=>p[0]===path), tx=onK*(cw+20)+cw/2;
  o.push(`<line x1="${(cw/2).toFixed(1)}" y1="${ty+18}" x2="${(2*(cw+20)+cw/2).toFixed(1)}" y2="${ty+18}" stroke="${GREY}" stroke-width="1.4"/><line x1="${tx.toFixed(1)}" y1="${ty}" x2="${tx.toFixed(1)}" y2="${ty+18}" stroke="${INK}" stroke-width="2"/>`);
  PATHS.forEach(([id,t,who,note],k)=>{ const on=id===path, bx=k*(cw+20);
    o.push(`<line x1="${(bx+cw/2).toFixed(1)}" y1="${ty+18}" x2="${(bx+cw/2).toFixed(1)}" y2="${by-8}" stroke="${on?INK:GREY}" stroke-width="${on?2:1.4}"/><rect x="${bx.toFixed(1)}" y="${by-8}" width="${cw.toFixed(1)}" height="112" rx="4" fill="#FFFFFF" stroke="${on?INK:RULE}" stroke-width="${on?1.8:1}"/>`);
    if(on) o.push(`<rect x="${bx.toFixed(1)}" y="${by-8}" width="4" height="112" fill="${INK}"/>`+T(bx+16,by+12,'This lot',12,600,INK));
    o.push(T(bx+16,by+34,t,17,600,on?INK:INK3)+T(bx+16,by+54,who,13,400,on?INK2:INK3)); const [p_]=para(bx+16,by+74,note,12,cw-32,INK3,16); o.push(p_); });
   
  const all=path==='rezoning'?D.rezone:D.steps, ap=all.find(s=>s.n==='Appeal'), steps=all.filter(s=>s.n!=='Appeal'), n=steps.length;
  const sy=by+150, cx=onK*(cw+20)+cw/2, gap=20, sw=(w-(n-1)*gap)/n;
  o.push(`<line x1="${cx.toFixed(1)}" y1="${by+104}" x2="${cx.toFixed(1)}" y2="${sy-26}" stroke="${INK}" stroke-width="2"/><line x1="7" y1="${sy-26}" x2="${cx.toFixed(1)}" y2="${sy-26}" stroke="${INK}" stroke-width="2"/><line x1="7" y1="${sy-26}" x2="7" y2="${sy}" stroke="${INK}" stroke-width="2"/><line x1="7" y1="${sy}" x2="${((n-1)*(sw+gap)+7).toFixed(1)}" y2="${sy}" stroke="${INK}" stroke-width="2"/>`);
  const node=(x0,y0,ww,s,num)=>{ let r=`<circle cx="${(x0+7).toFixed(1)}" cy="${y0}" r="7" fill="${INK}"/>`, yy=y0+30; if(num){ r+=T(x0,yy-2,String(num),12,400,INK3); yy+=16; }
    let [p_,y2]=para(x0,yy,s.n,15,ww,INK,null,600); r+=p_; [p_,y2]=para(x0,y2+2,s.w,13,ww,INK2,18); r+=p_; y2+=4; [p_,y2]=para(x0,y2,s.t,12,ww,INK3,17); r+=p_; [p_,y2]=para(x0,y2+6,'Source: '+(BD.f1cards&&BD.f1cards.pubFull?BD.f1cards.pubFull(s.c):s.c),12,ww,INK3,16); r+=p_; return [r,y2+6]; };    
  const bottoms=[]; steps.forEach((s,k)=>{ const [r,yb]=node(k*(sw+gap),sy,sw-6,s,k+1); o.push(r); bottoms.push(yb); });
  let yEnd=Math.max(...bottoms);
  const di=steps.findIndex(s=>/^Decision|decides/i.test(s.n));
  if(ap&&di>=0){ const dx=di*(sw+gap)+7, ay=yEnd+40; o.push(`<path d="M${dx.toFixed(1)} ${bottoms[di]+6}L${dx.toFixed(1)} ${ay-8}" stroke="${INK}" stroke-width="1.6" stroke-dasharray="6 4"/>`+T(dx+8,ay-18,city==='van'?'if the owner appeals the decision':'if the decision is appealed',12,400,INK3));
    const [r,yb]=node(dx-7,ay,Math.min(sw*1.8,w-dx),ap,null); o.push(r); yEnd=yb; }
  return {svg:`<svg viewBox="0 -6 ${w} ${Math.ceil(yEnd+10)}" width="100%" style="display:block;max-width:${w}px" role="img" aria-label="Who approves a data centre on this lot, in order" font-family="IBM Plex Sans, system-ui, sans-serif">${o.join('')}</svg>`,path,D,city}; }
function chips(tags){ return `<div class="apv-chips">${tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div>`; }
async function tags(x,path){ const t=[`${path==='permitted'?'Permitted use':path==='conditional'?(x.city==='edm'?'Discretionary use':'Conditional use'):'Needs a rezoning'}, zone ${x.zone||'?'}`]; if(x.zone==='I-3') t.push('Sub-area A');
  let b=null; try{ b=BD.f1best?await BD.f1best.forLot(x):null; }catch(e){} if(b&&b.source!=='rough'){ let ha=null; try{ const pd=BD.f1best.planData?await BD.f1best.planData(b,x):null; ha=pd&&pd.heightApproval; }catch(e){}
    t.push(ha&&ha.height!=null&&ha.limitOutright!=null?`${ha.needed?'Needs height approval':'No height approval'}: ${(+ha.height).toFixed(0)} m, limit ${ha.limitOutright} m`:b.needsHeightApproval?'Needs height approval':'No height approval needed'); }    
  return t; }
function say(city,path){ const S=BD.f1PROC.SAY, D=S[city]; if(!D) return '';
  return `<div class="apv-say"><h4>Have a say</h4><p>${esc(path==='rezoning'?S.rezone:D.short)}</p><details><summary>How, step by step, with sources</summary><ol>${D.lines.map(([h,t,s])=>`<li><b>${esc(h)}.</b> ${esc(t)} <span class="apv-src">Source: ${esc(s)}.</span></li>`).join('')}</ol>${D.link?`<p><a href="${esc(D.link)}" target="_blank" rel="noopener">Shape Your City: development applications</a></p>`:''}</details></div>`; }
const CSS=`.apv-chips{display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 0}.apv-chips span{border:1.2px solid #1E2A47;border-radius:14px;padding:4px 12px;font-size:12px;font-weight:600;color:#1E2A47;background:#fff}
.apv-say{background:#F4F5F7;border-top:3px solid #1E2A47;padding:14px 18px;margin-top:6px;color:#1E2A47}.apv-say h4{margin:0 0 6px;font-size:18px;font-weight:600}.apv-say p{margin:0 0 6px;font-size:13px;line-height:1.45}
.apv-say summary{cursor:pointer;font-size:13px;font-weight:600}.apv-say ol{margin:8px 0 0;padding-left:18px;font-size:12.5px;line-height:1.45}.apv-say li{margin:0 0 6px}.apv-src{color:#1E2A47;opacity:.8;font-size:12px}.apv-say a{color:#1E2A47}
.f1c-key2:has(.apv-chips)>h4{display:none}.apv-h{font-size:13px;font-weight:600;margin:0 0 6px;color:#1E2A47}`;
function css(){ if(document.getElementById('apv-css')) return; const s=document.createElement('style'); s.id='apv-css'; s.textContent=CSS; document.head.appendChild(s); }
async function build(x){ if(!BD.f1PROC) return {draw:'<p class="f1v-empty">Approval steps are not loaded.</p>',lead:''}; css();
  const R=route(x,960), D=R.D, path=R.path, tg=await tags(x,path), P=BD.f1PROC;
  const lead=path==='rezoning'?`A data centre here needs a rezoning: Council decides, after a public hearing. Then the development permit steps follow.`
    :path==='permitted'?(R.city==='edm'?'A data centre here is a permitted use: the Development Planner must approve a permit that meets the bylaw. Neighbours can appeal only if a rule was varied.':'A data centre here is a permitted use: a development permit is still needed.')
    :'A data centre here is a conditional use: the City decides, no rezoning needed. Neighbours may be told; the owner can appeal the decision.';
  return {draw:R.svg,lead,hero:[{v:PATHW[path][0]==='Conditional'&&R.city==='edm'?'Discretionary':PATHW[path][0],l:'path for this lot'},{v:D.appealWin,l:'to appeal a decision'}],
    keyHtml:`<h4 class="apv-h">This layout</h4>${chips(tg)}${say(R.city,path)}`,rows:[],
    src:[R.city==='van'?'Steps, deciders, notice and appeal: Vancouver Zoning and Development By-law Section 4 (May 2026 consolidation; clauses as named); City of Vancouver development permit, Development Permit Board and Board of Variance pages (read 23 Nov 2026); Board of Variance By-law 10200; Vancouver Charter ss. 559.07, 573. The order of steps is our reading.':'Steps, deciders, notice and appeal: City of Edmonton Zoning Bylaw 20001 ss. 7.100, 7.160, 7.170 (adopted text); Municipal Government Act RSA 2000 c. M-26 ss. 685, 686 (current to 1 Sep 2026). The order of steps is our reading.'],
    missing:['time to decision (no sourced figure)']}; }
 
(function wire(n){ const C=BD.f1cards; if(!C||!C.add){ if((n||0)<100) setTimeout(()=>wire((n||0)+1),100); return; } C.add('architecture','Who approves it',{build}); })();
 
async function page(x){ if(!BD.f1PROC) return null; const R=route(x,1080), tg=await tags(x,R.path), S=BD.f1PROC.SAY[R.city];
  const sayL=R.path==='rezoning'?BD.f1PROC.SAY.rezone:S.short;
  return {sec:'Who approves it',hero:R.svg,cap:'Who approves a data centre on this lot, in what order, and where neighbours and the owner come in.',
    figs:[[R.path==='conditional'&&R.city==='edm'?'Discretionary':PATHW[R.path][0],'path for this lot'],[R.D.appealWin,'to appeal a decision']],
    key:`<div style="font-size:15px;line-height:1.5"><p style="margin:0 0 8px"><b>This layout:</b> ${tg.map(esc).join(' · ')}</p><p style="margin:0;padding:12px 14px;background:#F4F5F7;border-top:3px solid ${INK}"><b>Have a say.</b> ${esc(sayL)}</p></div>`,
    src:R.city==='van'?'Clauses: Vancouver Zoning and Development By-law s. 4 and the zone schedule as named; By-law 10200 (appeal); Vancouver Charter; City of Vancouver development permit pages (read 23 Nov 2026).':'Clauses: City of Edmonton Zoning Bylaw 20001 ss. 7.100, 7.160, 7.170; Municipal Government Act ss. 685, 686 (current to 1 Sep 2026).'}; }
BD.f1approvals={route,build,say,tags,page};
})();

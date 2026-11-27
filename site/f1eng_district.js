 
(function(){
'use strict';
const BD=window.BD, C=BD.f1cards, K=C.K, esc=C.esc, T='engineering', NS='f1d-';
const RANGE=500, LASSO_MAX=400;

 
const SX={
   
  kwhm2:{residential:109,office:125,retail:147,education:137,health:306,accommodation:242,recreation:181,commercial:159,industrial:150},    
   
  kwhm2AB:{residential:109,office:315,retail:412,education:363,health:652,accommodation:612,recreation:405,commercial:389,industrial:379},
  lowConf:{industrial:true},
  eff:[0.80,0.90],    
  pipeCA:[1850,7000], pipeMid:3650,    
  pipe4:5300,    
  pipeEU:[1038,2620],    
  levyVan:{ets:123873,kw:146},
  feeEdm:22.24,    
  backupKw:101,    
  hpB:{kw:1540,scop:2.99,life:20},    
  loss:{k:0.17,max:0.6},    
   
  flhNet:{van:[2576,2681],edm:[2576,2681]},
  boilerKw:152,        
  tariff:{van:{name:'False Creek NEU (City of Vancouver), 2026',energy:65.17,allIn:128,allInH:2000,allInR:[107,149],allInRH:[3000,1500],src:'RTS 18251 (Council 12 Nov 2025), Table 1: energy $65.172/MWh; capacity levy $10.466 per kW of peak a month; all-in $128/MWh at 2,000 full-load hours a year ($107 at 3,000 h, $149 at 1,500 h; our arithmetic, the hours our assumption)'},
          edm:{name:'Blatchford Renewable Energy (City of Edmonton), 2026',energy:35.80,allIn:115,allInH:2000,src:'blatchfordutility.ca 2026 rates: $0.0358/kWh variable; about $115/MWh all-in at 2,000 h (our arithmetic)'}},
  baseShare:[[0.30,0.90],[0.35,0.95],[0.40,0.975],[0.45,0.99]],    
  lhd:{poor:0.75,good:1.5},    
  supply:{van:65,edm:null},    
  neuSplit:[0.70,0.30],    
  ets:[[13940,'6 × 3 m'],[23230,'6 × 4 m'],[Infinity,'set by the NEU Engineer']]    
};
const PH=t=>`<span class="${NS}ph" title="placeholder: not sourced yet">${esc(t)} ?</span>`;    

 
if(!document.getElementById('f1d-css')){ const st=document.createElement('style'); st.id='f1d-css'; st.textContent=`
.${NS}wrap{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(300px,1fr);gap:22px;width:100%;align-items:start}
@media (max-width:1100px){.${NS}wrap{grid-template-columns:1fr}}
.${NS}map svg{width:100%;height:auto;display:block}
.${NS}bar{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;font-size:12.5px;color:var(--f-ink2);margin-bottom:8px}
.${NS}bar button{font:inherit;font-size:12.5px;border:1px solid var(--f-rule);background:#fff;border-radius:4px;padding:5px 10px;cursor:pointer;color:var(--f-ink)}
.${NS}bar button[aria-pressed="true"]{background:var(--f-ink);color:#fff;border-color:var(--f-ink)}
.${NS}bar input{font:inherit;width:64px;padding:4px 6px;border:1px solid var(--f-rule);border-radius:4px}
.${NS}bar select{font:inherit;padding:4px 6px;border:1px solid var(--f-rule);border-radius:4px;background:#fff}
.${NS}key{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12px;color:var(--f-ink2);margin-top:8px}
.${NS}key i{display:inline-block;width:12px;height:10px;margin-right:5px;vertical-align:middle;border:1px solid rgba(0,0,0,.15)}
.${NS}panel{font-size:12px;line-height:1.4;color:var(--f-ink2);max-height:760px;overflow:auto;padding-right:4px}
.${NS}panel h4{font-size:12px;font-weight:500;color:var(--f-ink);margin:14px 0 4px;letter-spacing:.02em}
.${NS}panel table{width:100%;border-collapse:collapse;table-layout:fixed}
.${NS}panel td{padding:3px 0;border-bottom:1px solid var(--f-hair);vertical-align:top;font-size:12px;line-height:1.35;color:var(--f-ink2)}
.${NS}panel td.r{text-align:right;padding-left:8px;color:var(--f-ink);width:46%;overflow-wrap:anywhere}
.${NS}panel .two td.r{width:34%}
.${NS}verdict{margin:10px 0 0;padding:8px 10px;border-left:3px solid var(--f-ink);background:#FAFAF8;color:var(--f-ink)}
.${NS}verdict b{font-weight:500}
.${NS}ph{color:#CC746C}
.${NS}note{font-size:12px;color:var(--f-mute);margin:6px 0 0}
.${NS}lhint{display:inline-block;margin-left:10px;font-size:12.5px;color:#7A3A12;font-weight:500}.${NS}rsay{display:block;font-size:12px;color:#33363A;margin:4px 0 0 0;flex-basis:100%}.${NS}mapkey{margin:6px 0 8px;font-size:12px;line-height:1.5;color:#33363A}.${NS}mapkey b{font-weight:500;color:#16181B}
.${NS}bcard{border:1px solid #16181B;padding:10px 12px;margin:0 0 14px;background:#fff;font-size:13px}.${NS}bcard .h{font-size:12px;color:#66696E;margin-bottom:6px}.${NS}bcard .r{display:flex;justify-content:space-between;gap:12px;padding:4px 0;border-top:1px solid #EFEFEE}.${NS}bcard .r span{color:#66696E}.${NS}bcard .r b{font-weight:400;text-align:right}.${NS}bcard button{margin-top:8px;font:inherit;font-size:12px;background:none;border:0;text-decoration:underline;cursor:pointer;padding:0}
.${NS}more{margin-top:10px}.${NS}more>summary{cursor:pointer;font-size:12.5px;color:var(--f-ink);padding:6px 0;border-top:1px solid var(--f-rule)}
.${NS}term{text-decoration:underline dotted;text-underline-offset:2px;cursor:help}
.${NS}disc{font-size:12px;color:var(--f-mute);margin-top:12px;border-top:1px solid var(--f-rule);padding-top:8px}
.${NS}map [data-lasso] .f1m-wrap>svg{cursor:crosshair}`; document.head.appendChild(st); }

 
const n0=v=>Math.round(v).toLocaleString('en-CA'), n1=v=>(Math.round(v*10)/10).toLocaleString('en-CA'), money=v=>'$'+n0(v), mill=v=>v>=1e6?'$'+(v/1e6).toFixed(1)+' M':'$'+n0(v/1e3)+' k';
const rg=(a,f,u)=>{ f=f||n0; const x=f(a[0]), y=f(a[1]); return (x===y?x:x+'–'+y)+(u?' '+u:''); };    
const pip=(x,y,Q)=>{ let c=false; for(let i=0,j=Q.length-1;i<Q.length;j=i++){ const a=Q[i], b=Q[j]; if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) c=!c; } return c; };
const pipFlat=(x,y,r)=>{ let c=false; for(let i=0,j=r.length-2;i<r.length;j=i,i+=2){ if((r[i+1]>y)!==(r[j+1]>y)&&x<(r[j]-r[i])*(y-r[i+1])/(r[j+1]-r[i+1])+r[i]) c=!c; } return c; };
const crf=(i,n)=>i*Math.pow(1+i,n)/(Math.pow(1+i,n)-1);
const USE_NAME={residential:'Residential',commercial:'Commercial (all)',office:'Office',retail:'Retail',education:'School or campus',health:'Health care',accommodation:'Hotel',recreation:'Recreation',industrial:'Industrial',cd:'Comprehensive (CD-1)',institutional:'Public service',unknown:'Unknown'};
 
function useOf(city,zone){ const z=String(zone||'').toUpperCase().trim(); if(!z) return 'unknown';
  if(city==='van'){ if(/^(RS|RT|RM|FM|RA|R1|RR)/.test(z)) return 'residential'; if(/^(C-|C\d|FC|DD|HA|CWD|MC)/.test(z)) return 'commercial'; if(/^(I-|IC|M-)/.test(z)) return 'industrial'; if(/^CD/.test(z)) return 'cd'; return 'unknown'; }
  if(/^(RS|RSF|RSM|RM|RL|RH|RR|RF)/.test(z)) return 'residential'; if(/^(MU|CN|CG|CB|CSC|UW)/.test(z)) return 'commercial'; if(/^(IM|IL|IH|BE|BP)/.test(z)) return 'industrial'; if(/^(PS|PSN|US|UI)/.test(z)) return 'institutional'; if(/^DC/.test(z)) return 'cd'; return 'unknown'; }
const anchorUse={hospital:'health',campus:'education',school:'education',pool:'recreation',rink:'recreation',housing:'residential',hotel:'accommodation'};
const RAMP=[[0,'#ECE6F4'],[100,'#D5C8E8'],[300,'#B39DD3'],[800,'#8C6CBA'],[2000,'#5B3F8C']]    , NOEST='#E2E1DD';
const rampOf=v=>{ let c=RAMP[0][1]; for(const [t,col] of RAMP) if(v>=t) c=col; return c; };

 
const COOL={air:'air-cooled',plate:'liquid to the chip',immersion:'immersion'};
const DS={key:null,mw:null,cool:null,layer:'demand',inclRetro:false,view:'2d',lasso:false,sel:null,poly:null,data:null};

 
async function gather(x){ const e=BD.eng, f=e.siteFacts(), city=f.city, key=city+'|'+f.c.join(','); if(DS.data&&DS.data.key===key) return DS.data;
  const [sx,sy]=f.c; const m=BD.S.meta&&BD.S.meta[city]; const T_=m?m.T:1500, keys=[];
  for(let i=Math.floor((sx-RANGE)/T_);i<=Math.floor((sx+RANGE)/T_);i++) for(let j=Math.floor((sy-RANGE)/T_);j<=Math.floor((sy+RANGE)/T_);j++) keys.push(i+'_'+j);
  const tiles=(await Promise.all(keys.map(k=>BD.loadTile(city,k).catch(()=>null)))).filter(Boolean);
   
  const pars=[]; for(const t of tiles) for(const p of t.par||[]){ const b=p.bb; if(!b||b[2]<sx-RANGE||b[0]>sx+RANGE||b[3]<sy-RANGE||b[1]>sy+RANGE) continue;
      const id=p.ids&&p.ids.length?p.ids[0]:p.id, a=t.A&&t.A[id]; pars.push({b,r:p.r,zone:a?C.zoneKey(city,a):''}); }
  const B=[]; const seen=new Set(); let ownOut=0;
   
  const OWNR=BD.S.sel&&BD.S.sel.ring&&BD.S.sel.ring.length>5?BD.S.sel.ring:null;
  for(const t of tiles) for(const q of t.bld||[]){ const c=q.c||BD.centroid(q.r), k=c[0].toFixed(1)+','+c[1].toFixed(1); if(seen.has(k)) continue; seen.add(k);
    if(OWNR&&pipFlat(c[0],c[1],OWNR)){ ownOut++; continue; }
    if(Math.hypot(c[0]-sx,c[1]-sy)>RANGE) continue; if(city==='van'&&q.f===3) continue;    
    const par=pars.find(P=>c[0]>=P.b[0]&&c[0]<=P.b[2]&&c[1]>=P.b[1]&&c[1]<=P.b[3]&&pipFlat(c[0],c[1],P.r)), use=useOf(city,par&&par.zone);
    const hOk=q.h>0&&!(city==='edm'&&q.f===6), st=hOk?Math.max(1,Math.round(q.h/3.5)):1, gfa=(q.a||0)*st, I=(city==='edm'?SX.kwhm2AB:SX.kwhm2)[use]||null;
    const heat=I?[gfa*I*SX.eff[0]/1000,gfa*I*SX.eff[1]/1000]:null;    
     
    const ready=use==='residential'?'retrofit':'unknown';
    B.push({r:q.r,c,a:q.a||0,h:q.h,st,stEst:!hOk,gfa,use,zone:par&&par.zone,heat,ht:'unknown',ready,readyEst:true,low:!!SX.lowConf[use]&&city==='van'}); }
   
  const d=await e.loadRecv(city), nets=e.netsAt(f,d); const A=d.pts.filter(p=>p.x!=null&&Math.hypot(p.x-sx,p.y-sy)<=RANGE).map(p=>Object.assign({},p));
  for(const p of A){ const own=B.find(b=>pipFlat(p.x,p.y,b.r)); if(!own) continue; own.anchor=p; if(p.t==='net'||p.t==='den'){ own.ht='hydronic'; own.ready='ready'; own.readyEst=false; }
     
    try{ const ec=BD.heatEcon(f,Object.assign({},p),null); if(ec&&ec.demand){ own.heat=[ec.demandLo||ec.demand,ec.demand]; own.heatSrc='anchor'; } }catch(e){} }    
  const RT=await BD.routeTree(f);
  return DS.data={key,f,city,B,A,nets,RT,e,tiles:tiles.length}; }

 
function offerFor(D,mw,cool){ const ck=mw+'|'+cool; D._of=D._of||{}; if(D._of[ck]) return D._of[ck]; return D._of[ck]=offer0(D,mw,cool); }    
function offer0(D,mw,cool){ const e=D.e, R=e.R; const r=e.calc({mw,recover:true,to:'near'},D.f,[],D.nets);
  if(cool==='air'||cool==='immersion'){ const cap=[r.itMWhR[0],r.itMWhR[1]]; return {avail:[cap[0]*R.cop[1]/(R.cop[1]-1),cap[1]*R.cop[0]/(R.cop[0]-1)],it:r.itMWhR,note:cool==='air'?'air-cooled: heat drawn from the hall’s exhaust air by heat pumps (option A)':'immersion: all heat in liquid'}; }
  return {avail:r.avail,it:r.itMWhR,note:'liquid to the chip: the captured share in liquid'}; }

 
function routeOf(D,pts){ const RT=D.RT; if(!RT) return null; const G=RT.G, Tt=RT.T, segs=new Map(); let tails=0;
  const near=(x,y)=>{ let b=-1,bd=1e18; for(let i=0;i<G.xy.length;i+=2){ const dd=(G.xy[i]-x)**2+(G.xy[i+1]-y)**2; if(dd<bd){ bd=dd; b=i/2; } } return [b,Math.sqrt(bd)]; };
  D._nn=D._nn||new Map();
  for(const p of pts){ const pk=p[0]+','+p[1]; let nd=D._nn.get(pk); if(!nd){ nd=near(p[0],p[1]); D._nn.set(pk,nd); } const [n,dn]=nd; if(!isFinite(Tt.dist[n])) continue; tails+=dn; let k=n; while(k>=0&&k!==RT.s){ const pr=Tt.prev[k]; if(pr<0) break; const key=Math.min(k,pr)+'-'+Math.max(k,pr); if(!segs.has(key)) segs.set(key,[k,pr,Math.hypot(G.xy[2*k]-G.xy[2*pr],G.xy[2*k+1]-G.xy[2*pr+1])]); k=pr; } }
  let len=RT.ds+tails; for(const s of segs.values()) len+=s[2];
  return {len,segs:[...segs.values()].map(s=>[[G.xy[2*s[0]],G.xy[2*s[0]+1]],[G.xy[2*s[1]],G.xy[2*s[1]+1]]]),start:[G.xy[2*RT.s],G.xy[2*RT.s+1]]}; }

 
function breakdown(D,cl0,mw,cool){ const city=D.city, E=BD.ECON, R=D.e.R, of=offerFor(D,mw,cool);
  const retro=cl0.bld.filter(b=>b.ready==='retrofit'), cl=DS.inclRetro?cl0:{bld:cl0.bld.filter(b=>b.ready!=='retrofit')}, retroOut=DS.inclRetro?0:retro.length;
  const retroMWh=[retro.reduce((t,b)=>t+(b.heat?b.heat[0]:0),0),retro.reduce((t,b)=>t+(b.heat?b.heat[1]:0),0)];
  const bs=cl.bld.filter(b=>b.heat), dem=[bs.reduce((t,b)=>t+b.heat[0],0),bs.reduce((t,b)=>t+b.heat[1],0)], noEst=cl.bld.length-bs.length;
   
  const gfaAll=cl.bld.reduce((t,b)=>t+(b.gfa||0),0), gfaUn=cl.bld.filter(b=>!b.heat).reduce((t,b)=>t+(b.gfa||0),0), unFrac=gfaAll>0?gfaUn/gfaAll:0, partial=unFrac>0.5, nLow=bs.filter(b=>b.low).length;
   
  const flh=(SX.flhNet&&SX.flhNet[city])||(E.hpFLHfull&&E.hpFLHfull[city])||[3200,4500], peak=[dem[0]/flh[1],dem[1]/flh[0]];    
  const dcMW=[of.avail[0]/8760,of.avail[1]/8760], shareP=[dcMW[0]/Math.max(1e-9,peak[1]),dcMW[1]/Math.max(1e-9,peak[0])];
  const annualShare=s=>{ const T_=SX.baseShare; if(s>=T_[T_.length-1][0]) return T_[T_.length-1][1]; if(s>=T_[0][0]){ for(let i=0;i+1<T_.length;i++) if(s<=T_[i+1][0]) return T_[i][1]+(T_[i+1][1]-T_[i][1])*(s-T_[i][0])/(T_[i+1][0]-T_[i][0]); } return null; };    
  const sA=[annualShare(shareP[0]),annualShare(shareP[1])];
  const dcH=[Math.min(of.avail[0],dem[0]*(sA[0]!=null?sA[0]:1)),Math.min(of.avail[1],dem[1]*(sA[1]!=null?sA[1]:1))];    
  const rt=routeOf(D,cl.bld.map(b=>b.c)); const L=rt?rt.len:null, lhd=L?[dcH[0]/L,dcH[1]/L]:null;
  const lossF=lhd?lhd.map(v=>v>0?Math.min(SX.loss.max,SX.loss.k/Math.sqrt(v)):0):[0,0], del=[dcH[0]*(1-lossF[0]),dcH[1]*(1-lossF[1])], loss=[dcH[0]-del[0],dcH[1]-del[1]];    
  const cop=R.cop, pe=E.elec[city], hpMW=[dcH[0]/E.hpFLH[1],dcH[1]/E.hpFLH[0]];
  const cpm=m=>{ const [[m1,c1],[m3,c3]]=E.hpCapex; return (m<=m1?c1:m>=m3?c3:c1+(c3-c1)*(m-m1)/(m3-m1))*E.eur; };
  const pipe=L?[L*SX.pipeCA[0],L*SX.pipeCA[1]]:null, pipeEU=L?[L*SX.pipeEU[0],L*SX.pipeEU[1]]:null, hp=[hpMW[0]*cpm(hpMW[0]),hpMW[1]*cpm(hpMW[1])];
  const gfaC=bs.reduce((t,b)=>t+b.gfa,0);
  const conn=city==='van'?[bs.length*SX.levyVan.ets+peak[0]*1000*SX.levyVan.kw,bs.length*SX.levyVan.ets+peak[1]*1000*SX.levyVan.kw]:[gfaC*SX.feeEdm,gfaC*SX.feeEdm];
  const avoidBoiler=[peak[0]*1000*SX.boilerKw,peak[1]*1000*SX.boilerKw];    
  const cap=pipe?[pipe[0]+hp[0]+(conn?conn[0]:0),pipe[1]+hp[1]+(conn?conn[1]:0)]:null;
  const cP=crf(E.rate,E.life.pipe), cH=crf(E.rate,E.life.hp), om=[(E.hpOMfix*hpMW[0]+E.hpOMvar*dcH[0])*E.eur,(E.hpOMfix*hpMW[1]+E.hpOMvar*dcH[1])*E.eur];
   
   
  const lcoh=cap?[(cP*(pipe[0]+(conn?conn[0]:0))+cH*hp[0]+om[0]+dcH[1]*pe/cop[1])/Math.max(1,del[1]),(cP*(pipe[1]+(conn?conn[1]:0))+cH*hp[1]+om[1]+dcH[0]*pe/cop[0])/Math.max(1,del[0])]:null;
  const wGas=E.heatVal(city), tf=SX.tariff[city];
  const pay=w=>cap?[cap[0]/Math.max(1e-9,del[1]*w-dcH[1]*pe/cop[1]-om[0]),cap[1]/Math.max(1e-9,del[0]*w-dcH[0]*pe/cop[0]-om[1])]:null;
   
  const backup=[peak[0]*1000*SX.backupKw,peak[1]*1000*SX.backupKw], topup=[Math.max(0,dem[0]-del[1]),Math.max(0,dem[1]-del[0])];
  const capAll=cap?[cap[0]+backup[0],cap[1]+backup[1]]:null;
   
  const cBk=crf(E.rate,25), lcohAll=cap?[0,1].map(i=>{ const j=1-i, out=del[j]+topup[i]; return (cP*(pipe[i]+(conn?conn[i]:0))+cH*hp[i]+om[i]+dcH[j]*pe/cop[j]+cBk*backup[i]+topup[i]*wGas)/Math.max(1,out); }):null;
   
  const Y=40, r_=E.rate, AF=(1-Math.pow(1+r_,-Y))/r_, cB=crf(r_,25), gasGJ=E.gas[city]/3.6, k=3.6/E.boiler;    
  const dm=(dem[0]+dem[1])/2, dcm=(dcH[0]+dcH[1])/2, tm=(topup[0]+topup[1])/2, pkm=(peak[0]+peak[1])/2;
  const annA=dm*wGas+pkm*1000*SX.boilerKw*cB;
  const pipeM=L?L*SX.pipeMid:0, connM=conn?(conn[0]+conn[1])/2:0, hpM=(hp[0]+hp[1])/2, omM=(om[0]+om[1])/2, copM=(cop[0]+cop[1])/2;
  const fixC=cP*(pipeM+connM)+cH*hpM+cB*pkm*1000*SX.backupKw+omM+dcm*pe/copM;    
  const annC=fixC+tm*wGas;
   
  const annB=pkm*1000*SX.hpB.kw*crf(r_,SX.hpB.life)+dm/SX.hpB.scop*pe;
  const path={A:annA*AF,B:annB*AF,C:L?annC*AF:null,perA:annA/Math.max(1,dm),perB:annB/Math.max(1,dm),perC:L?annC/Math.max(1,dm):null};
   
  const bA=pkm*1000*SX.boilerKw*cB, gBE=L&&dm>tm?(fixC-bA)/(k*(dm-tm)):null;
  const delm=(del[0]+del[1])/2, co2m=BD.CO2H?delm*(BD.CO2H.gas-(BD.CO2H.hp(city)[0]+BD.CO2H.hp(city)[1])/2)/1000:null;
  const cBE=L&&co2m>0?Math.max(0,(annC-annA)/co2m):null;    
  const needGood=L?SX.lhd.good*L:null;    
  const co2=BD.CO2H?[del[0]*(BD.CO2H.gas-BD.CO2H.hp(city)[0])/1000,del[1]*(BD.CO2H.gas-BD.CO2H.hp(city)[1])/1000]:null, co2gas=BD.CO2H?[del[0]*BD.CO2H.gas/1000,del[1]*BD.CO2H.gas/1000]:null, co2hp=BD.CO2H?[del[0]*BD.CO2H.hp(city)[0]/1000,del[1]*BD.CO2H.hp(city)[1]/1000]:null;
  return {co2gas,co2hp,lcohAll,del,loss,lossF,retroOut,retroN:retro.length,retroMWh,backup,topup,capAll,path,gBE,gasGJ,cBE,needGood,co2m,AF,Y,rate:r_,partial,unFrac,nLow,avoidBoiler,gfaC,of,dem,noEst,n:cl.bld.length,nEst:bs.length,peak,dcMW,shareP,sA,dcH,rt,L,lhd,hpMW,pipe,pipeEU,hp,conn,cap,om,lcoh,wGas,tf,payGas:pay(wGas),payTf:pay(tf.energy),co2,cop,pe,anchors:cl.bld.filter(b=>b.anchor).map(b=>b.anchor)}; }

 
function curveFor(D,mw,cool){ const key=[D.key,mw,cool,DS.inclRetro].join('|'); if(DS.curve&&DS.curve.key===key) return DS.curve;
  const RT=D.RT; if(!RT) return DS.curve={key,pts:[]};
  const cand=D.B.filter(b=>b.heat&&(DS.inclRetro||b.ready!=='retrofit')), G=RT.G, Tt=RT.T; D._nn=D._nn||new Map();
  const near=(x,y)=>{ let bi=-1,bd=1e18; for(let i=0;i<G.xy.length;i+=2){ const dd=(G.xy[i]-x)**2+(G.xy[i+1]-y)**2; if(dd<bd){ bd=dd; bi=i/2; } } return [bi,Math.sqrt(bd)]; };
  const lev=b=>D.city==='van'?SX.levyVan.ets:(b.gfa||0)*SX.feeEdm;
  const scored=cand.map(b=>{ const pk=b.c[0]+','+b.c[1]; let nd=D._nn.get(pk); if(!nd){ nd=near(b.c[0],b.c[1]); D._nn.set(pk,nd); } const d=isFinite(Tt.dist[nd[0]])?Tt.dist[nd[0]]+nd[1]:Infinity, hm=(b.heat[0]+b.heat[1])/2;
    return {b,score:hm>0&&isFinite(d)?(d*SX.pipeMid+lev(b))/hm:Infinity}; }).filter(z=>isFinite(z.score)).sort((a,b)=>a.score-b.score).slice(0,LASSO_MAX).map(z=>z.b);
  const N=scored.length, ks=[]; for(let k=1;k<=N;k++) if(k<=25||(k<=100&&k%5===0)||k%20===0||k===N) ks.push(k);
  const of=offerFor(D,mw,cool), availM=(of.avail[0]+of.avail[1])/2, pts=[];
  for(const k of ks){ const S=breakdown(D,{bld:scored.slice(0,k)},mw,cool); if(!S||!S.nEst) continue;
    pts.push({k,dem:(S.dem[0]+S.dem[1])/2,lc:S.lcoh,la:S.lcohAll||S.lcoh,partial:S.partial}); }
  const mid=a=>a?(a[0]+a[1])/2:Infinity, ok=pts.filter(p=>!p.partial&&isFinite(mid(p.la)));
  const sweet=ok.length?ok.reduce((m,p)=>mid(p.la)<mid(m.la)?p:m,ok[0]):null, over=pts.find(p=>p.dem>availM)||null;
  return DS.curve={key,pts,sweet,over,N,availM,last:pts[pts.length-1]||null}; }
function curveHtml(CV,cur,wGas){ if(!CV||CV.pts.length<2) return '';
   
  const far=Math.max(CV.sweet?CV.sweet.k:1,CV.over?CV.over.k:1,cur&&cur.k||1), lim=Math.min(CV.pts[CV.pts.length-1].k,Math.max(30,4*far));
  const W=520,H=230,pl=52,pr=14,pt=16,pb=40, P=CV.pts.filter(p=>p.k<=lim), mid=a=>(a[0]+a[1])/2, xmax=Math.max(P[P.length-1].k,cur&&cur.k||1);
  if(P.length<2) return '';
  const ymax=Math.min(Math.max(...P.map(p=>Math.max(p.lc[1],p.la[1]))),3.2*Math.max(1,Math.min(...P.map(p=>p.la[0]))),2000), X=k=>pl+(k-1)/Math.max(1,xmax-1)*(W-pl-pr), Y=v=>pt+(1-Math.min(Math.max(v,0),ymax)/ymax)*(H-pt-pb);
  const band=(f,fill)=>`<polygon points="${P.map(p=>X(p.k).toFixed(1)+','+Y(f(p)[1]).toFixed(1)).join(' ')} ${P.slice().reverse().map(p=>X(p.k).toFixed(1)+','+Y(f(p)[0]).toFixed(1)).join(' ')}" fill="${fill}" stroke="none"/>`;
  const line=(f,col,dash)=>`<polyline points="${P.map(p=>X(p.k).toFixed(1)+','+Y(mid(f(p))).toFixed(1)).join(' ')}" fill="none" stroke="${col}" stroke-width="1.6"${dash?' stroke-dasharray="4 3"':''}/>`;
  let ax=''; for(let i=0;i<=4;i++){ const v=ymax*i/4, y=Y(v); ax+=`<line x1="${pl}" y1="${y.toFixed(1)}" x2="${W-pr}" y2="${y.toFixed(1)}" stroke="#ECEBE7"/><text x="${pl-6}" y="${(y+4).toFixed(1)}" text-anchor="end" font-size="10.5" fill="#66696E">$${n0(v)}</text>`; }
  const xt=[1,...[0.25,0.5,0.75].map(f=>Math.round(1+f*(xmax-1))),xmax].filter((v,i,a)=>a.indexOf(v)===i); for(const k of xt) ax+=`<text x="${X(k).toFixed(1)}" y="${H-pb+15}" text-anchor="middle" font-size="10.5" fill="#66696E">${k}</text>`;
  ax+=`<text x="${(pl+W-pr)/2}" y="${H-6}" text-anchor="middle" font-size="11" fill="#45464A">buildings in the group, best first</text><text x="12" y="${(pt+H-pb)/2}" font-size="11" fill="#45464A" transform="rotate(-90 12 ${(pt+H-pb)/2})" text-anchor="middle">$ per MWh</text>`;
  const gas=wGas&&wGas<ymax?`<line x1="${pl}" y1="${Y(wGas).toFixed(1)}" x2="${W-pr}" y2="${Y(wGas).toFixed(1)}" stroke="#16181B" stroke-width=".8" stroke-dasharray="2 3"/><text x="${W-pr}" y="${(Y(wGas)-4).toFixed(1)}" text-anchor="end" font-size="10.5" fill="#16181B">gas replaced $${n0(wGas)}</text>`:'';
  const ov=CV.over?`<line x1="${X(CV.over.k).toFixed(1)}" y1="${pt}" x2="${X(CV.over.k).toFixed(1)}" y2="${H-pb}" stroke="#3268A6" stroke-dasharray="3 3"/><text x="${(X(CV.over.k)+4).toFixed(1)}" y="${pt+10}" font-size="10.5" fill="#3268A6">demand passes the data centre’s heat</text>`:'';
  const sw=CV.sweet?`<circle cx="${X(CV.sweet.k).toFixed(1)}" cy="${Y(mid(CV.sweet.la)).toFixed(1)}" r="4.5" fill="#fff" stroke="#16181B" stroke-width="1.6"/><text x="${(X(CV.sweet.k)+7).toFixed(1)}" y="${(Y(mid(CV.sweet.la))+14).toFixed(1)}" font-size="10.5" fill="#16181B">lowest</text>`:'';
  const cu=cur&&cur.k&&cur.c?`<rect x="${(X(cur.k)-4).toFixed(1)}" y="${(Y(cur.c)-4).toFixed(1)}" width="8" height="8" fill="#5B3F8C"/><text x="${(X(cur.k)+7).toFixed(1)}" y="${(Y(cur.c)-6).toFixed(1)}" font-size="10.5" fill="#B4581F">${esc(cur.lab)}</text>`:'';
  const svg=`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Cost per MWh as buildings are added to the group, best first">${ax}${band(p=>p.la,'rgba(156,155,151,.25)')}${band(p=>p.lc,'rgba(123,94,167,.22)')}${line(p=>p.la,'#6B6A66',true)}${line(p=>p.lc,'#5B3F8C')}${gas}${ov}${sw}${cu}</svg>`;
  const last=CV.last, s=CV.sweet;
  const say=!s?'No group here is priced: most of its floor area has no estimate.':s.k===last.k?`Cost still falling at ${s.k} building${s.k===1?'':'s'} ($${n0(mid(s.la))}/MWh, all heat), the most within reach.`:`Lowest cost at ${s.k} building${s.k===1?'':'s'} ($${n0(mid(s.la))}/MWh, all heat); beyond that each added building costs more than it saves.`;
  return `<h4>How the cost changes with the size of the group</h4>${svg}<div class="${NS}key"><span><i style="background:rgba(123,94,167,.4)"></i>heat from the data centre (low–high)</span><span><i style="background:rgba(156,155,151,.45)"></i>all the area’s heat, with the backup boilers and their gas</span><span><i style="background:#5B3F8C"></i>${cur&&cur.lab?esc(cur.lab):'this group'}</span></div><p class="${NS}verdict">${say}</p><div class="${NS}note">Buildings within reach ranked once by their own added cost per MWh (street pipe from the data centre at $${n0(SX.pipeMid)}/m, plus the connection ${D_CITY==='van'?'levy':'fee'}), then added one at a time; each group priced as on this card. Drawn to ${xmax} of the ${CV.N} buildings within reach; groups beyond that are not drawn. The tool’s best group is chosen another way and can sit just below the line.</div>`; }
let D_CITY='van';

 
function frameOf(D){ const [sx,sy]=D.f.c, R_=RANGE+40; return {bb:[sx-R_,sy-R_,sx+R_,sy+R_],W:720,H:720}; }
function mapSvg(D,cl){ const {bb,W,H}=frameOf(D), fr=C.frame(bb,W,H,0), P=fr.P; const pth=r=>{ let s=''; for(let i=0;i<r.length;i+=2){ const [a,b]=P(r[i],r[i+1]); s+=(i?'L':'M')+a.toFixed(1)+' '+b.toFixed(1); } return s+'Z'; };
  let st=''; if(D.RT){ for(const g of D.RT.G.segs||[]){ let d=''; for(let i=2;i+1<g.length;i+=2){ const [a,b]=P(g[i],g[i+1]); d+=(i>2?'L':'M')+a.toFixed(1)+' '+b.toFixed(1); } st+=d; } }
  const sel=new Set(cl?cl.bld:[]);
  const bl=D.B.map((b,i)=>{ const col=DS.layer==='type'?(b.ready==='ready'?'#1F9A9A':b.ready==='retrofit'?'url(#f1dRetro)':'#E8E7E3'):(b.heat?rampOf((b.heat[0]+b.heat[1])/2):NOEST), on=sel.has(b);
      return `<path data-b="${i}" d="${pth(b.r)}" fill="${col}" fill-opacity="${on||!sel.size?1:.5}" stroke="${on?K.ink:'#8E8D89'}" stroke-width="${on?1.4:.5}" style="cursor:pointer"><title>${esc((USE_NAME[b.use]||b.use)+(b.zone?' · zone '+b.zone:'')+(b.heat?` · about ${rg(b.heat,n0,'MWh of heat a year')}`:' · no estimate')+` · ${n0(b.gfa)} m² floor (${b.st} storey${b.st>1?'s':''}${b.stEst?', height not measured':''})`)}</title></path>`; }).join('');
  const an=D.A.map((p,ai)=>{ const [a,b]=P(p.x,p.y); return `<g data-mk data-a="${ai}" style="cursor:pointer"><title>${esc(pubName(p)+' · anchor: '+p.t)}</title><circle cx="${a.toFixed(1)}" cy="${b.toFixed(1)}" r="5" fill="#fff" stroke="${K.ink}" stroke-width="1.6"/></g>`; }).join('');
  const [ox,oy]=P(D.f.c[0],D.f.c[1]), OR=BD.S.sel&&BD.S.sel.ring&&BD.S.sel.ring.length>5?BD.S.sel.ring:null;
   
  const site=OR?`<g><path d="${pth(OR)}" fill="${K.dc}" fill-opacity=".55" stroke="#0F1F33" stroke-width="2.6"/><text x="${ox.toFixed(1)}" y="${(oy-14).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="600" fill="#0F1F33" stroke="#fff" stroke-width="3.5" paint-order="stroke">Data centre site</text></g>`
    :`<g><rect x="${(ox-6).toFixed(1)}" y="${(oy-6).toFixed(1)}" width="12" height="12" fill="${K.dc}" stroke="${K.ink}" stroke-width="1"/></g>`;
  let loop=''; if(cl&&cl.rt){ let d=''; for(const [a,b] of cl.rt.segs){ const A_=P(a[0],a[1]), B_=P(b[0],b[1]); d+=`M${A_[0].toFixed(1)} ${A_[1].toFixed(1)}L${B_[0].toFixed(1)} ${B_[1].toFixed(1)}`; } loop=`<path d="${d}" fill="none" stroke="#5B3F8C" stroke-width="3.2" stroke-linecap="round"/>`; }
  let lasso=''; if(DS.poly&&DS.poly.length>2){ const PP=DS.poly.map(q=>P(q[0],q[1])), top=PP.reduce((m,q)=>q[1]<m[1]?q:m,PP[0]), L_=(DS.sel||[]), mwh=[L_.reduce((t,b)=>t+(b.heat?b.heat[0]:0),0),L_.reduce((t,b)=>t+(b.heat?b.heat[1]:0),0)];
    const lab=`Your area: ${L_.length} building${L_.length===1?'':'s'}${mwh[1]>0?`, ${rg(mwh,n0,'MWh/yr')}`:''}${DS.capped?' (the first '+LASSO_MAX+')':''}`;
    lasso=`<path d="${PP.map((q,i)=>(i?'L':'M')+q[0].toFixed(1)+' '+q[1].toFixed(1)).join('')}Z" fill="rgba(123,94,167,.10)" stroke="#B4581F" stroke-width="2"/><text x="${top[0].toFixed(1)}" y="${(top[1]-8).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="600" fill="#7A3A12" stroke="#fff" stroke-width="3.5" paint-order="stroke">${esc(lab)}</text>`; }
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" data-map data-map-city="${D.city}" data-map-bb="${bb.join(',')}" data-map-frame="${W},${H},0" data-map-max="12" data-map-min="0.55" data-map-detail="labels" role="img" aria-label="Buildings within ${RANGE} m of the data centre, shaded by estimated heat demand">
    <defs><pattern id="f1dRetro" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#E8E7E3"/><line x1="0" y1="0" x2="0" y2="5" stroke="#9C9B97" stroke-width="1.6"/></pattern></defs>
    <rect x="-${W}" y="-${H}" width="${3*W}" height="${3*H}" fill="#E3E2DE"/><path d="${st}" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="${st}" fill="none" stroke="${K.rule}" stroke-width=".6"/>
    ${bl}${lasso}${loop}${an}${site}<g data-map-static>${C.scaleBar(16,H-28,100,fr.s,'100 m')}</g></svg>`; }

 
const MAPKEY=`<p class="${NS}mapkey"><b>Violet shading</b> = estimated heat demand, darker = more (grey: no estimate) · <b>white circle</b> = a building on the tool’s receiver list (housing, schools, care, pools, rinks, networks, large buildings); a number = several at one spot · <b>violet line</b> = the loop along the streets · <b>blue</b> = the data centre site. Click any building or circle for its details.</p>`;
 
 
function retroSay(cl){ const L=(cl&&cl.c&&cl.c.bld?cl.c.bld:[]).filter(b=>b.ready==='retrofit'), m=[L.reduce((t,b)=>t+(b.heat?b.heat[0]:0),0),L.reduce((t,b)=>t+(b.heat?b.heat[1]:0),0)];
  const t=!L.length?'No building in this group is marked as likely needing a retrofit: the switch has nothing to add here.':DS.inclRetro?`Included: ${L.length} building${L.length>1?'s':''} that likely need a retrofit (${rg(m,n0,'MWh/yr')}).`:`Left out: ${L.length} building${L.length>1?'s':''} that likely need a retrofit (${rg(m,n0,'MWh/yr')}).`;
  return `<span class="${NS}rsay" role="status">${esc(t)}</span>`; }
function buildingCard(b,p,inGroup){ const READY={ready:'yes: on a district network (known)',retrofit:'likely needs a retrofit (estimated from building type)',unknown:'not known'};
  const rows=[['Use',b?(USE_NAME[b.use]||b.use||'?'):(USE_W[p&&p.t]||'?')],['Estimated heat demand',b&&b.heat?`about ${rg(b.heat,n0,'MWh a year')}`+(b.heatSrc==='anchor'?' (the receiver list’s own estimate)':' (floor area × a sourced intensity)'):'no estimate (use not sourced)'],
    ['On the receiver list',p||(b&&b.anchor)?`yes: ${esc(pubName(p||b.anchor))} (${esc((p||b.anchor).t)})`:'no'],['Ready to connect',b?READY[b.ready]||'not known':'not known'],['In the group being priced',inGroup?'yes':'no']];
  return `<div class="${NS}bcard"><div class="h">Building</div>${rows.map(r=>`<div class="r"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}<button type="button" data-f1d="bclose">Close</button></div>`; }
function keyHtml(){ if(DS.layer==='type'){ const D=DS.data, B=D?D.B:[], sum=f=>{ const L=B.filter(f); return [L.length,L.reduce((t,b)=>t+(b.heat?(b.heat[0]+b.heat[1])/2:0),0)]; }, R_=sum(b=>b.ready==='ready'), X=sum(b=>b.ready==='retrofit'), U=sum(b=>b.ready==='unknown');
    return `<div class="${NS}key"><span><i style="background:#1F9A9A"></i>ready: hot-water heating (known: on a district network)</span><span><i style="background:repeating-linear-gradient(45deg,#E8E7E3 0 2px,#9C9B97 2px 3.5px)"></i>likely needs a retrofit (estimated from building type: NRCan SHEU 2019 shares)</span><span><i style="background:#E8E7E3"></i>unknown</span><span><i style="background:#fff;border:1.6px solid ${K.ink};border-radius:50%"></i>anchor</span><span><i style="background:${K.dc}"></i>data centre</span></div>
    <p class="${NS}note">${R_[0]} buildings ready (${n0(R_[1])} MWh/yr), ${X[0]} likely need a retrofit (${n0(X[1])} MWh/yr), ${U[0]} unknown. Never shown as fact: no building-by-building heating data.</p>`; }
  return `<div class="${NS}key">${RAMP.map(([t,c],i)=>`<span><i style="background:${c}"></i>${i<RAMP.length-1?`${n0(t)}–${n0(RAMP[i+1][0])}`:`${n0(t)}+`} MWh/yr</span>`).join('')}<span><i style="background:${NOEST}"></i>no estimate (use not sourced)</span><span><i style="background:#fff;border:1.6px solid ${K.ink};border-radius:50%"></i>anchor</span><span><i style="background:${K.dc}"></i>data centre</span><span><i style="background:#5B3F8C"></i>loop along the streets</span></div>`; }

 
const USE_W={care:'Care facility',childcare:'Child care',commercial:'Commercial building',apartment:'Apartment building',office:'Office building',retail:'Retail building',industrial:'Industrial building',warehouse:'Warehouse',hotel:'Hotel',housing:'Housing',hospital:'Hospital',campus:'Campus',school:'School',pool:'Pool',rink:'Rink',big:'Large building',bca:'Large building'};
const OWNERISH=/\b(ltd|ltee|inc|corp|corporation|limited|holdings|investments|properties|developments|enterprises|co\.)\b|^\d{4,}\s/i;
function pubName(p){ return BD.f1recvName?BD.f1recvName(p):(USE_W[p&&p.t]||'Building'); }    
const T_NAME={housing:'housing',hospital:'hospital',campus:'campus',school:'school',pool:'pool',rink:'rink',net:'district network',den:'district network',big:'large building',bca:'large building'};
function anchorList(L){ const c={}; for(const a of L){ const k=pubName(a)!==(USE_W[a.t]||'Building')&&pubName(a).length<=34?pubName(a):(T_NAME[a.t]||'large building'); c[k]=(c[k]||0)+1; } return Object.entries(c).map(([k,n])=>esc(n>1?`${n} × ${k}`:k)).join(', '); }
 
function peakTxt(sp){ const a=sp[0]*100, b=sp[1]*100;
  if(a>=100) return `covers the whole peak (with ${rg([a-100,b-100],n0,'%')} to spare)`;
  if(b>100) return `${n0(a)} % up to the whole peak (with up to ${n0(b-100)} % to spare)`;
  return rg([a,b],n0,'%'); }
 
const TERMS=[['Linear heat density','heat sold per metre of pipe a year; around 1.5 MWh per metre or more, a network is usually worth building'],
  ['COP','coefficient of performance: units of heat out for each unit of electricity in'],['ETS','energy transfer station: the room in each building where the loop hands its heat over'],
  ['full-load hours','a year’s heat divided by the peak: how many hours at full output it equals'],['Top-up','heat the backup boilers supply when the data centre’s heat is not enough'],
  ['levy','a one-off charge to connect a building to the City’s network'],['Simple payback','years for the savings to repay the capital, before discounting'],
  ['all-in','the energy charge plus the monthly capacity charge, spread over the year’s heat'],['Share of the peak','the data centre’s steady heat as a share of the coldest day’s demand'],
  ['Share of the annual heat','how much of the year’s heat the data centre can supply'],['worth','what the heat is worth to the buildings: the gas it replaces, or a district tariff'],
  ['heat pump','a machine that lifts the data centre’s warm water to the loop’s temperature, using electricity'],['backup boilers','gas boilers that can heat every building if the data centre is offline'],
  ['real','after inflation: today’s dollars'],['discount rate','how much a dollar later is worth less than a dollar today, a year at a time']];
function glossify(html){ const done=new Set(); return html.split(/(<[^>]+>)/).map(part=>{ if(part.startsWith('<')) return part; let t=part;
    const subs=[]; for(const [term,expl] of TERMS){ if(done.has(term)) continue; const m=new RegExp('(^|[^A-Za-z])('+term+')(?![A-Za-z])').exec(t); if(!m) continue; done.add(term);
      const i=m.index+m[1].length; subs.push(`<abbr class="${NS}term" title="${esc(expl)}" tabindex="0">${term}</abbr>`); t=t.slice(0,i)+'\u0001'+(subs.length-1)+'\u0002'+t.slice(i+term.length); }
    return t.replace(/\u0001(\d+)\u0002/g,(m,k)=>subs[+k]); }).join(''); }
function panelHtml(D,S,label,flat){ return glossify(panel0(D,S,label,flat)); }
function panel0(D,S,label,flat){ const city=D.city, tf=S.tf, pays=(l,w)=>l&&l[0]<=w, anyPay=(l,w)=>l&&l[0]<=w, allPay=(l,w)=>l&&l[1]<=w;
   
  const verdict=(w,name)=>{ if(!S.lcoh) return PH('cost'); const [lo,hi]=S.lcoh, near=Math.abs(lo-w)<=0.1*w;
    if(hi<=w) return `<b>pays against ${name}</b> across the range`;
    if(near) return `about break-even with ${name} at the low end of the range; <b>doesn't pay</b> across the rest`;
    if(lo<w) return `pays against ${name} at the low end of the range; <b>doesn't pay</b> across the rest`;
    return `<b>doesn't pay against ${name}</b> anywhere in the range`; };
  const ets=n=>{ for(const [t,s] of SX.ets) if(n<=t) return s; };
  const pc=v=>v==null?PH('below the sourced table (under 30 % of peak)'):n0(v*100)+' %', shareTxt=pc(S.sA[0])===pc(S.sA[1])?pc(S.sA[0]):`${pc(S.sA[0])} – ${pc(S.sA[1])}`, upper=S.sA.some(v=>v==null);
  if(!S.nEst&&S.retroOut) return `<div class="${NS}panel"><div class="${NS}note">${esc(label)}</div><p class="${NS}verdict">The ${S.retroN} building${S.retroN===1?' here is a home':'s here are homes'} that likely need${S.retroN===1?'s':''} a retrofit to connect (most homes don’t heat with hot water), so ${S.retroN===1?'it is':'they are'} left out of the totals. Tick “Include buildings that need a retrofit” to price ${S.retroN===1?'it':'them'}.</p><div class="${NS}disc">Estimates, not a design or a quote. Sources and assumptions below.</div></div>`;
  if(!S.nEst) return `<div class="${NS}panel"><div class="${NS}note">${esc(label)}</div><p class="${NS}verdict">No building in this cluster has a sourced heat estimate (${S.n} building${S.n===1?'':'s'}: CD-1, Direct Control or unknown use), so there is nothing to price. Draw around buildings with a shade, or an anchor.</p><div class="${NS}disc">Estimates, not a design or a quote. Sources and assumptions below.</div></div>`;
  const P_=S.partial, dash='—';
  return `<div class="${NS}panel">
  <div class="${NS}note">${esc(label)}</div>
  ${S.path&&S.path.C!=null&&!S.partial?`<p class="${NS}verdict">In short: over ${S.Y} years the loop costs <b>${mill(S.path.C)}</b>, against ${mill(S.path.A)} staying on gas and ${mill(S.path.B)} for each building’s own heat pump (central case, today’s prices held flat).</p>`:''}
  ${P_?'':`<div class="${NS}verdict">Against gas: ${verdict(S.wGas,'gas')}.<br>Against the district tariff: ${verdict(tf.energy,'the tariff')}.</div>`}
  ${flat?'':`<details class="${NS}more"><summary>The full breakdown: who is in it, the heat, the pipe, capital, cost, 40 years, specs</summary>`}
  ${P_?`<div class="${NS}verdict"><b>Can’t price this area yet:</b> ${S.noEst} of ${S.n} buildings (${n0(S.unFrac*100)} % of the floor area) have no demand estimate. The figures below are the counted part only (partial); no cost verdict is given.</div>`:''}
  <h4>Who is in it</h4><table>
   ${S.retroN?`<tr><td>Likely need a retrofit (estimated)</td><td class="r">${S.retroN} (${rg(S.retroMWh,n0,'MWh/yr')}) · ${DS.inclRetro?'included: retrofit cost '+PH('per m² (source being read)'):'left out of the totals below'}</td></tr>`:''}
   <tr><td>Buildings counted</td><td class="r">${S.n}${S.noEst?` (${S.noEst} without an estimate: not counted)`:''}${S.nLow?`; ${S.nLow} industrial read as warehousing (a proxy)`:''}</td></tr>
   <tr><td>Anchors</td><td class="r">${S.anchors.length?anchorList(S.anchors):'none'}</td></tr>
   <tr><td>Heat demand</td><td class="r">${rg(S.dem,n0,'MWh/yr')}</td></tr>
   <tr><td>Peak demand</td><td class="r">${rg(S.peak,n1,'MW')}</td></tr></table>
  <h4>The data centre’s heat</h4><table>
   <tr><td>Offered (${n1(DS.mw)} MW, ${esc(COOL[DS.cool]||DS.cool)})</td><td class="r">${rg(S.of.avail,n0,'MWh/yr')}</td></tr>
   <tr><td>Share of the peak</td><td class="r">${peakTxt(S.shareP)}</td></tr>
   <tr><td>Share of the annual heat</td><td class="r">${shareTxt}</td></tr>
   <tr><td>Covered a year${upper?' (an upper bound: part of the share is outside the sourced table)':''}</td><td class="r">${upper?'up to ':''}${rg(S.dcH,n0,'MWh')}</td></tr>
   <tr><td>Lost in the pipes</td><td class="r">${S.L?`${rg([S.loss[1],S.loss[0]].sort((a,b)=>a-b),n0,'MWh/yr')} (${rg([S.lossF[1]*100,S.lossF[0]*100],n0,'%')})`:PH('route')}</td></tr>
   <tr><td>Delivered to the buildings a year</td><td class="r">${rg(S.del,n0,'MWh')}</td></tr>
   <tr><td>Top-up from the backup boilers</td><td class="r">${rg(S.topup,n0,'MWh/yr')}</td></tr>
   <tr><td>Left over (no taker in this cluster)</td><td class="r">${rg([Math.max(0,S.of.avail[0]-S.dcH[1]),Math.max(0,S.of.avail[1]-S.dcH[0])],n0,'MWh/yr')}</td></tr>
   <tr><td>Top-up</td><td class="r">gas peaking boiler (or electric), the rest of the year’s heat and the coldest days</td></tr>
   ${city==='van'?`<tr><td>Vancouver reference</td><td class="r">NEU: ~70 % sewage heat pumps, ~30 % gas</td></tr>`:''}</table>
  <h4>The pipe</h4><table>
   <tr><td>Loop length along the streets</td><td class="r">${S.L?n0(S.L)+' m':PH('route')}</td></tr>
   <tr><td>Linear heat density</td><td class="r">${S.lhd?rg(S.lhd,v=>v.toFixed(2),'MWh/m·yr'):PH('density')}</td></tr></table>
   ${S.lhd?`<div class="${NS}note">${S.lhd[1]<SX.lhd.poor?'Below 0.75: poor for a conventional network.':S.lhd[0]>=SX.lhd.good?'Above 1.5: good.':'Between poor (0.75) and good (1.5).'} Thresholds: nPro / C.A.R.M.E.N. (secondary).</div>`:''}
  <h4>Capital</h4><table>
   <tr><td>Pipe (heating-only, $1,850–7,000 per trench metre; central $3,650)</td><td class="r">${S.pipe?rg(S.pipe,mill):PH('pipe')}</td></tr>
   <tr><td>Heat pumps (${rg(S.hpMW,n1,'MW')})</td><td class="r">${rg(S.hp,mill)}</td></tr>
   <tr><td>Building connections (${city==='van'?'NEU levy: $123,873 per building + $146/kW':'Blatchford fee: $22.24/m²'})</td><td class="r">${rg(S.conn,mill)}</td></tr>
   <tr><td>Backup boilers, 100 % of the peak (can heat every building with the data centre offline)</td><td class="r">${rg(S.backup,mill)}</td></tr>
   <tr><td>Total</td><td class="r">${S.capAll?rg(S.capAll,mill):PH('total')}</td></tr></table>
   ${S.pipeEU?`<div class="${NS}note">Notes only: at the European band ($1,038–2,620/m) the pipe would be ${rg(S.pipeEU,mill)}; Mississauga’s 4-pipe (hot and chilled water) average is $5,300/m.</div>`:''}
  <h4>Cost of the heat against what it is worth</h4><table class="two">
   <tr><td>Cost per MWh of heat from the data centre</td><td class="r">${S.lcoh?rg(S.lcoh,money):PH('cost')}</td></tr>
   <tr><td>Cost per MWh of all the area’s heat (with the backup boilers and their gas; compare with a district’s customer price)</td><td class="r">${S.lcohAll?rg(S.lcohAll,money):PH('cost')}</td></tr>
   <tr><td>Worth: the gas it replaces</td><td class="r">${money(S.wGas)}</td></tr>
   <tr><td>Worth: ${esc(tf.name)} energy charge</td><td class="r">${money(tf.energy)} <span class="${NS}note">(all-in about ${money(tf.allIn)} at ${n0(tf.allInH)} full-load hours a year${tf.allInR?`; ${money(tf.allInR[0])}–${money(tf.allInR[1])} at ${n0(tf.allInRH[0])}–${n0(tf.allInRH[1])} h`:''}; a ceiling)</span></td></tr>
   <tr><td>Simple payback against gas (not discounted)</td><td class="r">${P_?dash:S.payGas?S.payGas.map(v=>v>0&&v<200?n0(v)+' yr':'never').join(' – '):PH('payback')}</td></tr>
   <tr><td>Simple payback against the tariff (not discounted)</td><td class="r">${P_?dash:S.payTf?S.payTf.map(v=>v>0&&v<200?n0(v)+' yr':'never').join(' – '):PH('payback')}</td></tr>
   <tr><td>Connect at boiler replacement: boilers not bought</td><td class="r">${rg(S.avoidBoiler,mill)} <span class="${NS}note">(DEA, $152/kW; European)</span></td></tr></table>
  ${P_?`<div class="${NS}verdict">No cost verdict: most of this area’s floor has no demand estimate.</div>`:`<div class="${NS}verdict">Against gas: ${verdict(S.wGas,'gas')}.<br>Against the district tariff: ${verdict(tf.energy,'the tariff')}.</div>`}
  ${S.curveHtml||''}
  <h4>Over ${S.Y} years</h4>
  ${S.path.C!=null?`<div class="${NS}verdict">Over ${S.Y} years, the loop costs <b>${mill(S.path.C)}</b> vs <b>${mill(S.path.A)}</b> staying on gas and <b>${mill(S.path.B)}</b> for each building’s own heat pump.</div>`:''}
  <table>
   <tr><td>A. Stay on gas (bills + boilers replaced)</td><td class="r">${mill(S.path.A)} · ${money(S.path.perA)}/MWh</td></tr>
   <tr><td>B. Each building’s own heat pump${city==='van'?' (from 2040 Vancouver office and retail buildings of 9,290 m² and over must reach zero heat emissions: their likely alternative)':''}</td><td class="r">${mill(S.path.B)} · ${money(S.path.perB)}/MWh</td></tr>
   <tr><td>C. The loop from the data centre (with backup boilers and top-up gas)</td><td class="r">${S.path.C!=null?mill(S.path.C)+' · '+money(S.path.perC)+'/MWh':PH('route')}</td></tr>
   <tr><td>Discount rate</td><td class="r">${(S.rate*100).toFixed(1)} % real (private utility) · public-sector ${PH('rate')}</td></tr></table>
  <div class="${NS}note">Central case (pipe at $${n0(SX.pipeMid)}/m, mid COP and lives). Today’s gas and electricity held flat in real terms; no forecast.${P_?' Partial: most of the floor area is uncounted.':''}</div>
  <h4>What would change the answer</h4><table>
   <tr><td>Gas price at which the loop pays (held 40 years)</td><td class="r">${S.gBE!=null?(S.gBE>0?`$${S.gBE.toFixed(2)}/GJ (today $${S.gasGJ.toFixed(2)})`:'pays at any gas price'):PH('break-even')}</td></tr>
   <tr><td>Carbon price that closes the gap</td><td class="r">${S.cBE!=null?(S.cBE<=0?'none needed':`$${n0(S.cBE)}/t CO₂e (no carbon price on building gas today)`):PH('carbon')}</td></tr>
   <tr><td>Heat along the pipe for “good” density (1.5 MWh/m)</td><td class="r">${S.needGood!=null?`${n0(S.needGood)} MWh/yr (now ${rg(S.dcH,n0)})`:PH('density')}</td></tr>
   <tr><td>Pipe cost (the least certain input)</td><td class="r">$1,850–7,000/m moves the loop ${S.L?rg([S.L*1850*crf(BD.ECON.rate,BD.ECON.life.pipe)*S.AF,S.L*7000*crf(BD.ECON.rate,BD.ECON.life.pipe)*S.AF],mill):'?'} over ${S.Y} years</td></tr></table>
  <h4>Benefits that aren’t money (not priced, not netted)</h4><table>
   <tr><td>Gas no longer burned (its carbon; the heat pumps’ carbon is under Carbon)</td><td class="r">${S.co2gas?rg(S.co2gas.slice().sort((a,b)=>a-b),n0,'t CO₂e/yr'):PH('carbon')}</td></tr>
   <tr><td>Heat that would otherwise be thrown away</td><td class="r">${rg(S.dcH,n0,'MWh/yr')}</td></tr>
   <tr><td>Fit with City targets</td><td class="r">${city==='van'?'NEU low-carbon heat; GHG by-law zero heat emissions for large buildings from 2040':'Edmonton has no building carbon limit (benchmarking is voluntary)'}</td></tr></table>
  <h4>Carbon, side by side (not netted)</h4><table><tr><td>Benefit: gas no longer burned</td><td class="r">${S.co2gas?rg(S.co2gas.slice().sort((a,b)=>a-b),n0,'t CO₂e/yr'):PH('carbon')}</td></tr><tr><td>Burden: the heat pumps’ electricity</td><td class="r">${S.co2hp?rg(S.co2hp.slice().sort((a,b)=>a-b),n0,'t CO₂e/yr'):PH('carbon')}</td></tr></table>
  <h4>Specs</h4><table>
   <tr><td>Data centre</td><td class="r">${n1(DS.mw)} MW IT, ${esc(COOL[DS.cool]||DS.cool)}</td></tr>
   <tr><td>Network supply</td><td class="r">${SX.supply[city]!=null?`${SX.supply[city]} °C (NEU minimum)`:PH('supply temperature (Edmonton)')}</td></tr>
   <tr><td>Heat pump lift</td><td class="r">loop ~32 °C to ${SX.supply[city]!=null?SX.supply[city]+' °C':'?'}; COP ${S.cop[0]}–${S.cop[1]}</td></tr>
   <tr><td>Heat pump size</td><td class="r">${rg(S.hpMW,n1,'MW')}</td></tr>
   ${city==='van'?`<tr><td>ETS room per building</td><td class="r">${esc(ets(10000))} (under 13,940 m²) to ${esc(ets(20000))}</td></tr>`:''}
   <tr><td>Operator</td><td class="r">City utility (as the NEU) or a private utility; not modelled</td></tr></table>
  ${flat?'':'</details>'}
  <div class="${NS}disc">Estimates, not a design or a quote. Sources and assumptions below.</div></div>`; }

 
const TH3='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const load3=()=>new Promise((ok,no)=>{ if(window.THREE) return ok(); const sc=document.createElement('script'); sc.src=TH3; sc.onload=ok; sc.onerror=()=>{ sc.remove(); no(new Error('three.js could not load')); };     document.head.appendChild(sc); });
let TREES={}, RN3=null;
 
async function treesNear(city,p,R){ let idx=null; try{ idx=await BD.getJSON(`context/${city}/trees.json`); }catch(e){}
  if(!idx){ try{ return (await BD.getJSON(`context/${city}_trees.json`)).t; }catch(e){ return null; } }
  const T=idx.T, have=new Set(idx.tiles.map(k=>k.join('_'))), out=[];
  for(let i=Math.floor((p[0]-R)/T);i<=Math.floor((p[0]+R)/T);i++) for(let j=Math.floor((p[1]-R)/T);j<=Math.floor((p[1]+R)/T);j++){ if(!have.has(i+'_'+j)) continue;
    try{ const J=await BD.getJSON(`context/${city}/tr_${i}_${j}.json`); for(const t of J.t) out.push([i*T+t[0]/10,j*T+t[1]/10,t[2],t[3]]); }catch(e){} }
  return out; }
async function render3d(holder,D,cl,S){ await load3(); const T=window.THREE, [sx,sy]=D.f.c, W=holder.clientWidth||720, H=Math.round(W*.86);
  const sc=new T.Scene(); sc.background=new T.Color(0xE9E8E4); const M={}, mat=(c,o)=>M[c+(o?JSON.stringify(o):'')]||(M[c+(o?JSON.stringify(o):'')]=new T.MeshLambertMaterial(Object.assign({color:c,flatShading:true},o||{})));
  const EDGE=new T.LineBasicMaterial({color:0x2A2D31,transparent:true,opacity:.7}), EDGE_DC=new T.LineBasicMaterial({color:0x0F1F33}), EDGE_CTX=new T.LineBasicMaterial({color:0x6E7075,transparent:true,opacity:.6}), X=x=>x-sx, Zc=y=>-(y-sy);
  const ground=new T.Mesh(new T.PlaneGeometry(6*RANGE,6*RANGE),mat(0xC9C8C3)); ground.rotation.x=-Math.PI/2; sc.add(ground);
   
  for(const g of (D.RT&&D.RT.G.segs)||[]) for(let i=2;i+3<g.length;i+=2){ const a=[g[i],g[i+1]], b=[g[i+2],g[i+3]]; if(Math.hypot(a[0]-sx,a[1]-sy)>RANGE+60) continue; const L=Math.hypot(b[0]-a[0],b[1]-a[1]); if(L<.5) continue;
    const m=new T.Mesh(new T.BoxGeometry(L+1,.04,9),mat(0xEFEEEA)); m.position.set(X((a[0]+b[0])/2),.02,Zc((a[1]+b[1])/2)); m.rotation.y=Math.atan2(b[1]-a[1],b[0]-a[0]); sc.add(m); }
   
  const sel=new Set(cl?cl.bld:[]); let bb=[1e9,1e9,-1e9,-1e9]; const grow=(x,y)=>{ bb[0]=Math.min(bb[0],x); bb[1]=Math.min(bb[1],y); bb[2]=Math.max(bb[2],x); bb[3]=Math.max(bb[3],y); };
  for(const b of D.B){ const sh=new T.Shape(); for(let i=0;i<b.r.length;i+=2){ const x=X(b.r[i]), z=-Zc(b.r[i+1]); i?sh.lineTo(x,z):sh.moveTo(x,z); } const h=b.h>0?b.h:4;
    const g=new T.ExtrudeGeometry(sh,{depth:h,bevelEnabled:false}); g.rotateX(-Math.PI/2); const on=sel.has(b);
    const col=on?(b.heat?parseInt(rampOf((b.heat[0]+b.heat[1])/2).slice(1),16):0xB9B8B4):0xDCDBD8; const m=new T.Mesh(g,mat(col)); sc.add(m);
    const e=new T.LineSegments(new T.EdgesGeometry(g),on?EDGE:EDGE_CTX); sc.add(e);
    if(on){ for(let i=0;i<b.r.length;i+=2) grow(b.r[i],b.r[i+1]); } }
   
  const ring=BD.S.sel&&BD.S.sel.ring; if(ring){ const sh=new T.Shape(); for(let i=0;i<ring.length;i+=2){ const x=X(ring[i]), z=-Zc(ring[i+1]); i?sh.lineTo(x,z):sh.moveTo(x,z); grow(ring[i],ring[i+1]); }
    const g=new T.ExtrudeGeometry(sh,{depth:12,bevelEnabled:false}); g.rotateX(-Math.PI/2); sc.add(new T.Mesh(g,mat(0x3268A6))); sc.add(new T.LineSegments(new T.EdgesGeometry(g),EDGE_DC)); }
   
   
  if(cl&&cl.rt) for(const [a,b] of cl.rt.segs){ const A=new T.Vector3(X(a[0]),.6,Zc(a[1])), B=new T.Vector3(X(b[0]),.6,Zc(b[1])), L=A.distanceTo(B); if(L<.01) continue;
    const c=new T.Mesh(new T.CylinderGeometry(1.7,1.7,L,8),mat(0xC85A1E,{emissive:0x5A2200})); c.position.copy(A).add(B).multiplyScalar(.5); c.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),B.clone().sub(A).normalize()); sc.add(c); }
  sc.add(new T.HemisphereLight(0xFFFFFF,0xDCD8CF,.72)); sc.add(new T.AmbientLight(0xFFFFFF,.12)); const sun=new T.DirectionalLight(0xFFFFFF,.4); sun.position.set(-200,300,150); sc.add(sun);
   
  if(bb[0]>bb[2]) bb=[sx-150,sy-150,sx+150,sy+150]; const cx=(bb[0]+bb[2])/2, cy=(bb[1]+bb[3])/2, span=Math.max(bb[2]-bb[0],bb[3]-bb[1])+160, asp=W/H, fr=span*.62;
  const cam=new T.OrthographicCamera(-fr*asp*.66,fr*asp*1.34,fr,-fr,-3000,3000),     tgt=new T.Vector3(X(cx),0,Zc(cy)), az=-132*Math.PI/180, el=36*Math.PI/180;
  cam.position.set(tgt.x+800*Math.cos(el)*Math.cos(az),800*Math.sin(el),tgt.z-800*Math.cos(el)*Math.sin(az)); cam.lookAt(tgt);
  if(RN3){ try{ RN3.dispose(); RN3.forceContextLoss(); }catch(e){} } const rn=RN3=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true}); rn.setPixelRatio(Math.min(2,window.devicePixelRatio||1)); rn.setSize(W,H); holder.innerHTML=''; holder.style.position='relative'; holder.appendChild(rn.domElement); rn.render(sc,cam);
   
  const proj=(x,y,z)=>{ const v=new T.Vector3(X(x),z,Zc(y)).project(cam); return [(v.x+1)/2*W,(1-v.y)/2*H]; };
   
  const C_=[]; if(ring){ let x=0,y=0; for(let i=0;i<ring.length;i+=2){ x+=ring[i]; y+=ring[i+1]; } C_.push({pt:proj(x/(ring.length/2),y/(ring.length/2),12),t1:'Data centre site: the heat source',t2:`${n1(DS.mw)} MW, ${COOL[DS.cool]||DS.cool}`,blue:true}); }
  const anc=(cl?cl.bld:[]).filter(b=>b.anchor).sort((a,b)=>((b.heat||[0,0])[1])-((a.heat||[0,0])[1])).slice(0,4);
  for(const b of anc){ const nm=pubName(b.anchor); C_.push({pt:proj(b.c[0],b.c[1],(b.h>0?b.h:4)),t1:nm,t2:b.heat?`about ${rg(b.heat,n0,'MWh/yr')}`:''}); }
  C_.sort((a,b)=>a.pt[1]-b.pt[1]); const colX=W-206; let yy=14; const slots=[]; for(const c of C_){ const ly=Math.max(yy,Math.min(H-60,c.pt[1]-18)); slots.push(ly); yy=ly+52; }
   
  const cross=(p1,p2,p3,p4)=>{ const d=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]); return d(p1,p2,p3)*d(p1,p2,p4)<0&&d(p3,p4,p1)*d(p3,p4,p2)<0; };
  C_.forEach((c,i)=>{ c.ly=slots[i]; }); for(let it=0;it<20;it++){ let sw=false; for(let i=0;i<C_.length;i++) for(let j=i+1;j<C_.length;j++){ const a=C_[i], b=C_[j];
    if(cross(a.pt,[colX,a.ly+14],b.pt,[colX,b.ly+14])){ const t=a.ly; a.ly=b.ly; b.ly=t; sw=true; } } if(!sw) break; }
  let co=`<svg style="position:absolute;left:0;top:0;pointer-events:none" width="${W}" height="${H}">${C_.map(c=>`<circle cx="${c.pt[0].toFixed(1)}" cy="${c.pt[1].toFixed(1)}" r="3" fill="${c.blue?'#3268A6':'#16181B'}"/><line x1="${c.pt[0].toFixed(1)}" y1="${c.pt[1].toFixed(1)}" x2="${colX}" y2="${c.ly+14}" stroke="#16181B" stroke-width=".8"/>`).join('')}</svg>`;
  co+=C_.map(c=>`<div style="position:absolute;left:${colX}px;top:${c.ly}px;width:196px;background:rgba(255,255,255,.94);border:1px solid ${c.blue?'#3268A6':'#DDDEDF'};padding:4px 8px;font:500 12px/1.3 'IBM Plex Sans',sans-serif;color:#16181B">${esc(c.t1)}${c.t2?`<div style="font-weight:400;color:#66696E;font-size:12px">${esc(c.t2)}</div>`:''}</div>`).join('');
  holder.insertAdjacentHTML('beforeend',co+`<div style="position:absolute;left:10px;bottom:8px;font:400 12px 'IBM Plex Sans',sans-serif;color:#33363A;background:rgba(255,255,255,.85);padding:2px 6px">The loop in violet; buildings in the cluster shaded by demand; the data centre site in blue. Not to a design.</div>`); }

 
 
BD.f1d={state:()=>{ const D=DS.data; if(!D) return null; const cl=currentCluster(D); return {B:D.B,A:D.A,c:D.f.c,cluster:cl?cl.c.bld:[],loop:DS.lastRt||[]}; },    
  treesNear:(c,p,r)=>treesNear(c,p,r), curve:()=>{ const c=DS.curve, m=a=>a?(a[0]+a[1])/2:null; return c&&c.sweet?{sweetBuildings:c.sweet.k,sweetCostAllHeat:m(c.sweet.la),sweetCostDcHeat:m(c.sweet.lc),demandPassesHeatAt:c.over?c.over.k:null,withinReach:c.N}:null; }, snap(){ return {sel:DS.sel,poly:DS.poly,capped:DS.capped,view:DS.view}; }, restore(s){ Object.assign(DS,s||{sel:null,poly:null,capped:false,view:'2d'},{lasso:false}); }};
function rerender(){ const W=document.getElementById('f1v'); if(!W) return; const btn=W.querySelector('.f1v-strip [aria-current="true"]'); if(btn) btn.click(); }
function update(){ const D=DS.data; if(!D) return; const W=document.getElementById('f1v'); if(!W) return; const cl=currentCluster(D);
  const S=cl?breakdown(D,cl.c,DS.mw,DS.cool):null; cl&&(cl.c.rt=S&&S.rt);
  const mp=W.querySelector(`.${NS}map`), pn=W.querySelector(`.${NS}pn`); if(!mp||!pn) return;
  mp.querySelector('.f1m-wrap')?.remove(); const holder=mp.querySelector(`.${NS}svg`); holder.innerHTML=mapSvg(D,cl&&cl.c); if(BD.f1map) BD.f1map.enhance(holder);

  mp.querySelector(`.${NS}keyh`).innerHTML=keyHtml(); pn.innerHTML=S?panelHtml(D,S,cl.label):'<p class="f1v-empty">Draw around a group of buildings.</p>'; wireLasso(holder); }
function currentCluster(D){ if(DS.sel&&DS.sel.length) return {c:{bld:DS.sel},label:`Your cluster: ${DS.sel.length} buildings inside the area you drew.`};
   
  const best=DS.best&&DS.best.G?DS.best.G:[]; const bld=[]; for(const p of best){ const b=D.B.find(q=>pipFlat(p.x,p.y,q.r))||null; if(b&&!bld.includes(b)) bld.push(b); }
  if(bld.length&&bld.filter(b=>!b.heat).reduce((t,b)=>t+b.gfa,0)<=0.5*bld.reduce((t,b)=>t+b.gfa,0)) return {c:{bld},label:`The tool’s best group (${bld.length} building${bld.length===1?"":"s"} it found at the lowest cost per MWh). Draw an area to test your own.`};
  const near=D.B.filter(b=>b.heat).sort((a,b)=>Math.hypot(a.c[0]-D.f.c[0],a.c[1]-D.f.c[1])-Math.hypot(b.c[0]-D.f.c[0],b.c[1]-D.f.c[1])).slice(0,12);
  return near.length?{c:{bld:near},label:'The 12 nearest buildings with an estimate (the tool found no best group here). Draw an area to test your own.'}:null; }
function wireLasso(holder){ const svg=holder.querySelector('svg'); if(!svg||svg._lassoWired) return; svg._lassoWired=true; const D=DS.data, {bb,W,H}=frameOf(D);
  const sx=W/(bb[2]-bb[0]); const toWorld=(cx,cy)=>{ const pt=svg.createSVGPoint(); pt.x=cx; pt.y=cy; const m=svg.getScreenCTM(); const p=pt.matrixTransform(m.inverse()); const body=svg.querySelector('[data-map-body]');
    let tx=0,ty=0,z=1; const tr=body&&body.getAttribute('transform'); if(tr){ const mm=/translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+)\)/.exec(tr); if(mm){ tx=+mm[1]; ty=+mm[2]; z=+mm[3]; } }
    const bx=(p.x-tx)/z, by=(p.y-ty)/z; return [bb[0]+bx/sx, bb[3]-by/sx]; };
  let pts=null, line=null;
  svg.addEventListener('pointerdown',ev=>{ if(!DS.lasso) return; ev.stopPropagation(); ev.preventDefault(); pts=[toWorld(ev.clientX,ev.clientY)]; try{ svg.setPointerCapture(ev.pointerId); }catch(e){}
    line=document.createElementNS('http://www.w3.org/2000/svg','polyline'); line.setAttribute('fill','none'); line.setAttribute('stroke','#5B3F8C'); line.setAttribute('stroke-width','1.5'); line.setAttribute('stroke-dasharray','4 3'); (svg.querySelector('[data-map-body]')||svg).appendChild(line); },true);
  svg.addEventListener('pointermove',ev=>{ if(!DS.lasso||!pts) return; ev.stopPropagation(); const w=toWorld(ev.clientX,ev.clientY), l=pts[pts.length-1]; if(Math.hypot(w[0]-l[0],w[1]-l[1])<3) return; pts.push(w);
    const P=C.frame(bb,W,H,0).P; line.setAttribute('points',pts.map(q=>P(q[0],q[1]).map(v=>v.toFixed(1)).join(',')).join(' ')); },true);
  svg.addEventListener('pointerup',ev=>{ if(!DS.lasso||!pts) return; ev.stopPropagation(); const poly=pts; pts=null; if(poly.length<3){ line&&line.remove(); return; }
    let sel=DS.data.B.filter(b=>pip(b.c[0],b.c[1],poly)); const capped=sel.length>LASSO_MAX; if(capped) sel=sel.slice(0,LASSO_MAX);
    DS.poly=poly; DS.sel=sel; DS.capped=capped; DS.lasso=false; rerender(); },true);
  svg.addEventListener('click',ev=>{ if(DS.lasso){ ev.stopPropagation(); ev.preventDefault(); } },true); }
if(!window.__f1d){ window.__f1d=true;
   
  document.addEventListener('click',ev=>{ if(DS.lasso) return; const t=ev.target, m=t.closest&&t.closest(`#f1v .${NS}svg [data-b], #f1v .${NS}svg [data-a]`); if(!m||!DS.data) return; const D=DS.data;
    let b=null, p=null; if(m.hasAttribute('data-b')) b=D.B[+m.getAttribute('data-b')]; else { p=D.A[+m.getAttribute('data-a')]; b=p?D.B.find(q=>pipFlat(p.x,p.y,q.r))||null:null; } if(!b&&!p) return;
    const cl=currentCluster(D), inG=!!(b&&cl&&cl.c.bld.includes(b)), pn=document.querySelector('#f1v .f1v-panel'); if(!pn) return; const old=pn.querySelector(`.${NS}bcard`); if(old) old.remove();
    pn.insertAdjacentHTML('afterbegin',buildingCard(b,p||(b&&b.anchor),inG)); pn.scrollTop=0; },true);
  document.addEventListener('click',ev=>{ const b=ev.target.closest&&ev.target.closest('[data-f1d]'); if(!b) return; const k=b.getAttribute('data-f1d');
    if(k==='setup'){ ev.preventDefault(); const s=[...document.querySelectorAll('#f1v .f1v-strip [data-to]')].find(q=>/Cooling/.test(q.textContent)); if(s) s.click(); return; }
    if(k==='bclose'){ const c=document.querySelector(`#f1v .${NS}bcard`); if(c) c.remove(); return; }
    if(k==='lasso'){ DS.lasso=!DS.lasso; b.setAttribute('aria-pressed',String(DS.lasso)); const W_=b.closest('.f1v-draw')||document; let h=W_.querySelector(`.${NS}lhint`);
      if(DS.lasso){ if(!h){ b.insertAdjacentHTML('afterend',`<span class="${NS}lhint" role="status">Draw around the buildings you want to connect.</span>`); } } else if(h) h.remove(); }
    else if(k==='clear'){ DS.sel=null; DS.poly=null; DS.capped=false; rerender(); }
    else if(k==='layer'){ DS.layer=DS.layer==='demand'?'type':'demand'; rerender(); }
    else if(k==='view'){ DS.view=DS.view==='2d'?'3d':'2d'; rerender(); } });
  document.addEventListener('change',ev=>{ const t=ev.target; if(!t||!t.matches) return; if(t.matches('[data-f1d-retro]')){ DS.inclRetro=!!t.checked; rerender(); } }); }

 
 
const RID=city=>({'Gas price':'price_ceiling (12-month means; econ_gas_price_'+(city==='van'?'bc':'ab')+' for the rate)','Electricity':city==='van'?'econ_elec_price_bc':'','Discount rate':'econ_discount_rate',
  'Pipe cost':'econ_pipe_cost','Heat use':'econ_heat_intensity','Ready to connect':'econ_heating_type','Peak':'econ_network_flh','Loop route':'','Equipment lives':'econ_lives',
  'Backup':'econ_backup_plant','Pipe heat loss':'econ_pipe_loss','Base share in BC practice':'econ_neu_split','Check against a real network':'econ_neu_calibration, econ_lonsdale_check','Own heat pumps (path B)':'econ_building_hp','Operator':''});
function assumptions(D,S){ const E=BD.ECON, city=D.city, gGJ=(E.gas[city]/3.6).toFixed(2), rid=RID(city);
  return [['Gas price',`$${gGJ}/GJ, held for 40 years in real terms`,city==='van'?'FortisBC Rate 3, 2026 (ECON)':'Alberta regulated rate and ATCO delivery (ECON)','if gas rises, the loop looks better'],
    ['Electricity',`$${E.elec[city]}/MWh, held flat`,city==='van'?'BC Hydro large general service energy charge, 2026':'Alberta pool 2025 + EPCOR transmission','if power rises, the loop (and own heat pumps) look worse'],
    ['Discount rate',`${(E.rate*100).toFixed(1)} % real; a public-sector rate to come`,'Squamish NEU feasibility (private utility)','a lower rate favours the loop'],
    ['Pipe cost','$1,850–7,000 per trench metre (central $3,650)','tender bids and a study, not built costs','the least certain input: if higher, the loop looks worse'],
    ['Heat use','estimated from building type and size, not metered','NRCan CEUD 2023; zone as the use','if buildings use more, the loop looks better'],
    ['Ready to connect','residential read as likely needing a retrofit, others unknown; left out of the totals unless switched on','NRCan SHEU 2019 shares (boilers 15 % of BC homes, 23–26 % of apartments)','buildings that are in fact hydronic would add heat at no retrofit cost'],
    ['Peak','annual heat ÷ 2,576–2,681 network full-load hours (diversity included)','Mississauga downtown district energy study, FVB 2023, Table 7 (Edmonton: no cold-climate figure, the same used)','a sharper peak needs more backup'],
    ['Loop route','along the streets from the data centre, not optimised','the engine’s street graph','a better route needs less pipe'],
    ['Equipment lives','pipe 30, heat pumps 25, boilers 25, buildings’ own heat pumps 20 years','ECON; DEA; ASHRAE (pipe life not yet sourced)','longer lives favour the loop'],
    ['Own heat pumps (path B)','$1,540 per kW, SCOP 2.99, upkeep left out','DEA, Denmark, 2025 €, converted (Edmonton colder: worse)','if dearer or less efficient, path B looks worse'],
    ['Backup','central gas boilers sized to heat the whole area if the data centre is offline, $101 per kW','DEA, 2020 € at the 2025 rate (understated); NEU practice (10 MW base, 29 MW gas)','if buildings keep their own boilers as backup, the central boilers could be smaller and cheaper'],
    ['Pipe heat loss','0.17 × (MWh per metre a year)^−0.5 of the heat, taken off before it is sold','IEA Bioenergy Task 32 (2014), European 70–90 °C networks','a cooler or better-insulated loop loses less'],
    ['Base share in BC practice','BC district utilities design to about 70 % of annual heat from their base source; the tool’s table can give more, so its cost may read low','City of Vancouver NEU guidelines; Alexandra DEU target (Richmond)','if the base carries 70 %, more top-up gas and backup: the cost rises'],
    ['Check against a real network','a sanity check, not a calibration: on the Vancouver NEU’s size this method gives a cost of $64–119/MWh against the NEU’s price of $128, which also carries the utility’s return and overhead (29 % lower in the middle); on Lonsdale Energy’s size (gas boilers) $74–149 against its $108','the NEU’s and Lonsdale Energy’s published size, capital and rates (our check, 18 Nov 2026)','the base-share table gives the heat pumps more of the heat than the NEU gets (95 % vs 70 %): the real cost is likely higher'],
    ['Operator','City utility (as the NEU) or a private one; not modelled','—','a margin or a tariff design would change the price']].map(r=>r.concat([rid[r[0]]||''])); }

 
 
function attachCurve(D,cl,S0){ try{ D_CITY=D.city; const CV=curveFor(D,DS.mw,DS.cool), mid=a=>a?(a[0]+a[1])/2:null; S0.curve=CV;
    S0.curveHtml=curveHtml(CV,{k:(cl&&cl.c&&cl.c.bld?cl.c.bld.filter(b=>b.heat&&(DS.inclRetro||b.ready!=='retrofit')).length:0),c:mid(S0.lcohAll||S0.lcoh),lab:DS.sel&&DS.sel.length?'your area':'the best group'},S0.wGas); }catch(e){ console.warn('district curve',e); } }
async function prep(x){ const M0=await x.eng(), D=await gather(x), A=BD.S.answers;
  if(DS.key!==D.key){ DS.key=D.key; DS.sel=null; DS.poly=null; }
   
  DS.mw=(M0&&M0.mwSized)||A.mw||1; DS.cool=A.inside||'air';
   
  try{ const of=offerFor(D,DS.mw,DS.cool), recv=D.A.map(p=>Object.assign({},p)); recv.forEach(p=>{ p.econ=BD.heatEcon(D.f,p,of.avail); }); const B=BD.bestHeat(D.f,recv,of.avail[0]); DS.best=B&&B[0]?B[0]:null; }catch(e){ DS.best=null; }
  const cl=currentCluster(D), S0=cl?breakdown(D,cl.c,DS.mw,DS.cool):null; if(cl) cl.c.rt=S0&&S0.rt; DS.lastRt=S0&&S0.rt?S0.rt.segs:[]; return {D,cl,S0}; }
C.add(T,'Shared energy district',{async build(x){
  const {D,cl,S0}=await prep(x), S=S0&&S0.nEst?S0:null;
  if(S0) attachCurve(D,cl,S0);
  const draw=`<div class="${NS}wrap"><div class="${NS}map"><div class="${NS}bar"><span class="${NS}set">${n1(DS.mw)} MW, ${esc(COOL[DS.cool]||DS.cool)} · <a href="#" data-f1d="setup">change on the Cooling card</a></span>
      <button type="button" data-f1d="lasso" aria-pressed="false">Draw an area</button><button type="button" data-f1d="clear">Clear</button><button type="button" data-f1d="layer">${DS.layer==='demand'?'Show ready to connect':'Show heat demand'}</button><button type="button" data-f1d="view" aria-pressed="${DS.view==='3d'}">${DS.view==='3d'?'Back to the map':'3-D view of the area'}</button>
      <label><input type="checkbox" data-f1d-retro${DS.inclRetro?' checked':''}> Include buildings that need a retrofit</label>${retroSay(cl)}</div>
     ${MAPKEY}<div class="${NS}svg">${mapSvg(D,cl&&cl.c)}</div><div class="${NS}keyh">${keyHtml()}</div>
     <p class="${NS}note">Buildings within ${RANGE} m. Demand: floor area (footprint × storeys from the measured height) × the heat a building of that use needs a year; use read from the zone until better data. ${D.B.filter(b=>!b.heat).length} of ${D.B.length} have no estimate (CD-1, Direct Control or unknown use: no sourced figure; industrial read as warehousing in Vancouver, a proxy).${DS.capped?` Your area held more than ${LASSO_MAX} buildings: the first ${LASSO_MAX} are counted.`:''}</p></div>
    <div class="${NS}pn">${S0?panelHtml(D,S0,cl.label):'<p class="f1v-empty">Draw around a group of buildings.</p>'}</div></div>`;
  setTimeout(()=>{ const h=document.querySelector(`#f1v .${NS}svg`); if(!h) return; if(DS.view==='3d'){ render3d(h,D,cl&&cl.c,S0).catch(e=>{ h.innerHTML='<p class="f1v-empty">The 3-D view could not load: '+esc(e.message)+'</p>'; }); } else wireLasso(h); },60);
  return {noZoneFlag:true,draw,
    lead:'What would happen if this existing area became a shared energy district? Draw around the buildings that would share the heat (size and cooling come from the Cooling card): the tool routes a loop along the streets from the data centre and prices it against both worths.',
    hero:S?[(S.dcH[1]>=10000?{v:rg(S.dcH,v=>n0(v/1000)),u:' GWh/yr',l:'heat the data centre covers, at most'}:{v:rg(S.dcH,n0),u:' MWh/yr',l:'heat the data centre covers, at most'}),{v:S.L?n0(S.L):'?',u:' m',l:'loop along the streets'},(S.partial?{v:'—',l:'can’t price this area yet: most floor area has no estimate'}:{v:S.lcoh?rg(S.lcoh,money):'?',l:'per MWh of heat · likely low: a real network’s price check comes out higher'})]:[],
    rows:S?[['Cluster',cl.label],['Data centre',`${n1(DS.mw)} MW, ${COOL[DS.cool]||DS.cool}`],['Buildings that need a retrofit',DS.inclRetro?'included (retrofit cost not yet sourced)':'left out (switch off)']].concat([['Assumptions','what we assumed · its source · which way the answer moves if it is wrong']]).concat(assumptions(D,S0||S).map(a=>[a[0],`${a[1]} · ${a[2]} · ${a[3]}${a[4]?' · register '+a[4]:''}`])):[],
    more:[['How demand is estimated',`<p>Each building: footprint area × storeys (measured height ÷ 3.5 m; one storey where no height is measured) × the delivered heat a building of that use needs a year × 0.80–0.90 (the gas boiler a loop replaces). Use comes from the parcel’s zone (residential, commercial, industrial; CD-1 and Direct Control unknown) until assessment-use data is in. Intensities: NRCan CEUD 2023, ${x.city==='edm'?'Alberta (offices 315, retail 412, schools 363, health 652, hotels 612, recreation 405, all commercial 389 kWh/m²)':'BC (offices 125, retail 147, schools 137, health 306, hotels 242, recreation 181, all commercial 159 kWh/m²)'}; residential: the NEU reference building, 109 kWh/m² (a new building; older stock uses more). Industrial: counted as transportation and warehousing (${x.city==='edm'?'379':'150'} kWh/m², a proxy). CD-1, Direct Control and unknown uses: no figure, not counted.</p>`],
          ['Heating type',`<p>Only buildings on a district network are marked hydronic. No building-by-building heating data is in the tool yet, so every other building reads “unknown”: the tool never assumes a building can connect. City of Vancouver NEU rule (Connectivity Guidelines May 2026, 6.3): a receiver needs hydronic heating and hot water that can return at 45 °C or below; forced-air or baseboard buildings need a retrofit.</p>`],
          ['The share of the peak',`<p>A district must meet the coldest day. The data centre runs all year at about its offered heat ÷ 8,760 h; the cluster’s peak is its annual heat ÷ a district network’s full-load hours, 2,576–2,681 h (FVB 2023, Mississauga; diversity included). A base source sized to 30 % of peak carries about 90 % of the annual heat, 45 % about 99 % (Hiscock, CIBSE Journal 2023, UK modelling). Below 30 % the table gives nothing: shown as a placeholder. The rest comes from a gas (or electric) peaking boiler.</p>`]],
    src:['Register ids for the figures on this card: heat intensity econ_heat_intensity; pipe cost econ_pipe_cost; pipe heat loss econ_pipe_loss; connections econ_neu_connection_levy (Vancouver), econ_blatchford_tariff (Edmonton); worths econ_gas_price_bc / econ_gas_price_ab, econ_neu_energy_charge, econ_neu_all_in; share of the annual heat econ_base_share; linear heat density econ_lhd_threshold; backup boilers econ_backup_plant; avoided boiler econ_avoided_boiler; ETS rooms econ_ets_room; heating type econ_heating_type; lives econ_lives; discount rate econ_discount_rate.','Buildings: City of Vancouver building footprints 2009 with LiDAR 2022 heights (open data); City of Edmonton rooflines (heights estimated). Use: the parcel’s zone (our reading).','Heat intensity: NRCan Comprehensive Energy Use Database, BC and Territories, 2023 (our arithmetic); residential: City of Vancouver RTS 18251 Table 1.',
      'Heat offered: the engine’s calc (tool/engine.js) at this card’s size and cooling; an air-cooled hall gives all its heat through one heat pump.','Loop: the engine’s street graph and routing tree from the data centre (tool/cards.js routeTree); the union of street paths to each building plus its service run.',
      'Pipe: heating-only 2-pipe band $1,850 / 3,650 / 7,000 per trench metre (Mississauga Downtown DE study 2023 Table 19 scaled to the heating pair; Surrey City Centre DE tender bids, Dec 2021). European $1,038–2,620 (ECON.pipe) and Mississauga 4-pipe $5,300 as notes.',
      'Avoided boiler: DEA Technology Data for Individual Heating Installations, sheet 202, existing apartment block 320 kW, €96/kW (2025 €) × 1.5782.','Heat pumps: capital, full-load hours and upkeep from the Danish Energy Agency technology data (the engine’s figures); COP from the engine’s range (register cop). Annualised at the tool’s 5.6 % real rate over each part’s life.',
      city(x)==='van'?'Connections: False Creek NEU connection levy 2026, $123,873 per ETS + $146 per kW of peak (RTS 18251 Sch. C). ETS room sizes: NEU Connectivity Guidelines May 2026, Table 1.':'Connections (Edmonton): Blatchford Renewable Energy Utility Bylaw 17943 Sch. B, infrastructure fee $22.24 per m² (multi-unit commercial; the per-unit residential fee needs unit counts, not known).',
      city(x)==='edm'?'Heat intensity (Edmonton): NRCan CEUD 2023, Commercial/Institutional, Alberta (our arithmetic); residential: the NEU reference (no Alberta figure).':'Industrial (BC): NRCan CEUD 2023, BC transportation and warehousing, 150 kWh/m² (warehousing stands in for industrial: a proxy; register econ_heat_intensity).',
      'Worths: the gas it replaces (ECON.heatVal); the district energy charge: '+SX.tariff[city(x)].src+'.','Linear heat density thresholds: nPro planning documentation, citing the German energy agency CARMEN (secondary; the Swiss quality guide gives 1.8 MWh per metre).','Carbon: BD.CO2H (ECCC emission factors; the grid factor of each province).'],
    missing:['heating type for most buildings (no data yet)','avoided boiler: a Canadian installed $/kW (Danish figure used)',x.city==='edm'?'Edmonton: network supply temperature':'',x.city==='edm'?'Alberta residential heat intensity (the NEU reference used)':'BC industrial heat intensity: warehousing used as a proxy'].filter(Boolean)}; }});
const city=x=>x.city;

 
const DISC_LINE='Estimates, not a design or a quote. Sources and assumptions below.';
async function still3d(D,cl,S0){ const h=document.createElement('div'); h.style.cssText='position:fixed;left:-10000px;top:0;width:700px'; document.body.appendChild(h);
  try{ await render3d(h,D,cl&&cl.c,S0); const cv=h.querySelector('canvas'); if(cv){ const im=document.createElement('img'); im.src=cv.toDataURL('image/png'); im.alt='3-D view of the area'; im.style.cssText='display:block;width:700px;height:auto'; cv.replaceWith(im); }
    h.style.cssText='position:relative;width:700px'; return h.outerHTML; }
  catch(e){ console.warn('3-D view',e); return '<p class="f1v-empty">The 3-D view isn’t available for this lot yet.</p>'; } finally{ h.remove(); } }
const QUESTION='What would happen if this existing area became a shared energy district?';
C.add(T,'District: the area in 3-D',{async build(x){ const {D,cl,S0}=await prep(x); if(!cl) return {draw:'<p class="ld">No buildings to group around this lot.</p>',rows:[]};
  const S=S0&&S0.nEst?S0:null;
  return {draw:'',more:[['',await still3d(D,cl,S0)]],lead:`${QUESTION} ${cl.label}`,
    rows:[['Data centre',`${n1(DS.mw)} MW, ${COOL[DS.cool]||DS.cool}: the heat source`],['Heat it covers',S?rg(S.dcH,n0,'MWh/yr'):'nothing to price'],['Loop along the streets',S&&S.L?n0(S.L)+' m':'?'],
      ['Cost per MWh of heat',S?(S.partial?'can’t price this area yet: most floor area has no estimate':S.lcoh?rg(S.lcoh,money)+' (pipe cost the least certain)':'?'):'nothing to price'],['Note',DISC_LINE]],
    src:['Buildings: City open footprints with LiDAR heights; trees: the City’s public trees (open data). Loop: the engine’s street graph.']}; }});
 
function panelParts(D,S0,label){ const h=panelHtml(D,S0,label,true), i=h.indexOf('<h4>Over '); const wrap=t=>`<div class="${NS}panel" style="max-height:none;overflow:visible;font-size:12px">${t}</div>`;
  if(i<0) return [wrap(h.replace(/^<div class="[^"]*">/,'').replace(/<\/div>$/,'')),''];
  const body=h.replace(/^<div class="[^"]*">/,'').replace(/<\/div>\s*$/,''), j=body.indexOf('<h4>Over ');
  return [wrap(body.slice(0,j)),wrap(body.slice(j))]; }
for(const [k,t] of [[0,'District: what it would cost'],[1,'District: over 40 years']]) C.add(T,t,{async build(x){ const {D,cl,S0}=await prep(x);
  if(!cl||!S0) return {draw:'',rows:[],more:[['','<p>No cluster to price.</p>']]};
  const P=panelParts(D,S0,cl.label); return {draw:'',rows:[],more:[['',P[k]||'<p>—</p>']],src:k?['40 years: the engine’s ECON rate (5.6 % real), today’s gas and electricity held flat; pipe 30 y, heat pumps 25 y, boilers 25 y (ECON, DEA).']:[]}; }});
 
C.add(T,'District: the size of the group',{async build(x){ const {D,cl,S0}=await prep(x); if(!cl||!S0) return {draw:'',rows:[],more:[['','<p>No cluster to price.</p>']]};
  attachCurve(D,cl,S0); return {draw:'',lead:'How the cost per MWh changes as buildings are added to the group, best first.',rows:[],more:[['',`<div class="${NS}panel" style="max-height:none;overflow:visible">${S0.curveHtml||'<p>Not enough buildings to draw it.</p>'}</div>`]],
    src:['Each point: the card’s own breakdown for the group of that size (same figures and register ids as the card); buildings ranked by their own added cost per MWh.']}; }});
C.add(T,'District: which buildings could connect',{async build(x){ const {D,cl}=await prep(x), was=DS.layer; DS.layer='type'; let svg='', key='';
  try{ svg=mapSvg(D,cl&&cl.c).replace(/ data-map(-[a-z]+)?(="[^"]*")?/g,'').replace(/ data-mk/g,''); key=keyHtml(); } finally{ DS.layer=was; }    
  return {draw:'',lead:'Which buildings could connect today. A building needs hot-water heating that can return cool enough; forced-air or baseboard buildings need a retrofit first. The tool never assumes a building can connect.',
    rows:[],more:[['',`<div style="width:600px">${svg.replace(/width="\d+" height="\d+"/,'width="600" height="600"')}</div>`],['Key',key]],src:['Ready to connect: on a district network (the engine’s receivers); likely retrofit: NRCan Survey of Household Energy Use 2019, Table 6.1 (boilers 15 % of BC and 13 % of Alberta households; 23–26 % of Canadian apartments).']}; }});
C.add(T,'District: assumptions and sources',{async build(x){ const {D,cl,S0}=await prep(x), A=assumptions(D,S0||{});
  const main=C.get(T,'Shared energy district'); let src=[]; try{ src=(await main.build(x)).src||[]; }catch(e){}
  const tbl=`<table class="f1c-res-t"><tr><th>What we assumed</th><td><b>Value</b></td><td><b>Source</b></td><td><b>If it is wrong</b></td><td><b>Register</b></td></tr>${A.map(a=>`<tr><th>${esc(a[0])}</th><td>${esc(a[1])}</td><td>${esc(a[2])}</td><td>${esc(a[3])}</td><td>${esc(a[4]||"none yet")}</td></tr>`).join('')}</table>`;
  return {draw:'',lead:'Every assumption behind the district figures, its source, and which way the answer moves if it is wrong. The same lines as the card.',rows:[],
    more:[['Assumptions',tbl],['Disclaimer',`<p>${esc(BD.F1DISCLAIMER||DISC_LINE)}</p>`]],src}; }});
})();

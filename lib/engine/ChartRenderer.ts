import type { NormalizedCandle } from '@/services/candleProvider'

export const T = {
  bg: '#131722', bgPanel: '#1c2030', bgCard: '#1a1e2e',
  bgSession: 'rgba(0,0,0,0.15)',
  bull: '#26a69a', bear: '#ef5350',
  bullDim: 'rgba(38,166,154,0.15)', bearDim: 'rgba(239,83,80,0.15)',
  grid: 'rgba(255,255,255,0.04)', gridStrong: 'rgba(255,255,255,0.07)',
  text: '#d1d4dc', textMuted: '#787b86', textDim: '#363a45',
  hair: 'rgba(255,255,255,0.25)',
  hud: 'rgba(19,23,34,0.94)', hudBorder: 'rgba(255,255,255,0.08)',
  btnBg: '#1e222d', btnActive: '#2a2e39', btnBorder: '#363a45',
  rsiLine: '#7b61ff', macdLine: '#2196f3', signalLine: '#ff6d00', macdHist: '#6366f1',
  ema9: '#f7c948', ema21: '#ff9800', ema50: '#ab47bc', ema200: '#e53935',
  bbUpper: 'rgba(33,150,243,0.35)', bbLower: 'rgba(33,150,243,0.35)', bbFill: 'rgba(33,150,243,0.05)',
  volProfile: 'rgba(33,150,243,0.1)', volPOC: 'rgba(247,201,72,0.45)',
}

export const fmtPrice = (p: number): string => {
  if (p >= 10000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (p >= 100) return p.toFixed(2)
  if (p >= 1) return p.toFixed(4)
  return p.toFixed(6)
}
export const fmtVol = (v: number): string => {
  if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B'
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M'
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K'
  return v.toFixed(0)
}
const fmtTime = (ts: number): string => { const d = new Date(ts); return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}` }
const fmtDate = (ts: number): string => { const d = new Date(ts); return `${d.getMonth()+1}/${d.getDate()}` }
function niceStep(r: number): number { if(r<=0)return 1; const m=Math.pow(10,Math.floor(Math.log10(r))),v=r/m; return v<1.5?m:v<3.5?2*m:v<7.5?5*m:10*m }
function niceTimeStep(ms: number): number { return [60000,300000,900000,1800000,3600000,14400000,86400000].find(s=>s>=ms)??86400000 }
export const BAR_MS = 5*60*1000

export class Mapper {
  xMin:number;xMax:number;yMin:number;yMax:number;W:number;H:number;pL:number;pR:number;pT:number;pB:number
  constructor(xMin:number,xMax:number,yMin:number,yMax:number,W:number,H:number,pL=8,pR=64,pT=8,pB=24){
    this.xMin=xMin;this.xMax=xMax;this.yMin=yMin;this.yMax=yMax;this.W=W;this.H=H;this.pL=pL;this.pR=pR;this.pT=pT;this.pB=pB
  }
  update(p:Partial<{xMin:number;xMax:number;yMin:number;yMax:number}>){if(p.xMin!==undefined)this.xMin=p.xMin;if(p.xMax!==undefined)this.xMax=p.xMax;if(p.yMin!==undefined)this.yMin=p.yMin;if(p.yMax!==undefined)this.yMax=p.yMax}
  xPx(t:number){return this.pL+(t-this.xMin)/(this.xMax-this.xMin||1)*(this.W-this.pL-this.pR)}
  yPx(p:number){return this.pT+(1-(p-this.yMin)/(this.yMax-this.yMin||1))*(this.H-this.pT-this.pB)}
  pxX(x:number){return this.xMin+(x-this.pL)/(this.W-this.pL-this.pR)*(this.xMax-this.xMin||1)}
  pxY(y:number){return this.yMin+(1-(y-this.pT)/(this.H-this.pT-this.pB))*(this.yMax-this.yMin||1)}
  cw(bms:number){return Math.max(2,(bms/(this.xMax-this.xMin||1))*(this.W-this.pL-this.pR)*0.7)}
  get chartL(){return this.pL} get chartR(){return this.W-this.pR} get chartB(){return this.H-this.pB}
  get chartW(){return this.W-this.pL-this.pR} get chartH(){return this.H-this.pT-this.pB}
}

export function buildMapper(c:NormalizedCandle[],W:number,H:number,barMs=BAR_MS):Mapper{
  const v=c.slice(-120);if(!v.length)return new Mapper(0,1,0,1,W,H)
  const lo=Math.min(...v.map(x=>x.low)),hi=Math.max(...v.map(x=>x.high)),p=(hi-lo)*0.12||hi*0.05
  return new Mapper(v[0].time-barMs,v[v.length-1].time+barMs*2,lo-p,hi+p,W,H)
}

export type ChartType='candle'|'line'|'area'|'volume'
export type IndicatorKey='rsi'|'macd'|'ema9'|'ema21'|'ema50'|'ema200'|'bb'|'volProfile'

// ── Math ──────────────────────────────────────────────────
function ema(d:number[],p:number):number[]{const r=[d[0]],k=2/(p+1);for(let i=1;i<d.length;i++)r.push(d[i]*k+r[i-1]*(1-k));return r}

export function computeRSI(c:NormalizedCandle[],period=14):number[]{
  const r=new Array(c.length).fill(50);if(c.length<period+1)return r
  let g=0,l=0;for(let i=1;i<=period;i++){const d=c[i].close-c[i-1].close;if(d>0)g+=d;else l-=d}
  g/=period;l/=period;r[period]=l===0?100:100-100/(1+g/l)
  for(let i=period+1;i<c.length;i++){const d=c[i].close-c[i-1].close;g=(g*(period-1)+(d>0?d:0))/period;l=(l*(period-1)+(d<0?-d:0))/period;r[i]=l===0?100:100-100/(1+g/l)}
  return r
}

export function computeMACD(c:NormalizedCandle[]):{macd:number[];signal:number[];hist:number[]}{
  const cl=c.map(x=>x.close),e12=ema(cl,12),e26=ema(cl,26),m=e12.map((v,i)=>v-e26[i]),s=ema(m,9)
  return{macd:m,signal:s,hist:m.map((v,i)=>v-s[i])}
}

export function computeEMA(c:NormalizedCandle[],period:number):number[]{return ema(c.map(x=>x.close),period)}

export function computeBB(c:NormalizedCandle[],period=20,mult=2):{upper:number[];middle:number[];lower:number[]}{
  const cl=c.map(x=>x.close),mid=ema(cl,period),upper:number[]=[],lower:number[]=[]
  for(let i=0;i<cl.length;i++){
    const start=Math.max(0,i-period+1),slice=cl.slice(start,i+1)
    const avg=slice.reduce((a,b)=>a+b,0)/slice.length
    const std=Math.sqrt(slice.reduce((a,b)=>a+(b-avg)**2,0)/slice.length)
    upper.push(mid[i]+mult*std);lower.push(mid[i]-mult*std)
  }
  return{upper,middle:mid,lower}
}

export function computeVolProfile(c:NormalizedCandle[],bins=40):{price:number;vol:number;isPOC:boolean}[]{
  if(!c.length)return[]
  const lo=Math.min(...c.map(x=>x.low)),hi=Math.max(...c.map(x=>x.high)),bs=(hi-lo)/bins||1
  const vols=new Float64Array(bins)
  for(const x of c){const bL=Math.max(0,Math.min(bins-1,Math.floor((x.low-lo)/bs))),bH=Math.max(0,Math.min(bins-1,Math.floor((x.high-lo)/bs)));const sp=bH-bL+1;for(let b=bL;b<=bH;b++)vols[b]+=x.volume/sp}
  let mx=0,poc=0;for(let i=0;i<bins;i++)if(vols[i]>mx){mx=vols[i];poc=i}
  if(mx===0)mx=1
  return Array.from({length:bins},(_,i)=>({price:lo+(i+0.5)*bs,vol:vols[i]/mx,isPOC:i===poc}))
}

// ── Renderers ─────────────────────────────────────────────
export function drawGrid(ctx:CanvasRenderingContext2D,m:Mapper,c:NormalizedCandle[],H:number){
  // Session bands (alternating darker vertical stripes)
  const tR=m.pxX(m.chartR)-m.pxX(m.chartL),tS=niceTimeStep(tR/6),t0=Math.ceil(m.pxX(m.chartL)/tS)*tS
  let band=false
  for(let t=t0;t<=m.pxX(m.chartR)+tS;t+=tS){
    if(band){const x1=Math.max(m.chartL,m.xPx(t-tS)),x2=Math.min(m.chartR,m.xPx(t))
      ctx.fillStyle=T.bgSession;ctx.fillRect(x1,m.pT,x2-x1,m.chartH)}
    band=!band}
  // Horizontal grid + price labels on RIGHT
  const lo=Math.min(...c.map(x=>x.low)),hi=Math.max(...c.map(x=>x.high)),p=(hi-lo)*0.12||hi*0.05
  const ps=niceStep((hi-lo+2*p)/6),pS=Math.ceil((lo-p)/ps)*ps
  ctx.font='10px Inter,-apple-system,sans-serif';ctx.textAlign='left'
  for(let v=pS;v<=hi+p+ps;v+=ps){const y=m.yPx(v);if(y<m.pT||y>m.chartB)continue
    ctx.strokeStyle=T.grid;ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(m.chartL,y);ctx.lineTo(m.chartR,y);ctx.stroke()
    ctx.fillStyle=T.textMuted;ctx.fillText(fmtPrice(v),m.chartR+5,y+3)}
  // Time axis
  ctx.textAlign='center';for(let t=t0;t<=m.pxX(m.chartR);t+=tS){const x=m.xPx(t);if(x<m.chartL+16||x>m.chartR-16)continue
    ctx.strokeStyle=T.grid;ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(x,m.pT);ctx.lineTo(x,m.chartB);ctx.stroke()
    ctx.fillStyle=T.textMuted;ctx.fillText(tS<86400000?fmtTime(t):fmtDate(t),x,H-5)}
}

export function drawCandles(ctx:CanvasRenderingContext2D,m:Mapper,c:NormalizedCandle[],barMs=BAR_MS){
  const cw=m.cw(barMs),maxV=Math.max(...c.map(x=>x.volume),1)
  // Volume bars — prominent
  for(const x of c){const cx=m.xPx(x.time),bh=(x.volume/maxV)*m.chartH*0.22
    ctx.globalAlpha=0.35;ctx.fillStyle=x.close>=x.open?T.bull:T.bear;ctx.fillRect(cx-cw/2,m.chartB-bh,Math.max(1,cw),bh)}
  ctx.globalAlpha=1
  // Candles — thin, realistic
  for(const x of c){const cx=m.xPx(x.time),b=x.close>=x.open,col=b?T.bull:T.bear
    const oY=m.yPx(x.open),cY=m.yPx(x.close),hY=m.yPx(x.high),lY=m.yPx(x.low)
    // Wick
    ctx.strokeStyle=col;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx,hY);ctx.lineTo(cx,lY);ctx.stroke()
    // Body
    const top=Math.min(oY,cY),bH=Math.max(1,Math.abs(oY-cY))
    if(cw<3){ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(cx,top);ctx.lineTo(cx,top+bH);ctx.stroke()}
    else{ctx.fillStyle=col;ctx.fillRect(cx-cw/2,top,cw,bH)}}
}

export function drawLine(ctx:CanvasRenderingContext2D,m:Mapper,c:NormalizedCandle[]){
  if(c.length<2)return;ctx.strokeStyle=T.bull;ctx.lineWidth=1.5;ctx.lineJoin='round';ctx.beginPath()
  c.forEach((x,i)=>{const px=m.xPx(x.time),py=m.yPx(x.close);i===0?ctx.moveTo(px,py):ctx.lineTo(px,py)});ctx.stroke()
}

export function drawArea(ctx:CanvasRenderingContext2D,m:Mapper,c:NormalizedCandle[]){
  if(c.length<2)return;drawLine(ctx,m,c)
  const g=ctx.createLinearGradient(0,m.pT,0,m.chartB);g.addColorStop(0,'rgba(34,197,94,0.18)');g.addColorStop(1,'rgba(34,197,94,0)')
  ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(m.xPx(c[0].time),m.chartB)
  c.forEach(x=>ctx.lineTo(m.xPx(x.time),m.yPx(x.close)));ctx.lineTo(m.xPx(c[c.length-1].time),m.chartB);ctx.closePath();ctx.fill()
}

export function drawVolume(ctx:CanvasRenderingContext2D,m:Mapper,c:NormalizedCandle[]){
  const cw=m.cw(BAR_MS),mx=Math.max(...c.map(x=>x.volume),1)
  for(const x of c){const cx=m.xPx(x.time),bh=(x.volume/mx)*m.chartH*0.85
    ctx.globalAlpha=0.75;ctx.fillStyle=x.close>=x.open?T.bull:T.bear;ctx.fillRect(cx-cw/2,m.chartB-bh,Math.max(2,cw*.9),bh)}
  ctx.globalAlpha=1
}

export function drawLastPrice(ctx:CanvasRenderingContext2D,m:Mapper,c:NormalizedCandle[]){
  if(!c.length)return;const last=c[c.length-1],y=m.yPx(last.close),b=last.close>=last.open
  ctx.strokeStyle=b?T.bull:T.bear;ctx.globalAlpha=0.3;ctx.lineWidth=0.5;ctx.setLineDash([2,3])
  ctx.beginPath();ctx.moveTo(m.chartL,y);ctx.lineTo(m.chartR,y);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1
}

export function drawEMA(ctx:CanvasRenderingContext2D,m:Mapper,c:NormalizedCandle[],values:number[],color:string){
  ctx.strokeStyle=color;ctx.lineWidth=1;ctx.lineJoin='round';ctx.globalAlpha=0.7;ctx.beginPath()
  let s=false;for(let i=0;i<c.length;i++){const x=m.xPx(c[i].time),y=m.yPx(values[i])
    if(x<m.chartL||x>m.chartR)continue;if(!s){ctx.moveTo(x,y);s=true}else ctx.lineTo(x,y)}
  ctx.stroke();ctx.globalAlpha=1
}

export function drawBB(ctx:CanvasRenderingContext2D,m:Mapper,c:NormalizedCandle[],bb:{upper:number[];middle:number[];lower:number[]}){
  // Fill between bands
  ctx.fillStyle=T.bbFill;ctx.beginPath()
  let s=false
  for(let i=0;i<c.length;i++){const x=m.xPx(c[i].time);if(x<m.chartL||x>m.chartR)continue;if(!s){ctx.moveTo(x,m.yPx(bb.upper[i]));s=true}else ctx.lineTo(x,m.yPx(bb.upper[i]))}
  for(let i=c.length-1;i>=0;i--){const x=m.xPx(c[i].time);if(x<m.chartL||x>m.chartR)continue;ctx.lineTo(x,m.yPx(bb.lower[i]))}
  ctx.closePath();ctx.fill()
  // Upper/lower lines
  for(const[vals,col]of[[bb.upper,T.bbUpper],[bb.lower,T.bbLower]] as [number[],string][]){
    ctx.strokeStyle=col;ctx.lineWidth=0.8;ctx.setLineDash([3,3]);ctx.beginPath();s=false
    for(let i=0;i<c.length;i++){const x=m.xPx(c[i].time);if(x<m.chartL||x>m.chartR)continue;if(!s){ctx.moveTo(x,m.yPx(vals[i]));s=true}else ctx.lineTo(x,m.yPx(vals[i]))}
    ctx.stroke();ctx.setLineDash([])}
}

export function drawVolProfile(ctx:CanvasRenderingContext2D,m:Mapper,bins:{price:number;vol:number;isPOC:boolean}[]){
  if(!bins.length)return;const maxW=m.chartW*0.18
  for(const b of bins){const y=m.yPx(b.price),w=b.vol*maxW;if(y<m.pT||y>m.chartB)continue
    const bh=Math.max(2,m.chartH/bins.length-1)
    ctx.fillStyle=b.isPOC?T.volPOC:T.volProfile;ctx.fillRect(m.chartL,y-bh/2,w,bh)}
}

export function drawCrosshair(ctx:CanvasRenderingContext2D,m:Mapper,ch:{mx:number;my:number;price:number;ts:number},H:number){
  ctx.strokeStyle=T.hair;ctx.lineWidth=0.5;ctx.setLineDash([2,3])
  ctx.beginPath();ctx.moveTo(ch.mx,m.pT);ctx.lineTo(ch.mx,m.chartB);ctx.stroke()
  ctx.beginPath();ctx.moveTo(m.chartL,ch.my);ctx.lineTo(m.chartR,ch.my);ctx.stroke();ctx.setLineDash([])
  // Price badge on RIGHT
  ctx.fillStyle='#1e222d';ctx.fillRect(m.chartR+1,ch.my-8,m.pR-2,16);ctx.strokeStyle=T.btnBorder;ctx.lineWidth=0.5;ctx.strokeRect(m.chartR+1,ch.my-8,m.pR-2,16)
  ctx.fillStyle=T.text;ctx.font='9px Inter,sans-serif';ctx.textAlign='left';ctx.fillText(fmtPrice(ch.price),m.chartR+4,ch.my+3)
  // Time badge on bottom
  const tw=48;ctx.fillStyle='#1e222d';ctx.fillRect(ch.mx-tw/2,m.chartB+1,tw,14);ctx.strokeStyle=T.btnBorder;ctx.strokeRect(ch.mx-tw/2,m.chartB+1,tw,14)
  ctx.fillStyle=T.text;ctx.textAlign='center';ctx.fillText(fmtTime(ch.ts),ch.mx,m.chartB+11)
}

export function drawRSI(ctx:CanvasRenderingContext2D,rsi:number[],c:NormalizedCandle[],m:Mapper,y0:number,h:number){
  ctx.fillStyle=T.bg;ctx.fillRect(0,y0,m.W,h);ctx.strokeStyle=T.gridStrong;ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(0,y0);ctx.lineTo(m.W,y0);ctx.stroke()
  const my=(v:number)=>y0+3+(1-v/100)*(h-6)
  ctx.strokeStyle='rgba(239,68,68,0.15)';ctx.setLineDash([2,3]);ctx.beginPath();ctx.moveTo(m.chartL,my(70));ctx.lineTo(m.chartR,my(70));ctx.stroke()
  ctx.strokeStyle='rgba(34,197,94,0.15)';ctx.beginPath();ctx.moveTo(m.chartL,my(30));ctx.lineTo(m.chartR,my(30));ctx.stroke();ctx.setLineDash([])
  ctx.fillStyle=T.textDim;ctx.font='8px Inter,sans-serif';ctx.textAlign='right';ctx.fillText('70',m.chartL-4,my(70)+3);ctx.fillText('30',m.chartL-4,my(30)+3)
  ctx.fillStyle=T.rsiLine;ctx.textAlign='left';ctx.font='9px Inter,sans-serif';ctx.fillText('RSI',m.chartL+3,y0+10)
  ctx.strokeStyle=T.rsiLine;ctx.lineWidth=1.2;ctx.lineJoin='round';ctx.beginPath();let s=false
  for(let i=0;i<c.length;i++){const x=m.xPx(c[i].time),y=my(rsi[i]);if(x<m.chartL||x>m.chartR)continue;if(!s){ctx.moveTo(x,y);s=true}else ctx.lineTo(x,y)}
  ctx.stroke()
}

export function drawMACD(ctx:CanvasRenderingContext2D,macd:number[],signal:number[],hist:number[],c:NormalizedCandle[],m:Mapper,y0:number,h:number){
  ctx.fillStyle=T.bg;ctx.fillRect(0,y0,m.W,h);ctx.strokeStyle=T.gridStrong;ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(0,y0);ctx.lineTo(m.W,y0);ctx.stroke()
  const all=[...macd,...signal,...hist],mx=Math.max(...all.map(Math.abs),0.001)
  const my=(v:number)=>y0+h/2-(v/mx)*(h/2-5),cw=Math.max(1.5,m.cw(BAR_MS)*0.5)
  ctx.fillStyle=T.macdLine;ctx.textAlign='left';ctx.font='9px Inter,sans-serif';ctx.fillText('MACD',m.chartL+3,y0+10)
  ctx.strokeStyle='rgba(255,255,255,0.03)';ctx.setLineDash([1,3]);ctx.beginPath();ctx.moveTo(m.chartL,my(0));ctx.lineTo(m.chartR,my(0));ctx.stroke();ctx.setLineDash([])
  for(let i=0;i<c.length;i++){const x=m.xPx(c[i].time);if(x<m.chartL||x>m.chartR)continue
    ctx.globalAlpha=0.5;ctx.fillStyle=hist[i]>=0?T.bull:T.bear;const y1=my(0),y2=my(hist[i]);ctx.fillRect(x-cw/2,Math.min(y1,y2),cw,Math.abs(y2-y1)||1)}
  ctx.globalAlpha=1
  for(const[vals,col,w]of[[macd,T.macdLine,1.2],[signal,T.signalLine,0.8]] as [number[],string,number][]){
    ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();let s=false
    for(let i=0;i<c.length;i++){const x=m.xPx(c[i].time);if(x<m.chartL||x>m.chartR)continue;if(!s){ctx.moveTo(x,my(vals[i]));s=true}else ctx.lineTo(x,my(vals[i]))}
    ctx.stroke()}
}

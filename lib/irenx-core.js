// IRENX PRIME CORE — deterministic market-structure engine.
// No AI model is allowed to invent market state; all states are derived from OHLC data.

const TF_ORDER = ['1m','3m','5m','15m','30m','1H','2H','4H','6H','12H','1D','1W','1M'];

function num(v){ const n=Number(v); return Number.isFinite(n)?n:null; }
function normalizeBars(rows){
  return (rows||[]).map(r=>({
    time:Number(r.datetime ? Date.parse(r.datetime)/1000 : r.time),
    open:num(r.open), high:num(r.high), low:num(r.low), close:num(r.close), volume:num(r.volume)||0
  })).filter(x=>x.time&&x.open!=null&&x.high!=null&&x.low!=null&&x.close!=null).sort((a,b)=>a.time-b.time);
}

function atr(bars, period=14){
  if(bars.length<period+1)return null;
  let tr=[];
  for(let i=1;i<bars.length;i++) tr.push(Math.max(bars[i].high-bars[i].low,Math.abs(bars[i].high-bars[i-1].close),Math.abs(bars[i].low-bars[i-1].close)));
  return tr.slice(-period).reduce((a,b)=>a+b,0)/period;
}
function swings(bars,left=2,right=2){
  const out=[];
  for(let i=left;i<bars.length-right;i++){
    let hi=true,lo=true;
    for(let j=1;j<=left;j++){hi&&=bars[i].high>=bars[i-j].high;lo&&=bars[i].low<=bars[i-j].low;}
    for(let j=1;j<=right;j++){hi&&=bars[i].high>bars[i+j].high;lo&&=bars[i].low<bars[i+j].low;}
    if(hi)out.push({type:'HIGH',index:i,price:bars[i].high,time:bars[i].time});
    if(lo)out.push({type:'LOW',index:i,price:bars[i].low,time:bars[i].time});
  }
  return out;
}
function structure(bars){
  const sw=swings(bars); const highs=sw.filter(x=>x.type==='HIGH'), lows=sw.filter(x=>x.type==='LOW');
  let labels=[];
  for(let i=1;i<highs.length;i++) labels.push({type:highs[i].price>highs[i-1].price?'HH':'LH',price:highs[i].price,time:highs[i].time});
  for(let i=1;i<lows.length;i++) labels.push({type:lows[i].price>lows[i-1].price?'HL':'LL',price:lows[i].price,time:lows[i].time});
  labels.sort((a,b)=>a.time-b.time);
  const last=bars.at(-1), prevHigh=highs.at(-1), prevLow=lows.at(-1);
  let bos='NONE',mss='NONE';
  if(prevHigh&&last.close>prevHigh.price)bos='BULLISH';
  if(prevLow&&last.close<prevLow.price)bos='BEARISH';
  if(bars.length>=3){
    const a=bars.at(-3),b=bars.at(-2),c=bars.at(-1);
    if(a.close<b.close&&c.close<b.low)mss='BEARISH';
    if(a.close>b.close&&c.close>b.high)mss='BULLISH';
  }
  const recent=labels.slice(-6);
  const bull=recent.filter(x=>x.type==='HH'||x.type==='HL').length;
  const bear=recent.filter(x=>x.type==='LH'||x.type==='LL').length;
  return {swings:sw,labels:recent,bos,mss,bias:bull>bear?'BULLISH':bear>bull?'BEARISH':'NEUTRAL'};
}
function liquidity(bars){
  const sw=swings(bars); const highs=sw.filter(x=>x.type==='HIGH').slice(-4), lows=sw.filter(x=>x.type==='LOW').slice(-4); const last=bars.at(-1); const a=atr(bars)||0;
  const highPool=highs.length?Math.max(...highs.map(x=>x.price)):null, lowPool=lows.length?Math.min(...lows.map(x=>x.price)):null;
  const buySweep=highPool!=null && last.high>highPool && last.close<highPool;
  const sellSweep=lowPool!=null && last.low<lowPool && last.close>lowPool;
  return {buySide:highPool,sellSide:lowPool,buySweep,sellSweep,atr:a};
}
function displacement(bars){
  if(bars.length<20)return {state:'INSUFFICIENT',score:0};
  const a=atr(bars)||0,last=bars.at(-1),body=Math.abs(last.close-last.open),range=last.high-last.low;
  const ratio=a?body/a:0; const direction=last.close>last.open?'BULLISH':last.close<last.open?'BEARISH':'NEUTRAL';
  return {state:ratio>=1.2?'CONFIRMED':ratio>=0.8?'MODERATE':'WEAK',score:Math.min(100,Math.round(ratio/1.5*100)),direction,ratio,range};
}
function orochi(bars,st){
  if(bars.length<20)return {state:'WAIT',score:0};
  const closes=bars.slice(-20).map(x=>x.close); const fast=closes.slice(-5).reduce((a,b)=>a+b,0)/5; const slow=closes.reduce((a,b)=>a+b,0)/20;
  const dir=fast>slow?'BULLISH':fast<slow?'BEARISH':'NEUTRAL';
  const aligned=dir===st.bias;
  return {state:aligned?'ALIGNED':'CONFLICT',direction:dir,score:aligned?80:35};
}
function regime(all){
  const scores=[];
  for(const tf of ['1D','4H','1H']){const x=all[tf]; if(!x||x.length<20)continue; const st=structure(x); scores.push(st.bias==='BULLISH'?1:st.bias==='BEARISH'?-1:0);}
  const s=scores.reduce((a,b)=>a+b,0); return s>0?'BULLISH':s<0?'BEARISH':'NEUTRAL';
}
function analyze(all, mode='INTRADAY'){
  const available=Object.fromEntries(Object.entries(all).map(([tf,b])=>[tf,normalizeBars(b)]));
  const tf=mode==='SCALP'?'5m':'15m'; const bars=available[tf]||available['15m']||available['5m']||[];
  if(bars.length<30)return {status:'NO TRADE',reason:'INSUFFICIENT REAL BARS',regime:'UNKNOWN'};
  const st=structure(bars),liq=liquidity(bars),disp=displacement(bars),oro=orochi(bars,st),reg=regime(available);
  const scores={regime:reg==='BULLISH'&&st.bias==='BULLISH'||reg==='BEARISH'&&st.bias==='BEARISH'?90:55,liquidity:(liq.buySweep||liq.sellSweep)?90:45,structure:st.bias===reg?85:55,reflexivity:disp.state==='CONFIRMED'?90:disp.state==='MODERATE'?70:40,orochi:oro.score};
  const score=Math.round(Object.values(scores).reduce((a,b)=>a+b,0)/Object.keys(scores).length);
  const direction=liq.sellSweep&&st.bias==='BULLISH'?'BUY':liq.buySweep&&st.bias==='BEARISH'?'SELL':st.bias==='BULLISH'?'BUY':st.bias==='BEARISH'?'SELL':'WAIT';
  const trigger=mode==='SCALP' ? (st.mss!=='NONE'&&disp.state==='CONFIRMED') : (st.bos!=='NONE'||st.mss!=='NONE');
  const status=score>=78&&trigger&&oro.state!=='CONFLICT'?'READY':score>=60?'WAIT':'NO TRADE';
  return {status,direction:status==='READY'?direction:'WAIT',score,regime,structure:st,liquidity:liq,displacement:disp,orochi:oro,scores,timeframe:tf,mode};
}
module.exports={TF_ORDER,normalizeBars,atr,swings,structure,liquidity,displacement,orochi,regime,analyze};

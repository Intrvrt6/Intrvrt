const SYMBOLS={XAUUSD:'XAU/USD',EURUSD:'EUR/USD',GBPUSD:'GBP/USD',USDJPY:'USD/JPY',NAS100:'NDX'};
const INTERVALS={1:'1min',3:'1min',5:'5min',15:'15min',30:'30min',60:'1h',120:'2h',240:'4h',360:'1h',720:'1h',D:'1day',W:'1week',M:'1month'};
const AGG={3:3,360:6,720:12};
function aggregate(v,minutes){const step=minutes*60;const out=[];let bucket=null;for(const x of v){const t=Math.floor(Date.parse(x.datetime+'Z')/1000/step)*step;if(bucket===null||t!==bucket.t){if(bucket)out.push(bucket);bucket={datetime:new Date(t*1000).toISOString(),open:Number(x.open),high:Number(x.high),low:Number(x.low),close:Number(x.close),volume:Number(x.volume)||0,t};}else{bucket.high=Math.max(bucket.high,Number(x.high));bucket.low=Math.min(bucket.low,Number(x.low));bucket.close=Number(x.close);bucket.volume+=(Number(x.volume)||0);}}if(bucket)out.push(bucket);return out.map(({t,...x})=>x);}
export default async function handler(req,res){
 const symbol=String(req.query.symbol||'XAUUSD').toUpperCase(),tf=String(req.query.tf||'15');const td=SYMBOLS[symbol],interval=INTERVALS[tf];if(!td||!interval)return res.status(400).json({error:'Unsupported symbol/timeframe'});
 const key=process.env.TWELVEDATA_API_KEY;if(!key)return res.status(503).json({error:'TWELVEDATA_API_KEY is not configured'});
 const output=Math.min(Math.max(Number(req.query.outputsize)||300,50),1000);const sourceOutput=AGG[tf]?Math.min(output*(AGG[tf]+2),1000):output;
 const url=`https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(td)}&interval=${interval}&outputsize=${sourceOutput}&timezone=UTC&order=ASC&apikey=${encodeURIComponent(key)}`;
 try{const r=await fetch(url);const data=await r.json();if(!r.ok||data.status==='error')return res.status(502).json({error:data.message||'Market provider error'});let values=(data.values||[]).map(x=>({datetime:x.datetime,open:Number(x.open),high:Number(x.high),low:Number(x.low),close:Number(x.close),volume:Number(x.volume)||0}));if(AGG[tf])values=aggregate(values,AGG[tf]);return res.status(200).json({symbol,timeframe:tf,interval,provider:'twelvedata',values:values.slice(-output)});}catch(e){return res.status(502).json({error:'Market provider unavailable'});}
}

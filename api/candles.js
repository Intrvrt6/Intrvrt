const SYMBOLS={XAUUSD:'XAU/USD',EURUSD:'EUR/USD',GBPUSD:'GBP/USD',USDJPY:'USD/JPY',NAS100:'NDX'};
const INTERVALS={1:'1min',3:'5min',5:'5min',15:'15min',30:'30min',60:'1h',120:'2h',240:'4h',360:'4h',720:'8h',D:'1day',W:'1week',M:'1month'};
export default async function handler(req,res){
 const symbol=String(req.query.symbol||'XAUUSD').toUpperCase(), tf=String(req.query.tf||'15'); const td=SYMBOLS[symbol], interval=INTERVALS[tf];
 if(!td||!interval)return res.status(400).json({error:'Unsupported symbol/timeframe'});
 const key=process.env.TWELVEDATA_API_KEY;if(!key)return res.status(503).json({error:'TWELVEDATA_API_KEY is not configured'});
 const output=Math.min(Math.max(Number(req.query.outputsize)||300,50),1000);
 const url=`https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(td)}&interval=${interval}&outputsize=${output}&timezone=UTC&order=ASC&apikey=${encodeURIComponent(key)}`;
 try{const r=await fetch(url);const data=await r.json();if(!r.ok||data.status==='error')return res.status(502).json({error:data.message||'Market provider error'});return res.status(200).json({symbol,timeframe:tf,interval,provider:'twelvedata',values:(data.values||[]).map(x=>({datetime:x.datetime,open:Number(x.open),high:Number(x.high),low:Number(x.low),close:Number(x.close),volume:Number(x.volume)||0}))});}catch(e){return res.status(502).json({error:'Market provider unavailable'});}
}

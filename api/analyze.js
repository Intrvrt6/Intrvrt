import {analyze} from '../lib/irenx-core.js';
const SYMBOLS={XAUUSD:'XAU/USD',EURUSD:'EUR/USD',GBPUSD:'GBP/USD',USDJPY:'USD/JPY',NAS100:'NDX'};
const MAP={m1:'1min',m5:'5min',m15:'15min',h1:'1h',h4:'4h',d1:'1day'};
async function series(symbol,interval,key){const u=`https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=250&timezone=UTC&order=ASC&apikey=${encodeURIComponent(key)}`;const r=await fetch(u);const d=await r.json();if(!r.ok||d.status==='error')throw new Error(d.message||'provider error');return d.values||[];}
export default async function handler(req,res){
 const symbol=String(req.query.symbol||'XAUUSD').toUpperCase(),mode=String(req.query.mode||'INTRADAY').toUpperCase(),td=SYMBOLS[symbol],key=process.env.TWELVEDATA_API_KEY;
 if(!td)return res.status(400).json({error:'Unsupported symbol'});if(!key)return res.status(503).json({error:'TWELVEDATA_API_KEY is not configured'});
 try{const entries=await Promise.all(Object.entries(MAP).map(async([k,v])=>[k,await series(td,v,key)]));const all={};for(const[k,v]of entries)all[k]=v;const mapped={};const alias={m1:'1m',m5:'5m',m15:'15m',h1:'1H',h4:'4H',d1:'1D'};for(const[k,v]of Object.entries(all))mapped[alias[k]]=v;const result=analyze(mapped,mode);return res.status(200).json({symbol,mode,provider:'twelvedata',result,generatedAt:new Date().toISOString()});}catch(e){return res.status(502).json({error:e.message||'Analysis unavailable'});}
}

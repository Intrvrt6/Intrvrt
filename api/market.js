const SYMBOLS={XAUUSD:'XAU/USD',EURUSD:'EUR/USD',GBPUSD:'GBP/USD',USDJPY:'USD/JPY',NAS100:'NDX'};
export default async function handler(req,res){
  const symbol=String(req.query.symbol||'XAUUSD').toUpperCase(); const td=SYMBOLS[symbol];
  if(!td)return res.status(400).json({error:'Unsupported symbol'});
  const key=process.env.TWELVEDATA_API_KEY;
  if(!key)return res.status(503).json({error:'TWELVEDATA_API_KEY is not configured'});
  const url=`https://api.twelvedata.com/quote?symbol=${encodeURIComponent(td)}&apikey=${encodeURIComponent(key)}`;
  try{const r=await fetch(url);const data=await r.json();if(!r.ok||data.status==='error')return res.status(502).json({error:data.message||'Market provider error'});const p=Number(data.close);return res.status(200).json({symbol,provider:'twelvedata',price:p,bid:Number(data.bid)||p,ask:Number(data.ask)||p,timestamp:Number(data.timestamp)||Math.floor(Date.now()/1000),datetime:data.datetime});}catch(e){return res.status(502).json({error:'Market provider unavailable'});}
}

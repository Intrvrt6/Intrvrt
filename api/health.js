export default async function handler(req,res){
  const started=Date.now();
  const hasMarketKey=Boolean(process.env.TWELVEDATA_API_KEY);
  const hasDb=Boolean(process.env.DATABASE_URL);
  const checks={
    runtime:'ok',
    market_provider:hasMarketKey?'configured':'missing_secret',
    database:hasDb?'configured':'not_configured'
  };
  const critical=checks.market_provider==='configured';
  return res.status(critical?200:503).json({
    service:'irenx-api',status:critical?'ready':'degraded',checks,latency_ms:Date.now()-started,
    generated_at:new Date().toISOString()
  });
}

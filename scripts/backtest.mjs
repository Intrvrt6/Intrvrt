import fs from 'node:fs';
import {analyze} from '../lib/irenx-core.js';

const file=process.argv[2];
if(!file){console.error('Usage: node scripts/backtest.mjs data.json');process.exit(1)}
const raw=JSON.parse(fs.readFileSync(file,'utf8'));
const bars=raw.values||raw;
const tf=raw.timeframe||'15m';
let trades=0,wins=0,losses=0,r=0;
for(let i=60;i<bars.length-1;i++){
  const slice=bars.slice(0,i+1);
  const result=analyze({[tf]:slice,'5m':tf==='5m'?slice:undefined,'15m':tf==='15m'?slice:undefined},'INTRADAY');
  if(result.status!=='READY'||result.direction==='WAIT')continue;
  trades++;
  const next=bars[i+1];
  const entry=slice.at(-1).close;
  const risk=Math.max(result.displacement?.atr||0,(slice.at(-1).high-slice.at(-1).low));
  if(!risk){losses++;r-=1;continue}
  const favorable=result.direction==='BUY'?next.high-entry:entry-next.low;
  const adverse=result.direction==='BUY'?entry-next.low:next.high-entry;
  if(favorable>risk&&favorable>adverse){wins++;r+=1}else{losses++;r-=1}
}
const winRate=trades?wins/trades:0;
console.log(JSON.stringify({timeframe:tf,trades,wins,losses,winRate,netR:r},null,2));

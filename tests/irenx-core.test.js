import assert from 'node:assert/strict';
import {normalizeBars,structure,liquidity,displacement,analyze} from '../lib/irenx-core.js';

function bar(time,open,high,low,close){return {time,open,high,low,close,volume:100};}
const raw=[];
for(let i=0;i<80;i++){const p=100+i*.12;raw.push(bar(1700000000+i*60,p,p+1,p-1,p+.35));}
const bars=normalizeBars(raw);
assert.equal(bars.length,80);
const st=structure(bars);
assert.ok(['BULLISH','BEARISH','NEUTRAL'].includes(st.bias));
const liq=liquidity(bars);
assert.equal(typeof liq.buySweep,'boolean');
assert.equal(typeof liq.sellSweep,'boolean');
const disp=displacement(bars);
assert.ok(['CONFIRMED','MODERATE','WEAK','INSUFFICIENT'].includes(disp.state));
const result=analyze({'15m':bars,'5m':bars,'1H':bars,'4H':bars,'1D':bars},'SCALP');
assert.ok(['READY','WAIT','NO TRADE'].includes(result.status));
assert.ok(result.score>=0&&result.score<=100);
console.log('IRENX core smoke tests: PASS');

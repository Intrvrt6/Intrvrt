import 'dotenv/config';
import http from 'node:http';
import {WebSocketServer,WebSocket} from 'ws';
const PORT=process.env.WS_PORT||8787, key=process.env.TWELVEDATA_API_KEY;
if(!key)console.warn('TWELVEDATA_API_KEY missing: upstream WS will not connect.');
const upstream=new WebSocket(`wss://ws.twelvedata.com/v1/quotes/price?apikey=${encodeURIComponent(key||'')}`);
const clients=new Set();
const symbols=new Set(['XAU/USD','EUR/USD','GBP/USD','USD/JPY','NDX']);
function subscribe(){if(upstream.readyState===WebSocket.OPEN)upstream.send(JSON.stringify({action:'subscribe',params:{symbols:[...symbols].join(',')}}));}
upstream.on('open',()=>subscribe());
upstream.on('message',raw=>{for(const c of clients)if(c.readyState===WebSocket.OPEN)c.send(raw.toString());});
upstream.on('close',()=>setTimeout(()=>process.exit(1),2000));
const server=http.createServer((req,res)=>{res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({service:'IRENX market websocket',status:'ok'}));});
const wss=new WebSocketServer({server});
wss.on('connection',c=>{clients.add(c);c.send(JSON.stringify({type:'status',status:'connected'}));c.on('close',()=>clients.delete(c));});
server.listen(PORT,()=>console.log(`IRENX WS listening on ${PORT}`));

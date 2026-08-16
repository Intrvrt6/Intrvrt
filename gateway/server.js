import 'dotenv/config';
import http from 'node:http';
import {WebSocketServer, WebSocket} from 'ws';

const HOST=process.env.GATEWAY_HOST||'127.0.0.1';
const PORT=Number(process.env.GATEWAY_PORT||8787);
const TOKEN=process.env.IRENX_GATEWAY_TOKEN;
const UPSTREAM_WS=process.env.UPSTREAM_WS_URL||'';
const allowedOrigins=(process.env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);

function authorized(req){
  if(!TOKEN) return false;
  const auth=req.headers.authorization||'';
  return auth===`Bearer ${TOKEN}`;
}
function originOK(req){
  if(!allowedOrigins.length) return true;
  return allowedOrigins.includes(req.headers.origin||'');
}
function json(res,status,body){res.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(body));}

const server=http.createServer((req,res)=>{
  if(req.url==='/health') return json(res,200,{service:'irenx-gateway',status:'ok',time:new Date().toISOString()});
  if(!authorized(req)) return json(res,401,{error:'unauthorized'});
  if(req.url==='/') return json(res,200,{service:'irenx-gateway',ws:'/ws'});
  if(req.url==='/market/state') return json(res,200,{service:'irenx-gateway',status:'ready'});
  return json(res,404,{error:'not_found'});
});

const wss=new WebSocketServer({noServer:true});
const clients=new Set();
let upstream=null;

function connectUpstream(){
  if(!UPSTREAM_WS || upstream) return;
  upstream=new WebSocket(UPSTREAM_WS);
  upstream.on('message',data=>{
    for(const c of clients) if(c.readyState===WebSocket.OPEN)c.send(data.toString());
  });
  upstream.on('close',()=>{upstream=null;setTimeout(connectUpstream,2000)});
  upstream.on('error',()=>{try{upstream.close()}catch{}});
}

server.on('upgrade',(req,socket,head)=>{
  if(req.url!=='/ws'||!authorized(req)||!originOK(req)){socket.write('HTTP/1.1 401 Unauthorized\\r\\n\\r\\n');socket.destroy();return;}
  wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req));
});

wss.on('connection',ws=>{
  clients.add(ws);
  ws.send(JSON.stringify({type:'gateway',status:'connected',time:new Date().toISOString()}));
  connectUpstream();
  ws.on('close',()=>clients.delete(ws));
});

server.listen(PORT,HOST,()=>console.log(`IRENX Gateway listening on ${HOST}:${PORT}`));

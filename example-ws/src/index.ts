import * as http from 'http';
import * as fs from 'fs';
import * as WebSocket from 'ws';
import { RpcExtenstionWebSockets } from './rpc/rpc-extension-ws';

// web socket server
const wss = new WebSocket.Server({ port: 8081 }, () => {
  console.log('websocket server is listening on port 8081');
});

const sub = (a: number, b: number) => {
  return a-b;
};

wss.on('connection', function connection(ws) {
  console.log('new ws connection');

  const rpc = new RpcExtenstionWebSockets(ws);
  rpc.setResponseTimeout(30000);
  rpc.registerMethod({func: sub});

  rpc.invoke("sum", [1,2]).then((val: any) => {
    console.log(`sum is ${val}`);
  }).catch((err: any) => {
    console.error(err);
  });
});

// static content http server
http.createServer(function (req, res) {
  let url = req.url;
  fs.readFile(__dirname + req.url, function (err,data) {
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    if (url && url.indexOf(".js") >= 0) {
      res.setHeader("Content-Type", "application/javascript");
    }
    res.writeHead(200,);
    res.end(data);
  });
}).listen(8080, ()=> {
  console.log('static content server is listening on port 8080');
});

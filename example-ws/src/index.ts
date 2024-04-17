import * as http from "http";
import * as fs from "fs";
import * as WebSocket from "ws";
import { IRpc } from "./rpc/rpc-common";
import { RpcExtensionWebSockets } from "./rpc/rpc-extension-ws";
import { sanitizeUrl } from '@braintree/sanitize-url';

// web socket server
const wss = new WebSocket.Server({ port: 8081 }, () => {
  console.log("websocket server is listening on port 8081");
});

const sub = (a: number, b: number): number => {
  return a-b;
};

wss.on("connection", function connection(ws) {
  console.log("new ws connection");

  // logger is optional second parameter, implementing interface IChildLogger:
  // https://github.com/SAP/vscode-logging/blob/master/packages/types/api.d.ts#L17
  const rpc: IRpc = new RpcExtensionWebSockets(ws);
  rpc.setResponseTimeout(30000);
  rpc.registerMethod({func: sub});

  rpc.invoke("sum", ...[1,2]).then((val) => {
    console.log(`sum is ${val}`);
  }).catch((err) => {
    console.error(err);
  });
});

// static content http server
http.createServer(function (req, res) {
  const url = sanitizeUrl(req.url);
  fs.readFile(`${__dirname}/static${url}`, function (err,data) {
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    if (url && url.includes(".js")) {
      res.setHeader("Content-Type", "application/javascript");
    }
    res.writeHead(200,);
    res.end(data);
  });
}).listen(8080, ()=> {
  console.log("static content server is listening on port 8080");
});

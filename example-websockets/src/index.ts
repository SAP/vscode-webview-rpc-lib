import * as http from "node:http";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as WebSocket from "ws";
import { IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import { RpcExtensionWebSockets } from "@sap-devx/webview-rpc/out.ext/rpc-extension-ws";

// web socket server
const wss = new WebSocket.Server({ port: 8081 }, () => {
  console.log("websocket server is listening on port 8081");
});

const sub: (a: number, b: number) => number = (a: number, b: number): number => {
  return a - b;
};

wss.on("connection", async (ws) => {
  console.log("new ws connection");

  // logger is optional second parameter, implementing interface IChildLogger:
  // https://github.com/SAP/vscode-logging/blob/master/packages/types/api.d.ts#L17
  const rpc: IRpc = new RpcExtensionWebSockets(ws);
  rpc.registerMethod({ func: sub });

  try {
    const val = await rpc.remote.sum(1, 2);
    console.log(`sum(1,2) was evaluated in the client and the result is ${val}`);
  } catch (err) {
    console.error(err);
  }
});

// static content http server
http.createServer(async (req: http.IncomingMessage, res: http.ServerResponse) => {
  const url: URL | undefined = new URL(req.url || "", `http://${req.headers.host}`);
  if (!url) {
    return res.writeHead(400).end("Invalid URL"); // index.html
  }

  let fileName: string = path.basename(url.pathname);
  if (fileName === "noop-logger") {
    fileName = "noop-logger.js";
  }

  if (fileName === "") {
    fileName = "index.html";
  }

  let fullPath: string = path.join(__dirname, "..", "static", fileName);
  if (fileName.startsWith("rpc") || fileName.startsWith("noop")) {
    fullPath = path.join(__dirname, "..", "node_modules", "@sap-devx", "webview-rpc", "out.browser", fileName);
  }

  if (fileName.endsWith(".js")) {
    res.setHeader("Content-Type", "application/javascript");
  }

  try {
    const data: Buffer = await fs.readFile(fullPath);
    res.writeHead(200);
    res.end(data);
  } catch (err) {
    console.error(`Error reading file: ${err}`);
    res.writeHead(404);
    res.end(JSON.stringify({ error: "File not found" }));
    return;
  }
}).listen(8080, () => {
  console.log("static content server is listening on port 8080");
});

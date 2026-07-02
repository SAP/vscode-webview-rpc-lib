import { RpcCommon, IPromiseCallbacks } from "./rpc-common";
import * as WebSocket from "ws";

export class RpcExtensionWebSockets extends RpcCommon {
  ws: WebSocket;

  constructor(ws: WebSocket) {
    super();
    this.ws = ws;
    this.ws.on("message", (message) => {
      const raw = message.toString();
      const messageObject: any = JSON.parse(raw);
      switch (messageObject.command) {
      case "rpc-response":
        this.handleResponse(messageObject);
        break;
      case "rpc-request":
        this.handleRequest(messageObject);
        break;
      }
    });
  }

  sendRequest(id: number, method: string, params?: any[]) {
    // consider cancelling the timer if the promise if fulfilled before timeout is reached
    this.scheduleResponseTimeout(() => {
      const promiseCallbacks: IPromiseCallbacks | undefined = this.promiseCallbacks.get(id);
      if (promiseCallbacks) {
        promiseCallbacks.reject("Request timed out");
        this.promiseCallbacks.delete(id);
      }
    });

    const requestObject: any = {
      command: "rpc-request",
      id: id,
      method: method,
      params: params
    };

    this.ws.send(JSON.stringify(requestObject));
  }

  sendResponse(id: number, response: any, success: boolean = true): void {
    const responseObject: any = {
      command: "rpc-response",
      id: id,
      response: response,
      success: success
    };

    this.ws.send(JSON.stringify(responseObject));
  }
}

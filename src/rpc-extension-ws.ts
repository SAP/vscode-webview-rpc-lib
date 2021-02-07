import { RpcCommon, IPromiseCallbacks } from "./rpc-common";
import * as WebSocket from "ws";
import { IChildLogger } from "@vscode-logging/types";
import { noopLogger } from "./noop-logger";

export class RpcExtensionWebSockets extends RpcCommon {
  private static readonly className = "RpcExtensionWebSockets";
  private readonly logger: IChildLogger;
  ws: WebSocket;

  constructor(ws: WebSocket, logger: IChildLogger = noopLogger) {
    super(logger.getChildLogger({ label: RpcExtensionWebSockets.className }));
    this.logger = logger.getChildLogger({ label: RpcExtensionWebSockets.className });
    this.ws = ws;
    this.ws.on("message", message => {
      // assuming message is a stringified JSON
      const messageObject: any = JSON.parse(message as string);
      this.logger.debug(`Event Listener:  ${messageObject.command} id: ${messageObject.id} method: ${messageObject.method} params: ${messageObject.params}`);
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
    setTimeout(() => {
      const promiseCallbacks: IPromiseCallbacks | undefined = this.promiseCallbacks.get(id);
      if (promiseCallbacks) {
        this.logger.warn(`sendRequest: Request ${id} method ${method} has timed out`);
        promiseCallbacks.reject("Request timed out");
        this.promiseCallbacks.delete(id);
      }
    }, this.timeout);

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
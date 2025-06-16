import { RpcCommon, IPromiseCallbacks, MessageBody, RpcCommand, RequestBody, ResponseBody } from "./rpc-common";
import * as WebSocketx from "ws";
import { IChildLogger } from "@vscode-logging/types";
import { noopLogger } from "./noop-logger";

export class RpcExtensionWebSockets extends RpcCommon {
  private static readonly className = "RpcExtensionWebSockets";
  private readonly logger: IChildLogger;
  ws: WebSocketx.WebSocket;

  constructor(ws: WebSocketx.WebSocket, logger: IChildLogger = noopLogger) {
    super(logger.getChildLogger({ label: RpcExtensionWebSockets.className }));
    this.logger = logger.getChildLogger({ label: RpcExtensionWebSockets.className });
    this.ws = ws;
    this.ws.on("message", message => {
      // assuming message is a stringified JSON
      const messageAsString: string = message.toString();
      const messageObject: MessageBody = JSON.parse(messageAsString);
      this.logger.debug(`Event Listener: Received event: ${messageAsString}`);
      switch (messageObject.command) {
      case RpcCommand.RPC_RESPONSE:
        this.handleResponse(messageObject);
        break;
      case RpcCommand.RPC_REQUEST:
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

    const requestObject: RequestBody = {
      command: RpcCommand.RPC_REQUEST,
      id: id,
      method: method,
      params: params
    };

    this.ws.send(JSON.stringify(requestObject));
  }

  sendResponse(id: number, response: any, success: boolean = true): void {
    const responseObject: ResponseBody = {
      command: RpcCommand.RPC_RESPONSE,
      id: id,
      response: response,
      success: success
    };

    this.ws.send(JSON.stringify(responseObject));
  }
}
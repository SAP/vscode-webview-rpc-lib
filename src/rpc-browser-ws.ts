// must specify ".js" for import in browser to locate rpc-common.js
// see: https://github.com/microsoft/TypeScript/issues/16577#issuecomment-343610106

import { RpcCommon, IPromiseCallbacks, RequestBody, ResponseBody, RpcCommand, MessageBody } from "./rpc-common.js";
import { IChildLogger } from "@vscode-logging/types";
import { noopLogger } from "./noop-logger";

export class RpcBrowserWebSockets extends RpcCommon {
  private static readonly className = "RpcBrowserWebSockets";
  private readonly logger: IChildLogger;
  ws: WebSocket;

  constructor(ws: WebSocket, logger: IChildLogger = noopLogger) {
    super(logger.getChildLogger({ label: RpcBrowserWebSockets.className }));
    this.logger = logger.getChildLogger({ label: RpcBrowserWebSockets.className });
    this.ws = ws;
    this.ws.addEventListener("message", (event) => {
      const message: MessageBody = JSON.parse(event.data as string);
      this.logger.debug(`Event Listener: Received event: ${JSON.stringify(message)}`);
      switch (message.command) {
        case RpcCommand.RPC_RESPONSE:
          this.handleResponse(message);
          break;
        case RpcCommand.RPC_REQUEST:
          this.handleRequest(message);
          break;
      }
    });
  }

  sendRequest(id: number, method: string, params?: any[]) {
    // TODO: consider cancelling the timer if the promise is fulfilled before timeout is reached
    setTimeout(() => {
      const promiseCallbacks: IPromiseCallbacks | undefined = this.promiseCallbacks.get(id);
      if (promiseCallbacks) {
        this.logger.warn(`sendRequest: Request ${id} method ${method} has timed out`);
        promiseCallbacks.reject("Request timed out");
        this.promiseCallbacks.delete(id);
      }
    }, this.timeout);

    // TODO: find an alternative to appending vscode to the global scope (perhaps providing vscode as parameter to constructor)
    const requestBody: RequestBody = {
      command: RpcCommand.RPC_REQUEST,
      id: id,
      method: method,
      params: params
    };

    this.ws.send(JSON.stringify(requestBody));
  }

  sendResponse(id: number, response: any, success: boolean = true): void {
    const responseBody: ResponseBody = {
      command: RpcCommand.RPC_RESPONSE,
      id: id,
      response: response,
      success: success
    };

    this.ws.send(JSON.stringify(responseBody));
  }
}

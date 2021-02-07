// must specify ".js" for import in browser to locate rpc-common.js
// see: https://github.com/microsoft/TypeScript/issues/16577#issuecomment-343610106

import { IChildLogger } from "@vscode-logging/types";
import { noopLogger } from "../noop-logger";
import { RpcCommon, IPromiseCallbacks } from "../rpc-common";

export class RpcMock extends RpcCommon {
  peer: RpcMock | undefined;

  constructor(logger: IChildLogger = noopLogger) {
    super(logger);
  }

  setPeer(peer: RpcMock) {
    this.peer = peer;
  }

  sendRequest(id: number, method: string, params?: any[]) {
    // TODO: consider cancelling the timer if the promise if fulfilled before timeout is reached
    setTimeout(() => {
      const promiseCallbacks: IPromiseCallbacks | undefined = this.promiseCallbacks.get(id);
      if (promiseCallbacks) {
        promiseCallbacks.reject("Request timed out");
        this.promiseCallbacks.delete(id);
      }
    }, this.timeout);

    // TODO: find an alternative to appending vscode to the global scope (perhaps providing vscode as parameter to constructor)
    const requestBody: any = {
      command: "rpc-request",
      id: id,
      method: method,
      params: params
    };

    this.send(JSON.stringify(requestBody));
  }

  sendResponse(id: number, response: any, success: boolean = true): void {
    const responseBody: any = {
      command: "rpc-response",
      id: id,
      response: response,
      success: success
    };

    this.send(JSON.stringify(responseBody));
  }

  send(message: string) {
    if (this.peer) {
      this.peer.receive(message);
    }
  }

  receive(message: string) {
    const messageObject: any = JSON.parse(message);
    switch (messageObject.command) {
    case "rpc-response":
      this.handleResponse(messageObject);
      break;
    case "rpc-request":
      this.handleRequest(messageObject);
      break;
    }

  }
}

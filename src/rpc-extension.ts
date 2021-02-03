import * as vscode from "vscode";
import { RpcCommon, IPromiseCallbacks } from "./rpc-common";
import { IChildLogger } from "@vscode-logging/types";
import { noopLogger } from "./noop-logger";

export class RpcExtension extends RpcCommon {
  webview: vscode.Webview;

  constructor(webview: vscode.Webview, logger: IChildLogger = noopLogger) {
    super(logger);
    this.webview = webview;
    this.webview.onDidReceiveMessage(message => {
      this.logger.debug(`Received event: ${message.command} id: ${message.id} method: ${message.method} params: ${message.params}`);
      switch (message.command) {
      case "rpc-response":
        this.handleResponse(message);
        break;
      case "rpc-request":
        this.handleRequest(message);
        break;
      }
    });
  }

  sendRequest(id: number, method: string, params?: any[]) {
    // consider cancelling the timer if the promise if fulfilled before timeout is reached
    setTimeout(() => {
      const promiseCallbacks: IPromiseCallbacks | undefined = this.promiseCallbacks.get(id);
      if (promiseCallbacks) {
        this.logger.warn(`Request ${id} method ${method} has timed out`);
        promiseCallbacks.reject("Request timed out");
        this.promiseCallbacks.delete(id);
      }
    }, this.timeout);

    this.webview.postMessage({
      command: "rpc-request",
      id: id,
      method: method,
      params: params
    });
  }

  sendResponse(id: number, response: any, success: boolean = true): void {
    this.webview.postMessage({
      command: "rpc-response",
      id: id,
      response: response,
      success: success
    });
  }
}
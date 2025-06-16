/* must specify ".js" for import in browser to locate rpc-common.js
 see: https://github.com/microsoft/TypeScript/issues/16577#issuecomment-343610106
*/

import { RpcCommon, IPromiseCallbacks, MessageBody, RpcCommand } from "./rpc-common.js";
import { IChildLogger } from "@vscode-logging/types";
import { noopLogger } from "./noop-logger.js";

export class RpcBrowser extends RpcCommon {
  private static readonly className = "RpcBrowser";
  private readonly logger: IChildLogger;
  window: Window;
  vscode: WebviewFrame;
  host: string | undefined;

  constructor(window: Window, vscode: WebviewFrame, logger: IChildLogger = noopLogger) {
    super(logger.getChildLogger({ label: RpcBrowser.className }));
    this.logger = logger.getChildLogger({ label: RpcBrowser.className });
    this.window = window;
    this.vscode = vscode;
    this.host = undefined;
    this.window.addEventListener("message", (event) => {
      const message: MessageBody = event.data;
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

  setHost(host: string) {
    this.host = host;
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
    this.vscode.postMessage({
      command: RpcCommand.RPC_REQUEST,
      id: id,
      method: method,
      params: params
    }, this.host);
  }

  sendResponse(id: number, response: any, success: boolean = true): void {
    this.vscode.postMessage({
      command: RpcCommand.RPC_RESPONSE,
      id: id,
      response: response,
      success: success
    }, this.host);
  }
}

interface WebviewFrame{
  postMessage(message: MessageBody, host?: string): Thenable<boolean>;
}

// must specify ".js" for import in browser to locate rpc-common.js
// see: https://github.com/microsoft/TypeScript/issues/16577#issuecomment-343610106

import { RpcCommon, IPromiseCallbacks } from './rpc-common.js';

export class RpcBrowser extends RpcCommon {
  window: Window;

  constructor(window: Window) {
    super();
    this.window = window;
    this.window.addEventListener('message', (event) => {
      const message = event.data;
      switch (message.command) {
        case "rpc-response":
          this.handleResponse(message);
          break;
        case 'rpc-request':
          this.handleRequest(message);
          break;
      }
    });
  }

  sendRequest(id: number, method: string, params: any[]) {
    // consider cancelling the timer if the promise if fulfilled before timeout is reached
    setTimeout(() => {
      const promiseCallbacks: IPromiseCallbacks | undefined = this.promiseCallbacks.get(id);
      if (promiseCallbacks) {
        promiseCallbacks.reject("Request timed out");
        this.promiseCallbacks.delete(id);
      }
    }, this.timeout);

    (this.window as any).vscode.postMessage({
      command: 'rpc-request',
      id: id,
      method: method,
      params: params
    }, '*');
  }

  sendResponse(id: number, response: any, success: boolean = true): void {
    (this.window as any).vscode.postMessage({
      command: 'rpc-response',
      id: id,
      response: response,
      success: success
    }, '*');
  }
}

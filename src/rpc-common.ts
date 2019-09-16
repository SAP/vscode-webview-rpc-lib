export interface IRpc {
  // constructor(currentPanel:any, functions);
  invoke(method: string, params: any, callback: Function);
  postMessage(id, method, params);
}

export abstract class RpcCommon implements IRpc{
  abstract postMessage(id: any, method: any, params: any);
  callbacks: Function[]; // callbacks that are called when returning fron the webview
  
  invoke(method: string, params: any, callback: Function) {
    let id = Math.random();
    this.callbacks[id] = callback;
    this.postMessage(id, method, params);
  }

}
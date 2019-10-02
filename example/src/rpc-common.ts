export interface IRpc {
  // constructor(currentPanel:any, functions);
  invoke(method: string, params: any, callback: Function) : void;
  postMessage(id: number, method: string, params: any[]) : void;
}

export abstract class RpcCommon implements IRpc{
  abstract postMessage(id: number, method: string, params: any[]) : void;
  callbacks: Function[] = []; // callbacks that are called when returning fron the webview
  
  invoke(method: string, params: any[], callback: Function) {
    let id = Math.random();
    this.callbacks[id] = callback;
    this.postMessage(id, method, params);
  }

}
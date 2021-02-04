import { IChildLogger } from "@vscode-logging/types";

export interface IRpc {
  invoke(method: string, params?: any): Promise<any>;
  sendRequest(id: number, method: string, params?: any[]): void;
  sendResponse(id: number, response: any, success?: boolean): void;
  handleResponse(message: any): void;
  handleRequest(message: any): void;
  registerMethod(method: IMethod): void;
  unregisterMethod(method: IMethod): void;
  setResponseTimeout(timeout: number): void;
  listLocalMethods(): string[];
  listRemoteMethods(): Promise<string[]>;
}

export interface IPromiseCallbacks {
  resolve: Function;
  reject: Function;
}

export interface IMethod {
  func: Function;
  thisArg?: any;
  name?: string;
}

export abstract class RpcCommon implements IRpc {
  abstract sendRequest(id: number, method: string, params?: any[]): void;
  abstract sendResponse(id: number, response: any, success?: boolean): void;
  protected promiseCallbacks: Map<number, IPromiseCallbacks>; // promise resolve and reject callbacks that are called when returning from remote
  protected methods: Map<string, IMethod>;
  protected logger: IChildLogger;
  // TODO: timeouts do not make sense for user interactions. consider not using timeouts by default
  protected timeout: number = 3600000; // timeout for response from remote in milliseconds

  constructor(logger: IChildLogger) {
    this.promiseCallbacks = new Map();
    this.methods = new Map();
    this.logger = logger;
    this.registerMethod({ func: this.listLocalMethods, thisArg: this });
  }

  public setResponseTimeout(timeout: number): void {
    this.timeout = timeout;
  }

  public registerMethod(method: IMethod): void {
    this.methods.set((method.name ? method.name : method.func.name), method);
  }

  public unregisterMethod(method: IMethod): void {
    this.methods.delete((method.name ? method.name : method.func.name));
  }

  public listLocalMethods(): string[] {
    return Array.from(this.methods.keys());
  }

  public listRemoteMethods(): Promise<string[]> {
    return this.invoke("listLocalMethods");
  }

  invoke(method: string, params?: any[]): Promise<any> {
  // TODO: change to something more unique (or check to see if id doesn't already exist in this.promiseCallbacks)
    const id = Math.random();
    const promise = new Promise((resolve, reject) => {
      this.promiseCallbacks.set(id, { resolve: resolve, reject: reject });
    });

    this.sendRequest(id, method, params);
    return promise;
  }

  handleResponse(message: any): void {
    const promiseCallbacks: IPromiseCallbacks | undefined = this.promiseCallbacks.get(message.id);
    if (promiseCallbacks) {
      this.logger.trace(`Handling response for id: ${message.id} message success flag is: ${message.success}`);
      if (message.success) {
        promiseCallbacks.resolve(message.response);
      } else {
        this.logger.warn(`Message id ${message.id} rejected, response: ${message.response}`);
        promiseCallbacks.reject(message.response);
      }
      this.promiseCallbacks.delete(message.id);
    }
  }

  async handleRequest(message: any): Promise<void> {
    const method: IMethod | undefined = this.methods.get(message.method);
    this.logger.trace(`Handling request id: ${message.id} method: ${message.method} parameters: ${message.params}`);
    if (method) {
      const func: Function = method.func;
      const thisArg: any = method.thisArg;
      try {
        let response: any = func.apply(thisArg, message.params);
        // if response is a promise, delay the response until the promise is fulfilled
        if (response && typeof response.then === "function") {
          response = await response;
        }
        this.sendResponse(message.id, response);
      } catch (err) {
        this.logger.error(`Failed to handle request ${message.command} id: ${message.id} error: ${err}`);
        this.sendResponse(message.id, err, false);
      }
    }
  }
}
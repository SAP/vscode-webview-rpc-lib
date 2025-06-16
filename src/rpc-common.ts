import { IChildLogger } from "@vscode-logging/types";

export interface IRpc {
  invoke(method: string, ...params: any[]): Promise<any>;
  sendRequest(id: number, method: string, params?: any[]): void;
  sendResponse(id: number, response: any, success?: boolean): void;
  registerMethod(method: IMethod): void;
  unregisterMethod(method: IMethod): void;
  setResponseTimeout(timeout: number): void;
  listLocalMethods(): string[];
  listRemoteMethods(): Promise<string[]>;
  remote: Record<string, (...args: any[]) => Promise<any>>;
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

export const enum RpcCommand {
  RPC_REQUEST = "rpc-request",
  RPC_RESPONSE = "rpc-response",
}

export type MessageBody = RequestBody | ResponseBody;

export type RequestBody = {
  command: RpcCommand.RPC_REQUEST;
  id: number;
  method: string;
  params?: any[];
}

export type ResponseBody = {
  command: RpcCommand.RPC_RESPONSE;
  id: number;
  response: any;
  success?: boolean;
}

export abstract class RpcCommon implements IRpc {
  abstract sendRequest(id: number, method: string, params?: any[]): void;
  abstract sendResponse(id: number, response: any, success?: boolean): void;
  protected promiseCallbacks: Map<number, IPromiseCallbacks>; // promise resolve and reject callbacks that are called when returning from remote
  protected methods: Map<string, IMethod>;
  public remote: { [name: string]: (...args: any[]) => Promise<any> };

  private readonly baseLogger: IChildLogger;
  // TODO: timeouts do not make sense for user interactions. consider not using timeouts by default
  protected timeout: number = 3600000; // timeout for response from remote in milliseconds

  constructor(logger: IChildLogger) {
    const self = this;
    this.remote = new Proxy({}, {
      get(target, methodName) {
        return (...params: any) => {
          return self.invoke(methodName.toString(), ...params);
        };
      },
    });

    this.promiseCallbacks = new Map();
    this.methods = new Map();
    this.baseLogger = logger.getChildLogger({ label: "RpcCommon" });
    this.registerMethod({ func: this.listLocalMethods, thisArg: this });
  }

  public setResponseTimeout(timeout: number): void {
    this.timeout = timeout;
  }

  public registerMethod(method: IMethod): void {
    const methodName: string = method.name ? method.name : method.func.name;
    this.methods.set(methodName, method);
  }

  public unregisterMethod(method: IMethod): void {
    const methodName: string = method.name ? method.name : method.func.name;
    this.methods.delete(methodName);
    delete this.remote[methodName];
  }

  public listLocalMethods(): string[] {
    return Array.from(this.methods.keys());
  }

  public listRemoteMethods(): Promise<string[]> {
    return this.invoke("listLocalMethods");
  }

  /**
   * @ deprecated As a public method. Use rpc.remote.<methodName>(...params) instead
   * @param method name of the method to invoke 
   * @param params parameters of the method to invoke
   * @returns the result of the invoked method (as a promise)
   */
  public invoke(method: string, ...params: any[]): Promise<any> {
    // TODO: change the id to something more unique (or check to see if id doesn't already exist in this.promiseCallbacks)
    const id = Math.random();
    const promise = new Promise((resolve, reject) => {
      this.promiseCallbacks.set(id, { resolve: resolve, reject: reject });
    });

    this.sendRequest(id, method, params);
    return promise;
  }

  protected handleResponse(message: ResponseBody): void {
    const promiseCallbacks: IPromiseCallbacks | undefined = this.promiseCallbacks.get(message.id);
    if (promiseCallbacks) {
      this.baseLogger.trace(`handleResponse: processing response for id: ${message.id} message success flag is: ${message.success}`);
      if (message.success) {
        promiseCallbacks.resolve(message.response);
      } else {
        this.baseLogger.warn(`handleResponse: Message id ${message.id} rejected, response: ${message.response}`);
        promiseCallbacks.reject(message.response);
      }
      this.promiseCallbacks.delete(message.id);
    }
  }

  protected async handleRequest(message: RequestBody): Promise<void> {
    const method: IMethod | undefined = this.methods.get(message.method);
    this.baseLogger.trace(`handleRequest: processing request id: ${message.id} method: ${message.method} parameters: ${JSON.stringify(message.params)}`);
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
        this.baseLogger.error(`handleRequest: Failed processing request ${message.command} id: ${message.id}`, { error: err });
        this.sendResponse(message.id, err, false);
      }
    }
  }
}
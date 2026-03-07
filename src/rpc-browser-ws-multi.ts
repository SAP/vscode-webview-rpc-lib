/**
 * RpcBrowserWebSocketsMulti
 *
 * Browser-side RPC class for scenarios where multiple consumers share a single
 * WebSocket endpoint. This class adds:
 *
 * 1. **Plugin (consumer) namespacing** — Messages include a `plugin` field; only messages
 *    for this plugin are processed
 * 2. **Auto-reconnect** — Automatically reconnects after disconnect
 * 3. **Message queueing** — Messages sent before connection is open are queued
 * 4. **Lifecycle management** — Explicit connect()/disconnect() methods
 *
 * @example
 * ```ts
 * const rpc = new RpcBrowserWebSocketsMulti('my-plugin');
 * rpc.registerMethod({ func: handleNotification, name: 'notify' });
 * rpc.connect();
 *
 * const data = await rpc.invoke('getData', arg1, arg2);
 * ```
 */

// must specify ".js" for import in browser to locate rpc-common.js
// see: https://github.com/microsoft/TypeScript/issues/16577#issuecomment-343610106
import { RpcCommon, IPromiseCallbacks, RpcMultiMessage } from "./rpc-common.js";
import { IChildLogger, noopLogger } from "./noop-logger.js";

// Re-export RpcMultiMessage for consumers who import from this module
export { RpcMultiMessage } from "./rpc-common.js";

export class RpcBrowserWebSocketsMulti extends RpcCommon {
  private static readonly className = "RpcBrowserWebSocketsMulti";
  private readonly logger: IChildLogger;

  /** Plugin namespace for message routing */
  readonly pluginName: string;

  /** WebSocket URL to connect to */
  private wsUrl: string;

  /** The WebSocket instance */
  private ws: WebSocket | null = null;

  /** Whether currently connected */
  private _connected: boolean = false;

  /** Queue for messages sent before connection is open */
  private messageQueue: string[] = [];

  /** Timer for auto-reconnect */
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  /** Reconnect delay in milliseconds */
  private reconnectDelay: number = 2000;

  /** Whether auto-reconnect is enabled */
  private autoReconnect: boolean = true;

  /**
   * @param pluginName The plugin namespace (must match the backend's pluginName)
   * @param wsUrl Optional WebSocket URL. Defaults to `ws(s)://<current host>/ws`
   * @param logger Optional logger instance
   */
  constructor(pluginName: string, wsUrl?: string, logger: IChildLogger = noopLogger) {
    super(logger.getChildLogger({ label: RpcBrowserWebSocketsMulti.className }));
    this.logger = logger.getChildLogger({ label: RpcBrowserWebSocketsMulti.className });
    this.pluginName = pluginName;
    this.wsUrl = wsUrl || this.defaultWsUrl();
  }

  /**
   * Derive the default WebSocket URL from the current page location.
   */
  private defaultWsUrl(): string {
    if (typeof window === "undefined") {
      throw new Error(
        "RpcBrowserWebSocketsMulti: cannot derive WebSocket URL outside a browser. Pass an explicit wsUrl to the constructor."
      );
    }
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/ws`;
  }

  /**
   * Whether the WebSocket is currently connected.
   */
  get connected(): boolean {
    return this._connected;
  }

  /**
   * Set the reconnect delay in milliseconds.
   */
  setReconnectDelay(delay: number): void {
    this.reconnectDelay = delay;
  }

  /**
   * Enable or disable auto-reconnect.
   */
  setAutoReconnect(enabled: boolean): void {
    this.autoReconnect = enabled;
  }

  /**
   * Open the WebSocket connection.
   * Automatically reconnects on disconnect if autoReconnect is enabled.
   */
  connect(): void {
    if (this.ws) {
      this.logger.debug("connect: WebSocket already exists, skipping");
      return;
    }

    this.logger.info(`connect: Connecting to ${this.wsUrl}`);
    this.ws = new WebSocket(this.wsUrl);

    this.ws.addEventListener("open", () => {
      this.logger.info("WebSocket connected");
      this._connected = true;

      // Flush queued messages
      for (const msg of this.messageQueue) {
        this.ws!.send(msg);
      }
      this.messageQueue = [];
    });

    this.ws.addEventListener("message", (event) => {
      try {
        const message: RpcMultiMessage = JSON.parse(event.data as string);

        // Only handle messages for this plugin
        if (message.plugin !== this.pluginName) {
          return;
        }

        this.logger.debug(`Received: ${JSON.stringify(message)}`);

        switch (message.command) {
          case "rpc-request":
            this.handleRequest(message);
            break;
          case "rpc-response":
            this.handleResponse(message);
            break;
        }
      } catch (err) {
        // Ignore malformed messages
        this.logger.warn("Failed to parse message", { error: err });
      }
    });

    this.ws.addEventListener("close", () => {
      this.logger.info("WebSocket disconnected");
      this._connected = false;
      this.ws = null;

      // Auto-reconnect
      if (this.autoReconnect) {
        this.reconnectTimer = setTimeout(() => {
          this.logger.info("Attempting to reconnect...");
          this.connect();
        }, this.reconnectDelay);
      }
    });

    this.ws.addEventListener("error", (event) => {
      this.logger.error("WebSocket error", { error: event });
      // Error is followed by close, so reconnect is handled there
    });
  }

  /**
   * Close the WebSocket connection and stop reconnecting.
   */
  disconnect(): void {
    this.autoReconnect = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this._connected = false;
    this.logger.info("Disconnected");
  }

  /**
   * Send data over the WebSocket.
   * If not connected, queues the message.
   */
  private send(data: string): void {
    if (this.ws && this._connected) {
      this.ws.send(data);
    } else {
      // Queue messages until connected
      this.messageQueue.push(data);
      this.logger.debug("Message queued (not connected yet)");
    }
  }

  /**
   * Invoke a method on the backend plugin(consumer) and return the result.
   *
   * @param method The method name to invoke on the server side
   * @param params Parameters to pass
   * @returns A promise that resolves with the result from the backend
   */
  invoke(method: string, ...params: any[]): Promise<any> {
    const id = Math.random();
    const promise = new Promise((resolve, reject) => {
      this.promiseCallbacks.set(id, { resolve, reject });
    });

    // Set timeout
    setTimeout(() => {
      const promiseCallbacks: IPromiseCallbacks | undefined = this.promiseCallbacks.get(id);
      if (promiseCallbacks) {
        this.logger.warn(`invoke: Request ${id} method ${method} has timed out`);
        promiseCallbacks.reject(new Error(`Request timed out: ${method}`));
        this.promiseCallbacks.delete(id);
      }
    }, this.timeout);

    const requestObject: RpcMultiMessage = {
      plugin: this.pluginName,
      command: "rpc-request",
      id: id,
      method: method,
      params: params,
    };

    this.send(JSON.stringify(requestObject));
    return promise;
  }

  // -------------------------------------------------------------------------
  // Required abstract method implementations from RpcCommon
  // -------------------------------------------------------------------------

  sendRequest(id: number, method: string, params?: any[]): void {
    // Set timeout
    setTimeout(() => {
      const promiseCallbacks: IPromiseCallbacks | undefined = this.promiseCallbacks.get(id);
      if (promiseCallbacks) {
        this.logger.warn(`sendRequest: Request ${id} method ${method} has timed out`);
        promiseCallbacks.reject(new Error("Request timed out"));
        this.promiseCallbacks.delete(id);
      }
    }, this.timeout);

    const requestBody: RpcMultiMessage = {
      plugin: this.pluginName,
      command: "rpc-request",
      id: id,
      method: method,
      params: params,
    };

    this.send(JSON.stringify(requestBody));
  }

  sendResponse(id: number, response: any, success: boolean = true): void {
    const responseBody: RpcMultiMessage = {
      plugin: this.pluginName,
      command: "rpc-response",
      id: id,
      response: response,
      success: success,
    };

    this.send(JSON.stringify(responseBody));
  }
}

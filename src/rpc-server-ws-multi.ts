/**
 * RpcServerWebSocketsMulti
 *
 * Server-side RPC class for scenarios where multiple plugins (consumers) share a single
 * WebSocket endpoint. This class adds:
 *
 * 1. **Plugin (consumer) namespacing** — Messages include a `plugin` field for routing
 * 2. **Multi-connection management** — One RPC server handles N client connections
 * 3. **External message handling** — Messages are dispatched via `handleMessage()`
 *    rather than by listening directly on a WebSocket
 *
 * Designed for architecture where the core WebSocket handler
 * routes messages to plugin-specific RPC servers based on the `plugin` field.
 *
 * @example
 * ```ts
 * const rpc = new RpcServerWebSocketsMulti('my-plugin', logger);
 * rpc.registerMethod({ func: getData, name: 'getData' });
 *
 * // Core WS handler routes messages here:
 * rpc.addConnection(connectionId, sendFn);
 * rpc.handleMessage(message, connectionId);
 * ```
 */

import { RpcCommon, IMethod, RpcMultiMessage } from "./rpc-common";
import { IChildLogger, noopLogger } from "./noop-logger";

// Re-export RpcMultiMessage for consumers who import from this module
export { RpcMultiMessage } from "./rpc-common";

export class RpcServerWebSocketsMulti extends RpcCommon {
  private static readonly className = "RpcServerWebSocketsMulti";
  private readonly logger: IChildLogger;

  /** Plugin namespace for message routing */
  readonly pluginName: string;

  /**
   * Map of active connections.
   * Key is a unique connection id, value is a send function.
   */
  private connections: Map<string, (data: string) => void> = new Map();

  constructor(pluginName: string, logger: IChildLogger = noopLogger) {
    super(logger.getChildLogger({ label: RpcServerWebSocketsMulti.className }));
    this.logger = logger.getChildLogger({ label: RpcServerWebSocketsMulti.className });
    this.pluginName = pluginName;
  }

  /**
   * Add a WebSocket connection to this RPC server.
   *
   * @param connectionId Unique identifier for this connection
   * @param sendFn Function to send data back to the client
   */
  addConnection(connectionId: string, sendFn: (data: string) => void): void {
    this.connections.set(connectionId, sendFn);
    this.logger.debug(`Connection added: ${connectionId}`);
  }

  /**
   * Remove a WebSocket connection.
   *
   * @param connectionId The connection to remove
   */
  removeConnection(connectionId: string): void {
    this.connections.delete(connectionId);
    this.logger.debug(`Connection removed: ${connectionId}`);
  }

  /**
   * Get the number of active connections.
   */
  get connectionCount(): number {
    return this.connections.size;
  }

  /**
   * Handle an incoming message for this plugin.
   *
   * Called by the core WebSocket router when a message with a matching
   * `plugin` field arrives. This replaces the direct WebSocket listener
   * used in the base class.
   *
   * @param message The parsed RPC message
   * @param connectionId The connection id of the sender
   */
  async handleMessage(message: RpcMultiMessage, connectionId: string): Promise<void> {
    this.logger.debug(`handleMessage: ${message.command} from ${connectionId}`);

    switch (message.command) {
      case "rpc-request":
        await this.handleRequestMulti(message, connectionId);
        break;
      case "rpc-response":
        this.handleResponse(message);
        break;
    }
  }

  /**
   * Handle an RPC request and send the response to the specific connection.
   */
  private async handleRequestMulti(
    message: RpcMultiMessage,
    connectionId: string
  ): Promise<void> {
    const method: IMethod | undefined = this.methods.get(message.method!);
    this.logger.trace(
      `handleRequest: processing request id: ${message.id} method: ${message.method} parameters: ${JSON.stringify(message.params)}`
    );

    if (!method) {
      this.sendResponseTo(connectionId, message.id, `Method not found: ${message.method}`, false);
      return;
    }

    try {
      const func: Function = method.func;
      const thisArg: any = method.thisArg;
      let response: any = func.apply(thisArg, message.params);

      // if response is a promise, delay the response until the promise is fulfilled
      if (response && typeof response.then === "function") {
        response = await response;
      }

      this.sendResponseTo(connectionId, message.id, response, true);
    } catch (err) {
      this.logger.error(
        `handleRequest: Failed processing request ${message.command} id: ${message.id}`,
        { error: err }
      );
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.sendResponseTo(connectionId, message.id, errorMessage, false);
    }
  }

  /**
   * Send a response to a specific connection.
   */
  private sendResponseTo(
    connectionId: string,
    id: number,
    response: any,
    success: boolean
  ): void {
    const sendFn = this.connections.get(connectionId);
    if (!sendFn) {
      this.logger.warn(`sendResponseTo: Connection not found: ${connectionId}`);
      return;
    }

    const responseObject: RpcMultiMessage = {
      plugin: this.pluginName,
      command: "rpc-response",
      id: id,
      response: response,
      success: success,
    };

    try {
      sendFn(JSON.stringify(responseObject));
    } catch (err) {
      this.logger.error(`sendResponseTo: Failed to send response to ${connectionId}`, { error: err });
    }
  }

  /**
   * Get a registered method by name.
   * This allows external code (like Build Studio core) to access methods
   * for inter-plugin communication without going through WebSocket.
   *
   * @param methodName The name of the method to retrieve
   * @returns The method object, or undefined if not found
   */
  getMethod(methodName: string): IMethod | undefined {
    return this.methods.get(methodName);
  }

  /**
   * Get all registered method names.
   * Alias for listLocalMethods() for convenience.
   */
  getMethodNames(): string[] {
    return this.listLocalMethods();
  }

  // -------------------------------------------------------------------------
  // Required abstract method implementations from RpcCommon
  // These are not used directly since we handle messages via handleMessage()
  // -------------------------------------------------------------------------

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sendRequest(id: number, method: string, params?: any[]): void {
    // Not used — this class only handles incoming requests from clients
    // This is required by the abstract base class
    this.logger.warn("sendRequest called directly — not supported in multi-connection mode");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sendResponse(id: number, response: any, success: boolean = true): void {
    // Not used — we use sendResponseTo() which targets a specific connection
    // This is required by the abstract base class
    this.logger.warn("sendResponse called directly — use handleMessage() flow instead");
  }
}
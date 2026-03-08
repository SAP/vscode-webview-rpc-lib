import { RpcBrowserWebSocketsMulti } from "../rpc-browser-ws-multi";
import { RpcServerWebSocketsMulti } from "../rpc-server-ws-multi";
import { RpcMultiMessage } from "../rpc-common";
import { noopLogger } from "../noop-logger";

// ---------------------------------------------------------------------------
// WebSocket mock for RpcBrowserWebSocketsMulti
// ---------------------------------------------------------------------------

type WsListener = (event: { data: string }) => void;

class MockWebSocket {
  static instances: MockWebSocket[] = [];

  private listeners: Map<string, Function[]> = new Map();
  readyState = 1; // OPEN

  /** Messages sent by the RPC client */
  sent: string[] = [];

  /** Callback injected by the test to handle outgoing messages */
  onSend?: (data: string) => void;

  constructor(_url: string) {
    MockWebSocket.instances.push(this);
    // Auto-fire "open" on next tick
    setTimeout(() => this.fireEvent("open", {}), 0);
  }

  addEventListener(event: string, fn: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(fn);
  }

  send(data: string): void {
    this.sent.push(data);
    this.onSend?.(data);
  }

  close(): void {
    this.fireEvent("close", {});
  }

  /** Simulate receiving a message from the server */
  simulateMessage(data: string): void {
    this.fireEvent("message", { data });
  }

  fireEvent(event: string, payload: any): void {
    for (const fn of this.listeners.get(event) || []) {
      fn(payload);
    }
  }
}

// Install mock globally before any test uses it
beforeEach(() => {
  MockWebSocket.instances = [];
  (globalThis as any).WebSocket = MockWebSocket;
  // Provide window.location for defaultWsUrl()
  if (typeof window === "undefined") {
    (globalThis as any).window = {
      location: { protocol: "http:", host: "localhost:3000" },
    };
  }
});

afterEach(() => {
  delete (globalThis as any).WebSocket;
});

// ---------------------------------------------------------------------------
// Helper: wire a browser client to a server via the mock WebSocket
// ---------------------------------------------------------------------------

function wireClientToServer(
  client: RpcBrowserWebSocketsMulti,
  servers: Map<string, RpcServerWebSocketsMulti>
): void {
  // Wait for the MockWebSocket to be created by connect()
  const checkWs = () => {
    const ws = MockWebSocket.instances[MockWebSocket.instances.length - 1];
    if (!ws) return;

    const connectionId = "test-conn-1";

    // Client → Server: intercept WS sends and route to the correct server
    ws.onSend = (data: string) => {
      const msg: RpcMultiMessage = JSON.parse(data);
      const server = servers.get(msg.plugin);
      if (server) {
        // Register the connection's send function (server → client)
        server.addConnection(connectionId, (responseData: string) => {
          ws.simulateMessage(responseData);
        });
        server.handleMessage(msg, connectionId);
      }
    };
  };

  // The WebSocket is created synchronously in connect(), so check immediately
  setTimeout(checkWs, 0);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RpcBrowserWebSocketsMulti — cross-plugin invoke", () => {
  it("invoke('method') routes to own plugin (backward compat)", (done) => {
    const server = new RpcServerWebSocketsMulti("my-plugin", noopLogger);
    server.registerMethod({
      func: (a: number, b: number) => a + b,
      name: "sum",
    });

    const servers = new Map([["my-plugin", server]]);
    const client = new RpcBrowserWebSocketsMulti("my-plugin", "ws://localhost/ws", noopLogger);

    wireClientToServer(client, servers);
    client.connect();

    // Wait for "open" event (fires on next tick)
    setTimeout(async () => {
      const result = await client.invoke("sum", 3, 4);
      expect(result).toBe(7);
      client.disconnect();
      done();
    }, 10);
  });

  it("invoke('otherPlugin:method') routes to a different plugin", (done) => {
    const myServer = new RpcServerWebSocketsMulti("my-plugin", noopLogger);
    const fsServer = new RpcServerWebSocketsMulti("filesystem", noopLogger);

    fsServer.registerMethod({
      func: (path: string) => `contents of ${path}`,
      name: "readFile",
    });

    const servers = new Map([
      ["my-plugin", myServer],
      ["filesystem", fsServer],
    ]);

    const client = new RpcBrowserWebSocketsMulti("my-plugin", "ws://localhost/ws", noopLogger);
    wireClientToServer(client, servers);
    client.connect();

    setTimeout(async () => {
      const result = await client.invoke("filesystem:readFile", "/foo.txt");
      expect(result).toBe("contents of /foo.txt");
      client.disconnect();
      done();
    }, 10);
  });

  it("invoke with ':' at position 0 treats entire string as method name", (done) => {
    const server = new RpcServerWebSocketsMulti("my-plugin", noopLogger);
    server.registerMethod({
      func: () => "ok",
      name: ":weirdName",
    });

    const servers = new Map([["my-plugin", server]]);
    const client = new RpcBrowserWebSocketsMulti("my-plugin", "ws://localhost/ws", noopLogger);
    wireClientToServer(client, servers);
    client.connect();

    setTimeout(async () => {
      const result = await client.invoke(":weirdName");
      expect(result).toBe("ok");
      client.disconnect();
      done();
    }, 10);
  });

  it("cross-plugin response is not dropped by message filter", (done) => {
    // This test verifies the bug fix: previously, responses from cross-plugin
    // calls were dropped because message.plugin !== this.pluginName.
    const fsServer = new RpcServerWebSocketsMulti("filesystem", noopLogger);
    fsServer.registerMethod({
      func: () => 42,
      name: "getSize",
    });

    const servers = new Map([["filesystem", fsServer]]);
    const client = new RpcBrowserWebSocketsMulti("my-plugin", "ws://localhost/ws", noopLogger);
    wireClientToServer(client, servers);
    client.connect();

    setTimeout(async () => {
      // The response will have plugin: "filesystem" but client is "my-plugin"
      const result = await client.invoke("filesystem:getSize");
      expect(result).toBe(42);
      client.disconnect();
      done();
    }, 10);
  });

  it("requests from other plugins are not processed", (done) => {
    const handler = jest.fn(() => "should not be called");

    const client = new RpcBrowserWebSocketsMulti("my-plugin", "ws://localhost/ws", noopLogger);
    client.registerMethod({ func: handler, name: "secret" });
    client.connect();

    setTimeout(() => {
      const ws = MockWebSocket.instances[0];

      // Simulate a request from a different plugin
      ws.simulateMessage(JSON.stringify({
        plugin: "other-plugin",
        command: "rpc-request",
        id: 0.12345,
        method: "secret",
        params: [],
      }));

      // Give time for any potential handling
      setTimeout(() => {
        expect(handler).not.toHaveBeenCalled();
        client.disconnect();
        done();
      }, 10);
    }, 10);
  });

  it("requests addressed to own plugin are still processed", (done) => {
    const handler = jest.fn(() => "hello");

    const client = new RpcBrowserWebSocketsMulti("my-plugin", "ws://localhost/ws", noopLogger);
    client.registerMethod({ func: handler, name: "greet" });
    client.connect();

    setTimeout(() => {
      const ws = MockWebSocket.instances[0];

      ws.simulateMessage(JSON.stringify({
        plugin: "my-plugin",
        command: "rpc-request",
        id: 0.99,
        method: "greet",
        params: [],
      }));

      setTimeout(() => {
        expect(handler).toHaveBeenCalled();
        client.disconnect();
        done();
      }, 10);
    }, 10);
  });

  it("sendRequest also parses plugin:method", (done) => {
    const client = new RpcBrowserWebSocketsMulti("my-plugin", "ws://localhost/ws", noopLogger);
    client.connect();

    setTimeout(() => {
      const ws = MockWebSocket.instances[0];

      // Call sendRequest directly (used by listRemoteMethods / base class)
      (client as any).sendRequest(0.5, "other:getData", ["arg1"]);

      expect(ws.sent.length).toBe(1);
      const msg = JSON.parse(ws.sent[0]);
      expect(msg.plugin).toBe("other");
      expect(msg.method).toBe("getData");
      expect(msg.params).toEqual(["arg1"]);

      client.disconnect();
      done();
    }, 10);
  });

  it("async methods work with cross-plugin invoke", (done) => {
    const fsServer = new RpcServerWebSocketsMulti("filesystem", noopLogger);
    fsServer.registerMethod({
      func: async (path: string) => {
        return `async contents of ${path}`;
      },
      name: "readFileAsync",
    });

    const servers = new Map([["filesystem", fsServer]]);
    const client = new RpcBrowserWebSocketsMulti("my-plugin", "ws://localhost/ws", noopLogger);
    wireClientToServer(client, servers);
    client.connect();

    setTimeout(async () => {
      const result = await client.invoke("filesystem:readFileAsync", "/bar.txt");
      expect(result).toBe("async contents of /bar.txt");
      client.disconnect();
      done();
    }, 10);
  });

  it("error from cross-plugin invoke is properly rejected", (done) => {
    const fsServer = new RpcServerWebSocketsMulti("filesystem", noopLogger);
    fsServer.registerMethod({
      func: () => { throw new Error("file not found"); },
      name: "readFile",
    });

    const servers = new Map([["filesystem", fsServer]]);
    const client = new RpcBrowserWebSocketsMulti("my-plugin", "ws://localhost/ws", noopLogger);
    wireClientToServer(client, servers);
    client.connect();

    setTimeout(async () => {
      try {
        await client.invoke("filesystem:readFile", "/missing.txt");
        done.fail("Should have thrown");
      } catch (err) {
        expect(err).toBe("file not found");
        client.disconnect();
        done();
      }
    }, 10);
  });
});

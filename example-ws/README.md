# RPC WebSockets Example

This example shows RPC over WebSockets between a browser page and a Node.js server.

## What It Demonstrates

- `RpcBrowserWebSockets` running in the browser.
- `RpcExtensionWebSockets` running in Node.js.
- A browser-registered `sum` method invoked from the server.
- A server-registered `sub` method invoked from the browser.
- Static browser assets served from the compiled `out/static` directory.

## Requirements

- Node.js 20 or newer.

## Setup

Install dependencies from the lockfile:

```bash
npm ci
```

## Build

Compile TypeScript and copy static assets to `out/`:

```bash
npm run compile
```

Run linting:

```bash
npm run lint
```

Run an audit:

```bash
npm audit
```

## Run

Start the Node.js server:

```bash
node out/index.js
```

Open the browser at:

```text
http://127.0.0.1:8080/index.html
```

The server listens on:

- HTTP: `8080`
- WebSocket: `8081`

## Refresh Copied RPC Sources

If you need to refresh the copied RPC browser/server sources from the repository root implementation, run:

```bash
npm run prep
```

Then rebuild:

```bash
npm run compile
```

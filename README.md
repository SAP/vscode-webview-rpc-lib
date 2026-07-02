[![Continuous Integration](https://github.com/SAP/vscode-webview-rpc-lib/actions/workflows/ci.yml/badge.svg)](https://github.com/SAP/vscode-webview-rpc-lib/actions/workflows/ci.yml)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
![GitHub license](https://img.shields.io/badge/license-Apache_2.0-blue.svg)
[![REUSE status](https://api.reuse.software/badge/github.com/SAP/vscode-webview-rpc-lib)](https://api.reuse.software/info/github.com/SAP/vscode-webview-rpc-lib)

# vscode-webview-rpc-lib

## Description

`@sap-devx/webview-rpc` provides a convenient RPC layer for communication between a VS Code extension and its webviews. It supports promise-based calls in both directions, plus WebSocket-based RPC scenarios for browser-to-node and multi-plugin routing.

## Requirements

For package consumers:
- A VS Code or Theia extension with a webview.
- npm access to install `@sap-devx/webview-rpc`.

For repository development:
- Node.js 20 or newer.
- npm.

## Installation

Install the package in your extension project:

```bash
npm install @sap-devx/webview-rpc
```

## Basic Usage

### Extension Side

Create an RPC instance from the extension host:

```ts
import { RpcExtension } from "@sap-devx/webview-rpc/out.ext/rpc-extension";

const rpc = new RpcExtension(panel.webview);
```

### Webview Side

Load the browser build from your webview HTML and create an RPC instance:

```html
<script type="module" src="${rpcCommonUri}"></script>
<script type="module" src="${rpcBrowserUri}"></script>
<script type="module" src="${mainScriptUri}"></script>
```

Use `webview.asWebviewUri(...)` in the extension to create `rpcCommonUri`, `rpcBrowserUri`, and your own script URI. Avoid hardcoded `vscode-resource:` URLs; they are deprecated in modern VS Code webviews.

```js
const vscode = acquireVsCodeApi();
const rpc = new RpcBrowser(window, vscode);
```

## Register Methods

Register functions that can be invoked remotely:

```js
function add(a, b) {
  return a + b;
}

rpc.registerMethod({ func: add });
```

## Invoke Methods

Use `invoke` to call a registered remote method. The result is returned as a `Promise`.

```js
rpc.invoke("add", 1, 2).then((response) => {
  console.log(`1 + 2 = ${response}`);
});
```

## WebSocket RPC

The package also includes WebSocket-based RPC classes:

- `RpcBrowserWebSockets` from `out.browser/rpc-browser-ws.js`
- `RpcExtensionWebSockets` from `out.ext/rpc-extension-ws.js`
- `RpcBrowserWebSocketsMulti` from `out.browser/rpc-browser-ws-multi.js`
- `RpcServerWebSocketsMulti` from `out.ext/rpc-server-ws-multi.js`

See `example-ws/` for a runnable WebSocket example.

## Build and Development

Install dependencies from the lockfile:

```bash
npm ci
```

Compile all TypeScript targets:

```bash
npm run compile
```

Run linting:

```bash
npm run lint
```

Run tests:

```bash
npm test
```

Run the full root CI workflow locally:

```bash
npm run ci
```

The examples have their own lockfiles. To verify them:

```bash
cd example
npm ci
npm run compile
```

```bash
cd example-ws
npm ci
npm run compile
npm run lint
```

## Support

Open a GitHub issue for help, bugs, or feature requests.

## Contributing

Contributing information can be found in [CONTRIBUTING.md](CONTRIBUTING.md).

## To-Do

- Remove the need to declare exposed functions explicitly.

# VS Code Webview RPC Example

This example shows `@sap-devx/webview-rpc` communication between a VS Code extension host and a webview.

## What It Demonstrates

- Creating an `RpcExtension` instance in the extension host.
- Creating an `RpcBrowser` instance in the webview.
- Registering callable methods on both sides.
- Invoking a webview method from the extension command.
- Invoking an extension method from a webview button click.

## Requirements

- Node.js 20 or newer.
- VS Code 1.100 or newer.
- The repository root package built locally, because this example depends on `@sap-devx/webview-rpc` via `file:..`.

## Setup

From the repository root:

```bash
npm ci
npm run compile
```

Then install this example's dependencies:

```bash
cd example
npm ci
```

## Build

Compile the extension example:

```bash
npm run compile
```

If you update webview assets under `src/media`, copy them to `out/media`:

```bash
npm run copy
```

## Run

Open this repository in VS Code and launch the example extension from `example/.vscode/launch.json`.

Use the contributed commands:

- `Open Webview` opens the RPC webview panel.
- `Send Message to Webview` invokes a registered webview method from the extension side.

Inside the webview, use the `Run` button to invoke the extension-side `showMessage` method.

## Notes

- The webview HTML uses a `vscode-scheme` placeholder that `src/extension.ts` replaces with `webview.asWebviewUri(...)` output at runtime.
- This example is not published with the npm package; it is only for local development and validation.

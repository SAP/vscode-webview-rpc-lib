# vscode-webview-rpc-lib

An RPC library (`@sap-devx/webview-rpc`) enabling bidirectional method invocation between a VS Code extension and its webviews. Provides classes for the extension side, browser side, and WebSocket-based variants.

## Architecture

Single-package library with no monorepo structure. Source in `src/`, compiled to two output directories: `out.ext/` (Node/extension) and `out.browser/` (browser/webview). Tests in `src/test/`.

Key source files:

| File | Class | Purpose |
|---|---|---|
| `src/rpc-common.ts` | `RpcCommon` (abstract) | Core invoke/register/handle logic; base for all variants |
| `src/rpc-extension.ts` | `RpcExtension` | Extension↔webview via `vscode.Webview` postMessage |
| `src/rpc-browser.ts` | `RpcBrowser` | Webview side; uses `window.addEventListener("message")` |
| `src/rpc-extension-ws.ts` | `RpcExtensionWebSockets` | Extension side over WebSocket (`ws` package) |
| `src/rpc-browser-ws.ts` | `RpcBrowserWebSockets` | Browser side over WebSocket |
| `src/rpc-server-ws-multi.ts` | `RpcServerWebSocketsMulti` | Multi-connection server; plugin namespacing |
| `src/rpc-browser-ws-multi.ts` | `RpcBrowserWebSocketsMulti` | Browser multi-plugin; auto-reconnect, message queueing |
| `src/noop-logger.ts` | — | `IChildLogger` interface + `noopLogger` singleton |

`example/` contains a pre-compiled VS Code extension example. `example-ws/` shows the WebSocket variant. Both are illustrative only and not part of the published package.

## Build

```sh
npm install                  # install dependencies
npm run compile              # clean + compile ext + browser + test output
npm run compile-ext          # compile extension/server side → out.ext/
npm run compile-browser      # compile browser/webview side → out.browser/
npm run ci                   # compile + lint + test + npm pack (full CI)
```

## Testing

Tests use Jest + ts-jest. Coverage included by default.

```sh
npm run test                 # jest --coverage (runs src/test/*.test.ts and *.spec.ts)
```

Test files: `src/test/rpc.test.ts`, `src/test/rpc-multi.test.ts`, `src/test/logger.spec.ts`.

## CI/CD & Deployment

GitHub Actions (`.github/workflows/`):

- **`ci.yml`** — runs `npm run ci` on Node 20/22/24 for pushes and PRs to `master*` branches.
- **`commitlint.yml`** — enforces conventional commit messages on `master` PRs.
- **`release.yml`** — triggered by `v*.*.*` tags; builds and publishes to NPM using Node 24.x.

To cut a release:
1. Bump `version` in `package.json`, commit, and push a `v*.*.*` tag.
2. GitHub Actions publishes to npm automatically.

Conventional commits are enforced via `commitlint`. Use `git cz` (commitizen) for guided commit messages.

## Configuration

No environment variables or config files required. The library has one runtime dependency: `ws` (WebSocket). Consumers import from the `@sap-devx/webview-rpc` npm package.

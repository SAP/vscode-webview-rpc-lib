# RPC WebSockets Example
This project demonstrates the WebSocket implementation of the [@sap-devx/webview-rpc](https://www.npmjs.com/package/@sap-devx/webview-rpc) library.

## Details
This project runs 2 servers:
### A web server (port 8080)
1. Serves static content to the browser
1. On the client-side:
    1. A WebSocket connection is established to port 8081
    1. The user is prompted to enter 2 numeric values
    1. When the user presses a button, `sub()` is called on the server
    1. `sum()` is registered as a function that can be called remotely
### A WebSocket server (port 8081)
1. It registers a function called `sub()` as a function that can be called remotely
1. When a new WebSocket connection is created, `sum()` is called on the client

## Setup and Usage
1. Run `npm install` to install dependencies.
1. Run `npm run compile` to compile TypeScript files and to copy artifacts to the out directory.
1. Run `node out/index.js` (or from within VS Code, launch the Run WebSocket Example debug configuration)
1. Open the browser to http://127.0.0.1:8080 and press the button that appears on the screen.

## Testing Locally
This sample project imports the `@sap-devx/webview-rpc` library from npm.

If you're making changes to the `@sap-devx/webview-rpc` library itself and you wish to test those changes using this sample project, perform the following:
1. From within the parent directory (`vscode-webview-rpc-lib`) run `npm link`
1. From within this directory (`example-websockets`) run `npm link @sap-devx/webview-rpc`

Then run the project as you would normally.

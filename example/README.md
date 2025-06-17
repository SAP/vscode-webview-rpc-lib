# Webview RPC Example

This [VS Code extension](https://code.visualstudio.com/api) demonstrates the use of the [@sap-devx/webview-rpc](https://www.npmjs.com/package/@sap-devx/webview-rpc) npm package to send messages to and from VS Code extensions and their [Webviews](https://code.visualstudio.com/api/extension-guides/webview).

## Testing Locally
This sample project imports the `@sap-devx/webview-rpc` library from npm.

If you're making changes to the `@sap-devx/webview-rpc` library itself and you wish to test those changes using this sample project, perform the following:
1. From within the parent directory (`vscode-webview-rpc-lib`) run `npm link`
1. From within this directory (`example`) run `npm link @sap-devx/webview-rpc`

Then run the project as you would normally.

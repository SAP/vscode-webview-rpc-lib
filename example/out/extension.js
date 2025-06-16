"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const rpc_extension_1 = require("@sap-devx/webview-rpc/out.ext/rpc-extension");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    const openWebviewCommand = vscode.commands.registerCommand('extension.openwebview', () => {
        RpcExamplePanel.createOrShow(context.extensionUri);
    });
    context.subscriptions.push(openWebviewCommand);
    const sendMessageToWebviewCommand = vscode.commands.registerCommand('extension.sendMessage', () => __awaiter(this, void 0, void 0, function* () {
        const message = yield vscode.window.showInputBox({
            prompt: 'Enter a message to send to the Webview'
        });
        if (message) {
            RpcExamplePanel.sendMessage(message);
        }
    }));
    context.subscriptions.push(sendMessageToWebviewCommand);
}
/**
 * Manages cat coding webview panels
 */
class RpcExamplePanel {
    static sendMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let response = yield this.currentPanel._rpc.remote.runFunctionInWebview(message);
                vscode.window.showInformationMessage(response);
            }
            catch (error) {
                vscode.window.showErrorMessage(`Error invoking function: ${error}`);
            }
        });
    }
    static createOrShow(extensionUri) {
        var _a;
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        // If we already have a panel, show it.
        if ((_a = RpcExamplePanel.currentPanel) === null || _a === void 0 ? void 0 : _a._panel) {
            RpcExamplePanel.currentPanel._panel.reveal(column);
            return;
        }
        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(RpcExamplePanel.viewType, 'Webview RPC Example', column || vscode.ViewColumn.One, {
            // Enable javascript in the webview
            enableScripts: true,
            retainContextWhenHidden: true,
        });
        RpcExamplePanel.currentPanel = new RpcExamplePanel(panel, extensionUri);
    }
    static revive(panel, extensionUri) {
        RpcExamplePanel.currentPanel = new RpcExamplePanel(panel, extensionUri);
    }
    constructor(panel, extensionUri) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        const showMessage = (message) => __awaiter(this, void 0, void 0, function* () {
            return yield vscode.window.showInformationMessage(message, "Yes", "No");
        });
        // logger is optional second parameter, implementing interface IChildLogger:
        // https://github.com/SAP/vscode-logging/blob/master/packages/types/api.d.ts#L17
        // see example on how to initialize it from extension here:
        // https://github.com/SAP/vscode-logging/blob/master/examples/extension/lib/passing-logger-to-library.js
        this._rpc = new rpc_extension_1.RpcExtension(this._panel.webview);
        this._rpc.setResponseTimeout(2000);
        this._rpc.registerMethod({ func: showMessage });
        // Set the webview's initial html content
        this.update(this._panel.webview);
        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => {
            this._panel = undefined;
        });
        // this.dispose(), null, this._disposables);
        // Update the content based on view changes
        // this._panel.onDidChangeViewState(
        // 	e => {
        // 		if (this._panel.visible) {
        // 			this.update(this._panel.webview);
        // 		}
        // 	},
        // 	// null,
        // 	// this._disposables
        // );
    }
    // public dispose() {
    // 	RpcExamplePanel.currentPanel = undefined;
    // 	// Clean up our resources
    // 	this._panel.dispose();
    // 	while (this._disposables.length) {
    // 		const x = this._disposables.pop();
    // 		if (x) {
    // 			x.dispose();
    // 		}
    // 	}
    // }
    update(webview) {
        this._panel.title = "Webview RPC Example";
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }
    _getHtmlForWebview(webview) {
        // Local path to main script run in the webview
        const nodeModulesUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'node_modules'));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));
        let nonce = getNonce();
        let html = `<!DOCTYPE html>
		<html>

		<head>
			<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}'; font-src ${webview.cspSource}; img-src ${webview.cspSource} data:; object-src ${webview.cspSource}; frame-src ${webview.cspSource};">
			<script type="module" nonce="${nonce}" src="${nodeModulesUri}/@sap-devx/webview-rpc/out.browser/rpc-common.js"></script>
			<script type="module" nonce="${nonce}" src="${nodeModulesUri}/@sap-devx/webview-rpc/out.browser/rpc-browser.js"></script>
			<script type="module" nonce="${nonce}" src="${scriptUri}"></script>
		</head>

		<body>
			<h2>Webview RPC Example</h2>

			<input type="text" id="txtMessage" placeholder="Enter message to send to Webview" />
			<input type="button" id="btnShowMessage" value="Send to Extension" />
			<div id="responsediv"></div>
		</body>

		</html>`;
        return html;
    }
}
RpcExamplePanel.viewType = 'rpcExample';
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
// this method is called when your extension is deactivated
function deactivate() { }
//# sourceMappingURL=extension.js.map
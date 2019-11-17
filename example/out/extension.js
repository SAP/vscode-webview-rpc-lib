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
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const path = require("path");
const vscode = require("vscode");
const fs = require("fs");
const RpcExtenstion = require('@sap-devx/webview-rpc/out.ext/rpc-extension.js').RpcExtenstion;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    let cmd1 = vscode.commands.registerCommand('extension.openwebview', () => {
        RpcExamplePanel.createOrShow(context.extensionPath);
    });
    context.subscriptions.push(cmd1);
    let cmd2 = vscode.commands.registerCommand('extension.sendMessage', () => {
        RpcExamplePanel.sendMessage();
    });
    context.subscriptions.push(cmd2);
    if (vscode.window.registerWebviewPanelSerializer) {
        // Make sure we register a serializer in activation event
        vscode.window.registerWebviewPanelSerializer(RpcExamplePanel.viewType, {
            deserializeWebviewPanel(webviewPanel, state) {
                return __awaiter(this, void 0, void 0, function* () {
                    console.log(`Got state: ${state}`);
                    RpcExamplePanel.revive(webviewPanel, context.extensionPath);
                });
            }
        });
    }
}
exports.activate = activate;
/**
 * Manages cat coding webview panels
 */
class RpcExamplePanel {
    constructor(panel, extensionPath) {
        this._disposables = [];
        this._panel = panel;
        this._extensionPath = extensionPath;
        let functions = {
            showMessage: (message) => {
                let _vscode = vscode;
                return new Promise((resolve, reject) => {
                    _vscode.window.showInformationMessage(message, "yes", "no").then((res) => {
                        resolve(res);
                    });
                });
            }
        };
        this._rpc = new RpcExtenstion(this._panel.webview);
        this._rpc.registerMethod({ func: functions.showMessage });
        // Set the webview's initial html content
        this.update(this._panel.webview);
        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        // Update the content based on view changes
        this._panel.onDidChangeViewState(e => {
            if (this._panel.visible) {
                this.update(this._panel.webview);
            }
        }, null, this._disposables);
    }
    static sendMessage() {
        this.currentPanel._rpc.invoke("runFunctionInWebview", ["message from extension"]).then((response => {
            vscode.window.showInformationMessage(response);
        }));
    }
    static createOrShow(extensionPath) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        // If we already have a panel, show it.
        if (RpcExamplePanel.currentPanel) {
            RpcExamplePanel.currentPanel._panel.reveal(column);
            return;
        }
        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(RpcExamplePanel.viewType, 'Webview Example', column || vscode.ViewColumn.One, {
            // Enable javascript in the webview
            enableScripts: true
        });
        RpcExamplePanel.currentPanel = new RpcExamplePanel(panel, extensionPath);
    }
    static revive(panel, extensionPath) {
        RpcExamplePanel.currentPanel = new RpcExamplePanel(panel, extensionPath);
    }
    dispose() {
        RpcExamplePanel.currentPanel = undefined;
        // Clean up our resources
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
    update(webview) {
        this._panel.title = "RPC Example";
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }
    _getHtmlForWebview(webview) {
        // Local path to main script run in the webview
        const scriptsPathOnDisk = vscode.Uri.file(path.join(this._extensionPath));
        // And the uri we use to load this script in the webview
        const scriptsUri = webview.asWebviewUri(scriptsPathOnDisk);
        let html = fs.readFileSync(path.join(this._extensionPath, 'out', 'media', 'index.html'), "utf8");
        html = html.replace(/vscode-scheme/g, scriptsUri.toString()).replace(/%3A/g, ":");
        return html;
    }
}
RpcExamplePanel.viewType = 'rpcExample';
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map
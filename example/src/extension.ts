// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';
import { RpcExtension } from '@sap-devx/webview-rpc/out.ext/rpc-extension';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

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
			async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
				console.log(`Got state: ${state}`);
				RpcExamplePanel.revive(webviewPanel, context.extensionPath);
			}
		});
	}

	
}


/**
 * Manages cat coding webview panels
 */
class RpcExamplePanel {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */
	public static currentPanel: RpcExamplePanel | undefined;

	public static readonly viewType = 'rpcExample';

	private context : any;
	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionPath: string;
	private _disposables: vscode.Disposable[] = [];
	private _rpc: RpcExtension;

	public static sendMessage() {
		this.currentPanel._rpc.invoke("runFunctionInWebview", ["message from extension"]).then((response => {
			vscode.window.showInformationMessage(response);
		}));
	}

	public static createOrShow(extensionPath: string) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;


		// If we already have a panel, show it.
		if (RpcExamplePanel.currentPanel) {
			RpcExamplePanel.currentPanel._panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			RpcExamplePanel.viewType,
			'Webview Example',
			column || vscode.ViewColumn.One,
			{
				// Enable javascript in the webview
				enableScripts: true
			}
		);

		RpcExamplePanel.currentPanel = new RpcExamplePanel(panel, extensionPath);
	}

	public static revive(panel: vscode.WebviewPanel, extensionPath: string) {
		RpcExamplePanel.currentPanel = new RpcExamplePanel(panel, extensionPath);
	}

	private constructor(panel: vscode.WebviewPanel, extensionPath: string) {
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
		// logger is optional second parameter, implementing interface IChildLogger:
		// https://github.com/SAP/vscode-logging/blob/master/packages/types/api.d.ts#L17
		// see example on how to initialize it from extension here:
		// https://github.com/SAP/vscode-logging/blob/master/examples/extension/lib/passing-logger-to-library.js
		this._rpc = new RpcExtension(this._panel.webview);
		this._rpc.registerMethod({ func: functions.showMessage });

		// Set the webview's initial html content
		this.update(this._panel.webview);

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(
			e => {
				if (this._panel.visible) {
					this.update(this._panel.webview);
				}
			},
			null,
			this._disposables
		);
	}

	public dispose() {
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

	private update(webview: vscode.Webview) {
		this._panel.title = "RPC Example";
		this._panel.webview.html = this._getHtmlForWebview(webview);
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Local path to main script run in the webview
		const scriptsPathOnDisk = vscode.Uri.file(
			path.join(this._extensionPath)
		);

		// And the uri we use to load this script in the webview
		const scriptsUri = webview.asWebviewUri(scriptsPathOnDisk);

		let html = fs.readFileSync(path.join(this._extensionPath, 'out', 'media', 'index.html'), "utf8");
		html = html.replace(/vscode-scheme/g, scriptsUri.toString()).replace(/%3A/g, ":");

		return html;
	}
}

// this method is called when your extension is deactivated
export function deactivate() { }

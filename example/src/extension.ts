// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "rpc-example" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.helloWorld', () => {
		RpcExamplePanel.createOrShow(context.extensionPath);
	});

	if (vscode.window.registerWebviewPanelSerializer) {
		// Make sure we register a serializer in activation event
		vscode.window.registerWebviewPanelSerializer(RpcExamplePanel.viewType, {
			async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
				console.log(`Got state: ${state}`);
				RpcExamplePanel.revive(webviewPanel, context.extensionPath);
			}
		});
	}

	context.subscriptions.push(disposable);
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

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionPath: string;
	private _disposables: vscode.Disposable[] = [];

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

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'alert':
						vscode.window.showErrorMessage(message.text);
						return;
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
			path.join(this._extensionPath, 'out')
		);

		// And the uri we use to load this script in the webview
		const scriptsUri = webview.asWebviewUri(scriptsPathOnDisk);
		
		let html = fs.readFileSync(path.join(this._extensionPath, 'media', 'index.html'), "utf8");
		html = html.replace(/vscode-scheme/g, scriptsUri.toString()).replace(/%3A/g, ":");

		return html;
	}
}



// this method is called when your extension is deactivated
export function deactivate() {}

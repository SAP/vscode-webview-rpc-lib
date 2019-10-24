# vscode-webviewrpc-lib
## Description
Provides a conventient way to communicate between VSCode extension and his webviews. Use RPC calls to invoke functions on the webview, receive callbacks and vice versa.

## Requirements
You need to have [node.js](https://www.npmjs.com/package/node) installed on your machine.
Also, to use this library, you need to run it inside a VSCode extension using [VSCode](https://code.visualstudio.com/) or [Theia](https://www.theia-ide.org/).
## Download and Installation
*An example of using this libary can be seen under the "example" folder.*
### Installation
* First, you need to have a VSCode extension with a Webview. To create your extension go to https://code.visualstudio.com/api/extension-guides/webview.
* Next to use this library, you need to *Clone* this repository.
* Run "*npm install*" on the repo to download the project dependencies.
* Run "*npm run compile*" to compile the extension library sources to javascript. The compilation results will be on the directory "out.ext".
* Run "*npm run compile-browser*" to compile the browser library sources to javascript. The compilation results will be on the directory "out.browser".
* Copy the files "rpc-common.ts" & "rpc-extension.ts" under the src folder to "src/rpc" folder in your VSCode extension.
* Copy the files "rpc-common.js" & "rpc-browser.js" from the "out.browser" to the "media/rpc" folder in your extension repo.
* Add the following script to the index.html of your Webview
    ```html
    <head>
    <script>var exports = {};</script>
        <script type="module" src="vscode-scheme/media/rpc/rpc-common.js"></script>
        <script type="module" src="vscode-scheme/media/rpc/rpc-browser.js"></script>
        <script type="module" src="vscode-scheme/media/main.js"></script>
    </head>
    ```
## How to use
### Initializations
You will need a new instance of the Rpc in the extension side and the Webview side
* In the extension code use the following example to start new instance of the RpcExtension:
    ```ts
    this._rpc = new RpcExtenstion(this._panel.webview);
    ```
* In your Webview JS code use the following example to start new instance of the RpcBrowser:
    ```js
    const vscode = acquireVsCodeApi();
    let rpc = new RpcBrowser(window, vscode);
    ```
### Register methods
In order to invoke an extension method from the webbiew or webview method from the extension, you will have to register the functions that can be invoked.
Here is an example on how to register the methods
```js
function add(a,b) {
    return a+b;
}

rpc.registerMethod({func: add});
```
### Usage
To invoke a method use the *invoke* method on the rpc instance. You can pass a callback that will be invoked once the repsonce recieved.
```js
rpc.invoke("add", [1,2]).then((response)=>{
    console.log("1+2="+response);
});
```
## Known Issues
* The timeout for invokeing a function is 15 seconds.
## How to obtain support
* To get more help, support and information please open a github issue.
## Contributing
Contributing information can be found in the [CONTRIBUTING.md](CONTRIBUTING.md) file.
## To-Do (upcoming changes)
* publish on npm
* remove the need to decalre exposed functions
* configurable timeout
* clear functions that had timeout
## License
Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved. This file is licensed under the Apache Software License, v. 2 except as noted otherwise in the [LICENSE](LICENSE) file.

[![CircleCI](https://circleci.com/gh/SAP/vscode-webview-rpc-lib.svg?style=svg)](https://circleci.com/gh/SAP/vscode-webview-rpc-lib)
[![Coverage Status](https://coveralls.io/repos/github/SAP/vscode-webview-rpc-lib/badge.svg?branch=master)](https://coveralls.io/github/SAP/vscode-webview-rpc-lib?branch=master)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
![GitHub license](https://img.shields.io/badge/license-Apache_2.0-blue.svg)
[![REUSE status](https://api.reuse.software/badge/github.com/SAP/vscode-webview-rpc-lib)](https://api.reuse.software/info/github.com/SAP/vscode-webview-rpc-lib)
[![dependentbot](https://api.dependabot.com/badges/status?host=github&repo=SAP/vscode-webview-rpc-lib)](https://dependabot.com/)

# vscode-webview-rpc-lib

## Description
Provides a conventient way to communicate between VSCode extension and its webviews. Use RPC calls to invoke functions on the webview, receive callbacks and vice versa.

## Requirements
You need to have [node.js](https://www.npmjs.com/package/node) installed on your machine.
Also, to use this library, you need to run it inside a VSCode extension using [VSCode](https://code.visualstudio.com/) or [Theia](https://www.theia-ide.org/).

## How to use
*An example of using this libary can be seen under the "example" folder.*

### Installation
* Create VSCode extension with a Webview. To create your extension go to https://code.visualstudio.com/api/extension-guides/webview.
* Install using npm
    ```bash
    npm install @sap-devx/webview-rpc
    ```
    This will install the library in your node_modules folder. The extension library can be used as any node.js module (with TypeScript). The webview library needs to be imported to your html.
* Add the following script to the root html of your Webview
    ```html
    <head>
        <script>var exports = {};</script>
        <script type="module" src="vscode-resource:/node_modules/@sap-devx/webview-rpc/out.browser/rpc-common.js"></script>
        <script type="module" src="vscode-resource:/node_modules/@sap-devx/webview-rpc/out.browser/rpc-browser.js"></script>
        <script type="module" src="vscode-resource:/out/media/main.js"></script>
    </head>
    ```
### Initializations
Create new instance of the Rpc in the extension side and the Webview side
* In the extension code use the following example to start new instance of the RpcExtension:
    ```ts
    this._rpc = new RpcExtension(this._panel.webview);
    ```
* In the Webview JS code use the following example to start new instance of the RpcBrowser:
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
To invoke a method use the *invoke* method on the rpc instance. You can pass a callback that will be invoked once the response received.\
***For version < 1.x*** :
```js
rpc.invoke("add", [1,2]).then((response)=>{
    console.log("1+2="+response);
});
```
***Since version 1.x*** :
```js
rpc.invoke("add", 1,2).then((response)=>{
    console.log("1+2="+response);
});
```

## Build and Development
To build for development purpose do the following:
* Run "*npm install*" on the repo to download the project dependencies.
    ```bash
    npm install @sap-devx/webview-rpc
    ```
* Run "*npm run compile-ext*" to compile the extension library sources to javascript. The compilation results will be on the directory "out.ext".
    ```bash
    npm run compile-ext
    ```
* Run "*npm run compile-browser*" to compile the browser library sources to javascript. The compilation results will be on the directory "out.browser".
    ```bash
    npm run compile-browser
    ```
* Run the test using "*npm run test*".
    ```bash
    npm run test
    ```

## Known Issues
* Browser library is does not generate d.ts files.

* overcome Cors issue preventing post message to get through and hit the window:
use the setHost method and sent the host name from the webview - and then the message should get through.

## How to obtain support
* To get more help, support and information please open a github issue.
## Contributing
Contributing information can be found in the [CONTRIBUTING.md](CONTRIBUTING.md) file.

## To-Do (upcoming changes)
* remove the need to decalre exposed functions


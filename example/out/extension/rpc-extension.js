"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const rpc_common_1 = require("../rpc-common");
class RpcExtenstion extends rpc_common_1.RpcCommon {
    constructor(context, functions) {
        super();
        this.callbacks = [];
        this.context = context;
        this.functions = functions;
        this.context.webview.onDidReceiveMessage(message => {
            if (message.command === 'rpc') {
                if (this.callbacks[message.id]) {
                    this.callbacks[message.id](message.ret);
                    this.callbacks[message.id] = undefined;
                }
                else if (functions[message.method]) {
                    functions[message.method](vscode, message.params)
                        //support only async
                        //todo: add sync support (compare to rpc-browser)
                        .then((res) => {
                        // return the result
                        this.postMessage(message.id, message.method, message.params, res);
                    });
                }
            }
        });
    }
    postMessage(id, method, params, res) {
        this.context.webview.postMessage({
            command: 'rpc',
            id: id,
            method: method,
            params: params,
            ret: res
        });
    }
}
exports.RpcExtenstion = RpcExtenstion;
//# sourceMappingURL=rpc-extension.js.map
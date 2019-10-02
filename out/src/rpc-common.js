"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RpcCommon {
    constructor() {
        this.callbacks = []; // callbacks that are called when returning fron the webview
    }
    invoke(method, params, callback) {
        let id = Math.random();
        this.callbacks[id] = callback;
        this.postMessage(id, method, params);
    }
}
exports.RpcCommon = RpcCommon;
//# sourceMappingURL=rpc-common.js.map
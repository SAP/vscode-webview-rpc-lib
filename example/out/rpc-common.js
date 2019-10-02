export class RpcCommon {
    invoke(method, params, callback) {
        let id = Math.random();
        this.callbacks[id] = callback;
        this.postMessage(id, method, params);
    }
}
//# sourceMappingURL=rpc-common.js.map
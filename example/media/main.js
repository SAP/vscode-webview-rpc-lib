import { RpcBrowser } from "../node_modules/@sap-devx/webview-rpc/out.browser/rpc-browser.js";

const vscode = acquireVsCodeApi();
// logger is optional third parameter, implementing interface IChildLogger:
// https://github.com/SAP/vscode-logging/blob/master/packages/types/api.d.ts#L17
let rpc = new RpcBrowser(window, vscode);

const runFunctionInWebview = (res) => {
    document.getElementById("responsediv").innerText = `Received message from extension "${res}"`;
    return `Webview received "${res}"`;
}

rpc.registerMethod({ func: runFunctionInWebview});

window.onload = function () {
    const txtMessageElement = document.getElementById("txtMessage");
    document.getElementById("btnShowMessage").addEventListener("click", async () => {
        const response = await rpc.remote.showMessage(`${txtMessageElement.value}.\nPress Yes if you received this message.`);
        document.getElementById("responsediv").innerText = `User pressed "${response}"`;
    });
}

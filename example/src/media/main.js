import { RpcBrowser } from "../../node_modules/@sap-devx/webview-rpc/out.browser/rpc-browser.js";

let functions = {
    runFunctionInWebview: runFunctionInWebview
}

const vscode = acquireVsCodeApi();
// logger is optional third parameter, implementing interface IChildLogger:
// https://github.com/SAP/vscode-logging/blob/master/packages/types/api.d.ts#L17
let rpc = new RpcBrowser(window, vscode /*, logger*/);
rpc.registerMethod({func: functions.runFunctionInWebview});

window.onload = function(){
    document.getElementById("btnShowMessage").addEventListener("click",showMessage);
}

function showMessage() {
    rpc.invoke("showMessage", ["I'm a message"]).then((response)=>{
        document.getElementById("responsediv").innerText = response;
    })
}

function runFunctionInWebview(res) {
    document.getElementById("responsediv").innerText = res;
    return "updated";
}
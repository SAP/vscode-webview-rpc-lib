import { RpcBrowser } from "./rpc/webview/rpc-browser.js";

let context = {
    window : window
}
let functions = {
    runFunctionInWebview: runFunctionInWebview
}
let rpc = new RpcBrowser(context, functions);
window.onload = function(){
    document.getElementById("btnShowMessage").addEventListener("click",showMessage);
}

function showMessage() {
    rpc.invoke("showMessage", "I'm message", (content)=>{
        document.getElementById("responsediv").innerText = content
    })
}

function runFunctionInWebview(res) {
    document.getElementById("responsediv").innerText = res
    return "updated"
}
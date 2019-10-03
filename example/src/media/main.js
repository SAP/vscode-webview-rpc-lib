import { RpcBrowser } from "./rpc/rpc-browser.js";

let functions = {
    runFunctionInWebview: runFunctionInWebview
}

let rpc = new RpcBrowser(window);
rpc.registerMethod({func: functions.runFunctionInWebview});

window.onload = function(){
    document.getElementById("btnShowMessage").addEventListener("click",showMessage);
}

function showMessage() {
    rpc.invoke("showMessage", "I'm message").then((response)=>{
        document.getElementById("responsediv").innerText = response;
    })
}

function runFunctionInWebview(res) {
    document.getElementById("responsediv").innerText = res;
    return "updated";
}
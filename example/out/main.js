import { RpcBrowser } from "./webview/rpc-browser.js";

let context = {
    window : window
}
let functions = {
    
}
console.log("aaa")
let rpc = new RpcBrowser(context, functions);
console.log("bbb")
debugger;
window.onload = function(){
debugger;
console.log("ccc")
    document.getElementById("btnShowMessage").addEventListener("click",showMessage);
}

function showMessage() {
    rpc.invoke("showMessage", "I'm message", (content)=>{
        document.getElementById("responsediv").innerText = content.message
    })
}
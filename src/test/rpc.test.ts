// import * as jest from "jest";
import { RpcMock } from "./rpc-mock";
import { IRpc } from "../rpc-common";

let mock1: IRpc = new RpcMock();
let mock2: IRpc = new RpcMock();
(mock1 as RpcMock).setPeer(mock2 as RpcMock);
(mock2 as RpcMock).setPeer(mock1 as RpcMock);

const sum = (a: number, b: number): number => {
  return a + b;
};

test("Sample test", () => {
  mock1.registerMethod({func: sum});
  const param1: number = 1;
  const param2: number = 2;
  mock2.invoke("sum", [param1, param2]).then((value) => {
    console.log(`sum is ${value}`);
    expect(value).toBe(param1 + param2);
  });
});

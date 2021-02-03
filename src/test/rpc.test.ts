// import * as jest from "jest";
import { RpcMock } from "./rpc-mock";
import { IRpc } from "../rpc-common";
import { noopLogger } from "../noop-logger";

let mock1: IRpc = new RpcMock(noopLogger);
let mock2: IRpc = new RpcMock(noopLogger);
(mock1 as RpcMock).setPeer(mock2 as RpcMock);
(mock2 as RpcMock).setPeer(mock1 as RpcMock);

const longFunc = (): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("done");
    }, 500);
  });
};
  
const noParams = (): string => {
  return "no params";
};

const badFunc = (): void => {
  throw("bad");
};

const sum = (a: number, b: number): number => {
  return a + b;
};

test("One large test", () => {
  mock1.registerMethod({func: sum});
  const param1: number = 1;
  const param2: number = 2;
  mock2.invoke("sum", [param1, param2]).then((value) => {
    console.log(`sum is ${value}`);
    expect(value).toBe(param1 + param2);
  });

  let localMethodsMock1: string[] = mock1.listLocalMethods();
  expect(localMethodsMock1.length).toBe(2);
  expect(localMethodsMock1[1]).toBe("sum");

  mock2.listRemoteMethods().then((value) => {
    expect(value.length).toBe(2);
    expect(value[1]).toBe("sum");
  });

  // TODO: call method that throws exception
  mock2.invoke("sumx").then((value) => {
    expect(value).toBe(param1 + param2);
  });

  mock1.unregisterMethod({func: sum});
  localMethodsMock1 = mock1.listLocalMethods();
  expect(localMethodsMock1.length).toBe(1);

  mock1.registerMethod({func: noParams});
  mock2.invoke("noParams").then((value) => {
    expect(value).toBe("no params");
  });

  mock1.registerMethod({func: badFunc});
  return mock2.invoke("badFunc").catch((reason) => {
    expect(reason).toBe("bad");
  });
});

test("Delayed test", () => {
  mock2.setResponseTimeout(0);
  mock1.registerMethod({func: longFunc});

  return mock2.invoke("longFunc").catch((reason) => {
    expect(reason).toBe("Request timed out");
  });
});

test("Get child logger returns noopLogger", () => {
  let logger = noopLogger;
  expect(logger.getChildLogger()).toEqual(logger);
});

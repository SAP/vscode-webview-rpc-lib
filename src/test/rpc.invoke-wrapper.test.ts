// import * as jest from "jest";
import { RpcMock } from "./rpc-mock";
import { IRpc } from "../rpc-common";
import { noopLogger } from "../noop-logger";

const mock1: IRpc = new RpcMock();
const mock2: IRpc = new RpcMock();
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
  throw ("bad");
};

const sum = (a: number, b: number): number => {
  return a + b;
};

test("Invoke wrapper: One large test", async () => {
  mock1.registerMethod({ func: sum });
  const param1: number = 1;
  const param2: number = 2;
  let value = await mock2.remote.sum(param1, param2);
  console.log(`sum is ${value}`);
  expect(value).toBe(param1 + param2);

  let localMethodsMock1: string[] = mock1.listLocalMethods();
  expect(localMethodsMock1.length).toBe(2);
  expect(localMethodsMock1[1]).toBe("sum");

  value = await mock2.listRemoteMethods();
  expect(value.length).toBe(2);
  expect(value[1]).toBe("sum");

  // call method that doesn't exist
  try {
    mock2.setResponseTimeout(500);
    await mock2.remote.noSuchFunction();
  } catch (error) {
    expect(error).toBe("Request timed out");
  }

  mock1.unregisterMethod({ func: sum });
  localMethodsMock1 = mock1.listLocalMethods();
  expect(localMethodsMock1.length).toBe(1);

  mock1.registerMethod({ func: noParams });
  value = await mock2.remote.noParams();
  expect(value).toBe("no params");

  mock1.registerMethod({ func: badFunc });
  try {
    await mock2.remote.badFunc();
  } catch (error) {
    expect(error).toBe("bad");
  }
});

test("Invoke wrapper: Delayed test", async () => {
  mock2.setResponseTimeout(0);
  mock1.registerMethod({ func: longFunc });

  try {
    await mock2.remote.longFunc();
  } catch (error) {
    expect(error).toBe("Request timed out");
  }
});

test("Invoke wrapper: Get child logger returns noopLogger", () => {
  const logger = noopLogger;
  expect(logger.getChildLogger()).toEqual(logger);
});

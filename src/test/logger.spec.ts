import { IChildLogger } from "@vscode-logging/types";
import { noopLogger } from "../noop-logger";
import { IRpc } from "../rpc-common";
import { RpcMock } from "./rpc-mock";

const sum = (a: number, b: number): number => {
  return a + b;
};

describe("Logger tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("When logger is not passed noop is used", () => {
    let rpc1: IRpc = new RpcMock();
    let rpc2: IRpc = new RpcMock();
    (rpc1 as RpcMock).setPeer(rpc2 as RpcMock);
    (rpc2 as RpcMock).setPeer(rpc1 as RpcMock);
    const trace = jest.spyOn(noopLogger, "trace");

    rpc1.registerMethod({ func: sum });
    const param1: number = 1;
    const param2: number = 2;
    rpc2.invoke("sum", [param1, param2]).then((value) => {
      console.log(`sum is ${value}`);
      expect(value).toBe(param1 + param2);
    });
    expect(trace).toHaveBeenCalledTimes(2);
    expect(trace).toHaveBeenCalledWith(
      expect.stringMatching(
        /Handling request id: \d\.\d+ method: sum parameters: 1,2/
      )
    );
    expect(trace).toHaveBeenCalledWith(
      expect.stringMatching(
        /Handling response for id: \d\.\d+ message success flag is: true/
      )
    );
  });

  it("When logger is passed it is used", () => {
    const CONSOLE_LOG =  (msg: string, ...args: any[]): void => { console.log(msg, args); };
    let customLogger: IChildLogger = {
      fatal: CONSOLE_LOG,
      error: CONSOLE_LOG,
      warn: CONSOLE_LOG,
      info: CONSOLE_LOG,
      debug: CONSOLE_LOG,
      trace: CONSOLE_LOG,
      getChildLogger: function () {
        return customLogger;
      },
    };
    let rpc1: IRpc = new RpcMock(customLogger);
    let rpc2: IRpc = new RpcMock(customLogger);
    (rpc1 as RpcMock).setPeer(rpc2 as RpcMock);
    (rpc2 as RpcMock).setPeer(rpc1 as RpcMock);

    const trace = jest.spyOn(customLogger, "trace");
    const warn = jest.spyOn(customLogger, "warn");
    const error = jest.spyOn(customLogger, "error");
    
    const bad = (a: number, b: number) => { 
      if(typeof a === "number" && typeof b ==="number") {
        throw "bad parameter type";
      }
      
    };

    rpc1.registerMethod({ func: bad });
    const param1: number = 1;
    const param2: number = 0;
    rpc2.invoke("bad", [param1, param2]).then((value) => {
      console.log(`result is is ${value}`);
      expect(value).toBe(param1 + param2);
    });
    expect(trace).toHaveBeenCalledTimes(2);
    
    expect(trace).toHaveBeenCalledWith(
      expect.stringMatching(
        /Handling request id: \d\.\d+ method: bad parameters: 1,0/
      )
    );

    expect(trace).toHaveBeenCalledWith(
      expect.stringMatching(
        /Handling response for id: \d\.\d+ message success flag is: false/
      )
    );

    expect(error).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith(expect.stringMatching(/Failed to handle request rpc-request id: \d\.\d+ error: bad parameter type/));

    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/Message id \d\.\d+ rejected, response: bad parameter type/));

  });
});

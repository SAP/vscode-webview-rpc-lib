const NO_OPERATION = () => {};

/**
 * Logger interface that mimics VS Code extension logging patterns.
 */
export interface IChildLogger {
  fatal(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
  trace(message: string, ...args: any[]): void;
  getChildLogger(options?: { label: string }): IChildLogger;
}

/**
 * Empty Implementation of the Logger in case none is provided via Dependency Injection.
 * An alternative implementation could log to the console or provide another (real) implementation.
 *
 * @type {IChildLogger}
 */
export const noopLogger = {
  fatal: NO_OPERATION,
  error: NO_OPERATION,
  warn: NO_OPERATION,
  info: NO_OPERATION,
  debug: NO_OPERATION,
  trace: NO_OPERATION,
  getChildLogger: function () {
    return noopLogger;
  }
};

const NO_OPERATION = () => {};

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

module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.test.json" }]
  },
  moduleFileExtensions: ["ts", "js", "json", "node"],
  roots: ["<rootDir>/src"],
  coveragePathIgnorePatterns: ["src/test/.*"],
  // Map .js imports to .ts source files (browser modules use .js extensions)
  moduleNameMapper: {
    "^(\\.\\.?/.*)\\.js$": "$1"
  }
};

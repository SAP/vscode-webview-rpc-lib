module.exports = {
  transform: {
    "^.+\\.ts$": "ts-jest"
  },
  moduleFileExtensions: ["ts", "js", "json", "node" ],
  roots: ["<rootDir>/src"],
  preset: "ts-jest",
  coveragePathIgnorePatterns: ["src/test/.*"],
  // Map .js imports to .ts source files (browser modules use .js extensions)
  moduleNameMapper: {
    "^(\\.\\.?/.*)\\.js$": "$1"
  }
};

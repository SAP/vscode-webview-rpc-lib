module.exports = {
  transform: {
    "^.+\\.ts$": "ts-jest"
  },
  moduleFileExtensions: ["ts", "js", "json", "node" ],
  roots: ["<rootDir>/src"],
  preset: "ts-jest",
  coveragePathIgnorePatterns: ["src/test/.*"]
};

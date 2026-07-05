// @ts-check
const js = require("@eslint/js");
const tseslint = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const globals = require("globals");

/** @type {import("eslint").Linter.Config[]} */
module.exports = [
  {
    ignores: ["node_modules/**", "example/**", "example-ws/**", "out.*/**"],
  },
  // eslint:recommended equivalent
  js.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2018,
        sourceType: "module",
        project: ["./tsconfig.ext.json", "./tsconfig.browser.json", "./tsconfig.test.json"],
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2015,
        Atomics: "readonly",
        SharedArrayBuffer: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      // plugin:@typescript-eslint/eslint-recommended — disables base rules that TS already handles
      ...tseslint.configs["eslint-recommended"].overrides[0].rules,
      // project-specific rules (preserved from original .eslintrc.json)
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "error",
      "quotes": ["error", "double"],
      "semi": ["error", "always"],
    },
  },
];

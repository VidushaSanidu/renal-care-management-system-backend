import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import promisePlugin from "eslint-plugin-promise";
import unusedImports from "eslint-plugin-unused-imports";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  // Base JS config
  js.configs.recommended,

  // TypeScript config
  ...tseslint.configs.recommended,

  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
        sourceType: "module",
        ecmaVersion: "latest",
      },
      globals: {
        ...globals.node,
      },
    },

    plugins: {
      import: importPlugin,
      promise: promisePlugin,
      "unused-imports": unusedImports,
    },

    rules: {
      /*
       GENERAL
      */

      "no-console": "off",
      "no-unused-vars": "off", // disabled in favor of TS version

      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],

      /*
       IMPORTS (important for ESM)
      */

      "import/order": [
        "warn",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "always",
        },
      ],

      "import/no-unresolved": "off",

      /*
       EXPRESS / BACKEND SAFETY
      */

      "@typescript-eslint/no-explicit-any": "warn",

      "@typescript-eslint/consistent-type-imports": "warn",

      /*
       PROMISE SAFETY
      */

      "promise/catch-or-return": "error",

      "promise/no-return-wrap": "error",

      /*
       REMOVE UNUSED IMPORTS
      */

      "unused-imports/no-unused-imports": "warn",
    },
  },
  globalIgnores(["dist", "node_modules"]),
]);

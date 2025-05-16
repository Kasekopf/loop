module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "libram"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
  rules: {
    "block-scoped-var": "error",
    curly: ["error", "multi-line"],
    "eol-last": "error",
    eqeqeq: "error",
    "no-trailing-spaces": "error",
    "no-var": "error",
    "prefer-arrow-callback": "error",
    "prefer-const": "error",
    "prefer-template": "error",
    "sort-imports": [
      "error",
      {
        ignoreCase: true,
        ignoreDeclarationSort: true,
      },
    ],
    "spaced-comment": "error",

    // This one needs a fix because TS's rules are different?
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-non-null-assertion": "error",

    // eslint-plugin-libram
    "libram/verify-constants": "error",
    "no-restricted-syntax": [
      "error",
      {
        selector: "CallExpression[callee.property.name='reduce'][arguments.length<2]",
        message: "Provide initialValue to .reduce().",
      },
    ],
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
};

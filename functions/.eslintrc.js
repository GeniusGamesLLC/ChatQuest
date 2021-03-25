module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.dev.json"],
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
    "env-setup.js"
  ],
  plugins: [
    "@typescript-eslint",
    "import",
  ],
  rules: {
    quotes: "off",
    "linebreak-style": "off",
    "max-len": "off",
    "comma-spacing": "off",
    "brace-style": "off",
    "keyword-spacing": "off",
    indent: "off",
    "object-curly-spacing": "off",
    "comma-dangle": "off",
    "quote-props": "off",
    "spaced-comment": "off",
    "key-spacing": "off",
    "valid-jsdoc": "off",
    "no-unused-vars": "off",
    "prefer-const": "off",
    "no-extra-boolean-cast": "off",
    "space-before-blocks": "off"
  },
};

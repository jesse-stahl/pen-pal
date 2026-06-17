// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // The Cloud Functions package is a separate workspace with its own toolchain.
    ignores: ['dist/*', 'functions/**', 'node_modules/*'],
  },
]);

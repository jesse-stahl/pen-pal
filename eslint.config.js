// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // The Cloud Functions package is a separate workspace with its own toolchain.
    ignores: ['dist/*', 'functions/**', 'node_modules/*'],
  },
  {
    // Reanimated primitives mutate shared values (`sv.value = ...`) inside event
    // handlers — that's the library's intended pattern, but the React-19 hooks plugin
    // flags it as a mutation of an "immutable" value and as a missing effect dependency.
    // Both are false positives for shared values, so silence them for these files only.
    files: ['src/ui/components/**'],
    rules: {
      'react-hooks/immutability': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
]);

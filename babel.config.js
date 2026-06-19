module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Worklets plugin MUST be listed last.
    plugins: ['react-native-worklets/plugin'],
  };
};

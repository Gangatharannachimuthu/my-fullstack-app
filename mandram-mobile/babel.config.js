module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4 moved its babel plugin into react-native-worklets. The drawer
    // navigator depends on reanimated, so this is required, and it must stay last.
    plugins: ['react-native-worklets/plugin'],
  };
};

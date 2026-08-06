const { withAppBuildGradle } = require("@expo/config-plugins");
const { mergeContents } = require("@expo/config-plugins/build/utils/generateCode");

// The app has no i18n/translation system (English-only UI), but the
// default RN/Expo template still packages every locale's string
// resources that autolinked native libraries ship with them. Restricting
// resConfigs trims those out of the release APK.
const withAndroidResConfigs = (config) => {
  return withAppBuildGradle(config, (config) => {
    config.modResults.contents = mergeContents({
      src: config.modResults.contents,
      newSrc: "        resConfigs \"en\"",
      tag: "res-configs",
      anchor: /versionName ".*"/,
      offset: 1,
      comment: "//",
    }).contents;
    return config;
  });
};

module.exports = withAndroidResConfigs;

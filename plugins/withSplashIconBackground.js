const { withAndroidStyles, AndroidConfig } = require('@expo/config-plugins');

// Must match the splash backgroundColor in app.json.
const BRAND = '#14323F';

/**
 * Config plugin: colors the Android 12+ splash-screen icon plate.
 *
 * The system splash draws windowSplashScreenAnimatedIcon on a rounded plate.
 * AOSP leaves the plate unset and expo-splash-screen doesn't write it, so OEM
 * skins (MIUI/HyperOS among others) pick their own color — black in dark
 * mode, which is the "black pill" behind the logo. Pinning the plate to the
 * splash background color makes it invisible: teal on teal.
 */
module.exports = function withSplashIconBackground(config) {
  return withAndroidStyles(config, (cfg) => {
    cfg.modResults = AndroidConfig.Styles.assignStylesValue(cfg.modResults, {
      add: true,
      parent: { name: 'Theme.App.SplashScreen', parent: 'Theme.SplashScreen' },
      name: 'windowSplashScreenIconBackgroundColor',
      value: BRAND,
    });
    return cfg;
  });
};

const { withAndroidStyles, AndroidConfig } = require('@expo/config-plugins');

// Must match the splash backgroundColor in app.json.
const BRAND = '#14323F';

const SPLASH_GROUP = { name: 'Theme.App.SplashScreen', parent: 'Theme.SplashScreen' };

/**
 * Config plugin: blank Android 12+ splash — no icon, just the brand color.
 *
 * The system splash draws windowSplashScreenAnimatedIcon on a rounded plate,
 * and several OEM skins (MIUI/HyperOS among others) repaint that plate black
 * in dark mode no matter what the drawable contains — the "black pill".
 * Rather than fight every skin, the icon is overridden to a transparent
 * drawable so there is nothing to plate: launch shows only the teal window
 * background, and the app's own first frame (login/home) takes over.
 *
 * The plate color is still pinned to the brand teal as a second layer, for
 * skins that draw a plate even for a transparent icon.
 *
 * ORDERING: this plugin must stay FIRST in app.json's plugins array.
 * expo-splash-screen REPLACES the whole Theme.App.SplashScreen style group,
 * and plugin style-mods execute in reverse array order — first in the array
 * runs last, after that replacement, so these overrides survive.
 */
module.exports = function withSplashIconBackground(config) {
  return withAndroidStyles(config, (cfg) => {
    cfg.modResults = AndroidConfig.Styles.assignStylesValue(cfg.modResults, {
      add: true,
      parent: SPLASH_GROUP,
      name: 'windowSplashScreenAnimatedIcon',
      value: '@android:color/transparent',
    });
    cfg.modResults = AndroidConfig.Styles.assignStylesValue(cfg.modResults, {
      add: true,
      parent: SPLASH_GROUP,
      name: 'windowSplashScreenIconBackgroundColor',
      value: BRAND,
    });
    return cfg;
  });
};

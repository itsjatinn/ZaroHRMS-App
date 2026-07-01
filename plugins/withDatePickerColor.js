const { withAndroidStyles, AndroidConfig } = require('@expo/config-plugins');

// App brand color used for the native date/time picker header + selected day.
const ACCENT = '#14323F';

/**
 * Config plugin: sets colorAccent / colorPrimary on the Android app theme so the
 * native @react-native-community/datetimepicker dialog is tinted with the app's
 * brand color instead of the default Material blue.
 */
module.exports = function withDatePickerColor(config) {
  return withAndroidStyles(config, (cfg) => {
    cfg.modResults = AndroidConfig.Styles.assignStylesValue(cfg.modResults, {
      add: true,
      parent: AndroidConfig.Styles.getAppThemeLightNoActionBarGroup(),
      name: 'colorAccent',
      value: ACCENT,
    });
    cfg.modResults = AndroidConfig.Styles.assignStylesValue(cfg.modResults, {
      add: true,
      parent: AndroidConfig.Styles.getAppThemeLightNoActionBarGroup(),
      name: 'colorPrimary',
      value: ACCENT,
    });
    return cfg;
  });
};

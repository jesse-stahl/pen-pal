const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Adds `use_modular_headers!` to the generated iOS Podfile.
 *
 * Firebase / Google-Sign-In pull in Swift pods (AppCheckCore) that depend on
 * GoogleUtilities and RecaptchaInterop, which don't define module maps. Without
 * modular headers those can't be integrated as static libraries and `pod install`
 * fails. The Podfile is regenerated on every prebuild, so this plugin re-applies
 * the directive each time rather than relying on a hand edit.
 */
module.exports = function withModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfile, 'utf8');
      if (!contents.includes('use_modular_headers!')) {
        contents = contents.replace(
          'prepare_react_native_project!',
          'prepare_react_native_project!\nuse_modular_headers!',
        );
        fs.writeFileSync(podfile, contents);
      }
      return cfg;
    },
  ]);
};

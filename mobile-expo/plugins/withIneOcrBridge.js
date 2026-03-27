const { withProjectBuildGradle, withAppBuildGradle, withAndroidManifest, createRunOncePlugin } = require('expo/config-plugins');

function withIneOcrBridge(config) {
  config = withProjectBuildGradle(config, (config) => {
    return config;
  });

  config = withAppBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes('play-services-mlkit-text-recognition')) {
      config.modResults.contents = config.modResults.contents.replace(
        /dependencies\s*\{/,
        `dependencies {\n    implementation "com.google.android.gms:play-services-mlkit-text-recognition:19.0.1"`
      );
    }
    if (!config.modResults.contents.includes('play-services-mlkit-document-scanner')) {
      config.modResults.contents = config.modResults.contents.replace(
        /dependencies\s*\{/,
        `dependencies {\n    implementation "com.google.android.gms:play-services-mlkit-document-scanner:16.0.0-beta1"`
      );
    }
    return config;
  });

  config = withAndroidManifest(config, (config) => {
    const app = config.modResults.manifest.application?.[0];
    if (app) {
      app['meta-data'] = app['meta-data'] || [];
      const already = app['meta-data'].some((item) => item.$['android:name'] === 'com.google.mlkit.vision.DEPENDENCIES');
      if (!already) {
        app['meta-data'].push({
          $: {
            'android:name': 'com.google.mlkit.vision.DEPENDENCIES',
            'android:value': 'ocr,barcode_ui',
          },
        });
      }
    }
    return config;
  });

  return config;
}

module.exports = createRunOncePlugin(withIneOcrBridge, 'with-ine-ocr-bridge', '1.0.0');

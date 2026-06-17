import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'PenPal',
  slug: 'penpal',
  owner: 'lomick2090',
  scheme: 'penpal',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'app.penpal.mobile',
    usesAppleSignIn: true,
  },
  android: {
    package: 'app.penpal.mobile',
  },
  plugins: [
    'expo-router',
    'expo-apple-authentication',
    'expo-secure-store',
    [
      '@react-native-google-signin/google-signin',
      // Reversed iOS OAuth client id (only used by the iOS build; harmless on Android).
      { iosUrlScheme: 'com.googleusercontent.apps.733857584761-imoav9bkpmbcv57a5tgkoh0c03liecmm' },
    ],
    [
      'expo-notifications',
      { icon: './assets/notification-icon.png', color: '#ffffff' },
    ],
  ],
  extra: {
    eas: {
      // Project id is not secret (it appears in the EAS dashboard URL). Hardcoded so the
      // build doesn't depend on .env being loaded; env var still overrides if set.
      projectId:
        process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? '544e8c13-dd99-4636-bd8b-271b02f38323',
    },
  },
});

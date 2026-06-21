import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'PenPal',
  slug: 'penpal',
  owner: 'lomick2090',
  scheme: 'penpal',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'app.penpal.mobile',
    usesAppleSignIn: true,
    googleServicesFile: './GoogleService-Info.plist',
  },
  android: {
    package: 'app.penpal.mobile',
    googleServicesFile: './google-services.json',
  },
  plugins: [
    'expo-router',
    'expo-font',
    '@react-native-firebase/app',
    '@react-native-firebase/auth',
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
    [
      'expo-image-picker',
      { photosPermission: 'PenPal needs access to your photos so you can set a profile picture.' },
    ],
    // @react-native-firebase requires static frameworks on iOS so that Swift-pod
    // headers (e.g. FirebaseAuth-Swift.h, pulled in by Firebase.h) resolve for the
    // RNFB pods. Static frameworks also give gRPC a proper module map, so the old
    // use_modular_headers! + prebuilt-gRPC workarounds are no longer needed.
    [
      'expo-build-properties',
      { ios: { useFrameworks: 'static' } },
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

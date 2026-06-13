import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'PenPal',
  slug: 'penpal',
  scheme: 'penpal',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'today.implemented.penpal',
    usesAppleSignIn: true,
  },
  android: {
    package: 'today.implemented.penpal',
  },
  plugins: [
    'expo-router',
    'expo-apple-authentication',
    'expo-secure-store',
    [
      'expo-notifications',
      { icon: './assets/notification-icon.png', color: '#ffffff' },
    ],
  ],
  extra: {
    eas: { projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID },
  },
});

import { View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuth } from '../../src/hooks/use-auth';
import { Screen } from '../../src/ui/components/screen';
import { AppText } from '../../src/ui/components/app-text';
import { Button } from '../../src/ui/components/button';
import { colors, spacing, radius, gradients } from '../../src/ui/theme';

export default function SignIn() {
  const { signInWithGoogle, signInWithApple } = useAuth();
  return (
    <Screen contentStyle={{ justifyContent: 'center' }}>
      <View style={{ alignItems: 'center', marginBottom: spacing.xxxl }}>
        <LinearGradient
          colors={gradients.duo}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: 88, height: 88, borderRadius: radius.xl, marginBottom: spacing.xl }}
        />
        <AppText variant="h1">PenPal</AppText>
        <AppText
          variant="body"
          color={colors.textMuted}
          style={{ textAlign: 'center', marginTop: spacing.sm }}
        >
          Learn each other&apos;s language, together.
        </AppText>
      </View>

      <View style={{ gap: spacing.md }}>
        <Button title="Continue with Google" onPress={() => signInWithGoogle()} />
        {Platform.OS === 'ios' ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={radius.pill}
            style={{ height: 52 }}
            onPress={signInWithApple}
          />
        ) : null}
      </View>
    </Screen>
  );
}

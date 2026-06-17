import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuth } from '../../src/hooks/use-auth';

export default function SignIn() {
  const { signInWithGoogle, signInWithApple } = useAuth();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>PenPal</Text>
      <Text style={styles.subtitle}>Learn each other&apos;s language, together.</Text>

      <Pressable style={styles.googleBtn} onPress={() => signInWithGoogle()}>
        <Text style={styles.googleText}>Continue with Google</Text>
      </Pressable>

      {Platform.OS === 'ios' && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={8}
          style={styles.appleBtn}
          onPress={signInWithApple}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 16 },
  title: { fontSize: 40, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 32, color: '#555' },
  googleBtn: { backgroundColor: '#1a73e8', padding: 16, borderRadius: 8, alignItems: 'center' },
  googleText: { color: 'white', fontWeight: '600', fontSize: 16 },
  appleBtn: { height: 52 },
});

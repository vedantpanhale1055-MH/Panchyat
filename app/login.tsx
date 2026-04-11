import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendOTP = async () => {
    if (phone.length !== 10) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    try {
      const recaptcha = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
      const confirmation = await signInWithPhoneNumber(auth, '+91' + phone, recaptcha);
      (global as any).confirmationResult = confirmation;
      router.push({ pathname: '/otp', params: { phone } });
    } catch (error: any) {
      alert('Error sending OTP: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.wrapper}>
        <View style={styles.inner}>

          <View style={styles.logoArea}>
            <Text style={styles.appName}>🏘 Panchyat</Text>
            <Text style={styles.tagline}>Your society, connected.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.subtitle}>Enter your phone number to continue</Text>

            <View style={styles.phoneRow}>
              <View style={styles.countryCode}>
                <Text style={styles.countryText}>+91</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="10-digit mobile number"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            {/* Invisible recaptcha container */}
            <div id="recaptcha-container"></div>

            <TouchableOpacity
              style={[styles.button, phone.length !== 10 && styles.buttonDisabled]}
              onPress={handleSendOTP}
              disabled={phone.length !== 10 || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send OTP</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.note}>
              You'll receive a 6-digit OTP on your number
            </Text>
          </View>

          <Text style={styles.footer}>
            New members need admin approval to access the app
          </Text>

        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  wrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  inner: { width: '100%', maxWidth: 480, paddingHorizontal: 24 },
  logoArea: { alignItems: 'center', marginBottom: 40 },
  appName: { fontSize: 42, fontWeight: 'bold', color: '#1a1a2e', letterSpacing: 1 },
  tagline: { fontSize: 15, color: '#555', marginTop: 6 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 28, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 20, elevation: 5 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#777', marginBottom: 24 },
  phoneRow: { flexDirection: 'row', marginBottom: 16, gap: 10 },
  countryCode: { backgroundColor: '#f0f4ff', borderRadius: 12, paddingHorizontal: 14, justifyContent: 'center', borderWidth: 1, borderColor: '#dde3f0' },
  countryText: { fontSize: 16, color: '#1a1a2e', fontWeight: '600' },
  input: { flex: 1, backgroundColor: '#f0f4ff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1a1a2e', borderWidth: 1, borderColor: '#dde3f0' },
  button: { backgroundColor: '#4f46e5', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 14 },
  buttonDisabled: { backgroundColor: '#a5b4fc' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  note: { textAlign: 'center', fontSize: 12, color: '#999' },
  footer: { textAlign: 'center', marginTop: 32, fontSize: 13, color: '#888', paddingHorizontal: 16 },
});
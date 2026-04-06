import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [flatNo, setFlatNo] = useState('');
  const [wing, setWing] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const wings = ['A', 'B', 'C', 'D', 'E'];

  const handleRegister = async () => {
    if (!name || !flatNo || !wing) {
      alert('Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      await setDoc(doc(db, 'users', user.uid), {
        name,
        flatNo,
        wing,
        phone: user.phoneNumber,
        role: 'resident',
        approved: false,
        createdAt: new Date().toISOString(),
        societyId: 'society_001',
      });

      router.push('/approval');
    } catch (error: any) {
      alert('Error saving profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const isValid = name.length > 0 && flatNo.length > 0 && wing.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.wrapper}>
          <View style={styles.inner}>

            <View style={styles.logoArea}>
              <Text style={styles.appName}>🏘 Panchyat</Text>
              <Text style={styles.tagline}>Tell us about yourself</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.title}>Create Profile</Text>
              <Text style={styles.subtitle}>
                This info helps your neighbours and admin identify you
              </Text>

              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>Flat Number</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 101, 202, B-304"
                placeholderTextColor="#999"
                value={flatNo}
                onChangeText={setFlatNo}
              />

              <Text style={styles.label}>Wing</Text>
              <View style={styles.wingRow}>
                {wings.map(w => (
                  <TouchableOpacity
                    key={w}
                    style={[styles.wingBtn, wing === w && styles.wingBtnSelected]}
                    onPress={() => setWing(w)}
                  >
                    <Text style={[styles.wingText, wing === w && styles.wingTextSelected]}>
                      {w}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  ℹ️  After registering, your account will be reviewed by the society admin before you can access the app.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.button, !isValid && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={!isValid || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Submit for Approval</Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.back}>← Back</Text>
            </TouchableOpacity>

          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4ff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  inner: {
    width: '100%',
    maxWidth: 480,
    paddingHorizontal: 24,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 32,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  tagline: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#777',
    marginBottom: 24,
    lineHeight: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#dde3f0',
    marginBottom: 16,
  },
  wingRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  wingBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#dde3f0',
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wingBtnSelected: {
    borderColor: '#4f46e5',
    backgroundColor: '#eef2ff',
  },
  wingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
  wingTextSelected: {
    color: '#4f46e5',
  },
  infoBox: {
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 13,
    color: '#4f46e5',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  back: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 14,
    color: '#4f46e5',
    fontWeight: '500',
  },
});
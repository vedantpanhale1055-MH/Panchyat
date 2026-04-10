import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, TouchableOpacity, ActivityIndicator
} from 'react-native';
import { auth, db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    getDoc(doc(db, 'users', uid)).then(snap => {
      if (snap.exists()) setUser(snap.data());
      setLoading(false);
    });
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace('/');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.phone}>{user?.phone}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'RESIDENT'}</Text>
          </View>
        </View>

        {/* Info Cards */}
        <View style={styles.section}>
          {[
            { label: 'Flat Number', value: user?.flatNo, icon: '🏠' },
            { label: 'Wing', value: `Wing ${user?.wing}`, icon: '🏢' },
            { label: 'Society', value: 'Panchyat Society', icon: '🏘' },
            { label: 'Account Status', value: user?.approved ? 'Approved ✅' : 'Pending ⏳', icon: '🔐' },
          ].map((item, i) => (
            <View key={i} style={styles.infoRow}>
              <Text style={styles.infoIcon}>{item.icon}</Text>
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Logout */}
        <View style={{ padding: 16, paddingTop: 8 }}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>🚪 Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    backgroundColor: '#4f46e5', padding: 32,
    alignItems: 'center', paddingBottom: 40,
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  phone: { fontSize: 14, color: '#c7d2fe', marginTop: 4 },
  roleBadge: {
    marginTop: 10, backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16, paddingVertical: 5, borderRadius: 20,
  },
  roleText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  section: {
    backgroundColor: '#fff', margin: 16, borderRadius: 16,
    overflow: 'hidden', shadowColor: '#000',
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f4ff',
  },
  infoIcon: { fontSize: 22, marginRight: 14 },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#888', fontWeight: '500' },
  infoValue: { fontSize: 15, fontWeight: '600', color: '#1a1a2e', marginTop: 2 },
  logoutBtn: {
    backgroundColor: '#fee2e2', borderRadius: 14,
    padding: 16, alignItems: 'center',
  },
  logoutText: { color: '#dc2626', fontWeight: '700', fontSize: 15 },
});
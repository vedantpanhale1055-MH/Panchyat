import { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, TextInput, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../../firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { theme, toggleTheme, colors } = useTheme();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace('/');
  };

  const handleSave = async () => {
    if (!name.trim() || !user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { name: name.trim() });
      setEditing(false);
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeBtn}>
            <Text style={styles.themeBtnText}>{theme === 'dark' ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
          {!editing && (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Text style={[styles.editBtn, { color: colors.primary }]}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.content}>
        <View style={[styles.avatarCircle, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </Text>
        </View>

        {editing ? (
          <View style={styles.editRow}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.muted}
            />
            <View style={styles.editBtns}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={() => setEditing(false)}>
                <Text style={[styles.cancelText, { color: colors.muted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={[styles.name, { color: colors.text }]}>{user?.name}</Text>
        )}

        <Text style={[styles.phone, { color: colors.subtext }]}>{user?.phone}</Text>

        <View style={styles.infoGrid}>
          {[
            { label: 'Wing', value: user?.wing },
            { label: 'Flat', value: user?.flatNo },
            { label: 'Role', value: user?.role },
            { label: 'Status', value: user?.approved ? 'Approved ✅' : 'Pending ⏳' },
          ].map(item => (
            <View key={item.label} style={[styles.infoBox, { backgroundColor: colors.card }]}>
              <Text style={[styles.infoLabel, { color: colors.subtext }]}>{item.label}</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={[styles.adminBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push('/admin')}>
          <Text style={[styles.adminBtnText, { color: colors.primary }]}>🛡 Admin Panel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 20, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', borderBottomWidth: 1,
  },
  title: { fontSize: 20, fontWeight: 'bold' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  themeBtn: { padding: 4 },
  themeBtnText: { fontSize: 20 },
  editBtn: { fontWeight: '600', fontSize: 15 },
  content: { flex: 1, alignItems: 'center', padding: 24 },
  avatarCircle: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, borderWidth: 3,
  },
  avatarText: { fontSize: 36, fontWeight: 'bold' },
  name: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  phone: { fontSize: 14, marginBottom: 24 },
  editRow: { width: '100%', marginBottom: 16 },
  input: {
    borderRadius: 12, padding: 14, fontSize: 16,
    borderWidth: 1, marginBottom: 10,
  },
  editBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  cancelText: { fontWeight: '600' },
  saveBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, width: '100%', marginBottom: 24 },
  infoBox: {
    flex: 1, minWidth: '45%', borderRadius: 14, padding: 16,
    alignItems: 'center', elevation: 1,
  },
  infoLabel: { fontSize: 12, marginBottom: 4 },
  infoValue: { fontSize: 18, fontWeight: 'bold' },
  adminBtn: {
    width: '100%', borderRadius: 12, padding: 16,
    alignItems: 'center', marginBottom: 12, borderWidth: 1,
  },
  adminBtnText: { fontWeight: '700', fontSize: 15 },
  logoutBtn: {
    width: '100%', backgroundColor: '#fee2e2', borderRadius: 12,
    padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#fca5a5',
  },
  logoutText: { color: '#dc2626', fontWeight: '700', fontSize: 15 },
});
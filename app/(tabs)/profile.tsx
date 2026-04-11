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

  const infoItems = [
    { label: 'Wing', value: user?.wing },
    { label: 'Flat', value: user?.flatNo },
    { label: 'Role', value: user?.role },
    {
      label: 'Status',
      value: user?.approved ? 'Approved ✅' : 'Pending ⏳',
      bold: !user?.approved,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
        <View style={styles.headerRight}>
          {/* Dark / Light toggle */}
          <TouchableOpacity
            onPress={toggleTheme}
            style={[styles.themeToggle, { backgroundColor: colors.bg, borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <Text style={styles.themeIcon}>{theme === 'dark' ? '☀️' : '🌙'}</Text>
            <Text style={[styles.themeLabel, { color: colors.subtext }]}>
              {theme === 'dark' ? 'Light' : 'Dark'}
            </Text>
          </TouchableOpacity>

          {!editing && (
            <TouchableOpacity
              onPress={() => setEditing(true)}
              style={[styles.editBtn, { borderColor: colors.primary }]}
            >
              <Text style={[styles.editBtnText, { color: colors.primary }]}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Avatar */}
        <View style={[styles.avatarCircle, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '50' }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>

        {/* Name / Edit */}
        {editing ? (
          <View style={styles.editRow}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.muted}
              autoFocus
            />
            <View style={styles.editBtns}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => setEditing(false)}
              >
                <Text style={[styles.cancelText, { color: colors.muted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.saveText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={[styles.userName, { color: colors.text }]}>{user?.name}</Text>
        )}

        <Text style={[styles.phone, { color: colors.subtext }]}>{user?.phone}</Text>

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          {infoItems.map((item) => (
            <View key={item.label} style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.subtext }]}>{item.label}</Text>
              <Text style={[styles.infoValue, { color: item.bold ? colors.warning : colors.text }]}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Admin Panel (only for admins) */}
        {user?.role === 'admin' && (
          <TouchableOpacity
            style={[styles.adminBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/admin')}
          >
            <Text style={[styles.adminBtnText, { color: colors.primary }]}>🛡 Admin Panel</Text>
          </TouchableOpacity>
        )}

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: colors.dangerBg, borderColor: colors.dangerBorder }]}
          onPress={handleLogout}
        >
          <Text style={[styles.logoutText, { color: colors.danger }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1,
  },
  title: { fontSize: 20, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  themeToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
  },
  themeIcon: { fontSize: 15 },
  themeLabel: { fontSize: 12, fontWeight: '600' },
  editBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5,
  },
  editBtnText: { fontSize: 13, fontWeight: '600' },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 28 },
  avatarCircle: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14, borderWidth: 3,
  },
  avatarText: { fontSize: 38, fontWeight: '700' },
  userName: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  phone: { fontSize: 14, marginBottom: 24 },
  editRow: { width: '100%', marginBottom: 16 },
  input: { borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1, marginBottom: 10 },
  editBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  cancelText: { fontWeight: '600' },
  saveBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, width: '100%', marginBottom: 24 },
  infoBox: {
    flex: 1, minWidth: '45%', borderRadius: 14, padding: 16,
    alignItems: 'center', borderWidth: 1,
  },
  infoLabel: { fontSize: 12, marginBottom: 4 },
  infoValue: { fontSize: 16, fontWeight: '700' },
  adminBtn: {
    width: '100%', borderRadius: 12, padding: 16,
    alignItems: 'center', marginBottom: 12, borderWidth: 1,
  },
  adminBtnText: { fontWeight: '700', fontSize: 15 },
  logoutBtn: {
    width: '100%', borderRadius: 12, padding: 16,
    alignItems: 'center', borderWidth: 1,
  },
  logoutText: { fontWeight: '700', fontSize: 15 },
});
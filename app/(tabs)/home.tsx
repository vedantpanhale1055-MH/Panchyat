import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Linking, ActivityIndicator, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { db } from '../../firebase';
import {
  collection, onSnapshot, query, orderBy, limit,
  getDoc, doc, deleteDoc
} from 'firebase/firestore';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';

const SOCIETY_ID = 'society_001';

const confirmDelete = (msg: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') { if (window.confirm(msg)) onConfirm(); }
  else {
    const { Alert } = require('react-native');
    Alert.alert('Delete', msg, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onConfirm },
    ]);
  }
};

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { theme, toggleTheme, colors } = useTheme();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);
  const [adminPhone, setAdminPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    getDoc(doc(db, 'societies', SOCIETY_ID)).then((snap) => {
      if (snap.exists()) setAdminPhone(snap.data()?.adminPhone || '');
    });

    const annQ = query(
      collection(db, 'societies', SOCIETY_ID, 'announcements'),
      orderBy('createdAt', 'desc'), limit(10)
    );
    const unsubAnn = onSnapshot(annQ, (snap) => {
      setAnnouncements(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    const compQ = query(
      collection(db, 'societies', SOCIETY_ID, 'complaints'),
      orderBy('createdAt', 'desc'), limit(3)
    );
    const unsubComp = onSnapshot(compQ, (snap) => {
      setRecentComplaints(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubAnn(); unsubComp(); };
  }, []);

  const handleCallAdmin = () => {
    if (!adminPhone) return alert('Admin phone not set yet.\nAdmin: Add "adminPhone" field to society_001 in Firestore.');
    Linking.openURL(`tel:${adminPhone}`);
  };

  const handleDeleteAnnouncement = (id: string) => {
    confirmDelete('Remove this announcement for all residents?', async () => {
      try { await deleteDoc(doc(db, 'societies', SOCIETY_ID, 'announcements', id)); }
      catch (e: any) { alert('Failed: ' + e.message); }
    });
  };

  // Sort: pinned/emergency first, then by date
  const sorted = [...announcements].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  const statusColor = (s: string) => {
    if (s === 'Resolved') return colors.success;
    if (s === 'In Progress') return colors.warning;
    return colors.primary;
  };

  const quickActions = [
    { emoji: '📢', label: 'Announce', route: '/(tabs)/community' },
    { emoji: '🔧', label: 'Complaints', route: '/(tabs)/complaints' },
    { emoji: '🚪', label: 'Gate', route: '/(tabs)/gate' },
    { emoji: '👥', label: 'Community', route: '/(tabs)/community' },
    { emoji: '📞', label: 'Call Admin', action: handleCallAdmin },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.greeting, { color: colors.subtext }]}>Welcome back,</Text>
            <Text style={[styles.userName, { color: colors.text }]}>{user?.name || 'Resident'} {isAdmin ? '🛡' : '👋'}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={toggleTheme}
              style={[styles.themeBtn, { backgroundColor: colors.bg, borderColor: colors.border }]}
            >
              <Text style={styles.themeIcon}>{theme === 'dark' ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
            <View style={[styles.flatBadge, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' }]}>
              <Text style={[styles.flatText, { color: colors.primary }]}>{user?.wing}-{user?.flatNo}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => action.action ? action.action() : router.push(action.route as any)}
                activeOpacity={0.75}
              >
                <Text style={styles.actionEmoji}>{action.emoji}</Text>
                <Text style={[styles.actionLabel, { color: colors.text }]}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Announcements */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Announcements</Text>
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : sorted.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.subtext }]}>No announcements yet.</Text>
          ) : (
            sorted.map((a) => (
              <View
                key={a.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.card, borderColor: a.emergency ? colors.danger : (a.pinned ? colors.warning : colors.border) },
                  (a.emergency || a.pinned) && { borderWidth: 1.5 },
                ]}
              >
                <View style={styles.cardRow}>
                  <Text style={[styles.cardTitle, { color: a.emergency ? colors.danger : colors.text, flex: 1 }]}>
                    {a.emergency ? '🚨 ' : a.pinned ? '📌 ' : ''}{a.title}
                  </Text>
                  {isAdmin && (
                    <TouchableOpacity
                      onPress={() => handleDeleteAnnouncement(a.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={styles.deleteIcon}>🗑</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={[styles.cardBody, { color: colors.subtext }]} numberOfLines={2}>{a.body}</Text>
              </View>
            ))
          )}
        </View>

        {/* Recent Complaints */}
        <View style={[styles.section, { paddingBottom: 24 }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Complaints</Text>
          {recentComplaints.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.subtext }]}>No complaints filed yet.</Text>
          ) : (
            recentComplaints.map((c) => (
              <View key={c.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardRow}>
                  <Text style={[styles.cardTitle, { color: colors.text, flex: 1 }]} numberOfLines={1}>{c.title}</Text>
                  <Text style={[styles.statusBadge, { color: statusColor(c.status) }]}>{c.status}</Text>
                </View>
                <Text style={[styles.cardBody, { color: colors.subtext }]}>{c.userName} • Flat {c.flatNo}</Text>
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1,
  },
  greeting: { fontSize: 13 },
  userName: { fontSize: 20, fontWeight: '700', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  themeBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  themeIcon: { fontSize: 16 },
  flatBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  flatText: { fontSize: 13, fontWeight: '700' },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: {
    flex: 1, minWidth: 60, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, paddingVertical: 14,
  },
  actionEmoji: { fontSize: 24, marginBottom: 4 },
  actionLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  card: { borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, elevation: 1 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 14, fontWeight: '700', marginRight: 8 },
  cardBody: { fontSize: 12, lineHeight: 18 },
  statusBadge: { fontSize: 11, fontWeight: '700' },
  deleteIcon: { fontSize: 16 },
  emptyText: { fontSize: 13, textAlign: 'center', paddingVertical: 16 },
});
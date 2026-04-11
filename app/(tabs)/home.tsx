import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { db } from '../../firebase';
import { collection, onSnapshot, query, orderBy, limit, addDoc } from 'firebase/firestore';
import { useUser } from '../../context/UserContext';

export default function HomeScreen() {
  const { user } = useUser();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loadingA, setLoadingA] = useState(true);
  const [loadingC, setLoadingC] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'societies', 'society_001', 'announcements'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const unsub = onSnapshot(q, snap => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoadingA(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'societies', 'society_001', 'complaints'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const unsub = onSnapshot(q, snap => {
      setComplaints(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoadingC(false);
    });
    return unsub;
  }, []);

  const handleSOS = () => {
    Alert.alert(
      '🆘 SOS Alert',
      'This will alert ALL society members and security. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'SEND SOS',
          style: 'destructive',
          onPress: async () => {
            try {
              await addDoc(collection(db, 'societies', 'society_001', 'sos'), {
                triggeredBy: user?.name,
                flatNo: user?.flatNo,
                wing: user?.wing,
                phone: user?.phone,
                timestamp: new Date().toISOString(),
                resolved: false,
              });
              Alert.alert('✅ SOS Sent', 'All residents and security have been alerted!');
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          }
        }
      ]
    );
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning 👋';
    if (h < 17) return 'Good afternoon 👋';
    return 'Good evening 👋';
  };

  const statusColor = (s: string) => {
    if (s === 'Resolved') return '#16a34a';
    if (s === 'In Progress') return '#d97706';
    return '#64748b';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.name}>{user?.name || 'Resident'}</Text>
          <Text style={styles.flat}>Flat {user?.flatNo} • Society Panchyat</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/gate')}>
            <Text style={styles.actionEmoji}>🚪</Text>
            <Text style={styles.actionLabel}>Approve Visitor</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/complaints')}>
            <Text style={styles.actionEmoji}>🛠</Text>
            <Text style={styles.actionLabel}>Raise Complaint</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/community')}>
            <Text style={styles.actionEmoji}>💬</Text>
            <Text style={styles.actionLabel}>Community Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, styles.sosCard]} onPress={handleSOS}>
            <Text style={styles.actionEmoji}>🆘</Text>
            <Text style={[styles.actionLabel, styles.sosLabel]}>SOS</Text>
          </TouchableOpacity>
        </View>

        {/* Announcements */}
        <Text style={styles.sectionTitle}>Announcements</Text>
        <View style={styles.section}>
          {loadingA ? (
            <ActivityIndicator color="#4f46e5" style={{ padding: 20 }} />
          ) : announcements.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>📢</Text>
              <Text style={styles.emptyText}>No announcements yet</Text>
            </View>
          ) : (
            announcements.map(a => (
              <View key={a.id} style={styles.announcementCard}>
                <View style={styles.announcementHeader}>
                  <Text style={styles.announcementBadge}>📢 Announcement</Text>
                  <Text style={styles.timeText}>
                    {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
                <Text style={styles.announcementTitle}>{a.title}</Text>
                <Text style={styles.announcementBody}>{a.body}</Text>
              </View>
            ))
          )}
        </View>

        {/* Recent Complaints */}
        <Text style={styles.sectionTitle}>Recent Complaints</Text>
        <View style={styles.section}>
          {loadingC ? (
            <ActivityIndicator color="#4f46e5" style={{ padding: 20 }} />
          ) : complaints.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>✅</Text>
              <Text style={styles.emptyText}>No open complaints</Text>
            </View>
          ) : (
            complaints.map(c => (
              <TouchableOpacity
                key={c.id}
                style={styles.complaintCard}
                onPress={() => router.push('/(tabs)/complaints')}
              >
                <View style={styles.complaintTop}>
                  <View style={[styles.urgencyDot, {
                    backgroundColor: c.urgency === 'High' ? '#dc2626' : c.urgency === 'Medium' ? '#d97706' : '#16a34a'
                  }]} />
                  <Text style={styles.complaintTitle}>{c.title}</Text>
                  <Text style={[styles.statusText, { color: statusColor(c.status) }]}>{c.status}</Text>
                </View>
                <Text style={styles.complaintMeta}>{c.userName} • Flat {c.flatNo}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  header: {
    backgroundColor: '#4f46e5',
    padding: 20,
    paddingTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: { fontSize: 13, color: '#c7d2fe' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginTop: 2 },
  flat: { fontSize: 13, color: '#c7d2fe', marginTop: 2 },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  scroll: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginTop: 16, marginBottom: 10 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  actionCard: {
    width: '47%', backgroundColor: '#fff', borderRadius: 14,
    padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  sosCard: { backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fca5a5' },
  actionEmoji: { fontSize: 28, marginBottom: 8 },
  actionLabel: { fontSize: 13, fontWeight: '600', color: '#1a1a2e', textAlign: 'center' },
  sosLabel: { color: '#dc2626' },
  section: {
    backgroundColor: '#fff', borderRadius: 14,
    overflow: 'hidden', marginBottom: 4,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  emptyBox: { alignItems: 'center', padding: 32 },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888' },
  announcementCard: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  announcementHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  announcementBadge: { fontSize: 11, fontWeight: '700', color: '#4f46e5' },
  timeText: { fontSize: 11, color: '#aaa' },
  announcementTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  announcementBody: { fontSize: 13, color: '#666', lineHeight: 20 },
  complaintCard: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  complaintTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  urgencyDot: { width: 8, height: 8, borderRadius: 4 },
  complaintTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  statusText: { fontSize: 11, fontWeight: '700' },
  complaintMeta: { fontSize: 12, color: '#aaa', marginLeft: 16 },
});
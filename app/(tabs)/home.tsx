import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, TouchableOpacity, ActivityIndicator
} from 'react-native';
import { db, auth } from '../../firebase';
import {
  collection, query, orderBy, limit,
  getDocs, doc, getDoc
} from 'firebase/firestore';

type Announcement = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  type: 'notice' | 'event' | 'alert';
};

type Complaint = {
  id: string;
  title: string;
  status: string;
  urgency: string;
  upvotes: number;
};

export default function HomeScreen() {
  const [userName, setUserName] = useState('');
  const [flatNo, setFlatNo] = useState('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (uid) {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserName(data.name || 'Resident');
          setFlatNo(data.flatNo || '');
        }
      }

      const annSnap = await getDocs(
        query(
          collection(db, 'societies', 'society_001', 'announcements'),
          orderBy('createdAt', 'desc'),
          limit(5)
        )
      );
      setAnnouncements(annSnap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)));

      const compSnap = await getDocs(
        query(
          collection(db, 'societies', 'society_001', 'complaints'),
          orderBy('createdAt', 'desc'),
          limit(3)
        )
      );
      setRecentComplaints(compSnap.docs.map(d => ({ id: d.id, ...d.data() } as Complaint)));
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const typeColor = (t: string) => {
    if (t === 'alert') return { bg: '#fee2e2', text: '#dc2626', icon: '🚨' };
    if (t === 'event') return { bg: '#dcfce7', text: '#16a34a', icon: '🎉' };
    return { bg: '#eef2ff', text: '#4f46e5', icon: '📢' };
  };

  const urgencyColor = (u: string) => {
    if (u === 'High') return '#dc2626';
    if (u === 'Medium') return '#d97706';
    return '#16a34a';
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
          <View>
            <Text style={styles.greeting}>Good morning 👋</Text>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.flatTag}>Flat {flatNo} • Society Panchyat</Text>
          </View>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>🏘</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickRow}>
            <View style={styles.quickCard}>
              <Text style={styles.quickIcon}>🚪</Text>
              <Text style={styles.quickLabel}>Approve Visitor</Text>
            </View>
            <View style={styles.quickCard}>
              <Text style={styles.quickIcon}>🛠</Text>
              <Text style={styles.quickLabel}>Raise Complaint</Text>
            </View>
            <View style={styles.quickCard}>
              <Text style={styles.quickIcon}>💬</Text>
              <Text style={styles.quickLabel}>Community Chat</Text>
            </View>
            <View style={styles.quickCard}>
              <Text style={styles.quickIcon}>🆘</Text>
              <Text style={[styles.quickLabel, { color: '#dc2626' }]}>SOS</Text>
            </View>
          </View>
        </View>

        {/* Announcements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Announcements</Text>
          {announcements.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>📢</Text>
              <Text style={styles.emptyText}>No announcements yet</Text>
            </View>
          ) : (
            announcements.map(item => {
              const c = typeColor(item.type);
              return (
                <View key={item.id} style={styles.annCard}>
                  <View style={[styles.annBadge, { backgroundColor: c.bg }]}>
                    <Text style={{ fontSize: 12 }}>{c.icon}</Text>
                    <Text style={[styles.annBadgeText, { color: c.text }]}>
                      {item.type?.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.annTitle}>{item.title}</Text>
                  <Text style={styles.annBody}>{item.body}</Text>
                  <Text style={styles.annDate}>
                    {new Date(item.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short'
                    })}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* Recent Complaints */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Complaints</Text>
          {recentComplaints.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>✅</Text>
              <Text style={styles.emptyText}>No open complaints</Text>
            </View>
          ) : (
            recentComplaints.map(item => (
              <View key={item.id} style={styles.compCard}>
                <View style={styles.compRow}>
                  <Text style={styles.compTitle}>{item.title}</Text>
                  <View style={[styles.urgDot, { backgroundColor: urgencyColor(item.urgency) }]} />
                </View>
                <View style={styles.compFooter}>
                  <Text style={styles.compStatus}>{item.status}</Text>
                  <Text style={styles.compVotes}>👍 {item.upvotes}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    backgroundColor: '#4f46e5', padding: 24, paddingTop: 32,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  greeting: { fontSize: 14, color: '#c7d2fe' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 2 },
  flatTag: { fontSize: 13, color: '#a5b4fc', marginTop: 4 },
  logoCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 26 },
  section: { padding: 16, paddingBottom: 0 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
  quickRow: { flexDirection: 'row', gap: 10 },
  quickCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14,
    alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  quickIcon: { fontSize: 24, marginBottom: 6 },
  quickLabel: { fontSize: 11, fontWeight: '600', color: '#555', textAlign: 'center' },
  emptyCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 24,
    alignItems: 'center', marginBottom: 12,
  },
  emptyEmoji: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888' },
  annCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  annBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 20, marginBottom: 8,
  },
  annBadgeText: { fontSize: 10, fontWeight: '700' },
  annTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  annBody: { fontSize: 13, color: '#666', lineHeight: 20 },
  annDate: { fontSize: 11, color: '#aaa', marginTop: 6 },
  compCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  compRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  compTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a2e', flex: 1 },
  urgDot: { width: 10, height: 10, borderRadius: 5 },
  compFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  compStatus: { fontSize: 12, color: '#888' },
  compVotes: { fontSize: 12, color: '#4f46e5', fontWeight: '600' },
});
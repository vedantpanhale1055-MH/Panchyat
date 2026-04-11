import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, TextInput, Modal
} from 'react-native';
import { db } from '../firebase';
import {
  collection, query, where, getDocs,
  updateDoc, doc, addDoc, onSnapshot, orderBy
} from 'firebase/firestore';
import { useUser } from '../context/UserContext';

type User = {
  id: string;
  name: string;
  flatNo: string;
  wing: string;
  phone: string;
  approved: boolean;
  createdAt: string;
};

export default function AdminScreen() {
  const { user } = useUser();
  const [tab, setTab] = useState<'approvals' | 'announcements' | 'sos'>('approvals');
  const [users, setUsers] = useState<User[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [sosAlerts, setSosAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('approved', '==', false));
      const snapshot = await getDocs(q);
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as User)));
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    const unsubA = onSnapshot(
      query(collection(db, 'societies', 'society_001', 'announcements'), orderBy('createdAt', 'desc')),
      snap => setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const unsubS = onSnapshot(
      query(collection(db, 'societies', 'society_001', 'sos'), orderBy('timestamp', 'desc')),
      snap => setSosAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    return () => { unsubA(); unsubS(); };
  }, []);

  const handleApprove = async (userId: string) => {
    setUpdating(userId);
    try {
      await updateDoc(doc(db, 'users', userId), { approved: true });
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setUpdating(null);
    }
  };

  const handleReject = async (userId: string) => {
    setUpdating(userId);
    try {
      await updateDoc(doc(db, 'users', userId), { rejected: true });
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setUpdating(null);
    }
  };

  const handlePostAnnouncement = async () => {
    if (!title || !body) { alert('Fill both fields'); return; }
    setPosting(true);
    try {
      await addDoc(collection(db, 'societies', 'society_001', 'announcements'), {
        title,
        body,
        postedBy: user?.name,
        createdAt: new Date().toISOString(),
      });
      setTitle('');
      setBody('');
      setShowModal(false);
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setPosting(false);
    }
  };

  const handleResolveSOS = async (id: string) => {
    await updateDoc(doc(db, 'societies', 'society_001', 'sos', id), { resolved: true });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Panel</Text>
        <Text style={styles.subtitle}>Society Panchyat</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['approvals', 'announcements', 'sos'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'approvals' ? `Approvals ${users.length > 0 ? `(${users.length})` : ''}` :
               t === 'announcements' ? 'Announce' : `SOS ${sosAlerts.filter(s => !s.resolved).length > 0 ? `🔴` : ''}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Approvals Tab */}
      {tab === 'approvals' && (
        loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>
        ) : users.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>✅</Text>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptyText}>No pending approval requests</Text>
            <TouchableOpacity style={styles.refreshBtn} onPress={fetchUsers}>
              <Text style={styles.refreshText}>↻ Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.scroll}>
            {users.map(u => (
              <View key={u.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{u.name?.charAt(0)?.toUpperCase()}</Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{u.name}</Text>
                    <Text style={styles.userFlat}>Wing {u.wing} — Flat {u.flatNo}</Text>
                    <Text style={styles.userPhone}>{u.phone}</Text>
                  </View>
                </View>
                <Text style={styles.requestedAt}>
                  {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(u.id)} disabled={updating === u.id}>
                    <Text style={styles.rejectText}>✕ Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(u.id)} disabled={updating === u.id}>
                    {updating === u.id ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.approveText}>✓ Approve</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )
      )}

      {/* Announcements Tab */}
      {tab === 'announcements' && (
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={styles.postBtn} onPress={() => setShowModal(true)}>
            <Text style={styles.postBtnText}>+ Post Announcement</Text>
          </TouchableOpacity>
          <ScrollView style={styles.scroll}>
            {announcements.length === 0 ? (
              <View style={styles.center}>
                <Text style={styles.emptyEmoji}>📢</Text>
                <Text style={styles.emptyTitle}>No announcements yet</Text>
              </View>
            ) : (
              announcements.map(a => (
                <View key={a.id} style={styles.card}>
                  <Text style={styles.userName}>{a.title}</Text>
                  <Text style={styles.userFlat}>{a.body}</Text>
                  <Text style={styles.requestedAt}>
                    Posted by {a.postedBy} • {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {/* SOS Tab */}
      {tab === 'sos' && (
        <ScrollView style={styles.scroll}>
          {sosAlerts.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyEmoji}>🆘</Text>
              <Text style={styles.emptyTitle}>No SOS alerts</Text>
            </View>
          ) : (
            sosAlerts.map(s => (
              <View key={s.id} style={[styles.card, !s.resolved && { borderLeftWidth: 3, borderLeftColor: '#dc2626' }]}>
                <View style={styles.cardTop}>
                  <View style={[styles.avatar, { backgroundColor: s.resolved ? '#dcfce7' : '#fee2e2' }]}>
                    <Text style={styles.avatarText}>🆘</Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{s.triggeredBy}</Text>
                    <Text style={styles.userFlat}>Wing {s.wing} — Flat {s.flatNo}</Text>
                    <Text style={styles.userPhone}>{s.phone}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: s.resolved ? '#dcfce7' : '#fee2e2' }]}>
                    <Text style={[styles.statusText, { color: s.resolved ? '#16a34a' : '#dc2626' }]}>
                      {s.resolved ? 'Resolved' : 'Active'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.requestedAt}>
                  {new Date(s.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </Text>
                {!s.resolved && (
                  <TouchableOpacity style={styles.approveBtn} onPress={() => handleResolveSOS(s.id)}>
                    <Text style={styles.approveText}>✓ Mark Resolved</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Announcement Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Post Announcement</Text>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Water shutdown Sunday"
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
            />
            <Text style={styles.label}>Message</Text>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Details of the announcement..."
              placeholderTextColor="#999"
              value={body}
              onChangeText={setBody}
              multiline
            />
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.rejectText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.approveBtn} onPress={handlePostAnnouncement} disabled={posting}>
                {posting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.approveText}>Post</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  header: { backgroundColor: '#4f46e5', padding: 24, paddingTop: 32 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#c7d2fe', marginTop: 4 },
  tabRow: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#4f46e5' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#888' },
  tabTextActive: { color: '#4f46e5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  emptyText: { fontSize: 14, color: '#888', marginTop: 4 },
  scroll: { flex: 1, padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1.5, borderColor: '#c7d2fe' },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#4f46e5' },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  userFlat: { fontSize: 13, color: '#555', marginTop: 2 },
  userPhone: { fontSize: 12, color: '#888', marginTop: 2 },
  requestedAt: { fontSize: 12, color: '#aaa', marginBottom: 12 },
  btnRow: { flexDirection: 'row', gap: 10 },
  rejectBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#fca5a5', backgroundColor: '#fee2e2', alignItems: 'center' },
  rejectText: { color: '#dc2626', fontWeight: '700', fontSize: 13 },
  approveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#4f46e5', alignItems: 'center' },
  approveText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  refreshBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, backgroundColor: '#eef2ff' },
  refreshText: { color: '#4f46e5', fontWeight: '600' },
  postBtn: { backgroundColor: '#4f46e5', margin: 16, padding: 14, borderRadius: 12, alignItems: 'center' },
  postBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 8 },
  input: { backgroundColor: '#f0f4ff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: '#1a1a2e', borderWidth: 1, borderColor: '#dde3f0', marginBottom: 16 },
});
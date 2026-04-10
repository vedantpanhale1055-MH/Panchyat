import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, TouchableOpacity, ActivityIndicator
} from 'react-native';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

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
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('approved', '==', false));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as User));
      setUsers(data);
    } catch (error: any) {
      alert('Error fetching users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (userId: string) => {
    setUpdating(userId);
    try {
      await updateDoc(doc(db, 'users', userId), { approved: true });
      setUsers(prev => prev.filter(u => u.id !== userId));
      alert('User approved successfully! ✅');
    } catch (error: any) {
      alert('Error approving user: ' + error.message);
    } finally {
      setUpdating(null);
    }
  };

  const handleReject = async (userId: string) => {
    setUpdating(userId);
    try {
      await updateDoc(doc(db, 'users', userId), { approved: false, rejected: true });
      setUsers(prev => prev.filter(u => u.id !== userId));
      alert('User rejected.');
    } catch (error: any) {
      alert('Error rejecting user: ' + error.message);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Panel</Text>
        <Text style={styles.subtitle}>Pending Approvals</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      ) : users.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>✅</Text>
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptyText}>No pending approval requests</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchUsers}>
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scroll}>
          <Text style={styles.count}>{users.length} pending request{users.length > 1 ? 's' : ''}</Text>
          {users.map(user => (
            <View key={user.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{user.name?.charAt(0)?.toUpperCase()}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userFlat}>Wing {user.wing} — Flat {user.flatNo}</Text>
                  <Text style={styles.userPhone}>{user.phone}</Text>
                </View>
              </View>

              <Text style={styles.requestedAt}>
                Requested: {new Date(user.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </Text>

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => handleReject(user.id)}
                  disabled={updating === user.id}
                >
                  {updating === user.id ? (
                    <ActivityIndicator color="#dc2626" size="small" />
                  ) : (
                    <Text style={styles.rejectText}>✕ Reject</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => handleApprove(user.id)}
                  disabled={updating === user.id}
                >
                  {updating === user.id ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.approveText}>✓ Approve</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.refreshBtn} onPress={fetchUsers}>
            <Text style={styles.refreshText}>↻ Refresh</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  header: {
    backgroundColor: '#4f46e5',
    padding: 24,
    paddingTop: 32,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#c7d2fe', marginTop: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: '#888', fontSize: 14 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e' },
  emptyText: { fontSize: 14, color: '#888', marginTop: 6 },
  scroll: { flex: 1, padding: 16 },
  count: { fontSize: 13, color: '#888', marginBottom: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#c7d2fe',
  },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#4f46e5' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  userFlat: { fontSize: 13, color: '#555', marginTop: 2 },
  userPhone: { fontSize: 12, color: '#888', marginTop: 2 },
  requestedAt: { fontSize: 12, color: '#aaa', marginBottom: 14 },
  btnRow: { flexDirection: 'row', gap: 10 },
  rejectBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    backgroundColor: '#fee2e2',
    alignItems: 'center',
  },
  rejectText: { color: '#dc2626', fontWeight: '700', fontSize: 14 },
  approveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
  },
  approveText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  refreshBtn: {
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 32,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
  },
  refreshText: { color: '#4f46e5', fontWeight: '600', fontSize: 14 },
});
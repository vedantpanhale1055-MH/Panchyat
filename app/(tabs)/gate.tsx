import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, Modal, ActivityIndicator
} from 'react-native';
import { db, auth } from '../../firebase';
import {
  collection, addDoc, onSnapshot, query,
  orderBy, doc, updateDoc, getDoc
} from 'firebase/firestore';

type Visitor = {
  id: string;
  visitorName: string;
  visitorPhone: string;
  purpose: string;
  flatNo: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: string;
  requestedBy: string;
};

export default function GateScreen() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userFlat, setUserFlat] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [activeTab, setActiveTab] = useState<'incoming' | 'preapprove'>('incoming');

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (uid) {
      getDoc(doc(db, 'users', uid)).then(snap => {
        if (snap.exists()) setUserFlat(snap.data().flatNo || '');
      });
    }

    const q = query(
      collection(db, 'societies', 'society_001', 'visitors'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setVisitors(snap.docs.map(d => ({ id: d.id, ...d.data() } as Visitor)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleAddVisitor = async () => {
    if (!visitorName || !visitorPhone || !purpose) {
      alert('Please fill all fields');
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'societies', 'society_001', 'visitors'), {
        visitorName,
        visitorPhone,
        purpose,
        flatNo: userFlat,
        status: 'approved',
        createdAt: new Date().toISOString(),
        requestedBy: auth.currentUser?.uid,
      });
      setVisitorName('');
      setVisitorPhone('');
      setPurpose('');
      setShowModal(false);
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'approved' | 'denied') => {
    await updateDoc(doc(db, 'societies', 'society_001', 'visitors', id), { status });
  };

  const statusStyle = (s: string) => {
    if (s === 'approved') return { bg: '#dcfce7', text: '#16a34a' };
    if (s === 'denied') return { bg: '#fee2e2', text: '#dc2626' };
    return { bg: '#fef3c7', text: '#d97706' };
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gate</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Text style={styles.addBtnText}>+ Log Visitor</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['incoming', 'preapprove'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
              {t === 'incoming' ? '🚶 Visitor Log' : '✅ Pre-Approvals'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : visitors.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🚪</Text>
          <Text style={styles.emptyTitle}>No visitors yet</Text>
          <Text style={styles.emptyText}>Log a visitor using the button above</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {visitors.map(item => {
            const sc = statusStyle(item.status);
            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.visitorAvatar}>
                    <Text style={styles.visitorAvatarText}>
                      {item.visitorName?.charAt(0)?.toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.visitorName}>{item.visitorName}</Text>
                    <Text style={styles.visitorPhone}>{item.visitorPhone}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.statusText, { color: sc.text }]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.purpose}>📋 {item.purpose}</Text>
                <Text style={styles.flatInfo}>Flat: {item.flatNo}</Text>
                <Text style={styles.dateText}>
                  {new Date(item.createdAt).toLocaleString('en-IN', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </Text>
                {item.status === 'pending' && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.denyBtn}
                      onPress={() => handleUpdateStatus(item.id, 'denied')}
                    >
                      <Text style={styles.denyText}>✕ Deny</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={() => handleUpdateStatus(item.id, 'approved')}
                    >
                      <Text style={styles.approveTxt}>✓ Approve</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Add Visitor Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Log a Visitor</Text>
            <Text style={styles.label}>Visitor Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Ravi Kumar"
              placeholderTextColor="#999"
              value={visitorName}
              onChangeText={setVisitorName}
            />
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 9876543210"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              value={visitorPhone}
              onChangeText={setVisitorPhone}
            />
            <Text style={styles.label}>Purpose of Visit</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Delivery, Guest, Plumber"
              placeholderTextColor="#999"
              value={purpose}
              onChangeText={setPurpose}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleAddVisitor} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Log Entry</Text>}
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
  header: {
    backgroundColor: '#fff', padding: 20,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e' },
  addBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  tabRow: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  tab: {
    flex: 1, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#dde3f0', alignItems: 'center',
  },
  tabActive: { backgroundColor: '#eef2ff', borderColor: '#4f46e5' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#888' },
  tabTextActive: { color: '#4f46e5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  emptyText: { fontSize: 14, color: '#888', marginTop: 4 },
  scroll: { flex: 1, padding: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  visitorAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  visitorAvatarText: { fontSize: 18, fontWeight: 'bold', color: '#4f46e5' },
  visitorName: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  visitorPhone: { fontSize: 13, color: '#888', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: '700' },
  purpose: { fontSize: 13, color: '#555', marginBottom: 4 },
  flatInfo: { fontSize: 12, color: '#aaa' },
  dateText: { fontSize: 11, color: '#bbb', marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  denyBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#fca5a5', alignItems: 'center',
  },
  denyText: { color: '#dc2626', fontWeight: '600' },
  approveBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#4f46e5', alignItems: 'center',
  },
  approveTxt: { color: '#fff', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 24, paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 8 },
  input: {
    backgroundColor: '#f0f4ff', borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 12, fontSize: 14, color: '#1a1a2e',
    borderWidth: 1, borderColor: '#dde3f0', marginBottom: 16,
  },
  modalBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#dde3f0', alignItems: 'center',
  },
  cancelText: { fontWeight: '600', color: '#888' },
  submitBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#4f46e5', alignItems: 'center' },
  submitText: { fontWeight: '700', color: '#fff' },
});
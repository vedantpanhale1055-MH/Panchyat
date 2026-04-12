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
import { useTheme } from '../../context/ThemeContext';

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
  const { theme, toggleTheme, colors } = useTheme();
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
        visitorName, visitorPhone, purpose,
        flatNo: userFlat, status: 'approved',
        createdAt: new Date().toISOString(),
        requestedBy: auth.currentUser?.uid,
      });
      setVisitorName(''); setVisitorPhone(''); setPurpose('');
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
    if (s === 'approved') return { bg: colors.success + '25', text: colors.success };
    if (s === 'denied') return { bg: colors.danger + '25', text: colors.danger };
    return { bg: colors.warning + '25', text: colors.warning };
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Gate</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={toggleTheme}
            style={[styles.themeBtn, { backgroundColor: colors.bg, borderColor: colors.border }]}
          >
            <Text style={styles.themeIcon}>{theme === 'dark' ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowModal(true)}
          >
            <Text style={styles.addBtnText}>+ Log Visitor</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabRow, { backgroundColor: colors.header, borderBottomColor: colors.border }]}>
        {(['incoming', 'preapprove'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[
              styles.tab,
              { borderColor: colors.border },
              activeTab === t && { backgroundColor: colors.primary + '15', borderColor: colors.primary },
            ]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, { color: activeTab === t ? colors.primary : colors.subtext }]}>
              {t === 'incoming' ? '🚶 Visitor Log' : '✅ Pre-Approvals'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : visitors.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🚪</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No visitors yet</Text>
          <Text style={[styles.emptyText, { color: colors.subtext }]}>Log a visitor using the button above</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {visitors.map(item => {
            const sc = statusStyle(item.status);
            return (
              <View key={item.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardTop}>
                  <View style={[styles.visitorAvatar, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.visitorAvatarText, { color: colors.primary }]}>
                      {item.visitorName?.charAt(0)?.toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.visitorName, { color: colors.text }]}>{item.visitorName}</Text>
                    <Text style={[styles.visitorPhone, { color: colors.subtext }]}>{item.visitorPhone}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.statusText, { color: sc.text }]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.purpose, { color: colors.subtext }]}>📋 {item.purpose}</Text>
                <Text style={[styles.flatInfo, { color: colors.muted }]}>Flat: {item.flatNo}</Text>
                <Text style={[styles.dateText, { color: colors.muted }]}>
                  {new Date(item.createdAt).toLocaleString('en-IN', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </Text>
                {item.status === 'pending' && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.denyBtn, { borderColor: colors.danger }]}
                      onPress={() => handleUpdateStatus(item.id, 'denied')}
                    >
                      <Text style={[styles.denyText, { color: colors.danger }]}>✕ Deny</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.approveBtn, { backgroundColor: colors.primary }]}
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
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Log a Visitor</Text>

            <Text style={[styles.label, { color: colors.subtext }]}>Visitor Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g. Ravi Kumar" placeholderTextColor={colors.muted}
              value={visitorName} onChangeText={setVisitorName}
            />

            <Text style={[styles.label, { color: colors.subtext }]}>Phone Number</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g. 9876543210" placeholderTextColor={colors.muted}
              keyboardType="phone-pad" value={visitorPhone} onChangeText={setVisitorPhone}
            />

            <Text style={[styles.label, { color: colors.subtext }]}>Purpose of Visit</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g. Delivery, Guest, Plumber" placeholderTextColor={colors.muted}
              value={purpose} onChangeText={setPurpose}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => setShowModal(false)}
              >
                <Text style={[styles.cancelText, { color: colors.subtext }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                onPress={handleAddVisitor} disabled={submitting}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.submitText}>Log Entry</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  themeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  themeIcon: { fontSize: 16 },
  addBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8, borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, alignItems: 'center' },
  tabText: { fontSize: 13, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold' },
  emptyText: { fontSize: 14, marginTop: 4 },
  scroll: { flex: 1, padding: 16 },
  card: { borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  visitorAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  visitorAvatarText: { fontSize: 18, fontWeight: 'bold' },
  visitorName: { fontSize: 15, fontWeight: '700' },
  visitorPhone: { fontSize: 13, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: '700' },
  purpose: { fontSize: 13, marginBottom: 4 },
  flatInfo: { fontSize: 12 },
  dateText: { fontSize: 11, marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  denyBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, alignItems: 'center' },
  denyText: { fontWeight: '600' },
  approveBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  approveTxt: { color: '#fff', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, borderWidth: 1, marginBottom: 16 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  cancelText: { fontWeight: '600' },
  submitBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  submitText: { fontWeight: '700', color: '#fff' },
});
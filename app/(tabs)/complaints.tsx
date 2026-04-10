import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator, Modal
} from 'react-native';
import { db, auth } from '../../firebase';
import {
  collection, addDoc, onSnapshot, query,
  orderBy, updateDoc, doc, increment
} from 'firebase/firestore';

type Complaint = {
  id: string;
  title: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  urgency: 'Low' | 'Medium' | 'High';
  upvotes: number;
  userName: string;
  flatNo: string;
  createdAt: string;
};

export default function ComplaintsScreen() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'societies', 'society_001', 'complaints'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Complaint));
      setComplaints(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleSubmit = async () => {
    if (!title || !description) {
      alert('Please fill title and description');
      return;
    }
    setSubmitting(true);
    try {
      const user = auth.currentUser;
      await addDoc(collection(db, 'societies', 'society_001', 'complaints'), {
        title,
        description,
        urgency,
        status: 'Pending',
        upvotes: 0,
        userId: user?.uid,
        userName: 'Vedant',
        flatNo: '103',
        createdAt: new Date().toISOString(),
      });
      setTitle('');
      setDescription('');
      setUrgency('Medium');
      setShowModal(false);
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (id: string) => {
    await updateDoc(doc(db, 'societies', 'society_001', 'complaints', id), {
      upvotes: increment(1)
    });
  };

  const urgencyColor = (u: string) => {
    if (u === 'High') return { bg: '#fee2e2', text: '#dc2626' };
    if (u === 'Medium') return { bg: '#fef3c7', text: '#d97706' };
    return { bg: '#dcfce7', text: '#16a34a' };
  };

  const statusColor = (s: string) => {
    if (s === 'Resolved') return { bg: '#dcfce7', text: '#16a34a' };
    if (s === 'In Progress') return { bg: '#fef3c7', text: '#d97706' };
    return { bg: '#f1f5f9', text: '#64748b' };
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Complaints</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : complaints.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🛠</Text>
          <Text style={styles.emptyTitle}>No complaints yet</Text>
          <Text style={styles.emptyText}>Tap "+ New" to raise one</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {complaints.map(item => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={[styles.badge, { backgroundColor: urgencyColor(item.urgency).bg }]}>
                  <Text style={[styles.badgeText, { color: urgencyColor(item.urgency).text }]}>
                    {item.urgency}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: statusColor(item.status).bg }]}>
                  <Text style={[styles.badgeText, { color: statusColor(item.status).text }]}>
                    {item.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc}>{item.description}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardMeta}>{item.userName} • Flat {item.flatNo}</Text>
                <TouchableOpacity style={styles.upvoteBtn} onPress={() => handleUpvote(item.id)}>
                  <Text style={styles.upvoteText}>👍 {item.upvotes}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* New Complaint Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Raise a Complaint</Text>

            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Water leakage in B wing"
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the issue in detail..."
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.label}>Urgency</Text>
            <View style={styles.urgencyRow}>
              {(['Low', 'Medium', 'High'] as const).map(u => (
                <TouchableOpacity
                  key={u}
                  style={[styles.urgencyBtn, urgency === u && { backgroundColor: urgencyColor(u).bg, borderColor: urgencyColor(u).text }]}
                  onPress={() => setUrgency(u)}
                >
                  <Text style={[styles.urgencyText, urgency === u && { color: urgencyColor(u).text }]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit</Text>}
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
  header: { backgroundColor: '#fff', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e' },
  addBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  emptyText: { fontSize: 14, color: '#888', marginTop: 4 },
  scroll: { flex: 1, padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardMeta: { fontSize: 12, color: '#aaa' },
  upvoteBtn: { backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  upvoteText: { fontSize: 13, fontWeight: '600', color: '#4f46e5' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 8 },
  input: { backgroundColor: '#f0f4ff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: '#1a1a2e', borderWidth: 1, borderColor: '#dde3f0', marginBottom: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  urgencyRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  urgencyBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#dde3f0', alignItems: 'center' },
  urgencyText: { fontWeight: '600', fontSize: 13, color: '#888' },
  modalBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#dde3f0', alignItems: 'center' },
  cancelText: { fontWeight: '600', color: '#888' },
  submitBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#4f46e5', alignItems: 'center' },
  submitText: { fontWeight: '700', color: '#fff' },
});
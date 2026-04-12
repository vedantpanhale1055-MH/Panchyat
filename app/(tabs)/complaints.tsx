import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator, Modal, Platform
} from 'react-native';
import { db, auth } from '../../firebase';
import {
  collection, addDoc, onSnapshot, query, orderBy,
  deleteDoc, doc, updateDoc, arrayUnion, arrayRemove
} from 'firebase/firestore';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';

const SOCIETY_ID = 'society_001';
const URGENCY_LEVELS = ['Low', 'Medium', 'High'];

// Works on both web (window.confirm) and mobile (Alert)
const confirmDelete = (message: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') {
    if (window.confirm(message)) onConfirm();
  } else {
    const { Alert } = require('react-native');
    Alert.alert('Delete', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onConfirm },
    ]);
  }
};

export default function ComplaintsScreen() {
  const { user } = useUser();
  const { colors } = useTheme();
  const router = useRouter();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('Medium');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'societies', SOCIETY_ID, 'complaints'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
      setComplaints(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return alert('Fill in all fields.');
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'societies', SOCIETY_ID, 'complaints'), {
        title: title.trim(),
        description: description.trim(),
        urgency,
        status: 'Pending',
        userId: auth.currentUser?.uid,
        userName: user?.name,
        flatNo: user?.flatNo,
        wing: user?.wing,
        upvotedBy: [],
        downvotedBy: [],
        createdAt: new Date().toISOString(),
      });
      setTitle(''); setDescription(''); setUrgency('Medium'); setShowForm(false);
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (item: any, type: 'up' | 'down') => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const upvotedBy: string[] = item.upvotedBy || [];
    const downvotedBy: string[] = item.downvotedBy || [];
    const ref = doc(db, 'societies', SOCIETY_ID, 'complaints', item.id);
    if (type === 'up') {
      if (upvotedBy.includes(uid)) {
        await updateDoc(ref, { upvotedBy: arrayRemove(uid) });
      } else {
        await updateDoc(ref, { upvotedBy: arrayUnion(uid), downvotedBy: arrayRemove(uid) });
      }
    } else {
      if (downvotedBy.includes(uid)) {
        await updateDoc(ref, { downvotedBy: arrayRemove(uid) });
      } else {
        await updateDoc(ref, { downvotedBy: arrayUnion(uid), upvotedBy: arrayRemove(uid) });
      }
    }
  };

  const handleDelete = (id: string, ownerId: string) => {
    const isOwner = auth.currentUser?.uid === ownerId;
    const isAdmin = user?.role === 'admin';
    if (!isOwner && !isAdmin) return;
    confirmDelete('Delete this complaint? This cannot be undone.', async () => {
      try {
        await deleteDoc(doc(db, 'societies', SOCIETY_ID, 'complaints', id));
      } catch (e: any) {
        alert('Delete failed: ' + e.message);
      }
    });
  };

  const urgencyColor = (u: string) => {
    if (u === 'High') return colors.danger;
    if (u === 'Medium') return colors.warning;
    return colors.success;
  };

  const statusColor = (s: string) => {
    if (s === 'Resolved') return colors.success;
    if (s === 'In Progress') return colors.warning;
    return colors.primary;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Complaints</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowForm(true)}
        >
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* New Complaint Modal */}
      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>File a Complaint</Text>

            <Text style={[styles.label, { color: colors.subtext }]}>Title</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
              placeholder="Short title" placeholderTextColor={colors.muted}
              value={title} onChangeText={setTitle}
            />

            <Text style={[styles.label, { color: colors.subtext }]}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
              placeholder="Describe the issue..." placeholderTextColor={colors.muted}
              value={description} onChangeText={setDescription}
              multiline numberOfLines={4}
            />

            <Text style={[styles.label, { color: colors.subtext }]}>Urgency</Text>
            <View style={styles.urgencyRow}>
              {URGENCY_LEVELS.map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[
                    styles.urgencyBtn,
                    {
                      borderColor: urgency === u ? urgencyColor(u) : colors.border,
                      backgroundColor: urgency === u ? urgencyColor(u) + '20' : 'transparent',
                    },
                  ]}
                  onPress={() => setUrgency(u)}
                >
                  <Text style={[styles.urgencyText, { color: urgency === u ? urgencyColor(u) : colors.subtext }]}>
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => setShowForm(false)}
              >
                <Text style={[styles.cancelText, { color: colors.subtext }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                onPress={handleSubmit} disabled={submitting}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.submitText}>Submit</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* List */}
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {complaints.length === 0 && (
            <Text style={[styles.emptyText, { color: colors.subtext }]}>No complaints filed yet.</Text>
          )}
          {complaints.map((item) => {
            const uid = auth.currentUser?.uid;
            const isOwner = uid === item.userId;
            const isAdmin = user?.role === 'admin';
            const canDelete = isOwner || isAdmin;
            const upvotedBy: string[] = item.upvotedBy || [];
            const downvotedBy: string[] = item.downvotedBy || [];
            const hasUpvoted = uid ? upvotedBy.includes(uid) : false;
            const hasDownvoted = uid ? downvotedBy.includes(uid) : false;

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() =>
                  router.push({
                    pathname: '/complaint-detail' as any,
                    params: {
                      id: item.id,
                      title: item.title,
                      description: item.description,
                      urgency: item.urgency,
                      status: item.status,
                      userName: item.userName,
                      flatNo: item.flatNo,
                    },
                  })
                }
                activeOpacity={0.85}
              >
                <View style={[styles.urgencyStrip, { backgroundColor: urgencyColor(item.urgency) }]} />
                <View style={styles.cardContent}>
                  <View style={styles.cardTop}>
                    <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.statusTag, { color: statusColor(item.status) }]}>
                      {item.status}
                    </Text>
                  </View>
                  <Text style={[styles.cardDesc, { color: colors.subtext }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <View style={styles.cardFooter}>
                    <Text style={[styles.cardMeta, { color: colors.muted }]}>
                      {item.userName} • {item.wing}-{item.flatNo}
                    </Text>
                    <View style={styles.footerActions}>
                      {/* Upvote */}
                      <TouchableOpacity
                        style={[
                          styles.voteBtn,
                          { borderColor: hasUpvoted ? colors.success : colors.border },
                          hasUpvoted && { backgroundColor: colors.success + '18' },
                        ]}
                        onPress={() => handleVote(item, 'up')}
                      >
                        <Text style={[styles.voteArrow, { color: hasUpvoted ? colors.success : colors.muted }]}>▲</Text>
                        <Text style={[styles.voteCount, { color: hasUpvoted ? colors.success : colors.subtext }]}>
                          {upvotedBy.length}
                        </Text>
                      </TouchableOpacity>

                      {/* Downvote */}
                      <TouchableOpacity
                        style={[
                          styles.voteBtn,
                          { borderColor: hasDownvoted ? colors.danger : colors.border },
                          hasDownvoted && { backgroundColor: colors.danger + '18' },
                        ]}
                        onPress={() => handleVote(item, 'down')}
                      >
                        <Text style={[styles.voteArrow, { color: hasDownvoted ? colors.danger : colors.muted }]}>▼</Text>
                        <Text style={[styles.voteCount, { color: hasDownvoted ? colors.danger : colors.subtext }]}>
                          {downvotedBy.length}
                        </Text>
                      </TouchableOpacity>

                      {/* Delete */}
                      {canDelete && (
                        <TouchableOpacity
                          onPress={() => handleDelete(item.id, item.userId)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Text style={[styles.deleteText, { color: colors.danger }]}>🗑</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  addBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    borderRadius: 14, marginBottom: 12, borderWidth: 1,
    overflow: 'hidden', flexDirection: 'row', elevation: 1,
  },
  urgencyStrip: { width: 5 },
  cardContent: { flex: 1, padding: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 15, fontWeight: '700', flex: 1, marginRight: 8 },
  statusTag: { fontSize: 11, fontWeight: '700' },
  cardDesc: { fontSize: 13, lineHeight: 19, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardMeta: { fontSize: 11, flex: 1 },
  footerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  voteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1,
  },
  voteArrow: { fontSize: 11, fontWeight: '700' },
  voteCount: { fontSize: 12, fontWeight: '600' },
  deleteText: { fontSize: 16, paddingLeft: 4 },
  emptyText: { textAlign: 'center', marginTop: 60, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 10 },
  input: { borderRadius: 12, padding: 12, fontSize: 14, borderWidth: 1 },
  textArea: { height: 100, textAlignVertical: 'top' },
  urgencyRow: { flexDirection: 'row', gap: 8 },
  urgencyBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, alignItems: 'center' },
  urgencyText: { fontSize: 13, fontWeight: '600' },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  cancelText: { fontWeight: '600' },
  submitBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '700' },
});
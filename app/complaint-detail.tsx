import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TextInput, TouchableOpacity, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db, auth } from '../firebase';
import {
  collection, addDoc, onSnapshot, query, orderBy,
  doc, updateDoc, deleteDoc
} from 'firebase/firestore';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';

const SOCIETY_ID = 'society_001';
const STATUS_OPTIONS = ['Pending', 'In Progress', 'Resolved'] as const;

export default function ComplaintDetail() {
  const params = useLocalSearchParams<any>();
  const { id, title, description, urgency, userName, flatNo } = params;
  const { user } = useUser();
  const { colors } = useTheme();
  const router = useRouter();

  const [status, setStatus] = useState(params.status || 'Pending');
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!id) return;
    const q = query(
      collection(db, 'societies', SOCIETY_ID, 'complaints', id, 'comments'),
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [id]);

  const handleStatusChange = async (s: string) => {
    try {
      setStatus(s);
      await updateDoc(doc(db, 'societies', SOCIETY_ID, 'complaints', id), { status: s });
    } catch (e: any) {
      alert('Failed to update status: ' + e.message);
    }
  };

  const handleAddComment = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await addDoc(
        collection(db, 'societies', SOCIETY_ID, 'complaints', id, 'comments'),
        {
          text: text.trim(),
          userId: auth.currentUser?.uid,
          userName: user?.name,
          flatNo: user?.flatNo,
          wing: user?.wing,
          createdAt: new Date().toISOString(),
        }
      );
      setText('');
    } catch (e: any) {
      alert('Failed to send: ' + e.message);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteComment = (commentId: string, commentUserId: string) => {
    const isOwner = auth.currentUser?.uid === commentUserId;
    const isAdmin = user?.role === 'admin';
    if (!isOwner && !isAdmin) return;

    Alert.alert('Delete Comment', 'Remove this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(
              doc(db, 'societies', SOCIETY_ID, 'complaints', id, 'comments', commentId)
            );
          } catch (e: any) {
            alert('Failed: ' + e.message);
          }
        },
      },
    ]);
  };

  const urgencyColor = () => {
    if (urgency === 'High') return colors.danger;
    if (urgency === 'Medium') return colors.warning;
    return colors.success;
  };

  const statusColor = (s: string) => {
    if (s === 'Resolved') return colors.success;
    if (s === 'In Progress') return colors.warning;
    return colors.primary;
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.back, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Complaint Detail</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll}>

          {/* Complaint Card */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Urgency strip */}
            <View style={[styles.urgencyStrip, { backgroundColor: urgencyColor() }]} />
            <View style={styles.cardInner}>
              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              <Text style={[styles.meta, { color: colors.subtext }]}>
                {userName} • Flat {flatNo} • {urgency} urgency
              </Text>
              <Text style={[styles.description, { color: colors.text }]}>{description}</Text>

              {/* Status — Admin can change, residents just see */}
              {user?.role === 'admin' ? (
                <View style={styles.statusSection}>
                  <Text style={[styles.statusLabel, { color: colors.subtext }]}>Change Status:</Text>
                  <View style={styles.statusRow}>
                    {STATUS_OPTIONS.map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[
                          styles.statusBtn,
                          { borderColor: colors.border },
                          status === s && { backgroundColor: statusColor(s) + '20', borderColor: statusColor(s) },
                        ]}
                        onPress={() => handleStatusChange(s)}
                      >
                        <Text style={[styles.statusBtnText, { color: status === s ? statusColor(s) : colors.muted }]}>
                          {s}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : (
                <View style={[styles.statusPill, { backgroundColor: statusColor(status) + '20' }]}>
                  <Text style={[styles.statusPillText, { color: statusColor(status) }]}>
                    {status}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Comments */}
          <Text style={[styles.commentsHeading, { color: colors.text }]}>
            Comments ({comments.length})
          </Text>

          {comments.length === 0 && (
            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              No comments yet. Be the first to comment.
            </Text>
          )}

          {comments.map((c) => {
            const isMine = auth.currentUser?.uid === c.userId;
            const canDelete = isMine || user?.role === 'admin';
            return (
              <View
                key={c.id}
                style={[styles.comment, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.commentTop}>
                  <Text style={[styles.commentUser, { color: colors.primary }]}>
                    {c.userName} • {c.wing}-{c.flatNo}
                  </Text>
                  <View style={styles.commentTopRight}>
                    <Text style={[styles.commentTime, { color: colors.muted }]}>
                      {formatTime(c.createdAt)}
                    </Text>
                    {canDelete && (
                      <TouchableOpacity
                        onPress={() => handleDeleteComment(c.id, c.userId)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Text style={styles.commentDelete}>🗑</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <Text style={[styles.commentText, { color: colors.text }]}>{c.text}</Text>
              </View>
            );
          })}

        </ScrollView>

        {/* Input */}
        <View style={[styles.inputRow, { backgroundColor: colors.header, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
            placeholder="Add a comment..."
            placeholderTextColor={colors.muted}
            value={text}
            onChangeText={setText}
            onSubmitEditing={handleAddComment}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: text.trim() ? colors.primary : colors.muted }]}
            onPress={handleAddComment}
            disabled={sending || !text.trim()}
          >
            {sending
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.sendIcon}>➤</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  back: { fontWeight: '600', fontSize: 15, width: 60 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 20 },
  card: {
    borderRadius: 16, marginBottom: 20, borderWidth: 1,
    overflow: 'hidden', flexDirection: 'row', elevation: 2,
  },
  urgencyStrip: { width: 6 },
  cardInner: { flex: 1, padding: 14 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  meta: { fontSize: 12, marginBottom: 10 },
  description: { fontSize: 14, lineHeight: 22, marginBottom: 14 },
  statusSection: { marginTop: 4 },
  statusLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 10,
    borderWidth: 1.5, alignItems: 'center',
  },
  statusBtnText: { fontSize: 12, fontWeight: '600' },
  statusPill: {
    alignSelf: 'flex-start', paddingHorizontal: 14,
    paddingVertical: 6, borderRadius: 20,
  },
  statusPillText: { fontSize: 13, fontWeight: '700' },
  commentsHeading: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  emptyText: { textAlign: 'center', fontSize: 13, marginVertical: 20 },
  comment: {
    borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1,
  },
  commentTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  commentTopRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentUser: { fontSize: 12, fontWeight: '700' },
  commentTime: { fontSize: 11 },
  commentDelete: { fontSize: 16 },
  commentText: { fontSize: 14, lineHeight: 20 },
  inputRow: {
    flexDirection: 'row', padding: 10, gap: 8, borderTopWidth: 1,
  },
  input: {
    flex: 1, borderRadius: 22, paddingHorizontal: 16,
    paddingVertical: 10, fontSize: 14, borderWidth: 1,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  sendIcon: { color: '#fff', fontSize: 16 },
});
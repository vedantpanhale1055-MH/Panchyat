import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { db } from '../firebase';
import {
  collection, addDoc, onSnapshot, query, orderBy,
  deleteDoc, doc, updateDoc
} from 'firebase/firestore';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';

const SOCIETY_ID = 'society_001';
type AdminTab = 'announce' | 'residents' | 'complaints';

const confirmAction = (message: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') {
    if (window.confirm(message)) onConfirm();
  } else {
    const { Alert } = require('react-native');
    Alert.alert('Confirm', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'OK', style: 'destructive', onPress: onConfirm },
    ]);
  }
};

export default function AdminScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { colors } = useTheme();
  const [tab, setTab] = useState<AdminTab>('announce');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [residents, setResidents] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);

  useEffect(() => {
    const annUnsub = onSnapshot(
      query(collection(db, 'societies', SOCIETY_ID, 'announcements'), orderBy('createdAt', 'desc')),
      (snap) => setAnnouncements(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const resUnsub = onSnapshot(
      collection(db, 'users'),
      (snap) => setResidents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const compUnsub = onSnapshot(
      query(collection(db, 'societies', SOCIETY_ID, 'complaints'), orderBy('createdAt', 'desc')),
      (snap) => setComplaints(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => { annUnsub(); resUnsub(); compUnsub(); };
  }, []);

  const handlePostAnnouncement = async () => {
    if (!annTitle.trim() || !annBody.trim()) return alert('Fill in both fields.');
    setPosting(true);
    try {
      await addDoc(collection(db, 'societies', SOCIETY_ID, 'announcements'), {
        title: annTitle.trim(), body: annBody.trim(),
        postedBy: user?.name, createdAt: new Date().toISOString(),
      });
      setAnnTitle(''); setAnnBody('');
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteAnnouncement = (id: string) => {
    confirmAction('Delete this announcement for all residents?', async () => {
      try { await deleteDoc(doc(db, 'societies', SOCIETY_ID, 'announcements', id)); }
      catch (e: any) { alert('Failed: ' + e.message); }
    });
  };

  const handleApproveResident = async (uid: string) => {
    try { await updateDoc(doc(db, 'users', uid), { approved: true }); }
    catch (e: any) { alert('Error: ' + e.message); }
  };

  const handleRejectResident = (uid: string) => {
    confirmAction('Remove this resident?', async () => {
      try { await deleteDoc(doc(db, 'users', uid)); }
      catch (e: any) { alert('Failed: ' + e.message); }
    });
  };

  const handleDeleteComplaint = (id: string) => {
    confirmAction('Delete this complaint permanently?', async () => {
      try { await deleteDoc(doc(db, 'societies', SOCIETY_ID, 'complaints', id)); }
      catch (e: any) { alert('Failed: ' + e.message); }
    });
  };

  const handleStatusChange = async (id: string, status: string) => {
    try { await updateDoc(doc(db, 'societies', SOCIETY_ID, 'complaints', id), { status }); }
    catch (e: any) { alert('Failed: ' + e.message); }
  };

  const TABS: { key: AdminTab; label: string }[] = [
    { key: 'announce', label: '📢 Announce' },
    { key: 'residents', label: '👥 Residents' },
    { key: 'complaints', label: '🔧 Complaints' },
  ];

  const statusColor = (s: string) => {
    if (s === 'Resolved') return colors.success;
    if (s === 'In Progress') return colors.warning;
    return colors.primary;
  };

  const pending = residents.filter((r) => !r.approved);
  const approved = residents.filter((r) => r.approved);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.back, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Admin Panel</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, tab === t.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabLabel, { color: tab === t.key ? colors.primary : colors.subtext }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {tab === 'announce' && (
          <View>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardHeading, { color: colors.text }]}>New Announcement</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
                placeholder="Title" placeholderTextColor={colors.muted}
                value={annTitle} onChangeText={setAnnTitle}
              />
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
                placeholder="Message body..." placeholderTextColor={colors.muted}
                value={annBody} onChangeText={setAnnBody}
                multiline numberOfLines={3}
              />
              <TouchableOpacity
                style={[styles.postBtn, { backgroundColor: colors.primary }]}
                onPress={handlePostAnnouncement} disabled={posting}
              >
                {posting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.postBtnText}>Post Announcement</Text>}
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              Past Announcements ({announcements.length})
            </Text>
            {announcements.length === 0 && (
              <Text style={[styles.emptyText, { color: colors.subtext }]}>No announcements yet.</Text>
            )}
            {announcements.map((a) => (
              <View key={a.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.rowBetween}>
                  <Text style={[styles.annTitle, { color: colors.text }]}>{a.title}</Text>
                  <TouchableOpacity onPress={() => handleDeleteAnnouncement(a.id)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <Text style={styles.deleteIcon}>🗑</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.annBody, { color: colors.subtext }]}>{a.body}</Text>
                <Text style={[styles.annMeta, { color: colors.muted }]}>By {a.postedBy}</Text>
              </View>
            ))}
          </View>
        )}

        {tab === 'residents' && (
          <View>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>Pending ({pending.length})</Text>
            {pending.length === 0 && <Text style={[styles.emptyText, { color: colors.subtext }]}>No pending residents ✅</Text>}
            {pending.map((r) => (
              <View key={r.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.residentName, { color: colors.text }]}>{r.name}</Text>
                <Text style={[styles.residentMeta, { color: colors.subtext }]}>{r.wing}-{r.flatNo} • {r.phone}</Text>
                <View style={styles.residentBtns}>
                  <TouchableOpacity
                    style={[styles.approveBtn, { backgroundColor: colors.success + '20', borderColor: colors.success }]}
                    onPress={() => handleApproveResident(r.id)}
                  >
                    <Text style={[styles.approveTxt, { color: colors.success }]}>✓ Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rejectBtn, { backgroundColor: colors.dangerBg, borderColor: colors.danger }]}
                    onPress={() => handleRejectResident(r.id)}
                  >
                    <Text style={[styles.rejectTxt, { color: colors.danger }]}>✕ Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <Text style={[styles.sectionHeading, { color: colors.text }]}>All Residents ({approved.length})</Text>
            {approved.map((r) => (
              <View key={r.id} style={[styles.card, styles.residentRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.residentDot, { backgroundColor: colors.primary }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.residentName, { color: colors.text }]}>{r.name}</Text>
                  <Text style={[styles.residentMeta, { color: colors.subtext }]}>{r.wing}-{r.flatNo} • {r.role}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {tab === 'complaints' && (
          <View>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>All Complaints ({complaints.length})</Text>
            {complaints.length === 0 && <Text style={[styles.emptyText, { color: colors.subtext }]}>No complaints yet.</Text>}
            {complaints.map((c) => (
              <View key={c.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.rowBetween}>
                  <Text style={[styles.annTitle, { color: colors.text }]} numberOfLines={1}>{c.title}</Text>
                  <TouchableOpacity onPress={() => handleDeleteComplaint(c.id)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <Text style={styles.deleteIcon}>🗑</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.residentMeta, { color: colors.subtext }]}>
                  {c.userName} • {c.wing}-{c.flatNo} • {c.urgency} urgency
                </Text>
                <View style={styles.statusRow}>
                  {['Pending', 'In Progress', 'Resolved'].map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.statusBtn, { borderColor: colors.border },
                        c.status === s && { backgroundColor: statusColor(s) + '20', borderColor: statusColor(s) },
                      ]}
                      onPress={() => handleStatusChange(c.id, s)}
                    >
                      <Text style={[styles.statusBtnText, { color: c.status === s ? statusColor(s) : colors.muted }]}>
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
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
  headerTitle: { fontSize: 18, fontWeight: '700' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabLabel: { fontSize: 13, fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 40 },
  sectionHeading: { fontSize: 15, fontWeight: '700', marginTop: 8, marginBottom: 10 },
  card: { borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1 },
  cardHeading: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  input: { borderRadius: 12, padding: 12, fontSize: 14, borderWidth: 1, marginBottom: 10 },
  textArea: { height: 90, textAlignVertical: 'top' },
  postBtn: { borderRadius: 12, padding: 14, alignItems: 'center' },
  postBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  annTitle: { fontSize: 14, fontWeight: '700', flex: 1, marginRight: 8 },
  annBody: { fontSize: 13, lineHeight: 19, marginBottom: 6 },
  annMeta: { fontSize: 11 },
  deleteIcon: { fontSize: 20, paddingLeft: 8 },
  emptyText: { textAlign: 'center', marginTop: 20, fontSize: 14 },
  residentName: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  residentMeta: { fontSize: 12 },
  residentBtns: { flexDirection: 'row', gap: 10, marginTop: 10 },
  approveBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  approveTxt: { fontWeight: '700', fontSize: 13 },
  rejectBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  rejectTxt: { fontWeight: '700', fontSize: 13 },
  residentRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  residentDot: { width: 8, height: 8, borderRadius: 4 },
  statusRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  statusBtn: { flex: 1, paddingVertical: 7, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  statusBtnText: { fontSize: 11, fontWeight: '600' },
});
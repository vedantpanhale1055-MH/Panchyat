import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator, Platform
} from 'react-native';
import { db } from '../../firebase';
import {
  collection, onSnapshot, query, orderBy,
  deleteDoc, doc, updateDoc, addDoc, where
} from 'firebase/firestore';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';

const SOCIETY_ID = 'society_001';

const confirmAction = (msg: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') { if (window.confirm(msg)) onConfirm(); }
  else {
    const { Alert } = require('react-native');
    Alert.alert('Confirm', msg, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'OK', style: 'destructive', onPress: onConfirm },
    ]);
  }
};

type DashTab = 'overview' | 'broadcast' | 'residents' | 'visitors';

export default function DashboardScreen() {
  const { user } = useUser();
  const { theme, toggleTheme, colors } = useTheme();
  const [tab, setTab] = useState<DashTab>('overview');

  // Stats
  const [residents, setResidents] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [visitors, setVisitors] = useState<any[]>([]);

  // Broadcast form
  const [bTitle, setBTitle] = useState('');
  const [bBody, setBBody] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'users'), s => setResidents(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u2 = onSnapshot(collection(db, 'societies', SOCIETY_ID, 'complaints'), s => setComplaints(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u3 = onSnapshot(query(collection(db, 'societies', SOCIETY_ID, 'announcements'), orderBy('createdAt', 'desc')), s => setAnnouncements(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u4 = onSnapshot(query(collection(db, 'societies', SOCIETY_ID, 'visitors'), orderBy('createdAt', 'desc')), s => setVisitors(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { u1(); u2(); u3(); u4(); };
  }, []);

  const stats = [
    { label: 'Total Residents', value: residents.filter(r => r.approved).length, emoji: '👥', color: colors.primary },
    { label: 'Pending Approvals', value: residents.filter(r => !r.approved).length, emoji: '⏳', color: colors.warning },
    { label: 'Open Complaints', value: complaints.filter(c => c.status !== 'Resolved').length, emoji: '🔧', color: colors.danger },
    { label: 'Resolved', value: complaints.filter(c => c.status === 'Resolved').length, emoji: '✅', color: colors.success },
  ];

  const handleBroadcast = async () => {
    if (!bTitle.trim() || !bBody.trim()) return alert('Fill in both fields.');
    setPosting(true);
    try {
      await addDoc(collection(db, 'societies', SOCIETY_ID, 'announcements'), {
        title: bTitle.trim(), body: bBody.trim(),
        postedBy: user?.name,
        emergency: isEmergency,
        pinned: isEmergency,
        createdAt: new Date().toISOString(),
      });
      setBTitle(''); setBBody(''); setIsEmergency(false);
      alert(isEmergency ? '🚨 Emergency alert posted!' : '✅ Announcement posted!');
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setPosting(false); }
  };

  const handlePinToggle = async (id: string, pinned: boolean) => {
    try { await updateDoc(doc(db, 'societies', SOCIETY_ID, 'announcements', id), { pinned: !pinned }); }
    catch (e: any) { alert('Failed: ' + e.message); }
  };

  const handleDeleteAnnouncement = (id: string) => {
    confirmAction('Delete this announcement?', async () => {
      try { await deleteDoc(doc(db, 'societies', SOCIETY_ID, 'announcements', id)); }
      catch (e: any) { alert('Failed: ' + e.message); }
    });
  };

  const handleApprove = async (uid: string) => {
    try { await updateDoc(doc(db, 'users', uid), { approved: true }); }
    catch (e: any) { alert('Error: ' + e.message); }
  };

  const handleReject = (uid: string) => {
    confirmAction('Remove this resident?', async () => {
      try { await deleteDoc(doc(db, 'users', uid)); }
      catch (e: any) { alert('Failed: ' + e.message); }
    });
  };

  const handleDeleteVisitor = (id: string) => {
    confirmAction('Remove this visitor entry?', async () => {
      try { await deleteDoc(doc(db, 'societies', SOCIETY_ID, 'visitors', id)); }
      catch (e: any) { alert('Failed: ' + e.message); }
    });
  };

  const TABS: { key: DashTab; label: string }[] = [
    { key: 'overview', label: '📊 Overview' },
    { key: 'broadcast', label: '📢 Broadcast' },
    { key: 'residents', label: '👥 Residents' },
    { key: 'visitors', label: '🚪 Visitors' },
  ];

  const pending = residents.filter(r => !r.approved);
  const approved = residents.filter(r => r.approved);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>🛡 Dashboard</Text>
        <TouchableOpacity onPress={toggleTheme} style={[styles.themeBtn, { backgroundColor: colors.bg, borderColor: colors.border }]}>
          <Text style={styles.themeIcon}>{theme === 'dark' ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.tabScroll, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, tab === t.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabLabel, { color: tab === t.key ? colors.primary : colors.subtext }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Society Stats</Text>
            <View style={styles.statsGrid}>
              {stats.map((s) => (
                <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: s.color + '40', borderWidth: 1.5 }]}>
                  <Text style={styles.statEmoji}>{s.emoji}</Text>
                  <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={[styles.statLabel, { color: colors.subtext }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>Announcements</Text>
            {announcements.length === 0 && <Text style={[styles.emptyText, { color: colors.subtext }]}>No announcements yet.</Text>}
            {announcements.map((a) => (
              <View key={a.id} style={[styles.card, { backgroundColor: colors.card, borderColor: a.emergency ? colors.danger : a.pinned ? colors.warning : colors.border, borderWidth: a.emergency || a.pinned ? 1.5 : 1 }]}>
                <View style={styles.rowBetween}>
                  <Text style={[styles.annTitle, { color: a.emergency ? colors.danger : colors.text }]} numberOfLines={1}>
                    {a.emergency ? '🚨 ' : a.pinned ? '📌 ' : ''}{a.title}
                  </Text>
                  <View style={styles.annActions}>
                    <TouchableOpacity onPress={() => handlePinToggle(a.id, a.pinned)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Text style={[styles.actionIcon, { opacity: a.pinned ? 1 : 0.4 }]}>📌</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteAnnouncement(a.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Text style={styles.actionIcon}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={[styles.annBody, { color: colors.subtext }]} numberOfLines={1}>{a.body}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── BROADCAST ── */}
        {tab === 'broadcast' && (
          <View>
            {/* Emergency toggle */}
            <TouchableOpacity
              style={[
                styles.emergencyToggle,
                { borderColor: isEmergency ? colors.danger : colors.border, backgroundColor: isEmergency ? colors.danger + '15' : colors.card }
              ]}
              onPress={() => setIsEmergency(!isEmergency)}
            >
              <Text style={styles.emergencyIcon}>🚨</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.emergencyTitle, { color: isEmergency ? colors.danger : colors.text }]}>
                  Emergency Alert {isEmergency ? '(ON)' : '(OFF)'}
                </Text>
                <Text style={[styles.emergencySubtitle, { color: colors.subtext }]}>
                  Tap to {isEmergency ? 'disable' : 'enable'} — shows 🚨 and pins to top
                </Text>
              </View>
              <View style={[styles.toggle, { backgroundColor: isEmergency ? colors.danger : colors.muted }]}>
                <View style={[styles.toggleDot, isEmergency && styles.toggleDotOn]} />
              </View>
            </TouchableOpacity>

            <Text style={[styles.label, { color: colors.subtext }]}>Title</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.input, borderColor: isEmergency ? colors.danger : colors.border, color: colors.text }]}
              placeholder={isEmergency ? "Emergency title..." : "Announcement title..."}
              placeholderTextColor={colors.muted}
              value={bTitle} onChangeText={setBTitle}
            />

            <Text style={[styles.label, { color: colors.subtext }]}>Message</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.input, borderColor: isEmergency ? colors.danger : colors.border, color: colors.text }]}
              placeholder="Write your message..."
              placeholderTextColor={colors.muted}
              value={bBody} onChangeText={setBBody}
              multiline numberOfLines={4}
            />

            <TouchableOpacity
              style={[styles.broadcastBtn, { backgroundColor: isEmergency ? colors.danger : colors.primary }]}
              onPress={handleBroadcast} disabled={posting}
            >
              {posting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.broadcastBtnText}>
                    {isEmergency ? '🚨 Send Emergency Alert' : '📢 Post Announcement'}
                  </Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* ── RESIDENTS ── */}
        {tab === 'residents' && (
          <View>
            {pending.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Pending Approval ({pending.length})</Text>
                {pending.map((r) => (
                  <View key={r.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.warning, borderWidth: 1.5 }]}>
                    <Text style={[styles.residentName, { color: colors.text }]}>{r.name}</Text>
                    <Text style={[styles.residentMeta, { color: colors.subtext }]}>{r.wing}-{r.flatNo} • {r.phone}</Text>
                    <View style={styles.residentBtns}>
                      <TouchableOpacity style={[styles.approveBtn, { backgroundColor: colors.success + '20', borderColor: colors.success }]} onPress={() => handleApprove(r.id)}>
                        <Text style={[styles.approveTxt, { color: colors.success }]}>✓ Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.rejectBtn, { backgroundColor: colors.dangerBg, borderColor: colors.danger }]} onPress={() => handleReject(r.id)}>
                        <Text style={[styles.rejectTxt, { color: colors.danger }]}>✕ Reject</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}

            <Text style={[styles.sectionTitle, { color: colors.text }]}>All Residents ({approved.length})</Text>
            {approved.length === 0 && <Text style={[styles.emptyText, { color: colors.subtext }]}>No approved residents yet.</Text>}
            {approved.map((r) => (
              <View key={r.id} style={[styles.card, styles.residentRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.residentAvatar, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.residentAvatarText, { color: colors.primary }]}>{r.name?.charAt(0)?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.residentName, { color: colors.text }]}>{r.name}</Text>
                  <Text style={[styles.residentMeta, { color: colors.subtext }]}>{r.wing}-{r.flatNo} • {r.role} • {r.phone}</Text>
                </View>
                <View style={[styles.rolePill, { backgroundColor: r.role === 'admin' ? colors.warning + '20' : colors.primary + '15' }]}>
                  <Text style={[styles.rolePillText, { color: r.role === 'admin' ? colors.warning : colors.primary }]}>{r.role}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── VISITORS ── */}
        {tab === 'visitors' && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Visitor Log ({visitors.length})</Text>
            {visitors.length === 0 && <Text style={[styles.emptyText, { color: colors.subtext }]}>No visitor entries yet.</Text>}
            {visitors.map((v) => (
              <View key={v.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.residentName, { color: colors.text }]}>{v.visitorName || v.name || 'Unknown'}</Text>
                    <Text style={[styles.residentMeta, { color: colors.subtext }]}>
                      {v.flatNo ? `Flat ${v.flatNo}` : ''}{v.purpose ? ` • ${v.purpose}` : ''}{v.vehicle ? ` • 🚗 ${v.vehicle}` : ''}
                    </Text>
                    <Text style={[styles.visitorTime, { color: colors.muted }]}>
                      {v.createdAt ? new Date(v.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteVisitor(v.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={styles.actionIcon}>🗑</Text>
                  </TouchableOpacity>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  themeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  themeIcon: { fontSize: 16 },
  tabScroll: { borderBottomWidth: 1 },
  tabBtn: { paddingHorizontal: 16, paddingVertical: 12 },
  tabLabel: { fontSize: 13, fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { flex: 1, minWidth: '45%', borderRadius: 16, padding: 16, alignItems: 'center' },
  statEmoji: { fontSize: 28, marginBottom: 6 },
  statValue: { fontSize: 32, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 12, textAlign: 'center', fontWeight: '500' },
  card: { borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  annTitle: { fontSize: 14, fontWeight: '700', flex: 1, marginRight: 8 },
  annBody: { fontSize: 12, marginTop: 4 },
  annActions: { flexDirection: 'row', gap: 8 },
  actionIcon: { fontSize: 18 },
  emptyText: { textAlign: 'center', marginTop: 20, fontSize: 14 },
  // Broadcast
  emergencyToggle: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1.5 },
  emergencyIcon: { fontSize: 28 },
  emergencyTitle: { fontSize: 15, fontWeight: '700' },
  emergencySubtitle: { fontSize: 12, marginTop: 2 },
  toggle: { width: 44, height: 24, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 2 },
  toggleDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  toggleDotOn: { alignSelf: 'flex-end' },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 10 },
  input: { borderRadius: 12, padding: 12, fontSize: 14, borderWidth: 1, marginBottom: 4 },
  textArea: { height: 100, textAlignVertical: 'top' },
  broadcastBtn: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  broadcastBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  // Residents
  residentName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  residentMeta: { fontSize: 12 },
  residentBtns: { flexDirection: 'row', gap: 10, marginTop: 10 },
  approveBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  approveTxt: { fontWeight: '700', fontSize: 13 },
  rejectBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  rejectTxt: { fontWeight: '700', fontSize: 13 },
  residentRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  residentAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  residentAvatarText: { fontSize: 18, fontWeight: '700' },
  rolePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  rolePillText: { fontSize: 11, fontWeight: '700' },
  // Visitors
  visitorTime: { fontSize: 11, marginTop: 3 },
});
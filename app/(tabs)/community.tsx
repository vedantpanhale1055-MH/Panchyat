import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { db, auth } from '../../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';

const SOCIETY_ID = 'society_001';
type ChatType = 'society' | 'wing';

const confirmDelete = (onConfirm: () => void) => {
  if (Platform.OS === 'web') { if (window.confirm('Delete this message?')) onConfirm(); }
  else {
    const { Alert } = require('react-native');
    Alert.alert('Delete', 'Remove this message?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onConfirm },
    ]);
  }
};

export default function CommunityScreen() {
  const { user } = useUser();
  const { theme, toggleTheme, colors } = useTheme();
  const [chatType, setChatType] = useState<ChatType>('society');
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const getChatCol = (type: ChatType) =>
    type === 'society'
      ? collection(db, 'societies', SOCIETY_ID, 'chats', 'society', 'messages')
      : collection(db, 'societies', SOCIETY_ID, 'chats', `wing_${user?.wing || 'A'}`, 'messages');

  const getMsgDoc = (type: ChatType, id: string) =>
    type === 'society'
      ? doc(db, 'societies', SOCIETY_ID, 'chats', 'society', 'messages', id)
      : doc(db, 'societies', SOCIETY_ID, 'chats', `wing_${user?.wing || 'A'}`, 'messages', id);

  useEffect(() => {
    const q = query(getChatCol(chatType), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });
  }, [chatType, user?.wing]);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await addDoc(getChatCol(chatType), {
        text: text.trim(), userId: auth.currentUser?.uid,
        userName: user?.name, flatNo: user?.flatNo,
        wing: user?.wing, createdAt: new Date().toISOString(),
      });
      setText('');
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setSending(false); }
  };

  const handleDelete = (item: any) => {
    const isOwner = auth.currentUser?.uid === item.userId;
    const isAdmin = user?.role === 'admin';
    if (!isOwner && !isAdmin) return;
    confirmDelete(async () => {
      try { await deleteDoc(getMsgDoc(chatType, item.id)); }
      catch (e: any) { alert('Failed: ' + e.message); }
    });
  };

  const formatTime = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMine = auth.currentUser?.uid === item.userId;
    const canDelete = isMine || user?.role === 'admin';
    return (
      <View style={[styles.msgRow, isMine && styles.msgRowMine]}>
        {!isMine && (
          <View style={[styles.avatar, { backgroundColor: colors.primary + '30' }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {item.userName?.charAt(0)?.toUpperCase()}
            </Text>
          </View>
        )}
        <View style={[styles.bubbleWrapper, isMine && styles.bubbleWrapperMine]}>
          <View style={[
            styles.bubble,
            isMine ? { backgroundColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
          ]}>
            {!isMine && <Text style={[styles.bubbleName, { color: colors.primary }]}>{item.userName} • {item.wing}-{item.flatNo}</Text>}
            <Text style={[styles.bubbleText, { color: isMine ? '#fff' : colors.text }]}>{item.text}</Text>
            <Text style={[styles.bubbleTime, { color: isMine ? 'rgba(255,255,255,0.65)' : colors.muted }]}>{formatTime(item.createdAt)}</Text>
          </View>
          {canDelete && (
            <TouchableOpacity
              style={[styles.msgDeleteBtn, isMine && styles.msgDeleteBtnMine]}
              onPress={() => handleDelete(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.msgDeleteIcon}>🗑</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Community</Text>
        <TouchableOpacity onPress={toggleTheme} style={[styles.themeBtn, { backgroundColor: colors.bg, borderColor: colors.border }]}>
          <Text style={styles.themeIcon}>{theme === 'dark' ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.tabRow, { backgroundColor: colors.header, borderBottomColor: colors.border }]}>
        <View style={[styles.tabSwitcher, { backgroundColor: colors.bg }]}>
          {(['society', 'wing'] as ChatType[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, chatType === t && { backgroundColor: colors.primary }]}
              onPress={() => setChatType(t)}
            >
              <Text style={[styles.tabBtnText, { color: chatType === t ? '#fff' : colors.subtext }]}>
                {t === 'society' ? '🏘 Society' : `🏠 Wing ${user?.wing}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.subtext }]}>No messages yet. Say hi! 👋</Text>}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.inputRow, { backgroundColor: colors.header, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
            placeholder="Type a message..." placeholderTextColor={colors.muted}
            value={text} onChangeText={setText}
            onSubmitEditing={handleSend} returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: text.trim() ? colors.primary : colors.muted }]}
            onPress={handleSend} disabled={sending || !text.trim()}
          >
            <Text style={styles.sendIcon}>➤</Text>
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
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  themeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  themeIcon: { fontSize: 16 },
  tabRow: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  tabSwitcher: { flexDirection: 'row', borderRadius: 12, padding: 3, gap: 3 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  tabBtnText: { fontSize: 13, fontWeight: '600' },
  messageList: { padding: 12, paddingBottom: 8 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 14 },
  msgRowMine: { flexDirection: 'row-reverse' },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  avatarText: { fontSize: 13, fontWeight: '700' },
  bubbleWrapper: { alignItems: 'flex-start', maxWidth: '75%' },
  bubbleWrapperMine: { alignItems: 'flex-end' },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, borderBottomLeftRadius: 4 },
  bubbleName: { fontSize: 11, fontWeight: '700', marginBottom: 3 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTime: { fontSize: 10, marginTop: 4, textAlign: 'right' },
  msgDeleteBtn: { marginTop: 4, alignSelf: 'flex-start' },
  msgDeleteBtnMine: { alignSelf: 'flex-end' },
  msgDeleteIcon: { fontSize: 13 },
  emptyText: { textAlign: 'center', marginTop: 60, fontSize: 14 },
  inputRow: { flexDirection: 'row', padding: 10, gap: 8, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, borderWidth: 1 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sendIcon: { color: '#fff', fontSize: 16 },
});
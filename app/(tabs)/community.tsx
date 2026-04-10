import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TextInput, TouchableOpacity, KeyboardAvoidingView, Platform
} from 'react-native';
import { db, auth } from '../../firebase';
import {
  collection, addDoc, onSnapshot,
  query, orderBy
} from 'firebase/firestore';

type Message = {
  id: string;
  text: string;
  userName: string;
  flatNo: string;
  userId: string;
  createdAt: string;
};

export default function CommunityScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [chatType, setChatType] = useState<'society' | 'wing'>('society');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const path = chatType === 'society'
      ? collection(db, 'societies', 'society_001', 'chats', 'society', 'messages')
      : collection(db, 'societies', 'society_001', 'chats', 'wing_A', 'messages');

    const q = query(path, orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Message));
      setMessages(data);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return unsub;
  }, [chatType]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const user = auth.currentUser;
    const path = chatType === 'society'
      ? collection(db, 'societies', 'society_001', 'chats', 'society', 'messages')
      : collection(db, 'societies', 'society_001', 'chats', 'wing_A', 'messages');

    await addDoc(path, {
      text: text.trim(),
      userId: user?.uid,
      userName: 'Vedant',
      flatNo: '103',
      createdAt: new Date().toISOString(),
    });
    setText('');
  };

  const isMe = (userId: string) => userId === auth.currentUser?.uid;

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.msgRow, isMe(item.userId) && styles.msgRowMe]}>
      {!isMe(item.userId) && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.userName?.charAt(0)}</Text>
        </View>
      )}
      <View style={[styles.bubble, isMe(item.userId) && styles.bubbleMe]}>
        {!isMe(item.userId) && (
          <Text style={styles.msgName}>{item.userName} • {item.flatNo}</Text>
        )}
        <Text style={[styles.msgText, isMe(item.userId) && styles.msgTextMe]}>
          {item.text}
        </Text>
        <Text style={[styles.msgTime, isMe(item.userId) && styles.msgTimeMe]}>
          {new Date(item.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, chatType === 'society' && styles.toggleActive]}
            onPress={() => setChatType('society')}
          >
            <Text style={[styles.toggleText, chatType === 'society' && styles.toggleTextActive]}>
              🌐 Society
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, chatType === 'wing' && styles.toggleActive]}
            onPress={() => setChatType('wing')}
          >
            <Text style={[styles.toggleText, chatType === 'wing' && styles.toggleTextActive]}>
              🏢 Wing A
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatEmoji}>💬</Text>
            <Text style={styles.emptyChatText}>No messages yet. Say hello!</Text>
          </View>
        }
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim()}
          >
            <Text style={styles.sendText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  header: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 12 },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: '#dde3f0', backgroundColor: '#f0f4ff' },
  toggleActive: { backgroundColor: '#eef2ff', borderColor: '#4f46e5' },
  toggleText: { fontSize: 13, fontWeight: '600', color: '#888' },
  toggleTextActive: { color: '#4f46e5' },
  messagesList: { padding: 16, paddingBottom: 8 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  msgRowMe: { flexDirection: 'row-reverse' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center', marginRight: 8, borderWidth: 1, borderColor: '#c7d2fe' },
  avatarText: { fontSize: 14, fontWeight: 'bold', color: '#4f46e5' },
  bubble: { maxWidth: '75%', backgroundColor: '#fff', borderRadius: 16, borderBottomLeftRadius: 4, padding: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  bubbleMe: { backgroundColor: '#4f46e5', borderBottomLeftRadius: 16, borderBottomRightRadius: 4, marginLeft: 8 },
  msgName: { fontSize: 11, fontWeight: '700', color: '#4f46e5', marginBottom: 4 },
  msgText: { fontSize: 14, color: '#1a1a2e', lineHeight: 20 },
  msgTextMe: { color: '#fff' },
  msgTime: { fontSize: 10, color: '#aaa', marginTop: 4, textAlign: 'right' },
  msgTimeMe: { color: '#c7d2fe' },
  emptyChat: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyChatEmoji: { fontSize: 48, marginBottom: 12 },
  emptyChatText: { fontSize: 15, color: '#888' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', gap: 8 },
  input: { flex: 1, backgroundColor: '#f0f4ff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#1a1a2e', borderWidth: 1, borderColor: '#dde3f0', maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: '#a5b4fc' },
  sendText: { color: '#fff', fontSize: 18 },
});
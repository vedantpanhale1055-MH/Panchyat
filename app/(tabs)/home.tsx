import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';

const announcements = [
  { id: '1', title: 'Water Supply Shutdown', body: 'Water will be shut down on Sunday 10am-2pm for maintenance.', time: '2h ago', type: 'announcement' },
  { id: '2', title: 'Parking Issue - A Wing', body: 'Someone has parked in slot A-12 without permission. Owner please check.', time: '4h ago', type: 'complaint' },
  { id: '3', title: 'Society Meeting', body: 'Monthly society meeting on Saturday 6pm in the clubhouse. All members please attend.', time: '1d ago', type: 'announcement' },
  { id: '4', title: 'Lift Not Working - B Wing', body: 'The lift in B wing is under repair. Expected to be fixed by evening.', time: '1d ago', type: 'complaint' },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning 👋</Text>
          <Text style={styles.name}>Vedant • A-1403</Text>
        </View>
        <TouchableOpacity style={styles.sosBtn}>
          <Text style={styles.sosText}>🆘 SOS</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>3</Text>
            <Text style={styles.statLabel}>Open Complaints</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>1</Text>
            <Text style={styles.statLabel}>Visitor Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>✅</Text>
            <Text style={styles.statLabel}>Dues Paid</Text>
          </View>
        </View>

        {/* Feed */}
        <Text style={styles.sectionTitle}>Latest Updates</Text>
        {announcements.map(item => (
          <TouchableOpacity key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.badge, item.type === 'announcement' ? styles.badgeAnnouncement : styles.badgeComplaint]}>
                <Text style={styles.badgeText}>
                  {item.type === 'announcement' ? '📢 Announcement' : '🛠 Complaint'}
                </Text>
              </View>
              <Text style={styles.time}>{item.time}</Text>
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardBody}>{item.body}</Text>
          </TouchableOpacity>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  greeting: { fontSize: 13, color: '#888' },
  name: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  sosBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  sosText: { fontSize: 13, fontWeight: '700', color: '#dc2626' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statNum: { fontSize: 22, fontWeight: 'bold', color: '#4f46e5' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 4, textAlign: 'center' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    marginTop: 16,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeAnnouncement: { backgroundColor: '#eef2ff' },
  badgeComplaint: { backgroundColor: '#fef3c7' },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#444' },
  time: { fontSize: 11, color: '#aaa' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  cardBody: { fontSize: 13, color: '#666', lineHeight: 20 },
});
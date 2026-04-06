import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { auth } from "../../firebase";

export default function ProfileScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>
      <View style={styles.center}>
        <Text style={styles.avatar}>👤</Text>
        <Text style={styles.name}>Vedant</Text>
        <Text style={styles.flat}>Flat A-1403</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4ff" },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: { fontSize: 20, fontWeight: "bold", color: "#1a1a2e" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  avatar: { fontSize: 64, marginBottom: 12 },
  name: { fontSize: 22, fontWeight: "bold", color: "#1a1a2e" },
  flat: { fontSize: 15, color: "#888", marginTop: 4, marginBottom: 32 },
  logoutBtn: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fca5a5",
  },
  logoutText: { color: "#dc2626", fontWeight: "700", fontSize: 15 },
});
git add .
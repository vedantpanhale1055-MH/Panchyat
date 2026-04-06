import { useRouter } from "expo-router";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ApprovalScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.wrapper}>
        <View style={styles.inner}>
          <View style={styles.logoArea}>
            <Text style={styles.appName}>🏘 Panchyat</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.icon}>⏳</Text>
            <Text style={styles.title}>Approval Pending</Text>
            <Text style={styles.subtitle}>
              Your registration has been submitted successfully!
              {"\n\n"}
              The society admin will review and approve your account. You'll be
              notified once approved.
            </Text>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                ℹ️ This usually takes a few hours. Please check back later.
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => router.replace("/(tabs)/home")}>
            <Text style={styles.back}>← Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f4ff",
  },
  wrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    width: "100%",
    maxWidth: 480,
    paddingHorizontal: 24,
  },
  logoArea: {
    alignItems: "center",
    marginBottom: 32,
  },
  appName: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#1a1a2e",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a2e",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  infoBox: {
    backgroundColor: "#eef2ff",
    borderRadius: 12,
    padding: 14,
    width: "100%",
  },
  infoText: {
    fontSize: 13,
    color: "#4f46e5",
    lineHeight: 20,
    textAlign: "center",
  },
  back: {
    textAlign: "center",
    marginTop: 24,
    fontSize: 14,
    color: "#4f46e5",
    fontWeight: "500",
  },
});

import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function OTPScreen() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<Array<TextInput | null>>([]);
  const router = useRouter();

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullOtp = otp.join("");
    if (fullOtp.length !== 6) {
      alert("Please enter the complete 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const confirmation = (global as any).confirmationResult;
      await confirmation.confirm(fullOtp);
      router.replace('/');
    } catch (error: any) {
      alert("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isComplete = otp.every((d) => d !== "");

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.wrapper}>
        <View style={styles.inner}>
          <View style={styles.logoArea}>
            <Text style={styles.appName}>🏘 Panchyat</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Enter OTP</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to{"\n"}
              <Text style={styles.phone}>your phone number</Text>
            </Text>

            <View style={styles.otpRow}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputs.current[index] = ref;
                  }}
                  style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                  value={digit}
                  onChangeText={(text) => handleChange(text.slice(-1), index)}
                  onKeyPress={({ nativeEvent }) =>
                    handleBackspace(nativeEvent.key, index)
                  }
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.button, !isComplete && styles.buttonDisabled]}
              onPress={handleVerify}
              disabled={!isComplete || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify OTP</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => alert("OTP Resent!")}>
              <Text style={styles.resend}>
                Didn't receive it?{" "}
                <Text style={styles.resendLink}>Resend OTP</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>← Change phone number</Text>
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
    marginBottom: 40,
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
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a2e",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#777",
    marginBottom: 28,
    lineHeight: 22,
  },
  phone: {
    color: "#4f46e5",
    fontWeight: "600",
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 28,
    gap: 10,
  },
  otpBox: {
    width: 44,
    height: 54,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#dde3f0",
    backgroundColor: "#f0f4ff",
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a1a2e",
  },
  otpBoxFilled: {
    borderColor: "#4f46e5",
    backgroundColor: "#eef2ff",
  },
  button: {
    backgroundColor: "#4f46e5",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: "#a5b4fc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  resend: {
    textAlign: "center",
    fontSize: 13,
    color: "#999",
  },
  resendLink: {
    color: "#4f46e5",
    fontWeight: "600",
  },
  back: {
    textAlign: "center",
    marginTop: 24,
    fontSize: 14,
    color: "#4f46e5",
    fontWeight: "500",
  },
});

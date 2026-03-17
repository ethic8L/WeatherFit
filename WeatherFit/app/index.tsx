import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";

export default function Index() {
  return (
    <View style={styles.container}>
      <View style={styles.bgCircleTop} />
      <View style={styles.bgCircleBottom} />

      <View style={styles.card}>
        <Text style={styles.badge}>Smart Assistant</Text>
        <Text style={styles.title}>WeatherFit</Text>
        <Text style={styles.subtitle}>
          Pick an outfit and stay comfortable all day long, no matter the weather.
        </Text>

        <Pressable style={styles.button} onPress={() => router.push("/home")}>
          <Text style={styles.buttonText}>Press to start</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0B1220",
    paddingHorizontal: 24,
    overflow: "hidden",
  },
  bgCircleTop: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#2563EB",
    opacity: 0.32,
    top: -50,
    right: -40,
  },
  bgCircleBottom: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "#22D3EE",
    opacity: 0.2,
    bottom: -120,
    left: -90,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  badge: {
    alignSelf: "flex-start",
    fontSize: 12,
    color: "#BFDBFE",
    backgroundColor: "rgba(37,99,235,0.35)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    marginBottom: 16,
    overflow: "hidden",
  },
  title: {
    fontSize: 40,
    fontWeight: "800",
    color: "#F8FAFC",
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: "#D1D5DB",
    marginBottom: 26,
  },
  button: {
    backgroundColor: "#38BDF8",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#082F49",
  },
});

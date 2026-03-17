import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import { getSettings, updateSettings } from "../services/settingsStorage";

type PreferenceCardProps = {
  label: string;
  hint: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

function PreferenceCard({
  label,
  hint,
  value,
  onValueChange,
}: PreferenceCardProps) {
  return (
    <View style={styles.preferenceCard}>
      <View style={styles.preferenceCopy}>
        <Text style={styles.preferenceLabel}>{label}</Text>
        <Text style={styles.preferenceHint}>{hint}</Text>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        thumbColor={value ? "#E0F2FE" : "#F8FAFC"}
        trackColor={{ false: "#334155", true: "#0EA5E9" }}
      />
    </View>
  );
}

export default function Settings() {
  const [metricUnits, setMetricUnits] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [autoLocation, setAutoLocation] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      const saved = await getSettings();
      setMetricUnits(saved.unitSystem === "metric");
      setNotifications(saved.notifications);
      setAutoLocation(saved.autoLocation);
      setSmartSuggestions(saved.smartSuggestions);
      setLoading(false);
    };

    loadSettings();
  }, []);

  const onMetricUnitsChange = async (value: boolean) => {
    setMetricUnits(value);
    await updateSettings({ unitSystem: value ? "metric" : "imperial" });
  };

  const onNotificationsChange = async (value: boolean) => {
    setNotifications(value);
    await updateSettings({ notifications: value });
  };

  const onAutoLocationChange = async (value: boolean) => {
    setAutoLocation(value);
    await updateSettings({ autoLocation: value });
  };

  const onSmartSuggestionsChange = async (value: boolean) => {
    setSmartSuggestions(value);
    await updateSettings({ smartSuggestions: value });
  };

  const summary = useMemo(() => {
    const units = metricUnits ? "Metric" : "Imperial";
    const notif = notifications ? "Alerts on" : "Alerts off";
    const location = autoLocation ? "Auto location" : "Manual city";
    const suggestions = smartSuggestions
      ? "Smart outfit hints"
      : "Basic weather only";

    return `${units} • ${notif} • ${location} • ${suggestions}`;
  }, [metricUnits, notifications, autoLocation, smartSuggestions]);

  return (
    <View style={styles.container}>
      <View style={styles.bgCircleTop} />
      <View style={styles.bgCircleBottom} />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#38BDF8" />
          <Text style={styles.loadingText}>Loading your settings...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerRow}>
            <Pressable
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.backButtonPressed,
              ]}
              onPress={() => router.replace("/home")}
            >
              <Text style={styles.backButtonText}>← Back to menu</Text>
            </Pressable>
          </View>

          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>
            Tune WeatherFit for your daily routine and comfort.
          </Text>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryEyebrow}>Current profile</Text>
            <Text style={styles.summaryTitle}>Personalized experience</Text>
            <Text style={styles.summaryText}>{summary}</Text>
          </View>

          <Text style={styles.sectionTitle}>Preferences</Text>
          <PreferenceCard
            label="Use metric units"
            hint="Show temperature in °C and wind speed in m/s."
            value={metricUnits}
            onValueChange={onMetricUnitsChange}
          />
          <PreferenceCard
            label="Weather notifications"
            hint="Get reminders when conditions change sharply."
            value={notifications}
            onValueChange={onNotificationsChange}
          />
          <PreferenceCard
            label="Automatic location"
            hint="Use your device location for instant forecasts."
            value={autoLocation}
            onValueChange={onAutoLocationChange}
          />
          <PreferenceCard
            label="Smart outfit suggestions"
            hint="Adjust recommendations using wind, rain, and feels-like temperature."
            value={smartSuggestions}
            onValueChange={onSmartSuggestionsChange}
          />

          <Text style={styles.sectionTitle}>About the app</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>
              WeatherFit helps with daily planning
            </Text>
            <Text style={styles.infoText}>
              Check current weather, preview the upcoming forecast, and get
              outfit guidance without leaving the app.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Next good step</Text>
            <Text style={styles.infoText}>
              Settings are now saved on your device and applied across weather
              screens.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220",
    overflow: "hidden",
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#CBD5E1",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: "row",
    marginBottom: 18,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.6)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.24)",
  },
  backButtonPressed: {
    transform: [{ scale: 0.97 }],
    backgroundColor: "rgba(56,189,248,0.2)",
    borderColor: "rgba(125,211,252,0.7)",
  },
  backButtonText: {
    color: "#E2E8F0",
    fontWeight: "600",
  },
  bgCircleTop: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#2563EB",
    opacity: 0.24,
    top: -60,
    right: -40,
  },
  bgCircleBottom: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "#22D3EE",
    opacity: 0.16,
    bottom: -120,
    left: -80,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 18,
    color: "#CBD5E1",
    fontSize: 15,
  },
  summaryCard: {
    backgroundColor: "rgba(15,23,42,0.88)",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(56,189,248,0.3)",
  },
  summaryEyebrow: {
    alignSelf: "flex-start",
    color: "#BAE6FD",
    fontSize: 12,
    fontWeight: "700",
    backgroundColor: "rgba(56,189,248,0.16)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 10,
  },
  summaryTitle: {
    color: "#F8FAFC",
    fontSize: 24,
    fontWeight: "800",
  },
  summaryText: {
    color: "#CBD5E1",
    marginTop: 10,
    lineHeight: 22,
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 12,
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "700",
  },
  preferenceCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  preferenceCopy: {
    flex: 1,
    paddingRight: 16,
  },
  preferenceLabel: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "700",
  },
  preferenceHint: {
    color: "#CBD5E1",
    marginTop: 6,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: "rgba(15,23,42,0.82)",
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.16)",
  },
  infoTitle: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  infoText: {
    color: "#CBD5E1",
    lineHeight: 22,
  },
});

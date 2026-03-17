import {
  Animated,
  ScrollView,
  View,
  Image,
  Text,
  TextInput,
  Pressable,
  Keyboard,
  StyleSheet,
} from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { getWeather } from "../services/weatherApi";
import { router, useFocusEffect } from "expo-router";
import { getSettings, type UnitSystem } from "../services/settingsStorage";

export default function Home() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState<any>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(24)).current;
  const cardScale = useRef(new Animated.Value(0.96)).current;

  const unitLabel = unitSystem === "metric" ? "°C" : "°F";
  const windUnitLabel = unitSystem === "metric" ? "m/s" : "mph";

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const syncSettings = async () => {
        const settings = await getSettings();
        if (!mounted) return;

        setUnitSystem(settings.unitSystem);

        if (weather?.name) {
          try {
            const refreshed = await getWeather(
              weather.name,
              settings.unitSystem,
            );
            if (mounted) setWeather(refreshed);
          } catch {
            // Keep previous data if refresh fails.
          }
        }
      };

      syncSettings();

      return () => {
        mounted = false;
      };
    }, [weather?.name]),
  );

  useEffect(() => {
    if (!weather) return;

    cardOpacity.setValue(0);
    cardTranslateY.setValue(24);
    cardScale.setValue(0.96);

    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [cardOpacity, cardScale, cardTranslateY, weather]);

  const fetchWeather = async () => {
    Keyboard.dismiss();

    if (!city.trim()) return;

    try {
      const settings = await getSettings();
      setUnitSystem(settings.unitSystem);

      const data = await getWeather(city, settings.unitSystem);
      setWeather(data);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.bgCircleTop} />
      <View style={styles.bgCircleBottom} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>WeatherFit</Text>
        <Text style={styles.subtitle}>Check weather and outfit in seconds</Text>

        <View style={styles.panel}>
          <TextInput
            placeholder="Enter city"
            placeholderTextColor="#94A3B8"
            value={city}
            onChangeText={setCity}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            onSubmitEditing={fetchWeather}
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCorrect={false}
            autoCapitalize="words"
            style={[styles.input, isInputFocused && styles.inputFocused]}
          />

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
            onPress={fetchWeather}
          >
            <Text style={styles.primaryButtonText}>Check Weather</Text>
          </Pressable>

          <View style={styles.navButtonsWrap}>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.secondaryButtonPressed,
              ]}
              onPress={() => router.push("/forecast")}
            >
              <Text style={styles.secondaryButtonText}>Forecast</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.secondaryButtonPressed,
              ]}
              onPress={() => router.push("/outfit")}
            >
              <Text style={styles.secondaryButtonText}>Outfit details</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.secondaryButtonPressed,
              ]}
              onPress={() => router.push("/settings")}
            >
              <Text style={styles.secondaryButtonText}>Settings</Text>
            </Pressable>
          </View>
        </View>

        {weather && (
          <Animated.View
            style={[
              styles.card,
              {
                opacity: cardOpacity,
                transform: [
                  { translateY: cardTranslateY },
                  { scale: cardScale },
                ],
              },
            ]}
          >
            <Text style={styles.cardBadge}>Live Weather</Text>
            <Text style={styles.city}>{weather.name}</Text>

            <Image
              source={{
                uri: `https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`,
              }}
              style={{ width: 100, height: 100 }}
            />

            <Text style={styles.temp}>
              {Math.round(weather.main.temp)}
              {unitLabel}
            </Text>
            <Text style={styles.description}>
              {weather.weather[0].description}
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statChip}>
                <Text style={styles.statLabel}>Feels</Text>
                <Text style={styles.statValue}>
                  {Math.round(weather.main.feels_like)}°
                </Text>
              </View>
              <View style={styles.statChip}>
                <Text style={styles.statLabel}>Humidity</Text>
                <Text style={styles.statValue}>{weather.main.humidity}%</Text>
              </View>
              <View style={styles.statChip}>
                <Text style={styles.statLabel}>Wind</Text>
                <Text style={styles.statValue}>
                  {Number(weather.wind?.speed ?? 0).toFixed(1)} {windUnitLabel}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220",
    overflow: "hidden",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 42,
    alignItems: "center",
  },
  bgCircleTop: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#2563EB",
    opacity: 0.28,
    top: -60,
    right: -40,
  },
  bgCircleBottom: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: "#22D3EE",
    opacity: 0.2,
    bottom: -130,
    left: -90,
  },
  title: {
    marginTop: 20,
    fontSize: 36,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 20,
    fontSize: 15,
    color: "#CBD5E1",
  },
  panel: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  input: {
    width: "100%",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  inputFocused: {
    borderColor: "#38BDF8",
    shadowColor: "#38BDF8",
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: "#38BDF8",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#38BDF8",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  primaryButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  primaryButtonText: {
    color: "#082F49",
    fontWeight: "700",
    fontSize: 16,
  },
  navButtonsWrap: {
    marginTop: 12,
    gap: 8,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "rgba(191,219,254,0.5)",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "rgba(15,23,42,0.25)",
  },
  secondaryButtonPressed: {
    backgroundColor: "rgba(56,189,248,0.18)",
    borderColor: "rgba(125,211,252,0.7)",
    transform: [{ scale: 0.985 }],
  },
  secondaryButtonText: {
    color: "#DBEAFE",
    fontWeight: "600",
  },
  card: {
    marginTop: 20,
    width: "100%",
    maxWidth: 420,
    padding: 20,
    backgroundColor: "rgba(15,23,42,0.88)",
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(56,189,248,0.45)",
    shadowColor: "#0F172A",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  cardBadge: {
    alignSelf: "flex-start",
    fontSize: 12,
    fontWeight: "700",
    color: "#BAE6FD",
    backgroundColor: "rgba(56,189,248,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 8,
  },
  city: { fontSize: 22, fontWeight: "700", color: "#F8FAFC" },
  temp: { fontSize: 38, fontWeight: "800", color: "#F8FAFC" },
  description: {
    fontSize: 15,
    color: "#CBD5E1",
    textTransform: "capitalize",
  },
  statsRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  statChip: {
    backgroundColor: "rgba(148,163,184,0.16)",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
    minWidth: 90,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.28)",
  },
  statLabel: {
    fontSize: 11,
    color: "#94A3B8",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E2E8F0",
  },
});

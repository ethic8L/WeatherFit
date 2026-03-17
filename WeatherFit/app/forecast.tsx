import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useEffect, useMemo, useState } from "react";
import { getForecast } from "../services/weatherApi";
import { router, useLocalSearchParams } from "expo-router";
import { getSettings, type UnitSystem } from "../services/settingsStorage";

type QuickForecastItem = {
  key: string;
  time: string;
  temp: number;
  feelsLike: number;
  description: string;
  humidity: number;
};

type DailyForecastItem = {
  key: string;
  day: string;
  temp: number;
  wind: string;
  description: string;
};

export default function Forecast() {
  const params = useLocalSearchParams<{ city?: string }>();
  const initialCity =
    typeof params.city === "string" && params.city.trim()
      ? params.city.trim()
      : "Warsaw";

  const [city, setCity] = useState(initialCity);
  const [submittedCity, setSubmittedCity] = useState(initialCity);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");

  const unitLabel = unitSystem === "metric" ? "°C" : "°F";
  const windUnitLabel = unitSystem === "metric" ? "m/s" : "mph";

  const load = async (targetCity: string) => {
    const normalizedCity = targetCity.trim() || "Warsaw";

    try {
      setLoading(true);
      setError("");
      const settings = await getSettings();
      setUnitSystem(settings.unitSystem);

      const res = await getForecast(normalizedCity, settings.unitSystem);
      setData(res);
      setSubmittedCity(normalizedCity);
    } catch {
      setError("Could not load forecast for this city.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(initialCity);
  }, [initialCity]);

  const quickForecast = useMemo<QuickForecastItem[]>(() => {
    if (!data?.list) return [];

    return data.list.slice(0, 6).map((item: any) => ({
      key: String(item.dt),
      time: new Date(item.dt * 1000).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      temp: Math.round(item.main.temp),
      feelsLike: Math.round(item.main.feels_like),
      description: item.weather?.[0]?.description ?? "No data",
      humidity: item.main.humidity,
    }));
  }, [data]);

  const dailyForecast = useMemo<DailyForecastItem[]>(() => {
    if (!data?.list) return [];

    return data.list
      .filter((_: any, index: number) => index % 8 === 0)
      .slice(0, 5)
      .map((item: any) => ({
        key: `day-${item.dt}`,
        day: new Date(item.dt * 1000).toLocaleDateString([], {
          weekday: "short",
        }),
        temp: Math.round(item.main.temp),
        wind: Number(item.wind?.speed ?? 0).toFixed(1),
        description: item.weather?.[0]?.description ?? "No data",
      }));
  }, [data]);

  const highlight = data?.list?.[0];

  const handleSearch = () => {
    load(city);
  };

  return (
    <View style={styles.container}>
      <View style={styles.bgCircleTop} />
      <View style={styles.bgCircleBottom} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
          <Text style={styles.headerTag}>5-day outlook</Text>
        </View>

        <Text style={styles.title}>Forecast</Text>
        <Text style={styles.subtitle}>
          Plan your next few days before you head out.
        </Text>

        <View style={styles.searchCard}>
          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="Search city"
            placeholderTextColor="#94A3B8"
            style={styles.input}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            autoCapitalize="words"
          />

          <Pressable style={styles.primaryButton} onPress={handleSearch}>
            <Text style={styles.primaryButtonText}>Update forecast</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="large" color="#38BDF8" />
            <Text style={styles.stateText}>Loading weather data...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateCard}>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.stateText}>{error}</Text>
          </View>
        ) : (
          <>
            <View style={styles.heroCard}>
              <Text style={styles.heroBadge}>Next update</Text>
              <Text style={styles.heroCity}>
                {data?.city?.name ?? submittedCity}
              </Text>
              <Text style={styles.heroTemp}>
                {Math.round(highlight?.main?.temp ?? 0)}
                {unitLabel}
              </Text>
              <Text style={styles.heroDescription}>
                {highlight?.weather?.[0]?.description ?? "No data"}
              </Text>

              <View style={styles.metaRow}>
                <View style={styles.metaChip}>
                  <Text style={styles.metaLabel}>Feels like</Text>
                  <Text style={styles.metaValue}>
                    {Math.round(highlight?.main?.feels_like ?? 0)}°
                  </Text>
                </View>
                <View style={styles.metaChip}>
                  <Text style={styles.metaLabel}>Humidity</Text>
                  <Text style={styles.metaValue}>
                    {highlight?.main?.humidity ?? 0}%
                  </Text>
                </View>
                <View style={styles.metaChip}>
                  <Text style={styles.metaLabel}>Wind</Text>
                  <Text style={styles.metaValue}>
                    {Number(highlight?.wind?.speed ?? 0).toFixed(1)}{" "}
                    {windUnitLabel}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Today timeline</Text>
            <View style={styles.sectionCard}>
              {quickForecast.map((item: QuickForecastItem) => (
                <View key={item.key} style={styles.timelineRow}>
                  <Text style={styles.timelineTime}>{item.time}</Text>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTemp}>
                      {item.temp}
                      {unitLabel}
                    </Text>
                    <Text style={styles.timelineDescription}>
                      {item.description}
                    </Text>
                  </View>
                  <Text style={styles.timelineMeta}>{item.humidity}%</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Daily view</Text>
            <View style={styles.daysWrap}>
              {dailyForecast.map((item: DailyForecastItem) => (
                <View key={item.key} style={styles.dayCard}>
                  <Text style={styles.dayTitle}>{item.day}</Text>
                  <Text style={styles.dayTemp}>{item.temp}°</Text>
                  <Text style={styles.dayDescription}>{item.description}</Text>
                  <Text style={styles.dayWind}>
                    Wind {item.wind} {windUnitLabel}
                  </Text>
                </View>
              ))}
            </View>
          </>
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
    paddingHorizontal: 20,
    paddingTop: 42,
    paddingBottom: 32,
  },
  bgCircleTop: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#2563EB",
    opacity: 0.26,
    top: -70,
    right: -30,
  },
  bgCircleBottom: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "#22D3EE",
    opacity: 0.18,
    bottom: -120,
    left: -80,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  headerTag: {
    color: "#BAE6FD",
    fontSize: 12,
    fontWeight: "700",
    backgroundColor: "rgba(56,189,248,0.14)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#F8FAFC",
    marginTop: 18,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 18,
    color: "#CBD5E1",
    fontSize: 15,
  },
  searchCard: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#0F172A",
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: "#38BDF8",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: "#082F49",
    fontWeight: "700",
    fontSize: 16,
  },
  stateCard: {
    marginTop: 18,
    backgroundColor: "rgba(15,23,42,0.82)",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(56,189,248,0.2)",
    alignItems: "center",
    gap: 12,
  },
  stateText: {
    color: "#CBD5E1",
    textAlign: "center",
  },
  errorTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "700",
  },
  heroCard: {
    marginTop: 18,
    backgroundColor: "rgba(15,23,42,0.9)",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(56,189,248,0.34)",
  },
  heroBadge: {
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
  heroCity: {
    color: "#F8FAFC",
    fontSize: 28,
    fontWeight: "800",
  },
  heroTemp: {
    color: "#F8FAFC",
    fontSize: 42,
    fontWeight: "800",
    marginTop: 8,
  },
  heroDescription: {
    color: "#CBD5E1",
    textTransform: "capitalize",
    marginTop: 4,
    fontSize: 15,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  metaChip: {
    flex: 1,
    backgroundColor: "rgba(148,163,184,0.12)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  metaLabel: {
    color: "#94A3B8",
    fontSize: 11,
    marginBottom: 4,
  },
  metaValue: {
    color: "#E2E8F0",
    fontSize: 14,
    fontWeight: "700",
  },
  sectionTitle: {
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 12,
  },
  sectionCard: {
    backgroundColor: "rgba(15,23,42,0.82)",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.16)",
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148,163,184,0.12)",
  },
  timelineTime: {
    width: 58,
    color: "#93C5FD",
    fontWeight: "700",
  },
  timelineContent: {
    flex: 1,
    paddingHorizontal: 10,
  },
  timelineTemp: {
    color: "#F8FAFC",
    fontWeight: "700",
    fontSize: 16,
  },
  timelineDescription: {
    color: "#CBD5E1",
    textTransform: "capitalize",
    marginTop: 2,
  },
  timelineMeta: {
    color: "#94A3B8",
    fontWeight: "600",
  },
  daysWrap: {
    gap: 12,
  },
  dayCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  dayTitle: {
    color: "#BAE6FD",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  dayTemp: {
    marginTop: 8,
    color: "#F8FAFC",
    fontSize: 28,
    fontWeight: "800",
  },
  dayDescription: {
    marginTop: 6,
    color: "#CBD5E1",
    textTransform: "capitalize",
  },
  dayWind: {
    marginTop: 10,
    color: "#93C5FD",
    fontWeight: "600",
  },
});

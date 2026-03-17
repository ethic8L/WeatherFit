import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useEffect, useMemo, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";
import { getWeather } from "../services/weatherApi";
import { getSettings, type UnitSystem } from "../services/settingsStorage";

type OutfitPlan = {
  headline: string;
  layers: string[];
  accessories: string[];
  shoes: string;
  tip: string;
};

type InspirationLink = {
  label: string;
  url: string;
};

const buildOutfitPlan = (weather: any, unitSystem: UnitSystem): OutfitPlan => {
  const rawTemp = Number(weather?.main?.temp ?? 0);
  const rawFeelsLike = Number(weather?.main?.feels_like ?? rawTemp);
  const rawWind = Number(weather?.wind?.speed ?? 0);

  const temp = unitSystem === "imperial" ? (rawTemp - 32) / 1.8 : rawTemp;
  const feelsLike =
    unitSystem === "imperial" ? (rawFeelsLike - 32) / 1.8 : rawFeelsLike;
  const wind = unitSystem === "imperial" ? rawWind * 0.44704 : rawWind;

  const description = String(
    weather?.weather?.[0]?.description ?? "",
  ).toLowerCase();

  const isWet = /(rain|drizzle|storm|snow)/.test(description);
  const isCold = feelsLike < 8;
  const isHot = temp >= 24;

  if (isHot) {
    return {
      headline: "Light and breathable",
      layers: ["Cotton T-shirt or tank", "Loose shorts or airy trousers"],
      accessories: ["Cap or sunglasses", "Water bottle"],
      shoes: "Sneakers with breathable fabric",
      tip: isWet
        ? "Keep a compact umbrella nearby for sudden showers."
        : "Choose light fabrics and stay hydrated through the day.",
    };
  }

  if (isCold) {
    return {
      headline: "Warm layers first",
      layers: [
        "Thermal or long-sleeve base layer",
        "Sweater or hoodie",
        "Coat or insulated jacket",
      ],
      accessories: ["Scarf", wind > 6 ? "Beanie" : "Compact gloves"],
      shoes: "Closed waterproof boots or sturdy sneakers",
      tip: isWet
        ? "Prioritize water-resistant outerwear and dry socks."
        : "Layer up so you can adjust indoors without overheating.",
    };
  }

  return {
    headline: "Comfortable everyday fit",
    layers: ["T-shirt or thin knit", "Light jacket or overshirt"],
    accessories: [
      wind > 6 ? "Windproof layer" : "Small crossbody or backpack",
      isWet ? "Umbrella" : "Sunglasses",
    ],
    shoes: isWet ? "Water-resistant sneakers" : "Regular sneakers",
    tip: "Go for flexible layers so you're covered from morning to evening.",
  };
};

const buildBasicOutfitPlan = (tempCelsius: number): OutfitPlan => {
  if (tempCelsius < 8) {
    return {
      headline: "Warm essentials",
      layers: ["Long sleeve", "Sweater", "Jacket"],
      accessories: ["Scarf", "Optional gloves"],
      shoes: "Closed shoes",
      tip: "Keep your core warm and avoid thin fabrics.",
    };
  }

  if (tempCelsius > 24) {
    return {
      headline: "Light and cool",
      layers: ["Breathable T-shirt", "Light bottoms"],
      accessories: ["Cap", "Water bottle"],
      shoes: "Breathable sneakers",
      tip: "Choose airy materials and drink more water.",
    };
  }

  return {
    headline: "Balanced comfort",
    layers: ["T-shirt", "Light jacket"],
    accessories: ["Sunglasses or umbrella"],
    shoes: "Everyday sneakers",
    tip: "A light outer layer keeps you ready for temperature shifts.",
  };
};

const buildAiSuggestions = (
  weather: any,
  unitSystem: UnitSystem,
  smartSuggestionsEnabled: boolean,
): string[] => {
  const rawTemp = Number(weather?.main?.temp ?? 0);
  const temp = unitSystem === "imperial" ? (rawTemp - 32) / 1.8 : rawTemp;
  const humidity = Number(weather?.main?.humidity ?? 0);
  const rawWind = Number(weather?.wind?.speed ?? 0);
  const windMs = unitSystem === "imperial" ? rawWind * 0.44704 : rawWind;
  const description = String(
    weather?.weather?.[0]?.description ?? "",
  ).toLowerCase();

  const advice: string[] = [];

  if (temp < 8) {
    advice.push(
      "Use a 3-layer combo: base layer, insulating mid layer, and outer shell.",
    );
  } else if (temp > 24) {
    advice.push(
      "Prefer breathable fabrics like cotton/linen and avoid heavy denim layers.",
    );
  } else {
    advice.push(
      "Go with flexible layering so you can adapt from outdoor to indoor temperatures.",
    );
  }

  if (humidity > 75) {
    advice.push(
      "High humidity today: choose moisture-wicking fabrics to stay comfortable.",
    );
  }

  if (windMs > 7) {
    advice.push("It may feel colder in the wind: add a windproof outer layer.");
  }

  if (/(rain|drizzle|storm|snow)/.test(description)) {
    advice.push(
      "Wet conditions detected: prioritize water-resistant shoes and a compact umbrella.",
    );
  }

  if (!smartSuggestionsEnabled) {
    advice.push(
      "Enable Smart outfit suggestions in Settings for weather-adaptive recommendations.",
    );
  }

  return advice.slice(0, 4);
};

const buildPinterestLinks = (
  city: string,
  weather: any,
  unitSystem: UnitSystem,
): InspirationLink[] => {
  const rawTemp = Number(weather?.main?.temp ?? 0);
  const temp = unitSystem === "imperial" ? (rawTemp - 32) / 1.8 : rawTemp;
  const description = String(
    weather?.weather?.[0]?.description ?? "",
  ).toLowerCase();

  const seasonHint =
    temp < 8 ? "winter" : temp > 24 ? "summer" : "spring autumn";

  const moodHint = /(rain|drizzle|storm|snow)/.test(description)
    ? "rainy day"
    : "street style";

  const queries = [
    `${city} ${seasonHint} outfit ${moodHint}`,
    `${seasonHint} capsule wardrobe casual`,
    `${moodHint} outfit inspiration women men`,
  ];

  return queries.map((query, index) => ({
    label:
      index === 0
        ? "City look ideas"
        : index === 1
          ? "Capsule ideas"
          : "Street inspo",
    url: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`,
  }));
};

export default function Outfit() {
  const params = useLocalSearchParams<{ city?: string }>();
  const initialCity =
    typeof params.city === "string" && params.city.trim()
      ? params.city.trim()
      : "Warsaw";

  const [city, setCity] = useState(initialCity);
  const [submittedCity, setSubmittedCity] = useState(initialCity);
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [smartSuggestionsEnabled, setSmartSuggestionsEnabled] = useState(true);

  const unitLabel = unitSystem === "metric" ? "°C" : "°F";
  const windUnitLabel = unitSystem === "metric" ? "m/s" : "mph";

  const loadWeather = async (targetCity: string) => {
    const normalizedCity = targetCity.trim() || "Warsaw";

    try {
      setLoading(true);
      setError("");
      const settings = await getSettings();
      setUnitSystem(settings.unitSystem);
      setSmartSuggestionsEnabled(settings.smartSuggestions);

      const result = await getWeather(normalizedCity, settings.unitSystem);
      setWeather(result);
      setSubmittedCity(normalizedCity);
    } catch {
      setError("Could not build outfit advice for this city.");
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeather(initialCity);
  }, [initialCity]);

  const outfitPlan = useMemo(() => {
    if (!smartSuggestionsEnabled) {
      const rawTemp = Number(weather?.main?.temp ?? 0);
      const tempC = unitSystem === "imperial" ? (rawTemp - 32) / 1.8 : rawTemp;
      return buildBasicOutfitPlan(tempC);
    }

    return buildOutfitPlan(weather, unitSystem);
  }, [smartSuggestionsEnabled, unitSystem, weather]);

  const aiSuggestions = useMemo(
    () => buildAiSuggestions(weather, unitSystem, smartSuggestionsEnabled),
    [smartSuggestionsEnabled, unitSystem, weather],
  );

  const inspirationLinks = useMemo(
    () => buildPinterestLinks(submittedCity, weather, unitSystem),
    [submittedCity, unitSystem, weather],
  );

  const primaryPinterestUrl =
    inspirationLinks[0]?.url ?? "https://www.pinterest.com";

  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      // no-op
    }
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
          <Text style={styles.headerTag}>Smart styling</Text>
        </View>

        <Text style={styles.title}>Outfit details</Text>
        <Text style={styles.subtitle}>
          Recommendations tuned to the current weather in your city.
        </Text>

        <View style={styles.searchCard}>
          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="Search city"
            placeholderTextColor="#94A3B8"
            style={styles.input}
            returnKeyType="search"
            onSubmitEditing={() => loadWeather(city)}
            autoCapitalize="words"
          />

          <Pressable
            style={styles.primaryButton}
            onPress={() => loadWeather(city)}
          >
            <Text style={styles.primaryButtonText}>Refresh advice</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="large" color="#38BDF8" />
            <Text style={styles.stateText}>
              Checking weather and building a look...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.stateCard}>
            <Text style={styles.errorTitle}>No outfit suggestion yet</Text>
            <Text style={styles.stateText}>{error}</Text>
          </View>
        ) : (
          <>
            <View style={styles.heroCard}>
              <Text style={styles.heroBadge}>Current conditions</Text>
              <Text style={styles.heroCity}>
                {weather?.name ?? submittedCity}
              </Text>
              <Text style={styles.heroTemp}>
                {Math.round(weather?.main?.temp ?? 0)}
                {unitLabel}
              </Text>
              <Text style={styles.heroDescription}>
                {weather?.weather?.[0]?.description ?? "No data"}
              </Text>

              <View style={styles.metricsRow}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Feels like</Text>
                  <Text style={styles.metricValue}>
                    {Math.round(weather?.main?.feels_like ?? 0)}°
                  </Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Wind</Text>
                  <Text style={styles.metricValue}>
                    {Number(weather?.wind?.speed ?? 0).toFixed(1)}{" "}
                    {windUnitLabel}
                  </Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Humidity</Text>
                  <Text style={styles.metricValue}>
                    {weather?.main?.humidity ?? 0}%
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.planCard}>
              <Text style={styles.sectionEyebrow}>Recommended vibe</Text>
              <Text style={styles.planHeadline}>{outfitPlan.headline}</Text>
              <Text style={styles.planTip}>{outfitPlan.tip}</Text>
              {!smartSuggestionsEnabled && (
                <Text style={styles.modeHint}>
                  Smart suggestions are off in Settings, showing a basic plan.
                </Text>
              )}
            </View>

            <View style={styles.aiCard}>
              <Text style={styles.aiTitle}>
                ✨ AI suggestions & inspiration
              </Text>
              {aiSuggestions.slice(0, 2).map((tip) => (
                <Text key={tip} style={styles.aiListItem}>
                  • {tip}
                </Text>
              ))}

              <View style={styles.pinterestPreviewWrap}>
                <Text style={styles.pinterestPreviewTitle}>
                  Pinterest preview
                </Text>
                <View style={styles.pinterestFrame}>
                  <WebView
                    source={{ uri: primaryPinterestUrl }}
                    style={styles.pinterestWebView}
                    startInLoadingState
                    javaScriptEnabled
                    domStorageEnabled
                  />
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.pinSingleButton,
                  pressed && styles.pinSingleButtonPressed,
                ]}
                onPress={() => openLink(primaryPinterestUrl)}
              >
                <Text style={styles.pinSingleButtonText}>
                  Open 1 Pinterest photo
                </Text>
              </Pressable>
            </View>

            <View style={styles.listCard}>
              <Text style={styles.sectionTitle}>Layers</Text>
              {outfitPlan.layers.map((item) => (
                <Text key={item} style={styles.listItem}>
                  • {item}
                </Text>
              ))}
            </View>

            <View style={styles.listCard}>
              <Text style={styles.sectionTitle}>Accessories</Text>
              {outfitPlan.accessories.map((item) => (
                <Text key={item} style={styles.listItem}>
                  • {item}
                </Text>
              ))}
            </View>

            <View style={styles.footerCard}>
              <View style={styles.footerBlock}>
                <Text style={styles.footerLabel}>Shoes</Text>
                <Text style={styles.footerValue}>{outfitPlan.shoes}</Text>
              </View>
              <View style={styles.footerBlock}>
                <Text style={styles.footerLabel}>Why this works</Text>
                <Text style={styles.footerValue}>
                  The advice balances temperature, feels-like value, wind, and
                  wet conditions.
                </Text>
              </View>
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
    opacity: 0.24,
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
    marginTop: 4,
    textTransform: "capitalize",
    fontSize: 15,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "rgba(148,163,184,0.12)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  metricLabel: {
    color: "#94A3B8",
    fontSize: 11,
    marginBottom: 4,
  },
  metricValue: {
    color: "#E2E8F0",
    fontSize: 14,
    fontWeight: "700",
  },
  planCard: {
    marginTop: 18,
    backgroundColor: "rgba(56,189,248,0.14)",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(125,211,252,0.24)",
  },
  sectionEyebrow: {
    color: "#BAE6FD",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  planHeadline: {
    color: "#F8FAFC",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 8,
  },
  planTip: {
    color: "#D8F3FF",
    marginTop: 8,
    lineHeight: 22,
  },
  modeHint: {
    marginTop: 10,
    color: "#BAE6FD",
    fontSize: 12,
    lineHeight: 18,
  },
  aiCard: {
    marginTop: 14,
    backgroundColor: "rgba(34,211,238,0.12)",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.28)",
    gap: 8,
  },
  aiTitle: {
    color: "#CFFAFE",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 2,
  },
  aiListItem: {
    color: "#E0F2FE",
    lineHeight: 22,
  },
  pinterestPreviewWrap: {
    marginTop: 6,
    marginBottom: 8,
    gap: 8,
  },
  pinterestPreviewTitle: {
    color: "#BFDBFE",
    fontSize: 12,
    fontWeight: "700",
  },
  pinterestFrame: {
    height: 300,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.28)",
    backgroundColor: "rgba(15,23,42,0.82)",
  },
  pinterestWebView: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  pinSingleButton: {
    marginTop: 4,
    borderRadius: 10,
    backgroundColor: "rgba(56,189,248,0.16)",
    borderWidth: 1,
    borderColor: "rgba(125,211,252,0.35)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  pinSingleButtonPressed: {
    transform: [{ scale: 0.97 }],
    backgroundColor: "rgba(56,189,248,0.28)",
  },
  pinSingleButtonText: {
    color: "#E0F2FE",
    fontWeight: "700",
    fontSize: 13,
  },
  listCard: {
    marginTop: 14,
    backgroundColor: "rgba(15,23,42,0.82)",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.16)",
  },
  sectionTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  listItem: {
    color: "#CBD5E1",
    lineHeight: 24,
  },
  inspoWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  inspoButton: {
    borderRadius: 999,
    backgroundColor: "rgba(56,189,248,0.16)",
    borderWidth: 1,
    borderColor: "rgba(125,211,252,0.35)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inspoButtonPressed: {
    transform: [{ scale: 0.97 }],
    backgroundColor: "rgba(56,189,248,0.28)",
  },
  inspoButtonText: {
    color: "#E0F2FE",
    fontWeight: "700",
    fontSize: 12,
  },
  footerCard: {
    marginTop: 14,
    gap: 12,
  },
  footerBlock: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  footerLabel: {
    color: "#93C5FD",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  footerValue: {
    color: "#F8FAFC",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
  },
});

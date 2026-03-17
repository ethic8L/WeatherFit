import AsyncStorage from "@react-native-async-storage/async-storage";

export type UnitSystem = "metric" | "imperial";

export type AppSettings = {
  unitSystem: UnitSystem;
  notifications: boolean;
  autoLocation: boolean;
  smartSuggestions: boolean;
};

const SETTINGS_KEY = "@weatherfit/settings";

export const defaultSettings: AppSettings = {
  unitSystem: "metric",
  notifications: true,
  autoLocation: false,
  smartSuggestions: true,
};

export const getSettings = async (): Promise<AppSettings> => {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);

    if (!raw) return defaultSettings;

    const parsed = JSON.parse(raw) as Partial<AppSettings>;

    return {
      ...defaultSettings,
      ...parsed,
      unitSystem: parsed.unitSystem === "imperial" ? "imperial" : "metric",
    };
  } catch {
    return defaultSettings;
  }
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const updateSettings = async (
  patch: Partial<AppSettings>,
): Promise<AppSettings> => {
  const current = await getSettings();
  const next = {
    ...current,
    ...patch,
  };

  await saveSettings(next);
  return next;
};

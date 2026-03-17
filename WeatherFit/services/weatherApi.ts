import axios from "axios";
import type { UnitSystem } from "./settingsStorage";

const API_KEY = "8698d55ace5e706051ece2e63483d084";

export const getWeather = async (
  city: string,
  unitSystem: UnitSystem = "metric",
) => {
  const response = await axios.get(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${unitSystem}&appid=${API_KEY}`,
  );

  return response.data;
};

export const getForecast = async (
  city: string,
  unitSystem: UnitSystem = "metric",
) => {
  const response = await axios.get(
    `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=${unitSystem}&appid=${API_KEY}`,
  );

  return response.data;
};

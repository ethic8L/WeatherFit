import { View, Text, Button } from "react-native";
import { useEffect, useState } from "react";
import { getForecast } from "../services/weatherApi";

export default function Forecast() {

  const [data, setData] = useState<any>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await getForecast("Warsaw");
    setData(res);
  };

  return (
    <View>
      <Text>Forecast</Text>

      {data && data.list.slice(0,5).map((item:any, index:number) => (
        <Text key={index}>
          {item.dt_txt} - {item.main.temp}°C
        </Text>
      ))}

    </View>
  );
}
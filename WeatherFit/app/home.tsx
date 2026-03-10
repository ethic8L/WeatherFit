import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { useState } from "react";

export default function Home() {

  const [city, setCity] = useState("");

  return (
    <View style={styles.container}>

      <Text style={styles.title}>WeatherFit</Text>

      <TextInput
        placeholder="Enter city"
        value={city}
        onChangeText={setCity}
        style={styles.input}
      />

      <Button
        title="Check Weather"
        onPress={() => {}}
      />

    </View>
  );
}

const styles = StyleSheet.create({

  container:{
    flex:1,
    justifyContent:"center",
    alignItems:"center"
  },

  title:{
    fontSize:28,
    marginBottom:20
  },

  input:{
    width:200,
    borderWidth:1,
    padding:10,
    marginBottom:10
  }

});
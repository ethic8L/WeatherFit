import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useEffect, useRef } from "react";

export default function Index() {
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslateY = useRef(new Animated.Value(28)).current;
  const heroScale = useRef(new Animated.Value(0.95)).current;

  const topBlobShift = useRef(new Animated.Value(0)).current;
  const bottomBlobShift = useRef(new Animated.Value(0)).current;
  const startButtonPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(heroTranslateY, {
        toValue: 0,
        duration: 620,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(heroScale, {
        toValue: 1,
        friction: 8,
        tension: 55,
        useNativeDriver: true,
      }),
    ]).start();

    const blobLoop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(topBlobShift, {
            toValue: 1,
            duration: 2800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(topBlobShift, {
            toValue: 0,
            duration: 2800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(bottomBlobShift, {
            toValue: 1,
            duration: 3200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(bottomBlobShift, {
            toValue: 0,
            duration: 3200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(startButtonPulse, {
          toValue: 1.03,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(startButtonPulse, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    blobLoop.start();
    pulseLoop.start();

    return () => {
      blobLoop.stop();
      pulseLoop.stop();
    };
  }, [
    bottomBlobShift,
    heroOpacity,
    heroScale,
    heroTranslateY,
    startButtonPulse,
    topBlobShift,
  ]);

  const topBlobTranslateY = topBlobShift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 18],
  });

  const topBlobScale = topBlobShift.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });

  const bottomBlobTranslateY = bottomBlobShift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -16],
  });

  const bottomBlobScale = bottomBlobShift.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.bgCircleTop,
          {
            transform: [
              { translateY: topBlobTranslateY },
              { scale: topBlobScale },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.bgCircleBottom,
          {
            transform: [
              { translateY: bottomBlobTranslateY },
              { scale: bottomBlobScale },
            ],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.card,
          {
            opacity: heroOpacity,
            transform: [{ translateY: heroTranslateY }, { scale: heroScale }],
          },
        ]}
      >
        <Text style={styles.badge}>Smart Assistant</Text>
        <Text style={styles.title}>WeatherFit</Text>
        <Text style={styles.subtitle}>
          Pick an outfit and stay comfortable all day long, no matter the
          weather.
        </Text>

        <Animated.View style={{ transform: [{ scale: startButtonPulse }] }}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push("/home")}
          >
            <Text style={styles.buttonText}>Press to start</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
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
    shadowColor: "#38BDF8",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#082F49",
  },
});

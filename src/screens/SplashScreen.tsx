import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { api } from "../api/api";
import type { Availability } from "../types";

type Props = {
  navigation: { replace: (screen: string) => void };
};

export default function SplashScreen({ navigation }: Props) {
  const [progress, setProgress] = useState<number>(65);
  const [status, setStatus] = useState<string>("INITIALISING");
  const [error, setError] = useState<string>("");

  const pctText = useMemo(() => `${Math.round(progress)}%`, [progress]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    // Smooth “fake” progress while we do real checks
    timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return p;
        return p + 2;
      });
    }, 180);

    // Real backend check
    (async () => {
      try {
        setStatus("INITIALISING");
        setError("");

        // call backend (if this succeeds, server reachable)
        await api.get<Availability>("/plan/availability");

        // finish progress
        setProgress(100);
        setStatus("READY");

        setTimeout(() => {
          navigation.replace("Tabs"); // goes to main app
        }, 350);
      } catch (e) {
        setStatus("OFFLINE");
        setError("Could not reach server. Check BASE_URL / Wi-Fi.");
        setProgress(65);
      } finally {
        if (timer) clearInterval(timer);
      }
    })();

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [navigation]);

  const retry = async () => {
    setStatus("INITIALISING");
    setError("");
    setProgress(65);

    try {
      await api.get<Availability>("/plan/availability");
      setProgress(100);
      setStatus("READY");
      setTimeout(() => navigation.replace("Tabs"), 300);
    } catch {
      setStatus("OFFLINE");
      setError("Still offline. Make sure Spring Boot is running.");
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.centerWrap}>
        {/* Logo Card */}
        <View style={styles.logoCard}>
          {/* Simple icon using blocks (no external images needed) */}
          <View style={styles.iconGrid}>
            <View style={styles.block} />
            <View style={styles.block} />
            <View style={[styles.block, { opacity: 0 }]} />
            <View style={styles.block} />

            <View style={styles.block} />
            <View style={[styles.block, { opacity: 0 }]} />
            <View style={styles.block} />
            <View style={styles.block} />

            <View style={[styles.block, { opacity: 0 }]} />
            <View style={styles.block} />
            <View style={styles.block} />
            <View style={[styles.block, { opacity: 0 }]} />
          </View>

          <View style={styles.dot} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Smart Study Planner</Text>
        <Text style={styles.subtitle}>ALGORITHM-BASED STUDY SCHEDULING</Text>
      </View>

      {/* Bottom progress section */}
      <View style={styles.bottom}>
        <View style={styles.row}>
          <Text style={styles.initText}>{status}</Text>
          <Text style={styles.pct}>{pctText}</Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        <View style={{ marginTop: 14, alignItems: "center" }}>
          <ActivityIndicator />
        </View>

        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={retry} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },

  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  logoCard: {
    width: 112,
    height: 112,
    borderRadius: 24,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
    marginBottom: 18,
  },

  iconGrid: {
    width: 52,
    height: 52,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  block: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: "#1D4ED8",
  },
  dot: {
    position: "absolute",
    top: 18,
    right: 18,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#60A5FA",
  },

  title: { marginTop: 6, fontSize: 36, fontWeight: "900", color: "#0F172A", textAlign: "center" },
  subtitle: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.8,
    color: "#64748B",
    textAlign: "center",
  },

  bottom: {
    paddingHorizontal: 18,
    paddingBottom: 22,
  },

  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  initText: { fontSize: 13, fontWeight: "900", letterSpacing: 2.0, color: "#94A3B8" },
  pct: { fontSize: 16, fontWeight: "900", color: "#2563EB" },

  progressTrack: {
    marginTop: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 999, backgroundColor: "#2563EB" },

  errorBox: { marginTop: 16, alignItems: "center", gap: 10 },
  errorText: { color: "#B91C1C", fontWeight: "800", textAlign: "center" },
  retryBtn: {
    backgroundColor: "#0B0B0B",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  retryText: { color: "white", fontWeight: "900" },
});
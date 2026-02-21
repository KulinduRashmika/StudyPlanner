import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../api/api";
import type { Availability, StudySession } from "../types";

// Minimal prop typing (works without full navigation typing)
type Props = {
  navigation: {
    navigate: (screen: string) => void;
  };
};

function CircleIcon({ label }: { label: string }) {
  return (
    <View style={styles.circleIcon}>
      <Text style={styles.circleIconText}>{label}</Text>
    </View>
  );
}

function toISODate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function HomeScreen({ navigation }: Props) {
  const [minutesPerDay, setMinutesPerDay] = useState<number | null>(null);
  const [todayActive, setTodayActive] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>("");

  const todayISO = useMemo(() => toISODate(new Date()), []);

  const loadHomeData = useCallback(async () => {
    setLoading(true);
    setErrorText("");

    try {
      // 1) Availability
      const avRes = await api.get<Availability>("/plan/availability");
      setMinutesPerDay(avRes.data?.minutesPerDay ?? null);

      // 2) Sessions today -> count PLANNED
      const sRes = await api.get<StudySession[]>(
        `/sessions?from=${todayISO}&to=${todayISO}`
      );
      const list = Array.isArray(sRes.data) ? sRes.data : [];
      setTodayActive(list.filter((s) => s.status === "PLANNED").length);
    } catch (err) {
      setErrorText("Could not connect to backend. Check BASE_URL and network.");
    } finally {
      setLoading(false);
    }
  }, [todayISO]);

  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [loadHomeData])
  );

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Smart Study Planner</Text>
          <Text style={styles.subtitle}>Algorithm-Based Study Scheduling</Text>
        </View>

        <Pressable
          onPress={() => navigation.navigate("Settings")}
          style={({ pressed }) => [styles.avatarBtn, pressed && { opacity: 0.75 }]}
        >
          <CircleIcon label="👤" />
        </Pressable>
      </View>

      {/* Status card */}
      <View style={styles.card}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardKicker}>CURRENT STATUS</Text>
          <Text style={styles.cardTitle}>Daily Availability</Text>

          {loading && minutesPerDay === null ? (
            <View style={{ marginTop: 10 }}>
              <ActivityIndicator />
            </View>
          ) : (
            <Text style={styles.cardValue}>
              {minutesPerDay ?? "--"} minutes / day
            </Text>
          )}

          {!!errorText && <Text style={styles.error}>{errorText}</Text>}
        </View>

        <Pressable
          onPress={loadHomeData}
          style={({ pressed }) => [styles.refreshBtn, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.refreshIcon}>⟳</Text>
        </Pressable>
      </View>

      {/* Tiles */}
      <View style={styles.tileRow}>
        <View style={styles.tile}>
          <Text style={styles.tileIcon}>✦</Text>
          <Text style={styles.tileTop}>Smart Algorithm</Text>
          <Text style={styles.tileBottom}>Optimized</Text>
        </View>

        <View style={styles.tile}>
          <Text style={styles.tileIcon}>☑</Text>
          <Text style={styles.tileTop}>Tasks Today</Text>
          <Text style={styles.tileBottom}>
            {loading ? "..." : `${todayActive} Active`}
          </Text>
        </View>
      </View>

      {/* Big buttons */}
      <Pressable
        onPress={() => navigation.navigate("Subjects")}
        style={({ pressed }) => [styles.bigBtn, pressed && { transform: [{ scale: 0.99 }] }]}
      >
        <Text style={styles.bigBtnIcon}>🗒</Text>
        <Text style={styles.bigBtnText}>Manage Subjects</Text>
        <Text style={styles.bigBtnArrow}>›</Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate("Plan")}
        style={({ pressed }) => [styles.bigBtn, pressed && { transform: [{ scale: 0.99 }] }]}
      >
        <Text style={styles.bigBtnIcon}>📅</Text>
        <Text style={styles.bigBtnText}>Generate / View Plan</Text>
        <Text style={styles.bigBtnArrow}>›</Text>
      </Pressable>

      {/* Placeholder (optional) */}
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Analytics (optional)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "android" ? 16 : 10,
  },

  headerRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 34, fontWeight: "800", color: "#111827" },
  subtitle: { marginTop: 6, fontSize: 16, fontWeight: "600", color: "#64748B" },

  avatarBtn: { marginLeft: 12 },
  circleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  circleIconText: { fontSize: 18 },

  card: {
    marginTop: 18,
    backgroundColor: "white",
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardKicker: { fontSize: 13, fontWeight: "800", letterSpacing: 1.2, color: "#94A3B8" },
  cardTitle: { marginTop: 8, fontSize: 22, fontWeight: "800", color: "#0F172A" },
  cardValue: { marginTop: 8, fontSize: 18, fontWeight: "700", color: "#334155" },
  refreshBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  refreshIcon: { fontSize: 22, fontWeight: "900", color: "#0F172A" },
  error: { marginTop: 10, color: "#B91C1C", fontWeight: "600" },

  tileRow: { marginTop: 18, flexDirection: "row", gap: 14 },
  tile: {
    flex: 1,
    backgroundColor: "#E5E7EB",
    borderRadius: 18,
    paddingVertical: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  tileIcon: { fontSize: 26, marginBottom: 10 },
  tileTop: { fontSize: 14, fontWeight: "700", color: "#64748B" },
  tileBottom: { marginTop: 4, fontSize: 18, fontWeight: "900", color: "#0F172A" },

  bigBtn: {
    marginTop: 16,
    backgroundColor: "#0B0B0B",
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  bigBtnIcon: { fontSize: 20, marginRight: 12 },
  bigBtnText: { flex: 1, fontSize: 18, fontWeight: "800", color: "white" },
  bigBtnArrow: { fontSize: 26, fontWeight: "900", color: "white", opacity: 0.9 },

  placeholder: {
    marginTop: 18,
    height: 110,
    borderRadius: 18,
    backgroundColor: "#EEF2F7",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: { color: "#94A3B8", fontWeight: "700" },
});

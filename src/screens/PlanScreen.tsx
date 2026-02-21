import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../api/api";
import type { Availability, StudySession } from "../types";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function toISO(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function fromISO(iso: string) {
  const [y, m, d] = iso.split("-").map((x) => parseInt(x, 10));
  return new Date(y, m - 1, d);
}
function prettyDate(iso: string) {
  const d = fromISO(iso);
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  return `${months[d.getMonth()]} ${pad2(d.getDate())}, ${d.getFullYear()}`;
}

function formatTime12h(startTime?: string): string {
  if (!startTime) return "—";
  const parts = startTime.split(":");
  const hh = parseInt(parts[0] ?? "0", 10);
  const mm = parseInt(parts[1] ?? "0", 10);

  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = ((hh + 11) % 12) + 1;
  return `${pad2(h12)}:${pad2(mm)} ${ampm}`;
}

function sortByStartTime(a: StudySession, b: StudySession) {
  const ta = a.startTime ?? "99:99:99";
  const tb = b.startTime ?? "99:99:99";
  return ta.localeCompare(tb);
}

function statusBadge(status: StudySession["status"]) {
  if (status === "DONE") return ["#DCFCE7", "#166534", "DONE"] as const;
  if (status === "MISSED") return ["#FEE2E2", "#991B1B", "MISSED"] as const;
  return ["#FEF3C7", "#92400E", "PLANNED"] as const;
}

function extractBackendMessage(err: any): string {
  const data = err?.response?.data;
  return (
    data?.message ||
    data?.error ||
    (typeof data === "string" ? data : "") ||
    `Request failed (status ${err?.response?.status ?? "?"}). Check Spring Boot logs.`
  );
}

type Props = {
  navigation: { navigate: (screen: string) => void };
};

export default function PlanScreen({ navigation }: Props) {
  const [goalMinutes, setGoalMinutes] = useState<string>("120");
  const [chunkMinutes] = useState<number>(60);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [availability, setAvailability] = useState<number | null>(null);

  const selectedISO = useMemo(() => toISO(selectedDate), [selectedDate]);

  const loadAvailability = useCallback(async () => {
    const res = await api.get<Availability>("/plan/availability");
    setAvailability(res.data?.minutesPerDay ?? null);
    if (res.data?.minutesPerDay && goalMinutes.trim() === "") {
      setGoalMinutes(String(res.data.minutesPerDay));
    }
  }, [goalMinutes]);

  const loadSessionsForDay = useCallback(async (isoDay: string) => {
    const res = await api.get<StudySession[]>(`/sessions?from=${isoDay}&to=${isoDay}`);
    const list = Array.isArray(res.data) ? res.data : [];
    list.sort(sortByStartTime);
    setSessions(list);
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await loadAvailability();
      await loadSessionsForDay(selectedISO);
    } catch (err: any) {
      console.log("REFRESH ERROR:", err?.response?.status, err?.response?.data);
      Alert.alert("Backend error", extractBackendMessage(err));
    } finally {
      setLoading(false);
    }
  }, [loadAvailability, loadSessionsForDay, selectedISO]);

  useFocusEffect(
    useCallback(() => {
      refreshAll();
    }, [refreshAll])
  );

  const onChangeDate = (_: DateTimePickerEvent, picked?: Date) => {
    if (Platform.OS === "android") setShowPicker(false);
    if (!picked) return;
    setSelectedDate(picked);
    const iso = toISO(picked);
    loadSessionsForDay(iso).catch(() => {});
  };

  const generatePlan = async () => {
    const mins = parseInt(goalMinutes, 10);
    if (Number.isNaN(mins) || mins <= 0) {
      Alert.alert("Validation", "Enter a valid daily study minutes (e.g., 120).");
      return;
    }

    setLoading(true);
    try {
      await api.post("/plan/availability", { minutesPerDay: mins });

      const startISO = toISO(new Date());
      await api.post("/plan/generate", { startDate: startISO, chunkMinutes });

      await loadAvailability();
      await loadSessionsForDay(selectedISO);

      Alert.alert("Plan generated", "Your study plan has been updated.");
    } catch (err: any) {
      console.log("GENERATE ERROR:", err?.response?.status, err?.response?.data);
      Alert.alert("Backend error", extractBackendMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const markDone = async (sessionId: number) => {
    setLoading(true);
    try {
      await api.post(`/sessions/${sessionId}/done`);
      await loadSessionsForDay(selectedISO);
    } catch (err: any) {
      console.log("MARK DONE ERROR:", err?.response?.status, err?.response?.data);
      Alert.alert("Backend error", extractBackendMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const markDayMissed = async () => {
    Alert.alert("Mark day missed?", "This will reschedule future planned sessions.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reschedule",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            await api.post(`/sessions/missed?chunkMinutes=${chunkMinutes}`, { date: selectedISO });
            await loadSessionsForDay(selectedISO);
            Alert.alert("Rescheduled", "Future sessions were regenerated.");
          } catch (err: any) {
            console.log("MISSED ERROR:", err?.response?.status, err?.response?.data);
            Alert.alert("Backend error", extractBackendMessage(err));
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: StudySession }) => {
    const [bg, fg, label] = statusBadge(item.status);

    return (
      <View style={styles.sessionCard}>
        <View style={styles.sessionTopRow}>
          <Text style={styles.sessionTime}>{formatTime12h(item.startTime)}</Text>
          <View style={[styles.badge, { backgroundColor: bg }]}>
            <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
          </View>
        </View>

        <Text style={styles.sessionTitle}>{item.subject?.name ?? "Subject"}</Text>

        <View style={styles.sessionMetaRow}>
          <Text style={styles.metaIcon}>🕒</Text>
          <Text style={styles.sessionMeta}>{item.minutes} Minutes Allocated</Text>
        </View>

        {item.status === "PLANNED" ? (
          <Pressable
            onPress={() => markDone(item.id)}
            style={({ pressed }) => [styles.markDoneBtn, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.markDoneText}>✅  Mark Done</Text>
          </Pressable>
        ) : item.status === "DONE" ? (
          <View style={styles.completedBtn}>
            <Text style={styles.completedText}>✔ Completed</Text>
          </View>
        ) : (
          <View style={styles.missedBtn}>
            <Text style={styles.missedText}>✖ Missed</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Text style={styles.sparkle}>✦</Text>
        <Text style={styles.topTitle}>Study Planner</Text>
        <Pressable onPress={refreshAll} style={({ pressed }) => [styles.refresh, pressed && { opacity: 0.7 }]}>
          <Text style={styles.refreshText}>⟳</Text>
        </Pressable>
      </View>

      <Text style={styles.bigTitle}>Set Daily Goal</Text>
      <Text style={styles.label}>Daily Study Minutes</Text>

      <View style={styles.goalBox}>
        <Text style={styles.goalIcon}>⏱</Text>
        <TextInput
          value={goalMinutes}
          onChangeText={setGoalMinutes}
          placeholder={availability ? String(availability) : "120"}
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
          style={styles.goalInput}
        />
        <View style={styles.goalDivider} />
        <Text style={styles.goalUnit}>min</Text>
      </View>

      <Pressable onPress={generatePlan} style={({ pressed }) => [styles.generateBtn, pressed && { transform: [{ scale: 0.99 }] }]}>
        <Text style={styles.generateIcon}>⚡</Text>
        <Text style={styles.generateText}>Generate Plan</Text>
      </Pressable>

      <View style={styles.sessionsHeader}>
        <Text style={styles.sessionsTitle}>Study Sessions</Text>
        <Pressable onPress={() => setShowPicker(true)} style={({ pressed }) => [styles.datePill, pressed && { opacity: 0.8 }]}>
          <Text style={styles.datePillText}>{prettyDate(selectedISO)}</Text>
        </Pressable>
      </View>

      <Pressable onPress={markDayMissed} style={({ pressed }) => [styles.missedDay, pressed && { opacity: 0.8 }]}>
        <Text style={styles.missedDayText}>Mark this day missed & reschedule</Text>
      </Pressable>

      {loading && (
        <View style={{ paddingVertical: 10 }}>
          <ActivityIndicator />
        </View>
      )}

      <FlatList
        data={sessions}
        keyExtractor={(x) => String(x.id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ paddingTop: 20 }}>
            <Text style={{ color: "#64748B", fontWeight: "700" }}>
              No sessions for this date. Generate a plan first.
            </Text>
          </View>
        }
      />

      {showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onChangeDate}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F6F8", paddingHorizontal: 18, paddingTop: Platform.OS === "android" ? 12 : 0 },

  topBar: { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sparkle: { fontSize: 22, fontWeight: "900", color: "#0F172A" },
  topTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  refresh: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  refreshText: { fontSize: 20, fontWeight: "900", color: "#0F172A" },

  bigTitle: { marginTop: 12, fontSize: 30, fontWeight: "900", color: "#0F172A" },
  label: { marginTop: 16, fontSize: 14, fontWeight: "800", color: "#64748B" },

  goalBox: {
    marginTop: 10, backgroundColor: "#EEF2F7", borderRadius: 18, borderWidth: 1, borderColor: "#E2E8F0",
    paddingHorizontal: 14, paddingVertical: 14, flexDirection: "row", alignItems: "center",
  },
  goalIcon: { fontSize: 20, marginRight: 10, color: "#64748B" },
  goalInput: { flex: 1, fontSize: 22, fontWeight: "900", color: "#0F172A" },
  goalDivider: { width: 1, height: 28, backgroundColor: "#CBD5E1", marginHorizontal: 12 },
  goalUnit: { fontSize: 18, fontWeight: "800", color: "#64748B" },

  generateBtn: {
    marginTop: 18, backgroundColor: "#0B0B0B", borderRadius: 22, paddingVertical: 18,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 2,
  },
  generateIcon: { color: "white", fontSize: 18 },
  generateText: { color: "white", fontSize: 20, fontWeight: "900" },

  sessionsHeader: { marginTop: 22, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sessionsTitle: { fontSize: 22, fontWeight: "900", color: "#0F172A" },
  datePill: { backgroundColor: "#F1F5F9", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: "#E2E8F0" },
  datePillText: { fontSize: 13, fontWeight: "900", color: "#64748B", letterSpacing: 0.6 },

  missedDay: { marginTop: 10, alignSelf: "flex-start" },
  missedDayText: { color: "#B91C1C", fontWeight: "800" },

  sessionCard: {
    marginTop: 14, backgroundColor: "white", borderRadius: 18, borderWidth: 1, borderColor: "#E2E8F0",
    padding: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 1,
  },
  sessionTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sessionTime: { fontSize: 14, fontWeight: "900", color: "#94A3B8", letterSpacing: 1.2 },
  badge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText: { fontWeight: "900", letterSpacing: 0.8, fontSize: 12 },

  sessionTitle: { marginTop: 10, fontSize: 24, fontWeight: "900", color: "#0F172A" },
  sessionMetaRow: { marginTop: 10, flexDirection: "row", alignItems: "center" },
  metaIcon: { marginRight: 8 },
  sessionMeta: { fontSize: 16, fontWeight: "800", color: "#64748B" },

  markDoneBtn: {
    marginTop: 14, borderRadius: 16, borderWidth: 2, borderColor: "#BBF7D0",
    paddingVertical: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#F0FDF4",
  },
  markDoneText: { color: "#16A34A", fontWeight: "900", fontSize: 18 },

  completedBtn: { marginTop: 14, borderRadius: 16, paddingVertical: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#34D399" },
  completedText: { color: "white", fontWeight: "900", fontSize: 18 },

  missedBtn: { marginTop: 14, borderRadius: 16, paddingVertical: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#FEE2E2" },
  missedText: { color: "#991B1B", fontWeight: "900", fontSize: 18 },
});
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { api } from "../api/api";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function toISO(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function prettyMonthYear(d: Date) {
  const months = [
    "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",
  ];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

type Props = {
  navigation: { goBack: () => void; navigate: (s: string, params?: any) => void };
  route?: {
    params?: {
      // optionally pass a date from PlanScreen
      dateISO?: string;
      chunkMinutes?: number;
      // optional callback to refresh previous screen
      onRescheduled?: () => void;
    };
  };
};

export default function RescheduleScreen({ navigation, route }: Props) {
  const chunkMinutes = route?.params?.chunkMinutes ?? 60;

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const iso = route?.params?.dateISO;
    if (!iso) return new Date();
    const [y, m, d] = iso.split("-").map((x) => parseInt(x, 10));
    return new Date(y, m - 1, d);
  });

  const [showPicker, setShowPicker] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedISO = useMemo(() => toISO(selectedDate), [selectedDate]);
  const monthTitle = useMemo(() => prettyMonthYear(selectedDate), [selectedDate]);

  const onChange = (_: DateTimePickerEvent, picked?: Date) => {
    if (Platform.OS === "android") setShowPicker(false);
    if (picked) setSelectedDate(picked);
  };

  const confirmReschedule = async () => {
    setLoading(true);
    try {
      await api.post(`/sessions/missed?chunkMinutes=${chunkMinutes}`, { date: selectedISO });

      // notify previous screen (optional)
      route?.params?.onRescheduled?.();

      setShowConfirm(false);
      Alert.alert("Rescheduled", "Your plan has been updated.");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Backend error", "Could not reschedule. Check server / network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.topBar}>
        <Pressable onPress={navigation.goBack} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.topTitle}>Reschedule</Text>
        <View style={{ width: 42 }} />
      </View>

      {/* Title */}
      <Text style={styles.bigTitle}>Missed a Day?</Text>
      <Text style={styles.subtitle}>
        Select the date you missed. The algorithm will automatically recalculate your remaining
        tasks to keep your progress on track.
      </Text>

      {/* Simple “calendar selector” (fast + reliable) */}
      <View style={styles.calendarBox}>
        <View style={styles.calendarHeader}>
          <Pressable
            onPress={() => {
              const d = new Date(selectedDate);
              d.setMonth(d.getMonth() - 1);
              setSelectedDate(d);
            }}
            style={styles.calNavBtn}
          >
            <Text style={styles.calNavText}>‹</Text>
          </Pressable>

          <Text style={styles.calHeaderText}>{monthTitle}</Text>

          <Pressable
            onPress={() => {
              const d = new Date(selectedDate);
              d.setMonth(d.getMonth() + 1);
              setSelectedDate(d);
            }}
            style={styles.calNavBtn}
          >
            <Text style={styles.calNavText}>›</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => setShowPicker(true)}
          style={({ pressed }) => [styles.dateSelect, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.dateSelectText}>{selectedISO}</Text>
          <Text style={styles.dateSelectIcon}>📅</Text>
        </Pressable>

        <Text style={styles.helper}>
          Selected date will be marked as missed and future sessions will be regenerated.
        </Text>
      </View>

      {/* CTA */}
      <Pressable
        onPress={() => setShowConfirm(true)}
        style={({ pressed }) => [styles.primaryBtn, pressed && { transform: [{ scale: 0.99 }] }]}
      >
        <Text style={styles.primaryBtnText}>Reschedule Plan</Text>
      </Pressable>

      {/* Date picker */}
      {showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onChange}
        />
      )}

      {/* Confirm Modal (Bottom Sheet) */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirm(false)}
      >
        {/* Dim/blur background */}
        <Pressable style={styles.overlay} onPress={() => setShowConfirm(false)}>
          <View />
        </Pressable>

        <View style={styles.sheetWrap}>
          <View style={styles.sheet}>
            <View style={styles.warnIconCircle}>
              <Text style={styles.warnIcon}>⚠</Text>
            </View>

            <Text style={styles.sheetTitle}>Are you sure?</Text>
            <Text style={styles.sheetText}>
              This will recalculate your study weights and update your plan for the rest of the
              week. This action cannot be undone.
            </Text>

            <Pressable
              onPress={confirmReschedule}
              disabled={loading}
              style={({ pressed }) => [
                styles.confirmBtn,
                pressed && !loading && { transform: [{ scale: 0.99 }] },
                loading && { opacity: 0.75 },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmBtnText}>Confirm Reschedule</Text>
              )}
            </Pressable>

            <Pressable onPress={() => setShowConfirm(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F6F8",
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "android" ? 12 : 0,
  },

  topBar: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  backText: { fontSize: 28, fontWeight: "900", color: "#0F172A" },
  topTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A" },

  bigTitle: { marginTop: 10, fontSize: 34, fontWeight: "900", color: "#0F172A" },
  subtitle: { marginTop: 10, fontSize: 15, fontWeight: "700", color: "#64748B", lineHeight: 22 },

  calendarBox: {
    marginTop: 22,
    backgroundColor: "white",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  calNavText: { fontSize: 20, fontWeight: "900", color: "#0F172A" },
  calHeaderText: { fontSize: 16, fontWeight: "900", color: "#0F172A" },

  dateSelect: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dateSelectText: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  dateSelectIcon: { fontSize: 18 },
  helper: { marginTop: 10, fontSize: 13, fontWeight: "700", color: "#64748B" },

  primaryBtn: {
    marginTop: 18,
    backgroundColor: "#0B0B0B",
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "white", fontSize: 18, fontWeight: "900" },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheetWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
  },
  sheet: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 22,
    alignItems: "center",
  },

  warnIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  warnIcon: { fontSize: 24 },

  sheetTitle: { fontSize: 26, fontWeight: "900", color: "#0F172A", marginTop: 8 },
  sheetText: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "700",
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
  },

  confirmBtn: {
    marginTop: 18,
    width: "100%",
    backgroundColor: "#0B0B0B",
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: { color: "white", fontSize: 18, fontWeight: "900" },

  cancelBtn: { marginTop: 14, paddingVertical: 10 },
  cancelText: { color: "#64748B", fontSize: 16, fontWeight: "800" },
});
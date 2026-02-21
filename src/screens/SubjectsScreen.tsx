import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  Alert,
  Platform,
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import Slider from "@react-native-community/slider";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../api/api";
import type { Subject } from "../types";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toMMDDYYYY(d: Date): string {
  return `${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}/${d.getFullYear()}`;
}

function parseISOToDate(iso: string): Date {
  // iso: YYYY-MM-DD
  const [y, m, d] = iso.split("-").map((x) => parseInt(x, 10));
  return new Date(y, m - 1, d);
}

function formatExamLabel(iso: string): string {
  // Example: "EXAM: DEC 12, 2024"
  const d = parseISOToDate(iso);
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  return `EXAM: ${months[d.getMonth()]} ${pad2(d.getDate())}, ${d.getFullYear()}`;
}

type Props = {
  navigation: { goBack: () => void };
};

export default function SubjectsScreen({ navigation }: Props) {
  // Form state
  const [name, setName] = useState("");
  const [hoursRequired, setHoursRequired] = useState<string>("");
  const [difficulty, setDifficulty] = useState<number>(3);
  const [examDate, setExamDate] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);

  // Data
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const activeCount = subjects.length;

  const examDateDisplay = useMemo(() => toMMDDYYYY(examDate), [examDate]);

  const loadSubjects = useCallback(async () => {
    try {
      const res = await api.get<Subject[]>("/subjects");
      setSubjects(Array.isArray(res.data) ? res.data : []);
    } catch {
      Alert.alert("Backend error", "Could not load subjects. Check BASE_URL / server.");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSubjects();
    }, [loadSubjects])
  );

  const onDateChange = (_event: DateTimePickerEvent, selected?: Date) => {
    // Android closes picker automatically; iOS may stay open
    if (Platform.OS === "android") setShowPicker(false);
    if (selected) setExamDate(selected);
  };

  const validateForm = () => {
    if (!name.trim()) return "Please enter subject name.";
    const hrs = parseInt(hoursRequired, 10);
    if (Number.isNaN(hrs) || hrs <= 0) return "Please enter valid hours required (e.g., 10).";
    if (difficulty < 1 || difficulty > 5) return "Difficulty must be between 1 and 5.";
    return "";
  };

  const addSubject = async () => {
    const msg = validateForm();
    if (msg) {
      Alert.alert("Validation", msg);
      return;
    }

    const hrs = parseInt(hoursRequired, 10);

    try {
      await api.post("/subjects", {
        name: name.trim(),
        examDate: toISODate(examDate), // backend expects YYYY-MM-DD
        difficulty,
        hoursRequired: hrs,
        minutesDone: 0,
      });

      // Reset minimal fields like your UI
      setName("");
      setHoursRequired("");
      setDifficulty(3);

      await loadSubjects();
      Alert.alert("Success", "Subject added.");
    } catch {
      Alert.alert("Backend error", "Could not add subject. Check backend validation.");
    }
  };

  const deleteSubject = async (id: number) => {
    Alert.alert("Delete subject?", "This will remove the subject.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/subjects/${id}`);
            await loadSubjects();
          } catch {
            Alert.alert("Backend error", "Could not delete subject.");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Subject }) => {
    return (
      <View style={styles.subjectCard}>
        <View style={styles.subjectHeaderRow}>
          <Text style={styles.subjectTitle}>{item.name}</Text>

          <Pressable
            onPress={() => deleteSubject(item.id)}
            style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.deleteBtnText}>✕</Text>
          </Pressable>
        </View>

        <Text style={styles.subjectExam}>{formatExamLabel(item.examDate)}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>🕒 {item.hoursRequired}h total</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>📊 Diff: {item.difficulty}/5</Text>
        </View>

        {/* Progress bar (simple; progress based on minutesDone vs hoursRequired) */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(
                  100,
                  Math.round(
                    (item.minutesDone / Math.max(1, item.hoursRequired * 60)) * 100
                  )
                )}%`,
              },
            ]}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={navigation.goBack}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <Text style={styles.topTitle}>Manage Study Subjects</Text>

        <Pressable style={styles.moreBtn}>
          <Text style={styles.moreText}>⋯</Text>
        </Pressable>
      </View>

      {/* Add new subject */}
      <Text style={styles.sectionTitle}>Add New Subject</Text>

      <Text style={styles.label}>Subject Name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. Algorithms & Data Structures"
        placeholderTextColor="#94A3B8"
        style={styles.input}
      />

      <View style={styles.row2}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Exam Date</Text>
          <Pressable
            onPress={() => setShowPicker(true)}
            style={({ pressed }) => [styles.input, styles.dateInput, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.dateText}>{examDateDisplay}</Text>
            <Text style={styles.dateIcon}>📅</Text>
          </Pressable>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Hours Required</Text>
          <TextInput
            value={hoursRequired}
            onChangeText={setHoursRequired}
            placeholder="Total hrs"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            style={styles.input}
          />
        </View>
      </View>

      <View style={styles.diffRow}>
        <Text style={styles.label}>Difficulty (1-5)</Text>
        <Text style={styles.levelText}>Level {difficulty}</Text>
      </View>

      <View style={styles.sliderBox}>
        <Slider
          minimumValue={1}
          maximumValue={5}
          step={1}
          value={difficulty}
          onValueChange={(v) => setDifficulty(v)}
          minimumTrackTintColor="#0F172A"
          maximumTrackTintColor="#E2E8F0"
          thumbTintColor="#0F172A"
        />
      </View>

      <Pressable
        onPress={addSubject}
        style={({ pressed }) => [styles.addBtn, pressed && { transform: [{ scale: 0.99 }] }]}
      >
        <Text style={styles.addBtnPlus}>＋</Text>
        <Text style={styles.addBtnText}>Add Subject</Text>
      </Pressable>

      {/* Subjects list header */}
      <View style={styles.listHeaderRow}>
        <Text style={styles.sectionTitle2}>Your Subjects</Text>
        <Text style={styles.activeText}>{activeCount} subjects active</Text>
      </View>

      <FlatList
        data={subjects}
        keyExtractor={(it) => String(it.id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Date picker */}
      {showPicker && (
        <DateTimePicker
          value={examDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onDateChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F6F8",
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "android" ? 10 : 0,
  },

  topBar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { fontSize: 28, fontWeight: "900", color: "#0F172A" },
  topTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  moreBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  moreText: { fontSize: 26, fontWeight: "900", color: "#0F172A" },

  sectionTitle: { fontSize: 26, fontWeight: "900", color: "#0F172A", marginTop: 8 },
  label: { marginTop: 16, fontSize: 14, fontWeight: "800", color: "#475569" },

  input: {
    marginTop: 8,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: "#0F172A",
  },

  row2: { flexDirection: "row", gap: 12 },

  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateText: { fontSize: 16, fontWeight: "700", color: "#94A3B8" },
  dateIcon: { fontSize: 18 },

  diffRow: { marginTop: 16, flexDirection: "row", justifyContent: "space-between" },
  levelText: { marginTop: 16, fontSize: 14, fontWeight: "800", color: "#0F172A" },

  sliderBox: {
    marginTop: 10,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  addBtn: {
    marginTop: 18,
    backgroundColor: "#0B0B0B",
    borderRadius: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  addBtnPlus: { color: "white", fontSize: 18, fontWeight: "900" },
  addBtnText: { color: "white", fontSize: 18, fontWeight: "900" },

  listHeaderRow: {
    marginTop: 22,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  sectionTitle2: { fontSize: 24, fontWeight: "900", color: "#0F172A" },
  activeText: { fontSize: 14, fontWeight: "800", color: "#64748B" },

  subjectCard: {
    backgroundColor: "white",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    marginBottom: 12,
  },
  subjectHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  subjectTitle: { fontSize: 20, fontWeight: "900", color: "#0F172A", flex: 1, paddingRight: 10 },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnText: { fontSize: 16, fontWeight: "900", color: "#0F172A" },

  subjectExam: { marginTop: 8, fontSize: 13, fontWeight: "900", letterSpacing: 0.6, color: "#64748B" },

  metaRow: { marginTop: 12, flexDirection: "row", alignItems: "center" },
  metaText: { fontSize: 14, fontWeight: "800", color: "#0F172A" },
  metaDot: { marginHorizontal: 10, color: "#94A3B8", fontWeight: "900" },

  progressTrack: {
    marginTop: 12,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#0F172A" },
});
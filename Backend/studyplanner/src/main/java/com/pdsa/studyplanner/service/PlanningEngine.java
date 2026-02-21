package com.pdsa.studyplanner.service;

import com.pdsa.studyplanner.model.Subject;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

public class PlanningEngine {

    public static class PlannedItem {
        public final Long subjectId;
        public final LocalDate date;
        public final LocalTime startTime; // ✅ NEW
        public final int minutes;

        public PlannedItem(Long subjectId, LocalDate date, LocalTime startTime, int minutes) {
            this.subjectId = subjectId;
            this.date = date;
            this.startTime = startTime;
            this.minutes = minutes;
        }
    }

    private static class Node {
        Subject subject;
        int remainingMinutes;
        double score;

        Node(Subject s, int remainingMinutes, double score) {
            this.subject = s;
            this.remainingMinutes = remainingMinutes;
            this.score = score;
        }
    }

    /**
     * Greedy plan generation using a max-heap by score.
     * Adds realistic time slots per day.
     */
    public List<PlannedItem> generatePlan(
            List<Subject> subjects,
            LocalDate startDate,
            int minutesPerDay,
            int chunkMinutes
    ) {

        if (minutesPerDay <= 0) return List.of();
        if (chunkMinutes <= 0) chunkMinutes = 60;

        LocalDate lastExam = subjects.stream()
                .map(Subject::getExamDate)
                .max(LocalDate::compareTo)
                .orElse(startDate);

        Map<Long, Integer> remaining = new HashMap<>();
        for (Subject s : subjects) {
            remaining.put(s.getId(), s.getMinutesRemaining());
        }

        List<PlannedItem> plan = new ArrayList<>();

        // ✅ Choose a realistic daily start time (evening study)
        final LocalTime dayStartTime = LocalTime.of(18, 0); // 6:00 PM

        for (LocalDate day = startDate; !day.isAfter(lastExam); day = day.plusDays(1)) {
            int free = minutesPerDay;

            // time pointer within the day
            LocalTime cursor = dayStartTime;

            PriorityQueue<Node> heap = new PriorityQueue<>((a, b) -> Double.compare(b.score, a.score));

            for (Subject s : subjects) {
                int rem = remaining.getOrDefault(s.getId(), 0);
                if (rem <= 0) continue;
                if (day.isAfter(s.getExamDate())) continue;
                heap.add(new Node(s, rem, score(s, day, rem)));
            }

            while (free > 0 && !heap.isEmpty()) {
                Node top = heap.poll();

                int allocate = Math.min(chunkMinutes, free);
                allocate = Math.min(allocate, top.remainingMinutes);
                if (allocate <= 0) continue;

                // ✅ Use cursor as session start time
                plan.add(new PlannedItem(top.subject.getId(), day, cursor, allocate));

                free -= allocate;
                int newRem = top.remainingMinutes - allocate;
                remaining.put(top.subject.getId(), newRem);

                // ✅ advance time cursor by allocated minutes (+ optional break)
                cursor = cursor.plusMinutes(allocate);

                // Optional: add 10-minute break after each session
                cursor = cursor.plusMinutes(10);

                if (newRem > 0) {
                    heap.add(new Node(top.subject, newRem, score(top.subject, day, newRem)));
                }
            }
        }

        return plan;
    }

    private double score(Subject s, LocalDate today, int remainingMinutes) {
        long daysLeft = ChronoUnit.DAYS.between(today, s.getExamDate());
        double urgency = 1.0 / Math.max(daysLeft, 1);
        double diff = s.getDifficulty();
        double remainingHours = remainingMinutes / 60.0;

        double w1 = 10.0;
        double w2 = 2.0;
        double w3 = 1.0;

        return w1 * urgency + w2 * diff + w3 * remainingHours;
    }
}
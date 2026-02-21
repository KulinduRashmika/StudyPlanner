package com.pdsa.studyplanner.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

@Entity
@Table(name = "subjects")
public class Subject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String name;

    @NotNull
    private LocalDate examDate;

    @Min(1) @Max(5)
    private int difficulty; // 1..5

    @Min(1)
    private int hoursRequired; // total hours

    @Min(0)
    private int minutesDone; // track progress

    public Subject() {}

    // getters/setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public LocalDate getExamDate() { return examDate; }
    public void setExamDate(LocalDate examDate) { this.examDate = examDate; }

    public int getDifficulty() { return difficulty; }
    public void setDifficulty(int difficulty) { this.difficulty = difficulty; }

    public int getHoursRequired() { return hoursRequired; }
    public void setHoursRequired(int hoursRequired) { this.hoursRequired = hoursRequired; }

    public int getMinutesDone() { return minutesDone; }
    public void setMinutesDone(int minutesDone) { this.minutesDone = minutesDone; }

    @Transient
    public int getMinutesRequired() {
        return hoursRequired * 60;
    }

    @Transient
    public int getMinutesRemaining() {
        return Math.max(0, getMinutesRequired() - minutesDone);
    }
}
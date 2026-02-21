package com.pdsa.studyplanner.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "study_sessions")
public class StudySession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    private Subject subject;

    private LocalDate date;

    // ✅ ensures JSON gives "18:00:00"
    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime startTime;

    @Min(1)
    private int minutes;

    @Enumerated(EnumType.STRING)
    private SessionStatus status = SessionStatus.PLANNED;

    // ✅ REQUIRED by JPA
    public StudySession() {}

    // ✅ Optional: keep 3-arg constructor (sets time default)
    public StudySession(Subject subject, LocalDate date, int minutes) {
        this(subject, date, LocalTime.of(18, 0), minutes); // default 6:00 PM
    }

    // ✅ Main constructor used by the planner (REAL one)
    public StudySession(Subject subject, LocalDate date, LocalTime startTime, int minutes) {
        this.subject = subject;
        this.date = date;
        this.startTime = startTime;
        this.minutes = minutes;
        this.status = SessionStatus.PLANNED;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Subject getSubject() { return subject; }
    public void setSubject(Subject subject) { this.subject = subject; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }

    public int getMinutes() { return minutes; }
    public void setMinutes(int minutes) { this.minutes = minutes; }

    public SessionStatus getStatus() { return status; }
    public void setStatus(SessionStatus status) { this.status = status; }
}
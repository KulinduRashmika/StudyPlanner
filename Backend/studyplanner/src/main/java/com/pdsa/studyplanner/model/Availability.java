package com.pdsa.studyplanner.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;

@Entity
@Table(name = "availability")
public class Availability {

    @Id
    private Long id = 1L; // single row

    @Min(0)
    private int minutesPerDay;

    public Availability() {}

    public Availability(int minutesPerDay) {
        this.minutesPerDay = minutesPerDay;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public int getMinutesPerDay() { return minutesPerDay; }
    public void setMinutesPerDay(int minutesPerDay) { this.minutesPerDay = minutesPerDay; }
}
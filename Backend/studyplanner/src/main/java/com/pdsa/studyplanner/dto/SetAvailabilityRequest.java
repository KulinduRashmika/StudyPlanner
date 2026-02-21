package com.pdsa.studyplanner.dto;

import jakarta.validation.constraints.Min;

public class SetAvailabilityRequest {
    @Min(0)
    private int minutesPerDay;

    public int getMinutesPerDay() { return minutesPerDay; }
    public void setMinutesPerDay(int minutesPerDay) { this.minutesPerDay = minutesPerDay; }
}
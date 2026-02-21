package com.pdsa.studyplanner.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class GeneratePlanRequest {

    @NotNull
    private LocalDate startDate;

    @Min(15)
    private int chunkMinutes = 60; // session chunk size

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public int getChunkMinutes() { return chunkMinutes; }
    public void setChunkMinutes(int chunkMinutes) { this.chunkMinutes = chunkMinutes; }
}
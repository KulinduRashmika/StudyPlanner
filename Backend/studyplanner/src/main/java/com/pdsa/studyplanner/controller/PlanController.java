package com.pdsa.studyplanner.controller;

import com.pdsa.studyplanner.dto.GeneratePlanRequest;
import com.pdsa.studyplanner.dto.SetAvailabilityRequest;
import com.pdsa.studyplanner.model.Availability;
import com.pdsa.studyplanner.model.StudySession;
import com.pdsa.studyplanner.service.PlanningService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/plan")
public class PlanController {

    private final PlanningService planningService;

    public PlanController(PlanningService planningService) {
        this.planningService = planningService;
    }

    @GetMapping("/availability")
    public Availability getAvailability() {
        return planningService.getOrCreateAvailability();
    }

    @PostMapping("/availability")
    public Availability setAvailability(@Valid @RequestBody SetAvailabilityRequest req) {
        return planningService.setMinutesPerDay(req.getMinutesPerDay());
    }

    @PostMapping("/generate")
    public List<StudySession> generate(@Valid @RequestBody GeneratePlanRequest req) {
        return planningService.generatePlan(req.getStartDate(), req.getChunkMinutes());
    }
}
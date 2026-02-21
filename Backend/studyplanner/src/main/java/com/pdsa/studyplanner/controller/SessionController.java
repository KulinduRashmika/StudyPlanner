package com.pdsa.studyplanner.controller;

import com.pdsa.studyplanner.dto.MarkMissedRequest;
import com.pdsa.studyplanner.model.StudySession;
import com.pdsa.studyplanner.service.PlanningService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/sessions")
public class SessionController {

    private final PlanningService planningService;

    public SessionController(PlanningService planningService) {
        this.planningService = planningService;
    }

    @GetMapping
    public List<StudySession> list(@RequestParam LocalDate from, @RequestParam LocalDate to) {
        return planningService.getSessions(from, to);
    }

    @PostMapping("/missed")
    public List<StudySession> markMissed(@Valid @RequestBody MarkMissedRequest req,
                                         @RequestParam(defaultValue = "60") int chunkMinutes) {
        return planningService.markDayMissedAndReschedule(req.getDate(), chunkMinutes);
    }

    @PostMapping("/{id}/done")
    public StudySession markDone(@PathVariable Long id) {
        return planningService.markSessionDone(id);
    }
}
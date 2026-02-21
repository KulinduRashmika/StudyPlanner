package com.pdsa.studyplanner.service;

import com.pdsa.studyplanner.model.*;
import com.pdsa.studyplanner.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
public class PlanningService {

    private final SubjectRepository subjectRepo;
    private final AvailabilityRepository availabilityRepo;
    private final StudySessionRepository sessionRepo;

    public PlanningService(SubjectRepository subjectRepo,
                           AvailabilityRepository availabilityRepo,
                           StudySessionRepository sessionRepo) {
        this.subjectRepo = subjectRepo;
        this.availabilityRepo = availabilityRepo;
        this.sessionRepo = sessionRepo;
    }

    public Availability getOrCreateAvailability() {
        return availabilityRepo.findById(1L).orElseGet(() -> availabilityRepo.save(new Availability(180)));
    }

    @Transactional
    public Availability setMinutesPerDay(int minutesPerDay) {
        Availability a = getOrCreateAvailability();
        a.setMinutesPerDay(minutesPerDay);
        return availabilityRepo.save(a);
    }

    @Transactional
    public List<StudySession> generatePlan(LocalDate startDate, int chunkMinutes) {
        Availability availability = getOrCreateAvailability();
        int minutesPerDay = availability.getMinutesPerDay();

        // delete PLANNED from startDate onwards
        List<StudySession> future = sessionRepo.findByDateGreaterThanEqual(startDate);
        for (StudySession s : future) {
            if (s.getStatus() == SessionStatus.PLANNED) {
                sessionRepo.delete(s);
            }
        }

        List<Subject> subjects = subjectRepo.findAll();
        if (subjects.isEmpty()) {
            throw new IllegalStateException("No subjects found. Add subjects first.");
        }

        PlanningEngine engine = new PlanningEngine();
        List<PlanningEngine.PlannedItem> items =
                engine.generatePlan(subjects, startDate, minutesPerDay, chunkMinutes);

        Map<Long, Subject> subjectMap = new HashMap<>();
        for (Subject sub : subjects) subjectMap.put(sub.getId(), sub);

        List<StudySession> saved = new ArrayList<>();

        for (PlanningEngine.PlannedItem it : items) {
            Subject subj = subjectMap.get(it.subjectId);
            if (subj == null) continue;

            // ✅ FIX: save startTime from PlanningEngine
            StudySession sess = new StudySession(subj, it.date, it.startTime, it.minutes);
            sess.setStatus(SessionStatus.PLANNED);

            saved.add(sessionRepo.save(sess));
        }

        return saved;
    }

    @Transactional
    public List<StudySession> markDayMissedAndReschedule(LocalDate date, int chunkMinutes) {
        List<StudySession> daySessions = sessionRepo.findByDate(date);

        for (StudySession s : daySessions) {
            if (s.getStatus() == SessionStatus.PLANNED) {
                s.setStatus(SessionStatus.MISSED);
                sessionRepo.save(s);
            }
        }

        LocalDate start = date.plusDays(1);

        List<StudySession> future = sessionRepo.findByDateGreaterThanEqual(start);
        for (StudySession s : future) {
            if (s.getStatus() == SessionStatus.PLANNED) {
                sessionRepo.delete(s);
            }
        }

        return generatePlan(start, chunkMinutes);
    }

    @Transactional
    public StudySession markSessionDone(Long sessionId) {
        StudySession s = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));
        if (s.getStatus() == SessionStatus.DONE) return s;

        s.setStatus(SessionStatus.DONE);
        StudySession saved = sessionRepo.save(s);

        Subject subj = saved.getSubject();
        subj.setMinutesDone(subj.getMinutesDone() + saved.getMinutes());
        subjectRepo.save(subj);

        return saved;
    }

    public List<StudySession> getSessions(LocalDate from, LocalDate to) {
        return sessionRepo.findByDateBetweenOrderByDateAscStartTimeAsc(from, to);
    }
}
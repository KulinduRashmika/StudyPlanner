package com.pdsa.studyplanner.repository;

import com.pdsa.studyplanner.model.StudySession;
import com.pdsa.studyplanner.model.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface StudySessionRepository extends JpaRepository<StudySession, Long> {

    // ✅ Order by date THEN startTime (important)
    List<StudySession> findByDateBetweenOrderByDateAscStartTimeAsc(LocalDate from, LocalDate to);

    List<StudySession> findByDate(LocalDate date);

    List<StudySession> findByDateGreaterThanEqual(LocalDate from);

    List<StudySession> findByStatus(SessionStatus status);
}
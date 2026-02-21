package com.pdsa.studyplanner.repository;

import com.pdsa.studyplanner.model.Subject;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubjectRepository extends JpaRepository<Subject, Long> {

    // ✅ Closest exam first, then higher difficulty first
    List<Subject> findAllByOrderByExamDateAscDifficultyDesc();
}
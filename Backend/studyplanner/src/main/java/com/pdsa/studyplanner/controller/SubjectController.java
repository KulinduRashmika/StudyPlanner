package com.pdsa.studyplanner.controller;

import com.pdsa.studyplanner.model.Subject;
import com.pdsa.studyplanner.repository.SubjectRepository;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/subjects")
public class SubjectController {

    private final SubjectRepository repo;

    public SubjectController(SubjectRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Subject> all() {
        return repo.findAllByOrderByExamDateAscDifficultyDesc();
    }

    @PostMapping
    public Subject create(@Valid @RequestBody Subject subject) {
        subject.setId(null);
        if (subject.getMinutesDone() < 0) subject.setMinutesDone(0);
        return repo.save(subject);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repo.deleteById(id);
    }
}
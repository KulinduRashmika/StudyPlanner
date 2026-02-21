package com.pdsa.studyplanner.repository;

import com.pdsa.studyplanner.model.Availability;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AvailabilityRepository extends JpaRepository<Availability, Long> {}
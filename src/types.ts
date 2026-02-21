export type SessionStatus = "PLANNED" | "DONE" | "MISSED";

export interface Availability {
  id?: number;
  minutesPerDay: number;
}

export interface Subject {
  id: number;
  name: string;
  examDate: string; // YYYY-MM-DD
  difficulty: number; // 1..5
  hoursRequired: number;
  minutesDone: number;
}

export interface StudySession {
  id: number;
  subject: Subject;
  date: string; // YYYY-MM-DD
  minutes: number;
  status: SessionStatus;
}
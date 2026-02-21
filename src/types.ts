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
  date: string;           // "YYYY-MM-DD"
  startTime?: string;     // "18:00:00"
  minutes: number;
  status: "PLANNED" | "DONE" | "MISSED";
  subject?: {
    id: number;
    name: string;
  };
}
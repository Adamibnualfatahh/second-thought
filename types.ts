export enum DecisionType {
  SHOPPING = 'SHOPPING',
  MESSAGE = 'MESSAGE',
  WORK = 'WORK',
  FEELING = 'FEELING',
  OTHER = 'OTHER'
}

export enum DecisionStatus {
  DRAFT = 'DRAFT',
  WAITING = 'WAITING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  SNOOZED = 'SNOOZED'
}

export interface Decision {
  id: string;
  type: DecisionType;
  text: string;
  reflectionText?: string;
  startTime: number; // Timestamp when the waiting started
  durationMinutes: number; // How long to wait in minutes
  endTime: number; // Timestamp when waiting ends
  status: DecisionStatus;
  createdAt: number;
  finalNote?: string; // New field for end-of-process reflection
}

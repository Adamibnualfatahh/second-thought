import { Decision, DecisionStatus, DecisionType } from '../types';

const STORAGE_KEY = 'secondthought_active_decision';

export const saveDecision = (decision: Decision): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(decision));
};

export const getDecision = (): Decision | null => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
};

export const clearDecision = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const createDraftDecision = (): Decision => {
  return {
    id: crypto.randomUUID(),
    type: DecisionType.OTHER,
    text: '',
    startTime: 0,
    durationMinutes: 0,
    endTime: 0,
    status: DecisionStatus.DRAFT,
    createdAt: Date.now(),
  };
};

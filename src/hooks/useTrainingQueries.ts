import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SessionLogSchemaType } from '../schemas/trainingSchema';

export interface SessionLogRecord extends SessionLogSchemaType {
  id: string;
  timestamp: string;
}

const STORAGE_KEY = 'pawmaster_rq_logs';

async function fetchLogsFromStorage(): Promise<SessionLogRecord[]> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  return JSON.parse(raw);
}

export function useSessionLogs() {
  return useQuery({
    queryKey: ['session-logs'],
    queryFn: fetchLogsFromStorage,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddSessionLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SessionLogSchemaType) => {
      const existing = await fetchLogsFromStorage();
      const next: SessionLogRecord = {
        ...input,
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify([next, ...existing]));
      return next;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-logs'] });
    },
  });
}

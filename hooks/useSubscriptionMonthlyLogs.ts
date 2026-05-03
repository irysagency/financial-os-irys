import { useState, useEffect, useCallback } from 'react';

// subscriptionId -> taken (true = pris ce mois)
export type LogsMap = Record<string, boolean>;

const storageKey = (month: string) => `irys_sub_logs_${month}`;

function readLogs(month: string): LogsMap {
  try {
    const raw = localStorage.getItem(storageKey(month));
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function writeLogs(month: string, logs: LogsMap) {
  try {
    localStorage.setItem(storageKey(month), JSON.stringify(logs));
  } catch { /* ignore */ }
}

export function useSubscriptionMonthlyLogs(month: string) {
  const [logs, setLogs] = useState<LogsMap>(() => readLogs(month));
  const [isLoading] = useState(false);
  const [errorMsg] = useState<string | null>(null);

  useEffect(() => {
    setLogs(readLogs(month));
  }, [month]);

  const toggleLog = useCallback(
    (_subscriptionId: string, taken: boolean) => {
      setLogs(prev => {
        const next = { ...prev, [_subscriptionId]: taken };
        writeLogs(month, next);
        return next;
      });
    },
    [month]
  );

  return { logs, isLoading, errorMsg, toggleLog };
}

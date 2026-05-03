import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

// subscriptionId -> taken (true = pris ce mois)
export type LogsMap = Record<string, boolean>;

export function useSubscriptionMonthlyLogs(month: string) {
  const [logs, setLogs] = useState<LogsMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setErrorMsg(null);

    const fetchLogs = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        if (!user) {
          if (!cancelled) setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('subscription_monthly_logs')
          .select('subscription_id, taken')
          .eq('user_id', user.id)
          .eq('month', month);

        if (error) throw error;

        const map: LogsMap = {};
        for (const row of data ?? []) {
          map[row.subscription_id] = row.taken;
        }
        if (!cancelled) setLogs(map);
      } catch {
        if (!cancelled) setErrorMsg('Erreur lors du chargement des logs.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchLogs();
    return () => { cancelled = true; };
  }, [month]);

  const toggleLog = useCallback(
    async (subscriptionId: string, taken: boolean) => {
      const snapshot = logs;

      // Optimistic update
      setLogs(prev => ({ ...prev, [subscriptionId]: taken }));
      setErrorMsg(null);

      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        if (!user) throw new Error('Non authentifié');

        if (taken) {
          const { error } = await supabase
            .from('subscription_monthly_logs')
            .upsert(
              { subscription_id: subscriptionId, user_id: user.id, month, taken: true },
              { onConflict: 'subscription_id,user_id,month' }
            );
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('subscription_monthly_logs')
            .delete()
            .eq('subscription_id', subscriptionId)
            .eq('user_id', user.id)
            .eq('month', month);
          if (error) throw error;
        }
      } catch {
        setLogs(snapshot);
        setErrorMsg('Erreur lors de la sauvegarde. Réessayez.');
        setTimeout(() => setErrorMsg(null), 4000);
      }
    },
    [logs, month]
  );

  return { logs, isLoading, errorMsg, toggleLog };
}

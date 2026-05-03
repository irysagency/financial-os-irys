import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { useApiClient } from './useApiClient';

export type LogsMap = Record<string, boolean>;

export function useSubscriptionMonthlyLogs(month: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const { data: logs = {}, isLoading, error } = useQuery<LogsMap>({
    queryKey: ['abonnement-logs', month],
    queryFn: () => api.get<LogsMap>(`/abonnements/logs/${month}`),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ subscriptionId, pris }: { subscriptionId: string; pris: boolean }) =>
      api.put(`/abonnements/logs/${month}/${subscriptionId}`, { pris }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['abonnement-logs', month] }),
  });

  const toggleLog = (subscriptionId: string, taken: boolean) => {
    toggleMutation.mutate({ subscriptionId, pris: taken });
  };

  return {
    logs,
    isLoading,
    errorMsg: error ? (error as Error).message : null,
    toggleLog,
  };
}

import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Strategy, InsertStrategy } from "@shared/schema";

export function useStrategies(walletId?: number) {
  // Fetch strategies for the wallet
  const strategiesQuery = useQuery({
    queryKey: [`/api/wallets/${walletId}/strategies`],
    enabled: !!walletId,
  });

  // Create a new strategy
  const createStrategy = useMutation({
    mutationFn: async (strategyData: InsertStrategy) => {
      return apiRequest("POST", "/api/strategies", strategyData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/wallets/${walletId}/strategies`] });
    }
  });

  // Update strategy
  const updateStrategy = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<Strategy> }) => {
      return apiRequest("PUT", `/api/strategies/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/wallets/${walletId}/strategies`] });
    }
  });

  // Delete strategy
  const deleteStrategy = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/strategies/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/wallets/${walletId}/strategies`] });
    }
  });

  // Get active strategies
  const getActiveStrategies = () => {
    return strategiesQuery.data?.filter(strategy => strategy.isActive) || [];
  };

  // Get strategies by type
  const getStrategiesByType = (type: string) => {
    return strategiesQuery.data?.filter(strategy => strategy.type === type) || [];
  };

  // Get AI-generated strategies
  const getAiGeneratedStrategies = () => {
    return strategiesQuery.data?.filter(strategy => strategy.type === 'ai-generated') || [];
  };

  return {
    strategies: strategiesQuery.data || [],
    isLoading: strategiesQuery.isLoading,
    error: strategiesQuery.error,
    createStrategy,
    updateStrategy,
    deleteStrategy,
    getActiveStrategies,
    getStrategiesByType,
    getAiGeneratedStrategies
  };
}

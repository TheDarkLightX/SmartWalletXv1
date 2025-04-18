import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Transaction, InsertTransaction } from "@shared/schema";

export function useTransactions(walletId?: number) {
  // Fetch transactions for the wallet
  const transactionsQuery = useQuery({
    queryKey: [`/api/wallets/${walletId}/transactions`],
    enabled: !!walletId,
  });

  // Create a new transaction
  const createTransaction = useMutation({
    mutationFn: async (transactionData: InsertTransaction) => {
      return apiRequest("POST", "/api/transactions", transactionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/wallets/${walletId}/transactions`] });
    }
  });

  // Update transaction
  const updateTransaction = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<Transaction> }) => {
      return apiRequest("PUT", `/api/transactions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/wallets/${walletId}/transactions`] });
    }
  });

  // Get transactions by type
  const getTransactionsByType = (type: string) => {
    return transactionsQuery.data?.filter(tx => tx.type === type) || [];
  };

  // Get private transactions
  const getPrivateTransactions = () => {
    return transactionsQuery.data?.filter(tx => tx.isPrivate) || [];
  };

  // Get recent transactions (last 5)
  const getRecentTransactions = (limit = 5) => {
    return (transactionsQuery.data || [])
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  };

  return {
    transactions: transactionsQuery.data || [],
    isLoading: transactionsQuery.isLoading,
    error: transactionsQuery.error,
    createTransaction,
    updateTransaction,
    getTransactionsByType,
    getPrivateTransactions,
    getRecentTransactions
  };
}

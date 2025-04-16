import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Wallet } from "@shared/schema";

export function useWallet(userId: number) {
  // Fetch wallets for the user
  const walletsQuery = useQuery({
    queryKey: [`/api/users/${userId}/wallets`],
    enabled: !!userId,
  });

  // Get the first wallet (primary wallet)
  const wallet = walletsQuery.data && walletsQuery.data.length > 0 
    ? walletsQuery.data[0] 
    : null;

  // Create a new wallet
  const createWallet = useMutation({
    mutationFn: async (walletData: { address: string, network: string }) => {
      return apiRequest("POST", "/api/wallets", {
        userId,
        ...walletData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/wallets`] });
    }
  });

  // Update wallet
  const updateWallet = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<Wallet> }) => {
      return apiRequest("PUT", `/api/wallets/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/wallets`] });
    }
  });

  // Parse ETH balance
  const ethBalance = wallet?.balance ? parseFloat(wallet.balance) : 0;

  // Convert to USD (using a static rate for demo)
  const ethToUsdRate = 1928.50;
  const usdBalance = ethBalance * ethToUsdRate;

  return {
    wallet,
    wallets: walletsQuery.data || [],
    isLoading: walletsQuery.isLoading,
    error: walletsQuery.error,
    createWallet,
    updateWallet,
    ethBalance,
    usdBalance,
    walletAddress: wallet?.address
  };
}

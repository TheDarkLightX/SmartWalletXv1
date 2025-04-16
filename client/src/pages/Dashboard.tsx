import { useQuery } from "@tanstack/react-query";
import WalletOverview from "@/components/dashboard/WalletOverview";
import QuickActions from "@/components/dashboard/QuickActions";
import ActiveStrategies from "@/components/dashboard/ActiveStrategies";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import SecurityTools from "@/components/dashboard/SecurityTools";
import AIAssistant from "@/components/dashboard/AIAssistant";
import WalletAssets from "@/components/dashboard/WalletAssets";

const Dashboard = () => {
  // For a real implementation, we would fetch the user ID from an auth context
  const userId = 1;

  // Fetch user data
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: [`/api/users/${userId}`],
  });

  // Fetch wallet data
  const { data: wallets, isLoading: isLoadingWallets } = useQuery({
    queryKey: [`/api/users/${userId}/wallets`],
    enabled: !!userId,
  });

  // Fetch assets for the first wallet
  const { data: assets, isLoading: isLoadingAssets } = useQuery({
    queryKey: [`/api/wallets/${wallets?.[0]?.id}/assets`],
    enabled: !!wallets && wallets.length > 0,
  });

  // Fetch transactions for the first wallet
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: [`/api/wallets/${wallets?.[0]?.id}/transactions`],
    enabled: !!wallets && wallets.length > 0,
  });

  // Fetch strategies for the first wallet
  const { data: strategies, isLoading: isLoadingStrategies } = useQuery({
    queryKey: [`/api/wallets/${wallets?.[0]?.id}/strategies`],
    enabled: !!wallets && wallets.length > 0,
  });

  // Fetch guardians for the first wallet
  const { data: guardians, isLoading: isLoadingGuardians } = useQuery({
    queryKey: [`/api/wallets/${wallets?.[0]?.id}/guardians`],
    enabled: !!wallets && wallets.length > 0,
  });

  const isLoading = 
    isLoadingUser || 
    isLoadingWallets || 
    isLoadingAssets || 
    isLoadingTransactions || 
    isLoadingStrategies || 
    isLoadingGuardians;

  const activeGuardians = guardians?.filter(guardian => guardian.isActive) || [];

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile page title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white md:hidden mb-4">Dashboard</h1>

        {/* Overview cards */}
        <WalletOverview 
          isLoading={isLoading} 
          walletAddress={wallets?.[0]?.address} 
          balance={wallets?.[0]?.balance}
          securityScore={user?.securityScore} 
        />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 mt-8">
          {/* Left Column (2/3 width on large screens) */}
          <div className="lg:col-span-2 space-y-6">
            <QuickActions />
            
            <ActiveStrategies 
              strategies={strategies || []} 
              isLoading={isLoadingStrategies} 
            />
            
            <RecentTransactions 
              transactions={transactions || []} 
              isLoading={isLoadingTransactions} 
            />
          </div>

          {/* Right Column (1/3 width on large screens) */}
          <div className="space-y-6">
            <SecurityTools 
              securityScore={user?.securityScore}
              activeGuardians={activeGuardians.length} 
              totalGuardians={guardians?.length || 0}
              isPrivacyEnabled={true}
              is2faEnabled={user?.is2faEnabled}
              isLoading={isLoadingGuardians}
            />
            
            <AIAssistant />
            
            <WalletAssets 
              assets={assets || []}
              isLoading={isLoadingAssets}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

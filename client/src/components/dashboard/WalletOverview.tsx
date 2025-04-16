import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface WalletOverviewProps {
  isLoading: boolean;
  walletAddress?: string;
  balance?: string;
  securityScore?: number;
}

const WalletOverview = ({
  isLoading,
  walletAddress = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  balance = "0",
  securityScore = 0
}: WalletOverviewProps) => {
  // Estimate USD value based on ETH price of $1928.50
  const ethPrice = 1928.50;
  const usdBalance = parseFloat(balance) * ethPrice;

  // Calculate security score label
  const getSecurityLabel = () => {
    if (securityScore >= 80) return "Good";
    if (securityScore >= 50) return "Average";
    return "Needs Improvement";
  };

  // Get security score color
  const getSecurityColor = () => {
    if (securityScore >= 80) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    if (securityScore >= 50) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
  };

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Balance Card */}
        <Card className="bg-gradient-to-r from-primary to-blue-400 overflow-hidden shadow">
          <CardContent className="p-0">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-white bg-opacity-30 rounded-full p-3">
                  <i className="ri-coin-line text-white text-xl"></i>
                </div>
                <div className="ml-5 w-0 flex-1">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-4 w-24 bg-white bg-opacity-30 mb-2" />
                      <Skeleton className="h-6 w-32 bg-white bg-opacity-30 mb-1" />
                      <Skeleton className="h-4 w-20 bg-white bg-opacity-30" />
                    </>
                  ) : (
                    <dl>
                      <dt className="text-sm font-medium text-white text-opacity-80 truncate">
                        Total Balance
                      </dt>
                      <dd>
                        <div className="text-lg font-semibold text-white">{balance} ETH</div>
                        <div className="text-sm text-white text-opacity-80">≈ ${usdBalance.toFixed(2)}</div>
                      </dd>
                    </dl>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Wallet Address Card */}
        <Card>
          <CardContent className="p-0">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gray-100 dark:bg-dark-300 rounded-full p-3">
                  <i className="ri-wallet-3-line text-primary text-xl"></i>
                </div>
                <div className="ml-5 w-0 flex-1">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-5 w-full" />
                    </>
                  ) : (
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Wallet Address
                      </dt>
                      <dd>
                        <div className="flex items-center">
                          <p className="font-mono text-sm font-medium text-gray-900 dark:text-white truncate">
                            {walletAddress}
                          </p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="ml-2 text-primary p-0 h-auto"
                            onClick={() => {
                              navigator.clipboard.writeText(walletAddress);
                            }}
                          >
                            <i className="ri-file-copy-line"></i>
                          </Button>
                        </div>
                      </dd>
                    </dl>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Security Score Card */}
        <Card>
          <CardContent className="p-0">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gray-100 dark:bg-dark-300 rounded-full p-3">
                  <i className="ri-shield-check-line text-green-500 text-xl"></i>
                </div>
                <div className="ml-5 w-0 flex-1">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-5 w-28 mb-2" />
                      <Skeleton className="h-2 w-full" />
                    </>
                  ) : (
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Security Score
                      </dt>
                      <dd>
                        <div className="flex items-center">
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">{securityScore}/100</span>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSecurityColor()}`}>
                            {getSecurityLabel()}
                          </span>
                        </div>
                        <div className="mt-1">
                          <Progress value={securityScore} className="h-2" />
                        </div>
                      </dd>
                    </dl>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WalletOverview;

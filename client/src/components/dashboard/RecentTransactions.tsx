import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { Transaction } from "@shared/schema";

interface RecentTransactionsProps {
  transactions: Transaction[];
  isLoading: boolean;
}

const RecentTransactions = ({ transactions = [], isLoading = false }: RecentTransactionsProps) => {
  const [, navigate] = useLocation();

  // Helper to get the transaction icon based on type
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'receive':
        return <i className="ri-download-line text-xl"></i>;
      case 'send':
        return <i className="ri-send-plane-line text-xl"></i>;
      case 'swap':
        return <i className="ri-swap-line text-xl"></i>;
      default:
        return <i className="ri-question-mark-line text-xl"></i>;
    }
  };

  // Helper to get icon background color
  const getIconBgColor = (type: string) => {
    switch (type) {
      case 'receive':
        return 'bg-green-100 dark:bg-green-900 text-green-500';
      case 'send':
        return 'bg-primary bg-opacity-10 text-primary';
      case 'swap':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-500';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-500';
    }
  };

  // Helper to format transaction amounts with color
  const getAmountWithColor = (transaction: Transaction) => {
    switch (transaction.type) {
      case 'receive':
        return <p className="text-sm font-medium text-green-500">+{transaction.amount} {transaction.fromAsset}</p>;
      case 'send':
        return <p className="text-sm font-medium text-red-500">-{transaction.amount} {transaction.fromAsset}</p>;
      case 'swap':
        return <p className="text-sm font-medium text-blue-500">{transaction.amount} {transaction.fromAsset} → {transaction.toAsset}</p>;
      default:
        return <p className="text-sm font-medium">{transaction.amount} {transaction.fromAsset}</p>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Recent Transactions</CardTitle>
          <Button 
            variant="link" 
            className="text-primary hover:text-primary-700 text-sm font-medium"
            onClick={() => navigate("/transactions")}
          >
            View all
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeletons
            Array(3).fill(0).map((_, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-dark-200">
                <div className="flex items-center">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="ml-3">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-3 w-12 ml-auto" />
                </div>
              </div>
            ))
          ) : transactions.length === 0 ? (
            // Empty state
            <div className="text-center py-6">
              <i className="ri-exchange-funds-line text-4xl text-gray-300 mb-2"></i>
              <p className="text-gray-500">No transactions yet</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/transactions")}
                className="mt-2"
              >
                Make your first transaction
              </Button>
            </div>
          ) : (
            // Transactions list
            transactions.slice(0, 3).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-dark-200">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full ${getIconBgColor(transaction.type)} flex items-center justify-center`}>
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div className="ml-3">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {transaction.type === 'receive' && `Received ${transaction.fromAsset}`}
                        {transaction.type === 'send' && `Sent ${transaction.fromAsset}`}
                        {transaction.type === 'swap' && `Swapped ${transaction.fromAsset} for ${transaction.toAsset}`}
                      </p>
                      {transaction.isPrivate && (
                        <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-none text-xs">
                          <i className="ri-eye-off-line mr-1 text-xs"></i> Private
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(transaction.timestamp).toLocaleString(undefined, { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {getAmountWithColor(transaction)}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {/* In a real app, this would calculate the USD value based on prices at transaction time */}
                    ${(parseFloat(transaction.amount) * 1928.50).toFixed(2)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;

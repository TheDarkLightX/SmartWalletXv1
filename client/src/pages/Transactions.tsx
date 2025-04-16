import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import PrivateTransactionForm from "@/components/wallet/PrivateTransactionForm";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function Transactions() {
  const [selectedTab, setSelectedTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // For a real implementation, we would fetch the user ID from an auth context
  const userId = 1;

  const { data: wallets } = useQuery({
    queryKey: [`/api/users/${userId}/wallets`],
  });

  const { data: transactions, isLoading } = useQuery({
    queryKey: [`/api/wallets/${wallets?.[0]?.id}/transactions`],
    enabled: !!wallets && wallets.length > 0,
  });

  // Filter transactions based on search query and selected tab
  const filteredTransactions = transactions?.filter(transaction => {
    const matchesSearch = 
      searchQuery === "" || 
      transaction.hash?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.fromAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.toAddress?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesTab = 
      selectedTab === "all" || 
      (selectedTab === "sent" && transaction.type === "send") ||
      (selectedTab === "received" && transaction.type === "receive") ||
      (selectedTab === "swapped" && transaction.type === "swap") ||
      (selectedTab === "private" && transaction.isPrivate);
      
    return matchesSearch && matchesTab;
  });

  const getTransactionIcon = (type: string, isPrivate: boolean) => {
    if (type === "send") {
      return <i className="ri-send-plane-line text-xl text-primary"></i>;
    } else if (type === "receive") {
      return <i className="ri-download-line text-xl text-green-500"></i>;
    } else if (type === "swap") {
      return <i className="ri-swap-line text-xl text-blue-500"></i>;
    }
    
    return <i className="ri-question-line text-xl text-gray-500"></i>;
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-700">
                <i className="ri-add-line mr-2"></i>
                New Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <PrivateTransactionForm onComplete={() => setIsCreateDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle>Transaction History</CardTitle>
              <div className="relative w-full md:w-64">
                <Input
                  placeholder="Search by address or tx hash..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-8"
                />
                <i className="ri-search-line absolute right-3 top-2.5 text-gray-400"></i>
              </div>
            </div>
          </CardHeader>
          
          <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
            <div className="px-6">
              <TabsList className="grid grid-cols-5 w-full max-w-md">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="sent">Sent</TabsTrigger>
                <TabsTrigger value="received">Received</TabsTrigger>
                <TabsTrigger value="swapped">Swapped</TabsTrigger>
                <TabsTrigger value="private">Private</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value={selectedTab}>
              <CardContent>
                {isLoading ? (
                  // Loading state
                  Array(5).fill(0).map((_, index) => (
                    <div key={index} className="py-4 border-b flex items-center justify-between">
                      <div className="flex items-center">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="ml-3">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24 mt-2" />
                        </div>
                      </div>
                      <div className="text-right">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-3 w-12 mt-2 ml-auto" />
                      </div>
                    </div>
                  ))
                ) : filteredTransactions?.length === 0 ? (
                  // Empty state
                  <div className="py-8 text-center">
                    <i className="ri-inbox-line text-3xl text-gray-400 mb-2"></i>
                    <p className="text-gray-500">No transactions found</p>
                  </div>
                ) : (
                  // Transactions list
                  filteredTransactions?.map((transaction) => (
                    <div key={transaction.id} className="py-4 border-b border-gray-200 dark:border-dark-200 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary bg-opacity-10">
                          {getTransactionIcon(transaction.type, transaction.isPrivate)}
                        </div>
                        <div className="ml-3">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {transaction.type === 'receive' && `Received ${transaction.fromAsset}`}
                              {transaction.type === 'send' && `Sent ${transaction.fromAsset}`}
                              {transaction.type === 'swap' && `Swapped ${transaction.fromAsset} for ${transaction.toAsset}`}
                            </p>
                            {transaction.isPrivate && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                <i className="ri-eye-off-line mr-1 text-xs"></i> Private
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(transaction.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          transaction.type === 'receive' ? 'text-green-500' : 
                          transaction.type === 'send' ? 'text-red-500' : 
                          'text-blue-500'
                        }`}>
                          {transaction.type === 'receive' && `+${transaction.amount} ${transaction.fromAsset}`}
                          {transaction.type === 'send' && `-${transaction.amount} ${transaction.fromAsset}`}
                          {transaction.type === 'swap' && `${transaction.amount} ${transaction.fromAsset}`}
                        </p>
                        {transaction.hash && (
                          <a 
                            href={`https://etherscan.io/tx/${transaction.hash}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            View on Explorer
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useNetwork } from "@/hooks/useNetwork";
import { useToast } from "@/hooks/use-toast";
import {
  DeFiProtocol,
  DeFiProtocolType,
  getProtocolsByChain,
  StrategyActionType
} from "@/lib/defi-protocols";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import ProtocolCard from "@/components/defi/ProtocolCard";
import ProtocolSelector from "@/components/defi/ProtocolSelector";
import DeFiStrategyForm from "@/components/defi/DeFiStrategyForm";

/**
 * DeFi Protocols Page
 * 
 * This page provides a comprehensive interface for users to:
 * 1. Browse available DeFi protocols across different chains
 * 2. Filter protocols by type (DEX, Lending, etc.)
 * 3. Create new DeFi strategies using various protocols
 * 4. View and manage their existing strategies
 */
export default function DeFiProtocols() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { currentNetwork, setNetwork } = useNetwork();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProtocolType, setSelectedProtocolType] = useState<string>("all");
  const [selectedProtocol, setSelectedProtocol] = useState<DeFiProtocol | null>(null);
  const [isStrategyFormOpen, setIsStrategyFormOpen] = useState(false);
  const [isProtocolSelectorOpen, setIsProtocolSelectorOpen] = useState(false);
  
  // For a real implementation, we would fetch the user ID from an auth context
  const userId = 1;

  // Fetch user's wallets
  const { data: wallets, isLoading: isLoadingWallets } = useQuery({
    queryKey: [`/api/users/${userId}/wallets`],
  });

  // Fetch user's strategies
  const { data: strategies, isLoading: isLoadingStrategies } = useQuery({
    queryKey: [`/api/users/${userId}/strategies`],
  });

  // Get protocols based on current network and filters
  const getFilteredProtocols = () => {
    // Start with all protocols for the current network
    let protocols = getProtocolsByChain(currentNetwork);
    
    // Filter by type if a specific type is selected
    if (selectedProtocolType !== "all") {
      protocols = protocols.filter(
        protocol => protocol.type === selectedProtocolType
      );
    }
    
    // Filter by search term if one is provided
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      protocols = protocols.filter(
        protocol => 
          protocol.name.toLowerCase().includes(term) || 
          protocol.description.toLowerCase().includes(term)
      );
    }
    
    return protocols;
  };

  // Handler for selecting a protocol to create a strategy
  const handleSelectProtocol = (protocol: DeFiProtocol) => {
    setSelectedProtocol(protocol);
    setIsProtocolSelectorOpen(false);
    setIsStrategyFormOpen(true);
  };

  // Handler for strategy creation success
  const handleStrategyCreated = (strategy: any) => {
    setIsStrategyFormOpen(false);
    setSelectedProtocol(null);
    
    // Navigate to the strategies tab
    navigate("/ai-strategies");
    
    toast({
      title: "Strategy Created",
      description: `Your ${strategy.name} strategy has been created successfully.`,
    });
  };

  // Get DeFi strategies (not AI-generated ones)
  const defiStrategies = Array.isArray(strategies) ? strategies.filter((s: any) => s.type === 'defi') : [];

  return (
    <div className="container max-w-7xl mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">DeFi Protocols</h1>
          <p className="text-muted-foreground">
            Browse and integrate with various DeFi protocols across multiple blockchains.
          </p>
        </div>

        {/* Network Selector */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-md shadow-sm">
            <button
              type="button"
              className={`relative inline-flex items-center rounded-l-md px-4 py-2 text-sm font-medium ${
                currentNetwork === 'pulsechain' 
                  ? 'bg-primary text-white' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => setNetwork('pulsechain')}
            >
              <i className="ri-pulse-line mr-2"></i>
              PulseChain
            </button>
            <button
              type="button"
              className={`relative -ml-px inline-flex items-center rounded-r-md px-4 py-2 text-sm font-medium ${
                currentNetwork === 'ethereum' 
                  ? 'bg-primary text-white' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => setNetwork('ethereum')}
            >
              <i className="ri-ethereum-line mr-2"></i>
              Ethereum
            </button>
          </div>
        </div>

        {/* Create Strategy Button */}
        <div className="flex justify-end">
          <Button 
            variant="default" 
            className="flex items-center space-x-2"
            onClick={() => setIsProtocolSelectorOpen(true)}
          >
            <i className="ri-add-line"></i>
            <span>Create New Strategy</span>
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <Input
              className="pl-10"
              placeholder="Search protocols..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="form-select px-4 py-2 border dark:border-gray-700 rounded-md bg-background"
            value={selectedProtocolType}
            onChange={(e) => setSelectedProtocolType(e.target.value)}
          >
            <option value="all">All Types</option>
            {Object.values(DeFiProtocolType).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Protocol Grid */}
        <div>
          <Tabs defaultValue="protocols" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="protocols">Available Protocols</TabsTrigger>
              <TabsTrigger value="my-strategies">My DeFi Strategies</TabsTrigger>
            </TabsList>
            
            <TabsContent value="protocols">
              <Card>
                <CardHeader>
                  <CardTitle>DeFi Protocols on {currentNetwork === 'pulsechain' ? 'PulseChain' : 'Ethereum'}</CardTitle>
                  <CardDescription>
                    Browse and select protocols to create automated strategies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getFilteredProtocols().map((protocol) => (
                      <ProtocolCard
                        key={protocol.id}
                        protocol={protocol}
                        onSelect={handleSelectProtocol}
                      />
                    ))}
                  </div>
                  
                  {getFilteredProtocols().length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <i className="ri-file-search-line text-4xl mb-2"></i>
                      <p>No protocols found matching your criteria.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="my-strategies">
              <Card>
                <CardHeader>
                  <CardTitle>My DeFi Strategies</CardTitle>
                  <CardDescription>
                    View and manage your active DeFi strategies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingStrategies ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : defiStrategies.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <i className="ri-robot-line text-4xl mb-2"></i>
                      <p>You haven't created any DeFi strategies yet.</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setIsProtocolSelectorOpen(true)}
                      >
                        Create Your First Strategy
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {defiStrategies.map((strategy: any) => (
                        <div key={strategy.id} className="border p-4 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{strategy.name}</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{strategy.description}</p>
                            </div>
                            <div className="flex">
                              {strategy.conditions?.protocolId && (
                                <div className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                                  {strategy.conditions.protocolId}
                                </div>
                              )}
                              {strategy.conditions?.actionType && (
                                <div className="ml-2 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                                  {strategy.conditions.actionType}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Protocol Selector Dialog */}
      <ProtocolSelector
        isOpen={isProtocolSelectorOpen}
        onClose={() => setIsProtocolSelectorOpen(false)}
        onSelect={handleSelectProtocol}
        defaultChain={currentNetwork}
      />

      {/* Strategy Form Dialog */}
      <Dialog open={isStrategyFormOpen} onOpenChange={setIsStrategyFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedProtocol 
                ? `Create Strategy with ${selectedProtocol.name}`
                : 'Create DeFi Strategy'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedProtocol && wallets && Array.isArray(wallets) && (
            <ScrollArea className="max-h-[70vh]">
              <DeFiStrategyForm
                wallets={wallets}
                userId={userId}
                onSuccess={handleStrategyCreated}
              />
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
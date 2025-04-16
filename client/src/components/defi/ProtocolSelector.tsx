import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  DeFiProtocol, 
  DeFiProtocolType, 
  getActiveProtocols, 
  getProtocolsByType,
  getProtocolsByChain
} from '@/lib/defi-protocols';
import ProtocolCard from './ProtocolCard';

interface ProtocolSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (protocol: DeFiProtocol) => void;
  defaultChain?: 'pulsechain' | 'ethereum';
}

const ProtocolSelector: React.FC<ProtocolSelectorProps> = ({ 
  isOpen, 
  onClose, 
  onSelect,
  defaultChain = 'pulsechain'
}) => {
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChain, setSelectedChain] = useState<'pulsechain' | 'ethereum'>(defaultChain);

  // Get protocols based on selected filters
  const getFilteredProtocols = (): DeFiProtocol[] => {
    let protocols: DeFiProtocol[] = [];
    
    if (selectedTab === "all") {
      protocols = getProtocolsByChain(selectedChain);
    } else {
      // Convert selected tab to protocol type enum
      const protocolType = selectedTab as DeFiProtocolType;
      protocols = getProtocolsByType(protocolType, selectedChain);
    }
    
    // Apply search filter if there's a search term
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      protocols = protocols.filter(protocol => 
        protocol.name.toLowerCase().includes(term) || 
        protocol.description.toLowerCase().includes(term)
      );
    }
    
    return protocols;
  };

  const handleProtocolSelect = (protocol: DeFiProtocol) => {
    onSelect(protocol);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select DeFi Protocol</DialogTitle>
          <DialogDescription>
            Choose a protocol to use for your strategy
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          {/* Chain selector */}
          <div className="flex justify-center mb-4">
            <div className="inline-flex rounded-md shadow-sm">
              <button
                type="button"
                className={`relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-medium ${
                  selectedChain === 'pulsechain' 
                    ? 'bg-primary text-white' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => setSelectedChain('pulsechain')}
              >
                <i className="ri-pulse-line mr-2"></i>
                PulseChain
              </button>
              <button
                type="button"
                className={`relative -ml-px inline-flex items-center rounded-r-md px-3 py-2 text-sm font-medium ${
                  selectedChain === 'ethereum' 
                    ? 'bg-primary text-white' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => setSelectedChain('ethereum')}
              >
                <i className="ri-ethereum-line mr-2"></i>
                Ethereum
              </button>
            </div>
          </div>
          
          {/* Search input */}
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <Input
              className="pl-10"
              placeholder="Search protocols..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Protocol type tabs */}
          <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value={DeFiProtocolType.DEX}>DEX</TabsTrigger>
              <TabsTrigger value={DeFiProtocolType.LENDING}>Lending</TabsTrigger>
              <TabsTrigger value={DeFiProtocolType.YIELD_AGGREGATOR}>Yield</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFilteredProtocols().map((protocol) => (
                  <ProtocolCard
                    key={protocol.id}
                    protocol={protocol}
                    onSelect={handleProtocolSelect}
                  />
                ))}
              </div>
            </TabsContent>
            
            {/* Tabs for each protocol type */}
            {Object.values(DeFiProtocolType).map((type) => (
              <TabsContent key={type} value={type} className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getFilteredProtocols().map((protocol) => (
                    <ProtocolCard
                      key={protocol.id}
                      protocol={protocol}
                      onSelect={handleProtocolSelect}
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
            
            {/* No results message */}
            {getFilteredProtocols().length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <i className="ri-file-search-line text-4xl mb-2"></i>
                <p>No protocols found matching your criteria.</p>
              </div>
            )}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProtocolSelector;
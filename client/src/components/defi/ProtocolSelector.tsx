import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  DeFiProtocol,
  DeFiProtocolType,
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
  const [selectedChain, setSelectedChain] = useState<'pulsechain' | 'ethereum'>(defaultChain);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  // Get protocols for the selected chain
  const protocols = getProtocolsByChain(selectedChain);

  // Filter protocols by search term and protocol type
  const filteredProtocols = protocols.filter(protocol => {
    const matchesSearch = searchTerm === "" || 
      protocol.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      protocol.description.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesType = selectedType === "all" || protocol.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  // Handle protocol selection
  const handleProtocolSelect = (protocol: DeFiProtocol) => {
    onSelect(protocol);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select DeFi Protocol</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 space-y-6">
          {/* Network Tabs */}
          <Tabs 
            defaultValue={selectedChain}
            onValueChange={(value) => setSelectedChain(value as 'pulsechain' | 'ethereum')}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pulsechain">PulseChain</TabsTrigger>
              <TabsTrigger value="ethereum">Ethereum</TabsTrigger>
            </TabsList>
          </Tabs>
          
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
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProtocols.map((protocol) => (
              <ProtocolCard
                key={protocol.id}
                protocol={protocol}
                onSelect={handleProtocolSelect}
              />
            ))}
          </div>
          
          {filteredProtocols.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <i className="ri-file-search-line text-4xl mb-2"></i>
              <p>No protocols found matching your criteria.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProtocolSelector;
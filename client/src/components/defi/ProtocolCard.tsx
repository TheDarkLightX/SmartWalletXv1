import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeFiProtocol, DeFiProtocolType } from '@/lib/defi-protocols';

interface ProtocolCardProps {
  protocol: DeFiProtocol;
  onSelect: (protocol: DeFiProtocol) => void;
}

const ProtocolCard: React.FC<ProtocolCardProps> = ({ protocol, onSelect }) => {
  // Helper function to get appropriate icon for the protocol type
  const getProtocolIcon = (type: DeFiProtocolType) => {
    switch (type) {
      case DeFiProtocolType.DEX:
        return "ri-exchange-line";
      case DeFiProtocolType.LENDING:
        return "ri-money-dollar-circle-line";
      case DeFiProtocolType.YIELD_AGGREGATOR:
        return "ri-funds-box-line";
      case DeFiProtocolType.LIQUID_STAKING:
        return "ri-stack-line";
      case DeFiProtocolType.DERIVATIVES:
        return "ri-line-chart-line";
      case DeFiProtocolType.OPTIONS:
        return "ri-scales-3-line";
      case DeFiProtocolType.INSURANCE:
        return "ri-shield-check-line";
      case DeFiProtocolType.LAUNCHPAD:
        return "ri-rocket-line";
      default:
        return "ri-global-line";
    }
  };

  // Helper function to get appropriate color for the protocol type
  const getProtocolColor = (type: DeFiProtocolType) => {
    switch (type) {
      case DeFiProtocolType.DEX:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case DeFiProtocolType.LENDING:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case DeFiProtocolType.YIELD_AGGREGATOR:
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case DeFiProtocolType.LIQUID_STAKING:
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
      case DeFiProtocolType.DERIVATIVES:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case DeFiProtocolType.OPTIONS:
        return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300";
      case DeFiProtocolType.INSURANCE:
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300";
      case DeFiProtocolType.LAUNCHPAD:
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {/* Protocol logo */}
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-3">
              <i className={`${getProtocolIcon(protocol.type)} text-xl text-primary`}></i>
            </div>
            <div>
              <CardTitle className="text-lg">{protocol.name}</CardTitle>
              <CardDescription className="text-xs">
                {protocol.chain === 'pulsechain' ? 'PulseChain' : 'Ethereum'}
              </CardDescription>
            </div>
          </div>
          <Badge className={`${getProtocolColor(protocol.type)} ml-2`}>
            {protocol.type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {protocol.description}
        </p>
        <div className="space-y-2">
          {protocol.tvl && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 dark:text-gray-400">TVL:</span>
              <span className="font-medium">${(protocol.tvl / 1000000).toFixed(2)}M</span>
            </div>
          )}
          {protocol.apy && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 dark:text-gray-400">APY:</span>
              <span className="font-medium text-green-600 dark:text-green-400">{protocol.apy.toFixed(2)}%</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => onSelect(protocol)}
        >
          Use Protocol
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProtocolCard;
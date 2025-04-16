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
  const getProtocolIcon = (type: DeFiProtocolType) => {
    switch (type) {
      case DeFiProtocolType.DEX:
        return "ri-exchange-line";
      case DeFiProtocolType.LENDING:
        return "ri-bank-line";
      case DeFiProtocolType.YIELD_AGGREGATOR:
        return "ri-funds-line";
      case DeFiProtocolType.LIQUID_STAKING:
        return "ri-coins-line";
      default:
        return "ri-apps-line";
    }
  };

  const getProtocolColor = (type: DeFiProtocolType) => {
    switch (type) {
      case DeFiProtocolType.DEX:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case DeFiProtocolType.LENDING:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case DeFiProtocolType.YIELD_AGGREGATOR:
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case DeFiProtocolType.LIQUID_STAKING:
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getProtocolColor(protocol.type)}`}>
              <i className={`${getProtocolIcon(protocol.type)} text-lg`}></i>
            </div>
            <CardTitle className="text-lg">{protocol.name}</CardTitle>
          </div>
          <Badge variant="outline" className="capitalize">
            {protocol.chain === 'pulsechain' ? 'PulseChain' : 'Ethereum'}
          </Badge>
        </div>
        <CardDescription className="mt-2 text-sm">
          {protocol.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary" className="text-xs">
            {protocol.type}
          </Badge>
          {protocol.tags.map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="mt-3 text-sm">
          <div className="flex items-center text-gray-500 dark:text-gray-400">
            <i className="ri-pie-chart-line mr-1"></i>
            <span>TVL: ${protocol.tvl.toLocaleString()}</span>
          </div>
          {protocol.apy && (
            <div className="flex items-center text-gray-500 dark:text-gray-400 mt-1">
              <i className="ri-percent-line mr-1"></i>
              <span>APY: {protocol.apy.toFixed(2)}%</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full" 
          onClick={() => onSelect(protocol)}
        >
          Create Strategy
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProtocolCard;
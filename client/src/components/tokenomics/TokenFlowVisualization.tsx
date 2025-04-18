import { ArrowDown, ArrowRight, Banknote, Gift, Flame } from "lucide-react";
import { DEVELOPER_FUND_PERCENTAGE, BUY_BURN_PERCENTAGE, DEVELOPER_FUND_ADDRESS } from "@/lib/tokenomics";

export function TokenFlowVisualization() {
  return (
    <div className="p-4 bg-muted/30 rounded-lg">
      <h3 className="text-lg font-medium mb-4">Fee Flow Visualization</h3>
      
      <div className="flex flex-col items-center space-y-6">
        {/* Transaction */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-background flex items-center justify-center shadow">
            <Banknote className="h-10 w-10 text-primary" />
          </div>
          <p className="mt-2 text-sm font-medium">Transaction</p>
          <p className="text-xs text-muted-foreground">0.2% Fee</p>
        </div>
        
        <ArrowDown className="h-8 w-8 text-muted-foreground" />
        
        {/* Split */}
        <div className="grid grid-cols-2 w-full gap-8">
          <div className="flex flex-col items-center">
            <div className="text-center mb-2">
              <span className="text-sm font-medium">{DEVELOPER_FUND_PERCENTAGE * 100}%</span>
            </div>
            <ArrowDown className="h-6 w-6 text-muted-foreground" />
            <div className="mt-2 w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
              <Gift className="h-8 w-8 text-blue-500" />
            </div>
            <p className="mt-2 text-sm font-medium">No Expectations Fund</p>
            <p className="text-xs text-muted-foreground truncate w-40 text-center">
              {DEVELOPER_FUND_ADDRESS.substring(0, 6)}...{DEVELOPER_FUND_ADDRESS.substring(DEVELOPER_FUND_ADDRESS.length - 4)}
            </p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="text-center mb-2">
              <span className="text-sm font-medium">{BUY_BURN_PERCENTAGE * 100}%</span>
            </div>
            <ArrowDown className="h-6 w-6 text-muted-foreground" />
            <div className="mt-2 w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
              <Flame className="h-8 w-8 text-orange-500" />
            </div>
            <p className="mt-2 text-sm font-medium">Buy & Burn</p>
            <p className="text-xs text-muted-foreground">Increases token value</p>
          </div>
        </div>
      </div>
    </div>
  );
}
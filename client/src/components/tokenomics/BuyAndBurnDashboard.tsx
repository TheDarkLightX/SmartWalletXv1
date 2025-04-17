import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, TrendingUp } from "lucide-react";
import { BUY_BURN_PERCENTAGE } from "@/lib/tokenomics";

export function BuyAndBurnDashboard() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Buy & Burn Mechanism
        </CardTitle>
        <CardDescription>
          {BUY_BURN_PERCENTAGE * 100}% of all fees are used for buying and burning
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Buy & Burn Allocation</span>
            <span className="font-medium">{BUY_BURN_PERCENTAGE * 100}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Burn Address</span>
            <span className="font-mono text-xs">0x000...dEaD</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">DEX Integration</span>
            <span>PulseX</span>
          </div>
        </div>
        
        <div className="h-32 md:h-40 flex items-center justify-center p-4 bg-muted/50 rounded-md">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-primary/60" />
            <p className="mt-2 text-muted-foreground">
              Buy & Burn statistics will appear here when transactions occur
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
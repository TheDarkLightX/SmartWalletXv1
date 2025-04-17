import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TOKEN_DISCOUNT_TIERS, FEE_PERCENTAGE } from "@/lib/tokenomics";

export function DiscountTokenOverview() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Fee Discount Chart</h3>
            <Badge variant="outline">
              Base Fee: {FEE_PERCENTAGE * 100}%
            </Badge>
          </div>
          
          <div className="space-y-5">
            {TOKEN_DISCOUNT_TIERS.map((tier, index) => {
              const value = tier.discountPercentage * 100;
              const remainingFee = FEE_PERCENTAGE * (1 - tier.discountPercentage) * 100;
              
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{tier.minTokens.toLocaleString()} tokens</span>
                    <span className="text-primary">{value}% off</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={value} className="h-2" />
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {remainingFee.toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 text-xs text-muted-foreground">
            <p>
              Hold tokens to reduce transaction fees. The discount is applied
              automatically based on your token balance.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { BadgePercent, TrendingUp, Flame, CreditCard, Gift, Shield } from "lucide-react";
import { 
  DEVELOPER_FUND_ADDRESS, 
  FEE_PERCENTAGE, 
  DEVELOPER_FUND_PERCENTAGE, 
  BUY_BURN_PERCENTAGE,
  TOKEN_DISCOUNT_TIERS
} from "@/lib/tokenomics";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import BuyAndBurnDashboard from "./BuyAndBurnDashboard";
import TokenFlowVisualization from "./TokenFlowVisualization";
import DiscountTokenOverview from "./DiscountTokenOverview";

export default function TokenomicsOverview() {
  const [activeTab, setActiveTab] = useState("overview");
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Tokenomics
        </CardTitle>
        <CardDescription>
          Transparent fee distribution and token utility
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="fee-structure">Fee Structure</TabsTrigger>
            <TabsTrigger value="no-expectations">No Expectations Fund</TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="pt-6">
          <TabsContent value="overview" className="mt-0 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Fee Distribution</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-blue-500" />
                      <span>No Expectations Fund</span>
                    </div>
                    <span className="font-medium">{DEVELOPER_FUND_PERCENTAGE * 100}%</span>
                  </div>
                  <Progress value={DEVELOPER_FUND_PERCENTAGE * 100} className="h-2 bg-muted" />
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span>Buy & Burn</span>
                    </div>
                    <span className="font-medium">{BUY_BURN_PERCENTAGE * 100}%</span>
                  </div>
                  <Progress value={BUY_BURN_PERCENTAGE * 100} className="h-2 bg-muted" />
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Base Transaction Fee</h3>
                <div className="flex items-center justify-between bg-muted p-4 rounded-md">
                  <div className="flex items-center gap-2">
                    <BadgePercent className="h-5 w-5 text-primary" />
                    <span>Standard Fee</span>
                  </div>
                  <span className="text-xl font-semibold">{FEE_PERCENTAGE * 100}%</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  This small fee helps maintain and improve the wallet, with 75% used for 
                  buying and burning tokens to increase scarcity.
                </p>
              </div>
            </div>
            
            <Separator />
            
            <TokenFlowVisualization />
          </TabsContent>
          
          <TabsContent value="fee-structure" className="mt-0 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Token Discount Tiers</h3>
                <div className="space-y-4">
                  {TOKEN_DISCOUNT_TIERS.map((tier, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <Shield className={`h-4 w-4 ${index >= 4 ? 'text-purple-500' : index >= 2 ? 'text-blue-500' : 'text-green-500'}`} />
                        <span>{tier.minTokens.toLocaleString()} Tokens</span>
                      </div>
                      <span className="font-semibold text-primary">{tier.discountPercentage * 100}% Off</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <DiscountTokenOverview />
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium mb-4">Premium Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-2">
                      <div className="space-y-1">
                        <h4 className="font-medium">Advanced AI Trading Strategies</h4>
                        <p className="text-sm text-muted-foreground">AI-generated trading insights</p>
                      </div>
                      <div className="bg-primary/10 text-primary px-2 py-1 rounded text-sm font-medium">
                        $9.99
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-2">
                      <div className="space-y-1">
                        <h4 className="font-medium">Enhanced Privacy</h4>
                        <p className="text-sm text-muted-foreground">Advanced zero-knowledge proofs</p>
                      </div>
                      <div className="bg-primary/10 text-primary px-2 py-1 rounded text-sm font-medium">
                        $4.99
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="no-expectations" className="mt-0 space-y-6">
            <div className="bg-muted p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <Gift className="h-5 w-5 text-blue-500" />
                No Expectations Fund
              </h3>
              
              <p className="mb-4 text-muted-foreground">
                The No Expectations Fund allocates 25% of all transaction fees to the developer
                to support ongoing work without any obligations or expectations.
              </p>
              
              <div className="space-y-2">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Fund Address (PulseChain)</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-background p-2 rounded text-xs sm:text-sm w-full overflow-auto font-mono">
                      {DEVELOPER_FUND_ADDRESS}
                    </code>
                    <button
                      className="text-primary hover:text-primary/80"
                      onClick={() => {
                        navigator.clipboard.writeText(DEVELOPER_FUND_ADDRESS);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Fund Principles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <path d="M12 22V8" />
                        <path d="m2 10 10-8 10 8" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium">No Expectations</h4>
                      <p className="text-muted-foreground">
                        Contributions are made without any expectation of future
                        development or returns.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <path d="M16 22h2c.5 0 1-.2 1.4-.6.4-.4.6-.9.6-1.4V7.5L14.5 2H6c-.5 0-1 .2-1.4.6C4.2 3 4 3.5 4 4v3" />
                        <polyline points="14 2 14 8 20 8" />
                        <circle cx="8" cy="16" r="6" />
                        <path d="M9.5 17.5 8 16.25V14" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium">Voluntary Support</h4>
                      <p className="text-muted-foreground">
                        A way to support development without creating a traditional
                        business relationship.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <path d="M7 10v12" />
                        <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium">Transparency</h4>
                      <p className="text-muted-foreground">
                        All funds are tracked on-chain with complete transparency
                        on the PulseChain blockchain.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <BuyAndBurnDashboard />
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
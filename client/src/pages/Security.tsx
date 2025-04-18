import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Shield, AlertTriangle, Check, LockKeyhole, Fingerprint, Smartphone } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Security() {
  const { toast } = useToast();
  const [is2faEnabled, setIs2faEnabled] = useState(true);
  const [isHighValueConfirmEnabled, setIsHighValueConfirmEnabled] = useState(true);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [highValueThreshold, setHighValueThreshold] = useState(1.0); // ETH
  
  // For a real implementation, we would fetch the user ID from an auth context
  const userId = 1;

  // Fetch user data
  const { data: user } = useQuery({
    queryKey: [`/api/users/${userId}`],
  });

  // Update security settings
  const updateSecuritySettings = useMutation({
    mutationFn: async () => {
      return await apiRequest("PUT", `/api/users/${userId}`, {
        is2faEnabled,
        securitySettings: {
          highValueConfirmation: isHighValueConfirmEnabled,
          highValueThreshold,
          notifications: isNotificationsEnabled
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      toast({
        title: "Settings updated",
        description: "Your security settings have been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update security settings: " + error,
        variant: "destructive",
      });
    }
  });

  // Run security audit
  const runSecurityAudit = useMutation({
    mutationFn: async () => {
      // In a real implementation, this would call an API endpoint to perform a security audit
      return await new Promise(resolve => {
        setTimeout(() => {
          resolve({
            score: 85,
            recommendations: [
              "Add at least one more guardian for social recovery",
              "Enable privacy features for high-value transactions",
              "Review your recent network connections"
            ]
          });
        }, 1500);
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Security audit completed",
        description: `Your security score is ${data.score}/100`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to run security audit: " + error,
        variant: "destructive",
      });
    }
  });

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Security Settings</h1>
          
          <Button 
            variant="outline"
            onClick={() => runSecurityAudit.mutate()}
            disabled={runSecurityAudit.isPending}
          >
            <Shield className="mr-2 h-4 w-4" />
            {runSecurityAudit.isPending ? "Running..." : "Run Security Audit"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Security Overview */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Security Status</CardTitle>
                <CardDescription>
                  Current security level and recommendations
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                  <div className="mb-4 md:mb-0">
                    <h3 className="text-lg font-medium mb-2">Security Score</h3>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold mr-2">{user?.securityScore || 85}/100</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        Good
                      </span>
                    </div>
                  </div>
                  
                  <div className="w-full md:w-96">
                    <Progress value={user?.securityScore || 85} className="h-2" />
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                      <span>Needs Improvement</span>
                      <span>Good</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center text-green-500 mb-2">
                      <Check className="h-5 w-5 mr-2" />
                      <h4 className="font-medium">Two-Factor Authentication</h4>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Your account is protected with 2FA authentication for high-value transfers.
                    </p>
                  </div>
                  
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center text-amber-500 mb-2">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      <h4 className="font-medium">Social Recovery</h4>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      You have 2 active guardians. We recommend at least 3 guardians for optimal security.
                    </p>
                    <Button variant="link" className="p-0 h-auto text-sm mt-1" asChild>
                      <a href="/social-recovery">Add more guardians</a>
                    </Button>
                  </div>
                  
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center text-green-500 mb-2">
                      <Check className="h-5 w-5 mr-2" />
                      <h4 className="font-medium">Transaction Privacy</h4>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Privacy features are enabled for your transactions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Security Actions */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common security tasks
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/social-recovery">
                    <i className="ri-team-line mr-3 text-lg"></i>
                    Manage Social Recovery
                  </a>
                </Button>
                
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/privacy-tools">
                    <i className="ri-eye-off-line mr-3 text-lg"></i>
                    Configure Privacy Settings
                  </a>
                </Button>
                
                <Button variant="outline" className="w-full justify-start" onClick={() => runSecurityAudit.mutate()}>
                  <i className="ri-shield-check-line mr-3 text-lg"></i>
                  Run Security Audit
                </Button>
                
                <Alert className="mt-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Remember to never share your private keys or seed phrase with anyone.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Security Settings */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure authentication and security parameters
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="authentication">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="authentication">Authentication</TabsTrigger>
                  <TabsTrigger value="transaction">Transaction Security</TabsTrigger>
                </TabsList>
                
                <TabsContent value="authentication">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center">
                          <LockKeyhole className="h-5 w-5 mr-2 text-primary" />
                          <Label className="text-base">Two-Factor Authentication</Label>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Require additional verification when accessing your wallet
                        </p>
                      </div>
                      <Switch
                        checked={is2faEnabled}
                        onCheckedChange={setIs2faEnabled}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center">
                          <Smartphone className="h-5 w-5 mr-2 text-primary" />
                          <Label className="text-base">Device Management</Label>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Manage devices that have access to your wallet
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center">
                          <Fingerprint className="h-5 w-5 mr-2 text-primary" />
                          <Label className="text-base">Biometric Authentication</Label>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Enable fingerprint or face recognition for access
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Setup
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="transaction">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">High-Value Transaction Confirmation</Label>
                        <p className="text-sm text-muted-foreground">
                          Require extra verification for transactions above threshold
                        </p>
                      </div>
                      <Switch
                        checked={isHighValueConfirmEnabled}
                        onCheckedChange={setIsHighValueConfirmEnabled}
                      />
                    </div>
                    
                    {isHighValueConfirmEnabled && (
                      <div className="flex items-end gap-4">
                        <div className="space-y-2 flex-1">
                          <Label htmlFor="threshold">Threshold Amount (ETH)</Label>
                          <Input
                            id="threshold"
                            type="number"
                            value={highValueThreshold}
                            onChange={(e) => setHighValueThreshold(parseFloat(e.target.value))}
                            step={0.1}
                            min={0.1}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 flex-shrink-0">
                          Approx. ${(highValueThreshold * 1928.50).toFixed(2)} USD
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Transaction Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive alerts for all wallet transactions
                        </p>
                      </div>
                      <Switch
                        checked={isNotificationsEnabled}
                        onCheckedChange={setIsNotificationsEnabled}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Whitelist Addresses</Label>
                        <p className="text-sm text-muted-foreground">
                          Manage trusted addresses for easier transactions
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="mt-6 pt-6 border-t">
                <Button 
                  onClick={() => updateSecuritySettings.mutate()}
                  disabled={updateSecuritySettings.isPending}
                  className="w-full md:w-auto"
                >
                  {updateSecuritySettings.isPending ? "Saving..." : "Save Security Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

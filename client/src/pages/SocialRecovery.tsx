import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { User, Shield, UserPlus, CheckCircle, AlertCircle, X } from "lucide-react";
import SocialRecoverySetup from "@/components/wallet/SocialRecoverySetup";
import { apiRequest } from "@/lib/queryClient";

export default function SocialRecovery() {
  const { toast } = useToast();
  const [showAddGuardian, setShowAddGuardian] = useState(false);
  const [guardianAddress, setGuardianAddress] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [recoveryThreshold, setRecoveryThreshold] = useState(2);
  const [selectedGuardian, setSelectedGuardian] = useState<any>(null);
  
  // For a real implementation, we would fetch the user ID from an auth context
  const userId = 1;

  // Fetch wallet
  const { data: wallets } = useQuery({
    queryKey: [`/api/users/${userId}/wallets`],
  });

  // Fetch guardians
  const { data: guardians, isLoading } = useQuery({
    queryKey: [`/api/wallets/${wallets?.[0]?.id}/guardians`],
    enabled: !!wallets && wallets.length > 0,
  });

  // Add new guardian
  const addGuardian = useMutation({
    mutationFn: async () => {
      if (!wallets || wallets.length === 0) {
        throw new Error("No wallet found");
      }
      
      return await apiRequest("POST", "/api/guardians", {
        userId,
        walletId: wallets[0].id,
        guardianAddress,
        guardianName,
        email: guardianEmail,
        isActive: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/wallets/${wallets?.[0]?.id}/guardians`] });
      toast({
        title: "Guardian added",
        description: "The guardian has been added successfully",
      });
      setShowAddGuardian(false);
      setGuardianAddress("");
      setGuardianName("");
      setGuardianEmail("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add guardian: " + error,
        variant: "destructive",
      });
    }
  });

  // Remove guardian
  const removeGuardian = useMutation({
    mutationFn: async (guardianId: number) => {
      return await apiRequest("DELETE", `/api/guardians/${guardianId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/wallets/${wallets?.[0]?.id}/guardians`] });
      toast({
        title: "Guardian removed",
        description: "The guardian has been removed successfully",
      });
      setSelectedGuardian(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove guardian: " + error,
        variant: "destructive",
      });
    }
  });

  // Update threshold
  const updateThreshold = useMutation({
    mutationFn: async () => {
      // In a real implementation, this would update the threshold in the smart contract
      // and update the wallet settings in the backend
      return await apiRequest("PUT", `/api/wallets/${wallets?.[0]?.id}`, {
        recoveryThreshold
      });
    },
    onSuccess: () => {
      toast({
        title: "Threshold updated",
        description: `Recovery threshold updated to ${recoveryThreshold} of ${guardians?.length} guardians`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update threshold: " + error,
        variant: "destructive",
      });
    }
  });

  // Calculate active guardians
  const activeGuardians = guardians?.filter(g => g.isActive) || [];
  const hasEnoughGuardians = activeGuardians.length >= recoveryThreshold;

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Social Recovery</h1>
          
          <Dialog open={showAddGuardian} onOpenChange={setShowAddGuardian}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-700">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Guardian
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Guardian</DialogTitle>
                <DialogDescription>
                  Guardians can help you recover your wallet if you lose access.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="guardianAddress">Ethereum Address</Label>
                  <Input
                    id="guardianAddress"
                    placeholder="0x..."
                    value={guardianAddress}
                    onChange={(e) => setGuardianAddress(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="guardianName">Guardian Name</Label>
                  <Input
                    id="guardianName"
                    placeholder="John Doe"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="guardianEmail">Contact Email (Optional)</Label>
                  <Input
                    id="guardianEmail"
                    type="email"
                    placeholder="john@example.com"
                    value={guardianEmail}
                    onChange={(e) => setGuardianEmail(e.target.value)}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddGuardian(false)}>Cancel</Button>
                <Button 
                  onClick={() => addGuardian.mutate()}
                  disabled={!guardianAddress || !guardianName || addGuardian.isPending}
                >
                  {addGuardian.isPending ? "Adding..." : "Add Guardian"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recovery Status */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recovery Status</CardTitle>
                <CardDescription>
                  Your wallet can be recovered if you lose access
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="p-6 bg-gray-50 dark:bg-dark-200 rounded-lg mb-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center mb-4 md:mb-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        hasEnoughGuardians 
                          ? "bg-green-100 dark:bg-green-900 text-green-500"
                          : "bg-amber-100 dark:bg-amber-900 text-amber-500"
                      }`}>
                        {hasEnoughGuardians ? <CheckCircle className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium">
                          {hasEnoughGuardians ? "Recovery Enabled" : "Recovery Setup Needed"}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {hasEnoughGuardians 
                            ? `${activeGuardians.length} active guardians, ${recoveryThreshold} required`
                            : `Add at least ${recoveryThreshold} guardians to enable recovery`
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {!hasEnoughGuardians && (
                        <Button
                          variant="outline"
                          onClick={() => setShowAddGuardian(true)}
                        >
                          Add Guardian
                        </Button>
                      )}
                      
                      {guardians && guardians.length > 0 && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant={hasEnoughGuardians ? "default" : "outline"}>
                              Manage Threshold
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Recovery Threshold</DialogTitle>
                              <DialogDescription>
                                Set how many guardians are required to recover your wallet
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="py-4">
                              <div className="flex items-center justify-center space-x-4">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setRecoveryThreshold(Math.max(1, recoveryThreshold - 1))}
                                  disabled={recoveryThreshold <= 1}
                                >
                                  -
                                </Button>
                                <div className="text-center">
                                  <span className="text-3xl font-bold">{recoveryThreshold}</span>
                                  <p className="text-sm text-gray-500">of {guardians.length} guardians</p>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setRecoveryThreshold(Math.min(guardians.length, recoveryThreshold + 1))}
                                  disabled={recoveryThreshold >= guardians.length}
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                            
                            <DialogFooter>
                              <Button
                                onClick={() => updateThreshold.mutate()}
                                disabled={updateThreshold.isPending}
                              >
                                {updateThreshold.isPending ? "Updating..." : "Update Threshold"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Guardians List */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Your Guardians</h3>
                  
                  {isLoading ? (
                    <p className="text-center text-gray-500 py-4">Loading guardians...</p>
                  ) : !guardians || guardians.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                      <User className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500 mb-4">No guardians added yet</p>
                      <Button onClick={() => setShowAddGuardian(true)}>
                        Add Your First Guardian
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {guardians.map((guardian) => (
                        <div 
                          key={guardian.id}
                          className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                        >
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-500">
                              <User className="h-5 w-5" />
                            </div>
                            <div className="ml-3">
                              <div className="flex items-center">
                                <p className="text-sm font-medium">{guardian.guardianName}</p>
                                <Badge variant={guardian.isActive ? "success" : "secondary"} className="ml-2">
                                  {guardian.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                {guardian.guardianAddress.substring(0, 6)}...{guardian.guardianAddress.substring(38)}
                              </p>
                            </div>
                          </div>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <X className="h-4 w-4 text-gray-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Guardian</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove {guardian.guardianName} as a guardian? 
                                  This may affect your ability to recover your wallet.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <Button
                                  variant="destructive"
                                  onClick={() => removeGuardian.mutate(guardian.id)}
                                  disabled={removeGuardian.isPending}
                                >
                                  {removeGuardian.isPending ? "Removing..." : "Remove Guardian"}
                                </Button>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Recovery Guide */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Recovery Guide</CardTitle>
                <CardDescription>
                  How to recover your wallet with guardians
                </CardDescription>
              </CardHeader>
              
              <Tabs defaultValue="setup">
                <div className="px-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="setup">Setup</TabsTrigger>
                    <TabsTrigger value="recover">Recover</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="setup">
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300">
                          1
                        </div>
                        <div className="ml-4">
                          <h4 className="text-sm font-medium">Add guardians</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Add trusted friends or family members as guardians to help recover your wallet.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300">
                          2
                        </div>
                        <div className="ml-4">
                          <h4 className="text-sm font-medium">Set threshold</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Determine how many guardians need to approve to recover your wallet.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300">
                          3
                        </div>
                        <div className="ml-4">
                          <h4 className="text-sm font-medium">Inform your guardians</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Let your guardians know they've been selected and explain the recovery process.
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <Button 
                          className="w-full"
                          onClick={() => setShowAddGuardian(true)}
                          disabled={guardians && guardians.length >= 5}
                        >
                          {guardians && guardians.length >= 5 
                            ? "Maximum guardians reached (5)" 
                            : guardians && guardians.length > 0 
                              ? "Add Another Guardian" 
                              : "Start Setup"
                          }
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </TabsContent>
                
                <TabsContent value="recover">
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300">
                          1
                        </div>
                        <div className="ml-4">
                          <h4 className="text-sm font-medium">Initiate recovery</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Start the recovery process with your wallet's recovery page.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300">
                          2
                        </div>
                        <div className="ml-4">
                          <h4 className="text-sm font-medium">Contact guardians</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Reach out to your guardians and ask them to approve the recovery request.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300">
                          3
                        </div>
                        <div className="ml-4">
                          <h4 className="text-sm font-medium">Complete recovery</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Once enough guardians approve, you can regain access to your wallet.
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <Button 
                          className="w-full"
                          variant="outline"
                          onClick={() => {
                            // This would open the recovery wizard in a real implementation
                            toast({
                              title: "Recovery process",
                              description: "Recovery process started. Contact your guardians.",
                            });
                          }}
                        >
                          Start Recovery Process
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
        
        {/* Testing Recovery */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Your Recovery Setup</CardTitle>
              <CardDescription>
                It's important to verify your recovery process works before you need it
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <SocialRecoverySetup />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

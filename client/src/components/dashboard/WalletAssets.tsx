import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Asset } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface WalletAssetsProps {
  assets: Asset[];
  isLoading: boolean;
}

const WalletAssets = ({ assets = [], isLoading = false }: WalletAssetsProps) => {
  const { toast } = useToast();
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [newAsset, setNewAsset] = useState({
    symbol: "",
    name: "",
    balance: "",
    value: ""
  });

  // Add new asset mutation
  const addAsset = useMutation({
    mutationFn: async () => {
      // In a real implementation, this would call an API to add the asset
      return await apiRequest("POST", "/api/assets", {
        userId: 1,
        walletId: 1,
        symbol: newAsset.symbol,
        name: newAsset.name,
        balance: newAsset.balance,
        value: newAsset.value,
        priceChange: "+0.0%",
      });
    },
    onSuccess: () => {
      toast({
        title: "Asset added",
        description: `${newAsset.symbol} has been added to your wallet`,
      });
      setIsAddAssetOpen(false);
      setNewAsset({
        symbol: "",
        name: "",
        balance: "",
        value: ""
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add asset: ${error}`,
        variant: "destructive",
      });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Assets</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {isLoading ? (
            // Loading skeletons
            Array(3).fill(0).map((_, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="ml-3">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-3 w-12 ml-auto" />
                </div>
              </div>
            ))
          ) : assets.length === 0 ? (
            // Empty state
            <div className="text-center py-6">
              <i className="ri-coin-line text-4xl text-gray-300 mb-2"></i>
              <p className="text-gray-500">No assets in your wallet</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsAddAssetOpen(true)}
                className="mt-2"
              >
                Add your first asset
              </Button>
            </div>
          ) : (
            // Assets list
            assets.map((asset) => (
              <div key={asset.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-xs">{asset.symbol}</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{asset.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">${(parseFloat(asset.value) / parseFloat(asset.balance)).toFixed(2)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{asset.balance} {asset.symbol}</p>
                  <p className={`text-xs ${asset.priceChange.startsWith('+') ? 'text-green-500' : asset.priceChange.startsWith('-') ? 'text-red-500' : 'text-gray-500'}`}>
                    {asset.priceChange}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-dark-200">
          <Dialog open={isAddAssetOpen} onOpenChange={setIsAddAssetOpen}>
            <DialogTrigger asChild>
              <Button className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-700">
                <i className="ri-add-line mr-2"></i>
                Add New Asset
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Asset</DialogTitle>
                <DialogDescription>
                  Enter the details of the cryptocurrency you want to add to your wallet.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="symbol" className="text-right">
                    Symbol
                  </Label>
                  <Input
                    id="symbol"
                    placeholder="ETH"
                    value={newAsset.symbol}
                    onChange={(e) => setNewAsset({...newAsset, symbol: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="Ethereum"
                    value={newAsset.name}
                    onChange={(e) => setNewAsset({...newAsset, name: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="balance" className="text-right">
                    Balance
                  </Label>
                  <Input
                    id="balance"
                    type="number"
                    placeholder="0.0"
                    value={newAsset.balance}
                    onChange={(e) => setNewAsset({...newAsset, balance: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="value" className="text-right">
                    Value (USD)
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    placeholder="0.00"
                    value={newAsset.value}
                    onChange={(e) => setNewAsset({...newAsset, value: e.target.value})}
                    className="col-span-3"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddAssetOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => addAsset.mutate()}
                  disabled={!newAsset.symbol || !newAsset.name || !newAsset.balance || !newAsset.value || addAsset.isPending}
                >
                  {addAsset.isPending ? "Adding..." : "Add Asset"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletAssets;

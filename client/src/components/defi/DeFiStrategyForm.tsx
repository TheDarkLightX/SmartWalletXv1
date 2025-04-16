import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Wallet, Strategy, insertStrategySchema } from "@/shared/schema";
import { useNetwork } from "@/hooks/useNetwork";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  DeFiProtocol, 
  DeFiProtocolType, 
  StrategyActionType,
  getProtocolById,
  getSupportedAssets,
  supportedProtocols,
} from "@/lib/defi-protocols";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import ProtocolSelector from "./ProtocolSelector";

// Extended schema with validation
const strategyFormSchema = insertStrategySchema
  .extend({
    protocolId: z.string().min(1, "Protocol selection is required"),
    actionType: z.string().min(1, "Action type is required"),
    tokenAddress: z.string().min(1, "Token selection is required"),
    targetTokenAddress: z.string().optional(),
    amountPercentage: z.number().min(0).max(100),
    targetApy: z.number().min(0).optional(),
    maxSlippage: z.number().min(0).max(10),
    rebalanceThreshold: z.number().min(0).max(100).optional(),
    stopLoss: z.number().min(0).max(100).optional(),
    takeProfit: z.number().min(0).max(1000).optional(),
  })
  .omit({ conditions: true, actions: true });

type DeFiStrategyFormValues = z.infer<typeof strategyFormSchema>;

interface DeFiStrategyFormProps {
  wallets: Wallet[];
  userId: number;
  onSuccess: (strategy: Strategy) => void;
  defaultWalletId?: number;
  existingStrategy?: Strategy;
}

const DeFiStrategyForm: React.FC<DeFiStrategyFormProps> = ({
  wallets,
  userId,
  onSuccess,
  defaultWalletId,
  existingStrategy,
}) => {
  const { toast } = useToast();
  const { currentNetwork } = useNetwork();
  const [isProtocolSelectorOpen, setIsProtocolSelectorOpen] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<DeFiProtocol | null>(
    existingStrategy?.conditions?.protocolId 
      ? supportedProtocols.find(p => p.id === existingStrategy.conditions.protocolId) || null
      : null
  );

  const defaultActionType = existingStrategy?.conditions?.actionType || "";

  // Get default values from existing strategy if available
  const defaultValues: Partial<DeFiStrategyFormValues> = {
    userId,
    walletId: defaultWalletId || (wallets.length > 0 ? wallets[0].id : 0),
    name: existingStrategy?.name || "",
    description: existingStrategy?.description || "",
    type: existingStrategy?.type || "defi", // Default to defi type
    isActive: existingStrategy?.isActive ?? true,
    protocolId: existingStrategy?.conditions?.protocolId || "",
    actionType: existingStrategy?.conditions?.actionType || "",
    tokenAddress: existingStrategy?.conditions?.tokenAddress || "",
    targetTokenAddress: existingStrategy?.conditions?.targetTokenAddress || "",
    amountPercentage: existingStrategy?.conditions?.amountPercentage || 0,
    targetApy: existingStrategy?.conditions?.targetApy || 0,
    maxSlippage: existingStrategy?.conditions?.maxSlippage || 0.5,
    rebalanceThreshold: existingStrategy?.conditions?.rebalanceThreshold || 5,
    stopLoss: existingStrategy?.conditions?.stopLoss || 0,
    takeProfit: existingStrategy?.conditions?.takeProfit || 0,
    schedule: existingStrategy?.schedule || "0 0 * * 1", // Default to weekly on Monday
  };

  const form = useForm<DeFiStrategyFormValues>({
    resolver: zodResolver(strategyFormSchema),
    defaultValues,
  });

  // Watch for changes to action type to conditionally render fields
  const actionType = form.watch("actionType");
  const selectedWalletId = form.watch("walletId");
  const selectedTokenAddress = form.watch("tokenAddress");

  // Get supported assets for the selected protocol
  const supportedAssets = selectedProtocol 
    ? getSupportedAssets(selectedProtocol.id)
    : [];

  // Create strategy mutation
  const createStrategy = useMutation({
    mutationFn: async (data: DeFiStrategyFormValues) => {
      // Convert form data to strategy data
      const strategyData = {
        userId: data.userId,
        walletId: data.walletId,
        name: data.name,
        description: data.description,
        type: "defi", // Set type to defi explicitly for these strategies
        conditions: {
          protocolId: data.protocolId,
          actionType: data.actionType,
          tokenAddress: data.tokenAddress,
          targetTokenAddress: data.targetTokenAddress || null,
          amountPercentage: data.amountPercentage,
          targetApy: data.targetApy || null,
          maxSlippage: data.maxSlippage,
          rebalanceThreshold: data.rebalanceThreshold || null,
          stopLoss: data.stopLoss || null,
          takeProfit: data.takeProfit || null,
          network: currentNetwork
        },
        actions: {
          executeImmediately: false,
          notifyOnExecution: true,
          retryOnFailure: true,
          maxRetries: 3
        },
        schedule: data.schedule,
        isActive: data.isActive
      };

      if (existingStrategy) {
        // Update strategy
        const response = await apiRequest("PUT", `/api/strategies/${existingStrategy.id}`, strategyData);
        return response.json();
      } else {
        // Create new strategy
        const response = await apiRequest("POST", "/api/strategies", strategyData);
        return response.json();
      }
    },
    onSuccess: (strategy) => {
      toast({
        title: existingStrategy ? "Strategy updated" : "Strategy created",
        description: existingStrategy
          ? "Your DeFi strategy has been updated successfully"
          : "Your new DeFi strategy has been created successfully",
      });
      // Invalidate strategies queries
      queryClient.invalidateQueries({ queryKey: [`/api/wallets/${selectedWalletId}/strategies`] });
      onSuccess(strategy);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${existingStrategy ? "update" : "create"} strategy: ${error.toString()}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DeFiStrategyFormValues) => {
    createStrategy.mutate(data);
  };

  // Handle protocol selection
  const handleProtocolSelect = (protocol: DeFiProtocol) => {
    setSelectedProtocol(protocol);
    form.setValue("protocolId", protocol.id);
    
    // Reset token selection when protocol changes
    form.setValue("tokenAddress", "");
    form.setValue("targetTokenAddress", "");
    
    // Set default action type based on protocol type
    switch (protocol.type) {
      case DeFiProtocolType.DEX:
        form.setValue("actionType", StrategyActionType.SWAP);
        break;
      case DeFiProtocolType.LENDING:
        form.setValue("actionType", StrategyActionType.BORROW);
        break;
      case DeFiProtocolType.YIELD_AGGREGATOR:
        form.setValue("actionType", StrategyActionType.YIELD_FARM);
        break;
      case DeFiProtocolType.LIQUID_STAKING:
        form.setValue("actionType", StrategyActionType.STAKE);
        break;
      default:
        form.setValue("actionType", "");
    }
  };

  // Get available action types for the selected protocol
  const getAvailableActionTypes = () => {
    if (!selectedProtocol) return [];
    
    switch (selectedProtocol.type) {
      case DeFiProtocolType.DEX:
        return [
          StrategyActionType.SWAP,
          StrategyActionType.ADD_LIQUIDITY,
          StrategyActionType.REMOVE_LIQUIDITY
        ];
      case DeFiProtocolType.LENDING:
        return [
          StrategyActionType.BORROW,
          StrategyActionType.REPAY
        ];
      case DeFiProtocolType.YIELD_AGGREGATOR:
        return [
          StrategyActionType.YIELD_FARM,
          StrategyActionType.CLAIM_REWARDS
        ];
      case DeFiProtocolType.LIQUID_STAKING:
        return [
          StrategyActionType.STAKE,
          StrategyActionType.UNSTAKE
        ];
      default:
        return Object.values(StrategyActionType);
    }
  };

  // Helper function to get a more friendly display name for action types
  const getActionTypeDisplayName = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Basic Information Section */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Strategy Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter strategy name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="walletId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Wallet</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select wallet" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id.toString()}>
                        {wallet.address.substring(0, 6)}...{wallet.address.substring(wallet.address.length - 4)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Strategy Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your strategy"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* DeFi Protocol Selection */}
        <FormField
          control={form.control}
          name="protocolId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>DeFi Protocol</FormLabel>
              <FormControl>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setIsProtocolSelectorOpen(true)}
                  >
                    {selectedProtocol ? (
                      <div className="flex items-center">
                        <i className={`ri-${selectedProtocol.type.toLowerCase()}-line mr-2`}></i>
                        <span>{selectedProtocol.name}</span>
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          ({selectedProtocol.chain === 'pulsechain' ? 'PulseChain' : 'Ethereum'})
                        </span>
                      </div>
                    ) : (
                      "Select DeFi Protocol"
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Action Type Selection */}
        {selectedProtocol && (
          <FormField
            control={form.control}
            name="actionType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Action Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select action type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {getAvailableActionTypes().map((actionType) => (
                      <SelectItem key={actionType} value={actionType}>
                        {getActionTypeDisplayName(actionType)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Token Selection */}
        {selectedProtocol && actionType && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="tokenAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {actionType === StrategyActionType.SWAP
                      ? "From Token"
                      : actionType === StrategyActionType.ADD_LIQUIDITY
                      ? "First Token"
                      : "Token"}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select token" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {supportedAssets.map((asset) => (
                        <SelectItem key={asset.address} value={asset.address}>
                          {asset.symbol} - {asset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Target Token for Swap/Liquidity */}
            {(actionType === StrategyActionType.SWAP ||
              actionType === StrategyActionType.ADD_LIQUIDITY) && (
              <FormField
                control={form.control}
                name="targetTokenAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {actionType === StrategyActionType.SWAP
                        ? "To Token"
                        : "Second Token"}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select token" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {supportedAssets
                          .filter(
                            (asset) => asset.address !== selectedTokenAddress
                          )
                          .map((asset) => (
                            <SelectItem
                              key={asset.address}
                              value={asset.address}
                            >
                              {asset.symbol} - {asset.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        )}

        {/* Amount Percentage Slider */}
        {selectedProtocol && actionType && (
          <FormField
            control={form.control}
            name="amountPercentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount Percentage</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      defaultValue={[field.value || 0]}
                      onValueChange={(value) => field.onChange(value[0])}
                    />
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">0%</span>
                      <span className="text-sm font-medium">{field.value || 0}%</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">100%</span>
                    </div>
                  </div>
                </FormControl>
                <FormDescription>
                  Percentage of available assets to use for this strategy
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Max Slippage Tolerance */}
        {selectedProtocol && (actionType === StrategyActionType.SWAP || 
          actionType === StrategyActionType.ADD_LIQUIDITY) && (
          <FormField
            control={form.control}
            name="maxSlippage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Slippage Tolerance (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    placeholder="0.5"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Maximum acceptable slippage percentage for transactions
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Target APY for yield farming */}
        {selectedProtocol && actionType === StrategyActionType.YIELD_FARM && (
          <FormField
            control={form.control}
            name="targetApy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target APY (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Enter target APY"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Target Annual Percentage Yield (strategy will search for best pools)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Rebalance Threshold */}
        {selectedProtocol && (
          <FormField
            control={form.control}
            name="rebalanceThreshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rebalance Threshold (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    placeholder="5"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Price deviation percentage that triggers strategy rebalancing
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Risk Management - Stop Loss and Take Profit */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="stopLoss"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stop Loss (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    placeholder="Optional"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>
                  Exit position if loss exceeds this percentage
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="takeProfit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Take Profit (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="Optional"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>
                  Exit position when profit reaches this percentage
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Execution Schedule */}
        <FormField
          control={form.control}
          name="schedule"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Execution Schedule (CRON format)</FormLabel>
              <FormControl>
                <Input
                  placeholder="0 0 * * 1"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                When this strategy should be executed (e.g., "0 0 * * 1" for weekly on Monday)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Active Status */}
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <FormDescription>
                  Enable or disable this strategy
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={createStrategy.isPending} className="w-full">
          {createStrategy.isPending ? (
            <>
              <i className="ri-loader-4-line animate-spin mr-2"></i>
              {existingStrategy ? "Updating..." : "Creating..."}
            </>
          ) : (
            existingStrategy ? "Update Strategy" : "Create Strategy"
          )}
        </Button>
      </form>

      {/* Protocol Selector Dialog */}
      <ProtocolSelector
        isOpen={isProtocolSelectorOpen}
        onClose={() => setIsProtocolSelectorOpen(false)}
        onSelect={handleProtocolSelect}
        defaultChain={currentNetwork}
      />
    </Form>
  );
};

export default DeFiStrategyForm;
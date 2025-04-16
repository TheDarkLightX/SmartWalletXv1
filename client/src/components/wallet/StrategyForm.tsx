import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Strategy } from "@shared/schema";

interface StrategyFormProps {
  initialStrategy: Strategy | null;
  onComplete: () => void;
}

// Create strategy form schema
const strategySchema = z.object({
  name: z.string().min(3, "Strategy name must be at least 3 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  type: z.enum(['dca', 'liquidity', 'custom', 'ai-generated']),
  schedule: z.string().optional(),
  isActive: z.boolean().default(true),
  // Simplified conditions and actions for this example
  conditionAsset: z.string().optional(),
  conditionType: z.string().optional(),
  conditionValue: z.string().optional(),
  actionType: z.string().optional(),
  actionAsset: z.string().optional(),
  actionAmount: z.string().optional(),
});

type StrategyFormValues = z.infer<typeof strategySchema>;

const StrategyForm = ({ initialStrategy, onComplete }: StrategyFormProps) => {
  const { toast } = useToast();
  const isEditing = !!initialStrategy;

  // Initialize form with default values or existing strategy
  const form = useForm<StrategyFormValues>({
    resolver: zodResolver(strategySchema),
    defaultValues: initialStrategy ? {
      name: initialStrategy.name,
      description: initialStrategy.description,
      type: initialStrategy.type as any,
      schedule: initialStrategy.schedule || undefined,
      isActive: initialStrategy.isActive,
      // Parse conditions and actions objects for editing
      // This is a simplified version - in a real app, you'd have more detailed parsing
      conditionAsset: initialStrategy.conditions ? Object.keys(initialStrategy.conditions)[0] : undefined,
      conditionType: initialStrategy.conditions ? "price" : undefined,
      conditionValue: initialStrategy.conditions ? String(Object.values(initialStrategy.conditions)[0]) : undefined,
      actionType: initialStrategy.actions ? Object.keys(initialStrategy.actions)[0] : undefined,
      actionAsset: initialStrategy.actions?.buy || initialStrategy.actions?.sell || undefined,
      actionAmount: initialStrategy.actions?.amount ? String(initialStrategy.actions.amount) : undefined,
    } : {
      name: "",
      description: "",
      type: "dca",
      isActive: true,
      conditionAsset: "ETH",
      conditionType: "price",
      conditionValue: "",
      actionType: "buy",
      actionAsset: "ETH",
      actionAmount: "",
    }
  });

  // Create or update strategy mutation
  const saveStrategy = useMutation({
    mutationFn: async (data: StrategyFormValues) => {
      // For a real implementation, this would call your API to save the strategy
      // Convert form data to the expected API format
      const strategyData = {
        userId: 1, // Hardcoded for example
        walletId: 1, // Hardcoded for example
        name: data.name,
        description: data.description,
        type: data.type,
        conditions: {
          [data.conditionAsset || "ETH"]: data.conditionValue || "0"
        },
        actions: {
          [data.actionType || "buy"]: data.actionAsset || "ETH",
          amount: data.actionAmount || "0"
        },
        schedule: data.schedule,
        isActive: data.isActive
      };

      if (isEditing && initialStrategy) {
        // Update existing strategy
        return await apiRequest("PUT", `/api/strategies/${initialStrategy.id}`, strategyData);
      } else {
        // Create new strategy
        return await apiRequest("POST", "/api/strategies", strategyData);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch strategies
      queryClient.invalidateQueries({ queryKey: ["/api/wallets/1/strategies"] });
      
      toast({
        title: isEditing ? "Strategy updated" : "Strategy created",
        description: isEditing 
          ? `Your strategy has been updated successfully` 
          : `Your new strategy has been created successfully`,
      });
      
      onComplete();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} strategy: ${error}`,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: StrategyFormValues) => {
    saveStrategy.mutate(data);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Edit Strategy" : "Create New Strategy"}</DialogTitle>
        <DialogDescription>
          {isEditing 
            ? "Update your automated trading strategy settings" 
            : "Set up an automated trading strategy for your wallet"}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Strategy Name</FormLabel>
                <FormControl>
                  <Input placeholder="Daily ETH Purchase" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe what this strategy does" 
                    {...field} 
                    className="resize-none" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Strategy Type</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a strategy type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="dca">Dollar-Cost Averaging</SelectItem>
                    <SelectItem value="liquidity">Liquidity Provision</SelectItem>
                    <SelectItem value="custom">Custom Strategy</SelectItem>
                    <SelectItem value="ai-generated">AI-Generated Strategy</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  The type of automated strategy to execute
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4 border rounded-md p-4">
            <h3 className="text-sm font-medium">Conditions</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="conditionAsset"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select asset" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ETH">ETH</SelectItem>
                        <SelectItem value="USDC">USDC</SelectItem>
                        <SelectItem value="WBTC">WBTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="conditionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condition</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Condition type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="price">Price</SelectItem>
                        <SelectItem value="time">Time</SelectItem>
                        <SelectItem value="volume">Volume</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="conditionValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value</FormLabel>
                    <FormControl>
                      <Input placeholder="Condition value" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="space-y-4 border rounded-md p-4">
            <h3 className="text-sm font-medium">Actions</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="actionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="buy">Buy</SelectItem>
                        <SelectItem value="sell">Sell</SelectItem>
                        <SelectItem value="swap">Swap</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="actionAsset"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select asset" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ETH">ETH</SelectItem>
                        <SelectItem value="USDC">USDC</SelectItem>
                        <SelectItem value="WBTC">WBTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="actionAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input placeholder="0.1" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <FormField
            control={form.control}
            name="schedule"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Schedule (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="CRON expression (e.g., 0 9 * * 1)" {...field} />
                </FormControl>
                <FormDescription>
                  Cron expression for when this strategy should run, or leave empty for event-based execution
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active</FormLabel>
                  <FormDescription>
                    Whether this strategy is currently active and executing
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

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onComplete}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={saveStrategy.isPending}
            >
              {saveStrategy.isPending 
                ? isEditing ? "Updating..." : "Creating..." 
                : isEditing ? "Update Strategy" : "Create Strategy"
              }
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
};

export default StrategyForm;

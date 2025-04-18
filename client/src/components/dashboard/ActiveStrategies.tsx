import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import StrategyForm from "@/components/wallet/StrategyForm";
import { Strategy } from "@shared/schema";

interface ActiveStrategiesProps {
  strategies: Strategy[];
  isLoading: boolean;
}

const ActiveStrategies = ({ strategies = [], isLoading = false }: ActiveStrategiesProps) => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);

  // Edit strategy mutation
  const editStrategy = useMutation({
    mutationFn: async (strategy: Strategy) => {
      // This would make an API call in a real implementation
      await new Promise(resolve => setTimeout(resolve, 500));
      return strategy;
    },
    onSuccess: () => {
      toast({
        title: "Strategy updated",
        description: "Your strategy has been updated successfully"
      });
      setIsModalOpen(false);
      setSelectedStrategy(null);
    }
  });

  // Delete strategy mutation
  const deleteStrategy = useMutation({
    mutationFn: async (id: number) => {
      // This would make an API call in a real implementation
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Strategy deleted",
        description: "Your strategy has been deleted successfully"
      });
    }
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Active Strategies</CardTitle>
          
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-primary hover:bg-primary-700 focus:outline-none">
                <i className="ri-add-line mr-1"></i> New Strategy
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <StrategyForm 
                initialStrategy={selectedStrategy} 
                onComplete={() => {
                  setIsModalOpen(false);
                  setSelectedStrategy(null);
                }} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeletons
            Array(2).fill(0).map((_, index) => (
              <div key={index} className="border border-gray-200 dark:border-dark-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <Skeleton className="h-5 w-40 mb-1" />
                      <Skeleton className="h-5 w-16 ml-2 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-64 mt-1" />
                  </div>
                  <div className="flex">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full ml-2" />
                  </div>
                </div>
                <div className="mt-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full mt-1" />
                </div>
              </div>
            ))
          ) : strategies.length === 0 ? (
            // Empty state
            <div className="text-center py-6">
              <i className="ri-robot-line text-4xl text-gray-300 mb-2"></i>
              <p className="text-gray-500">No active strategies yet</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="mt-2"
              >
                Create your first strategy
              </Button>
            </div>
          ) : (
            // Strategies list
            strategies.map((strategy) => (
              <div key={strategy.id} className="border border-gray-200 dark:border-dark-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-md font-medium text-gray-900 dark:text-white">{strategy.name}</h3>
                      {strategy.type === 'ai-generated' ? (
                        <Badge variant="outline" className="ml-2 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 border-none">
                          <i className="ri-robot-line mr-1"></i> AI
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-none">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{strategy.description}</p>
                  </div>
                  <div className="flex">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                      onClick={() => {
                        setSelectedStrategy(strategy);
                        setIsModalOpen(true);
                      }}
                    >
                      <i className="ri-edit-line"></i>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="ml-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                      onClick={() => deleteStrategy.mutate(strategy.id)}
                    >
                      <i className="ri-delete-bin-line"></i>
                    </Button>
                  </div>
                </div>
                <div className="mt-3 text-sm">
                  <div className="flex justify-between text-gray-500 dark:text-gray-400">
                    <span>Next execution:</span>
                    <span>{strategy.nextExecution ? new Date(strategy.nextExecution).toLocaleDateString() : 'Watching for conditions...'}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 dark:text-gray-400 mt-1">
                    <span>
                      {strategy.type === 'dca' ? 'Total invested:' : 'Current yield:'}
                    </span>
                    <span>
                      {strategy.type === 'dca' ? '$450.00' : '4.2% APY'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="mt-4 text-center">
          <Button 
            variant="link" 
            className="text-primary hover:text-primary-700 text-sm font-medium"
            onClick={() => navigate("/ai-strategies")}
          >
            View all strategies <i className="ri-arrow-right-line align-middle ml-1"></i>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActiveStrategies;

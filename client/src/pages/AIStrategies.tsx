import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import StrategyForm from "@/components/wallet/StrategyForm";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";

export default function AIStrategies() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [conversation, setConversation] = useState<{ role: string, content: string }[]>([
    {
      role: "system",
      content: "I'm your AI trading strategy assistant. I can help you create automated trading strategies for your smart wallet."
    }
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<any>(null);
  
  // For a real implementation, we would fetch the user ID from an auth context
  const userId = 1;

  // Fetch user's wallet
  const { data: wallets } = useQuery({
    queryKey: [`/api/users/${userId}/wallets`],
  });

  // Fetch strategies
  const { data: strategies, isLoading: isLoadingStrategies } = useQuery({
    queryKey: [`/api/wallets/${wallets?.[0]?.id}/strategies`],
    enabled: !!wallets && wallets.length > 0,
  });

  // Handle AI strategy generation
  const generateStrategy = useMutation({
    mutationFn: async () => {
      const newMessage = { role: "user", content: prompt };
      const updatedConversation = [...conversation, newMessage];
      
      // In a real implementation, this would call an external AI API
      const aiResponse = {
        role: "assistant",
        content: `Here's a strategy based on your request: "${prompt}"\n\n` + 
                 "I recommend a dollar-cost averaging strategy that buys ETH every week when the price drops below the 7-day moving average."
      };
      
      const finalConversation = [...updatedConversation, aiResponse];
      
      // Save the conversation to our backend
      await apiRequest("POST", "/api/ai-conversations", {
        userId,
        conversation: finalConversation,
        result: null // This would be populated with an actual strategy in a real implementation
      });
      
      setConversation(finalConversation);
      setPrompt("");
      
      return finalConversation;
    },
    onSuccess: () => {
      toast({
        title: "Strategy generated",
        description: "Your AI strategy has been generated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate strategy: " + error,
        variant: "destructive",
      });
    }
  });

  // Handle strategy creation from AI suggestion
  const createStrategyFromAI = () => {
    setSelectedStrategy({
      name: "AI-Generated Strategy",
      description: "Dollar-cost averaging strategy for ETH",
      type: "ai-generated",
      conditions: { "price": "below 7-day MA" },
      actions: { "buy": "ETH", "amount": "0.1" },
      schedule: "0 12 * * 1", // Every Monday at 12 PM
      isActive: true
    });
    setIsModalOpen(true);
  };

  // Handle deleting a strategy
  const deleteStrategy = useMutation({
    mutationFn: async (strategyId: number) => {
      return await apiRequest("DELETE", `/api/strategies/${strategyId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/wallets/${wallets?.[0]?.id}/strategies`] });
      toast({
        title: "Strategy deleted",
        description: "The strategy has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete strategy: " + error,
        variant: "destructive",
      });
    }
  });

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Strategies</h1>
          
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-700">
                <i className="ri-add-line mr-2"></i>
                New Strategy
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Conversation Area */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>AI Strategy Assistant</CardTitle>
                <CardDescription>
                  Describe your investment goals and I'll suggest an optimal strategy
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-grow">
                <ScrollArea className="h-[400px] w-full pr-4">
                  {conversation.slice(1).map((message, index) => (
                    <div key={index} className={`mb-4 ${
                      message.role === "user" ? "text-right" : "text-left"
                    }`}>
                      <div className={`inline-block max-w-[80%] px-4 py-2 rounded-lg ${
                        message.role === "user" 
                          ? "bg-primary text-white" 
                          : "bg-gray-100 dark:bg-dark-200 text-gray-900 dark:text-white"
                      }`}>
                        {message.content}
                      </div>
                    </div>
                  ))}
                  
                  {generateStrategy.isPending && (
                    <div className="text-left mb-4">
                      <div className="inline-block max-w-[80%] px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-200">
                        <div className="flex space-x-2 items-center">
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-150"></div>
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-300"></div>
                          <span className="text-gray-500 dark:text-gray-400 ml-2">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
              
              <CardFooter className="border-t">
                <div className="flex w-full items-center space-x-2">
                  <Textarea
                    placeholder="Describe your investment strategy goals..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="flex-grow"
                  />
                  <Button 
                    onClick={() => generateStrategy.mutate()}
                    disabled={!prompt.trim() || generateStrategy.isPending}
                  >
                    <i className="ri-send-plane-fill mr-2"></i>
                    Send
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
          
          {/* Strategies List */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Your Strategies</CardTitle>
              </CardHeader>
              
              <Tabs defaultValue="active">
                <div className="px-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="inactive">Inactive</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="active">
                  <CardContent>
                    <div className="space-y-4">
                      {isLoadingStrategies ? (
                        <p className="text-center text-gray-500 py-4">Loading strategies...</p>
                      ) : strategies?.filter(s => s.isActive).length === 0 ? (
                        <div className="text-center py-6">
                          <i className="ri-robot-line text-3xl text-gray-400 mb-2"></i>
                          <p className="text-gray-500">No active strategies yet</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={createStrategyFromAI}
                          >
                            Try an AI suggestion
                          </Button>
                        </div>
                      ) : (
                        strategies?.filter(s => s.isActive).map((strategy) => (
                          <div key={strategy.id} className="border border-gray-200 dark:border-dark-200 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center">
                                  <h3 className="text-md font-medium text-gray-900 dark:text-white">{strategy.name}</h3>
                                  {strategy.type === 'ai-generated' && (
                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                                      <i className="ri-robot-line mr-1"></i> AI
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{strategy.description}</p>
                              </div>
                              
                              <div className="flex">
                                <button 
                                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                  onClick={() => {
                                    setSelectedStrategy(strategy);
                                    setIsModalOpen(true);
                                  }}
                                >
                                  <i className="ri-edit-line"></i>
                                </button>
                                <button 
                                  className="ml-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                  onClick={() => deleteStrategy.mutate(strategy.id)}
                                >
                                  <i className="ri-delete-bin-line"></i>
                                </button>
                              </div>
                            </div>
                            
                            <div className="mt-3 text-sm">
                              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                                <span>Next execution:</span>
                                <span>{strategy.nextExecution ? new Date(strategy.nextExecution).toLocaleDateString() : 'Conditional'}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </TabsContent>
                
                <TabsContent value="inactive">
                  <CardContent>
                    <div className="space-y-4">
                      {isLoadingStrategies ? (
                        <p className="text-center text-gray-500 py-4">Loading strategies...</p>
                      ) : strategies?.filter(s => !s.isActive).length === 0 ? (
                        <div className="text-center py-6">
                          <p className="text-gray-500">No inactive strategies</p>
                        </div>
                      ) : (
                        strategies?.filter(s => !s.isActive).map((strategy) => (
                          <div key={strategy.id} className="border border-gray-200 dark:border-dark-200 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center">
                                  <h3 className="text-md font-medium text-gray-900 dark:text-white">{strategy.name}</h3>
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                    Inactive
                                  </span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{strategy.description}</p>
                              </div>
                              
                              <div className="flex">
                                <button 
                                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                  onClick={() => {
                                    setSelectedStrategy(strategy);
                                    setIsModalOpen(true);
                                  }}
                                >
                                  <i className="ri-edit-line"></i>
                                </button>
                                <button 
                                  className="ml-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                  onClick={() => deleteStrategy.mutate(strategy.id)}
                                >
                                  <i className="ri-delete-bin-line"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

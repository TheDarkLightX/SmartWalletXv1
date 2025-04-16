import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const QuickActions = () => {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // This would be replaced with real mutations in a production app
  const sendMutation = useMutation({
    mutationFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Sending ETH",
        description: "Redirecting to transaction page...",
      });
      navigate("/transactions");
    }
  });

  const receiveMutation = useMutation({
    mutationFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Receive ETH",
        description: "Your wallet address has been copied to clipboard",
      });
      // Copy wallet address to clipboard in real implementation
      navigator.clipboard.writeText("0x71C7656EC7ab88b098defB751B7401B5f6d8976F");
    }
  });

  const swapMutation = useMutation({
    mutationFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Swap tokens",
        description: "Redirecting to swap interface...",
      });
      navigate("/transactions");
    }
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-dark-300 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-200 h-auto transition"
            onClick={() => sendMutation.mutate()}
            disabled={sendMutation.isPending}
          >
            <div className="w-10 h-10 rounded-full bg-primary bg-opacity-10 flex items-center justify-center text-primary mb-2">
              <i className="ri-send-plane-line text-xl"></i>
            </div>
            <span className="text-sm font-medium">Send</span>
          </Button>
          
          <Button 
            variant="outline"
            className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-dark-300 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-200 h-auto transition"
            onClick={() => receiveMutation.mutate()}
            disabled={receiveMutation.isPending}
          >
            <div className="w-10 h-10 rounded-full bg-green-500 bg-opacity-10 flex items-center justify-center text-green-500 mb-2">
              <i className="ri-download-line text-xl"></i>
            </div>
            <span className="text-sm font-medium">Receive</span>
          </Button>
          
          <Button 
            variant="outline"
            className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-dark-300 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-200 h-auto transition"
            onClick={() => swapMutation.mutate()}
            disabled={swapMutation.isPending}
          >
            <div className="w-10 h-10 rounded-full bg-accent bg-opacity-10 flex items-center justify-center text-accent mb-2">
              <i className="ri-repeat-line text-xl"></i>
            </div>
            <span className="text-sm font-medium">Swap</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;

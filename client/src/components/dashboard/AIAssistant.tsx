import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

const AIAssistant = () => {
  const [, navigate] = useLocation();

  return (
    <div className="bg-gradient-to-br from-accent to-indigo-500 shadow rounded-lg p-6 text-white">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
          <i className="ri-robot-line text-xl"></i>
        </div>
        <h2 className="ml-3 text-lg font-medium">AI Strategy Assistant</h2>
      </div>
      
      <p className="text-white text-opacity-90 text-sm mb-4">
        Let AI help you create optimized trading and investment strategies based on your goals.
      </p>
      
      <div className="space-y-2">
        <div 
          className="flex items-center p-2 bg-white bg-opacity-10 rounded-lg cursor-pointer hover:bg-opacity-20 transition"
          onClick={() => navigate("/ai-strategies")}
        >
          <i className="ri-line-chart-line mr-2"></i>
          <span className="text-sm">Generate DeFi yield strategy</span>
        </div>
        
        <div 
          className="flex items-center p-2 bg-white bg-opacity-10 rounded-lg cursor-pointer hover:bg-opacity-20 transition"
          onClick={() => navigate("/ai-strategies")}
        >
          <i className="ri-funds-box-line mr-2"></i>
          <span className="text-sm">Create portfolio rebalance plan</span>
        </div>
        
        <div 
          className="flex items-center p-2 bg-white bg-opacity-10 rounded-lg cursor-pointer hover:bg-opacity-20 transition"
          onClick={() => navigate("/ai-strategies")}
        >
          <i className="ri-timer-line mr-2"></i>
          <span className="text-sm">Set up dollar-cost averaging</span>
        </div>
      </div>
      
      <Button 
        className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-purple-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        onClick={() => navigate("/ai-strategies")}
      >
        <i className="ri-message-3-line mr-2"></i>
        Ask AI Assistant
      </Button>
    </div>
  );
};

export default AIAssistant;

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Check, ArrowRight } from "lucide-react";

const SocialRecoverySetup = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [testInProgress, setTestInProgress] = useState(false);
  const [stepsCompleted, setStepsCompleted] = useState<boolean[]>([false, false, false]);

  const startTest = () => {
    setTestInProgress(true);
    setCurrentStep(0);
    setStepsCompleted([false, false, false]);
    
    toast({
      title: "Recovery test started",
      description: "Follow the steps to test your recovery setup",
    });
  };

  const completeCurrentStep = () => {
    const newStepsCompleted = [...stepsCompleted];
    newStepsCompleted[currentStep] = true;
    setStepsCompleted(newStepsCompleted);
    
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      // All steps completed
      setTestInProgress(false);
      toast({
        title: "Recovery test completed",
        description: "Your social recovery setup is working correctly",
        variant: "success",
      });
    }
  };

  const testSteps = [
    {
      title: "Request Recovery",
      description: "Simulate initiating a wallet recovery request",
      action: "Initiate Request"
    },
    {
      title: "Guardian Approvals",
      description: "Simulate guardians approving the recovery request",
      action: "Simulate Approvals"
    },
    {
      title: "Wallet Recovery",
      description: "Simulate completing the recovery process",
      action: "Complete Recovery"
    }
  ];

  return (
    <div className="space-y-6">
      {!testInProgress ? (
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            It's recommended to test your recovery process before you need it in an emergency.
            This will help ensure your guardians know what to do and that the process works correctly.
          </p>
          <Button onClick={startTest}>
            Start Recovery Test
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Recovery Test</h3>
            <p className="text-sm text-gray-500">Step {currentStep + 1} of 3</p>
          </div>

          <div className="space-y-4">
            {testSteps.map((step, index) => (
              <Card key={index} className={`${
                index === currentStep ? 'border-primary' : 
                stepsCompleted[index] ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 
                'opacity-50'
              }`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                        stepsCompleted[index] 
                          ? 'bg-green-100 dark:bg-green-900 text-green-500' 
                          : index === currentStep 
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-500' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                      }`}>
                        {stepsCompleted[index] ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">{step.title}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{step.description}</p>
                      </div>
                    </div>
                    
                    {index === currentStep && (
                      <Button 
                        size="sm"
                        onClick={completeCurrentStep}
                      >
                        {step.action}
                      </Button>
                    )}
                    
                    {index < currentStep && (
                      <span className="text-sm text-green-500 font-medium">Completed</span>
                    )}
                    
                    {index > currentStep && (
                      <Button variant="outline" size="sm" disabled>
                        Pending
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator />
          
          {currentStep === 2 && stepsCompleted[0] && stepsCompleted[1] ? (
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Complete the final step to finish testing your recovery process.
              </p>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                onClick={() => {
                  setTestInProgress(false);
                  toast({
                    title: "Test cancelled",
                    description: "Recovery test has been cancelled",
                  });
                }}
              >
                Cancel Test
              </Button>
              
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">
                  Step {currentStep + 1} of 3
                </span>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => {
                    if (currentStep < 2) {
                      setCurrentStep(currentStep + 1);
                    }
                  }}
                  disabled={currentStep >= 2}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SocialRecoverySetup;

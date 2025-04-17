import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Security Disclaimer Component
 * 
 * This component shows a security disclaimer to warn users that the software
 * has not been formally audited and should be used at their own risk.
 */
const SecurityDisclaimer = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  // Check local storage on mount to see if the user has already acknowledged the disclaimer
  useEffect(() => {
    const acknowledged = localStorage.getItem('security-disclaimer-acknowledged');
    if (acknowledged === 'true') {
      setHasAcknowledged(true);
      setIsVisible(false);
    }
  }, []);

  // Handle dismissing the disclaimer
  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('security-disclaimer-acknowledged', 'true');
    setHasAcknowledged(true);
  };

  if (!isVisible) return null;

  return (
    <Alert className="mb-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
      <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
      <div className="flex-1">
        <AlertTitle className="text-yellow-800 dark:text-yellow-300 font-bold">Security Disclaimer</AlertTitle>
        <AlertDescription className="text-yellow-700 dark:text-yellow-400">
          This wallet has not yet undergone a formal security audit. While we've implemented best practices throughout, 
          you are using this software at your own risk. We recommend starting with small amounts until the code has been 
          properly audited by security professionals.
        </AlertDescription>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        className="ml-2 border-yellow-500 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  );
};

export default SecurityDisclaimer;
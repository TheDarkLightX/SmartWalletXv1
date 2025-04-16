import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SecurityToolsProps {
  securityScore?: number;
  activeGuardians: number;
  totalGuardians: number;
  isPrivacyEnabled: boolean;
  is2faEnabled?: boolean;
  isLoading: boolean;
}

const SecurityTools = ({
  securityScore = 0,
  activeGuardians = 0,
  totalGuardians = 0,
  isPrivacyEnabled = false,
  is2faEnabled = false,
  isLoading = false
}: SecurityToolsProps) => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [is2faToggled, setIs2faToggled] = useState(is2faEnabled);

  // Toggle 2FA authentication
  const toggle2fa = useMutation({
    mutationFn: async (enabled: boolean) => {
      // In a real implementation, this would update the user's settings
      return await apiRequest("PUT", `/api/users/1`, {
        is2faEnabled: enabled
      });
    },
    onSuccess: () => {
      toast({
        title: is2faToggled ? "2FA Enabled" : "2FA Disabled",
        description: is2faToggled 
          ? "Two-factor authentication has been enabled for high-value transfers" 
          : "Two-factor authentication has been disabled",
      });
    },
    onError: (error) => {
      // Revert toggle on error
      setIs2faToggled(!is2faToggled);
      toast({
        title: "Error",
        description: `Failed to update 2FA settings: ${error}`,
        variant: "destructive",
      });
    }
  });

  const handle2faToggle = (checked: boolean) => {
    setIs2faToggled(checked);
    toggle2fa.mutate(checked);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Tools</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Social Recovery */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-500">
                <i className="ri-team-line text-xl"></i>
              </div>
              <div className="ml-3">
                {isLoading ? (
                  <>
                    <Skeleton className="h-4 w-28 mb-1" />
                    <Skeleton className="h-3 w-36" />
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Social Recovery</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activeGuardians} of {totalGuardians} guardians active
                    </p>
                  </>
                )}
              </div>
            </div>
            <Button 
              variant="ghost"
              className="text-primary hover:text-primary-700 text-sm font-medium"
              onClick={() => navigate("/social-recovery")}
            >
              Manage
            </Button>
          </div>
          
          {/* Privacy Features */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-500">
                <i className="ri-eye-off-line text-xl"></i>
              </div>
              <div className="ml-3">
                {isLoading ? (
                  <>
                    <Skeleton className="h-4 w-36 mb-1" />
                    <Skeleton className="h-3 w-48" />
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Private Transactions</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isPrivacyEnabled 
                        ? "Enabled for select transfers" 
                        : "Privacy features are disabled"}
                    </p>
                  </>
                )}
              </div>
            </div>
            <Button 
              variant="ghost"
              className="text-primary hover:text-primary-700 text-sm font-medium"
              onClick={() => navigate("/privacy-tools")}
            >
              Configure
            </Button>
          </div>
          
          {/* 2FA */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-500">
                <i className="ri-lock-password-line text-xl"></i>
              </div>
              <div className="ml-3">
                {isLoading ? (
                  <>
                    <Skeleton className="h-4 w-36 mb-1" />
                    <Skeleton className="h-3 w-48" />
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">2FA Authentication</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {is2faToggled 
                        ? "Active for high-value transfers" 
                        : "Disabled - enable for better security"}
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="relative inline-block w-12 mr-2 align-middle select-none">
              <Switch
                checked={is2faToggled}
                onCheckedChange={handle2faToggle}
                disabled={toggle2fa.isPending}
              />
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <Button 
            variant="outline" 
            className="w-full flex justify-center items-center"
            onClick={() => navigate("/security")}
          >
            <i className="ri-shield-check-line mr-2"></i>
            Security Checkup
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecurityTools;

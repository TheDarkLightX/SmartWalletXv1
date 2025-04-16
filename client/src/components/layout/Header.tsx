import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { NetworkSelector } from "@/components/network/NetworkSelector";
import { useAuth } from "@/hooks/useAuth";
import { 
  LogOut, 
  Settings, 
  Bell, 
  User,
  Menu,
  AlertTriangle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header = ({ toggleSidebar }: HeaderProps) => {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  // Get the page title based on the current route
  const getPageTitle = () => {
    switch (location) {
      case "/":
        return "Dashboard";
      case "/transactions":
        return "Transactions";
      case "/ai-strategies":
        return "AI Strategies";
      case "/privacy-tools":
        return "Privacy Tools";
      case "/social-recovery":
        return "Social Recovery";
      case "/security":
        return "Security";
      case "/auth":
        return "Authentication";
      default:
        return "Dashboard";
    }
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
    setLocation("/auth");
  };

  return (
    <header className="bg-white dark:bg-dark-400 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center md:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar}
              className="text-gray-500 hover:text-gray-600"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="hidden md:flex items-center">
            <h2 className="text-xl font-semibold">{getPageTitle()}</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <NetworkSelector />
            
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-600">
              <Bell className="h-5 w-5" />
            </Button>
            
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-600">
              <Settings className="h-5 w-5" />
            </Button>
            
            {/* User profile dropdown */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <User className="h-4 w-4" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
                    {user.username}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation("/security")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Account Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/social-recovery")}>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    <span>Recovery</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation("/auth")}
                className="text-primary"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

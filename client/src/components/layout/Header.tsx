import { Button } from "../ui/button";
import { useLocation } from "wouter";
import { Menu, Wallet } from "lucide-react";

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header = ({ toggleSidebar }: HeaderProps) => {
  const [location, setLocation] = useLocation();
  
  // Get the page title based on the current route
  const getPageTitle = () => {
    switch (location) {
      case "/":
        return "Dashboard";
      case "/wallet/create":
        return "Create Wallet";
      default:
        return "SecureWallet";
    }
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
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setLocation("/wallet/create")}
              className="text-primary flex items-center gap-2"
            >
              <Wallet className="h-4 w-4" />
              <span>Create Wallet</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

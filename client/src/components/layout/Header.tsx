import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { NetworkSelector } from "@/components/network/NetworkSelector";

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header = ({ toggleSidebar }: HeaderProps) => {
  const [location] = useLocation();
  
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
      default:
        return "Dashboard";
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
              <i className="ri-menu-line text-2xl"></i>
            </Button>
          </div>
          
          <div className="hidden md:flex items-center">
            <h2 className="text-xl font-semibold">{getPageTitle()}</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <NetworkSelector />
            
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-600">
              <i className="ri-notification-3-line text-xl"></i>
            </Button>
            
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-600">
              <i className="ri-settings-4-line text-xl"></i>
            </Button>
            
            <div className="md:hidden">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700">
                <i className="ri-user-line"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

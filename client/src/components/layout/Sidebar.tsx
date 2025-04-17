import { Link, useLocation } from "wouter";

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar = ({ onClose }: SidebarProps) => {
  const [location] = useLocation();

  const isActiveRoute = (route: string) => {
    return location === route;
  };

  return (
    <aside className="flex flex-col w-64 bg-white dark:bg-dark-400 border-r border-gray-200 dark:border-dark-200 h-full">
      <div className="p-4 border-b border-gray-200 dark:border-dark-200">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold">SecureWallet</h1>
        </div>
      </div>
      
      <nav className="flex-grow py-4">
        <div className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Navigation
        </div>
        
        <div 
          onClick={() => window.location.href = "/wallet/create"} 
          className={`flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 cursor-pointer ${
            isActiveRoute("/wallet/create") ? "bg-gray-100 dark:bg-dark-600" : ""
          }`}
        >
          <span>Create Wallet</span>
        </div>
        
        <div 
          onClick={() => window.location.href = "/"} 
          className={`flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 cursor-pointer ${
            isActiveRoute("/") ? "bg-gray-100 dark:bg-dark-600" : ""
          }`}
        >
          <span>Home</span>
        </div>
      </nav>
      
      <div className="p-4 border-t border-gray-200 dark:border-dark-200">
        <p className="text-sm text-center text-gray-500">
          v1.0.0 - Secure Wallet
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;

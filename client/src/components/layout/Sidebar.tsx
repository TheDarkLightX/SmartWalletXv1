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
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <i className="ri-wallet-3-line text-white text-xl"></i>
          </div>
          <h1 className="ml-3 text-xl font-semibold">SecureWallet</h1>
        </div>
      </div>
      
      <nav className="flex-grow py-4">
        <div className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Main
        </div>
        <div className={`flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 ${
          isActiveRoute("/") ? "sidebar-menu-item active" : "sidebar-menu-item"
        }`} onClick={() => window.location.href = "/"}>
          <i className="ri-dashboard-line mr-3 text-lg"></i>
          <span>Dashboard</span>
        </div>
        
        <div className={`flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 ${
          isActiveRoute("/transactions") ? "sidebar-menu-item active" : "sidebar-menu-item"
        }`} onClick={() => window.location.href = "/transactions"}>
          <i className="ri-exchange-funds-line mr-3 text-lg"></i>
          <span>Transactions</span>
        </div>
        
        <div className={`flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 ${
          isActiveRoute("/ai-strategies") ? "sidebar-menu-item active" : "sidebar-menu-item"
        }`} onClick={() => window.location.href = "/ai-strategies"}>
          <i className="ri-robot-line mr-3 text-lg"></i>
          <span>AI Strategies</span>
        </div>
        
        <div className={`flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 ${
          isActiveRoute("/privacy-tools") ? "sidebar-menu-item active" : "sidebar-menu-item"
        }`} onClick={() => window.location.href = "/privacy-tools"}>
          <i className="ri-shield-keyhole-line mr-3 text-lg"></i>
          <span>Privacy Tools</span>
        </div>
        
        <div className={`flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 ${
          isActiveRoute("/tokenomics") ? "sidebar-menu-item active" : "sidebar-menu-item"
        }`} onClick={() => window.location.href = "/tokenomics"}>
          <i className="ri-coin-line mr-3 text-lg"></i>
          <span>Tokenomics</span>
        </div>
        
        <div className="px-4 mt-6 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Settings
        </div>
        
        <div className={`flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 ${
          isActiveRoute("/account") ? "sidebar-menu-item active" : "sidebar-menu-item"
        }`} onClick={() => window.location.href = "/account"}>
          <i className="ri-user-settings-line mr-3 text-lg"></i>
          <span>Account</span>
        </div>
        
        <div className={`flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 ${
          isActiveRoute("/social-recovery") ? "sidebar-menu-item active" : "sidebar-menu-item"
        }`} onClick={() => window.location.href = "/social-recovery"}>
          <i className="ri-team-line mr-3 text-lg"></i>
          <span>Social Recovery</span>
        </div>
        
        <div className={`flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 ${
          isActiveRoute("/security") ? "sidebar-menu-item active" : "sidebar-menu-item"
        }`} onClick={() => window.location.href = "/security"}>
          <i className="ri-lock-password-line mr-3 text-lg"></i>
          <span>Security</span>
        </div>
      </nav>
      
      <div className="p-4 border-t border-gray-200 dark:border-dark-200">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700">
            <i className="ri-user-line"></i>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">Alex Morgan</p>
            <p className="text-xs text-gray-500">Connected</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

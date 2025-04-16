import { Link, useLocation } from "wouter";

const MobileNav = () => {
  const [location] = useLocation();
  
  return (
    <nav className="md:hidden fixed bottom-0 w-full bg-white dark:bg-dark-400 border-t border-gray-200 dark:border-dark-200 z-10">
      <div className="grid grid-cols-5 w-full">
        <div 
          className={`flex flex-col items-center py-2 px-2 ${
            location === "/" ? "text-primary" : "text-gray-500 dark:text-gray-400"
          }`}
          onClick={() => window.location.href = "/"}
        >
          <i className="ri-dashboard-line text-xl"></i>
          <span className="text-xs mt-0.5">Home</span>
        </div>
        
        <div 
          className={`flex flex-col items-center py-2 px-2 ${
            location === "/transactions" ? "text-primary" : "text-gray-500 dark:text-gray-400"
          }`}
          onClick={() => window.location.href = "/transactions"}
        >
          <i className="ri-exchange-funds-line text-xl"></i>
          <span className="text-xs mt-0.5">Txs</span>
        </div>
        
        <div 
          className={`flex flex-col items-center py-2 px-2 ${
            location === "/ai-strategies" ? "text-primary" : "text-gray-500 dark:text-gray-400"
          }`}
          onClick={() => window.location.href = "/ai-strategies"}
        >
          <i className="ri-robot-line text-xl"></i>
          <span className="text-xs mt-0.5">AI</span>
        </div>
        
        <div 
          className={`flex flex-col items-center py-2 px-2 ${
            location.startsWith("/tokenomics")
              ? "text-primary" 
              : "text-gray-500 dark:text-gray-400"
          }`}
          onClick={() => window.location.href = "/tokenomics"}
        >
          <i className="ri-coin-line text-xl"></i>
          <span className="text-xs mt-0.5">Tokens</span>
        </div>
        
        <div 
          className={`flex flex-col items-center py-2 px-2 ${
            location.startsWith("/security") || location.startsWith("/privacy-tools") || location.startsWith("/social-recovery") 
              ? "text-primary" 
              : "text-gray-500 dark:text-gray-400"
          }`}
          onClick={() => window.location.href = "/security"}
        >
          <i className="ri-shield-keyhole-line text-xl"></i>
          <span className="text-xs mt-0.5">Security</span>
        </div>
      </div>
    </nav>
  );
};

export default MobileNav;

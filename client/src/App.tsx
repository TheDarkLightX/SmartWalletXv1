import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import AIStrategies from "@/pages/AIStrategies";
import DeFiProtocols from "@/pages/DeFiProtocols";
import PrivacyTools from "@/pages/PrivacyTools";
import SocialRecovery from "@/pages/SocialRecovery";
import Security from "@/pages/Security";
import TokenomicsVisualizer from "@/pages/TokenomicsVisualizer";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { NetworkProvider } from "@/hooks/useNetwork";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/transactions" component={Transactions} />
      <Route path="/ai-strategies" component={AIStrategies} />
      <Route path="/defi-protocols" component={DeFiProtocols} />
      <Route path="/privacy-tools" component={PrivacyTools} />
      <Route path="/social-recovery" component={SocialRecovery} />
      <Route path="/security" component={Security} />
      <Route path="/tokenomics" component={TokenomicsVisualizer} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <QueryClientProvider client={queryClient}>
      <NetworkProvider>
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-dark-300">
          {/* Sidebar */}
          {!isMobile && <Sidebar />}
          
          {/* Mobile sidebar */}
          {isMobile && isSidebarOpen && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={toggleSidebar}>
              <div className="h-full w-64 bg-white dark:bg-dark-400" onClick={(e) => e.stopPropagation()}>
                <Sidebar onClose={toggleSidebar} />
              </div>
            </div>
          )}
          
          {/* Main content */}
          <div className="flex-1 flex flex-col">
            <Header toggleSidebar={toggleSidebar} />
            <main className="flex-1">
              <Router />
            </main>
            {isMobile && <MobileNav />}
          </div>
        </div>
        <Toaster />
      </NetworkProvider>
    </QueryClientProvider>
  );
}

export default App;

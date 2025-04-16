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
import AuthPage from "@/pages/auth-page";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { NetworkProvider } from "@/hooks/useNetwork";
import { AuthProvider } from "@/hooks/useAuth";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/transactions" component={Transactions} />
      <ProtectedRoute path="/ai-strategies" component={AIStrategies} />
      <ProtectedRoute path="/defi-protocols" component={DeFiProtocols} />
      <ProtectedRoute path="/privacy-tools" component={PrivacyTools} />
      <ProtectedRoute path="/social-recovery" component={SocialRecovery} />
      <ProtectedRoute path="/security" component={Security} />
      <ProtectedRoute path="/tokenomics" component={TokenomicsVisualizer} />
      <Route path="/auth" component={AuthPage} />
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
      <AuthProvider>
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
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

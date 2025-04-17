import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import NotFound from "./pages/not-found";
import WalletCreation from "./pages/WalletCreation";
import Dashboard from "./pages/Dashboard";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import MobileNav from "./components/layout/MobileNav";
import SecurityDisclaimer from "./components/layout/SecurityDisclaimer";
import { useState } from "react";
import { useIsMobile } from "./hooks/use-mobile";

// Wallet application router
function AppRouter() {
  return (
    <Switch>
      <Route path="/wallet/create" component={WalletCreation} />
      <Route path="/" component={Dashboard} />
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
            <div className="container px-4 py-4">
              <SecurityDisclaimer />
            </div>
            <AppRouter />
          </main>
          {isMobile && <MobileNav />}
        </div>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;

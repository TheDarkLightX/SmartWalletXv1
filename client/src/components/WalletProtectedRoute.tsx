import { useWallet } from "../hooks/useWallet";
import { Loader2 } from "lucide-react";
import { useLocation, Route, Redirect } from "wouter";

export function WalletProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { wallet } = useWallet();
  const [location] = useLocation();

  if (wallet.isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // Redirect to wallet creation if no wallet is connected
  if (!wallet.isConnected || !wallet.address) {
    return (
      <Route path={path}>
        <Redirect to="/wallet/create" />
      </Route>
    );
  }

  // If wallet is connected, render the component
  return <Route path={path} component={Component} />;
}
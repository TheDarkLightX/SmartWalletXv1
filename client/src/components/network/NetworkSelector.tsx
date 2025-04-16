import { useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNetwork, NetworkKey } from "@/hooks/useNetwork";
import { networks } from "@/lib/ethers";

export function NetworkSelector() {
  const { currentNetwork, setNetwork } = useNetwork();
  const [open, setOpen] = useState(false);
  
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-1 px-3 md:gap-2 md:px-4">
          <Globe className="h-4 w-4" />
          <span className="hidden md:inline-flex">{networks[currentNetwork].name}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {Object.keys(networks).map((networkKey) => (
          <DropdownMenuItem
            key={networkKey}
            onClick={() => {
              setNetwork(networkKey as NetworkKey);
              setOpen(false);
            }}
            className="flex items-center gap-2"
          >
            <div className="flex h-5 w-5 items-center justify-center">
              {currentNetwork === networkKey && <Check className="h-4 w-4" />}
            </div>
            <div className="flex flex-col">
              <span>{networks[networkKey as NetworkKey].name}</span>
              <span className="text-xs text-muted-foreground">
                {networkKey === 'pulsechain' ? 'Primary Network' : 'Secondary Network'}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
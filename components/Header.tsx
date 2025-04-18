import { FC } from 'react';
import { Bell, Settings } from 'lucide-react';
import { useNetwork, useSwitchNetwork } from 'wagmi';

export const Header: FC<{ chains: any[] }> = ({ chains }) => {
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b">
      <div>
        <select
          value={chain?.id}
          onChange={e => switchNetwork?.(+e.target.value)}
          className="p-2 border rounded"
        >
          {chains.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center space-x-4">
        <Bell className="w-6 h-6 cursor-pointer" />
        <Settings className="w-6 h-6 cursor-pointer" />
      </div>
    </header>
  );
};
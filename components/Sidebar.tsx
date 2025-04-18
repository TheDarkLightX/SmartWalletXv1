import { FC } from 'react';
import { Home, CreditCard, Cpu, Shield, BarChart2, Settings, User, Lock } from 'lucide-react';
import Link from 'next/link';

export const Sidebar: FC = () => (
  <aside className="w-64 bg-white border-r">
    <div className="p-6 text-xl font-bold">SecureWallet</div>
    <nav className="px-4 space-y-2">
      <NavItem href="/" icon={<Home />} label="Dashboard" />
      <NavItem href="/transactions" icon={<CreditCard />} label="Transactions" />
      <NavItem href="/ai-strategies" icon={<Cpu />} label="AI Strategies" />
      <NavItem href="/privacy" icon={<Shield />} label="Privacy Tools" />
      <NavItem href="/tokenomics" icon={<BarChart2 />} label="Tokenomics" />
      <hr className="my-4" />
      <NavItem href="/account" icon={<User />} label="Account" />
      <NavItem href="/recovery" icon={<Lock />} label="Social Recovery" />
      <NavItem href="/security" icon={<Shield />} label="Security" />
    </nav>
    <div className="absolute bottom-6 left-6 flex items-center">
      <div className="w-8 h-8 bg-gray-200 rounded-full mr-2"></div>
      <div>Alex Morgan</div>
    </div>
  </aside>
);

const NavItem: FC<{ href: string; icon: React.ReactNode; label: string }> = ({ href, icon, label }) => (
  <Link href={href} className="flex items-center space-x-2 text-gray-700 hover:text-black">
    {icon}
    <span>{label}</span>
  </Link>
);
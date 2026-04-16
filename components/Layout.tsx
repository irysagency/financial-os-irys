import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  History,
  CreditCard,
  RefreshCcw,
  Settings,
  LifeBuoy,
  Search,
  Bell,
  Menu,
  ChevronRight,
  TrendingUp,
  BarChart2,
  Repeat,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
  onOpenModal: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activePage, onNavigate, onOpenModal }) => {
  const { user } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const NavItem = ({ page, icon: Icon, label }: { page: string, icon: any, label: string }) => {
    const isActive = activePage === page;
    return (
      <button
        onClick={() => {
          onNavigate(page);
          setIsMobileMenuOpen(false);
        }}
        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 relative group
          ${isActive 
            ? 'text-[#FF4D00]' 
            : 'text-muted hover:text-white hover:bg-white/5'
          }`}
      >
        {/* Active Left Border Indicator */}
        {isActive && (
          <motion.div 
            layoutId="activeNav"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#FF4D00] rounded-r-full"
          />
        )}
        
        <Icon size={20} className={isActive ? 'text-[#FF4D00]' : 'text-muted group-hover:text-white transition-colors'} />
        {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-main flex text-white font-sans selection:bg-[#FF4D00] selection:text-white">
      
      {/* SIDEBAR */}
      <aside className={`fixed md:sticky top-0 h-screen w-72 bg-card border-r border-[#2A2A2A] flex flex-col z-50 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        {/* LOGO */}
        <div className="p-8 pb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF4D00] rounded-xl flex items-center justify-center text-black font-bold text-xl shadow-[0_0_20px_rgba(255,77,0,0.3)]">
              I
            </div>
            <span className="text-2xl font-bold tracking-tight">Irys</span>
          </div>
        </div>

        {/* USER CARD */}
        <div className="px-6 mb-8">
          <div className="bg-[#1A1A1A] p-3 rounded-2xl flex items-center gap-3 border border-[#2A2A2A]">
            <img src={user?.avatarUrl} alt="User" className="w-10 h-10 rounded-full object-cover" />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{user?.fullName}</p>
              <p className="text-xs text-muted truncate">{user?.username}</p>
            </div>
            <ChevronRight size={16} className="text-muted" />
          </div>
        </div>

        {/* MAIN MENU */}
        <div className="flex-1 px-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-muted px-4 mb-2 uppercase tracking-wider">Main Menu</div>
          <NavItem page="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem page="wallet" icon={Wallet} label="My Wallet" />
          <NavItem page="transfer" icon={ArrowLeftRight} label="Transfer" />
          <NavItem page="transactions"  icon={History}      label="Transactions"  />
          <NavItem page="revenus"       icon={TrendingUp}   label="Revenus"       />
          <NavItem page="pnl"           icon={BarChart2}    label="P&L"           />
          <NavItem page="abonnements"   icon={Repeat}       label="Abonnements"   />
          <NavItem page="payments"      icon={CreditCard}   label="Payments"      />
          <NavItem page="exchange" icon={RefreshCcw} label="Exchange" />

          <div className="text-xs font-semibold text-muted px-4 mt-8 mb-2 uppercase tracking-wider">Preferences</div>
          <NavItem page="settings" icon={Settings} label="Settings" />
          <NavItem page="support" icon={LifeBuoy} label="Support" />
        </div>

        {/* PROMO CARD */}
        <div className="p-6">
          <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-[#1A1A1A] to-black border border-[#2A2A2A]">
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-full bg-[#FF4D00]/20 flex items-center justify-center text-[#FF4D00] mb-3">
                <ArrowLeftRight size={20} />
              </div>
              <h4 className="font-bold text-white mb-1">Upgrade Pro</h4>
              <p className="text-xs text-muted mb-3">Unlock all features</p>
            </div>
            {/* Abstract Glow */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#FF4D00] blur-[60px] opacity-20 pointer-events-none"></div>
          </div>
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" />
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* TOPBAR */}
        <header className="h-20 px-4 md:px-8 border-b border-[#2A2A2A] flex items-center justify-between bg-main/50 backdrop-blur-md sticky top-0 z-30">
          
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-muted hover:text-white">
              <Menu size={24} />
            </button>
            
            <div className="hidden md:flex flex-col">
              <div className="flex items-center gap-2 text-sm text-muted">
                <span className="hover:text-white cursor-pointer transition-colors">Home</span>
                <ChevronRight size={12} />
                <span className="text-white font-medium capitalize">{activePage.replace('-', ' ')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            {/* Search */}
            <div className="hidden md:flex items-center relative">
              <Search size={18} className="absolute left-3 text-muted" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-[#1A1A1A] border border-[#2A2A2A] text-sm text-white rounded-full pl-10 pr-4 py-2.5 w-64 focus:outline-none focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] transition-all placeholder:text-muted/50"
              />
            </div>

            {/* Actions */}
            <button className="p-2.5 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] text-muted hover:text-white transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#FF4D00] rounded-full border-2 border-[#1A1A1A]"></span>
            </button>

            <button className="hidden md:block px-5 py-2.5 rounded-full border border-[#2A2A2A] text-sm font-medium hover:bg-[#1A1A1A] transition-colors">
              Manage
            </button>

            <button 
              onClick={onOpenModal}
              className="px-5 py-2.5 rounded-full bg-[#FF4D00] text-white text-sm font-bold shadow-[0_4px_14px_rgba(255,77,0,0.4)] hover:shadow-[0_6px_20px_rgba(255,77,0,0.6)] hover:scale-105 active:scale-95 transition-all"
            >
              + Add Funds
            </button>
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </div>

      </main>
    </div>
  );
};

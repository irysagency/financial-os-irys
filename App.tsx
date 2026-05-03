import React, { useState } from 'react';
import { SignedIn, SignedOut, SignIn } from '@clerk/clerk-react';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Analytics } from './pages/Analytics';
import { Transactions } from './pages/Transactions';
import { Transfer } from './pages/Transfer';
import { Payments } from './pages/Payments';
import { Settings } from './pages/Settings';
import { Revenus } from './pages/Revenus';
import { PnL } from './pages/PnL';
import { Abonnements } from './pages/Abonnements';

const AppContent = () => {
  const [activePage, setActivePage] = useState('dashboard');

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':    return <Dashboard onNavigate={setActivePage} />;
      case 'wallet':       return <Analytics />;
      case 'transactions': return <Transactions />;
      case 'transfer':     return <Transfer />;
      case 'payments':     return <Payments onNavigate={setActivePage} />;
      case 'settings':     return <Settings />;
      case 'revenus':      return <Revenus />;
      case 'pnl':          return <PnL />;
      case 'abonnements':  return <Abonnements />;
      default:             return <Dashboard onNavigate={setActivePage} />;
    }
  };

  return (
    <Layout activePage={activePage} onNavigate={setActivePage}>
      {renderPage()}
    </Layout>
  );
};

export default function App() {
  return (
    <>
      <SignedOut>
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
          <SignIn routing="hash" />
        </div>
      </SignedOut>
      <SignedIn>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </SignedIn>
    </>
  );
}

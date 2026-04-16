import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
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
import { NewSubscriptionModal } from './components/NewSubscriptionModal';

const AppContent = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addSubscription } = useApp();

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':    return <Dashboard />;
      case 'wallet':       return <Analytics />;
      case 'transactions': return <Transactions />;
      case 'transfer':     return <Transfer />;
      case 'payments':     return <Payments onNavigate={setActivePage} />;
      case 'settings':     return <Settings />;
      case 'revenus':      return <Revenus />;
      case 'pnl':          return <PnL />;
      case 'abonnements':  return <Abonnements />;
      default:             return <Dashboard />;
    }
  };

  return (
    <>
      <Layout
        activePage={activePage}
        onNavigate={setActivePage}
        onOpenModal={() => setIsModalOpen(true)}
      >
        {renderPage()}
      </Layout>
      <NewSubscriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={addSubscription}
      />
    </>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

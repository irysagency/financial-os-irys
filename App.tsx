import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Analytics } from './pages/Analytics'; // Replaces old Projects view
import { Transactions } from './pages/Transactions';
import { NewSubscriptionModal } from './components/NewSubscriptionModal';

const AppContent = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addSubscription } = useApp();

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'wallet': // Mapping "My Wallet" to Analytics View as per visual flow
        return <Analytics />;
      case 'transactions':
        return <Transactions />;
      default:
        return <Dashboard />;
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

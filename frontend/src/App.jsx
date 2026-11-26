import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import BuySellModal from './components/BuySellModal';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import StocksPage from './pages/StocksPage';
import HoldingsPage from './pages/HoldingsPage';
import OrdersPage from './pages/OrdersPage';
import WatchlistPage from './pages/WatchlistPage';
import VivaGuidePage from './pages/VivaGuidePage';
import JavaLabPage from './pages/JavaLabPage';
import { api } from './api/tradelensApi';

function AppLayout({ children }) {
  const [walletBalance, setWalletBalance] = useState(0);
  const [userName, setUserName] = useState('Arnav Malhotra');
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [tradeInitialStock, setTradeInitialStock] = useState(null);
  const [tradeInitialAction, setTradeInitialAction] = useState('BUY');

  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  useEffect(() => {
    loadAccount();
  }, [location.pathname]);

  const loadAccount = async () => {
    try {
      const data = await api.getAccount();
      if (data?.walletBalance !== undefined) {
        setWalletBalance(data.walletBalance);
      }
      if (data?.user?.username) {
        setUserName(data.user.username);
      }
    } catch (err) {
      console.error('Failed to sync account balance:', err);
    }
  };

  const handleOpenTradeModal = (symbol = null, action = 'BUY') => {
    setTradeInitialStock(symbol);
    setTradeInitialAction(action);
    setTradeModalOpen(true);
  };

  if (isLandingPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col">
      <Navbar
        onRefresh={loadAccount}
        walletBalance={walletBalance}
        userName={userName}
      />

      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        <Sidebar onOpenTradeModal={() => handleOpenTradeModal()} />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-full">
          {React.cloneElement(children, {
            onOpenTradeModal: handleOpenTradeModal,
            walletBalance: walletBalance,
          })}
        </main>
      </div>

      <BuySellModal
        isOpen={tradeModalOpen}
        onClose={() => setTradeModalOpen(false)}
        initialStock={tradeInitialStock}
        initialAction={tradeInitialAction}
        onSuccess={loadAccount}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout><LandingPage /></AppLayout>} />
        <Route path="/app" element={<AppLayout><DashboardPage /></AppLayout>} />
        <Route path="/app/stocks" element={<AppLayout><StocksPage /></AppLayout>} />
        <Route path="/app/portfolio" element={<AppLayout><HoldingsPage /></AppLayout>} />
        <Route path="/app/orders" element={<AppLayout><OrdersPage /></AppLayout>} />
        <Route path="/app/watchlist" element={<AppLayout><WatchlistPage /></AppLayout>} />
        <Route path="/app/lab" element={<AppLayout><JavaLabPage /></AppLayout>} />
        <Route path="/app/viva" element={<AppLayout><VivaGuidePage /></AppLayout>} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

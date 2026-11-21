import React from 'react';
import { Outlet } from 'react-router-dom';
import EmergencyStrip from '../common/EmergencyStrip';
import OfflineBanner from '../common/OfflineBanner';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import OutboxDrawer from '../outbox/OutboxDrawer';
import { useApp } from '../../context/AppContext';

export default function Layout({ onResetData }) {
  const { isOnline, lastSyncedAt, outboxItems, triggerSync, isSyncing } = useApp();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* 1. Permanent 112 Emergency Strip */}
      <EmergencyStrip />

      {/* 2. Top Banner (Online/Offline + Last synced + Sync trigger) */}
      <OfflineBanner
        isOnline={isOnline}
        lastSyncedAt={lastSyncedAt}
        outboxCount={outboxItems.length}
        onSyncNow={triggerSync}
        isSyncing={isSyncing}
      />

      {/* 3. Main Navigation Bar */}
      <Navbar onResetData={onResetData} />

      {/* 4. Desktop Navigation Bar (integrated in BottomNav) & Main Content */}
      <BottomNav />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-24 md:pb-12">
        <Outlet />
      </main>

      {/* 5. Mobile Bottom Navigation is rendered inside BottomNav */}

      {/* 6. Outbox Drawer Modal */}
      <OutboxDrawer />
    </div>
  );
}

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { get, set } from 'idb-keyval';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [selectedDistrict, setSelectedDistrictState] = useState(() => {
    return localStorage.getItem('ne_connect_district') || 'ALL_NE';
  });
  
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('ne_connect_lang') || 'en';
  });

  const [deviceToken, setDeviceToken] = useState(() => {
    let token = localStorage.getItem('ne_connect_device_token');
    if (!token) {
      token = 'dev-' + (window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2, 15));
      localStorage.setItem('ne_connect_device_token', token);
    }
    return token;
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncedAt, setLastSyncedAt] = useState(() => {
    return localStorage.getItem('ne_connect_last_sync') || new Date().toISOString();
  });

  const [outboxItems, setOutboxItems] = useState([]);
  const [isOutboxOpen, setIsOutboxOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load outbox queue from IndexedDB
  const refreshOutbox = useCallback(async () => {
    try {
      const queue = (await get('ne_outbox_queue')) || [];
      setOutboxItems(queue);
    } catch (err) {
      console.warn('Failed to load outbox from IndexedDB:', err);
    }
  }, []);

  useEffect(() => {
    refreshOutbox();

    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check every 30s for outbox retry if items exist
    const interval = setInterval(() => {
      if (navigator.onLine && outboxItems.length > 0) {
        triggerSync();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [outboxItems.length]);

  const setSelectedDistrict = (dist) => {
    setSelectedDistrictState(dist);
    localStorage.setItem('ne_connect_district', dist);
  };

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('ne_connect_lang', lang);
  };

  // Sync engine trigger (will integrate with dataService)
  const triggerSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const { dataService } = await import('../services/dataService.js');
      // Sync outbox
      const currentQueue = (await get('ne_outbox_queue')) || [];
      if (currentQueue.length > 0) {
        const results = await dataService.syncBatch(currentQueue);
        // Remove successfully synced items
        const remaining = currentQueue.filter(item => {
          const res = results.find(r => r.client_uuid === item.client_uuid);
          return !(res && (res.result === 'SYNCED' || res.result === 'ALREADY_SYNCED'));
        });
        await set('ne_outbox_queue', remaining);
        setOutboxItems(remaining);
      }
      
      // Update last synced time
      const now = new Date().toISOString();
      setLastSyncedAt(now);
      localStorage.setItem('ne_connect_last_sync', now);
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setIsSyncing(false);
      refreshOutbox();
    }
  };

  const value = {
    selectedDistrict,
    setSelectedDistrict,
    language,
    setLanguage,
    deviceToken,
    isOnline,
    lastSyncedAt,
    setLastSyncedAt,
    outboxItems,
    refreshOutbox,
    isOutboxOpen,
    setIsOutboxOpen,
    isSyncing,
    triggerSync,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for offline PWA precaching
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('PWA: New version available');
  },
  onOfflineReady() {
    console.log('PWA: Northeast Connect is ready for offline operation');
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

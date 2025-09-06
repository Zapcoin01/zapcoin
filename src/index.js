// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// ✅ Import the Telegram Analytics SDK
import telegramAnalytics from '@telegram-apps/analytics';

// ✅ Initialize analytics BEFORE rendering the app
telegramAnalytics.init({
  token: process.env.REACT_APP_TG_ANALYTICS_TOKEN,   // set in Vercel
  appName: process.env.REACT_APP_TG_ANALYTICS_APPNAME, // set in Vercel
});

// (Optional) send a test event so you can confirm it works
if (typeof window !== 'undefined' && window.telegramAnalytics) {
  try {
    window.telegramAnalytics?.event?.('app_started', { env: process.env.NODE_ENV });
  } catch (e) {
    console.log('Analytics test event failed:', e);
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

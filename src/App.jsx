// src/App.jsx
import React from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import BottomNavigationBar from './BottomNavigationBar';

export default function App() {
  const manifestUrl = `${window.location.origin}/tonconnect-manifest.json`;

  return (
    <TonConnectUIProvider
      manifestUrl={manifestUrl}
      actionsConfiguration={{ twaReturnUrl: 'http://localhost:3000'}}
    >
      <BottomNavigationBar />
    </TonConnectUIProvider>
  );
}
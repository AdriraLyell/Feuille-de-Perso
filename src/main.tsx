import React from 'react';
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { RosterApp } from './roster/RosterApp.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

const urlParams = new URLSearchParams(window.location.search);
const rosterSettingId = urlParams.get('roster');

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      {rosterSettingId ? (
        <RosterApp settingId={rosterSettingId} />
      ) : (
        <App />
      )}
    </ErrorBoundary>
  </React.StrictMode>
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SoundProvider } from './contexts/SoundContext';
import { I18nProvider } from './contexts/I18nContext';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <I18nProvider>
      <SoundProvider>
        <App />
      </SoundProvider>
    </I18nProvider>
  </React.StrictMode>
);


import React from 'react';
import ReactDOM from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import '@fontsource-variable/noto-serif-sc/wght.css';
import App from './App';
import AppErrorBoundary from './components/AppErrorBoundary';
import { SoundProvider } from './contexts/SoundContext';
import { I18nProvider } from './contexts/I18nContext';
import { redactAnalyticsEvent } from './utils/analyticsPrivacy';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppErrorBoundary>
      <I18nProvider>
        <SoundProvider>
          <App />
        </SoundProvider>
      </I18nProvider>
      <Analytics beforeSend={redactAnalyticsEvent} />
    </AppErrorBoundary>
  </React.StrictMode>
);

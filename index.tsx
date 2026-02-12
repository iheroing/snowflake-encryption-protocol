
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SoundProvider } from './contexts/SoundContext';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <SoundProvider>
      <App />
    </SoundProvider>
  </React.StrictMode>
);

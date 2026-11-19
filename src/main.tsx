import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CloudSyncProvider } from './context/CloudSyncContext';
import { LanguageProvider } from './context/LanguageContext';
import './index.css';

registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <LanguageProvider>
      <CloudSyncProvider>
        <App />
      </CloudSyncProvider>
    </LanguageProvider>
  </ErrorBoundary>
);

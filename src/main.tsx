import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { LanguageProvider } from './context/LanguageContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
);

// Register service worker for Progressive Web App (PWA) support
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('PWA ServiceWorker registered successfully with scope: ', registration.scope);
      })
      .catch((error) => {
        console.warn('PWA ServiceWorker registration failed: ', error);
      });
  });
} else if ('serviceWorker' in navigator) {
  // Also register in dev/non-prod if browser supports it to help test locally
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('PWA ServiceWorker registered in Dev mode: ', registration.scope);
      })
      .catch((err) => {
        console.log('SW failed in Dev (expected in some frame contexts):', err);
      });
  });
}


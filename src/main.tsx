import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for 0KB network consumption and full offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const isIframe = window.self !== window.top;

    if (isIframe) {
      console.info('Excellence: Running inside development iframe. Disabling Service Worker to ensure instant updates of dynamic changes.');
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
    } else {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Excellence Service Worker registered successfully:', registration.scope);
        })
        .catch((error) => {
          console.error('Excellence Service Worker registration failed:', error);
        });
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);


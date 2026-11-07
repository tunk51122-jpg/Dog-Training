import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Avoid caching Vite's development modules; register the worker for production builds.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const workerUrl = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker
      .register(workerUrl, { scope: import.meta.env.BASE_URL })
      .catch(() => {
        // The app remains usable online if service-worker registration is unavailable.
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('PawMaster root element (#root) was not found.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);

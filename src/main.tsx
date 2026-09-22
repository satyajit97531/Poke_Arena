import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { LoadingProvider } from './context/LoadingContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <LoadingProvider>
        <App />
      </LoadingProvider>
    </ErrorBoundary>
  </StrictMode>,
);


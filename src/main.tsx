import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n';
import './styles.css';
import { App } from './ui/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* The first locale loads as its own chunk; render once it is there. */}
    <Suspense fallback={null}>
      <App />
    </Suspense>
  </StrictMode>,
);

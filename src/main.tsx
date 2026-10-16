import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { brandNameAr, brandNameEn } from './brand/brand';
import { AuthCallback } from './auth/AuthCallback';
import { App } from './App';

document.title = `${brandNameAr} | ${brandNameEn}`;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {window.location.pathname === '/auth/callback' ? <AuthCallback /> : <App />}
  </StrictMode>,
);

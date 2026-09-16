import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

/*
 * Self-hosted fonts, woff2 subsets only (mission budget):
 *  - Poppins (latin) — the legacy en font, weights actually used 400–700.
 *  - Vazirmatn (arabic + latin) — the fa font; arabic subset carries the
 *    Persian script + digits, latin covers interspersed Latin text.
 * Font-family switching lives in index.css (`html[lang='fa']`).
 */
import '@fontsource/poppins/latin-400.css';
import '@fontsource/poppins/latin-500.css';
import '@fontsource/poppins/latin-600.css';
import '@fontsource/poppins/latin-700.css';
import '@fontsource/vazirmatn/arabic-400.css';
import '@fontsource/vazirmatn/arabic-500.css';
import '@fontsource/vazirmatn/arabic-600.css';
import '@fontsource/vazirmatn/arabic-700.css';
import '@fontsource/vazirmatn/latin-400.css';
import '@fontsource/vazirmatn/latin-500.css';
import '@fontsource/vazirmatn/latin-600.css';
import '@fontsource/vazirmatn/latin-700.css';

import './index.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

/*
 * Self-hosted fonts (mission budget):
 *  - Poppins (latin, @fontsource subsets) — the en font, weights 400–700.
 *  - Vazirmatn — the Farsi font, ONE variable file from the official
 *    rastikerdar release (public/fonts/, OFL-1.1) declared in index.css.
 *    Covers weights 100–900 (incl. font-extrabold, which the old
 *    @fontsource 400–700 subsets had to synthesize) for both the Arabic
 *    script and Latin digits/codes, so fa pages keep a single voice.
 * Font-family switching lives in index.css (:lang(fa)).
 */
import '@fontsource/poppins/latin-400.css';
import '@fontsource/poppins/latin-500.css';
import '@fontsource/poppins/latin-600.css';
import '@fontsource/poppins/latin-700.css';

import './index.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

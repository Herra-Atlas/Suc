// src/pages/suoritus.js -- ALKUPERÄINEN VERSIO

import { getAppById } from '../utils/db.js';

const DYNAMIC_STYLE_ID = 'dynamic-app-style';

function cleanupPreviousAppStyles() {
  const previousStyles = document.getElementById(DYNAMIC_STYLE_ID);
  if (previousStyles) {
    previousStyles.remove();
  }
}

export const suoritusContent  = `
  <div class="app-runner">
    <div class="runner-header">
      <button id="runner-back-btn" class="button-secondary">&larr; Takaisin kirjastoon</button>
      <h2 id="runner-title"></h2>

      <!-- LISÄTTY OSA: ZOOMAUSNÄPPÄIMET -->
      <div class="zoom-controls">
        <button id="zoom-out-btn" class="button-icon" title="Pienennä">-</button>
        <button id="zoom-in-btn" class="button-icon" title="Suurenna">+</button>
      </div>
      <!-- LISÄTTY OSA LOPPUU -->

    </div>
    <div id="runner-root" class="runner-content"></div>
  </div>
`;

export async function initializeSuoritusPage(navigateTo, context) {
  cleanupPreviousAppStyles();

  const { appId } = context;
  const rootEl = document.getElementById('runner-root');
  const titleEl = document.getElementById('runner-title');
  const backBtn = document.getElementById('runner-back-btn');
  const zoomInBtn = document.getElementById('zoom-in-btn');
  const zoomOutBtn = document.getElementById('zoom-out-btn');

  
  // Muuttuja, joka tallentaa nykyisen zoom-tason
  let currentZoom = 1.0; 

  backBtn.addEventListener('click', () => {
    cleanupPreviousAppStyles();
    const dynamicScript = document.getElementById('dynamic-app-script');
    if (dynamicScript) { dynamicScript.remove(); }
    navigateTo('btn-explore');
  });

  if (!appId) {
    rootEl.innerHTML = '<h1>Virhe: Sovelluksen ID puuttuu.</h1>';
    return;
  }

  try {
    const appData = await getAppById(appId);
    if (!appData) throw new Error('Sovellusta ei löytynyt tietokannasta.');

    titleEl.textContent = appData.name;
    rootEl.innerHTML = '';

    const iframe = document.createElement('iframe');
    iframe.style.border = 'none';
    iframe.style.transformOrigin = 'top left';

    // --- UUSI BLOB-RATKAISU ---

    // 1. Luo Blob-objekti JavaScript-koodista
    const scriptBlob = new Blob([appData.jsCode || ''], { type: 'application/javascript' });
    // 2. Luo sille väliaikainen, paikallinen URL
    const scriptUrl = URL.createObjectURL(scriptBlob);

    iframe.srcdoc = `
      <!DOCTYPE html>
      <html>
        <head><style>${appData.cssCode || ''}</style></head>
        <body>
          ${appData.htmlCode || ''}
          <!-- 3. Lataa skripti URL:n kautta, EI inline -->
          <script src="${scriptUrl}"><\/script>
        </body>
      </html>
    `;

    // 4. TÄRKEÄÄ MUISTINHALLINTAA VARTEN:
    // Kun iframe on latautunut, vapautetaan Blob-URL muistista.
    iframe.onload = () => {
      URL.revokeObjectURL(scriptUrl);
    };

    // --- BLOB-RATKAISU LOPPUU ---

    rootEl.appendChild(iframe);

    const applyZoom = (zoomLevel) => {
      const clampedZoom = Math.max(0.5, Math.min(1.5, zoomLevel));
      const inverseScale = 1 / clampedZoom;
      const dimension = inverseScale * 100 + '%';
      iframe.style.width = dimension;
      iframe.style.height = dimension;
      iframe.style.transform = `scale(${clampedZoom})`;
      currentZoom = clampedZoom;
    };

    applyZoom(currentZoom);

    zoomInBtn.addEventListener('click', () => applyZoom(currentZoom + 0.1));
    zoomOutBtn.addEventListener('click', () => applyZoom(currentZoom - 0.1));

  } catch (error) {
    titleEl.textContent = 'Virhe';
    rootEl.innerHTML = `<h1>Sovelluksen suoritus epäonnistui</h1><pre>${error.message}</pre>`;
    console.error(error);
  }
}
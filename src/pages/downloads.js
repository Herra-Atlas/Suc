// src/pages/downloads.js

import { saveApp } from '../utils/db.js';

export const downloadsContent  = `
  <div class="content-card">
    <div class="download-manager">
      <h1 id="download-title">Ladataan sovellusta...</h1>
      <p id="download-status">Alustetaan latausta...</p>
      <div class="progress-bar-container">
        <div id="progress-bar" class="progress-bar"></div>
      </div>
      <p id="progress-text">0%</p>
    </div>
  </div>
`;

export async function initializeDownloadsPage(navigateTo, context) {
  const { appToDownload } = context;

  const titleEl = document.getElementById('download-title');
  const statusEl = document.getElementById('download-status');
  const barEl = document.getElementById('progress-bar');
  const textEl = document.getElementById('progress-text');
  
  if (!appToDownload) {
    titleEl.textContent = 'Virhe';
    statusEl.textContent = 'Ladattavan sovelluksen tietoja ei löytynyt.';
    return;
  }

  titleEl.textContent = `Ladataan: ${appToDownload.name}`;

  try {
    statusEl.textContent = 'Ladataan HTML-tiedostoa...';
    const htmlRes = await fetch(appToDownload.files.html);
    const htmlCode = await htmlRes.text();
    barEl.style.width = '33%';
    textEl.textContent = '33%';

    statusEl.textContent = 'Ladataan CSS-tiedostoa...';
    const cssRes = await fetch(appToDownload.files.css);
    const cssCode = await cssRes.text();
    barEl.style.width = '66%';
    textEl.textContent = '66%';

    statusEl.textContent = 'Ladataan JavaScript-tiedostoa...';
    const jsRes = await fetch(appToDownload.files.js);
    const jsCode = await jsRes.text();
    barEl.style.width = '100%';
    textEl.textContent = '100%';

    statusEl.textContent = 'Tallennetaan sovellusta tietokantaan...';
    await saveApp({
      id: appToDownload.id,
      name: appToDownload.name,
      description: appToDownload.description,
      iconUrl: appToDownload.iconUrl,
      localVersion: appToDownload.version,
      htmlCode,
      cssCode,
      jsCode
    });

    statusEl.textContent = 'Lataus valmis! Palataan kirjastoon...';
    setTimeout(() => {
      navigateTo('btn-explore');
    }, 1500);

  } catch (error) {
    titleEl.textContent = 'Lataus epäonnistui';
    statusEl.textContent = error.message;
    console.error("Latausvirhe:", error);
  }
}
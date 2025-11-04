// src/pages/explore.js

import { createExpCard } from '../components/expcards.js';
import { getInstalledApps, addFile, deleteApp } from '../utils/db.js';
import { createContextMenu } from '../components/contextMenu.js';
import { createModal, showModal, hideModal } from '../components/modal.js';

// --- PAIKALLISTEN SOVELLUSTEN DATA ---
const localAppData = [
  {
    type: 'local-app', // TYYPPIÄ MUUTETTU SELKEYDEN VUOKSI
    target: 'Muistiinpano',
    title: 'Muistio',
    imageUrl: 'https://placehold.co/400x200/ffc107/212529?text=Muistio',
    shortDescription: 'Luo ja muokkaa tekstitiedostoja nopeasti.'
  },
  {
    type: 'local-app', // TYYPPIÄ MUUTETTU SELKEYDEN VUOKSI
    target: 'Piirustus',
    title: 'Piirustus',
    imageUrl: 'https://placehold.co/400x200/e83e8c/ffffff?text=Piirustus',
    shortDescription: 'Yksinkertainen alusta piirtämiseen ja luonnosteluun.'
  }
];

const localAppsHTML = localAppData.map(createExpCard).join('');

// --- LOPULLINEN JA KORJATTU HTML-RAKENNE ---
export const exploreContent = `
  <div class="explore-section">
    <h2>Sovelluskauppa</h2>
    <div id="app-store-grid" class="card-grid">
      <p>Ladataan sovelluksia...</p>
    </div>
  </div>
  <div class="explore-section">
    <h2>Paikalliset työkalut</h2>
    <div id="local-apps-grid" class="card-grid">
      ${localAppsHTML}
    </div>
  </div>
`;

// --- ALUSTUSFUNKTIO, JOKA SISÄLTÄÄ KAIKEN ---

export async function initializeExplorePage(navigateTo, context) {
  const { remoteApps, pinnableApps } = context;

  const handlePinToggle = (appId, appName) => {
    let pinnedIds = JSON.parse(localStorage.getItem('pinnedApps')) || [];
    const isPinned = pinnedIds.includes(appId);
    if (isPinned) {
      pinnedIds = pinnedIds.filter(id => id !== appId);
    } else {
      pinnedIds.push(appId);
    }
    localStorage.setItem('pinnedApps', JSON.stringify(pinnedIds));
    showRestartModal(`Sovelluksen '${appName}' kiinnitys on ${isPinned ? 'poistettu' : 'lisätty'}.`);
  };

  const handleDelete = (appId, appName) => {
    const modalTitle = `Poista sovellus`;
    const modalContent = `
      <p>Haluatko varmasti poistaa sovelluksen '${appName}' pysyvästi?</p>
      <div class="modal-button-group" style="display: flex; gap: 1rem; margin-top: 1.5rem; justify-content: flex-end;">
        <button class="button-secondary" id="delete-cancel-btn">Peruuta</button>
        <button class="button-danger" id="delete-confirm-btn">Poista</button>
      </div>
    `;
    createModal(modalTitle, modalContent);

    document.getElementById('delete-confirm-btn').addEventListener('click', async () => {
      await deleteApp(appId);
      let pinnedIds = JSON.parse(localStorage.getItem('pinnedApps')) || [];
      pinnedIds = pinnedIds.filter(id => id !== appId);
      localStorage.setItem('pinnedApps', JSON.stringify(pinnedIds));
      hideModal();
      location.reload();
    });

    document.getElementById('delete-cancel-btn').addEventListener('click', hideModal);
    showModal();
  };
  
  const showRestartModal = (message) => {
    const modalTitle = "Muutos vaatii uudelleenkäynnistyksen";
    const modalContent = `
      <p>${message}</p>
      <div class="modal-button-group" style="display: flex; gap: 1rem; margin-top: 1.5rem; justify-content: flex-end;">
        <button class="button-secondary" id="restart-later-btn">Myöhemmin</button>
        <button class="button-primary" id="restart-now-btn">Käynnistä uudelleen</button>
      </div>
    `;
    createModal(modalTitle, modalContent);
    document.getElementById('restart-now-btn').addEventListener('click', () => location.reload());
    document.getElementById('restart-later-btn').addEventListener('click', hideModal);
    showModal();
  };

  // TÄMÄ FUNKTIO PUUTTUI KOKONAAN! Se on paikallisten sovellusten kiinnitystä varten.
  const handlePinAction = (appId, shouldPin) => {
    if (!pinnableApps || !pinnableApps[appId]) {
      console.error('Virhe: Kiinnitettävän sovelluksen dataa ei löytynyt (pinnableApps).');
      return;
    }
    let currentPins = JSON.parse(localStorage.getItem('pinnedApps')) || [];
    const appData = pinnableApps[appId];

    if (shouldPin) {
      // Huom: Tallennetaan eri muotoista dataa kuin etäsovelluksille
      const newPin = { id: appId, tooltip: appData.tooltip, iconSVG: appData.iconSVG };
      currentPins.push(newPin);
      showRestartModal(`Sovellus '${appData.tooltip}' on nyt kiinnitetty.`);
    } else {
      currentPins = currentPins.filter(pin => pin.id !== appId);
      showRestartModal(`Sovelluksen '${appData.tooltip}' kiinnitys on poistettu.`);
    }
    localStorage.setItem('pinnedApps', JSON.stringify(currentPins));
  };

  const storeGridEl = document.getElementById('app-store-grid');
  if (!storeGridEl) return console.error("Kriittinen virhe: Elementtiä #app-store-grid ei löytynyt.");
  
  try {
    if (!remoteApps || !Array.isArray(remoteApps)) {
      storeGridEl.innerHTML = '<p>Sovellusten listausta ei voitu ladata.</p>';
    } else {
      const installedApps = await getInstalledApps();
      const installedAppsMap = Object.fromEntries(installedApps.map(app => [app.id, app]));
      storeGridEl.innerHTML = '';

      remoteApps.forEach(remoteApp => {
        // --- TÄMÄ ON KORJATTU OSA ---

        // 1. LUODAAN KORTIN HTML-MERKKIJONO
        const cardHTML = createExpCard({
          type: 'remote', title: remoteApp.name,
          shortDescription: remoteApp.description, imageUrl: remoteApp.iconUrl
        });
        
        // 2. LUODAAN VÄLIAIKAINEN ELEMENTTI, JOTTA VOIMME KÄSITELLÄ SITÄ
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = cardHTML.trim();
        const cardEl = tempContainer.firstElementChild; // Tämä on nyt se ainoa, oikea <div class="exp-card">

        if (!cardEl) return;
        
        // ---------------------------------

        const cardBody = cardEl.querySelector('.card-body');
        if (!cardBody) return;

        const button = document.createElement('button');
        button.className = 'button-primary';
        button.style.marginTop = '1rem';
        
        const installedApp = installedAppsMap[remoteApp.id];
        if (installedApp) {
          if (installedApp.localVersion < remoteApp.version) {
            button.textContent = `Päivitä (v${remoteApp.version})`;
            button.onclick = () => navigateTo('btn-downloads', { appToDownload: remoteApp });
          } else {
            button.textContent = 'Avaa';
            button.onclick = () => navigateTo('btn-suoritus', { appId: remoteApp.id });
          }
        } else {
          button.textContent = 'Lataa';
          button.onclick = () => navigateTo('btn-downloads', { appToDownload: remoteApp });
        }
        
        cardBody.appendChild(button);

        cardEl.addEventListener('contextmenu', (event) => {
          event.preventDefault();
          if (installedApp) {
            const pinnedIds = JSON.parse(localStorage.getItem('pinnedApps')) || [];
            const isPinned = pinnedIds.includes(remoteApp.id);
            const menuItems = [
              { label: isPinned ? 'Poista kiinnitys' : 'Kiinnitä sivupalkkiin', action: () => handlePinToggle(remoteApp.id, remoteApp.name) },
              { label: 'Poista sovellus...', action: () => handleDelete(remoteApp.id, remoteApp.name) }
            ];
            createContextMenu(event.clientX, event.clientY, menuItems);
          }
        });
        
        storeGridEl.appendChild(cardEl);
      });
    }
  } catch (error) {
    console.error("Virhe sovelluskaupan näyttämisessä:", error);
    storeGridEl.innerHTML = '<p>Sovellusten näyttäminen epäonnistui.</p>';
  }

  // --- OSA 2: PAIKALLISTEN SOVELLUSTEN LOGIIKKA (KIINNITYS JNE.) ---
  
  const localCards = document.querySelectorAll('#local-apps-grid .exp-card[data-type="local-app"]');

  const launchApp = async (type) => {
    try {
      const newFile = {
        title: `Esimerkki (${type})`,
        type: type,
        content: type === 'Muistiinpano' ? '# Tervetuloa!' : '',
        createdAt: new Date(), lastModified: new Date(),
        cardColor: type === 'Piirustus' ? '#212529' : '#7b5dff',
      };
      const newId = await addFile(newFile);
      const targetPage = type === 'Piirustus' ? 'btn-drawing' : 'btn-notepad';
      navigateTo(targetPage, { fileId: newId });
    } catch (error) {
      console.error(`Sovelluksen '${type}' käynnistys epäonnistui:`, error);
    }
  };
  

  localCards.forEach(card => {
    card.addEventListener('click', () => {
      const target = card.dataset.target;
      launchApp(target);
    });

    // Tämä osa yrittää kutsua `handlePinAction`-funktiota, joka puuttui
    card.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      const target = card.dataset.target;
      const appId = target === 'Muistiinpano' ? 'btn-notepad' : 'btn-drawing';
      const currentPins = JSON.parse(localStorage.getItem('pinnedApps')) || [];
      const isAlreadyPinned = currentPins.some(pin => pin.id === appId);
      const menuItems = [
        isAlreadyPinned 
          ? { label: 'Poista kiinnitys', action: () => handlePinAction(appId, false) }
          // TÄMÄ KUTSU AIHEUTTI VIRHEEN
          : { label: 'Kiinnitä sivupalkkiin', action: () => handlePinAction(appId, true) }
      ];
      createContextMenu(event.clientX, event.clientY, menuItems);
    });
  });
}
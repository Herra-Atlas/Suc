// src/main.js

import { startWebLogin } from './utils/api.js';
import { initDB, getAppById } from './utils/db.js';
import { renderLayout, initializeSidebar, updateActiveState, updateSidebarProfileInfo } from './components/sidebar.js';
import { homeContent, initializeHomePage } from './pages/home.js';
import { exploreContent, initializeExplorePage } from './pages/explore.js';
import { settingsContent, initializeSettingsPage } from './pages/settings.js';
import { profileContent, initializeProfilePage } from './pages/profile.js';
import { filesContent, initializeFilesPage } from './pages/files.js';
import { muistioContent, initializeMuistioPage } from './pages/muistio.js';
import { drawingContent, initializeDrawingPage } from './pages/drawing.js';
import { downloadsContent, initializeDownloadsPage } from './pages/downloads.js';
import { suoritusContent, initializeSuoritusPage } from './pages/suoritus.js';

const APPS_URL = 'Replace with ur host';
let remoteAppsCache = null; // Välimuisti etäsovelluksille


function loadTheme() {
  const savedTheme = JSON.parse(localStorage.getItem('colorTheme'));
  if (savedTheme) {
    for (const [key, value] of Object.entries(savedTheme)) {
      document.documentElement.style.setProperty(key, value);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => { // Poista 'async' tästä toistaiseksi
  // KORJATTU KOHTA TÄSSÄ:
  const userJson = localStorage.getItem('currentUser');
  let user = null;
  
  try {
    // Yritä purkaa JSON vain, jos se ei ole tyhjä
    if (userJson) {
      user = JSON.parse(userJson);
    }
  } catch (error) {
    console.error("Tallennetun käyttäjän purkaminen epäonnistui:", error);
    // Jos tallennettu data on rikki, poista se
    localStorage.removeItem('currentUser');
  }

  if (user) {
    // Jos käyttäjä löytyi, käynnistä sovellus
    initializeApp(user);
  } else {
    // Muuten, näytä kirjautumissivu
    showLoginPage();
  }
});

function showLoginPage() {
  const appContainer = document.getElementById('app-container');
  appContainer.innerHTML = `
    <div class="login-container">
      <h1>Tervetuloa</h1>
      <p>Jatkaaksesi, sinut ohjataan selaimeen kirjautumaan.</p>
      <button id="login-btn" class="button-primary">Aloita kirjautuminen</button>
      <p id="login-status" class="login-status"></p>
    </div>
  `;

  const loginBtn = document.getElementById('login-btn');
  const loginStatus = document.getElementById('login-status');

  loginBtn.addEventListener('click', async () => {
    loginBtn.disabled = true;
    loginStatus.textContent = 'Odotetaan kirjautumista selaimessa...';

    try {
      const user = await startWebLogin();
      localStorage.setItem('currentUser', JSON.stringify(user));
      await initializeApp(user);
    } catch (error) {
      loginStatus.textContent = `Kirjautuminen epäonnistui: ${error.message}`;
      loginBtn.disabled = false;
    }
  });
}

/**
 * Ladataan tallennettu profiili ja päivitetään sivupalkki.
 */
function loadProfile() {
  const savedProfile = JSON.parse(localStorage.getItem('userProfile'));
  if (savedProfile) {
    updateSidebarProfileInfo(savedProfile);
  }
}

let pages = {
  'btn-home': { content: homeContent, init: initializeHomePage },
  'btn-library': { content: filesContent, init: initializeFilesPage },
  'btn-explore': { content: exploreContent, init: initializeExplorePage },
  'btn-announcements': { content: `<div class="content-card"><h1>Announcements</h1><p>Tämä sivu on vielä työn alla.</p></div>` },
  'btn-downloads': { content: downloadsContent, init: initializeDownloadsPage },
  'btn-suoritus': { content: suoritusContent, init: initializeSuoritusPage },
  'btn-settings': { content: settingsContent, init: initializeSettingsPage },
  'btn-profile': { content: profileContent, init: initializeProfilePage },
  'btn-notepad': { content: muistioContent, init: initializeMuistioPage },
  'btn-drawing': { content: drawingContent, init: initializeDrawingPage },
};


let contentArea;
// UUDET MUUTTUJAT SIVUHISTORIAA VARTEN
let currentPageId = null;
let previousPageId = null;


function navigateTo(pageId, context = {}) {
  try {
    const page = pages[pageId];
    if (page && contentArea) {
      
      // Päivitetään historia
      if (pageId !== currentPageId) {
        previousPageId = currentPageId;
        currentPageId = pageId;
      }

      contentArea.innerHTML = page.content;

      if (page.init) {
        // Yhdistetään aina välimuistissa oleva sovelluslista kontekstiin
        const fullContext = { ...context, remoteApps: remoteAppsCache };
        page.init(navigateTo, fullContext);
      }
      
      updateActiveState(pageId);

    } else {
      throw new Error(`Sivua ID:llä '${pageId}' ei löytynyt.`);
    }
  } catch (error) {
    console.error(`Navigointivirhe sivulle '${pageId}':`, error);
    if (contentArea) {
      contentArea.innerHTML = `<div class="content-card"><h1>Virhe</h1><p>Sivun lataaminen epäonnistui.</p></div>`;
    }
  }
}

async function fetchRemoteApps() {
  try {
    const response = await fetch(APPS_URL);
    if (!response.ok) throw new Error(`Verkkovirhe: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error("Etäsovellusten haku epäonnistui:", error);
    return null; // Palauta null, jotta sovellus ei kaadu
  }
}



async function initializeApp(user) {
  try {
    await initDB(); 
    loadTheme(); 
    loadProfile();
    remoteAppsCache = await fetchRemoteApps();

    // --- UUSI KIINNITYSTEN LATAUSLOGIIKKA ---
    const pinnedAppIds = JSON.parse(localStorage.getItem('pinnedApps')) || [];
    const appPromises = pinnedAppIds.map(id => getAppById(id));
    const pinnedAppDetails = (await Promise.all(appPromises)).filter(Boolean); // .filter(Boolean) poistaa null-arvot, jos sovellus on poistettu mutta kiinnitys jäänyt

    const appContainer = document.getElementById('app-container');
    if (!appContainer) throw new Error("Elementtiä 'app-container' ei löytynyt.");
    
    // Annetaan kiinnitysten tiedot renderöintiä varten
    renderLayout(appContainer, pinnedAppDetails);
    
    contentArea = document.getElementById('content-area');
    if (!contentArea) throw new Error("Elementtiä 'content-area' ei löytynyt.");
    
    initializeSidebar(navigateTo);
    loadProfile();
    
    navigateTo('btn-home');

  } catch (error) {
    console.error("Kriittinen virhe sovelluksen käynnistyksessä:", error);
    document.body.innerHTML = `
      <div style="padding: 2rem; color: #ff8a8a; font-family: sans-serif;">
        <h1>Kriittinen virhe</h1>
        <p>Sovellusta ei voitu käynnistää.</p>
        <pre style="background: #222; padding: 1rem; border-radius: 8px;">${error.stack}</pre>
      </div>`;
  }
}
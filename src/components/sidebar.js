// src/components/sidebar.js

import { createModal, showModal, hideModal } from './modal.js';

// Modaalin sisältö, jossa on nyt toimivat napit
const profileModalTitle = "Profiilivalikko";
const profileModalContent = `
  <p>Valitse toiminto alla olevista vaihtoehdoista.</p>
  <div class="modal-button-group" style="display: flex; gap: 1rem; margin-top: 1rem;">
    <button class="button-primary" id="go-to-profile-btn">Muokkaa profiilia</button>
    <button class="button-secondary" id="go-to-settings-btn">Asetukset</button>
  </div>
`;

function generateSidebarHTML(pinnedApps = []) {
  // Luodaan HTML-elementit kiinnitetyille sovelluksille
  const pinnedItemsHTML = pinnedApps.map(app => `
    <a href="#" class="nav-item" id="${app.id}" data-nav-type="app">
      <div class="icon">
        <img src="${app.iconUrl}" alt="${app.name}" class="sidebar-app-icon">
      </div>
      <div class="tooltip">${app.name}</div>
    </a>
  `).join('');

  // Palautetaan koko sivupalkin HTML, johon on nyt lisätty dynaamiset osat
  return `
  <aside class="sidebar">
      <a href="#" class="profile-link" id="profile-activator" title="Profiili">
        <img src="https://placehold.co/46x46/252538/ffffff?text=P" alt="Profiilikuva" class="profile-picture">
      </a>
    <nav class="nav-main" aria-label="Päänavigaatio">
      <a href="#" class="nav-item" id="btn-home">
        <div class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></div>
        <div class="tooltip">Home</div>
      </a>
      <a href="#" class="nav-item" id="btn-library">
        <div class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M2 17h.01"></path><path d="M7 17h.01"></path><path d="M12 17h.01"></path></svg></div>
        <div class="tooltip">Library</div>
      </a>
      <a href="#" class="nav-item" id="btn-explore">
        <div class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m16.2 7.8-2.1-4.2-2.1 4.2-4.2 2.1 4.2 2.1 2.1 4.2 2.1-4.2 4.2-2.1z"></path></svg></div>
        <div class="tooltip">Selaa</div>
      </a>

      <!-- Tähän tulevat dynaamisesti kiinnitetyt sovellukset -->
      ${pinnedItemsHTML}

    </nav>
    <nav class="nav-bottom" aria-label="Lisätoiminnot">
      <a href="#" class="nav-item" id="btn-announcements">
        <div class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10 2 2.24 4.48L17 7.5l-3.5 3.5.83 4.96L10 13.72l-4.33 2.24.83-4.96L3 7.5l4.76-.02L10 2z"></path><path d="M10 18v4"></path><path d="M10 8v4"></path></svg></div>
        <div class="tooltip">Announcements</div>
      </a>
      <a href="#" class="nav-item" id="btn-downloads">
        <div class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg></div>
        <div class="tooltip">Downloads</div>
      </a>
      <a href="#" class="nav-item hidden" id="btn-settings"></a>
      <a href="#" class="nav-item hidden" id="btn-profile"></a>
    </nav>
  </aside>
  `;
}

// renderLayout ottaa nyt vastaan kiinnitetyt sovellukset
export function renderLayout(container, pinnedApps) {
  container.innerHTML = `
    <div class="app">
      ${generateSidebarHTML(pinnedApps)}
      <main class="main-content" id="content-area"></main>
    </div>
  `;
}

// initializeSidebar on nyt älykkäämpi
export function initializeSidebar(onNavigate) {
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', (event) => {
      event.preventDefault();
      const navType = item.dataset.navType;
      const id = item.id;
      
      if (navType === 'app') {
        // Jos klikataan kiinnitettyä sovellusta, navigoidaan suorittajaan
        updateActiveState(id);
        onNavigate('btn-suoritus', { appId: id });
      } else {
        // Muuten navigoidaan normaalisti
        updateActiveState(id);
        onNavigate(id);
      }
    });
  });
  
  // Profiililinkin toiminnallisuus pysyy ennallaan
  const profileActivator = document.getElementById('profile-activator');
  if (profileActivator) {
    profileActivator.addEventListener('click', (event) => {
      event.preventDefault();
      createModal(profileModalTitle, profileModalContent);

      const settingsButton = document.getElementById('go-to-settings-btn');
      const profileButton = document.getElementById('go-to-profile-btn');

      if (settingsButton) {
        settingsButton.addEventListener('click', () => {
          hideModal();
          updateActiveState('btn-settings');
          onNavigate('btn-settings');
        });
      }
      
      if (profileButton) {
        profileButton.addEventListener('click', () => {
          hideModal();
          updateActiveState('btn-profile');
          onNavigate('btn-profile');
        });
      }

      showModal();
    });
  }
}

export function updateSidebarProfileInfo(profile) {
  const pfpImage = document.querySelector('.sidebar .profile-picture');
  const pfpLink = document.querySelector('.sidebar .profile-link');
  if (profile) {
    if (pfpImage && profile.pfp) pfpImage.src = profile.pfp;
    if (pfpLink && profile.name) pfpLink.title = profile.name;
  }
}

export function updateActiveState(activeId) {
  const navItems = document.querySelectorAll('.nav-item');
  const profileActivator = document.getElementById('profile-activator');

  navItems.forEach(item => {
    item.classList.toggle('active', item.id === activeId);
  });
  
  if (profileActivator) {
    const isProfileSectionActive = (activeId === 'btn-profile' || activeId === 'btn-settings');
    profileActivator.classList.toggle('active', isProfileSectionActive);
  }
}
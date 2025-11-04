// src/pages/settings.js

// Lista CSS-muuttujista pysyy samana.
const themeVariables = {
  '--sidebar-bg': 'Sivupalkin tausta',
  '--body-bg-start': 'Päätaustan alku',
  '--body-bg-end': 'Päätaustan loppu',
  '--card-bg': 'Korttien tausta',
  '--icon-color-default': 'Ikonin oletusväri',
  '--icon-color-hover-active': 'Ikonin aktiivinen väri',
  '--active-bar-color': 'Aktiivisuuspalkki',
  '--text-color': 'Tekstin pääväri',
};

/**
 * UUSI, PARANNETTU FUNKTIO: Rakentaa ja palauttaa värivalitsimien HTML:n.
 * Tämä hakee aina tuoreimmat arvot.
 */
function createThemeSwitcherHTML() {
  const savedTheme = JSON.parse(localStorage.getItem('colorTheme')) || {};
  let themeOptionsHTML = '';

  for (const [variable, label] of Object.entries(themeVariables)) {
    // Haetaan nykyinen väri AINA joko tallennetusta teemasta tai suoraan sivun tyyleistä.
    // Tämä takaa, että arvot ovat aina oikein, vaikka ne olisi asetettu aiemmin.
    const currentValue = savedTheme[variable] || getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
    
    themeOptionsHTML += `
      <div class="theme-option">
        <label for="${variable}">${label}</label>
        <input type="color" id="${variable}" value="${currentValue}" data-variable="${variable}">
      </div>
    `;
  }
  return themeOptionsHTML;
}

/**
 * SIVUN STAATTINEN RUNKO: Värivalitsimet on korvattu tyhjällä div-elementillä,
 * joka toimii paikkamerkkinä.
 */
export const settingsContent = `
  <div class="settings-layout">
    <aside class="settings-sidebar">
      <h2>Asetukset</h2>
      <nav>
        <a href="#" class="settings-nav-item active" data-section="teema">Teema</a>
        <a href="#" class="settings-nav-item" data-section="yleiset">Yleiset</a>
        <a href="#" class="settings-nav-item" data-section="ilmoitukset">Windows Ilmoitukset</a>
        <a href="#" class="settings-nav-item" data-section="about">About</a>
      </nav>
    </aside>
    <main class="settings-content">
      <section id="teema" class="settings-section active">
        <h3>Väriasetukset</h3>
        <p>Muokkaa sovelluksen ulkoasua. Muutokset tallentuvat automaattisesti.</p>
        <!-- TÄMÄ ON PAIKKAMERKKI, JOHON VÄRIVALITSIMET LISÄTÄÄN -->
        <div class="theme-switcher-container" id="theme-switcher-wrapper"></div>
      </section>
      <section id="yleiset" class="settings-section">
        <h3>Yleiset</h3>
        <p>Tähän tulee yleisiä asetuksia.</p>
      </section>
      <section id="ilmoitukset" class="settings-section">
        <h3>Windows Ilmoitukset</h3>
        <p>Tähän tulee ilmoitusasetuksia.</p>
      </section>
       <section id="about" class="settings-section">
        <h3>About</h3>
        <p>Tietoja sovelluksesta.</p>
      </section>
    </main>
  </div>
`;

/**
 * PARANNETTU ALUSTUSFUNKTIO: Tämä "herättää" sivun eloon joka kerta.
 */
export function initializeSettingsPage() {
  // 1. ETSI PAIKKAMERKKI JA LUO VÄRIVALITSIMET SEN SISÄÄN
  const themeContainer = document.getElementById('theme-switcher-wrapper');
  if (themeContainer) {
    themeContainer.innerHTML = createThemeSwitcherHTML();
  }

  // 2. HAETAAN ELEMENTIT VASTA, KUN NE ON LISÄTTY SIVULLE
  const colorInputs = document.querySelectorAll('.theme-switcher-container input[type="color"]');
  const navItems = document.querySelectorAll('.settings-nav-item');
  const sections = document.querySelectorAll('.settings-section');

  // 3. LISÄTÄÄN KUUNTELIJAT (Tämä osa pysyy samana)
  colorInputs.forEach(input => {
    input.addEventListener('input', (event) => {
      const variable = event.target.dataset.variable;
      const value = event.target.value;
      
      document.documentElement.style.setProperty(variable, value);

      const savedTheme = JSON.parse(localStorage.getItem('colorTheme')) || {};
      savedTheme[variable] = value;
      localStorage.setItem('colorTheme', JSON.stringify(savedTheme));
    });
  });

  navItems.forEach(item => {
    item.addEventListener('click', (event) => {
      event.preventDefault();
      const sectionId = event.target.dataset.section;

      navItems.forEach(nav => nav.classList.remove('active'));
      event.target.classList.add('active');

      sections.forEach(sec => sec.classList.remove('active'));
      document.getElementById(sectionId).classList.add('active');
    });
  });
}
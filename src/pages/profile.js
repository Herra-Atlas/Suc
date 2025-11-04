// src/pages/profile.js

import { updateSidebarProfileInfo } from '../components/sidebar.js';

// Asetetaan vakiot, jotta niitä on helppo muokata
const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Oletusprofiili, jos mitään ei ole tallennettu
const defaultProfile = {
  name: 'Käyttäjänimi',
  pfp: 'https://lh3.googleusercontent.com/-9CI4xXAcOpw/AAAAAAAAAAI/AAAAAAAAAAA/ALKGfkllNGIqm_sUigfj8RB815C0651iow/photo.jpg?sz=46',
  bio: 'Kerro jotain itsestäsi...'
};

// Sivun HTML-rakenne on nyt modernimpi ja sisältää uudet kentät
export const profileContent = `
  <div class="content-card">
    <h1>Profiilin muokkaus</h1>
    <div class="profile-editor">
      
      <div class="pfp-editor">
        <img src="${defaultProfile.pfp}" alt="Profiilikuvan esikatselu" id="pfp-preview" class="profile-picture-large" title="Vaihda kuva tiedostosta">
        <div class="input-group">
          <label for="pfp-url-input">Tai liitä kuvan URL-osoite</label>
          <input type="url" id="pfp-url-input" class="input-field" placeholder="https://esimerkki.com/kuva.jpg">
          <p id="pfp-error" class="pfp-error"></p>
        </div>
        <input type="file" id="pfp-input" accept="image/png, image/jpeg, image/gif, image/webp" style="display: none;">
      </div>

      <div class="details-editor">
        <div class="input-group">
          <label for="name-input">Nimi</label>
          <input type="text" id="name-input" class="input-field" placeholder="Syötä nimesi">
        </div>
        <div class="input-group">
            <label for="bio-input">Bio</label>
            <textarea id="bio-input" class="input-field" rows="4" placeholder="Kerro lyhyesti itsestäsi..."></textarea>
        </div>
      </div>

    </div>
    <div class="profile-actions">
      <button class="button-primary" id="save-profile-btn">
        <span class="btn-text">Tallenna muutokset</span>
      </button>
    </div>
  </div>
`;

// Sivun alustusfunktio on nyt paljon laajempi
export function initializeProfilePage() {
  try {
    // Haetaan kaikki tarvittavat elementit
    const pfpPreview = document.getElementById('pfp-preview');
    const pfpInput = document.getElementById('pfp-input');
    const pfpUrlInput = document.getElementById('pfp-url-input');
    const pfpError = document.getElementById('pfp-error');
    const nameInput = document.getElementById('name-input');
    const bioInput = document.getElementById('bio-input');
    const saveButton = document.getElementById('save-profile-btn');

    let currentPfpSrc = defaultProfile.pfp; // Muuttuja väliaikaiselle kuvalle

    // Ladataan profiilin tiedot, kun sivu avataan
    const loadProfileData = () => {
      const savedProfile = JSON.parse(localStorage.getItem('userProfile')) || defaultProfile;
      currentPfpSrc = savedProfile.pfp;
      pfpPreview.src = savedProfile.pfp;
      nameInput.value = savedProfile.name;
      bioInput.value = savedProfile.bio || '';
    };

    // Funktio virheilmoituksen näyttämiseen
    const showPfpError = (message) => {
      pfpError.textContent = message;
      pfpPreview.src = currentPfpSrc; // Palauta vanha kuva virheen sattuessa
      setTimeout(() => { pfpError.textContent = ''; }, 4000);
    };

    // Kuvan validointi URL-osoitteesta
    pfpUrlInput.addEventListener('paste', (event) => {
      const url = event.clipboardData.getData('text');
      validateAndShowImage(url);
    });
     pfpUrlInput.addEventListener('input', (event) => {
      const url = event.target.value;
      validateAndShowImage(url);
    });

    const validateAndShowImage = (url) => {
      if (!url) {
        pfpPreview.src = currentPfpSrc;
        return;
      }
      const img = new Image();
      img.onload = () => {
        pfpPreview.src = url;
        pfpError.textContent = '';
      };
      img.onerror = () => {
        showPfpError('Virheellinen tai saavuttamaton kuvan URL.');
      };
      img.src = url;
    };

    // Kuvan valinta tiedostosta
    pfpInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        return showPfpError('Valitse kuvatiedosto.');
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return showPfpError(`Tiedosto on liian suuri (Max: ${MAX_FILE_SIZE_MB}MB).`);
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        pfpPreview.src = e.target.result;
        pfpError.textContent = '';
      };
      reader.onerror = () => {
        showPfpError('Tiedoston lukeminen epäonnistui.');
      };
      reader.readAsDataURL(file);
    });

    // Tehdään profiilikuvasta klikattava tiedostovalintaa varten
    pfpPreview.addEventListener('click', () => pfpInput.click());

    // Tallennuslogiikka
    saveButton.addEventListener('click', () => {
      const btnText = saveButton.querySelector('.btn-text');
      
      // Estä tuplaklikkaukset ja anna visuaalista palautetta
      saveButton.disabled = true;
      btnText.textContent = 'Tallennetaan...';

      try {
        const profileToSave = {
          name: nameInput.value.trim() || 'Nimetön',
          pfp: pfpPreview.src,
          bio: bioInput.value.trim()
        };

        localStorage.setItem('userProfile', JSON.stringify(profileToSave));
        currentPfpSrc = profileToSave.pfp; // Päivitä väliaikainen kuva
        
        // Päivitä sivupalkki välittömästi
        updateSidebarProfileInfo(profileToSave);

        // Onnistumispalaute
        btnText.textContent = 'Tallennettu! ✔';
        setTimeout(() => {
          btnText.textContent = 'Tallenna muutokset';
          saveButton.disabled = false;
        }, 2000);

      } catch (error) {
        console.error('Profiilin tallennus epäonnistui:', error);
        btnText.textContent = 'Virhe tallennuksessa!';
        // Salli uusi yritys hetken päästä
        setTimeout(() => {
          btnText.textContent = 'Tallenna muutokset';
          saveButton.disabled = false;
        }, 3000);
      }
    });

    // Ladataan tiedot lopuksi
    loadProfileData();

  } catch (error) {
    console.error('Profiilisivun alustus epäonnistui:', error);
    // Voisit näyttää virheilmoituksen myös käyttöliittymässä
    const container = document.querySelector('.content-card');
    if(container) {
      container.innerHTML = '<h1>Hups!</h1><p>Profiilisivun lataamisessa tapahtui virhe.</p>';
    }
  }
}
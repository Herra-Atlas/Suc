// src/components/modal.js

/**
 * Luo ja lisää modaali-ikkunan sivulle, mutta pitää sen piilossa.
 * @param {string} title - Modaalin otsikko.
 * @param {string} contentHTML - Modaalin sisällön HTML-rakenne.
 */
export function createModal(title, contentHTML) {
  // Poistetaan vanha modaali, jos sellainen on olemassa
  const existingModal = document.getElementById('app-modal');
  if (existingModal) {
    existingModal.remove();
  }

  const modalHTML = `
    <div class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>${title}</h2>
          <button class="modal-close-btn">&times;</button>
        </div>
        <div class="modal-body">
          ${contentHTML}
        </div>
      </div>
    </div>
  `;

  const modalContainer = document.createElement('div');
  modalContainer.id = 'app-modal';
  modalContainer.innerHTML = modalHTML;
  document.body.appendChild(modalContainer);

  // Lisätään sulkemistoiminnallisuus
  const overlay = modalContainer.querySelector('.modal-overlay');
  const closeButton = modalContainer.querySelector('.modal-close-btn');

  closeButton.addEventListener('click', hideModal);
  overlay.addEventListener('click', (event) => {
    // Suljetaan vain, jos klikataan itse taustaa, ei sen sisällä olevaa sisältöä
    if (event.target === overlay) {
      hideModal();
    }
  });
}

/**
 * Näyttää aiemmin luodun modaali-ikkunan.
 */
export function showModal() {
  const modal = document.getElementById('app-modal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

/**
 * Piilottaa modaali-ikkunan.
 */
export function hideModal() {
  const modal = document.getElementById('app-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * Luo ja näyttää vahvistusmodaalin.
 * 
 * @param {string} title - Modaalin otsikko.
 * @param {string} message - Kysymys käyttäjälle.
 * @param {string} confirmText - Vahvistusnapin teksti (esim. "Poista").
 * @returns {Promise<boolean>} Palauttaa true, jos käyttäjä vahvistaa, muuten false.
 */
export function createConfirmationModal(title, message, confirmText = 'Vahvista') {
  return new Promise((resolve) => {
    const modalContent = `
      <p>${message}</p>
      <div class="modal-button-group">
        <button class="button-secondary" id="confirm-cancel">Peruuta</button>
        <button class="button-danger" id="confirm-accept">${confirmText}</button>
      </div>
    `;
    createModal(title, modalContent);
    
    const acceptBtn = document.getElementById('confirm-accept');
    const cancelBtn = document.getElementById('confirm-cancel');

    const handleResolve = (value) => {
      hideModal();
      resolve(value);
    };

    acceptBtn.addEventListener('click', () => handleResolve(true));
    cancelBtn.addEventListener('click', () => handleResolve(false));
    
    // Varmista, että modaalin sulkeminen taustasta klikkaamalla hylkää myös
    document.querySelector('#app-modal .modal-overlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) handleResolve(false);
    });
    
    showModal();
  });
}
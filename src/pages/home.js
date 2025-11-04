// src/pages/home.js

import { createModal, showModal } from '../components/modal.js';

export const homeContent = `
  <div class="content-card">
    <h1>Kaikki toimii</h1>
    <p>w sidebar</p>
    <button class="button-primary" id="open-modal-btn">Avaa modaali</button>
  </div>
`;

export function initializeHomePage() {
  const openModalButton = document.getElementById('open-modal-btn');
  if (openModalButton) {
    openModalButton.addEventListener('click', () => {
      createModal("Modaali toimii!", `
        <p>Tämä on tekstiä</p>
        <button class="button-primary" onclick="document.getElementById('app-modal').style.display='none'">Sulje</button>
      `);
      showModal();
    });
  }
}
// src/pages/files.js

import { createFileCard } from '../components/filecard.js';
// TÄRKEÄ: Tuodaan myös getFileById
import { getAllFiles, addFile, deleteFile, getFileById } from '../utils/db.js';
import { createModal, showModal, hideModal, createConfirmationModal } from '../components/modal.js';

export const filesContent = `
  <div class="page-header">
    <h1 class="page-title">Tiedostot</h1>
    <button class="button-primary" id="add-new-file-btn">Uusi Tiedosto</button>
  </div>
  <div class="title-underline"></div>
  <div class="card-grid" id="files-grid"></div>
`;

export async function initializeFilesPage(onNavigate) {
  const filesGrid = document.getElementById('files-grid');
  const addNewFileBtn = document.getElementById('add-new-file-btn');

  // Renderöi tiedostot näytölle. Ei muutoksia tähän.
  const renderFiles = async () => {
    try {
      const files = await getAllFiles();
      filesGrid.innerHTML = files.length > 0
        ? files.map(createFileCard).join('')
        : '<p class="empty-state-message">Ei tiedostoja vielä. Luo ensimmäinen!</p>';
    } catch (error) {
      console.error("Tiedostojen renderöinti epäonnistui:", error);
      filesGrid.innerHTML = '<p class="empty-state-message">Tiedostojen lataamisessa tapahtui virhe.</p>';
    }
  };

  // KORJATTU: Tämä modaali antaa syöttää tiedot ja luo tiedoston
  const showCreationDetailsModal = (type) => {
    const defaultColor = type === 'Piirustus' ? '#212529' : '#7b5dff';
    const modalContent = `
      <div class="input-group">
        <label for="new-file-title">Otsikko</label>
        <input type="text" id="new-file-title" class="input-field" value="Nimetön ${type}">
      </div>
      <div class="input-group">
        <label for="new-card-bg">Kortin taustaväri</label>
        <input type="color" id="new-card-bg" value="${defaultColor}">
      </div>
      <div class="modal-button-group">
         <button class="button-secondary" id="create-cancel-btn">Peruuta</button>
         <button class="button-primary" id="create-confirm-btn">Luo ja avaa</button>
      </div>`;
    createModal(`Luo uusi ${type}`, modalContent);

    document.getElementById('create-confirm-btn').addEventListener('click', async () => {
      try {
        const title = document.getElementById('new-file-title').value;
        const bgColor = document.getElementById('new-card-bg').value;

        // KORJATTU: Lisätään backgroundColor tietokantaan
        const newFile = {
          title: title || 'Nimetön',
          type,
          content: '',
          createdAt: new Date(),
          lastModified: new Date(),
          cardColor: bgColor,
          backgroundColor: bgColor, // TALLENNETAAN PYSYVÄ TAUSTAVÄRI
        };
        
        const newId = await addFile(newFile);
        hideModal();

        // KORJATTU: Navigoi oikeaan sovellukseen tyypin perusteella
        const targetPage = type === 'Piirustus' ? 'btn-drawing' : 'btn-notepad';
        onNavigate(targetPage, { fileId: newId });

      } catch (error) {
        console.error("Uuden tiedoston luonti epäonnistui:", error);
        alert('Tiedoston luonti epäonnistui.');
      }
    });

    document.getElementById('create-cancel-btn').addEventListener('click', hideModal);
    showModal();
  };

  // KORJATTU: Tämä modaali kysyy ensin, mitä halutaan luoda
  const showNewFileTypeModal = () => {
    const modalContent = `
      <p>Valitse, minkä tyyppisen tiedoston haluat luoda.</p>
      <div class="modal-options">
        <button class="button-primary" data-type="Muistiinpano">Muistiinpano</button>
        <button class="button-primary" data-type="Piirustus">Piirustus</button>
      </div>`;
    createModal('Valitse tiedostotyyppi', modalContent);
    
    document.querySelectorAll('.modal-options button').forEach(button => {
      button.addEventListener('click', (e) => {
        const type = e.target.dataset.type;
        hideModal();
        // Pieni viive varmistaa, että vanha modaali ehtii pois alta
        setTimeout(() => showCreationDetailsModal(type), 200);
      });
    });
    showModal();
  };
  
  // KORJATTU: Koko klikkauslogiikka on rakennettu uudelleen ja toimii nyt oikein
  filesGrid.addEventListener('click', async (event) => {
    const deleteBtn = event.target.closest('.delete-btn');
    const card = event.target.closest('.file-card');
    
    if (deleteBtn) {
      // Tapaus 1: Poistonappia klikattiin
      event.stopPropagation(); // Estää kortin klikkauksen
      const fileId = Number(deleteBtn.dataset.id);
      const confirmed = await createConfirmationModal('Vahvista poisto', 'Haluatko varmasti poistaa tämän tiedoston pysyvästi?', 'Poista');
      if (confirmed) {
        try {
          await deleteFile(fileId);
          await renderFiles(); // Päivitä näkymä onnistuneen poiston jälkeen
        } catch (error) {
          console.error('Tiedoston poisto epäonnistui:', error);
          alert('Poisto epäonnistui.');
        }
      }
    } else if (card) {
      // Tapaus 2: Itse korttia klikattiin
      const fileId = Number(card.dataset.id);
      try {
        const file = await getFileById(fileId); // Haetaan tiedosto, jotta tiedetään sen tyyppi
        if (file) {
          const targetPage = file.type === 'Piirustus' ? 'btn-drawing' : 'btn-notepad';
          onNavigate(targetPage, { fileId });
        }
      } catch (error) {
        console.error('Tiedoston avaaminen epäonnistui:', error);
        alert('Tiedoston avaaminen epäonnistui.');
      }
    }
  });

  addNewFileBtn.addEventListener('click', showNewFileTypeModal);
  await renderFiles(); // Ladataan tiedostot, kun sivu avataan
}
// src/components/card.js

/**
 * Luo yhden kortin HTML-rakenteen datan perusteella.
 * @param {object} cardData - Objekti, joka sisältää kortin tiedot (id, title, imageUrl, jne.).
 * @returns {string} - Valmis HTML-merkkijono kortille.
 */
export function createCard(cardData) {
  return `
    <div class="explore-card" data-id="${cardData.id}">
      <img src="${cardData.imageUrl}" alt="${cardData.title}" class="card-image">
      <div class="card-body">
        <h3 class="card-title">${cardData.title}</h3>
        <p class="card-description">${cardData.shortDescription}</p>
      </div>
    </div>
  `;
}
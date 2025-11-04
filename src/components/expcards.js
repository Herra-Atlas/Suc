// src/components/expcards.js

/**
 * Luo yhden Explore-sivun kortin. Voi olla tyyppiä 'app' tai 'website'.
 * @param {object} data - Kortin data.
 * @returns {string} - Valmis HTML-merkkijono kortille.
 */
export function createExpCard(data) {
  const isApp = data.type === 'app';
  // Lisätään erityinen luokka sovelluskorteille
  const cardClass = isApp ? 'exp-card app-card' : 'exp-card';

  return `
    <div class="${cardClass}" data-type="${data.type}" data-target="${data.target}">
      <img src="${data.imageUrl}" alt="${data.title}" class="card-image">
      <div class="card-body">
        <h3 class="card-title">${data.title}</h3>
        <p class="card-description">${data.shortDescription}</p>
      </div>
    </div>
  `;
}
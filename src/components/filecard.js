/**
 * Päättää, pitäisikö tekstin olla musta vai valkoinen taustavärin perusteella.
 * @param {string} hexColor - Taustavärin heksakoodi (esim. "#7b5dff").
 * @returns {string} - Palauttaa "#000000" (musta) tai "#FFFFFF" (valkoinen).
 */
function getContrastColor(hexColor) {
  if (!hexColor) return '#FFFFFF';
  const r = parseInt(hexColor.substr(1, 2), 16);
  const g = parseInt(hexColor.substr(3, 2), 16);
  const b = parseInt(hexColor.substr(5, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Luo SVG-paikkamerkkikuvan base64-enkoodattuna.
 */
function generateSvgImage(title, bgColor) {
  const textColor = getContrastColor(bgColor);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
      <rect width="100%" height="100%" fill="${bgColor}"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="${textColor}" font-weight="600">
        ${title}
      </text>
    </svg>`;
  // btoa() on funktio, joka enkoodaa merkkijonon base64-muotoon
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Luo yhden tiedostokortin HTML-rakenteen datan perusteella.
 */
export function createFileCard(fileData) {
  const title = fileData.title || 'Nimetön';
  const type = fileData.type || 'Tiedosto';
  const bgColor = fileData.cardColor || '#2a2a3a';
  const imageUrl = generateSvgImage(title, bgColor);

  return `
    <div class="file-card" data-id="${fileData.id}">
      <button class="delete-btn" data-id="${fileData.id}" title="Poista tiedosto">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
      </button>
      <div class="card-type-badge">${type}</div>
      <img src="${imageUrl}" alt="${title}" class="card-image">
      <div class="card-body">
        <h3 class="card-title">${title}</h3>
      </div>
    </div>
  `;
}
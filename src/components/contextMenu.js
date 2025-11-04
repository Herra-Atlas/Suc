// src/components/contextMenu.js

/**
 * Poistaa olemassa olevan context menun, jos sellainen on näkyvissä.
 */
function removeContextMenu() {
  const existingMenu = document.querySelector('.context-menu');
  if (existingMenu) {
    existingMenu.remove();
  }
}

/**
 * Luo ja näyttää kustomoidun context menun tietyssä paikassa.
 * @param {number} x - X-koordinaatti (sivulla).
 * @param {number} y - Y-koordinaatti (sivulla).
 * @param {Array<object>} items - Lista valikon kohteista. Jokainen objekti sisältää 'label' ja 'action' (funktio).
 */
export function createContextMenu(x, y, items) {
  // Poista vanha menu ensin
  removeContextMenu();

  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;

  items.forEach(itemData => {
    const item = document.createElement('div');
    item.className = 'context-menu-item';
    item.textContent = itemData.label;
    item.addEventListener('click', () => {
      itemData.action();
      removeContextMenu();
    });
    menu.appendChild(item);
  });

  document.body.appendChild(menu);

  // Lisätään kuuntelija, joka sulkee menun, jos klikataan sen ulkopuolelle
  setTimeout(() => {
    document.addEventListener('click', removeContextMenu, { once: true });
  }, 0);
}
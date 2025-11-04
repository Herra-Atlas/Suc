// src/utils/db.js

const DB_NAME = 'TauriAppDB';
const DB_VERSION = 2;
const FILES_STORE = 'files';
const APPS_STORE = 'installed_apps';
let db;

export function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject('Tietokannan avaaminen epäonnistui.');
    
    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = event.target.result;

      // Luo 'files' store, jos sitä ei ole
      if (!dbInstance.objectStoreNames.contains(FILES_STORE)) {
        const fileStore = dbInstance.createObjectStore(FILES_STORE, { keyPath: 'id', autoIncrement: true });
        fileStore.createIndex('lastModified', 'lastModified', { unique: false });
      }

      // UUSI OSA: Luo 'installed_apps' store, jos sitä ei ole
      if (!dbInstance.objectStoreNames.contains(APPS_STORE)) {
        dbInstance.createObjectStore(APPS_STORE, { keyPath: 'id' });
      }
    };
  });
}

// --- SOVELLUSTEN HALLINTA ---

export function deleteApp(appId) {
  return new Promise((resolve, reject) => {
    if (!db) return reject("Tietokanta ei ole alustettu.");
    const transaction = db.transaction([APPS_STORE], 'readwrite');
    const store = transaction.objectStore(APPS_STORE);
    const request = store.delete(appId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject('Sovelluksen poistaminen epäonnistui.');
  });
}

export function getInstalledApps() {
  return new Promise((resolve, reject) => {
    if (!db) return reject("Tietokanta ei ole alustettu.");
    const transaction = db.transaction([APPS_STORE], 'readonly');
    const store = transaction.objectStore(APPS_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Asennettujen sovellusten haku epäonnistui.');
  });
}

export function getAppById(appId) {
  return new Promise((resolve, reject) => {
    if (!db) return reject("Tietokanta ei ole alustettu.");
    const transaction = db.transaction([APPS_STORE], 'readonly');
    const store = transaction.objectStore(APPS_STORE);
    const request = store.get(appId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Sovelluksen haku epäonnistui.');
  });
}

export function saveApp(appData) {
  return new Promise((resolve, reject) => {
    if (!db) return reject("Tietokanta ei ole alustettu.");
    const transaction = db.transaction([APPS_STORE], 'readwrite');
    const store = transaction.objectStore(APPS_STORE);
    const request = store.put(appData); // 'put' sekä lisää että päivittää
    request.onsuccess = () => resolve();
    request.onerror = () => reject('Sovelluksen tallennus epäonnistui.');
  });
}

/**
 * Hakee kaikki tiedostot tietokannasta.
 * @returns {Promise<Array>} Promise, joka palauttaa taulukon tiedosto-objekteja.
 */
export function getAllFiles() {
  return new Promise((resolve, reject) => {
    if (!db) return reject("Tietokantaa ei ole alustettu.");
    const transaction = db.transaction([FILES_STORE], 'readonly');
    const store = transaction.objectStore(FILES_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Tiedostojen haku epäonnistui.');
  });
}

/**
 * Lisää uuden tiedoston tietokantaan.
 * @param {object} fileData - Objekti, joka sisältää tiedoston datan (title, type, jne.).
 * @returns {Promise<number>} Promise, joka palauttaa uuden tiedoston ID:n.
 */
export function addFile(fileData) {
  return new Promise((resolve, reject) => {
    if (!db) return reject("Tietokantaa ei ole alustettu.");
    const transaction = db.transaction([FILES_STORE], 'readwrite');
    const store = transaction.objectStore(FILES_STORE);
    const request = store.add(fileData);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Tiedoston lisääminen epäonnistui.');
  });
}




/**
 * Hakee yhden tiedoston sen ID:n perusteella.
 * @param {number} id - Haettavan tiedoston ID.
 * @returns {Promise<object>} Promise, joka palauttaa tiedosto-objektin.
 */
export function getFileById(id) {
  return new Promise((resolve, reject) => {
    if (!db) return reject("Tietokantaa ei ole alustettu.");
    const transaction = db.transaction([FILES_STORE], 'readonly');
    const store = transaction.objectStore(FILES_STORE);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Tiedoston haku epäonnistui.');
  });
}

/**
 * Päivittää olemassa olevan tiedoston tietokannassa.
 * @param {object} fileData - Päivitetty tiedosto-objekti (sisältää ID:n).
 * @returns {Promise<any>} Promise, joka onnistuu, kun päivitys on valmis.
 */
export function updateFile(fileData) {
  return new Promise((resolve, reject) => {
    if (!db) return reject("Tietokantaa ei ole alustettu.");
    const transaction = db.transaction([FILES_STORE], 'readwrite');
    const store = transaction.objectStore(FILES_STORE);
    const request = store.put(fileData);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Tiedoston päivitys epäonnistui.');
  });
}

/**
 * Poistaa tiedoston tietokannasta sen ID:n perusteella.
 * @param {number} id - Poistettavan tiedoston ID.
 * @returns {Promise<void>} Promise, joka onnistuu, kun poisto on valmis.
 */
export function deleteFile(id) {
  return new Promise((resolve, reject) => {
    if (!db) return reject("Tietokantaa ei ole alustettu.");
    const transaction = db.transaction([FILES_STORE], 'readwrite');
    const store = transaction.objectStore(FILES_STORE);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject('Tiedoston poistaminen epäonnistui.');
  });
}
// src/utils/api.js

// Käytämme edelleen globaalia, koska se on luotettavin tapa
const open = window.__TAURI__.shell.open;

const API_BASE_URL = 'Replace with ur host';

/**
 * Käynnistää verkkopohjaisen kirjautumisprosessin ja odottaa sen valmistumista.
 */
export function startWebLogin() {
  return new Promise(async (resolve, reject) => {
    // 1. Luo uniikki istuntotunniste
    const sessionId = crypto.randomUUID();
    
    // 2. Määritä kyselyosoite
    const checkUrl = `${API_BASE_URL}?action=check_login&session_id=${sessionId}`;
    let intervalId;

    // Asetetaan aikakatkaisu, ettei jäädä ikuiseen looppiin
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      reject(new Error("Kirjautuminen aikakatkaistiin."));
    }, 300000); // 5 minuutin aikakatkaisu

    // 3. Aloita palvelimen kysely (polling)
    intervalId = setInterval(async () => {
      try {
        const response = await fetch(checkUrl);
        const data = await response.json();

        if (data.status === 'completed') {
          // ONNISTUI!
          clearInterval(intervalId);
          clearTimeout(timeoutId);
          resolve(data.user);
        }
        // Jos status on 'pending', ei tehdä mitään ja odotetaan seuraavaa kyselyä.
      } catch (error) {
        // Jos palvelimeen ei saada yhteyttä, lopetetaan
        clearInterval(intervalId);
        clearTimeout(timeoutId);
        reject(error);
      }
    }, 2000); // Kysy 2 sekunnin välein

    // 4. Avaa selain kirjautumissivulle
    const loginUrl = `${API_BASE_URL}?action=start_login&session_id=${sessionId}`;
    await open(loginUrl);
  });
}
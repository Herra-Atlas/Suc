function runImageUploaderV2() {
    // --- ASETUKSET ---
    const API_URL = 'https://api.imgbb.com/1/upload';
    const HISTORY_STORAGE_KEY = 'img-saving-thing'; // UUSI NIMI
    const API_KEY_STORAGE_KEY = 'img-saving-thing-apikey'; // Avaimen oma tallennuspaikka

    // --- TILANHALLINTA ---
    let state = {
        apiKey: null,
    };

    // --- DOM-ELEMENTIT ---
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const historyGrid = document.getElementById('history-grid');
    const historyPlaceholder = document.getElementById('history-placeholder');
    const loadingOverlay = document.getElementById('loading-overlay');
    const topNotificationContainer = document.getElementById('top-notification-container');
    // Uuden modaalin elementit
    const apiKeyModal = document.getElementById('api-key-modal');
    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyBtn = document.getElementById('save-api-key-btn');

    // --- APUFUNKTIOT ---
    const getHistory = () => JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY)) || [];
    const saveHistory = (history) => localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));

    function showTopNotification(message) {
        if (topNotificationContainer.firstElementChild) {
            topNotificationContainer.firstElementChild.remove();
        }
        const notification = document.createElement('div');
        notification.className = 'top-notification';
        notification.textContent = message;
        topNotificationContainer.appendChild(notification);
        setTimeout(() => { notification.remove(); }, 3000);
    }

    function formatRelativeTime(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const seconds = Math.round((now - date) / 1000);
        const minutes = Math.round(seconds / 60);
        const hours = Math.round(minutes / 60);
        const days = Math.round(hours / 24);
        if (seconds < 10) return "hetki sitten";
        if (minutes < 1) return `${seconds} sekuntia sitten`;
        if (hours < 1) return `${minutes} minuuttia sitten`;
        if (days < 1) return `${hours} tuntia sitten`;
        if (days === 1) return "eilen";
        return date.toLocaleDateString('fi-FI');
    }

    // --- KÄYTTÖLIITTYMÄN PÄIVITYS ---
    function renderHistory() {
        const history = getHistory();
        historyGrid.innerHTML = '';
        if (history.length === 0) {
            historyGrid.appendChild(historyPlaceholder);
            historyPlaceholder.style.display = 'flex';
        } else {
            historyPlaceholder.style.display = 'none';
            history.slice().reverse().forEach(item => {
                const card = document.createElement('div');
                card.className = 'image-card';
                card.innerHTML = `
                    <img src="${item.thumbUrl}" alt="Ladattu kuva" class="card-thumbnail">
                    <div class="card-body">
                        <span class="card-timestamp">${formatRelativeTime(item.timestamp)}</span>
                        <div class="card-actions">
                            <button class="um-button-primary copy-btn" data-url="${item.imageUrl}" title="Kopioi linkki"><i class="fas fa-link"></i> Kopioi</button>
                            <button class="um-button-danger delete-btn" data-id="${item.id}" title="Poista historiasta"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                `;
                historyGrid.appendChild(card);
            });
        }
    }

    // --- YDINLOGIIKKA ---
    async function uploadImage(file) {
        if (!state.apiKey) {
            showTopNotification('API-avain puuttuu. Aseta se ensin.');
            showApiKeyModal();
            return;
        }

        dropZone.classList.add('loading');
        
        const formData = new FormData();
        formData.append('key', state.apiKey);
        formData.append('image', file);

        try {
            const response = await fetch(API_URL, { method: 'POST', body: formData });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error?.message || 'Lataus epäonnistui.');
            }

            const history = getHistory();
            history.push({
                id: result.data.id,
                imageUrl: result.data.url,
                thumbUrl: result.data.thumb.url,
                deleteUrl: result.data.delete_url,
                timestamp: new Date().toISOString()
            });
            saveHistory(history);
            showTopNotification('Kuva ladattu onnistuneesti!');
            renderHistory();

        } catch (error) {
            showTopNotification(`Virhe: ${error.message}`);
        } finally {
            dropZone.classList.remove('loading');
            fileInput.value = '';
        }
    }

    // --- API-AVAIMEN HALLINTA ---
    function showApiKeyModal() {
        apiKeyModal.style.display = 'block';
    }
    
    function handleSaveApiKey() {
        const key = apiKeyInput.value.trim();
        if (key) {
            localStorage.setItem(API_KEY_STORAGE_KEY, key);
            state.apiKey = key;
            apiKeyModal.style.display = 'none';
            dropZone.classList.remove('disabled');
            showTopNotification('API-avain tallennettu!');
            renderHistory();
        } else {
            showTopNotification('Syötä kelvollinen API-avain.');
        }
    }

    // --- TAPAHTUMANKÄSITTELIJÄT ---
    function setupEventListeners() {
        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); if (!dropZone.classList.contains('disabled')) dropZone.classList.add('drag-over'); });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            if (dropZone.classList.contains('disabled')) return;
            dropZone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) uploadImage(file);
        });
        dropZone.addEventListener('click', () => { if (!dropZone.classList.contains('disabled')) fileInput.click(); });
        fileInput.addEventListener('change', (e) => { if (e.target.files.length > 0) uploadImage(e.target.files[0]); });
        
        saveApiKeyBtn.addEventListener('click', handleSaveApiKey);

        historyGrid.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;

            if (button.classList.contains('copy-btn')) {
                navigator.clipboard.writeText(button.dataset.url)
                    .then(() => showTopNotification('Linkki kopioitu leikepöydälle!'));
            }

            if (button.classList.contains('delete-btn')) {
                let history = getHistory();
                history = history.filter(item => item.id !== button.dataset.id);
                saveHistory(history);
                renderHistory();
            }
        });
    }

    // --- ALUSTUS ---
    function initialize() {
        setupEventListeners();
        state.apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);

        if (!state.apiKey) {
            showApiKeyModal();
            dropZone.classList.add('disabled');
            historyPlaceholder.innerHTML = '<p>Aseta ImgBB API-avain, jotta voit aloittaa kuvien lataamisen.</p>';
        } else {
            renderHistory();
        }
    }

    initialize();
}

runImageUploaderV2();
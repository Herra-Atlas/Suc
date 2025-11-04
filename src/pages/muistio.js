// src/pages/muistio.js

import { getFileById, updateFile } from '../utils/db.js';

export const muistioContent = `
  <div class="app-container notepad-container">
    <div class="app-header">
      <button id="back-btn" class="button-secondary">&larr; Takaisin</button>
      <h1 id="note-title-display"></h1>
    </div>
    <div class="notepad-toolbar">
      <select id="font-select" class="toolbar-item">
        <option>Arial</option> <option>Verdana</option> <option>Georgia</option>
        <option>Courier New</option> <option>Times New Roman</option>
      </select>
      <button id="bold-btn" class="toolbar-item" title="Lihavoi"><b>B</b></button>
      <button id="center-btn" class="toolbar-item" title="Keskitä">
        <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M3 4h18v2H3V4zm4 14h10v2H7v-2zm-4-7h18v2H3v-2z"/></svg>
      </button>
      <button id="indent-btn" class="toolbar-item" title="Sisennä">
        <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M3 4h18v2H3V4zm0 14h18v2H3v-2zm0-7h18v2H3v-2zm8-5l4 4l-4 4V6z"/></svg>
      </button>
    </div>
    <div id="editor" class="notepad-editor-area" contenteditable="true"></div>
    <div class="app-footer">
      <div id="word-count" class="footer-item">Sanat: 0</div>
      <div id="char-count" class="footer-item">Merkit: 0</div>
      <div id="save-status" class="footer-item"></div>
    </div>
  </div>
`;

export function initializeMuistioPage(onNavigate, context) {
  try {
    const titleDisplay = document.getElementById('note-title-display');
    const editor = document.getElementById('editor');
    const saveStatus = document.getElementById('save-status');
    const backButton = document.getElementById('back-btn');
    const wordCountEl = document.getElementById('word-count');
    const charCountEl = document.getElementById('char-count');
    
    let currentNote = null;
    let saveTimeout = null;
    let isDemoMode = false;

    const loadNote = async (id) => {
      currentNote = await getFileById(id);
      if (!currentNote) throw new Error(`Tiedostoa ${id} ei löytynyt.`);
      
      titleDisplay.textContent = currentNote.title;
      editor.innerHTML = currentNote.content || '';
      updateCounters();
      updateSaveStatus('saved');
    };

    const saveNote = async () => {
      if (!currentNote || isDemoMode) return;
      currentNote.content = editor.innerHTML;
      currentNote.lastModified = new Date();
      await updateFile(currentNote);
      updateSaveStatus('saved');
    };

    const debouncedSave = () => {
      if (isDemoMode) return;
      updateSaveStatus('saving');
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(saveNote, 1500);
    };

    const updateCounters = () => {
      const text = editor.innerText;
      const words = text.trim().split(/\s+/).filter(Boolean);
      wordCountEl.textContent = `Sanat: ${text ? words.length : 0}`;
      charCountEl.textContent = `Merkit: ${text.length}`;
    };

    const updateSaveStatus = (status) => {
      if (status === 'saved') {
        saveStatus.textContent = '✓ Tallennettu';
        saveStatus.className = 'footer-item save-status saved';
      } else if (status === 'saving') {
        saveStatus.textContent = 'Tallennetaan...';
        saveStatus.className = 'footer-item save-status saving';
      }
    };
    
    editor.addEventListener('input', () => {
      updateCounters();
      debouncedSave();
    });
    
    editor.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            document.execCommand('indent', false, null);
        }
    });

    // Toolbarin toiminnallisuus
    document.getElementById('font-select').addEventListener('change', (e) => document.execCommand('fontName', false, e.target.value));
    document.getElementById('bold-btn').addEventListener('click', () => document.execCommand('bold'));
    document.getElementById('center-btn').addEventListener('click', () => document.execCommand('justifyCenter'));
    document.getElementById('indent-btn').addEventListener('click', () => document.execCommand('indent'));

    backButton.addEventListener('click', () => onNavigate(context.previousPageId || 'btn-library'));

    if (context && context.fileId) {
      isDemoMode = false;
      loadNote(context.fileId);
    } else {
      isDemoMode = true;
      titleDisplay.textContent = 'Muistion esikatselu';
      editor.innerHTML = '<p>Tämä on esikatselutila. Luo uusi tiedosto "Tiedostot"-sivulta aloittaaksesi.</p>';
      editor.contentEditable = false;
      document.querySelector('.notepad-toolbar').style.pointerEvents = 'none';
      saveStatus.textContent = 'Esikatselu';
      updateCounters();
    }

  } catch (error) {
    console.error("Muistion alustus epäonnistui:", error);
    document.querySelector('.notepad-container').innerHTML = `<h1>Virhe</h1><p>${error.message}</p>`;
  }
}
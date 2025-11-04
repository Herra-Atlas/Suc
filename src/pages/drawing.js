// src/pages/drawing.js

import { getFileById, updateFile } from '../utils/db.js';
import { createModal, showModal, hideModal, createConfirmationModal } from '../components/modal.js';

export const drawingContent = `
  <div class="app-container drawing-container">
    <div class="app-header">
      <button id="back-btn" class="button-secondary">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        <span>Takaisin</span>
      </button>
      <h1 id="drawing-title-display">Nimetön piirustus</h1>
      <div id="save-status" class="save-badge"></div>
    </div>
    
    <div class="drawing-toolbar">
      <div class="toolbar-group left">
        <button class="tool-btn" id="btn-eraser" title="Kumi">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>
        </button>
        <div class="separator"></div>
        <div id="preset-container" class="preset-group"></div>
      </div>

      <div class="toolbar-group right">
        <button class="tool-btn" id="btn-brush-settings" title="Siveltimen asetukset">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.585 2.415a.5.5 0 0 1 .652-.659l1.586 1.586a.5.5 0 0 1 0 .707l-4.486 4.486a.5.5 0 0 1-.707 0l-.354-.354a.5.5 0 0 1 0-.707z"/><path d="m2.7 21.3.3-4.2 4.2-4.2 4.2 4.2-4.2 4.2-4.2.3z"/><path d="M8.8 20v-4L19 5.3a2.12 2.12 0 0 1 3 3L11.7 18.5h-3z"/></svg>
        </button>
        <button class="tool-btn" id="btn-color-picker" title="Väri">
           <div id="current-color-indicator"></div>
        </button>
        <button class="tool-btn" id="btn-general-settings" title="Asetukset">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </div>
    </div>

    <div id="viewport">
      <div id="canvas-container">
        <canvas id="main-canvas"></canvas>
      </div>
    </div>
  </div>
`;

export function initializeDrawingPage(onNavigate, context) {
  // --- DOM Elementit ---
  const canvas = document.getElementById('main-canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const viewport = document.getElementById('viewport');
  const canvasContainer = document.getElementById('canvas-container');
  const titleDisplay = document.getElementById('drawing-title-display');
  const saveStatus = document.getElementById('save-status');
  const presetContainer = document.getElementById('preset-container');
  const colorIndicator = document.getElementById('current-color-indicator');
  
  // --- Sovelluksen Tila ---
  const state = {
    file: null,
    isDrawing: false,
    zoom: 1,
    pan: { x: 0, y: 0 },
    activeTool: 'brush',
    brush: { type: 'pen', color: '#ffffff', size: 5, opacity: 1.0 },
    eraser: { size: 20 },
    backgroundColor: '#1e1e28',
    presets: ['#ffffff', '#ff3b30', '#007aff'],
    history: [], historyStep: -1, saveTimeout: null, isDemo: false
  };
  
  let strokeCanvas, strokeCtx;
  let lastPos = { x: 0, y: 0 };

  // --- Apufunktiot ---
  const updateZoomPan = () => {
    canvasContainer.style.transform = `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.zoom})`;
  };

  const getCanvasCoordinates = (e) => {
    const viewportRect = viewport.getBoundingClientRect();
    const mouseX = e.clientX - viewportRect.left;
    const mouseY = e.clientY - viewportRect.top;
    
    return {
      x: (mouseX - state.pan.x) / state.zoom,
      y: (mouseY - state.pan.y) / state.zoom
    };
  };

  const saveToHistory = () => {
    state.historyStep++;
    state.history.splice(state.historyStep, state.history.length);
    state.history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (state.history.length > 20) {
      state.history.shift();
      state.historyStep--;
    }
  };
  
  const undo = () => {
    if (state.historyStep > 0) {
      state.historyStep--;
      ctx.putImageData(state.history[state.historyStep], 0, 0);
      debouncedSave();
    }
  };

  // --- Piirtämisen Logiikka ---
  const startDrawing = (e) => {
    if (state.isDemo || e.button !== 0) return;
    state.isDrawing = true;
    lastPos = getCanvasCoordinates(e);

    strokeCanvas = document.createElement('canvas');
    strokeCanvas.width = canvas.width;
    strokeCanvas.height = canvas.height;
    strokeCtx = strokeCanvas.getContext('2d');
    strokeCtx.lineCap = 'round';
    strokeCtx.lineJoin = 'round';

    if (state.activeTool === 'eraser') {
      strokeCtx.strokeStyle = state.backgroundColor;
      strokeCtx.lineWidth = state.eraser.size;
    } else {
      strokeCtx.strokeStyle = state.brush.color;
      strokeCtx.lineWidth = state.brush.size;
    }
  };

  const draw = (e) => {
    if (!state.isDrawing) return;
    const pos = getCanvasCoordinates(e);
    
    strokeCtx.beginPath();
    strokeCtx.moveTo(lastPos.x, lastPos.y);
    strokeCtx.lineTo(pos.x, pos.y);
    strokeCtx.stroke();
    lastPos = pos;
    
    // Yhdistä veto päänäkymään esikatselua varten
    ctx.putImageData(state.history[state.historyStep], 0, 0);
    
    // KORJATTU: Kumi piirtää nyt normaalisti päälle, ei enää 'destination-out'
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = state.activeTool === 'brush' ? state.brush.opacity : 1.0;
    
    ctx.drawImage(strokeCanvas, 0, 0);

    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
  };
  
  const stopDrawing = () => {
    if (!state.isDrawing) return;
    state.isDrawing = false;
    
    // "Polta" veto pysyvästi pääkanvaasille
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = state.activeTool === 'brush' ? state.brush.opacity : 1.0;
    ctx.drawImage(strokeCanvas, 0, 0);
    ctx.globalAlpha = 1.0;

    saveToHistory();
    debouncedSave();
    strokeCanvas = null;
  };

  // --- Tallennus ---
  const saveFile = async () => {
    if (!state.file || state.isDemo) return;
    updateSaveStatus('saving');
    const previewCanvas = document.createElement('canvas');
    const pCtx = previewCanvas.getContext('2d');
    previewCanvas.width = 400; previewCanvas.height = 300;
    pCtx.fillStyle = state.backgroundColor;
    pCtx.fillRect(0,0,400,300);
    pCtx.drawImage(canvas, 0, 0, 400, 300);

    state.file.content = canvas.toDataURL('image/png');
    state.file.imageUrl = previewCanvas.toDataURL('image/jpeg', 0.7);
    state.file.lastModified = new Date();
    await updateFile(state.file);
    updateSaveStatus('saved');
  };

  const debouncedSave = () => {
    clearTimeout(state.saveTimeout);
    state.saveTimeout = setTimeout(saveFile, 1000);
  };

  const updateSaveStatus = (status) => {
    saveStatus.textContent = status === 'saved' ? 'Tallennettu' : 'Tallennetaan...';
    saveStatus.className = `save-badge ${status}`;
  };
  
  // --- Käyttöliittymä ---
  const updatePresets = (newColor) => {
    state.presets = [newColor, ...state.presets.filter(c => c !== newColor)].slice(0, 3);
    state.brush.color = newColor;
    updateUI();
  };

  const renderPresets = () => {
    presetContainer.innerHTML = '';
    state.presets.forEach((color, index) => {
      const btn = document.createElement('button');
      btn.className = `preset-btn ${color === state.brush.color && state.activeTool === 'brush' ? 'active' : ''}`;
      btn.style.backgroundColor = color;
      btn.addEventListener('click', () => {
        state.brush.color = color;
        state.activeTool = 'brush';
        updateUI();
      });
      presetContainer.appendChild(btn);
    });
  };

  const updateUI = () => {
    renderPresets();
    document.getElementById('btn-eraser').classList.toggle('active', state.activeTool === 'eraser');
    colorIndicator.style.backgroundColor = state.brush.color;
  };

  // --- Modaalit ---
  const openBrushModal = () => {
    const content = `
      <h4>Siveltimen tyyppi</h4>
      <div class="modal-options">
        <button class="button-secondary ${state.brush.type === 'pen' ? 'active' : ''}" data-type="pen">Perus</button>
      </div>
      <hr>
      <h4>Asetukset</h4>
      <div class="input-group">
        <label>Koko: <span id="brush-size-val">${state.brush.size}</span>px</label>
        <input type="range" id="brush-size-in" min="1" max="100" value="${state.brush.size}">
      </div>
      <div class="input-group">
        <label>Peittävyys: <span id="brush-opacity-val">${Math.round(state.brush.opacity * 100)}</span>%</label>
        <input type="range" id="brush-opacity-in" min="1" max="100" value="${state.brush.opacity * 100}">
      </div>
    `;
    createModal('Siveltimen asetukset', content);
    
    document.getElementById('brush-size-in').addEventListener('input', e => { state.brush.size = parseInt(e.target.value); document.getElementById('brush-size-val').textContent = state.brush.size; });
    document.getElementById('brush-opacity-in').addEventListener('input', e => { state.brush.opacity = parseInt(e.target.value) / 100; document.getElementById('brush-opacity-val').textContent = e.target.value; });
    
    showModal();
  };

  const openColorModal = () => {
    const content = `
      <div style="display: flex; justify-content: center; padding: 2rem;">
        <input type="color" id="main-color-picker" value="${state.brush.color}" style="width: 100px; height: 100px; padding: 0; border: none; cursor: pointer;">
      </div>
    `;
    createModal('Valitse väri', content);
    document.getElementById('main-color-picker').addEventListener('input', (e) => {
      updatePresets(e.target.value);
    });
    showModal();
  };

  // KORJATTU: Asetusmodaalista on poistettu taustavärin vaihto
  const openSettingsModal = () => {
    const content = `
      <div class="input-group">
        <label>Kumin koko: <span id="eraser-size-val">${state.eraser.size}</span>px</label>
        <input type="range" id="eraser-size-in" min="1" max="200" value="${state.eraser.size}">
      </div>
      <hr>
      <button id="clear-canvas-btn" class="button-danger" style="width: 100%;">Tyhjennä koko piirustus</button>
    `;
    createModal('Asetukset', content);
    document.getElementById('eraser-size-in').addEventListener('input', e => { state.eraser.size = parseInt(e.target.value); document.getElementById('eraser-size-val').textContent = state.eraser.size; });
    document.getElementById('clear-canvas-btn').addEventListener('click', async () => {
        hideModal();
        if (await createConfirmationModal('Vahvista', 'Haluatko varmasti tyhjentää kaiken?', 'Tyhjennä')) {
            ctx.fillStyle = state.backgroundColor; // Käytä tallennettua taustaväriä
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            saveToHistory();
            debouncedSave();
        }
    });
    showModal();
  };
  
  // --- Tapahtumankuuntelijoiden Alustus ---
  const init = async () => {
    canvas.width = 2000;
    canvas.height = 1500;
    
    const viewportRect = viewport.getBoundingClientRect();
    state.pan.x = (viewportRect.width - canvas.width) / 2;
    state.pan.y = (viewportRect.height - canvas.height) / 2;
    updateZoomPan();

    if (context && context.fileId) {
      state.file = await getFileById(context.fileId);
      titleDisplay.textContent = state.file.title;

      // KORJATTU: Lataa taustaväri tiedostosta
      if (state.file.backgroundColor) {
        state.backgroundColor = state.file.backgroundColor;
      }

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        saveToHistory();
      };
      
      // Jos tiedostolla ei ole sisältöä (uusi), piirretään tausta
      if (!state.file.content) {
          ctx.fillStyle = state.backgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          saveToHistory();
      }
      img.src = state.file.content || '';

    } else {
      state.isDemo = true;
      titleDisplay.textContent = "Esikatselu";
      ctx.fillStyle = state.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveToHistory();
    }

    // Tapahtumat viewportille, jotta ne toimivat koko alueella
    viewport.addEventListener('mousedown', startDrawing);
    viewport.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDrawing);
    viewport.addEventListener('mouseleave', stopDrawing);

    viewport.addEventListener('wheel', e => {
      e.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const scaleAmount = e.deltaY > 0 ? 0.95 : 1.05;
      const newZoom = Math.max(0.1, Math.min(state.zoom * scaleAmount, 5));
      
      state.pan.x = mouseX - (mouseX - state.pan.x) * (newZoom / state.zoom);
      state.pan.y = mouseY - (mouseY - state.pan.y) * (newZoom / state.zoom);
      state.zoom = newZoom;

      updateZoomPan();
    }, { passive: false });

    window.addEventListener('keydown', e => {
      if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        undo();
      }
    });

    document.getElementById('back-btn').addEventListener('click', () => onNavigate(context.previousPageId || 'btn-library'));
    document.getElementById('btn-eraser').addEventListener('click', () => { state.activeTool = 'eraser'; updateUI(); });
    document.getElementById('btn-brush-settings').addEventListener('click', openBrushModal);
    document.getElementById('btn-color-picker').addEventListener('click', openColorModal);
    document.getElementById('btn-general-settings').addEventListener('click', openSettingsModal);

    updateUI();
  };

  init().catch(err => {
      console.error("Piirustussovelluksen alustus epäonnistui:", err);
      viewport.innerHTML = `<div class="content-card"><h1>Virhe</h1><p>Sovellusta ei voitu ladata.</p></div>`;
  });
}
function runCounterApp() {
  const display = document.getElementById('counter-display');
  const increaseBtn = document.getElementById('increase-btn');
  const decreaseBtn = document.getElementById('decrease-btn');
  const resetBtn = document.getElementById('reset-btn');

  let count = 0;

  function updateDisplay() {
    display.textContent = count;
  }

  if (increaseBtn) {
    increaseBtn.addEventListener('click', () => {
      count++;
      updateDisplay();
    });
  }

  if (decreaseBtn) {
    decreaseBtn.addEventListener('click', () => {
      count--;
      updateDisplay();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      count = 0;
      updateDisplay();
    });
  }
  
  // Varmistetaan, että alkutila näytetään heti
  updateDisplay();
}

// Suoritetaan heti, kun skripti ladataan
runCounterApp();
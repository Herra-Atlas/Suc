// Tämä koodi suoritetaan suoritus.js-sivulla
function runColorChanger() {
  const title = document.getElementById('color-title');
  const button = document.getElementById('color-button');
  const colors = ['#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#3498db'];
  let currentIndex = 0;

  if (button && title) {
    button.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % colors.length;
      title.style.color = colors[currentIndex];
    });
  }
}

// Suoritetaan heti
runColorChanger();
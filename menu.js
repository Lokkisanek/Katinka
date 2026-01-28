const grid = document.getElementById('menuGrid');
const STORAGE_KEY = 'unlockedFolder';

function getUnlocked() {
  const v = sessionStorage.getItem(STORAGE_KEY);
  return v ? Number(v) : 0;
}

function setUnlocked(n) {
  sessionStorage.setItem(STORAGE_KEY, String(n));
}

function refreshUI() {
  const unlocked = getUnlocked();
  const cards = Array.from(grid.querySelectorAll('.folder-card'));
  cards.forEach((c) => {
    const idx = Number(c.dataset.index);
    if (idx <= unlocked) {
      c.classList.remove('locked');
      const lock = c.querySelector('.folder-locked'); if (lock) lock.remove();
    } else {
      if (!c.querySelector('.folder-locked')) {
        const overlay = document.createElement('div');
        overlay.className = 'folder-locked';
        overlay.innerHTML = '<small>Zamčeno</small>';
        c.prepend(overlay);
      }
      c.classList.add('locked');
    }
  });
}

grid.addEventListener('click', (e) => {
  const card = e.target.closest('.folder-card');
  if (!card) return;

  const idx = Number(card.dataset.index);
  const unlocked = getUnlocked();

  if (idx > unlocked) {
    e.preventDefault();
    // brief shake effect
    card.animate([
      { transform: 'translateX(0)' }, 
      { transform: 'translateX(-8px)' }, 
      { transform: 'translateX(8px)' }, 
      { transform: 'translateX(0)' }
    ], { duration: 360 });
    return;
  }

  // Allow navigation, but unlock the next level for next time
  const next = idx + 1;
  if (next > unlocked) setUnlocked(next);
});

// initialize
refreshUI();

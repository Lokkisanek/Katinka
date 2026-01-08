const grid = document.getElementById('menuGrid');
const modal = document.getElementById('menuModal');
const panelTitle = document.getElementById('panelTitle');
const panelContent = document.getElementById('panelContent');
const closePanel = document.getElementById('closePanel');

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

function openPreview(card) {
  const idx = Number(card.dataset.index);
  const title = card.querySelector('h3')?.textContent || 'Slozka';
  panelTitle.textContent = title;
  // Simple placeholder content — can be extended per folder
  if (idx === 0) {
    panelContent.innerHTML = '<p>Tohle je náš malý wrapped — pár obrázků, textů a vzpomínek. Procházím se společně s tebou.</p><img src="assets/curious.gif" style="width:180px;border-radius:8px;margin-top:12px;" alt="náš wrapped" />';
  } else if (idx === 1) {
    panelContent.innerHTML = '<p>Galaxie: efekty, hvězdy a obrázky.</p><img src="assets/galaxy.gif" style="width:220px;border-radius:8px;margin-top:12px;" alt="galaxie" />';
  } else if (idx === 2) {
    panelContent.innerHTML = '<p>Hra o nás: malá interakce a vzpomínky.</p><img src="assets/game.gif" style="width:220px;border-radius:8px;margin-top:12px;" alt="hra o nás" />';
  } else {
    panelContent.innerHTML = '<p>Obsah této složky bude brzy.</p>';
  }

  modal.classList.add('show');
  // When modal is open, mark this as viewed and unlock next
  const next = idx + 1;
  const unlocked = getUnlocked();
  if (next > unlocked) setUnlocked(next);
  refreshUI();
}

grid.addEventListener('click', (e) => {
  const card = e.target.closest('.folder-card');
  if (!card) return;
  const idx = Number(card.dataset.index);
  const unlocked = getUnlocked();
  if (idx > unlocked) {
    // brief shake effect
    card.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }], { duration: 360 });
    return;
  }
  openPreview(card);
});

closePanel.addEventListener('click', () => {
  modal.classList.remove('show');
});

modal.addEventListener('click', (e) => {
  if (e.target === modal) modal.classList.remove('show');
});

// initialize
refreshUI();

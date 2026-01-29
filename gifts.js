// Gifts unlock system

const STORAGE_KEY = 'unlockedSections';
const GIFT_STORAGE_KEY = 'revealedGifts';
const GAMES_STORAGE_KEY = 'completedGames';

// Gift data
const giftData = {
  gift1: {
    required: 'wrapped-complete',
    image: 'img/voucher-wellness.jpg',
    title: 'Něco pro relax',
    description: 'První kousek skládačky tvých narozenin.'
  },
  gift2: {
    required: 'galaxy-secret',
    image: 'img/listky-koncert.jpg',
    title: 'Kulturní zážitek',
    description: 'Protože vím, jak tuhle kapelu miluješ!'
  },
  gift3: {
    required: 'all-games-complete',
    image: 'img/hlavni-prekvapeni.jpg',
    title: 'To nejlepší na konec',
    description: 'Díky, že jsi to dočetla až sem. Miluju tě.'
  }
};

// DOM elements
const giftsGrid = document.getElementById('giftsGrid');
const progressFill = document.getElementById('progressFill');
const unlockedCountEl = document.getElementById('unlockedCount');
const giftModal = document.getElementById('giftModal');
const modalGiftImage = document.getElementById('modalGiftImage');
const modalGiftTitle = document.getElementById('modalGiftTitle');
const modalGiftDescription = document.getElementById('modalGiftDescription');
const closeModalBtn = document.getElementById('closeModal');

// Get unlocked sections from storage
function getUnlockedSections() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

// Get completed games from storage
function getCompletedGames() {
  const stored = localStorage.getItem(GAMES_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

// Get revealed gifts from storage
function getRevealedGifts() {
  const stored = localStorage.getItem(GIFT_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

// Save revealed gift
function saveRevealedGift(giftId) {
  const revealed = getRevealedGifts();
  if (!revealed.includes(giftId)) {
    revealed.push(giftId);
    localStorage.setItem(GIFT_STORAGE_KEY, JSON.stringify(revealed));
  }
}

// Check if requirement is met
function isRequirementMet(required) {
  const unlockedSections = getUnlockedSections();
  const completedGames = getCompletedGames();
  
  if (required === 'all-games-complete') {
    // Check if all 3 games are completed
    return completedGames.includes('game1') && 
           completedGames.includes('game2') && 
           completedGames.includes('game3');
  }
  
  return unlockedSections.includes(required);
}

// Update games progress display
function updateGamesProgress() {
  const completedGames = getCompletedGames();
  const gameChecks = document.querySelectorAll('.game-check');
  
  gameChecks.forEach(check => {
    const gameId = check.dataset.game;
    if (completedGames.includes(gameId)) {
      check.classList.add('completed');
      check.textContent = '✅ ' + check.textContent.replace('🎮 ', '');
    }
  });
}

// Check and unlock gifts
function checkAndUnlockGifts() {
  const revealedGifts = getRevealedGifts();
  const giftCards = document.querySelectorAll('.gift-card');
  let unlockedCount = 0;
  
  giftCards.forEach(card => {
    const giftId = card.dataset.gift;
    const required = card.dataset.required;
    const gift = giftData[giftId];
    
    // Check if already revealed
    if (revealedGifts.includes(giftId)) {
      card.classList.remove('locked');
      card.classList.add('unlocked');
      unlockedCount++;
      return;
    }
    
    // Check if requirement is met
    if (isRequirementMet(required)) {
      // New unlock! Show modal
      card.classList.remove('locked');
      card.classList.add('unlocked', 'just-unlocked');
      
      setTimeout(() => {
        card.classList.remove('just-unlocked');
      }, 1000);
      
      // Show reveal modal
      showGiftModal(gift);
      saveRevealedGift(giftId);
      unlockedCount++;
    }
  });
  
  // Update progress
  updateProgress(unlockedCount);
  updateGamesProgress();
}

// Show gift reveal modal
function showGiftModal(gift) {
  modalGiftImage.src = gift.image;
  modalGiftTitle.textContent = gift.title;
  modalGiftDescription.textContent = gift.description;
  giftModal.classList.add('show');
}

// Update progress bar
function updateProgress(count) {
  const totalGifts = Object.keys(giftData).length;
  const percentage = (count / totalGifts) * 100;
  
  progressFill.style.width = `${percentage}%`;
  unlockedCountEl.textContent = count;
}

// Initialize on load
function init() {
  const revealedGifts = getRevealedGifts();
  const giftCards = document.querySelectorAll('.gift-card');
  let unlockedCount = 0;
  
  // First, show already revealed gifts (without modal)
  giftCards.forEach(card => {
    const giftId = card.dataset.gift;
    if (revealedGifts.includes(giftId)) {
      card.classList.remove('locked');
      card.classList.add('unlocked');
      unlockedCount++;
    }
  });
  
  updateProgress(unlockedCount);
  
  // Then check for new unlocks
  setTimeout(() => {
    checkAndUnlockGifts();
  }, 500);
}

// Event listeners
closeModalBtn.addEventListener('click', () => {
  giftModal.classList.remove('show');
});

giftModal.addEventListener('click', (e) => {
  if (e.target === giftModal) {
    giftModal.classList.remove('show');
  }
});

// Initialize
init();

// =====================================================
// HELPER FUNCTIONS - use on other pages
// =====================================================

// Mark a section as visited (for gift unlocking)
// Usage: markSectionVisited('wrapped-complete');
window.markSectionVisited = function(sectionId) {
  const sections = getUnlockedSections();
  if (!sections.includes(sectionId)) {
    sections.push(sectionId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
  }
};

// Mark a game as completed
// Usage: markGameCompleted('game1');
window.markGameCompleted = function(gameId) {
  const stored = localStorage.getItem(GAMES_STORAGE_KEY);
  const games = stored ? JSON.parse(stored) : [];
  if (!games.includes(gameId)) {
    games.push(gameId);
    localStorage.setItem(GAMES_STORAGE_KEY, JSON.stringify(games));
  }
};

// Export function for use on other pages
window.markSectionVisited = function(sectionId) {
  const sections = getUnlockedSections();
  if (!sections.includes(sectionId)) {
    sections.push(sectionId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
  }
};

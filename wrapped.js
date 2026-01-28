// ===== NÁŠ WRAPPED - Spotify-style experience =====

const slides = document.querySelectorAll('.slide');
const progressFill = document.getElementById('progressFill');
const timerDisplay = document.getElementById('timerDisplay');

let current = 0;
const total = slides.length;

const audioMap = new Map();
let currentAudio = null;
let currentSlideWithAudio = null;
let pendingSlideForAudio = null;
let awaitingGestureForAudio = false;
let skipNextAdvance = false;
let pointerGestureHandler = null;
let keyGestureHandler = null;

// ===== Timer since 2025-04-29 =====
const startDate = new Date('2025-04-29T00:00:00');

function updateTimer() {
  const now = new Date();
  let diff = Math.max(0, now - startDate);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hrs = Math.floor(diff / (1000 * 60 * 60)) % 24;
  const min = Math.floor(diff / (1000 * 60)) % 60;
  const sec = Math.floor(diff / 1000) % 60;

  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  const remDays = (days % 365) % 30;

  let parts = [];
  if (years > 0) parts.push(`${years} rok${years > 1 ? 'y' : ''}`);
  if (months > 0) parts.push(`${months} měsíc${months > 4 ? 'ů' : months > 1 ? 'e' : ''}`);
  if (remDays > 0) parts.push(`${remDays} dn${remDays > 4 ? 'í' : remDays > 1 ? 'y' : 'en'}`);
  
  // Přidáme hodiny, minuty a vteřiny
  const timeStr = `${String(hrs).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  
  if (timerDisplay) {
    const mainText = parts.join(', ') || '0 dní';
    timerDisplay.textContent = `${mainText} • ${timeStr}`;
  }
}

setInterval(updateTimer, 1000);
updateTimer();

// ===== Audio helpers =====

function stopCurrentAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
    currentSlideWithAudio = null;
  }
  cancelPendingGesture();
}

function getAudio(slide) {
  let audio = audioMap.get(slide);
  if (!audio) {
    audio = new Audio(slide.dataset.song);
    audioMap.set(slide, audio);
    audio.addEventListener('ended', () => {
      if (currentSlideWithAudio === slide) {
        currentAudio = null;
        currentSlideWithAudio = null;
      }
    });
  }
  return audio;
}

function playSlideAudio(slide, fromGesture = false) {
  const song = (slide.dataset.song || '').trim();
  if (!song) return;

  stopCurrentAudio();
  const audio = getAudio(slide);
  currentAudio = audio;
  currentSlideWithAudio = slide;
  audio.play().catch((err) => {
    if (!fromGesture && err && err.name === 'NotAllowedError') {
      requestUserGesture(slide);
      return;
    }
    // eslint-disable-next-line no-console
    console.warn('Audio playback failed:', err);
  });
}

function handleSlideAudio(slide) {
  const song = (slide.dataset.song || '').trim();
  if (!song) {
    stopCurrentAudio();
    return;
  }

  const autoPlay = slide.dataset.autoplay === 'true';
  if (!autoPlay) {
    stopCurrentAudio();
    return;
  }

  if (currentSlideWithAudio === slide && currentAudio) {
    currentAudio.play().catch((err) => {
      if (err && err.name === 'NotAllowedError') requestUserGesture(slide);
    });
    return;
  }

  playSlideAudio(slide);
}

function detachGestureListeners() {
  awaitingGestureForAudio = false;
  if (pointerGestureHandler) {
    document.removeEventListener('pointerdown', pointerGestureHandler, true);
    pointerGestureHandler = null;
  }
  if (keyGestureHandler) {
    document.removeEventListener('keydown', keyGestureHandler, true);
    keyGestureHandler = null;
  }
}

function cancelPendingGesture() {
  pendingSlideForAudio = null;
  detachGestureListeners();
}

function requestUserGesture(slide) {
  pendingSlideForAudio = slide;
  if (awaitingGestureForAudio) return;
  awaitingGestureForAudio = true;

  const resumePlayback = () => {
    const target = pendingSlideForAudio;
    pendingSlideForAudio = null;
    skipNextAdvance = true;
    if (target) playSlideAudio(target, true);
  };

  pointerGestureHandler = () => {
    detachGestureListeners();
    resumePlayback();
  };

  keyGestureHandler = (e) => {
    const keys = [' ', 'Spacebar', 'Space', 'ArrowRight', 'Enter'];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    detachGestureListeners();
    resumePlayback();
  };

  document.addEventListener('pointerdown', pointerGestureHandler, true);
  document.addEventListener('keydown', keyGestureHandler, true);
}

// ===== Slide navigation =====
function showSlide(index) {
  const prevSlide = slides[current];
  const idx = Math.max(0, Math.min(index, total - 1));

  if (prevSlide && prevSlide !== slides[idx]) {
    stopCurrentAudio();
  }

  current = idx;

  slides.forEach((s, i) => {
    s.classList.toggle('active', i === idx);
  });

  // Update progress bar
  const percent = ((idx + 1) / total) * 100;
  if (progressFill) progressFill.style.width = `${percent}%`;

  handleSlideAudio(slides[idx]);
}

function nextSlide() {
  if (current < total - 1) {
    showSlide(current + 1);
  }
}

function prevSlide() {
  if (current > 0) {
    showSlide(current - 1);
  }
}

// ===== Event listeners =====

// Click anywhere to advance
document.addEventListener('click', (e) => {
  if (skipNextAdvance) {
    skipNextAdvance = false;
    return;
  }
  // Don't advance if clicking buttons
  if (e.target.closest('button')) return;
  if (e.target.closest('.slide-gallery')) return;
  nextSlide();
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  const advanceKeys = ['ArrowRight', ' ', 'Spacebar'];
  const backKeys = ['ArrowLeft'];
  if (skipNextAdvance && (advanceKeys.includes(e.key) || backKeys.includes(e.key))) {
    e.preventDefault();
    skipNextAdvance = false;
    return;
  }
  if (e.key === 'ArrowRight' || e.key === ' ') {
    e.preventDefault();
    nextSlide();
  }
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    prevSlide();
  }
});

// Touch swipe support
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

document.addEventListener('touchend', (e) => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
}, { passive: true });

function handleSwipe() {
  const diff = touchStartX - touchEndX;
  if (Math.abs(diff) > 50) {
    if (diff > 0) nextSlide(); // swipe left = next
    else prevSlide(); // swipe right = prev
  }
}

// Replay button
const btnReplay = document.getElementById('replay');
if (btnReplay) {
  btnReplay.addEventListener('click', (e) => {
    e.stopPropagation();
    stopCurrentAudio();
    showSlide(0);
  });
}

// Close/back button
const btnClose = document.getElementById('closeWrapped');
if (btnClose) {
  btnClose.addEventListener('click', (e) => {
    e.stopPropagation();
    stopCurrentAudio();
    window.location.href = 'menu.html';
  });
}

// ===== Initialize =====
showSlide(0);

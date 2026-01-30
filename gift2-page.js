// Gift 2 unwrapping experience

const giftBox = document.getElementById('giftBox');
const giftLid = document.getElementById('giftLid');
const giftBefore = document.getElementById('giftBefore');
const giftAfter = document.getElementById('giftAfter');
const clickCountEl = document.getElementById('clickCount');
const canvas = document.getElementById('confettiCanvas');
const ctx = canvas.getContext('2d');

let clickCount = 0;
const requiredClicks = 5;

// Resize canvas
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Confetti system - Purple/Gold theme
const confetti = [];
const colors = ['#a855f7', '#7c3aed', '#c084fc', '#ffd700', '#ffec8b', '#e879f9', '#f0abfc'];

class Confetto {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = -20;
    this.size = Math.random() * 10 + 5;
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.speedY = Math.random() * 3 + 2;
    this.speedX = Math.random() * 4 - 2;
    this.rotation = Math.random() * 360;
    this.rotationSpeed = Math.random() * 10 - 5;
    this.shape = Math.random() > 0.5 ? 'rect' : 'circle';
  }

  update() {
    this.y += this.speedY;
    this.x += this.speedX;
    this.rotation += this.rotationSpeed;
    this.speedY += 0.05; // gravity
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation * Math.PI / 180);
    ctx.fillStyle = this.color;
    
    if (this.shape === 'rect') {
      ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
}

let animating = false;

function launchConfetti() {
  animating = true;
  
  // Create confetti burst
  for (let i = 0; i < 150; i++) {
    setTimeout(() => {
      confetti.push(new Confetto());
    }, i * 20);
  }
  
  // Additional bursts
  setTimeout(() => {
    for (let i = 0; i < 100; i++) {
      setTimeout(() => confetti.push(new Confetto()), i * 15);
    }
  }, 500);
  
  setTimeout(() => {
    for (let i = 0; i < 50; i++) {
      setTimeout(() => confetti.push(new Confetto()), i * 20);
    }
  }, 1000);
}

function animateConfetti() {
  if (!animating && confetti.length === 0) return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  for (let i = confetti.length - 1; i >= 0; i--) {
    confetti[i].update();
    confetti[i].draw();
    
    // Remove if off screen
    if (confetti[i].y > canvas.height + 20) {
      confetti.splice(i, 1);
    }
  }
  
  requestAnimationFrame(animateConfetti);
}

// Create star burst effect
function createStarBurst(x, y) {
  const stars = ['⭐', '✨', '💫', '🌟', '💜'];
  for (let i = 0; i < 8; i++) {
    const star = document.createElement('span');
    star.className = 'star-burst';
    star.textContent = stars[Math.floor(Math.random() * stars.length)];
    star.style.left = x + 'px';
    star.style.top = y + 'px';
    star.style.transform = `rotate(${i * 45}deg)`;
    document.body.appendChild(star);
    
    setTimeout(() => star.remove(), 1000);
  }
}

// Gift click handler
giftBox.addEventListener('click', (e) => {
  clickCount++;
  
  // Shake animation
  giftBox.classList.remove('shaking');
  void giftBox.offsetWidth; // Trigger reflow
  giftBox.classList.add('shaking');
  
  // Create mini stars
  createStarBurst(e.clientX, e.clientY);
  
  // Update click counter
  const remaining = requiredClicks - clickCount;
  if (remaining > 0) {
    clickCountEl.textContent = `Ještě ${remaining}x klikni! 💪`;
  } else {
    clickCountEl.textContent = '';
  }
  
  // Open gift when enough clicks
  if (clickCount >= requiredClicks) {
    openGift();
  }
});

let soundPlayed = false;

function openGift() {
  // Play confetti sound only once
  if (!soundPlayed) {
    soundPlayed = true;
    const confettiSound = new Audio('assets/1gift-confetti-447240.mp3');
    confettiSound.volume = 0.7;
    confettiSound.play().catch(() => {});
  }
  
  // Open lid animation
  giftLid.classList.add('open');
  
  // Launch confetti
  launchConfetti();
  animateConfetti();
  
  // Transition to revealed state
  setTimeout(() => {
    giftBefore.style.opacity = '0';
    giftBefore.style.transform = 'scale(0.8)';
    giftBefore.style.transition = 'all 0.5s ease';
    
    setTimeout(() => {
      giftBefore.style.display = 'none';
      giftAfter.classList.remove('hidden');
    }, 500);
  }, 800);
}

// Maze game - Find your way to me
const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
const winModal = document.getElementById('winModal');
const playAgainBtn = document.getElementById('playAgain');

// Maze settings
const CELL_SIZE = 40;
const MAZE_WIDTH = 13;
const MAZE_HEIGHT = 11;

canvas.width = MAZE_WIDTH * CELL_SIZE;
canvas.height = MAZE_HEIGHT * CELL_SIZE;

// Maze layout: 0 = path, 1 = wall
// S = start (girlfriend), E = end (boyfriend)
const mazeTemplate = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,1,0,1,1,1,0,1],
  [1,0,1,0,0,0,1,0,1,0,1,0,1],
  [1,0,1,0,1,1,1,1,1,0,1,1,1],
  [1,0,0,0,0,0,0,0,1,0,0,0,1],
  [1,1,1,0,1,1,1,1,1,1,1,0,1],
  [1,0,0,0,1,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,1,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// Player position (girlfriend starts here)
let playerX = 1;
let playerY = 1;

// Goal position (boyfriend is here)
const goalX = 11;
const goalY = 9;

// Load images
const girlfriendImg = new Image();
const boyfriendImg = new Image();
let imagesLoaded = 0;

girlfriendImg.onload = boyfriendImg.onload = () => {
  imagesLoaded++;
  if (imagesLoaded >= 2) draw();
};

girlfriendImg.onerror = () => {
  // Fallback if image doesn't exist
  girlfriendImg.failed = true;
  imagesLoaded++;
  if (imagesLoaded >= 2) draw();
};

boyfriendImg.onerror = () => {
  boyfriendImg.failed = true;
  imagesLoaded++;
  if (imagesLoaded >= 2) draw();
};

girlfriendImg.src = 'assets/girlfriend.png';
boyfriendImg.src = 'assets/boyfriend.png';

// Colors
const WALL_COLOR = '#ff699d';
const PATH_COLOR = '#fff7f6';
const WALL_SHADOW = '#d4567f';

function draw() {
  // Clear canvas
  ctx.fillStyle = PATH_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw maze
  for (let y = 0; y < MAZE_HEIGHT; y++) {
    for (let x = 0; x < MAZE_WIDTH; x++) {
      if (mazeTemplate[y][x] === 1) {
        // Wall with 3D effect
        ctx.fillStyle = WALL_COLOR;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Shadow effect
        ctx.fillStyle = WALL_SHADOW;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE + CELL_SIZE - 4, CELL_SIZE, 4);
        ctx.fillRect(x * CELL_SIZE + CELL_SIZE - 4, y * CELL_SIZE, 4, CELL_SIZE);
        
        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, 4);
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, 4, CELL_SIZE);
      }
    }
  }

  // Draw goal (boyfriend)
  const padding = 4;
  if (boyfriendImg.complete && !boyfriendImg.failed) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(
      goalX * CELL_SIZE + CELL_SIZE / 2,
      goalY * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - padding,
      0, Math.PI * 2
    );
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(
      boyfriendImg,
      goalX * CELL_SIZE + padding,
      goalY * CELL_SIZE + padding,
      CELL_SIZE - padding * 2,
      CELL_SIZE - padding * 2
    );
    ctx.restore();
  } else {
    // Fallback circle
    ctx.fillStyle = '#4a90d9';
    ctx.beginPath();
    ctx.arc(
      goalX * CELL_SIZE + CELL_SIZE / 2,
      goalY * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - padding,
      0, Math.PI * 2
    );
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('♂', goalX * CELL_SIZE + CELL_SIZE / 2, goalY * CELL_SIZE + CELL_SIZE / 2);
  }

  // Draw goal ring
  ctx.strokeStyle = '#ff699d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(
    goalX * CELL_SIZE + CELL_SIZE / 2,
    goalY * CELL_SIZE + CELL_SIZE / 2,
    CELL_SIZE / 2 - 2,
    0, Math.PI * 2
  );
  ctx.stroke();

  // Draw player (girlfriend)
  if (girlfriendImg.complete && !girlfriendImg.failed) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(
      playerX * CELL_SIZE + CELL_SIZE / 2,
      playerY * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - padding,
      0, Math.PI * 2
    );
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(
      girlfriendImg,
      playerX * CELL_SIZE + padding,
      playerY * CELL_SIZE + padding,
      CELL_SIZE - padding * 2,
      CELL_SIZE - padding * 2
    );
    ctx.restore();
  } else {
    // Fallback circle
    ctx.fillStyle = '#ff699d';
    ctx.beginPath();
    ctx.arc(
      playerX * CELL_SIZE + CELL_SIZE / 2,
      playerY * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - padding,
      0, Math.PI * 2
    );
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('♀', playerX * CELL_SIZE + CELL_SIZE / 2, playerY * CELL_SIZE + CELL_SIZE / 2);
  }

  // Draw player ring
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(
    playerX * CELL_SIZE + CELL_SIZE / 2,
    playerY * CELL_SIZE + CELL_SIZE / 2,
    CELL_SIZE / 2 - 2,
    0, Math.PI * 2
  );
  ctx.stroke();
}

function move(dx, dy) {
  const newX = playerX + dx;
  const newY = playerY + dy;

  // Check bounds
  if (newX < 0 || newX >= MAZE_WIDTH || newY < 0 || newY >= MAZE_HEIGHT) return;

  // Check wall
  if (mazeTemplate[newY][newX] === 1) return;

  // Move player
  playerX = newX;
  playerY = newY;

  draw();

  // Check win
  if (playerX === goalX && playerY === goalY) {
    setTimeout(() => {
      winModal.classList.add('show');
    }, 200);
  }
}

function resetGame() {
  playerX = 1;
  playerY = 1;
  winModal.classList.remove('show');
  draw();
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      e.preventDefault();
      move(0, -1);
      break;
    case 'ArrowDown':
    case 's':
    case 'S':
      e.preventDefault();
      move(0, 1);
      break;
    case 'ArrowLeft':
    case 'a':
    case 'A':
      e.preventDefault();
      move(-1, 0);
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      e.preventDefault();
      move(1, 0);
      break;
  }
});

// Touch/swipe controls for mobile
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

canvas.addEventListener('touchend', (e) => {
  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;

  const dx = touchEndX - touchStartX;
  const dy = touchEndY - touchStartY;

  const minSwipe = 30;

  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal swipe
    if (dx > minSwipe) move(1, 0);
    else if (dx < -minSwipe) move(-1, 0);
  } else {
    // Vertical swipe
    if (dy > minSwipe) move(0, 1);
    else if (dy < -minSwipe) move(0, -1);
  }
}, { passive: true });

// Play again button
playAgainBtn.addEventListener('click', resetGame);

// Initial draw (with timeout to allow images to start loading)
setTimeout(() => {
  draw();
}, 100);

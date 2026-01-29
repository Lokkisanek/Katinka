// Sliding Puzzle - Arrange tiles to form our photo

const config = {
  rows: 3,
  columns: 3,
  imageSource: 'assets/images/nase-spolecna-fotka.jpg'
};

// DOM elements
const grid = document.getElementById('puzzleGrid');
const movesCountEl = document.getElementById('movesCount');
const shuffleBtn = document.getElementById('shuffleBtn');
const winModal = document.getElementById('winModal');
const playAgainBtn = document.getElementById('playAgainBtn');
const finalMovesEl = document.getElementById('finalMoves');

// Game state
let tiles = [];
let emptyIndex = 8;
let moves = 0;
let isShuffling = false;

// Initialize the puzzle
function initPuzzle() {
  grid.innerHTML = '';
  tiles = [];
  moves = 0;
  movesCountEl.textContent = '0';
  
  const totalTiles = config.rows * config.columns;
  
  for (let i = 0; i < totalTiles; i++) {
    const tile = document.createElement('div');
    tile.className = 'puzzle-tile';
    tile.dataset.index = i;
    tile.dataset.correctPosition = i;
    
    if (i === totalTiles - 1) {
      tile.classList.add('empty');
      emptyIndex = i;
    } else {
      const row = Math.floor(i / config.columns);
      const col = i % config.columns;
      
      const tileImage = document.createElement('div');
      tileImage.className = 'tile-image';
      tileImage.style.backgroundImage = `url('${config.imageSource}')`;
      tileImage.style.backgroundSize = `${config.columns * 100}% ${config.rows * 100}%`;
      tileImage.style.backgroundPosition = `${col * 50}% ${row * 50}%`;
      tile.appendChild(tileImage);
    }
    
    tile.addEventListener('click', () => handleTileClick(tile));
    grid.appendChild(tile);
    tiles.push(tile);
  }
  
  updateMovableIndicators();
}

// Handle tile click
function handleTileClick(tile) {
  if (isShuffling) return;
  
  const tileIndex = Array.from(grid.children).indexOf(tile);
  
  if (canMove(tileIndex)) {
    swapTiles(tileIndex, emptyIndex);
    moves++;
    movesCountEl.textContent = moves;
    
    tile.classList.add('just-moved');
    setTimeout(() => tile.classList.remove('just-moved'), 150);
    
    updateMovableIndicators();
    
    if (checkWin()) {
      setTimeout(showWin, 300);
    }
  }
}

// Check if tile can move
function canMove(index) {
  const emptyRow = Math.floor(emptyIndex / config.columns);
  const emptyCol = emptyIndex % config.columns;
  const tileRow = Math.floor(index / config.columns);
  const tileCol = index % config.columns;
  
  const rowDiff = Math.abs(emptyRow - tileRow);
  const colDiff = Math.abs(emptyCol - tileCol);
  
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

// Swap two tiles
function swapTiles(index1, index2) {
  const children = Array.from(grid.children);
  const tile1 = children[index1];
  const tile2 = children[index2];
  
  const temp = document.createElement('div');
  grid.insertBefore(temp, tile1);
  grid.insertBefore(tile1, tile2);
  grid.insertBefore(tile2, temp);
  grid.removeChild(temp);
  
  if (index1 === emptyIndex) {
    emptyIndex = index2;
  } else if (index2 === emptyIndex) {
    emptyIndex = index1;
  }
}

// Update movable indicators
function updateMovableIndicators() {
  const children = Array.from(grid.children);
  children.forEach((tile, index) => {
    tile.classList.remove('movable');
    if (!tile.classList.contains('empty') && canMove(index)) {
      tile.classList.add('movable');
    }
  });
}

// Check if puzzle is solved
function checkWin() {
  const children = Array.from(grid.children);
  for (let i = 0; i < children.length; i++) {
    if (parseInt(children[i].dataset.correctPosition) !== i) {
      return false;
    }
  }
  return true;
}

// Shuffle the puzzle
function shuffle() {
  isShuffling = true;
  moves = 0;
  movesCountEl.textContent = '0';
  
  const shuffleMoves = 100;
  let lastMove = -1;
  
  for (let i = 0; i < shuffleMoves; i++) {
    const possibleMoves = getMovableTiles().filter(idx => idx !== lastMove);
    if (possibleMoves.length > 0) {
      const randomIndex = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      swapTiles(randomIndex, emptyIndex);
      lastMove = emptyIndex;
    }
  }
  
  updateMovableIndicators();
  isShuffling = false;
}

// Get movable tiles
function getMovableTiles() {
  const movable = [];
  const children = Array.from(grid.children);
  children.forEach((tile, index) => {
    if (!tile.classList.contains('empty') && canMove(index)) {
      movable.push(index);
    }
  });
  return movable;
}

// Show win screen
function showWin() {
  finalMovesEl.textContent = moves;
  winModal.classList.add('show');
}

// Event listeners
shuffleBtn.addEventListener('click', shuffle);

playAgainBtn.addEventListener('click', () => {
  winModal.classList.remove('show');
  initPuzzle();
  shuffle();
});

// Keyboard support
document.addEventListener('keydown', (e) => {
  if (isShuffling) return;
  
  const emptyRow = Math.floor(emptyIndex / config.columns);
  const emptyCol = emptyIndex % config.columns;
  let targetIndex = -1;
  
  switch (e.key) {
    case 'ArrowUp':
      if (emptyRow < config.rows - 1) {
        targetIndex = emptyIndex + config.columns;
      }
      break;
    case 'ArrowDown':
      if (emptyRow > 0) {
        targetIndex = emptyIndex - config.columns;
      }
      break;
    case 'ArrowLeft':
      if (emptyCol < config.columns - 1) {
        targetIndex = emptyIndex + 1;
      }
      break;
    case 'ArrowRight':
      if (emptyCol > 0) {
        targetIndex = emptyIndex - 1;
      }
      break;
  }
  
  if (targetIndex >= 0 && targetIndex < config.rows * config.columns) {
    const children = Array.from(grid.children);
    handleTileClick(children[targetIndex]);
  }
});

// Initialize and shuffle on load
initPuzzle();
setTimeout(shuffle, 500);

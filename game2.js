// Who Wants to Be a Millionaire (in Kisses) Quiz Game

const gameData = {
  gameTitle: "Chceš být milionářem (v pusinkách)?",
  currency: "pusinek",
  levels: [
    { amount: 100, label: "10. level", milestone: true },
    { amount: 80, label: "9. level" },
    { amount: 60, label: "8. level" },
    { amount: 40, label: "7. level" },
    { amount: 25, label: "6. level", milestone: true },
    { amount: 15, label: "5. level" },
    { amount: 10, label: "4. level" },
    { amount: 5, label: "3. level", milestone: true },
    { amount: 2, label: "2. level" },
    { amount: 1, label: "1. level" }
  ],
  questions: [
    {
      id: 1,
      reward: 1,
      question: "Kde jsme se úplně poprvé potkali?",
      options: ["V klubu", "Na zastávce", "Venku na náměstí", "Přes IG"],
      correct: 2
    },
    {
      id: 2,
      reward: 2,
      question: "Jaké jídlo jsem ti uvařil/byli jsme na něm jako první?",
      options: ["Mekáč", "Tousty", "Sushi", "Svíčkovou"],
      correct: 0
    },
    {
      id: 3,
      reward: 5,
      question: "Jakou barvu očí mám?",
      options: ["Šedo Modrou", "Zelenou", "Hnědou", "Podle nálady"],
      correct: 0
    },
    {
      id: 4,
      reward: 10,
      question: "Jaka byla naše první pusa?",
      options: ["Krvavá", "Sigma", "Celkem dobrá", "Romantická"],
      correct: 0
    },
    {
      id: 5,
      reward: 15,
      question: "Jaké písničky mam nejradši?",
      options: ["Českej Rap", "brainrot songy", "Dnb", "Pop"],
      correct: 2
    },
    {
      id: 6,
      reward: 25,
      question: "Kde jsme spolu byli nejdál?",
      options: ["Praha", "V Německu", "Anglie", "Polsko"],
      correct: 0
    },
    {
      id: 7,
      reward: 40,
      question: "Jak se jmenuje náš ohýnek na TikToku?",
      options: ["Sigma", "Dj Zkurvy", "Eddie", "Pandička"],
      correct: 3
    },
    {
      id: 8,
      reward: 60,
      question: "Jak mam dlouhý penis?",
      options: ["Megalodon", "Žižalka", "Average", "špíš ne"],
      correct: 0
    },
    {
      id: 9,
      reward: 80,
      question: "Kdy jsem ti řekl že tě miluju?",
      options: ["Ve Valči doma", "Na Vranově", "U Páji", "Venku na procházce"],
      correct: 1
    },
    {
      id: 10,
      reward: 100,
      question: "Miluješ mě?",
      options: ["Ano", "Ne", "Možná jo", "Spíš ne"],
      correct: 0
    }
  ]
};

// DOM elements
const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const resultScreen = document.getElementById('resultScreen');
const startBtn = document.getElementById('startBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const prizeLadder = document.getElementById('prizeLadder');
const questionNumber = document.getElementById('questionNumber');
const questionText = document.getElementById('questionText');
const answersGrid = document.getElementById('answersGrid');
const currentPrizeEl = document.getElementById('currentPrize');
const resultTitle = document.getElementById('resultTitle');
const resultText = document.getElementById('resultText');
const resultPrize = document.getElementById('resultPrize');

// Game state
let currentQuestion = 0;
let currentPrize = 0;
let safePrize = 0; // Prize at last milestone
let isAnswering = false;

// Initialize prize ladder
function initPrizeLadder() {
  prizeLadder.innerHTML = '';
  gameData.levels.forEach((level, index) => {
    const step = document.createElement('div');
    step.className = 'prize-step';
    if (level.milestone) step.classList.add('milestone');
    step.dataset.index = index;
    step.innerHTML = `
      <span class="step-label">${level.label}</span>
      <span class="step-amount">${level.amount} 💋</span>
    `;
    prizeLadder.appendChild(step);
  });
}

// Update prize ladder highlighting
function updatePrizeLadder() {
  const steps = prizeLadder.querySelectorAll('.prize-step');
  const reversedIndex = gameData.levels.length - 1 - currentQuestion;
  
  steps.forEach((step, index) => {
    step.classList.remove('current', 'passed');
    if (index > reversedIndex) {
      step.classList.add('passed');
    } else if (index === reversedIndex) {
      step.classList.add('current');
    }
  });
}

// Show question
function showQuestion() {
  const q = gameData.questions[currentQuestion];
  
  questionNumber.textContent = `Otázka ${currentQuestion + 1} z ${gameData.questions.length}`;
  questionText.textContent = q.question;
  
  const buttons = answersGrid.querySelectorAll('.answer-btn');
  buttons.forEach((btn, index) => {
    btn.querySelector('.answer-text').textContent = q.options[index];
    btn.classList.remove('selected', 'correct', 'wrong');
    btn.disabled = false;
  });
  
  currentPrizeEl.textContent = `${currentPrize} ${gameData.currency}`;
  updatePrizeLadder();
  isAnswering = false;
}

// Handle answer selection
function selectAnswer(index) {
  if (isAnswering) return;
  isAnswering = true;
  
  const q = gameData.questions[currentQuestion];
  const buttons = answersGrid.querySelectorAll('.answer-btn');
  
  // Disable all buttons
  buttons.forEach(btn => btn.disabled = true);
  
  // Show selected
  buttons[index].classList.add('selected');
  
  // Reveal answer after delay (dramatic effect!)
  setTimeout(() => {
    if (index === q.correct) {
      // Correct!
      buttons[index].classList.remove('selected');
      buttons[index].classList.add('correct');
      
      currentPrize = q.reward;
      
      // Check if milestone
      const level = gameData.levels.find(l => l.amount === q.reward);
      if (level && level.milestone) {
        safePrize = q.reward;
      }
      
      // Next question or win
      setTimeout(() => {
        if (currentQuestion < gameData.questions.length - 1) {
          currentQuestion++;
          showQuestion();
        } else {
          // Won the game!
          showResult(true);
        }
      }, 1200);
      
    } else {
      // Wrong!
      buttons[index].classList.remove('selected');
      buttons[index].classList.add('wrong');
      buttons[q.correct].classList.add('correct');
      
      // Fall back to safe prize
      currentPrize = safePrize;
      
      setTimeout(() => {
        showResult(false);
      }, 2000);
    }
  }, 1500);
}

// Show result screen
function showResult(won) {
  gameScreen.classList.add('hidden');
  resultScreen.classList.remove('hidden');
  
  if (won) {
    resultTitle.textContent = '🎉 Gratuluji! 🎉';
    resultText.textContent = 'Zvládla jsi všechny otázky! Jsi úžasná! 💕';
  } else if (currentPrize > 0) {
    resultTitle.textContent = 'Škoda! 😢';
    resultText.textContent = `Ale nevadí, stejně jsi super! Odcházíš s:`;
  } else {
    resultTitle.textContent = 'Ach ne! 😅';
    resultText.textContent = 'Tentokrát to nevyšlo, ale zkus to znovu!';
  }
  
  resultPrize.querySelector('.prize-number').textContent = currentPrize;
  
  // Animate the number
  animatePrizeNumber(currentPrize);
}

// Animate prize number counting up
function animatePrizeNumber(target) {
  const el = resultPrize.querySelector('.prize-number');
  const duration = 1500;
  const start = 0;
  const startTime = performance.now();
  
  function update(time) {
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease out
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (target - start) * eased);
    
    el.textContent = current;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}

// Start game
function startGame() {
  currentQuestion = 0;
  currentPrize = 0;
  safePrize = 0;
  
  startScreen.classList.add('hidden');
  resultScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  
  initPrizeLadder();
  showQuestion();
}

// Event listeners
startBtn.addEventListener('click', startGame);
playAgainBtn.addEventListener('click', startGame);

answersGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('.answer-btn');
  if (!btn || btn.disabled) return;
  
  const index = parseInt(btn.dataset.index);
  selectAnswer(index);
});

// Keyboard support
document.addEventListener('keydown', (e) => {
  if (gameScreen.classList.contains('hidden')) return;
  if (isAnswering) return;
  
  const keyMap = { '1': 0, '2': 1, '3': 2, '4': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3 };
  const key = e.key.toLowerCase();
  
  if (key in keyMap) {
    selectAnswer(keyMap[key]);
  }
});

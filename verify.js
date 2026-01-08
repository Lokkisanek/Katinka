const FORM = document.getElementById('verify-form');
const HINT = document.getElementById('verify-hint');

const CORRECT_BIRTH = '2009-01-30';
const CORRECT_TOGETHER = '2025-04-29';

FORM.addEventListener('submit', (e) => {
  e.preventDefault();
  const birth = document.getElementById('birth').value;
  const together = document.getElementById('together').value;

  if (birth === CORRECT_BIRTH && together === CORRECT_TOGETHER) {
    HINT.classList.remove('error');
    HINT.classList.add('success');
    setTimeout(() => {
      window.location.href = 'menu.html';
    }, 900);
    return;
  }

  HINT.textContent = 'Tohle není správně.';
  HINT.classList.remove('success');
  HINT.classList.add('error');
});

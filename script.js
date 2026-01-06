const btnYes = document.getElementById('btn-yes');
const btnNo = document.getElementById('btn-no');
const btnBack = document.getElementById('btn-back');

if (btnYes) {
  btnYes.addEventListener('click', () => {
    // go to verification page for ANO
    window.location.href = 'verify.html';
  });
}

if (btnNo) {
  btnNo.addEventListener('click', () => {
    // go to a page for the NO path (to implement later)
    window.location.href = 'not-for-you.html';
  });
}

if (btnBack) {
  btnBack.addEventListener('click', () => {
    // go to a page for the NO path (to implement later)
    window.location.href = 'index.html';
  });
}

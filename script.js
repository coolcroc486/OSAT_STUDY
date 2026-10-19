document.addEventListener('DOMContentLoaded', () => {
  const select = document.getElementById('gameSelect');
  if (select) {
    select.value = 'tetris-game';
  }

  console.log('Classic Games site loaded.');
});

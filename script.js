const gameNames = {
  'tetris-game': 'Tetris',
  'breakout-game': 'Breakout',
  'pong-game': 'Pong',
  'eightball-game': '8 Ball',
};

document.addEventListener('DOMContentLoaded', () => {
  const select = document.getElementById('gameSelect');
  const codeBtn = document.getElementById('secretCodeBtn');
  const codeModal = document.getElementById('codeModal');
  const codeInput = document.getElementById('codeInput');
  const submitCodeBtn = document.getElementById('submitCodeBtn');
  const closeCodeModalBtn = document.getElementById('closeCodeModal');
  const toast = document.getElementById('toast');
  const gamePanels = document.querySelectorAll('.game-view');

  const setGame = (gameId) => {
    for (const panel of gamePanels) {
      panel.hidden = panel.id !== gameId;
    }
    document.title = `${gameNames[gameId] || 'Classic Games'} | Classic Games`;
  };

  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.remove('hidden');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      toast.classList.add('hidden');
    }, 2200);
  };

  const openCodeModal = () => {
    codeModal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    setTimeout(() => codeInput.focus(), 50);
  };

  const closeCodeModal = () => {
    codeModal.classList.add('hidden');
    document.body.classList.remove('modal-open');
    codeInput.value = '';
  };

  if (select) {
    select.value = 'tetris-game';
    setGame(select.value);
    select.addEventListener('change', () => {
      setGame(select.value);
    });
  }

  if (codeBtn) {
    codeBtn.addEventListener('click', openCodeModal);
  }

  if (closeCodeModalBtn) {
    closeCodeModalBtn.addEventListener('click', closeCodeModal);
  }

  if (codeModal) {
    codeModal.addEventListener('click', (event) => {
      if (event.target === codeModal) closeCodeModal();
    });
  }

  if (submitCodeBtn) {
    submitCodeBtn.addEventListener('click', () => {
      const code = (codeInput.value || '').trim().toUpperCase();
      if (!code) {
        showToast('Enter a code');
        return;
      }

      if (code === 'EXTRA') {
        showToast('EXTRA: +1 life for this game');
      } else if (code === 'FRIEND') {
        showToast('FRIEND: close the tab manually');
        try {
          window.close();
        } catch (error) {
          // browser blocked closing; keep toast as notice
        }
      } else {
        showToast('Code not found');
      }

      closeCodeModal();
    });
  }

  if (codeInput) {
    codeInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        submitCodeBtn.click();
      }
    });
  }

  console.log('Classic Games site loaded.');
});

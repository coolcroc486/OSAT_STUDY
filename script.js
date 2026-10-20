document.addEventListener('DOMContentLoaded', () => {
  const select = document.getElementById('gameSelect');
  if (select) {
    select.value = 'tetris-game';
  }

  const codeBtn = document.getElementById('secretCodeBtn');
  const codeModal = document.getElementById('codeModal');
  const codeInput = document.getElementById('codeInput');
  const submitCodeBtn = document.getElementById('submitCodeBtn');
  const closeCodeModal = document.getElementById('closeCodeModal');
  const toast = document.getElementById('toast');

  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.remove('hidden');
    clearTimeout(showToast.timeoutId);
    showToast.timeoutId = setTimeout(() => {
      toast.classList.add('hidden');
    }, 2200);
  };

  const openCodeModal = () => {
    codeModal.classList.remove('hidden');
    codeModal.setAttribute('aria-hidden', 'false');
    setTimeout(() => codeInput.focus(), 50);
  };

  const closeCodeModalFn = () => {
    codeModal.classList.add('hidden');
    codeModal.setAttribute('aria-hidden', 'true');
    codeInput.value = '';
  };

  const currentGameKey = () => select ? select.value : 'tetris-game';

  const gameNames = {
    'tetris-game': 'Tetris',
    'breakout-game': 'Breakout',
    'pong-game': 'Pong',
    'eightball-game': '8 Ball',
    'chess-game': 'Chess',
  };

  const awardExtraLife = () => {
    const gameName = gameNames[currentGameKey()] || 'this game';
    const current = Number(window.gameCheatState?.extraLife || 0);
    window.gameCheatState = window.gameCheatState || {};
    window.gameCheatState.extraLife = current + 1;
    showToast(`EXTRA: +1 life for ${gameName}`);
  };

  const closeTabCode = () => {
    try {
      window.close();
    } catch (error) {
      // Ignore. Browser blocks direct close.
    }

    if (!window.closed) {
      showToast('FRIEND: browser blocked auto-close. Please close the tab manually.');
    } else {
      showToast('FRIEND: tab closing...');
    }
  };

  const handleCodeInput = () => {
    const code = codeInput.value.trim().toUpperCase();
    if (!code) {
      showToast('Enter a code first');
      return;
    }

    const commands = {
      EXTRA: awardExtraLife,
      FRIEND: closeTabCode,
    };

    const action = commands[code];
    if (!action) {
      showToast('That code does not exist');
      return;
    }

    action();
    closeCodeModalFn();
  };

  if (codeBtn) {
    codeBtn.addEventListener('click', openCodeModal);
  }

  if (closeCodeModal) {
    closeCodeModal.addEventListener('click', closeCodeModalFn);
  }

  if (submitCodeBtn) {
    submitCodeBtn.addEventListener('click', handleCodeInput);
  }

  if (codeInput) {
    codeInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        handleCodeInput();
      }
    });
  }

  codeModal.addEventListener('click', (event) => {
    if (event.target === codeModal) {
      closeCodeModalFn();
    }
  });

  window.gameCheatState = window.gameCheatState || {};
  window.gameCheatState.extraLife = Number(window.gameCheatState.extraLife || 0);

  console.log('Classic Games site loaded.');
});

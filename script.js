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

  const gameCanvas = document.getElementById('gameCanvas');
  const nextCanvas = document.getElementById('nextCanvas');
  const scoreEl = document.getElementById('score');
  const levelEl = document.getElementById('level');
  const linesEl = document.getElementById('lines');
  const startBtn = document.getElementById('startBtn');

  const COLS = 10;
  const ROWS = 20;
  const BLOCK = 30;
  const SHAPES = {
    I: [[1, 1, 1, 1]],
    O: [
      [1, 1],
      [1, 1],
    ],
    T: [
      [1, 1, 1],
      [0, 1, 0],
    ],
    S: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    Z: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    J: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    L: [
      [0, 0, 1],
      [1, 1, 1],
    ],
  };

  const COLORS = {
    I: '#67e8f9',
    O: '#facc15',
    T: '#c084fc',
    S: '#34d399',
    Z: '#f87171',
    J: '#60a5fa',
    L: '#fb923c',
  };

  function cloneMatrix(matrix) {
    return matrix.map((row) => row.slice());
  }

  function rotateMatrix(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        rotated[x][rows - 1 - y] = matrix[y][x];
      }
    }
    return rotated;
  }

  function createPiece(type) {
    const matrix = cloneMatrix(SHAPES[type]);
    return {
      type,
      matrix,
      x: Math.floor((COLS - matrix[0].length) / 2),
      y: -1,
      color: COLORS[type],
    };
  }

  function createEmptyBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  if (gameCanvas && nextCanvas) {
    const boardCtx = gameCanvas.getContext('2d');
    const nextCtx = nextCanvas.getContext('2d');
    let board = createEmptyBoard();
    let currentPiece = null;
    let nextPiece = null;
    let dropInterval = 600;
    let lastDrop = 0;
    let score = 0;
    let lines = 0;
    let level = 1;
    let isPlaying = false;
    let animationId = null;

    function updateHud() {
      if (scoreEl) scoreEl.textContent = String(score);
      if (levelEl) levelEl.textContent = String(level);
      if (linesEl) linesEl.textContent = String(lines);
    }

    function spawnPiece() {
      currentPiece = nextPiece || createPiece(Object.keys(SHAPES)[Math.floor(Math.random() * Object.keys(SHAPES).length)]);
      nextPiece = createPiece(Object.keys(SHAPES)[Math.floor(Math.random() * Object.keys(SHAPES).length)]);
      currentPiece.x = Math.floor((COLS - currentPiece.matrix[0].length) / 2);
      currentPiece.y = -1;

      if (collides(currentPiece, 0, 0)) {
        endGame();
      }
    }

    function collides(piece, dx, dy, matrix = piece.matrix) {
      for (let y = 0; y < matrix.length; y += 1) {
        for (let x = 0; x < matrix[y].length; x += 1) {
          if (!matrix[y][x]) continue;
          const nextX = piece.x + x + dx;
          const nextY = piece.y + y + dy;
          if (nextX < 0 || nextX >= COLS || nextY >= ROWS) return true;
          if (nextY >= 0 && board[nextY][nextX]) return true;
        }
      }
      return false;
    }

    function mergePiece() {
      if (!currentPiece) return;
      currentPiece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
          if (!value) return;
          const boardY = currentPiece.y + y;
          const boardX = currentPiece.x + x;
          if (boardY >= 0) {
            board[boardY][boardX] = currentPiece.type;
          }
        });
      });

      clearLines();
      spawnPiece();
    }

    function clearLines() {
      let cleared = 0;
      for (let y = ROWS - 1; y >= 0; y -= 1) {
        if (board[y].every(Boolean)) {
          board.splice(y, 1);
          board.unshift(Array(COLS).fill(null));
          cleared += 1;
          y += 1;
        }
      }

      if (cleared > 0) {
        lines += cleared;
        score += [0, 100, 300, 500, 800][cleared] * level;
        level = Math.floor(lines / 10) + 1;
        dropInterval = Math.max(120, 600 - (level - 1) * 55);
        updateHud();
      }
    }

    function endGame() {
      isPlaying = false;
      if (animationId) cancelAnimationFrame(animationId);
      showToast('Game over');
    }

    function movePiece(dx, dy) {
      if (!currentPiece || !isPlaying) return;
      if (!collides(currentPiece, dx, dy)) {
        currentPiece.x += dx;
        currentPiece.y += dy;
        return true;
      }

      if (dy > 0) {
        mergePiece();
      }
      return false;
    }

    function rotateCurrent() {
      if (!currentPiece || !isPlaying) return;
      const rotated = rotateMatrix(currentPiece.matrix);
      const kicks = [0, -1, 1, -2, 2];
      for (const kick of kicks) {
        if (!collides(currentPiece, kick, 0, rotated)) {
          currentPiece.matrix = rotated;
          currentPiece.x += kick;
          return;
        }
      }
    }

    function drawCell(ctx, x, y, color, size) {
      ctx.fillStyle = color;
      ctx.fillRect(x * size, y * size, size, size);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.strokeRect(x * size + 0.5, y * size + 0.5, size - 1, size - 1);
    }

    function drawBoard() {
      if (!boardCtx) return;
      boardCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
      for (let y = 0; y < ROWS; y += 1) {
        for (let x = 0; x < COLS; x += 1) {
          const cell = board[y][x];
          if (cell) {
            drawCell(boardCtx, x, y, COLORS[cell], BLOCK);
          }
        }
      }

      if (currentPiece) {
        currentPiece.matrix.forEach((row, y) => {
          row.forEach((value, x) => {
            if (!value) return;
            const drawX = currentPiece.x + x;
            const drawY = currentPiece.y + y;
            if (drawY >= 0) {
              drawCell(boardCtx, drawX, drawY, currentPiece.color, BLOCK);
            }
          });
        });
      }
    }

    function drawNext() {
      if (!nextCtx) return;
      nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
      const matrix = nextPiece ? nextPiece.matrix : [[0]];
      const size = 24;
      const offsetX = Math.floor((nextCanvas.width - matrix[0].length * size) / 2);
      const offsetY = Math.floor((nextCanvas.height - matrix.length * size) / 2);
      matrix.forEach((row, y) => {
        row.forEach((value, x) => {
          if (!value) return;
          nextCtx.fillStyle = COLORS[nextPiece.type];
          nextCtx.fillRect(offsetX + x * size, offsetY + y * size, size, size);
          nextCtx.strokeStyle = 'rgba(255,255,255,0.2)';
          nextCtx.strokeRect(offsetX + x * size + 0.5, offsetY + y * size + 0.5, size - 1, size - 1);
        });
      });
    }

    function tick(timestamp) {
      if (!isPlaying) return;
      if (!lastDrop) lastDrop = timestamp;
      if (timestamp - lastDrop > dropInterval) {
        const moved = movePiece(0, 1);
        if (!moved) {
          mergePiece();
        }
        lastDrop = timestamp;
      }
      drawBoard();
      drawNext();
      animationId = requestAnimationFrame(tick);
    }

    function startGame() {
      board = createEmptyBoard();
      score = 0;
      lines = 0;
      level = 1;
      dropInterval = 600;
      nextPiece = createPiece(Object.keys(SHAPES)[Math.floor(Math.random() * Object.keys(SHAPES).length)]);
      spawnPiece();
      isPlaying = true;
      updateHud();
      drawBoard();
      drawNext();
      if (animationId) cancelAnimationFrame(animationId);
      lastDrop = 0;
      animationId = requestAnimationFrame(tick);
    }

    document.addEventListener('keydown', (event) => {
      if (!currentPiece || !isPlaying) return;
      if (event.key === 'ArrowLeft') {
        movePiece(-1, 0);
      } else if (event.key === 'ArrowRight') {
        movePiece(1, 0);
      } else if (event.key === 'ArrowDown') {
        movePiece(0, 1);
        score += 1;
        updateHud();
      } else if (event.key === 'ArrowUp') {
        rotateCurrent();
      } else if (event.key === ' ') {
        event.preventDefault();
        while (movePiece(0, 1)) {
          score += 2;
        }
        updateHud();
      } else if (event.key.toLowerCase() === 'p') {
        isPlaying = !isPlaying;
        if (isPlaying) {
          lastDrop = 0;
          animationId = requestAnimationFrame(tick);
        } else if (animationId) {
          cancelAnimationFrame(animationId);
        }
      }
      drawBoard();
      drawNext();
    });

    if (startBtn) {
      startBtn.addEventListener('click', startGame);
    }

    updateHud();
    drawBoard();
    drawNext();
  }

  console.log('Classic Games site loaded.');
});

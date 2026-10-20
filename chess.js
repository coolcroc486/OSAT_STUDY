document.addEventListener('DOMContentLoaded', () => {
  const boardEl = document.getElementById('chessBoard');
  const chessTurnEl = document.getElementById('chessTurn');
  const chessStatusEl = document.getElementById('chessStatus');
  const moveHistoryEl = document.getElementById('moveHistory');
  const whiteCapturedEl = document.getElementById('whiteCaptured');
  const blackCapturedEl = document.getElementById('blackCaptured');
  const resetBtn = document.getElementById('chessResetBtn');
  const flipBtn = document.getElementById('chessFlipBtn');

  if (!boardEl || !window.Chess) {
    return;
  }

  const game = new Chess();
  let selectedSquare = null;
  let flipped = false;

  const pieceGlyphs = {
    w: {
      p: '♙',
      r: '♖',
      n: '♘',
      b: '♗',
      q: '♕',
      k: '♔',
    },
    b: {
      p: '♟',
      r: '♜',
      n: '♞',
      b: '♝',
      q: '♛',
      k: '♚',
    },
  };

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  function getBoardSquares() {
    const ranks = flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
    const fileOrder = flipped ? [...files].reverse() : [...files];

    return ranks.flatMap((rank) =>
      fileOrder.map((file) => `${file}${rank}`)
    );
  }

  function getCapturedPieces() {
    const whiteCaptured = [];
    const blackCaptured = [];

    game.history({ verbose: true }).forEach((move) => {
      if (move.captured) {
        const glyph = pieceGlyphs[move.color][move.captured];
        if (move.color === 'w') {
          whiteCaptured.push(glyph);
        } else {
          blackCaptured.push(glyph);
        }
      }
    });

    return { whiteCaptured, blackCaptured };
  }

  function updateMoveHistory() {
    const moves = game.history({ verbose: true });
    const rows = [];

    for (let i = 0; i < moves.length; i += 2) {
      const whiteMove = moves[i];
      const blackMove = moves[i + 1];
      const row = `${i / 2 + 1}. ${whiteMove ? whiteMove.san : ''}${blackMove ? ` ${blackMove.san}` : ''}`;
      rows.push(row);
    }

    moveHistoryEl.innerHTML = rows.map((move) => `<li>${move}</li>`).join('');
  }

  function updateCapturedPieces() {
    const { whiteCaptured, blackCaptured } = getCapturedPieces();
    whiteCapturedEl.textContent = whiteCaptured.join(' ');
    blackCapturedEl.textContent = blackCaptured.join(' ');
  }

  function updateStatus() {
    const turn = game.turn() === 'w' ? 'White' : 'Black';
    chessTurnEl.textContent = turn;

    if (game.isCheckmate()) {
      chessStatusEl.textContent = `${turn === 'White' ? 'Black' : 'White'} wins by checkmate`;
      return;
    }

    if (game.isStalemate()) {
      chessStatusEl.textContent = 'Draw by stalemate';
      return;
    }

    if (game.isThreefoldRepetition()) {
      chessStatusEl.textContent = 'Draw by repetition';
      return;
    }

    if (game.isInsufficientMaterial()) {
      chessStatusEl.textContent = 'Draw by insufficient material';
      return;
    }

    if (game.isCheck()) {
      chessStatusEl.textContent = `${turn} is in check`;
      return;
    }

    chessStatusEl.textContent = `${turn} to move`;
  }

  function renderBoard() {
    boardEl.innerHTML = '';

    const squares = getBoardSquares();
    const selectedMoves = selectedSquare ? game.moves({ square: selectedSquare, verbose: true }) : [];
    const legalTargets = new Set(selectedMoves.map((move) => move.to));

    squares.forEach((squareName) => {
      const squareEl = document.createElement('button');
      squareEl.type = 'button';
      squareEl.className = `square ${(squareName[0].charCodeAt(0) + Number(squareName[1])) % 2 === 0 ? 'dark' : 'light'}`;
      squareEl.dataset.square = squareName;

      if (selectedSquare === squareName) {
        squareEl.classList.add('selected');
      }

      if (legalTargets.has(squareName)) {
        squareEl.classList.add('legal');
      }

      const piece = game.get(squareName);
      if (piece) {
        squareEl.textContent = pieceGlyphs[piece.color][piece.type];
      }

      if (game.isCheck() && piece && piece.type === 'k' && piece.color === game.turn()) {
        squareEl.classList.add('check');
      }

      squareEl.addEventListener('click', () => handleSquareClick(squareName));
      boardEl.appendChild(squareEl);
    });

    updateStatus();
    updateMoveHistory();
    updateCapturedPieces();
  }

  function handleSquareClick(squareName) {
    const clickedPiece = game.get(squareName);
    const currentTurn = game.turn();

    if (selectedSquare) {
      const move = game.moves({ square: selectedSquare, verbose: true }).find((candidate) => candidate.to === squareName);

      if (move) {
        game.move({
          from: selectedSquare,
          to: squareName,
          promotion: 'q',
        });
        selectedSquare = null;
        renderBoard();
        return;
      }
    }

    if (clickedPiece && clickedPiece.color === currentTurn) {
      selectedSquare = squareName;
      renderBoard();
      return;
    }

    selectedSquare = null;
    renderBoard();
  }

  resetBtn.addEventListener('click', () => {
    game.reset();
    selectedSquare = null;
    renderBoard();
  });

  flipBtn.addEventListener('click', () => {
    flipped = !flipped;
    renderBoard();
  });

  renderBoard();
});

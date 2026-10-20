document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('pongCanvas');
  const score1El = document.getElementById('pongScore1');
  const score2El = document.getElementById('pongScore2');
  const startBtn = document.getElementById('pongStartBtn');

  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  const keys = { w: false, s: false, up: false, down: false };
  let score1 = 0;
  let score2 = 0;
  let isPlaying = false;
  let animationId = null;

  const paddleWidth = 14;
  const paddleHeight = 100;
  const paddleSpeed = 7;

  const leftPad = { x: 18, y: H / 2 - paddleHeight / 2, width: paddleWidth, height: paddleHeight };
  const rightPad = { x: W - 18 - paddleWidth, y: H / 2 - paddleHeight / 2, width: paddleWidth, height: paddleHeight };

  let ball = {
    x: W / 2,
    y: H / 2,
    radius: 10,
    vx: 5,
    vy: 4,
  };

  function resetBall(servingTo = 1) {
    ball.x = W / 2;
    ball.y = H / 2;
    const speed = 5;
    const direction = servingTo === 1 ? -1 : 1;
    ball.vx = direction * (speed + Math.random() * 0.8);
    ball.vy = (Math.random() * 3.5 - 1.75);
  }

  function updateHud() {
    if (score1El) score1El.textContent = String(score1);
    if (score2El) score2El.textContent = String(score2);
  }

  function showGameState(message) {
    if (window.showToast) {
      window.showToast(message);
    } else {
      console.log(message);
    }
  }

  function resetMatch() {
    score1 = 0;
    score2 = 0;
    isPlaying = false;
    updateHud();
    resetBall(1);
  }

  function paddleMove() {
    if (keys.w) leftPad.y = Math.max(0, leftPad.y - paddleSpeed);
    if (keys.s) leftPad.y = Math.min(H - leftPad.height, leftPad.y + paddleSpeed);
    if (keys.up) rightPad.y = Math.max(0, rightPad.y - paddleSpeed);
    if (keys.down) rightPad.y = Math.min(H - rightPad.height, rightPad.y + paddleSpeed);
  }

  function handleScoring() {
    if (ball.x - ball.radius <= 0) {
      score2 += 1;
      updateHud();
      if (score2 >= 7) {
        isPlaying = false;
        showGameState('Player 2 wins!');
        return;
      }
      resetBall(2);
    } else if (ball.x + ball.radius >= W) {
      score1 += 1;
      updateHud();
      if (score1 >= 7) {
        isPlaying = false;
        showGameState('Player 1 wins!');
        return;
      }
      resetBall(1);
    }
  }

  function updateBall() {
    if (!isPlaying) return;

    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= H) {
      ball.vy *= -1;
    }

    const leftHit =
      ball.x - ball.radius <= leftPad.x + leftPad.width &&
      ball.y >= leftPad.y &&
      ball.y <= leftPad.y + leftPad.height &&
      ball.x >= leftPad.x;

    const rightHit =
      ball.x + ball.radius >= rightPad.x &&
      ball.y >= rightPad.y &&
      ball.y <= rightPad.y + rightPad.height &&
      ball.x <= rightPad.x + rightPad.width;

    if (leftHit && ball.vx < 0) {
      const impact = (ball.y - (leftPad.y + leftPad.height / 2)) / (leftPad.height / 2);
      ball.vx = Math.abs(ball.vx) + 0.25;
      ball.vy = impact * 6;
    }

    if (rightHit && ball.vx > 0) {
      const impact = (ball.y - (rightPad.y + rightPad.height / 2)) / (rightPad.height / 2);
      ball.vx = -Math.abs(ball.vx) - 0.25;
      ball.vy = impact * 6;
    }

    handleScoring();
  }

  function drawBoard() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();

    ctx.fillStyle = '#67e8f9';
    ctx.fillRect(leftPad.x, leftPad.y, leftPad.width, leftPad.height);
    ctx.fillRect(rightPad.x, rightPad.y, rightPad.width, rightPad.height);

    ctx.beginPath();
    ctx.fillStyle = '#f8fafc';
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function tick() {
    paddleMove();
    updateBall();
    drawBoard();
    animationId = requestAnimationFrame(tick);
  }

  document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (key === 'w') keys.w = true;
    if (key === 's') keys.s = true;
    if (key === 'arrowup') keys.up = true;
    if (key === 'arrowdown') keys.down = true;
    if (event.code === 'Space') {
      event.preventDefault();
      if (!isPlaying) {
        isPlaying = true;
        resetBall(score1 >= score2 ? 1 : 2);
      }
    }
  });

  document.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    if (key === 'w') keys.w = false;
    if (key === 's') keys.s = false;
    if (key === 'arrowup') keys.up = false;
    if (key === 'arrowdown') keys.down = false;
  });

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      resetMatch();
      isPlaying = true;
      resetBall(1);
    });
  }

  resetMatch();
  drawBoard();
  if (animationId) cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(tick);
});

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('breakoutCanvas');
  const scoreEl = document.getElementById('breakoutScore');
  const livesEl = document.getElementById('breakoutLives');
  const startBtn = document.getElementById('breakoutStartBtn');

  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  const keys = { left: false, right: false };
  let score = 0;
  let lives = 3;
  let started = false;
  let won = false;
  let animationId = null;

  const paddle = {
    width: 120,
    height: 18,
    x: W / 2 - 60,
    y: H - 40,
    speed: 8,
  };

  let ball = {
    x: W / 2,
    y: H - 60,
    radius: 10,
    vx: 4,
    vy: -4,
    launched: false,
  };

  const bricks = [];
  const rows = 5;
  const cols = 10;
  const brickWidth = 70;
  const brickHeight = 22;
  const brickGap = 8;
  const offsetTop = 50;
  const offsetLeft = 30;

  function buildBricks() {
    bricks.length = 0;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        bricks.push({
          x: offsetLeft + col * (brickWidth + brickGap),
          y: offsetTop + row * (brickHeight + brickGap),
          width: brickWidth,
          height: brickHeight,
          active: true,
          color: ['#67e8f9', '#8b5cf6', '#facc15', '#34d399', '#f87171'][row % 5],
        });
      }
    }
  }

  function resetBall() {
    ball.x = W / 2;
    ball.y = H - 60;
    ball.radius = 10;
    ball.vx = (Math.random() > 0.5 ? 1 : -1) * 4;
    ball.vy = -4;
    ball.launched = false;
  }

  function updateHud() {
    if (scoreEl) scoreEl.textContent = String(score);
    if (livesEl) livesEl.textContent = String(lives);
  }

  function showGameState(message) {
    if (window.showToast) {
      window.showToast(message);
    } else {
      console.log(message);
    }
  }

  function resetGame() {
    score = 0;
    lives = 3;
    started = false;
    won = false;
    buildBricks();
    resetBall();
    paddle.x = W / 2 - paddle.width / 2;
    updateHud();
  }

  function launchBall() {
    if (!started && !won) {
      started = true;
      ball.launched = true;
      ball.vx = (Math.random() > 0.5 ? 1 : -1) * 4.6;
      ball.vy = -5.3;
    }
  }

  function checkPaddleCollision() {
    if (
      ball.y + ball.radius >= paddle.y &&
      ball.y - ball.radius <= paddle.y + paddle.height &&
      ball.x >= paddle.x &&
      ball.x <= paddle.x + paddle.width &&
      ball.vy > 0
    ) {
      const hitPos = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
      ball.vx = hitPos * 7;
      ball.vy = -Math.abs(ball.vy) - 0.4;
    }
  }

  function checkBrickCollisions() {
    for (const brick of bricks) {
      if (!brick.active) continue;
      const collision =
        ball.x + ball.radius > brick.x &&
        ball.x - ball.radius < brick.x + brick.width &&
        ball.y + ball.radius > brick.y &&
        ball.y - ball.radius < brick.y + brick.height;

      if (collision) {
        brick.active = false;
        score += 10;
        updateHud();

        const overlapLeft = ball.x + ball.radius - brick.x;
        const overlapRight = brick.x + brick.width - (ball.x - ball.radius);
        const overlapTop = ball.y + ball.radius - brick.y;
        const overlapBottom = brick.y + brick.height - (ball.y - ball.radius);
        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapLeft || minOverlap === overlapRight) {
          ball.vx *= -1;
        } else {
          ball.vy *= -1;
        }

        if (bricks.every((b) => !b.active)) {
          won = true;
          started = false;
          showGameState('You cleared the wall!');
        }
        return;
      }
    }
  }

  function updateBall() {
    if (!started) {
      ball.x = paddle.x + paddle.width / 2;
      ball.y = H - 50;
      return;
    }

    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= W) {
      ball.vx *= -1;
    }

    if (ball.y - ball.radius <= 0) {
      ball.vy *= -1;
    }

    checkPaddleCollision();
    checkBrickCollisions();

    if (ball.y - ball.radius > H) {
      lives -= 1;
      updateHud();
      if (lives <= 0) {
        started = false;
        won = true;
        showGameState('Game over');
      } else {
        resetBall();
      }
    }
  }

  function updatePaddle() {
    if (keys.left) paddle.x = Math.max(0, paddle.x - paddle.speed);
    if (keys.right) paddle.x = Math.min(W - paddle.width, paddle.x + paddle.speed);
    if (!started) {
      ball.x = paddle.x + paddle.width / 2;
    }
  }

  function drawBricks() {
    for (const brick of bricks) {
      if (!brick.active) continue;
      ctx.fillStyle = brick.color;
      ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.strokeRect(brick.x + 0.5, brick.y + 0.5, brick.width - 1, brick.height - 1);
    }
  }

  function drawPaddle() {
    ctx.fillStyle = '#67e8f9';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
  }

  function drawBall() {
    ctx.beginPath();
    ctx.fillStyle = '#f8fafc';
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBackground() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(0, 0, W, H);
  }

  function draw() {
    drawBackground();
    drawBricks();
    drawPaddle();
    drawBall();
  }

  function tick() {
    updatePaddle();
    updateBall();
    draw();
    animationId = requestAnimationFrame(tick);
  }

  document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (key === 'a' || key === 'arrowleft') keys.left = true;
    if (key === 'd' || key === 'arrowright') keys.right = true;
    if (event.code === 'Space') {
      event.preventDefault();
      launchBall();
    }
  });

  document.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    if (key === 'a' || key === 'arrowleft') keys.left = false;
    if (key === 'd' || key === 'arrowright') keys.right = false;
  });

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      resetGame();
      launchBall();
    });
  }

  resetGame();
  draw();
  if (animationId) cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(tick);
});

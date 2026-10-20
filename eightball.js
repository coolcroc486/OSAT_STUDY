document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('eightballCanvas');
  const turnEl = document.getElementById('eightballTurn');
  const group1El = document.getElementById('eightballGroup1');
  const group2El = document.getElementById('eightballGroup2');
  const messageEl = document.getElementById('eightballMessage');
  const startBtn = document.getElementById('eightballStartBtn');

  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  const pockets = [
    { x: 28, y: 28 },
    { x: W / 2, y: 22 },
    { x: W - 28, y: 28 },
    { x: 28, y: H - 28 },
    { x: W / 2, y: H - 24 },
    { x: W - 28, y: H - 28 },
  ];

  const colors = ['#f87171', '#60a5fa', '#facc15', '#34d399', '#f472b6', '#c084fc', '#fb923c', '#111827'];

  let currentPlayer = 1;
  let group1 = 'Open';
  let group2 = 'Open';
  let isDragging = false;
  let queuedShot = false;
  let aimPoint = { x: W / 2, y: H / 2 };
  let animationId = null;

  function createBall(number, x, y, color, type = 'solid') {
    return {
      number,
      x,
      y,
      radius: 12,
      vx: 0,
      vy: 0,
      color,
      type,
      sunk: false,
      label: number > 0 ? String(number) : '',
    };
  }

  function buildRack() {
    const balls = [];
    const rackStartX = 680;
    const rackStartY = H / 2;
    const triangleRows = 5;
    const colorsList = [
      1, 2, 3, 4, 5, 6, 7,
      9, 10, 11, 12, 13, 14, 15,
    ];

    for (let row = 0; row < triangleRows; row += 1) {
      for (let col = 0; col <= row; col += 1) {
        const idx = row * (row + 1) / 2 + col;
        const total = 15;
        if (idx >= total) break;
        const ballIndex = colorsList[idx];
        const x = rackStartX + row * 13 + col * 13;
        const y = rackStartY + (row - col) * 13 * 0.5;
        const ballColor = ballIndex === 8 ? '#111827' : colors[(ballIndex - 1) % colors.length];
        const type = ballIndex === 8 ? 'eight' : ((ballIndex % 2 === 1 && ballIndex <= 7) ? 'solid' : 'stripe');
        balls.push(createBall(ballIndex, x, y, ballColor, type));
      }
    }

    const cueBall = createBall(0, 180, H / 2, '#f8fafc', 'cue');
    return [cueBall, ...balls];
  }

  let balls = [];

  function updateHud() {
    if (turnEl) turnEl.textContent = `Player ${currentPlayer}`;
    if (group1El) group1El.textContent = group1;
    if (group2El) group2El.textContent = group2;
  }

  function setMessage(text) {
    if (messageEl) messageEl.textContent = text;
  }

  function resetGame() {
    currentPlayer = 1;
    group1 = 'Open';
    group2 = 'Open';
    queuedShot = false;
    isDragging = false;
    aimPoint = { x: 180, y: H / 2 };
    balls = buildRack();
    updateHud();
    setMessage('Aim with your mouse. Hold and release to shoot.');
  }

  function resolveBallCollision(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const distance = Math.hypot(dx, dy) || 0.0001;
    const minDistance = a.radius + b.radius;

    if (distance < minDistance) {
      const nx = dx / distance;
      const ny = dy / distance;
      const overlap = minDistance - distance;
      a.x -= nx * overlap * 0.5;
      a.y -= ny * overlap * 0.5;
      b.x += nx * overlap * 0.5;
      b.y += ny * overlap * 0.5;

      const rvx = b.vx - a.vx;
      const rvy = b.vy - a.vy;
      const velAlongNormal = rvx * nx + rvy * ny;

      if (velAlongNormal < 0) {
        const impulse = (-(1.1) * velAlongNormal) / 2;
        a.vx -= impulse * nx;
        a.vy -= impulse * ny;
        b.vx += impulse * nx;
        b.vy += impulse * ny;
      }
    }
  }

  function handleWallCollisions(ball) {
    if (ball.x - ball.radius <= 0) {
      ball.x = ball.radius;
      ball.vx *= -0.96;
    }
    if (ball.x + ball.radius >= W) {
      ball.x = W - ball.radius;
      ball.vx *= -0.96;
    }
    if (ball.y - ball.radius <= 0) {
      ball.y = ball.radius;
      ball.vy *= -0.96;
    }
    if (ball.y + ball.radius >= H) {
      ball.y = H - ball.radius;
      ball.vy *= -0.96;
    }
  }

  function handlePocketing() {
    const cue = balls[0];

    for (let i = balls.length - 1; i >= 0; i -= 1) {
      const ball = balls[i];
      const pocketed = pockets.some((pocket) => Math.hypot(ball.x - pocket.x, ball.y - pocket.y) < 22);

      if (!pocketed || ball.sunk) continue;

      ball.sunk = true;
      ball.vx = 0;
      ball.vy = 0;

      if (ball.number === 0) {
        cue.x = 180;
        cue.y = H / 2;
        cue.vx = 0;
        cue.vy = 0;
        cue.sunk = false;
        setMessage('Scratch! The cue ball is back on the table.');
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        updateHud();
        continue;
      }

      if (ball.number === 8) {
        if (group1 === 'Open' && group2 === 'Open') {
          setMessage('Eight-ball sunk. Game over.');
          queuedShot = false;
          return;
        }
        setMessage(`Player ${currentPlayer} wins the rack!`);
        queuedShot = false;
        return;
      }

      if (group1 === 'Open' && group2 === 'Open') {
        const assigned = ball.type === 'solid' ? 'Solid' : 'Stripe';
        if (currentPlayer === 1) {
          group1 = assigned;
          group2 = assigned === 'Solid' ? 'Stripe' : 'Solid';
        } else {
          group2 = assigned;
          group1 = assigned === 'Solid' ? 'Stripe' : 'Solid';
        }
        setMessage(`Player ${currentPlayer} claims ${assigned}.`);
      }

      if (ball.type === 'solid' && currentPlayer === 1) {
        group1 = group1 === 'Open' ? 'Solid' : group1;
      }
      if (ball.type === 'stripe' && currentPlayer === 2) {
        group2 = group2 === 'Open' ? 'Stripe' : group2;
      }
    }

    queuedShot = false;
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    updateHud();
  }

  function shootBall() {
    const cue = balls[0];
    if (!cue) return;

    const dx = cue.x - aimPoint.x;
    const dy = cue.y - aimPoint.y;
    const distance = Math.hypot(dx, dy) || 1;

    cue.vx = (dx / distance) * 10;
    cue.vy = (dy / distance) * 10;
    queuedShot = true;
    setMessage(`Player ${currentPlayer} shoots.`);
  }

  function updatePhysics() {
    for (let i = 0; i < balls.length; i += 1) {
      const ball = balls[i];
      if (ball.sunk) continue;
      ball.x += ball.vx;
      ball.y += ball.vy;
      ball.vx *= 0.992;
      ball.vy *= 0.992;

      if (Math.abs(ball.vx) < 0.02) ball.vx = 0;
      if (Math.abs(ball.vy) < 0.02) ball.vy = 0;

      handleWallCollisions(ball);
    }

    for (let i = 0; i < balls.length; i += 1) {
      for (let j = i + 1; j < balls.length; j += 1) {
        const a = balls[i];
        const b = balls[j];
        if (a.sunk || b.sunk) continue;
        resolveBallCollision(a, b);
      }
    }

    const moving = balls.some((ball) => !ball.sunk && (Math.abs(ball.vx) > 0.01 || Math.abs(ball.vy) > 0.01));
    if (!moving && queuedShot) {
      queuedShot = false;
      currentPlayer = currentPlayer === 1 ? 2 : 1;
      updateHud();
      setMessage(`Player ${currentPlayer}'s turn.`);
    }

    handlePocketing();
  }

  function drawTable() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0b5d2d';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#0c4728';
    ctx.fillRect(20, 20, W - 40, H - 40);

    ctx.fillStyle = '#0a3b20';
    for (const pocket of pockets) {
      ctx.beginPath();
      ctx.arc(pocket.x, pocket.y, 16, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.strokeRect(20, 20, W - 40, H - 40);

    if (isDragging) {
      ctx.beginPath();
      ctx.moveTo(balls[0].x, balls[0].y);
      ctx.lineTo(aimPoint.x, aimPoint.y);
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    for (const ball of balls) {
      if (ball.sunk) continue;
      ctx.beginPath();
      ctx.fillStyle = ball.color;
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.stroke();

      if (ball.number > 0) {
        ctx.fillStyle = '#f8fafc';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(ball.number), ball.x, ball.y + 1);
      }
    }
  }

  function tick() {
    updatePhysics();
    drawTable();
    animationId = requestAnimationFrame(tick);
  }

  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * W;
    const y = ((event.clientY - rect.top) / rect.height) * H;
    const cue = balls[0];
    const dist = Math.hypot(cue.x - x, cue.y - y);
    if (dist < 150 && !queuedShot) {
      isDragging = true;
      aimPoint = { x, y };
    }
  });

  canvas.addEventListener('mousemove', (event) => {
    if (!isDragging) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * W;
    const y = ((event.clientY - rect.top) / rect.height) * H;
    aimPoint = { x, y };
  });

  canvas.addEventListener('mouseup', () => {
    if (isDragging && !queuedShot) {
      shootBall();
    }
    isDragging = false;
  });

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      resetGame();
      updateHud();
    });
  }

  resetGame();
  drawTable();
  if (animationId) cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(tick);
});

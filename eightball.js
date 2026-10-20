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
    { x: 20, y: 20 },
    { x: W / 2, y: 20 },
    { x: W - 20, y: 20 },
    { x: 20, y: H - 20 },
    { x: W / 2, y: H - 20 },
    { x: W - 20, y: H - 20 },
  ];

  let currentPlayer = 1;
  let group1 = 'Open';
  let group2 = 'Open';
  let isDragging = false;
  let hasShot = false;
  let aimPoint = { x: 160, y: H / 2 };
  let balls = [];

  const ballColors = [
    '#f8fafc', '#f87171', '#60a5fa', '#facc15', '#34d399', '#f472b6', '#c084fc', '#111827', '#fb923c', '#93c5fd', '#a3e635', '#fca5a5', '#a78bfa', '#f9a8d4', '#fbbf24', '#a7f3d0',
  ];

  const createBall = (number, x, y, type = 'solid') => ({
    number,
    x,
    y,
    radius: 11,
    vx: 0,
    vy: 0,
    color: ballColors[number] || '#f8fafc',
    type,
    sunk: false,
  });

  const updateHud = () => {
    if (turnEl) turnEl.textContent = `Player ${currentPlayer}`;
    if (group1El) group1El.textContent = group1;
    if (group2El) group2El.textContent = group2;
  };

  const setMessage = (text) => {
    if (messageEl) messageEl.textContent = text;
  };

  const buildRack = () => {
    const rack = [];
    const startX = 660;
    const startY = H / 2 - 20;
    const rows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    let idx = 0;
    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col <= row; col += 1) {
        const ballNumber = rows[idx];
        if (!ballNumber) break;
        const x = startX + row * 12 + col * 12;
        const y = startY + (row - col) * 12 * 0.5;
        const type = ballNumber === 8 ? 'eight' : (ballNumber <= 7 ? 'solid' : 'stripe');
        rack.push(createBall(ballNumber, x, y, type));
        idx += 1;
      }
    }
    rack.push(createBall(0, 170, H / 2, 'cue'));
    return rack;
  };

  const resetGame = () => {
    currentPlayer = 1;
    group1 = 'Open';
    group2 = 'Open';
    hasShot = false;
    isDragging = false;
    aimPoint = { x: 170, y: H / 2 };
    balls = buildRack();
    updateHud();
    setMessage('Aim with your mouse. Hold and release to shoot.');
  };

  const resolveBallCollision = (a, b) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy) || 0.0001;
    const minDist = a.radius + b.radius;
    if (dist >= minDist) return;

    const nx = dx / dist;
    const ny = dy / dist;
    const overlap = minDist - dist;
    a.x -= nx * overlap * 0.5;
    a.y -= ny * overlap * 0.5;
    b.x += nx * overlap * 0.5;
    b.y += ny * overlap * 0.5;

    const rvx = b.vx - a.vx;
    const rvy = b.vy - a.vy;
    const velAlongNormal = rvx * nx + rvy * ny;
    if (velAlongNormal < 0) {
      const impulse = -velAlongNormal * 0.9;
      a.vx -= impulse * nx;
      a.vy -= impulse * ny;
      b.vx += impulse * nx;
      b.vy += impulse * ny;
    }
  };

  const handleWallCollision = (ball) => {
    if (ball.x - ball.radius <= 0) {
      ball.x = ball.radius;
      ball.vx *= -0.95;
    }
    if (ball.x + ball.radius >= W) {
      ball.x = W - ball.radius;
      ball.vx *= -0.95;
    }
    if (ball.y - ball.radius <= 0) {
      ball.y = ball.radius;
      ball.vy *= -0.95;
    }
    if (ball.y + ball.radius >= H) {
      ball.y = H - ball.radius;
      ball.vy *= -0.95;
    }
  };

  const knockCueBack = () => {
    const cue = balls.find((ball) => ball.number === 0);
    if (!cue) return;
    cue.x = 170;
    cue.y = H / 2;
    cue.vx = 0;
    cue.vy = 0;
    cue.sunk = false;
  };

  const handlePocketing = () => {
    const cue = balls.find((ball) => ball.number === 0);
    for (let i = balls.length - 1; i >= 0; i -= 1) {
      const ball = balls[i];
      if (ball.sunk) continue;
      const inPocket = pockets.some((pocket) => Math.hypot(ball.x - pocket.x, ball.y - pocket.y) < 18);
      if (!inPocket) continue;

      ball.sunk = true;
      ball.vx = 0;
      ball.vy = 0;

      if (ball.number === 0) {
        knockCueBack();
        setMessage('Scratch! Cue ball back in play.');
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        updateHud();
        return;
      }

      if (ball.number === 8) {
        setMessage(`Player ${currentPlayer} pocketed the 8-ball.`);
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
    }
  };

  const shootBall = () => {
    const cue = balls.find((ball) => ball.number === 0);
    if (!cue || hasShot) return;
    const dx = cue.x - aimPoint.x;
    const dy = cue.y - aimPoint.y;
    const dist = Math.hypot(dx, dy) || 1;
    cue.vx = (dx / dist) * 11;
    cue.vy = (dy / dist) * 11;
    hasShot = true;
    setMessage(`Player ${currentPlayer} shoots.`);
  };

  const updatePhysics = () => {
    for (const ball of balls) {
      if (ball.sunk) continue;
      ball.x += ball.vx;
      ball.y += ball.vy;
      ball.vx *= 0.992;
      ball.vy *= 0.992;
      if (Math.abs(ball.vx) < 0.05) ball.vx = 0;
      if (Math.abs(ball.vy) < 0.05) ball.vy = 0;
      handleWallCollision(ball);
    }

    for (let i = 0; i < balls.length; i += 1) {
      for (let j = i + 1; j < balls.length; j += 1) {
        const a = balls[i];
        const b = balls[j];
        if (a.sunk || b.sunk) continue;
        resolveBallCollision(a, b);
      }
    }

    handlePocketing();

    const anyMoving = balls.some((ball) => !ball.sunk && (Math.abs(ball.vx) > 0.02 || Math.abs(ball.vy) > 0.02));
    if (hasShot && !anyMoving) {
      hasShot = false;
      currentPlayer = currentPlayer === 1 ? 2 : 1;
      updateHud();
      setMessage(`Player ${currentPlayer}'s turn.`);
    }
  };

  const drawTable = () => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0b5d2d';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#0a4927';
    ctx.fillRect(20, 20, W - 40, H - 40);

    for (const pocket of pockets) {
      ctx.beginPath();
      ctx.fillStyle = '#050b10';
      ctx.arc(pocket.x, pocket.y, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.strokeRect(20, 20, W - 40, H - 40);

    if (isDragging) {
      const cue = balls.find((ball) => ball.number === 0);
      if (cue) {
        ctx.beginPath();
        ctx.moveTo(cue.x, cue.y);
        ctx.lineTo(aimPoint.x, aimPoint.y);
        ctx.strokeStyle = '#fef3c7';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
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
  };

  const tick = () => {
    updatePhysics();
    drawTable();
    requestAnimationFrame(tick);
  };

  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * W;
    const y = ((event.clientY - rect.top) / rect.height) * H;
    const cue = balls.find((ball) => ball.number === 0);
    if (!cue || hasShot) return;
    const distance = Math.hypot(cue.x - x, cue.y - y);
    if (distance < 160) {
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
    if (isDragging) {
      shootBall();
      isDragging = false;
    }
  });

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      resetGame();
    });
  }

  resetGame();
  drawTable();
  requestAnimationFrame(tick);
});

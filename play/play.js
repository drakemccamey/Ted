(() => {
  const canvas = document.getElementById('game-canvas');
  const area = document.getElementById('game-area');
  if (!canvas || !area) return;

  const context = canvas.getContext('2d');
  if (!context) return;

  const scoreElement = document.getElementById('current-score');
  const bestElement = document.getElementById('best-score');
  const message = document.getElementById('game-message');
  const messageTitle = document.getElementById('message-title');
  const messageCopy = document.getElementById('message-copy');
  const startButton = document.getElementById('start-button');
  const pauseButton = document.getElementById('pause-button');
  const gameStatus = document.getElementById('game-status');

  const WIDTH = 420;
  const HEIGHT = 560;
  const FLOOR_HEIGHT = 34;
  const PLAYER_X = 112;
  const PLAYER_HITBOX_X = 29;
  const PLAYER_HITBOX_Y = 22;
  const STORAGE_KEY = 'teds-flappy-best';
  const MAX_GAP = 204;
  const MIN_GAP = 146;
  const BASE_SPEED = 145;
  const MAX_SPEED = 217;
  const OBSTACLE_WIDTH = 78;
  const OBSTACLE_SPACING = 276;

  const readBest = () => {
    try {
      const value = Number(window.localStorage.getItem(STORAGE_KEY));
      return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
    } catch {
      return 0;
    }
  };

  let bestScore = readBest();
  let score = 0;
  let state = 'ready';
  let playerY = HEIGHT * 0.48;
  let velocityY = 0;
  let gameTime = 0;
  let hopBounce = 0;
  let obstacles = [];
  let previousTime = 0;
  let runStartBest = bestScore;

  bestElement.textContent = String(bestScore);

  const makeObstacle = (x, index) => {
    const difficulty = Math.min(index, 18);
    const gapHeight = Math.max(MIN_GAP, MAX_GAP - difficulty * 3);
    const edge = 72;
    const minCenter = edge + gapHeight / 2;
    const maxCenter = HEIGHT - FLOOR_HEIGHT - edge - gapHeight / 2;
    const center = minCenter + Math.random() * Math.max(1, maxCenter - minCenter);
    return { x, gapTop: center - gapHeight / 2, gapBottom: center + gapHeight / 2, passed: false };
  };

  const resetGame = () => {
    score = 0;
    runStartBest = bestScore;
    playerY = HEIGHT * 0.48;
    velocityY = 0;
    gameTime = 0;
    hopBounce = 0;
    obstacles = [makeObstacle(WIDTH + 90, 0), makeObstacle(WIDTH + 90 + OBSTACLE_SPACING, 1)];
    scoreElement.textContent = '0';
  };

  const focusCanvas = () => canvas.focus({ preventScroll: true });

  const setMessage = (title, copy, buttonText) => {
    messageTitle.textContent = title;
    messageCopy.textContent = copy;
    startButton.textContent = buttonText;
    message.hidden = false;
  };

  const beginGame = () => {
    resetGame();
    state = 'playing';
    message.hidden = true;
    pauseButton.disabled = false;
    pauseButton.textContent = 'Pause';
    gameStatus.textContent = 'Game started. Tap or press Space or Arrow Up to hop.';
    flap();
    focusCanvas();
  };

  const flap = () => {
    velocityY = -445;
    hopBounce = 1;
  };

  const togglePause = () => {
    if (state === 'playing') {
      state = 'paused';
      setMessage('Paused', 'Take a breather. Ted will wait right here.', 'Resume');
      pauseButton.textContent = 'Resume';
      gameStatus.textContent = 'Game paused.';
      return;
    }
    if (state === 'paused') {
      state = 'playing';
      message.hidden = true;
      pauseButton.textContent = 'Pause';
      previousTime = 0;
      gameStatus.textContent = 'Game resumed.';
      focusCanvas();
    }
  };

  const endGame = () => {
    state = 'over';
    pauseButton.disabled = true;
    scoreElement.textContent = String(score);
    const isNewBest = score > runStartBest;
    setMessage('Nice flying, Ted!', isNewBest
      ? `You scored ${score} ${score === 1 ? 'point' : 'points'} and set a new best!`
      : `You scored ${score} ${score === 1 ? 'point' : 'points'}. Ready for another flight?`, 'Play Again');
    gameStatus.textContent = `Game over. Score ${score}. Best score ${bestScore}.`;
  };

  const roundedRect = (ctx, x, y, width, height, radius) => {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  const drawBackground = () => {
    const sky = context.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, '#87D6F6');
    sky.addColorStop(1, '#E7FAFF');
    context.fillStyle = sky;
    context.fillRect(0, 0, WIDTH, HEIGHT);

    context.fillStyle = 'rgba(255,255,255,0.72)';
    context.beginPath();
    context.ellipse(75, 93, 39, 13, 0, 0, Math.PI * 2);
    context.ellipse(104, 91, 27, 18, 0, 0, Math.PI * 2);
    context.ellipse(128, 96, 31, 12, 0, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.ellipse(304, 165, 32, 10, 0, 0, Math.PI * 2);
    context.ellipse(327, 160, 23, 15, 0, 0, Math.PI * 2);
    context.ellipse(350, 166, 31, 10, 0, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#b8e9bf';
    context.beginPath();
    context.moveTo(0, HEIGHT - FLOOR_HEIGHT - 38);
    context.quadraticCurveTo(108, 405, 216, 479);
    context.quadraticCurveTo(307, 420, WIDTH, 448);
    context.lineTo(WIDTH, HEIGHT - FLOOR_HEIGHT);
    context.lineTo(0, HEIGHT - FLOOR_HEIGHT);
    context.closePath();
    context.fill();

    context.fillStyle = '#E50617';
    context.fillRect(0, HEIGHT - FLOOR_HEIGHT, WIDTH, FLOOR_HEIGHT);
    context.fillStyle = '#FBD50B';
    context.fillRect(0, HEIGHT - FLOOR_HEIGHT, WIDTH, 7);
    context.fillStyle = 'rgba(255,255,255,0.28)';
    for (let x = 14; x < WIDTH; x += 34) {
      context.fillRect(x, HEIGHT - 16, 18, 4);
    }
  };

  const drawFryCarton = (x, y, width, height, friesAtBottom) => {
    if (height <= 0) return;
    context.save();
    context.shadowColor = 'rgba(22,59,77,0.2)';
    context.shadowBlur = 8;
    context.shadowOffsetX = 3;
    context.shadowOffsetY = 4;
    context.fillStyle = '#E50617';
    roundedRect(context, x, y, width, height, 8);
    context.fill();
    context.restore();

    context.strokeStyle = '#9B0D0F';
    context.lineWidth = 4;
    roundedRect(context, x + 1, y + 1, width - 2, height - 2, 8);
    context.stroke();

    context.fillStyle = '#FBD50B';
    context.fillRect(x + 7, y + 11, 6, Math.max(0, height - 22));
    context.fillRect(x + width - 13, y + 11, 6, Math.max(0, height - 22));
    context.fillStyle = 'rgba(255,255,255,0.92)';
    context.fillRect(x + 18, y + 17, width - 36, Math.max(0, height - 34));

    if (height > 68) {
      context.fillStyle = '#287294';
      context.font = 'bold 13px Arial, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText("TED'S", x + width / 2, y + height / 2);
    }

    const fryHeight = Math.min(22, Math.max(0, height));
    const fryY = friesAtBottom ? y + height - fryHeight : y;
    const fryColors = ['#FBD50B', '#F4A900', '#FFE36A'];
    for (let i = 0; i < 5; i += 1) {
      const fryWidth = 7;
      const fryX = x + 17 + i * 10;
      context.fillStyle = fryColors[i % fryColors.length];
      roundedRect(context, fryX, fryY, fryWidth, fryHeight, 2);
      context.fill();
    }
  };

  const drawObstacle = (obstacle) => {
    const topHeight = obstacle.gapTop;
    drawFryCarton(obstacle.x, 0, OBSTACLE_WIDTH, topHeight, true);
    const bottomY = obstacle.gapBottom;
    drawFryCarton(obstacle.x, bottomY, OBSTACLE_WIDTH, HEIGHT - FLOOR_HEIGHT - bottomY, false);
  };

  const drawTedLeg = (x, swing, shade) => {
    context.save();
    context.translate(x, 7);
    context.rotate(swing);
    context.fillStyle = shade;
    roundedRect(context, -3, -1, 6, 13, 3);
    context.fill();
    context.fillStyle = '#E9BC78';
    context.beginPath();
    context.ellipse(0, 12, 4.4, 3.1, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();
  };

  const drawTed = () => {
    const bounce = Math.sin(gameTime * 9) * 1.1 + hopBounce * 1.2;
    const pitch = Math.max(-0.18, Math.min(0.2, velocityY / 2200));
    const legSwing = Math.sin(gameTime * 12) * 0.14 + hopBounce * 0.12;
    context.save();
    context.translate(PLAYER_X, playerY + bounce);
    context.rotate(pitch);

    context.fillStyle = 'rgba(22,59,77,0.16)';
    context.beginPath();
    context.ellipse(0, 21, 22, 4, 0, 0, Math.PI * 2);
    context.fill();

    drawTedLeg(-14, legSwing, '#B97A3C');
    drawTedLeg(1, -legSwing, '#C98742');
    drawTedLeg(-8, -legSwing, '#D49A53');
    drawTedLeg(14, legSwing, '#D49A53');

    context.strokeStyle = '#A96631';
    context.lineWidth = 3;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(-19, -2);
    context.quadraticCurveTo(-28, -10 + Math.sin(gameTime * 7) * 2, -29, -14);
    context.stroke();
    context.fillStyle = '#D99B52';
    context.beginPath();
    context.arc(-29, -14, 3.5, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#C98742';
    context.beginPath();
    context.ellipse(-4, 1, 20, 12.5, -0.08, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#E1AD62';
    context.beginPath();
    context.ellipse(-1, -4, 14, 7, -0.1, 0, Math.PI * 2);
    context.fill();

    for (const tuft of [
      [-20, -1, 4, 5], [-17, 7, 4, 4], [-12, -9, 4, 4], [-7, 9, 5, 4],
      [-2, -10, 5, 4], [4, 8, 5, 4], [9, -7, 4, 5], [13, 3, 4, 4]
    ]) {
      context.fillStyle = tuft[1] < 0 ? '#E8B86D' : '#D89B50';
      context.beginPath();
      context.ellipse(tuft[0], tuft[1], tuft[2], tuft[3], 0, 0, Math.PI * 2);
      context.fill();
    }

    context.fillStyle = '#D49A53';
    context.beginPath();
    context.ellipse(14, -8, 12, 11, -0.1, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#B8753D';
    context.beginPath();
    context.ellipse(8, -8, 5, 10, -0.5, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#DCA761';
    context.beginPath();
    context.ellipse(25, -3, 9, 6, 0.08, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#F0CA89';
    context.beginPath();
    context.ellipse(21, -1, 7, 5.2, 0, 0, Math.PI * 2);
    context.ellipse(25, -6, 6, 4, 0, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#263B43';
    context.beginPath();
    context.arc(32, -4, 3.2, 0, Math.PI * 2);
    context.arc(17, -12, 1.8, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#9A622E';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(22, 1);
    context.quadraticCurveTo(25, 3, 28, 1);
    context.stroke();

    for (const whisker of [[18, -2], [21, 3], [26, 0]]) {
      context.fillStyle = '#E9BC78';
      context.beginPath();
      context.arc(whisker[0], whisker[1], 2.1, 0, Math.PI * 2);
      context.fill();
    }

    context.strokeStyle = '#287294';
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(-2, 9);
    context.quadraticCurveTo(5, 12, 12, 8);
    context.stroke();
    context.fillStyle = '#FBD50B';
    context.beginPath();
    context.arc(6, 12, 2.2, 0, Math.PI * 2);
    context.fill();
    context.restore();
  };

  const draw = () => {
    context.clearRect(0, 0, WIDTH, HEIGHT);
    drawBackground();
    obstacles.forEach(drawObstacle);
    drawTed();
  };

  const getSpeed = () => Math.min(MAX_SPEED, BASE_SPEED + score * 4);

  const update = (deltaSeconds) => {
    const floorY = HEIGHT - FLOOR_HEIGHT;
    gameTime += deltaSeconds;
    hopBounce = Math.max(0, hopBounce - deltaSeconds * 5);
    velocityY += 1320 * deltaSeconds;
    playerY += velocityY * deltaSeconds;

    const speed = getSpeed();
    obstacles.forEach((obstacle) => {
      obstacle.x -= speed * deltaSeconds;
      if (!obstacle.passed && obstacle.x + OBSTACLE_WIDTH < PLAYER_X - PLAYER_HITBOX_X) {
        obstacle.passed = true;
        score += 1;
        scoreElement.textContent = String(score);
        gameStatus.textContent = `Score ${score}.`;
        if (score > bestScore) {
          bestScore = score;
          bestElement.textContent = String(bestScore);
          try {
            window.localStorage.setItem(STORAGE_KEY, String(bestScore));
          } catch {
            // Keep the session's best score even when persistent storage is unavailable.
          }
        }
      }
    });

    obstacles = obstacles.filter((obstacle) => obstacle.x + OBSTACLE_WIDTH > -12);
    const lastObstacle = obstacles[obstacles.length - 1];
    if (lastObstacle && lastObstacle.x < WIDTH - OBSTACLE_SPACING) {
      obstacles.push(makeObstacle(lastObstacle.x + OBSTACLE_SPACING, score));
    }

    if (playerY - PLAYER_HITBOX_Y <= 0 || playerY + PLAYER_HITBOX_Y >= floorY) {
      endGame();
      return;
    }

    for (const obstacle of obstacles) {
      const distanceX = Math.max(obstacle.x - PLAYER_X, 0, PLAYER_X - (obstacle.x + OBSTACLE_WIDTH));
      const distanceToTopCarton = Math.max(playerY - obstacle.gapTop, 0);
      const distanceToBottomCarton = Math.max(obstacle.gapBottom - playerY, 0);
      const overlapsTopCarton = (distanceX / PLAYER_HITBOX_X) ** 2 + (distanceToTopCarton / PLAYER_HITBOX_Y) ** 2 < 1;
      const overlapsBottomCarton = (distanceX / PLAYER_HITBOX_X) ** 2 + (distanceToBottomCarton / PLAYER_HITBOX_Y) ** 2 < 1;
      if (overlapsTopCarton || overlapsBottomCarton) {
        endGame();
        return;
      }
    }
  };

  const frame = (time) => {
    const deltaSeconds = previousTime ? Math.min((time - previousTime) / 1000, 0.034) : 0;
    previousTime = time;
    if (state === 'playing') update(deltaSeconds);
    draw();
    window.requestAnimationFrame(frame);
  };

  const resizeCanvas = () => {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(bounds.width * pixelRatio);
    canvas.height = Math.round(bounds.height * pixelRatio);
    context.setTransform(canvas.width / WIDTH, 0, 0, canvas.height / HEIGHT, 0, 0);
    draw();
  };

  startButton.addEventListener('click', () => {
    if (state === 'paused') {
      togglePause();
    } else {
      beginGame();
    }
  });

  pauseButton.addEventListener('click', togglePause);

  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    focusCanvas();
    if (state === 'ready' || state === 'over') {
      beginGame();
    } else if (state === 'playing') {
      flap();
    }
  });

  canvas.addEventListener('keydown', (event) => {
    if (event.code !== 'Space' && event.code !== 'ArrowUp') return;
    event.preventDefault();
    if (event.repeat) return;
    if (state === 'ready' || state === 'over') {
      beginGame();
    } else if (state === 'playing') {
      flap();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'playing') {
      togglePause();
      gameStatus.textContent = 'Game paused because this tab is hidden.';
    }
  });

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  resetGame();
  window.requestAnimationFrame(frame);
})();

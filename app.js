const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const statusText = document.getElementById("status-text");
const coinCount = document.getElementById("coin-count");
const lifeCount = document.getElementById("life-count");
const timerText = document.getElementById("timer");
const restartButton = document.getElementById("restart");
const promptGrid = document.getElementById("prompt-grid");

const KEY_COLOR = { r: 255, g: 0, b: 255 };

const SPRITE_PROMPTS = [
  {
    name: "Hero",
    file: "assets/player.svg",
    prompt:
      "Pixel-art platformer hero resembling Donald Trump, expressive face, blond hair, blue suit, red tie, centered on solid #FF00FF background, 64x64, crisp edges, no transparency, single frame.",
  },
  {
    name: "Hamburger Bot",
    file: "assets/bot.svg",
    prompt:
      "Pixel-art hamburger enemy, layered bun, patty, lettuce, and cheese with tiny eyes, centered on solid #FF00FF background, 64x64, no transparency, single frame.",
  },
  {
    name: "Egg",
    file: "assets/coin.svg",
    prompt:
      "Pixel-art egg collectible, clean oval with light shading, centered on solid #FF00FF background, 48x48, no transparency.",
  },
  {
    name: "Finish Flag",
    file: "assets/goal.svg",
    prompt:
      "Triangular flag on pole with pink banner and yellow base, centered on solid #FF00FF background, 64x96, no transparency.",
  },
];

const input = {
  left: false,
  right: false,
  jumpQueued: false,
  sprint: false,
};

const world = {
  width: 2600,
  height: 540,
  gravity: 2400,
};

const platforms = [
  { x: 0, y: 470, width: 2600, height: 70 },
  { x: 220, y: 380, width: 220, height: 26 },
  { x: 520, y: 320, width: 180, height: 22 },
  { x: 820, y: 280, width: 180, height: 22 },
  { x: 1110, y: 360, width: 220, height: 24 },
  { x: 1440, y: 300, width: 180, height: 22 },
  { x: 1710, y: 240, width: 180, height: 22 },
  { x: 1980, y: 340, width: 200, height: 22 },
  { x: 2250, y: 280, width: 180, height: 22 },
];

const coins = [
  { x: 280, y: 330, collected: false },
  { x: 580, y: 270, collected: false },
  { x: 860, y: 230, collected: false },
  { x: 1140, y: 310, collected: false },
  { x: 1480, y: 250, collected: false },
  { x: 1740, y: 190, collected: false },
  { x: 2020, y: 290, collected: false },
  { x: 2290, y: 230, collected: false },
];

const enemies = [
  { x: 640, y: 440, width: 38, height: 38, speed: 80, range: 180, dir: 1 },
  { x: 1540, y: 440, width: 38, height: 38, speed: 90, range: 220, dir: -1 },
  { x: 2050, y: 300, width: 36, height: 36, speed: 70, range: 120, dir: 1 },
];

const goal = { x: 2440, y: 360, width: 34, height: 80 };

const player = {
  x: 80,
  y: 360,
  width: 36,
  height: 44,
  vx: 0,
  vy: 0,
  speed: 260,
  sprintBoost: 160,
  jumpPower: 720,
  jumpsRemaining: 2,
  onGround: false,
};

const camera = {
  x: 0,
  y: 0,
  width: canvas.width,
  height: canvas.height,
};

const state = {
  lives: 3,
  coinsCollected: 0,
  totalCoins: coins.length,
  time: 0,
  running: true,
  spritesReady: false,
};

let sprites = {};
let lastTime = 0;

function renderPromptCards() {
  promptGrid.innerHTML = "";
  SPRITE_PROMPTS.forEach((prompt) => {
    const card = document.createElement("div");
    card.className = "prompt-card";
    card.innerHTML = `
      <h3>${prompt.name}</h3>
      <code>${prompt.prompt}</code>
    `;
    promptGrid.appendChild(card);
  });
}

function loadSprite(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = url;
    image.onload = () => {
      const buffer = document.createElement("canvas");
      buffer.width = image.width;
      buffer.height = image.height;
      const bctx = buffer.getContext("2d");
      bctx.drawImage(image, 0, 0);
      const imageData = bctx.getImageData(0, 0, buffer.width, buffer.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (Math.abs(r - KEY_COLOR.r) < 8 && Math.abs(g - KEY_COLOR.g) < 8 && Math.abs(b - KEY_COLOR.b) < 8) {
          data[i + 3] = 0;
        }
      }
      bctx.putImageData(imageData, 0, 0);
      resolve(buffer);
    };
    image.onerror = () => reject(new Error(`Failed to load sprite: ${url}`));
  });
}

async function loadSprites() {
  statusText.textContent = "Loading sprites…";
  try {
    const [playerSprite, botSprite, coinSprite, goalSprite] = await Promise.all([
      loadSprite("assets/player.svg"),
      loadSprite("assets/bot.svg"),
      loadSprite("assets/coin.svg"),
      loadSprite("assets/goal.svg"),
    ]);
    sprites = { player: playerSprite, bot: botSprite, coin: coinSprite, goal: goalSprite };
    state.spritesReady = true;
    statusText.textContent = "Run! Collect every egg.";
  } catch (error) {
    statusText.textContent = "Sprite load failed. Refresh to retry.";
  }
}

function resetGame() {
  player.x = 80;
  player.y = 360;
  player.vx = 0;
  player.vy = 0;
  player.jumpsRemaining = 2;
  state.lives = 3;
  state.coinsCollected = 0;
  state.time = 0;
  state.running = true;
  coins.forEach((coin) => {
    coin.collected = false;
  });
  statusText.textContent = "Run! Collect every egg.";
}

function handleKeyDown(event) {
  switch (event.key) {
    case "ArrowLeft":
    case "a":
    case "A":
      input.left = true;
      break;
    case "ArrowRight":
    case "d":
    case "D":
      input.right = true;
      break;
    case "ArrowUp":
    case "w":
    case "W":
    case " ":
      input.jumpQueued = true;
      break;
    case "Shift":
      input.sprint = true;
      break;
    default:
      break;
  }
}

function handleKeyUp(event) {
  switch (event.key) {
    case "ArrowLeft":
    case "a":
    case "A":
      input.left = false;
      break;
    case "ArrowRight":
    case "d":
    case "D":
      input.right = false;
      break;
    case "Shift":
      input.sprint = false;
      break;
    default:
      break;
  }
}

function applyInput(dt) {
  const speed = player.speed + (input.sprint ? player.sprintBoost : 0);
  if (input.left) {
    player.vx = -speed;
  } else if (input.right) {
    player.vx = speed;
  } else {
    player.vx = 0;
  }

  if (input.jumpQueued) {
    attemptJump();
    input.jumpQueued = false;
  }

  player.vy += world.gravity * dt;
}

function attemptJump() {
  if (player.jumpsRemaining <= 0) return;
  player.vy = -player.jumpPower;
  player.jumpsRemaining -= 1;
  statusText.textContent = player.jumpsRemaining === 1 ? "Double jump ready!" : "Run! Collect every egg.";
}

function updatePlayer(dt) {
  player.x += player.vx * dt;
  resolveCollisions("x");

  player.y += player.vy * dt;
  player.onGround = false;
  resolveCollisions("y");

  if (player.y > world.height + 120) {
    loseLife("Fell into the mist.");
  }

  player.x = Math.max(0, Math.min(player.x, world.width - player.width));
}

function resolveCollisions(axis) {
  platforms.forEach((platform) => {
    if (!intersects(player, platform)) return;
    if (axis === "x") {
      if (player.vx > 0) {
        player.x = platform.x - player.width;
      } else if (player.vx < 0) {
        player.x = platform.x + platform.width;
      }
      player.vx = 0;
    } else {
      if (player.vy > 0) {
        player.y = platform.y - player.height;
        player.vy = 0;
        player.onGround = true;
        player.jumpsRemaining = 2;
      } else if (player.vy < 0) {
        player.y = platform.y + platform.height;
        player.vy = 0;
      }
    }
  });
}

function updateEnemies(dt) {
  enemies.forEach((enemy) => {
    enemy.x += enemy.speed * enemy.dir * dt;
    if (enemy.x < enemy.startX - enemy.range || enemy.x > enemy.startX + enemy.range) {
      enemy.dir *= -1;
    }
  });
}

function updateCoins() {
  coins.forEach((coin) => {
    if (coin.collected) return;
    if (intersects(player, { x: coin.x, y: coin.y, width: 26, height: 26 })) {
      coin.collected = true;
      state.coinsCollected += 1;
      statusText.textContent = state.coinsCollected === state.totalCoins ? "All eggs secured! Reach the flag." : "Nice!";
    }
  });
}

function updateGoal() {
  if (state.coinsCollected !== state.totalCoins) return;
  if (intersects(player, goal)) {
    state.running = false;
    statusText.textContent = "Victory! The ruins are yours.";
  }
}

function checkEnemyHits() {
  enemies.forEach((enemy) => {
    if (intersects(player, enemy)) {
      loseLife("Hit by a hamburger bot.");
    }
  });
}

function loseLife(message) {
  state.lives -= 1;
  if (state.lives <= 0) {
    state.running = false;
    statusText.textContent = "Out of lives. Restart to try again.";
  } else {
    statusText.textContent = message;
    player.x = 80;
    player.y = 360;
    player.vx = 0;
    player.vy = 0;
    player.jumpsRemaining = 2;
  }
}

function updateCamera() {
  const targetX = player.x + player.width / 2 - camera.width / 2;
  camera.x = Math.max(0, Math.min(targetX, world.width - camera.width));
}

function drawBackground() {
  ctx.save();
  ctx.translate(-camera.x * 0.3, 0);
  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  for (let i = 0; i < 12; i += 1) {
    ctx.beginPath();
    ctx.arc(120 + i * 200, 90 + (i % 2) * 40, 60, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPlatforms() {
  ctx.fillStyle = "#2b3053";
  platforms.forEach((platform) => {
    ctx.fillRect(platform.x - camera.x, platform.y, platform.width, platform.height);
    ctx.fillStyle = "#39406b";
    ctx.fillRect(platform.x - camera.x, platform.y, platform.width, 6);
    ctx.fillStyle = "#2b3053";
  });
}

function drawSprite(sprite, x, y, width, height) {
  if (!sprite) return;
  ctx.drawImage(sprite, x, y, width, height);
}

function drawCoins(time) {
  coins.forEach((coin) => {
    if (coin.collected) return;
    const bob = Math.sin((time + coin.x) / 200) * 4;
    drawSprite(sprites.coin, coin.x - camera.x, coin.y + bob, 26, 26);
  });
}

function drawEnemies() {
  enemies.forEach((enemy) => {
    drawSprite(sprites.bot, enemy.x - camera.x, enemy.y, enemy.width, enemy.height);
  });
}

function drawGoal(time) {
  const glow = Math.sin(time / 200) * 4;
  drawSprite(sprites.goal, goal.x - camera.x, goal.y + glow, goal.width + 20, goal.height + 20);
}

function drawPlayer() {
  drawSprite(sprites.player, player.x - camera.x, player.y, player.width, player.height);
}

function render(time) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawPlatforms();
  drawCoins(time);
  drawEnemies();
  drawGoal(time);
  drawPlayer();
}

function updateHud() {
  coinCount.textContent = `${state.coinsCollected} / ${state.totalCoins}`;
  lifeCount.textContent = `${state.lives}`;
  timerText.textContent = `${state.time.toFixed(1)}s`;
}

function intersects(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = Math.min(0.032, (timestamp - lastTime) / 1000);
  lastTime = timestamp;

  if (state.running && state.spritesReady) {
    state.time += dt;
    applyInput(dt);
    updatePlayer(dt);
    updateEnemies(dt);
    updateCoins();
    checkEnemyHits();
    updateGoal();
    updateCamera();
  }

  render(timestamp);
  updateHud();

  requestAnimationFrame(gameLoop);
}

function initEnemies() {
  enemies.forEach((enemy) => {
    enemy.startX = enemy.x;
  });
}

restartButton.addEventListener("click", resetGame);
window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);

renderPromptCards();
initEnemies();
loadSprites();
requestAnimationFrame(gameLoop);

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const coinCount = document.querySelector("#coin-count");
const scoreCount = document.querySelector("#score-count");
const gameMessage = document.querySelector("#game-message");
const resultOverlay = document.querySelector("#result-overlay");
const resultIcon = document.querySelector("#result-icon");
const resultEyebrow = document.querySelector("#result-eyebrow");
const resultTitle = document.querySelector("#result-title");
const resultCopy = document.querySelector("#result-copy");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const WORLD_WIDTH = 2900;
const GRAVITY = 0.62;
const MOVE_SPEED = 4.2;
const JUMP_SPEED = -13;
const keys = new Set();

const platforms = [
  { x: 0, y: 470, width: 700 },
  { x: 790, y: 470, width: 600 },
  { x: 1480, y: 470, width: 660 },
  { x: 2230, y: 470, width: 670 },
  { x: 205, y: 380, width: 125 },
  { x: 440, y: 318, width: 135 },
  { x: 680, y: 380, width: 110 },
  { x: 905, y: 365, width: 140 },
  { x: 1130, y: 300, width: 140 },
  { x: 1375, y: 365, width: 120 },
  { x: 1580, y: 370, width: 135 },
  { x: 1800, y: 305, width: 135 },
  { x: 2045, y: 370, width: 140 },
  { x: 2300, y: 370, width: 125 },
  { x: 2505, y: 305, width: 145 },
];

const coinSpots = [
  [268, 340], [505, 278], [730, 340], [970, 325],
  [1195, 260], [1435, 325], [1645, 330], [1865, 265],
];
const enemySpots = [
  { x: 535, minX: 505, maxX: 665, y: 436, width: 36, height: 34, speed: 0.9 },
];

let player;
let coins;
let enemies;
let score = 0;
let cameraX = 0;
let won = false;
let lastTime = 0;

function resetGame() {
  player = { x: 70, y: 400, width: 32, height: 46, vx: 0, vy: 0, grounded: false, facing: 1 };
  coins = coinSpots.map(([x, y]) => ({ x, y, collected: false }));
  enemies = enemySpots.map((enemy) => ({ ...enemy, direction: 1, defeated: false }));
  score = 0;
  cameraX = 0;
  won = false;
  coinCount.textContent = "0";
  scoreCount.textContent = formatScore(score);
  gameMessage.textContent = "旗まで進もう！";
  resultOverlay.hidden = true;
}

function formatScore(value) {
  return String(value).padStart(6, "0");
}

function addScore(points) {
  score += points;
  scoreCount.textContent = formatScore(score);
}

function jump() {
  if (player.grounded && !won) {
    player.vy = JUMP_SPEED;
    player.grounded = false;
  }
}

function update(delta) {
  if (won) return;
  const step = Math.min(delta / 16.67, 2);
  const movingLeft = keys.has("ArrowLeft") || keys.has("KeyA") || keys.has("left");
  const movingRight = keys.has("ArrowRight") || keys.has("KeyD") || keys.has("right");

  player.vx = (Number(movingRight) - Number(movingLeft)) * MOVE_SPEED;
  if (player.vx !== 0) player.facing = Math.sign(player.vx);

  const previousBottom = player.y + player.height;
  player.x = Math.max(0, Math.min(WORLD_WIDTH - player.width, player.x + player.vx * step));
  player.vy += GRAVITY * step;
  player.y += player.vy * step;
  player.grounded = false;

  for (const enemy of enemies) {
    if (enemy.defeated) continue;
    enemy.x += enemy.speed * enemy.direction * step;
    if (enemy.x <= enemy.minX || enemy.x + enemy.width >= enemy.maxX) {
      enemy.direction *= -1;
      enemy.x = Math.max(enemy.minX, Math.min(enemy.maxX - enemy.width, enemy.x));
    }

    const overlaps = player.x + player.width > enemy.x && player.x < enemy.x + enemy.width;
    const touches = player.y + player.height > enemy.y && player.y < enemy.y + enemy.height;
    if (!overlaps || !touches) continue;

    if (player.vy > 0 && previousBottom <= enemy.y + 9) {
      enemy.defeated = true;
      player.y = enemy.y - player.height;
      player.vy = JUMP_SPEED * 0.58;
      addScore(200);
      gameMessage.textContent = "敵をふみつけた！";
    } else {
      finishGame(false);
      return;
    }
  }

  if (player.vy >= 0) {
    for (const platform of platforms) {
      const overlaps = player.x + player.width > platform.x && player.x < platform.x + platform.width;
      const crossedTop = previousBottom <= platform.y && player.y + player.height >= platform.y;
      if (overlaps && crossedTop) {
        player.y = platform.y - player.height;
        player.vy = 0;
        player.grounded = true;
        break;
      }
    }
  }

  if (player.y > HEIGHT + 100) {
    player.x = Math.max(40, player.x - 180);
    player.y = 250;
    player.vy = 0;
    gameMessage.textContent = "앗! 다시 올라가 보자";
  }

  for (const coin of coins) {
    if (!coin.collected && player.x < coin.x + 13 && player.x + player.width > coin.x - 13 &&
        player.y < coin.y + 13 && player.y + player.height > coin.y - 13) {
      coin.collected = true;
      const remaining = coins.filter((item) => !item.collected).length;
      coinCount.textContent = String(coins.length - remaining);
      addScore(100);
      gameMessage.textContent = remaining ? "いいね！その調子！" : "コインを全部集めた！";
    }
  }

  cameraX = Math.max(0, Math.min(WORLD_WIDTH - WIDTH, player.x - WIDTH * 0.36));
  if (player.x > WORLD_WIDTH - 180) finishGame();
}

function finishGame(cleared = true) {
  won = true;
  const collected = coins.filter((coin) => coin.collected).length;
  resultOverlay.classList.toggle("game-over", !cleared);
  resultIcon.textContent = cleared ? "🏁" : "✕";
  resultEyebrow.textContent = cleared ? "ADVENTURE COMPLETE" : "ADVENTURE OVER";
  resultTitle.textContent = cleared ? "ゴール！" : "ゲームオーバー";
  gameMessage.textContent = cleared ? "冒険クリア！" : "敵にぶつかった！";
  resultCopy.textContent = `スコア ${formatScore(score)} ／ コイン ${collected} / ${coins.length} 枚`;
  resultOverlay.hidden = false;
}

function drawBackground(time) {
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, "#24234a");
  gradient.addColorStop(0.58, "#75507e");
  gradient.addColorStop(1, "#e58c78");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "rgba(250, 174, 132, .24)";
  ctx.fillRect(0, 326, WIDTH, 3);
  ctx.fillStyle = "rgba(246, 186, 137, .16)";
  ctx.fillRect(0, 339, WIDTH, 2);

  for (let i = 0; i < 54; i += 1) {
    const starX = ((i * 173 + 47) % WIDTH - cameraX * (0.025 + (i % 4) * 0.008) + WIDTH * 4) % WIDTH;
    const starY = (i * 89 + 19) % 260;
    ctx.globalAlpha = 0.65 + Math.sin(time / 700 + i * 2.4) * 0.25;
    ctx.fillStyle = i % 7 === 0 ? "#a9f7f2" : "#fff0c2";
    ctx.fillRect(Math.floor(starX / 4) * 4, Math.floor(starY / 4) * 4, i % 7 === 0 ? 4 : 3, i % 7 === 0 ? 4 : 3);
  }
  ctx.globalAlpha = 1;

  const sunX = Math.floor((785 - cameraX * 0.08) / 8) * 8;
  ctx.fillStyle = "rgba(255, 205, 119, .12)";
  ctx.fillRect(sunX - 52, 49, 112, 112);
  ctx.fillStyle = "#ffd06e";
  ctx.fillRect(sunX - 36, 65, 80, 80);
  ctx.fillStyle = "#ed9b75";
  ctx.fillRect(sunX - 36, 105, 80, 8);
  ctx.fillRect(sunX - 36, 121, 80, 8);
  ctx.fillRect(sunX - 36, 137, 80, 8);

  drawMountainLayer(0.1, 355, "#47385d", 0);
  drawMountainLayer(0.19, 410, "#352b50", 75);
  drawPixelCloud(125 - cameraX * 0.16, 190, 1);
  drawPixelCloud(470 - cameraX * 0.12, 235, .75);
  drawPixelCloud(860 - cameraX * 0.18, 205, .9);
  drawHills();
}

function drawPixelCloud(x, y, scale) {
  x = ((x % (WIDTH + 200)) + WIDTH + 200) % (WIDTH + 200) - 100;
  ctx.save();
  ctx.translate(Math.floor(x / 4) * 4, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(55, 53, 91, .76)";
  ctx.fillRect(8, 8, 48, 12);
  ctx.fillRect(16, 0, 32, 8);
  ctx.fillRect(0, 12, 64, 8);
  ctx.fillStyle = "rgba(250, 186, 160, .45)";
  ctx.fillRect(12, 16, 44, 4);
  ctx.restore();
}

function drawMountainLayer(parallax, baseY, color, offset) {
  const shift = (cameraX * parallax) % 280;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-300, HEIGHT);
  for (let i = -2; i < 7; i += 1) {
    const x = i * 280 - shift + offset;
    const peak = baseY - (65 + (i * 37 % 75));
    ctx.lineTo(x, baseY);
    ctx.lineTo(x + 120, peak);
    ctx.lineTo(x + 280, baseY);
  }
  ctx.lineTo(WIDTH + 300, HEIGHT);
  ctx.closePath();
  ctx.fill();
}

function drawHills() {
  ctx.fillStyle = "#383252";
  ctx.beginPath();
  ctx.moveTo(0, HEIGHT);
  ctx.lineTo(0, 412);
  for (let x = -40; x <= WIDTH + 80; x += 40) {
    const y = 390 + Math.floor(Math.sin((x + cameraX * .12) * .009) * 3) * 8;
    ctx.lineTo(x + 16, y);
    ctx.lineTo(x + 16, y + 8);
    ctx.lineTo(x + 40, y + 8);
  }
  ctx.lineTo(WIDTH, HEIGHT);
  ctx.fill();
}

function drawPlatform(platform) {
  const x = platform.x - cameraX;
  if (x + platform.width < -20 || x > WIDTH + 20) return;
  ctx.fillStyle = "#36304f";
  ctx.fillRect(x, platform.y + 10, platform.width, HEIGHT - platform.y);
  ctx.fillStyle = "#2c2948";
  ctx.fillRect(x + 4, platform.y + 18, Math.max(0, platform.width - 8), HEIGHT - platform.y - 18);
  ctx.fillStyle = "#57bd98";
  ctx.fillRect(x, platform.y + 4, platform.width, 10);
  ctx.fillStyle = "#a5f2a1";
  ctx.fillRect(x, platform.y, platform.width, 6);
  ctx.fillStyle = "#e1ffd0";
  for (let mark = x + 8; mark < x + platform.width - 8; mark += 32) {
    ctx.fillRect(mark, platform.y + 2, 8, 2);
  }

  ctx.fillStyle = "#51486d";
  for (let mark = x + 12; mark < x + platform.width - 12; mark += 40) {
    const worldMark = mark + cameraX;
    const detailY = platform.y + 30 + (Math.floor(worldMark / 40) % 3) * 12;
    ctx.fillRect(mark, detailY, 12, 4);
  }
}

function drawCoin(coin, time) {
  if (coin.collected) return;
  const x = coin.x - cameraX;
  if (x < -25 || x > WIDTH + 25) return;
  const pulse = 1 + Math.sin(time / 180 + coin.x) * .05;
  ctx.save();
  ctx.translate(Math.floor(x / 2) * 2, Math.floor((coin.y + Math.sin(time / 230 + coin.x) * 2) / 2) * 2);
  ctx.scale(pulse, 1);
  ctx.fillStyle = "rgba(255, 220, 100, .2)";
  ctx.fillRect(-14, -14, 28, 28);
  ctx.fillStyle = "#bd783c";
  ctx.fillRect(-8, -10, 16, 20);
  ctx.fillRect(-10, -6, 20, 12);
  ctx.fillStyle = "#f4d35e";
  ctx.fillRect(-6, -10, 12, 20);
  ctx.fillRect(-10, -6, 20, 12);
  ctx.fillStyle = "#fff2a1";
  ctx.fillRect(-2, -6, 4, 12);
  ctx.restore();
}

function drawEnemy(enemy, time) {
  if (enemy.defeated) return;
  const x = enemy.x - cameraX;
  if (x + enemy.width < -20 || x > WIDTH + 20) return;
  const bob = Math.floor(Math.sin(time / 130 + enemy.x) * 1.5 / 2) * 2;
  ctx.save();
  ctx.translate(Math.floor((x + enemy.width / 2) / 2) * 2, enemy.y + bob);
  ctx.scale(enemy.direction, 1);

  ctx.fillStyle = "rgba(9, 16, 34, .3)";
  ctx.fillRect(-16, enemy.height + 1, 32, 4);
  ctx.fillStyle = "#342b55";
  ctx.fillRect(-16, 11, 32, 19);
  ctx.fillRect(-12, 5, 8, 10);
  ctx.fillRect(4, 3, 8, 12);
  ctx.fillRect(-20, 11, 8, 8);
  ctx.fillRect(12, 9, 8, 8);
  ctx.fillStyle = "#ec6879";
  ctx.fillRect(-12, 15, 24, 14);
  ctx.fillRect(-8, 11, 16, 20);
  ctx.fillStyle = "#ff9a88";
  ctx.fillRect(-8, 15, 12, 4);
  ctx.fillStyle = "#fff0d1";
  ctx.fillRect(2, 15, 8, 10);
  ctx.fillStyle = "#252744";
  ctx.fillRect(6, 19, 3, 4);
  ctx.fillStyle = "#f3bd68";
  ctx.fillRect(-8, 29, 5, 4);
  ctx.fillRect(6, 29, 5, 4);
  ctx.restore();
}

function drawPlayer(time) {
  const x = player.x - cameraX;
  const walking = player.grounded && player.vx !== 0;
  const bob = walking ? Math.floor(Math.sin(time / 65) * 1.5 / 2) * 2 : 0;
  const y = player.y + bob;
  ctx.save();
  ctx.translate(Math.floor((x + player.width / 2) / 2) * 2, y);
  ctx.scale(player.facing, 1);
  ctx.fillStyle = "rgba(9, 16, 34, .35)";
  ctx.fillRect(-16, player.height + 3, 32, 4);
  ctx.fillStyle = "#cf536d";
  ctx.fillRect(-8, 20, 8, 17);
  ctx.fillRect(-16 - Math.floor(Math.abs(player.vx) * 1.1 / 4) * 4, 26, 12, 8);
  ctx.fillStyle = "#293858";
  ctx.fillRect(-12, 36, 10, 10);
  ctx.fillRect(2, 36, 10, 10);
  ctx.fillStyle = "#91d9de";
  ctx.fillRect(-12, 43, 10, 3);
  ctx.fillRect(3, 43, 10, 3);
  ctx.fillStyle = "#237a91";
  ctx.fillRect(-14, 18, 28, 23);
  ctx.fillStyle = "#31b9b0";
  ctx.fillRect(-10, 16, 20, 23);
  ctx.fillRect(-14, 22, 4, 14);
  ctx.fillRect(10, 22, 4, 14);
  ctx.fillStyle = "#f5d278";
  ctx.fillRect(-2, 20, 4, 18);
  ctx.fillStyle = "#e8a65f";
  ctx.fillRect(-12, 26, 4, 4);
  ctx.fillStyle = "#f5d278";
  ctx.fillRect(4, 24, 4, 4);
  ctx.fillStyle = "#f4bd85";
  ctx.fillRect(-10, 4, 22, 18);
  ctx.fillRect(-6, 0, 14, 24);
  ctx.fillStyle = "#242b49";
  ctx.fillRect(-14, 7, 28, 6);
  ctx.fillRect(-10, 2, 20, 6);
  ctx.fillRect(-4, -2, 12, 5);
  ctx.fillStyle = "#fff0cd";
  ctx.fillRect(-8, 10, 18, 8);
  ctx.fillStyle = "#28314f";
  ctx.fillRect(4, 11, 3, 4);
  ctx.fillStyle = "#e68270";
  ctx.fillRect(-8, 18, 14, 4);
  ctx.fillStyle = "#efc75f";
  ctx.fillRect(-8, 0, 16, 4);
  ctx.fillRect(-4, -4, 8, 4);
  ctx.restore();
}

function drawGoal() {
  const x = WORLD_WIDTH - 155 - cameraX;
  ctx.fillStyle = "#e8e0c8";
  ctx.fillRect(x, 365, 6, 105);
  ctx.fillStyle = "#fff6d8";
  ctx.fillRect(x + 2, 365, 2, 105);
  ctx.fillStyle = "#ec6f76";
  ctx.fillRect(x + 6, 369, 38, 8);
  ctx.fillRect(x + 6, 377, 30, 8);
  ctx.fillRect(x + 6, 385, 22, 8);
  ctx.fillStyle = "#ffd875";
  ctx.fillRect(x - 2, 361, 10, 6);
  ctx.fillRect(x, 357, 6, 14);
}

function render(time) {
  drawBackground(time);
  for (const platform of platforms) drawPlatform(platform);
  drawGoal();
  for (const coin of coins) drawCoin(coin, time);
  for (const enemy of enemies) drawEnemy(enemy, time);
  drawPlayer(time);
}

function frame(time) {
  const delta = lastTime ? time - lastTime : 16.67;
  lastTime = time;
  update(delta);
  render(time);
  requestAnimationFrame(frame);
}

const keyMap = {
  ArrowLeft: "ArrowLeft",
  ArrowRight: "ArrowRight",
  KeyA: "KeyA",
  KeyD: "KeyD",
  Space: "Space",
  ArrowUp: "ArrowUp",
  KeyW: "KeyW",
};

window.addEventListener("keydown", (event) => {
  const key = keyMap[event.code];
  if (!key) return;
  if (["Space", "ArrowLeft", "ArrowRight", "ArrowUp"].includes(key)) event.preventDefault();
  if (!keys.has(key) && ["Space", "ArrowUp", "KeyW"].includes(key)) jump();
  keys.add(key);
});

window.addEventListener("keyup", (event) => keys.delete(keyMap[event.code]));
window.addEventListener("blur", () => keys.clear());

document.querySelectorAll("[data-control]").forEach((button) => {
  const control = button.dataset.control;
  const release = () => {
    keys.delete(control);
    button.classList.remove("is-pressed");
  };
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    keys.add(control);
    button.classList.add("is-pressed");
    if (control === "jump") jump();
    button.setPointerCapture(event.pointerId);
  });
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
});

document.querySelector("#restart-button").addEventListener("click", resetGame);
document.querySelector("#play-again-button").addEventListener("click", resetGame);

resetGame();
requestAnimationFrame(frame);

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const coinCount = document.querySelector("#coin-count");
const gameMessage = document.querySelector("#game-message");
const resultOverlay = document.querySelector("#result-overlay");
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

let player;
let coins;
let cameraX = 0;
let won = false;
let lastTime = 0;

function resetGame() {
  player = { x: 70, y: 400, width: 32, height: 46, vx: 0, vy: 0, grounded: false, facing: 1 };
  coins = coinSpots.map(([x, y]) => ({ x, y, collected: false }));
  cameraX = 0;
  won = false;
  coinCount.textContent = "0";
  gameMessage.textContent = "旗まで進もう！";
  resultOverlay.hidden = true;
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
      gameMessage.textContent = remaining ? "いいね！その調子！" : "コインを全部集めた！";
    }
  }

  cameraX = Math.max(0, Math.min(WORLD_WIDTH - WIDTH, player.x - WIDTH * 0.36));
  if (player.x > WORLD_WIDTH - 180) finishGame();
}

function finishGame() {
  won = true;
  const collected = coins.filter((coin) => coin.collected).length;
  gameMessage.textContent = "冒険クリア！";
  resultCopy.textContent = `コインを ${collected} / ${coins.length} 枚集めました。`;
  resultOverlay.hidden = false;
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, "#87c8e4");
  gradient.addColorStop(1, "#d5e8e4");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "rgba(255, 245, 204, .72)";
  ctx.beginPath();
  ctx.arc(785 - cameraX * 0.08, 95, 37, 0, Math.PI * 2);
  ctx.fill();

  drawCloud(125 - cameraX * 0.16, 130, 1);
  drawCloud(470 - cameraX * 0.12, 195, .75);
  drawCloud(860 - cameraX * 0.18, 145, .9);
  drawHills();
}

function drawCloud(x, y, scale) {
  x = ((x % (WIDTH + 200)) + WIDTH + 200) % (WIDTH + 200) - 100;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(255, 255, 255, .63)";
  ctx.beginPath();
  ctx.arc(0, 12, 24, 0, Math.PI * 2);
  ctx.arc(27, 1, 31, 0, Math.PI * 2);
  ctx.arc(57, 12, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHills() {
  ctx.fillStyle = "#a8d6cb";
  ctx.beginPath();
  ctx.moveTo(0, 425);
  for (let x = -60; x <= WIDTH + 60; x += 180) {
    const y = 365 + Math.sin((x + cameraX * .12) * .009) * 28;
    ctx.quadraticCurveTo(x + 75, y - 55, x + 180, 410);
  }
  ctx.lineTo(WIDTH, HEIGHT);
  ctx.lineTo(0, HEIGHT);
  ctx.fill();
}

function drawPlatform(platform) {
  const x = platform.x - cameraX;
  if (x + platform.width < -20 || x > WIDTH + 20) return;
  ctx.fillStyle = "#568e79";
  ctx.fillRect(x, platform.y, platform.width, 15);
  ctx.fillStyle = "#78b889";
  ctx.fillRect(x, platform.y, platform.width, 7);
  ctx.fillStyle = "rgba(241, 255, 214, .35)";
  ctx.fillRect(x + 8, platform.y + 2, Math.max(0, platform.width - 16), 2);
  ctx.fillStyle = "#c6a982";
  ctx.fillRect(x, platform.y + 15, platform.width, HEIGHT - platform.y);
  ctx.fillStyle = "rgba(123, 89, 87, .15)";
  for (let mark = x + 14; mark < x + platform.width; mark += 35) {
    ctx.fillRect(mark, platform.y + 27, 13, 3);
  }
}

function drawCoin(coin, time) {
  if (coin.collected) return;
  const x = coin.x - cameraX;
  if (x < -25 || x > WIDTH + 25) return;
  const pulse = 1 + Math.sin(time / 180 + coin.x) * .08;
  ctx.save();
  ctx.translate(x, coin.y + Math.sin(time / 230 + coin.x) * 3);
  ctx.scale(pulse, 1);
  ctx.fillStyle = "#f7ce68";
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#fff0ad";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#fff7d6";
  ctx.fillRect(-1.5, -6, 3, 12);
  ctx.restore();
}

function drawPlayer() {
  const x = player.x - cameraX;
  const y = player.y;
  ctx.save();
  ctx.translate(x + player.width / 2, y);
  ctx.scale(player.facing, 1);
  ctx.fillStyle = "rgba(34, 50, 78, .18)";
  ctx.beginPath();
  ctx.ellipse(0, player.height + 3, 18, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f18c75";
  ctx.beginPath();
  ctx.roundRect(-15, 14, 30, 31, 10);
  ctx.fill();
  ctx.fillStyle = "#ffd4a5";
  ctx.beginPath();
  ctx.arc(0, 12, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#283856";
  ctx.beginPath();
  ctx.arc(5, 11, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#d86f66";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(3, 18);
  ctx.quadraticCurveTo(7, 21, 10, 17);
  ctx.stroke();
  ctx.fillStyle = "#77ded7";
  ctx.beginPath();
  ctx.roundRect(-15, 37, 30, 9, 4);
  ctx.fill();
  ctx.restore();
}

function drawGoal() {
  const x = WORLD_WIDTH - 155 - cameraX;
  ctx.fillStyle = "#f3f0df";
  ctx.fillRect(x, 365, 7, 105);
  ctx.fillStyle = "#f18470";
  ctx.beginPath();
  ctx.moveTo(x + 7, 367);
  ctx.lineTo(x + 60, 381);
  ctx.lineTo(x + 7, 397);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#f5d578";
  ctx.beginPath();
  ctx.arc(x + 3.5, 362, 6, 0, Math.PI * 2);
  ctx.fill();
}

function render(time) {
  drawBackground();
  for (const platform of platforms) drawPlatform(platform);
  drawGoal();
  for (const coin of coins) drawCoin(coin, time);
  drawPlayer();
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

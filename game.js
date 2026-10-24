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
const distantBuildings = [
  { x: 0, width: 88, height: 115 }, { x: 98, width: 67, height: 157 },
  { x: 176, width: 112, height: 128 }, { x: 299, width: 74, height: 184 },
  { x: 385, width: 102, height: 142 }, { x: 497, width: 78, height: 172 },
  { x: 589, width: 121, height: 119 }, { x: 722, width: 84, height: 161 },
];
const streetBuildings = [
  { x: 0, width: 118, height: 184, sign: "新宿", color: "#ff4fc8" },
  { x: 128, width: 92, height: 238, sign: "歌舞伎町", color: "#45f4dc", vertical: true },
  { x: 230, width: 142, height: 165, sign: "RAMEN", color: "#ffbd4a" },
  { x: 382, width: 105, height: 210, sign: "ゲーム", color: "#ff4fc8", vertical: true },
  { x: 497, width: 126, height: 180, sign: "HOTEL", color: "#45f4dc" },
  { x: 633, width: 104, height: 250, sign: "ネオン", color: "#ffbd4a", vertical: true },
  { x: 747, width: 142, height: 194, sign: "居酒屋", color: "#ff4fc8" },
  { x: 899, width: 94, height: 225, sign: "新宿", color: "#45f4dc", vertical: true },
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
  gradient.addColorStop(0, "#080b20");
  gradient.addColorStop(0.58, "#171331");
  gradient.addColorStop(1, "#382044");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const cityGlow = ctx.createRadialGradient(490, 390, 20, 490, 390, 460);
  cityGlow.addColorStop(0, "rgba(255, 48, 173, .2)");
  cityGlow.addColorStop(.48, "rgba(106, 44, 170, .12)");
  cityGlow.addColorStop(1, "rgba(106, 44, 170, 0)");
  ctx.fillStyle = cityGlow;
  ctx.fillRect(0, 100, WIDTH, 440);

  for (let i = 0; i < 46; i += 1) {
    const starX = ((i * 173 + 47) % WIDTH - cameraX * (0.025 + (i % 4) * 0.008) + WIDTH * 4) % WIDTH;
    const starY = (i * 89 + 19) % 245;
    const twinkle = 0.55 + Math.sin(time / 500 + i * 2.4) * 0.3;
    ctx.globalAlpha = twinkle;
    ctx.fillStyle = i % 7 === 0 ? "#a9f7f2" : "#e3d7ff";
    ctx.fillRect(starX, starY, i % 7 === 0 ? 2 : 1.5, i % 7 === 0 ? 2 : 1.5);
  }
  ctx.globalAlpha = 1;

  drawCityLayer(0.12, 414, 820, distantBuildings, "#11182c", .25);
  drawCityLayer(0.28, 472, 1020, streetBuildings, "#101426", .8);
}

function drawCityLayer(parallax, baseY, period, buildings, color, windowAlpha) {
  const offset = cameraX * parallax;
  const firstTile = Math.floor((offset - WIDTH) / period);
  const lastTile = Math.ceil((offset + WIDTH) / period);

  for (let tile = firstTile; tile <= lastTile; tile += 1) {
    for (let buildingIndex = 0; buildingIndex < buildings.length; buildingIndex += 1) {
      const building = buildings[buildingIndex];
      const x = tile * period + building.x - offset;
      if (x + building.width < -10 || x > WIDTH + 10) continue;
      const y = baseY - building.height;

      ctx.fillStyle = color;
      ctx.fillRect(x, y, building.width, HEIGHT - y);
      ctx.fillStyle = "rgba(116, 128, 170, .14)";
      ctx.fillRect(x + 4, y + 5, 2, HEIGHT - y - 5);
      ctx.fillStyle = "rgba(4, 7, 19, .42)";
      ctx.fillRect(x + building.width - 5, y, 5, HEIGHT - y);

      const windowColor = buildingIndex % 3 === 0 ? "#ff4fc8" : "#54e9db";
      ctx.fillStyle = windowColor;
      ctx.globalAlpha = windowAlpha;
      for (let row = y + 13; row < baseY - 12; row += 17) {
        for (let col = x + 10; col < x + building.width - 8; col += 15) {
          const windowNumber = Math.floor((col + offset) / 15) + Math.floor(row / 17) * 3 + buildingIndex;
          if (windowNumber % 4 !== 0) ctx.fillRect(col, row, 5, 7);
        }
      }
      ctx.globalAlpha = 1;

      if (buildingIndex % 3 === 1) {
        ctx.fillStyle = "#ff4fc8";
        ctx.shadowColor = "#ff4fc8";
        ctx.shadowBlur = 9;
        ctx.fillRect(x + 8, y + 8, building.width - 16, 2);
        ctx.shadowBlur = 0;
      }

      if (building.sign) {
        drawNeonSign(x + (building.vertical ? building.width - 34 : 8), y + 24,
          building.vertical ? 25 : building.width - 16, building.vertical ? 92 : 28,
          building.sign, building.color, building.vertical);
      } else if (buildingIndex % 2 === 0) {
        drawNeonSign(x + 9, y + 17, building.width - 18, 19,
          buildingIndex % 4 === 0 ? "NIGHT" : "TOKYO", windowColor, false);
      }

      if (building.height > 175 && buildingIndex % 2 === 0) {
        ctx.strokeStyle = "rgba(147, 158, 196, .52)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + building.width / 2, y);
        ctx.lineTo(x + building.width / 2, y - 13);
        ctx.stroke();
        ctx.fillStyle = "#ff4fc8";
        ctx.fillRect(x + building.width / 2 - 2, y - 15, 4, 3);
      }
    }
  }
}

function drawNeonSign(x, y, width, height, label, color, vertical) {
  ctx.save();
  ctx.fillStyle = "rgba(11, 10, 26, .88)";
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);
  ctx.shadowBlur = 0;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = vertical ? "bold 13px sans-serif" : `bold ${Math.min(13, height - 7)}px sans-serif`;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  if (vertical) {
    [...label].forEach((character, index) => {
      ctx.fillText(character, x + width / 2, y + 12 + index * 16);
    });
  } else {
    ctx.fillText(label, x + width / 2, y + height / 2, width - 6);
  }
  ctx.restore();
}

function drawPlatform(platform) {
  const x = platform.x - cameraX;
  if (x + platform.width < -20 || x > WIDTH + 20) return;
  const body = ctx.createLinearGradient(0, platform.y + 8, 0, HEIGHT);
  body.addColorStop(0, "#344760");
  body.addColorStop(1, "#17243d");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(x, platform.y + 8);
  ctx.lineTo(x + platform.width, platform.y + 8);
  ctx.lineTo(x + platform.width - 10, HEIGHT);
  ctx.lineTo(x + 10, HEIGHT);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#32a99d";
  ctx.beginPath();
  ctx.roundRect(x, platform.y, platform.width, 16, [5, 5, 2, 2]);
  ctx.fill();
  ctx.fillStyle = "#80f0cf";
  ctx.beginPath();
  ctx.roundRect(x, platform.y, platform.width, 6, [5, 5, 1, 1]);
  ctx.fill();
  ctx.fillStyle = "rgba(212, 255, 229, .62)";
  ctx.fillRect(x + 9, platform.y + 2, Math.max(0, platform.width - 18), 1.5);

  ctx.fillStyle = "rgba(13, 25, 48, .42)";
  for (let mark = x + 18; mark < x + platform.width - 12; mark += 39) {
    const worldMark = mark + cameraX;
    const crackY = platform.y + 34 + (Math.floor(worldMark / 39) % 3) * 15;
    ctx.beginPath();
    ctx.moveTo(mark, crackY);
    ctx.lineTo(mark + 8, crackY + 3);
    ctx.lineTo(mark + 12, crackY - 2);
    ctx.strokeStyle = "rgba(12, 22, 41, .3)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(128, 240, 207, .72)";
  for (let tuft = x + 20; tuft < x + platform.width - 14; tuft += 47) {
    const offset = Math.floor((tuft + cameraX) / 47) % 5;
    ctx.beginPath();
    ctx.moveTo(tuft, platform.y + 1);
    ctx.lineTo(tuft + 3, platform.y - 4 - offset);
    ctx.lineTo(tuft + 5, platform.y + 1);
    ctx.fill();
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
  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 25);
  glow.addColorStop(0, "rgba(255, 224, 128, .42)");
  glow.addColorStop(1, "rgba(255, 224, 128, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(-25, -25, 50, 50);
  ctx.shadowColor = "#ffd878";
  ctx.shadowBlur = 15;
  ctx.fillStyle = "#ffc95e";
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#fff0b5";
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = "#fff8d9";
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(2, -1);
  ctx.lineTo(6, 0);
  ctx.lineTo(2, 2);
  ctx.lineTo(0, 7);
  ctx.lineTo(-2, 2);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-2, -1);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawEnemy(enemy, time) {
  if (enemy.defeated) return;
  const x = enemy.x - cameraX;
  if (x + enemy.width < -20 || x > WIDTH + 20) return;
  const bob = Math.sin(time / 130 + enemy.x) * 1.5;
  ctx.save();
  ctx.translate(x + enemy.width / 2, enemy.y + bob);
  ctx.scale(enemy.direction, 1);

  ctx.fillStyle = "rgba(9, 16, 34, .3)";
  ctx.beginPath();
  ctx.ellipse(0, enemy.height + 2, 19, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#342b55";
  ctx.beginPath();
  ctx.moveTo(-17, 25);
  ctx.lineTo(-21, 10);
  ctx.lineTo(-12, 14);
  ctx.lineTo(-7, 4);
  ctx.lineTo(0, 12);
  ctx.lineTo(8, 3);
  ctx.lineTo(12, 14);
  ctx.lineTo(20, 9);
  ctx.lineTo(15, 27);
  ctx.quadraticCurveTo(0, 36, -17, 25);
  ctx.fill();

  ctx.fillStyle = "#ec6879";
  ctx.beginPath();
  ctx.ellipse(1, 21, 14, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ff9a88";
  ctx.beginPath();
  ctx.ellipse(-3, 17, 8, 4, -.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff0d1";
  ctx.beginPath();
  ctx.ellipse(5, 19, 4, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#252744";
  ctx.beginPath();
  ctx.arc(7, 20, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#f3bd68";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-6, 30);
  ctx.lineTo(-10, 33);
  ctx.moveTo(7, 30);
  ctx.lineTo(11, 33);
  ctx.stroke();
  ctx.restore();
}

function drawPlayer(time) {
  const x = player.x - cameraX;
  const walking = player.grounded && player.vx !== 0;
  const bob = walking ? Math.sin(time / 65) * 1.5 : 0;
  const y = player.y + bob;
  ctx.save();
  ctx.translate(x + player.width / 2, y);
  ctx.scale(player.facing, 1);
  ctx.fillStyle = "rgba(9, 16, 34, .35)";
  ctx.beginPath();
  ctx.ellipse(0, player.height + 5, 19, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#cf536d";
  ctx.beginPath();
  ctx.moveTo(-8, 20);
  ctx.lineTo(-23 - Math.abs(player.vx) * 1.1, 26);
  ctx.lineTo(-17, 38);
  ctx.lineTo(-10, 34);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#293858";
  ctx.beginPath();
  ctx.roundRect(-13, 36, 11, 10, 4);
  ctx.roundRect(2, 36, 11, 10, 4);
  ctx.fill();
  ctx.fillStyle = "#91d9de";
  ctx.fillRect(-12, 43, 10, 3);
  ctx.fillRect(3, 43, 10, 3);

  const coat = ctx.createLinearGradient(-14, 15, 14, 43);
  coat.addColorStop(0, "#31b9b0");
  coat.addColorStop(1, "#237a91");
  ctx.fillStyle = coat;
  ctx.beginPath();
  ctx.roundRect(-14, 16, 28, 25, 8);
  ctx.fill();
  ctx.fillStyle = "#f5d278";
  ctx.fillRect(-2, 20, 4, 18);
  ctx.fillStyle = "#e8a65f";
  ctx.beginPath();
  ctx.arc(-11, 28, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f5d278";
  ctx.fillRect(3, 25, 5, 3);

  ctx.fillStyle = "#f4bd85";
  ctx.beginPath();
  ctx.arc(1, 12, 13, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#242b49";
  ctx.beginPath();
  ctx.moveTo(-12, 10);
  ctx.lineTo(-10, -2);
  ctx.lineTo(-3, 2);
  ctx.lineTo(3, -4);
  ctx.lineTo(11, 1);
  ctx.lineTo(14, 10);
  ctx.lineTo(8, 8);
  ctx.lineTo(4, 5);
  ctx.lineTo(-4, 9);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#fff0cd";
  ctx.beginPath();
  ctx.roundRect(-10, 8, 18, 10, [2, 4, 5, 2]);
  ctx.fill();
  ctx.fillStyle = "#28314f";
  ctx.beginPath();
  ctx.arc(5, 12, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e68270";
  ctx.beginPath();
  ctx.moveTo(-9, 19);
  ctx.lineTo(3, 21);
  ctx.lineTo(8, 19);
  ctx.lineTo(4, 25);
  ctx.lineTo(-7, 23);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#efc75f";
  ctx.beginPath();
  ctx.moveTo(-7, 0);
  ctx.lineTo(0, -9);
  ctx.lineTo(8, 0);
  ctx.lineTo(4, 2);
  ctx.lineTo(0, -3);
  ctx.lineTo(-4, 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawGoal() {
  const x = WORLD_WIDTH - 155 - cameraX;
  ctx.fillStyle = "rgba(255, 206, 133, .15)";
  ctx.beginPath();
  ctx.arc(x + 5, 382, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d9e5ec";
  ctx.fillRect(x, 365, 6, 105);
  ctx.fillStyle = "#fff0c9";
  ctx.fillRect(x + 1, 365, 2, 105);
  ctx.fillStyle = "#ec6f76";
  ctx.beginPath();
  ctx.moveTo(x + 6, 368);
  ctx.lineTo(x + 57, 379);
  ctx.lineTo(x + 47, 391);
  ctx.lineTo(x + 6, 400);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ffd875";
  ctx.beginPath();
  ctx.arc(x + 3, 363, 7, 0, Math.PI * 2);
  ctx.fill();
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

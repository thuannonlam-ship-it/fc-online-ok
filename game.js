
import * as THREE from
  'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const loading = document.getElementById('loading');
const statusBox = document.getElementById('status');
const scoreBox = document.getElementById('score');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8bc4e8);
scene.fog = new THREE.Fog(0x8bc4e8, 60, 120);

const camera = new THREE.PerspectiveCamera(
  48, innerWidth / innerHeight, 0.1, 200
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x42613b, 2));

const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(-12, 25, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

function block(w, h, d, color, x, y, z, parent = scene) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: 0.82 })
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function fieldLine(w, h, x, z) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0.015, z);
  scene.add(mesh);
}

// Sân cỏ
block(34, 0.3, 50, 0x247a36, 0, -0.2, 0);

for (let i = 0; i < 10; i++) {
  block(
    33.8, 0.015, 5,
    i % 2 ? 0x2b843d : 0x328b43,
    0, -0.035, -22.5 + i * 5
  );
}

// Vạch sân
fieldLine(32, 0.12, 0, -24);
fieldLine(32, 0.12, 0, 24);
fieldLine(0.12, 48, -16, 0);
fieldLine(0.12, 48, 16, 0);
fieldLine(32, 0.1, 0, 0);

const centerCircle = new THREE.Mesh(
  new THREE.RingGeometry(4.7, 4.85, 64),
  new THREE.MeshBasicMaterial({
    color: 0xffffff, side: THREE.DoubleSide
  })
);
centerCircle.rotation.x = -Math.PI / 2;
centerCircle.position.y = 0.02;
scene.add(centerCircle);

// Hai vòng cấm địa và khung thành
for (const side of [-1, 1]) {
  fieldLine(16, 0.1, 0, side * 16);
  fieldLine(0.1, 12, -8, side * 18);
  fieldLine(0.1, 12, 8, side * 18);
  fieldLine(16, 0.1, 0, side * 12);

  const gz = side * 24.5;
  block(0.18, 2.6, 0.18, 0xffffff, -3.6, 1.3, gz);
  block(0.18, 2.6, 0.18, 0xffffff, 3.6, 1.3, gz);
  block(7.3, 0.18, 0.18, 0xffffff, 0, 2.6, gz);

  // Lưới khung thành
  for (let x = -3; x <= 3; x++) {
    block(0.025, 2.2, 0.025, 0xd5e5e8,
      x, 1.15, gz + side * 0.6);
  }
  for (let y = 0.3; y < 2.4; y += 0.4) {
    block(7, 0.025, 0.025, 0xd5e5e8,
      0, y, gz + side * 0.6);
  }
}

function createPlayer(color, x, z, isUser = false) {
  const group = new THREE.Group();

  const shirt = new THREE.MeshStandardMaterial({ color });
  const skin = new THREE.MeshStandardMaterial({ color: 0xe6b18b });
  const shorts = new THREE.MeshStandardMaterial({ color: 0x182333 });

  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.4, 0.55, 4, 8), shirt
  );
  torso.position.y = 1.25;
  group.add(torso);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 16, 12), skin
  );
  head.position.y = 2;
  group.add(head);

  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.13, 0.48, 3, 6), shorts
    );
    leg.position.set(side * 0.2, 0.43, 0);
    group.add(leg);
  }

  group.position.set(x, 0, z);
  group.userData.isUser = isUser;
  group.traverse(obj => {
    if (obj.isMesh) obj.castShadow = true;
  });
  scene.add(group);
  return group;
}

const player = createPlayer(0x168bff, 0, 8, true);

const teammates = [
  createPlayer(0x168bff, -5, 4),
  createPlayer(0x168bff, 5, 4),
  createPlayer(0x168bff, -4, -4),
  createPlayer(0x168bff, 4, -4)
];

const enemies = [
  createPlayer(0xe63946, -4, -8),
  createPlayer(0xe63946, 4, -8),
  createPlayer(0xe63946, -7, 0),
  createPlayer(0xe63946, 7, 0),
  createPlayer(0xe63946, 0, -15)
];

// Bóng
const ball = new THREE.Mesh(
  new THREE.SphereGeometry(0.32, 24, 16),
  new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55 })
);
ball.position.set(0, 0.33, 6.8);
ball.castShadow = true;
scene.add(ball);

const keys = {};
const ballVelocity = new THREE.Vector3();
let blueScore = 0;
let redScore = 0;
let lastKick = 0;
let statusUntil = 0;
let lastTime = performance.now();

function say(text) {
  statusBox.textContent = text;
  statusUntil = performance.now() + 1800;
}

function updateScore() {
  scoreBox.textContent = `XANH ${blueScore} - ${redScore} ĐỎ`;
}

function resetBall() {
  player.position.set(0, 0, 8);
  ball.position.set(0, 0.33, 6.8);
  ballVelocity.set(0, 0, 0);
}

addEventListener('keydown', event => {
  const key = event.key.toLowerCase();
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
    event.preventDefault();
  }
  keys[key] = true;

  if (key === 'r') {
    resetBall();
    say('Bóng đã về giữa sân');
  }

  if (key === ' ' && performance.now() - lastKick > 450) {
    lastKick = performance.now();

    if (player.position.distanceTo(ball.position) < 2.2) {
      // Hướng sút về khung thành đỏ
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyAxisAngle(
        new THREE.Vector3(0, 1, 0), player.rotation.y
      );
      ballVelocity.x = direction.x * 0.25;
      ballVelocity.z = direction.z * 0.25 - 0.75;
      ballVelocity.y = 0.2;
      say('SÚT BÓNG!');
    } else {
      say('Hãy đến gần bóng để sút!');
    }
  }
});

addEventListener('keyup', event => {
  keys[event.key.toLowerCase()] = false;
});

function animate(now) {
  requestAnimationFrame(animate);

  const dt = Math.min((now - lastTime) / 1000, 0.035);
  lastTime = now;

  let dx = 0;
  let dz = 0;

  if (keys.w || keys.arrowup) dz -= 1;
  if (keys.s || keys.arrowdown) dz += 1;
  if (keys.a || keys.arrowleft) dx -= 1;
  if (keys.d || keys.arrowright) dx += 1;

  const moving = dx !== 0 || dz !== 0;

  if (moving) {
    const length = Math.hypot(dx, dz);
    dx /= length;
    dz /= length;
    player.position.x += dx * 7 * dt;
    player.position.z += dz * 7 * dt;
    player.rotation.y = Math.atan2(-dx, -dz);
  }

  player.position.x = THREE.MathUtils.clamp(player.position.x, -15, 15);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -23, 23);

  // Rê bóng khi bóng gần cầu thủ
  const closeToBall = player.position.distanceTo(ball.position) < 1.55;

  if (closeToBall && ball.position.y < 0.9) {
    if (moving) {
      ball.position.x += dx * 4.8 * dt;
      ball.position.z += dz * 4.8 * dt;
    }
  }

  // Vật lý bóng đơn giản
  ball.position.x += ballVelocity.x;
  ball.position.z += ballVelocity.z;
  ball.position.y += ballVelocity.y;
  ballVelocity.y -= 0.012;

  if (ball.position.y < 0.32) {
    ball.position.y = 0.32;
    ballVelocity.y = Math.abs(ballVelocity.y) > 0.05
      ? Math.abs(ballVelocity.y) * 0.4 : 0;
  }

  ballVelocity.x *= 0.985;
  ballVelocity.z *= 0.985;

  if (Math.abs(ball.position.x) > 15.7) {
    ball.position.x = Math.sign(ball.position.x) * 15.7;
    ballVelocity.x *= -0.6;
  }

  // Bàn thắng: xanh tấn công khung thành ở z âm
  if (Math.abs(ball.position.z) > 24 &&
      Math.abs(ball.position.x) < 3.6 &&
      ball.position.y < 2.6) {
    if (ball.position.z < 0) blueScore++;
    else redScore++;

    updateScore();
    say('VÀO!!!');
    resetBall();
  } else if (Math.abs(ball.position.z) > 23.8) {
    ball.position.z = Math.sign(ball.position.z) * 23.8;
    ballVelocity.z *= -0.55;
  }

  // Đối thủ đuổi theo bóng
  enemies.forEach((enemy, i) => {
    const targetX = ball.position.x * 0.65;
    const targetZ = ball.position.z - 2;
    const dir = new THREE.Vector3(
      targetX - enemy.position.x,
      0,
      targetZ - enemy.position.z
    );

    if (dir.length() > 0.5) {
      dir.normalize();
      enemy.position.addScaledVector(dir, (1.1 + i * 0.12) * dt);
      enemy.rotation.y = Math.atan2(-dir.x, -dir.z);
    }

    if (enemy.position.distanceTo(ball.position) < 1 &&
        Math.random() < 0.015) {
      ballVelocity.z = 0.18;
      say('Đối thủ đang tranh bóng!');
    }
  });

  // Camera nhìn từ sau cầu thủ
  const cameraPosition = new THREE.Vector3(
    player.position.x * 0.4,
    9,
    player.position.z + 15
  );
  camera.position.lerp(cameraPosition, 0.08);
  camera.lookAt(
    player.position.x,
    0,
    player.position.z - 4
  );

  if (performance.now() > statusUntil) {
    statusBox.textContent = 'WASD: Chạy | SPACE: Sút';
  }

  renderer.render(scene, camera);
}

camera.position.set(0, 9, 23);
loading.style.display = 'none';
requestAnimationFrame(animate);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/loaders/GLTFLoader.js';

const isMobile = /Mobi|Android/i.test(navigator.userAgent);
const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const detailMultiplier = 0.8;
const maxPixelRatio = 0.8;

const preloadOverlay = document.getElementById('preload-overlay');
const PRELOAD_TIMEOUT_MS = 12000;
const preloadState = { heart: false, photos: false };
let preloadDone = false;
const preloadFailsafe = setTimeout(() => hidePreloadOverlay(true), PRELOAD_TIMEOUT_MS);

function hidePreloadOverlay(force = false) {
  if (preloadDone) return;
  const allReady = Object.values(preloadState).every(Boolean);
  if (!force && !allReady) return;
  preloadDone = true;
  clearTimeout(preloadFailsafe);
  preloadOverlay?.classList.add('preload--done');
  document.body?.classList.add('scene-primed');
  setTimeout(() => preloadOverlay?.remove(), 900);
}

function markPreloadReady(key) {
  if (preloadState[key]) return;
  preloadState[key] = true;
  hidePreloadOverlay(false);
}

const canvas = document.getElementById('galaxy-canvas');
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x010007, 1);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x02010c, 0.004);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 32, 130);
scene.add(camera);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.autoRotate = true;
controls.autoRotateSpeed = prefersReducedMotion ? 0 : 0.3;
controls.minDistance = 40;
controls.maxDistance = 220;

scene.add(new THREE.AmbientLight(0xffe2ff, 0.5));
const keyLight = new THREE.PointLight(0xff9fd8, 2, 400);
keyLight.position.set(0, 20, 0);
scene.add(keyLight);

const galaxyGroup = new THREE.Group();
galaxyGroup.visible = false;
galaxyGroup.scale.setScalar(0.001);
scene.add(galaxyGroup);

const heartShape = new THREE.Shape();
heartShape.moveTo(0, 5.5);
heartShape.bezierCurveTo(0, 8.5, -6, 8.2, -6, 3.7);
heartShape.bezierCurveTo(-6, -1, -1.8, -3.5, 0, -6.8);
heartShape.bezierCurveTo(1.8, -3.5, 6, -1, 6, 3.7);
heartShape.bezierCurveTo(6, 8.2, 0, 8.5, 0, 5.5);

const heartExtrude = {
  depth: 10,
  steps: 28,
  bevelEnabled: true,
  bevelThickness: 1.0,
  bevelSize: 1.4,
  bevelSegments: 32,
};
const heartGeometry = new THREE.ExtrudeGeometry(heartShape, heartExtrude);
heartGeometry.center();
heartGeometry.scale(1.6, 1.6, 1.3);
heartGeometry.computeVertexNormals?.();

const coreMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xff64c6,
  emissive: 0xff1ea5,
  emissiveIntensity: 0.85,
  roughness: 0.15,
  metalness: 0.05,
  transmission: 0.75,
  thickness: 2.3,
  clearcoat: 1,
  clearcoatRoughness: 0.25,
});

const core = new THREE.Group();
scene.add(core);

const innerHeartLight = new THREE.PointLight(0xff8df5, 3, 160, 2);
innerHeartLight.position.set(0, 0, 0);

function useFallbackHeart() {
  const fallback = new THREE.Mesh(heartGeometry, coreMaterial);
  fallback.geometry.computeVertexNormals?.();
  core.add(fallback);
  core.add(innerHeartLight);
  markPreloadReady('heart');
}

const loader = new GLTFLoader();
loader.load(
  'assets/models/heart.glb',
  (gltf) => {
    const model = gltf.scene || gltf.scenes?.[0];
    if (!model) {
      useFallbackHeart();
      return;
    }
    model.traverse((child) => {
      if (child.isMesh) {
        try {
          child.material = coreMaterial.clone();
        } catch (e) {}
        child.material.side = THREE.DoubleSide;
        child.material.needsUpdate = true;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const desiredMax = 14;
    const scaleFactor = (desiredMax / maxDim) * 1.0;
    model.scale.multiplyScalar(scaleFactor);
    box.setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    model.rotation.set(0, 0, 0);
    core.add(model);
    core.add(innerHeartLight);
    markPreloadReady('heart');
  },
  undefined,
  (err) => {
    console.error('GLTF load error:', err);
    useFallbackHeart();
  }
);

const rings = [];
[28, 42, 58].forEach((radius, index) => {
  const torus = new THREE.Mesh(
    new THREE.TorusGeometry(
      radius,
      0.6 + index * 0.1,
      24,
      Math.max(120, Math.round(140 * detailMultiplier))
    ),
    new THREE.MeshBasicMaterial({ color: 0xffb4e5, transparent: true, opacity: 0.25 - index * 0.05 })
  );
  torus.rotation.x = Math.PI / 2;
  torus.rotation.z = index * 0.45;
  torus.userData = {
    baseX: torus.rotation.x,
    baseY: torus.rotation.y,
    tiltAmp: 0.12 + index * 0.045,
    tiltSpeed: 0.35 + index * 0.22,
    phase: Math.random() * Math.PI * 2,
    spinDir: Math.random() > 0.5 ? 1 : -1,
    currentScale: 0.1,
  };
  galaxyGroup.add(torus);
  rings.push(torus);
});

const starCount = Math.max(900, Math.round(1300 * detailMultiplier));
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i += 1) {
  const radius = THREE.MathUtils.randFloat(60, 320);
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
  starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
  starPositions[i * 3 + 1] = radius * Math.cos(phi);
  starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
}
const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

const phases = new Float32Array(starCount);
const speeds = new Float32Array(starCount);
const sizes = new Float32Array(starCount);
for (let i = 0; i < starCount; i += 1) {
  phases[i] = Math.random() * Math.PI * 2;
  speeds[i] = THREE.MathUtils.randFloat(0.6, 2.0);
  sizes[i] = THREE.MathUtils.randFloat(0.05, 0.22);
}
starGeometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
starGeometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
starGeometry.setAttribute('sizeBase', new THREE.BufferAttribute(sizes, 1));

const starMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    pixelRatio: { value: Math.max(1, Math.min(window.devicePixelRatio, 2)) },
    color: { value: new THREE.Color(0xffffff) },
    burst: { value: 0 },
  },
  vertexShader: `
    attribute float phase;
    attribute float speed;
    attribute float sizeBase;
    uniform float time;
    uniform float pixelRatio;
    uniform float burst;
    varying float vAlpha;
    void main() {
      float b = 0.5 + 0.5 * sin(time * speed + phase);
      b = mix(0.6, 1.0, b);
      vAlpha = b * (1.0 + burst);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      float size = sizeBase * (0.9 + (80.0 / max(1.0, -mvPosition.z))) * b * pixelRatio * 0.0006;
      gl_PointSize = clamp(size, 0.2, 3.0);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    varying float vAlpha;
    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float d = length(coord);
      float spot = smoothstep(0.5, 0.0, d);
      float alpha = spot * vAlpha;
      gl_FragColor = vec4(color, alpha);
    }
  `,
  transparent: true,
  depthWrite: false,
});

const starField = new THREE.Points(starGeometry, starMaterial);
galaxyGroup.add(starField);

const textureLoader = new THREE.TextureLoader();
const photoSprites = [];
const starSquares = [];
let photoSources = [];
let nextPhotoIndex = 0;
let manifestCache = null;
let galaxyActivated = false;
let galaxyReveal = 0;
let explosionBoost = 0;
const recentPulseTimes = [];

async function loadPhotoManifest() {
  if (manifestCache) return manifestCache;
  const manifestCandidates = [
    { url: 'assets/photos-new/manifest.json', basePath: 'assets/photos-new/' },
    { url: 'assets/photos/manifest.json', basePath: 'assets/photos/' },
  ];

  for (const { url, basePath } of manifestCandidates) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        if (res.status !== 404) {
          throw new Error(`HTTP ${res.status}`);
        }
        continue;
      }
      const files = await res.json();
      if (!Array.isArray(files) || !files.length) continue;
      const resolved = files
        .filter((name) => typeof name === 'string' && name.trim())
        .map((name) => `${basePath}${name.trim().replace(/\\/g, '/')}`);
      if (resolved.length) {
        manifestCache = resolved;
        return manifestCache;
      }
    } catch (err) {
      console.warn(`Manifest load failed for ${url}:`, err);
    }
  }

  throw new Error('Photo manifests unavailable.');
}

function clearStarSquares() {
  while (starSquares.length) {
    const sq = starSquares.pop();
    galaxyGroup.remove(sq);
    try { sq.material.map?.dispose?.(); } catch (e) {}
    try { sq.material.dispose?.(); } catch (e) {}
  }
}

function createStarSquare(sprite, baseScale) {
  const mat = new THREE.SpriteMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    depthTest: false,
  });
  const square = new THREE.Sprite(mat);
  const scale = Math.max(0.8, baseScale * 0.18);
  square.scale.set(scale, scale, 1);
  square.position.copy(sprite.position);
  square.userData = {
    spriteRef: sprite,
    phase: Math.random() * Math.PI * 2,
    offsetRadius: THREE.MathUtils.randFloat(3, 10),
    offsetAngleStart: Math.random() * Math.PI * 2,
    offsetHeight: THREE.MathUtils.randFloatSpread(4),
    offsetSpin: THREE.MathUtils.randFloat(0.12, 0.45),
    baseSize: scale,
  };
  galaxyGroup.add(square);
  starSquares.push(square);
  sprite.userData.starSquare = square;
}

function applyTextureToSprite(sprite, tex, baseScale) {
  const img = tex.image;
  if (img && img.width && img.height) {
    const aspect = img.width / img.height;
    let sx = baseScale;
    let sy = baseScale;
    if (aspect >= 1) {
      sy = baseScale / aspect;
    } else {
      sx = baseScale * aspect;
    }
    sprite.scale.set(sx, sy, 1);
  } else {
    sprite.scale.set(baseScale, baseScale, 1);
  }
  sprite.material.map = tex;
  sprite.material.opacity = 1;
  sprite.material.needsUpdate = true;
  sprite.userData.baseOpacity = 1;
  const star = sprite.userData.starSquare;
  if (star) {
    star.userData.baseSize = Math.max(sprite.scale.x, sprite.scale.y) * 0.1;
  }
}

async function loadSpriteTexture(sprite, source, baseScale) {
  const tex = await textureLoader.loadAsync(source);
  try { tex.colorSpace = THREE.SRGBColorSpace; } catch (e) {}
  applyTextureToSprite(sprite, tex, baseScale);
}

async function createPhotoSpritesFromManifest() {
  clearStarSquares();
  let sources;
  try {
    sources = await loadPhotoManifest();
  } catch (err) {
    console.error('Photo manifest load failed:', err);
    markPreloadReady('photos');
    return;
  }

  photoSources = Array.from(new Set(sources));
  if (!photoSources.length) {
    markPreloadReady('photos');
    return;
  }

  const deviceLimit = isMobile ? 60 : 200;
  const maxToCreate = Math.max(12, Math.min(deviceLimit, Math.round(photoSources.length * detailMultiplier)));
  nextPhotoIndex = photoSources.length ? maxToCreate % photoSources.length : 0;

  const readyGoal = Math.min(maxToCreate, Math.max(4, Math.round(maxToCreate * 0.35)));
  let readyCount = 0;
  let photosSignaled = readyGoal === 0;
  if (photosSignaled) markPreloadReady('photos');

  const signalReady = () => {
    if (photosSignaled) return;
    readyCount += 1;
    if (readyCount >= readyGoal) {
      photosSignaled = true;
      markPreloadReady('photos');
    }
  };

  for (let i = 0; i < maxToCreate; i += 1) {
    const source = photoSources[i % photoSources.length];
    const placeholderMat = new THREE.SpriteMaterial({ color: 0xffffff, transparent: true, depthWrite: false, opacity: 0 });
    const sprite = new THREE.Sprite(placeholderMat);
    const radius = THREE.MathUtils.randFloat(30, 90);
    const angle = Math.random() * Math.PI * 2;
    const height = THREE.MathUtils.randFloatSpread(28);
    const baseScale = THREE.MathUtils.randFloat(8, 14) * detailMultiplier;
    sprite.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
    sprite.scale.set(baseScale * 0.5, baseScale * 0.5, 1);
    sprite.userData = {
      radius,
      baseRadius: radius,
      targetRadius: radius,
      angle,
      height,
      wobblePhase: Math.random() * Math.PI * 2,
      speed: THREE.MathUtils.randFloat(0.0008, 0.0025),
    };
    galaxyGroup.add(sprite);
    photoSprites.push(sprite);
    createStarSquare(sprite, baseScale);

    loadSpriteTexture(sprite, source, baseScale)
      .then(() => signalReady())
      .catch((err) => {
        console.warn('Texture load failed:', err);
        signalReady();
      });
  }

  if (photoSources.length > photoSprites.length) {
    const SWAP_INTERVAL_MS = 2200;
    setInterval(() => {
      if (!photoSprites.length) return;
      const sprite = photoSprites[Math.floor(Math.random() * photoSprites.length)];
      const src = photoSources[nextPhotoIndex % photoSources.length];
      nextPhotoIndex += 1;
      textureLoader.loadAsync(src)
        .then((newTex) => {
          try { newTex.colorSpace = THREE.SRGBColorSpace; } catch (e) {}
          const oldMap = sprite.material.map;
          const base = Math.max(sprite.scale.x, sprite.scale.y) || 10;
          applyTextureToSprite(sprite, newTex, base);
          try { oldMap?.dispose?.(); } catch (e) {}
        })
        .catch((err) => console.warn('Texture swap failed:', err));
    }, SWAP_INTERVAL_MS);
  }

  setTimeout(() => {
    if (!photosSignaled) {
      photosSignaled = true;
      markPreloadReady('photos');
    }
  }, 9000);
}

createPhotoSpritesFromManifest();

function triggerGalaxyReveal() {
  if (galaxyActivated) return;
  galaxyActivated = true;
  galaxyReveal = 0;
  galaxyGroup.visible = true;
  galaxyGroup.scale.setScalar(0.05);
  amplifyBurst(1.2);
}

function amplifyBurst(multiplier = 1) {
  explosionBoost = Math.min(1.6, explosionBoost + 0.9 * multiplier);
  photoSprites.forEach((sprite) => {
    const extra = THREE.MathUtils.randFloat(12, 36) * multiplier;
    const ceiling = sprite.userData.baseRadius + 160;
    sprite.userData.targetRadius = Math.min(sprite.userData.radius + extra, ceiling);
  });
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

const pulseButton = document.getElementById('pulse-btn');
let pulseStrength = 0;
pulseButton?.addEventListener('click', () => {
  const now = performance.now();
  pulseStrength = Math.min(pulseStrength + 0.95, 5);
  recentPulseTimes.push(now);
  while (recentPulseTimes.length && now - recentPulseTimes[0] > 1300) {
    recentPulseTimes.shift();
  }
  if (!galaxyActivated && recentPulseTimes.length >= 4) {
    triggerGalaxyReveal();
  } else if (galaxyActivated && recentPulseTimes.length >= 3) {
    amplifyBurst();
  }
});

const clock = new THREE.Clock();
let elapsedTime = 0;
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  elapsedTime += delta;
  const pulseBoost = 1 + pulseStrength * 2.4;

  if (!galaxyActivated && preloadDone) {
    const idlePulse = 1 + Math.sin(elapsedTime * 1.1) * 0.06;
    core.scale.set(idlePulse, idlePulse, idlePulse);
  }

  if (galaxyActivated) {
    galaxyReveal = Math.min(1, galaxyReveal + delta * 0.6);
    const revealEase = easeOutCubic(galaxyReveal);
    galaxyGroup.visible = true;
    galaxyGroup.scale.setScalar(THREE.MathUtils.lerp(0.05, 1, revealEase));
    galaxyGroup.rotation.y += delta * 0.06 * (1 + explosionBoost);
    explosionBoost = Math.max(0, explosionBoost - delta * 0.35);
    starMaterial.uniforms.burst.value = explosionBoost;

    rings.forEach((ring, idx) => {
      const target = 1 + explosionBoost * (0.2 + idx * 0.05);
      ring.scale.setScalar(THREE.MathUtils.lerp(ring.userData.currentScale ?? 0.1, target, delta * 6));
      ring.userData.currentScale = ring.scale.x;
    });
  }

  const heartbeat = 1 + Math.sin(elapsedTime * 1.4) * (0.07 + pulseStrength * 0.25);
  core.scale.set(heartbeat, heartbeat, heartbeat);
  core.rotation.y += 0.1 * delta * pulseBoost;

  rings.forEach((ring, idx) => {
    const data = ring.userData || {};
    const spinDir = data.spinDir ?? 1;
    const baseX = data.baseX ?? Math.PI / 2;
    const baseY = data.baseY ?? 0;
    const tiltAmp = data.tiltAmp ?? 0.1;
    const tiltSpeed = data.tiltSpeed ?? 0.4;
    const phase = data.phase ?? 0;
    const scaleFactor = galaxyActivated ? Math.max(0.2, ring.userData.currentScale ?? 1) : 0;
    ring.rotation.z += 0.045 * delta * (idx + 1) * pulseBoost * spinDir * scaleFactor;
    ring.rotation.x = baseX + Math.sin(elapsedTime * tiltSpeed + phase) * tiltAmp * scaleFactor;
    ring.rotation.y = baseY + Math.cos(elapsedTime * tiltSpeed * 0.8 + phase) * tiltAmp * 0.6 * scaleFactor;
  });

  starField.rotation.y += 0.002 * delta;
  try { starMaterial.uniforms.time.value = elapsedTime; } catch (e) {}

  const wobbleTime = performance.now() * 0.0002;
  photoSprites.forEach((sprite) => {
    if (galaxyActivated) {
      sprite.userData.radius = THREE.MathUtils.lerp(
        sprite.userData.radius,
        sprite.userData.targetRadius ?? sprite.userData.baseRadius,
        delta * (0.8 + explosionBoost)
      );
      sprite.material.opacity = THREE.MathUtils.lerp(sprite.material.opacity, sprite.userData.baseOpacity ?? 1, delta * 2.5);
    } else {
      sprite.material.opacity = 0;
    }
    sprite.userData.angle += sprite.userData.speed * pulseBoost;
    sprite.position.x = Math.cos(sprite.userData.angle) * sprite.userData.radius;
    sprite.position.z = Math.sin(sprite.userData.angle) * sprite.userData.radius;
    sprite.position.y = sprite.userData.height + Math.sin(sprite.userData.wobblePhase + wobbleTime) * 3;
    const square = sprite.userData.starSquare;
    if (square) {
      const visibility = galaxyActivated ? 1 : 0;
      const phase = square.userData.phase ?? 0;
      const flicker = 0.35 + Math.sin(elapsedTime * 2.1 + phase) * 0.3;
      square.material.opacity = visibility * THREE.MathUtils.clamp(flicker, 0.1, 0.9);
      const offsetRadius = square.userData.offsetRadius ?? 5;
      const offsetSpin = square.userData.offsetSpin ?? 0.3;
      const offsetAngle = (square.userData.offsetAngleStart ?? 0) + elapsedTime * offsetSpin;
      const offsetHeight = square.userData.offsetHeight ?? 0;
      square.position.set(
        sprite.position.x + Math.cos(offsetAngle) * offsetRadius,
        sprite.position.y + offsetHeight + Math.sin(elapsedTime * 1.7 + phase) * 0.7,
        sprite.position.z + Math.sin(offsetAngle) * offsetRadius
      );
      const fallbackBase = Math.max(sprite.scale.x, sprite.scale.y) || 6;
      const baseSize = square.userData.baseSize ?? fallbackBase * 0.12;
      const sqSize = THREE.MathUtils.clamp(baseSize * (0.85 + Math.sin(elapsedTime * 2.5 + phase) * 0.18), 0.6, 2.0);
      square.scale.set(sqSize, sqSize, 1);
    }
  });

  pulseStrength = Math.max(0, pulseStrength - delta * 0.4);
  controls.autoRotateSpeed = prefersReducedMotion ? 0 : 0.6 + pulseStrength * 1.5;
  controls.update();
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  const { innerWidth, innerHeight } = window;
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  try { starMaterial.uniforms.pixelRatio.value = Math.max(1, Math.min(window.devicePixelRatio, 2)); } catch (e) {}
});

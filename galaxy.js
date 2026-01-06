import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const isMobile = /Mobi|Android/i.test(navigator.userAgent);
const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const detailMultiplier = 0.8;   // 0.5-0.8 pro low, ~1 pro default
const maxPixelRatio = 0.8; 

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
controls.autoRotateSpeed = 0.3;
controls.minDistance = 40;
controls.maxDistance = 220;

scene.add(new THREE.AmbientLight(0xffe2ff, 0.5));
const keyLight = new THREE.PointLight(0xff9fd8, 2, 400);
keyLight.position.set(0, 20, 0);
scene.add(keyLight);

const heartShape = new THREE.Shape();
heartShape.moveTo(0, 5.5);
heartShape.bezierCurveTo(0, 8.5, -6, 8.2, -6, 3.7);
heartShape.bezierCurveTo(-6, -1, -1.8, -3.5, 0, -6.8);
heartShape.bezierCurveTo(1.8, -3.5, 6, -1, 6, 3.7);
heartShape.bezierCurveTo(6, 8.2, 0, 8.5, 0, 5.5);

const heartExtrude = {
  depth: 6,
  steps: 2,
  bevelEnabled: true,
  bevelThickness: 1.4,
  bevelSize: 1.2,
  bevelSegments: 16,
};
const heartGeometry = new THREE.ExtrudeGeometry(heartShape, heartExtrude);
heartGeometry.center();
heartGeometry.scale(1.6, 1.6, 1.3);
heartGeometry.rotateX(Math.PI);
const coreMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xff64c6,
  emissive: 0xff1ea5,
  emissiveIntensity: 1.15,
  roughness: 0.15,
  metalness: 0.05,
  transmission: 0.75,
  thickness: 2.3,
  clearcoat: 1,
  clearcoatRoughness: 0.25,
});
const core = new THREE.Mesh(heartGeometry, coreMaterial);
scene.add(core);

const innerHeartLight = new THREE.PointLight(0xff8df5, 3, 160, 2);
innerHeartLight.position.set(0, 0, 0);
core.add(innerHeartLight);

const glowTexture = new THREE.TextureLoader().load('https://cdn.jsdelivr.net/gh/mrdoob/three.js@r162/examples/textures/sprites/glow.png');
const glowMaterial = new THREE.SpriteMaterial({
  map: glowTexture,
  color: 0xff6fcb,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});
glowMaterial.opacity = 0.85;
const glow = new THREE.Sprite(glowMaterial);
const glowBaseScale = { x: 95, y: 95 };
glow.scale.set(glowBaseScale.x, glowBaseScale.y, 1);
glow.position.set(0, 0, 0);
scene.add(glow);


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
  };
  scene.add(torus);
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
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1.1, sizeAttenuation: true });
const starField = new THREE.Points(starGeometry, starMaterial);
scene.add(starField);

const textureLoader = new THREE.TextureLoader();
const photoSprites = [];
let photoSources = [];
let nextPhotoIndex = 0;

async function loadPhotoManifest() {
  try {
    const resp = await fetch('assets/photos/manifest.json', { cache: 'no-cache' });
    if (!resp.ok) throw new Error('Manifest fetch failed');
    const list = await resp.json();
    if (!Array.isArray(list) || list.length === 0) throw new Error('Empty manifest');
    return list.filter(f => /\.(jpe?g|png|gif|webp)$/i.test(f)).map(f => `assets/photos/${f}`);
  } catch (e) {
    return ['assets/ahoj.gif', 'assets/smutny.gif', 'assets/ahoj.gif', 'assets/smutny.gif'];
  }
}

async function createPhotoSpritesFromManifest() {
  const sources = await loadPhotoManifest();
  // dedupe and normalize
  const unique = Array.from(new Set(sources));
  photoSources = unique;

  // Determine how many sprites to create while keeping performance in mind
  const deviceLimit = isMobile ? 60 : 200;
  const maxToCreate = Math.max(12, Math.min(deviceLimit, Math.round(photoSources.length * detailMultiplier)));
  nextPhotoIndex = maxToCreate % photoSources.length;
  for (let i = 0; i < maxToCreate; i += 1) {
    const source = photoSources[i % photoSources.length];
    // create sprite with a lightweight placeholder material until the image loads
    const placeholderMat = new THREE.SpriteMaterial({ color: 0xffffff, transparent: true, depthWrite: false, opacity: 0 });
    const sprite = new THREE.Sprite(placeholderMat);
    const radius = THREE.MathUtils.randFloat(30, 90);
    const angle = Math.random() * Math.PI * 2;
    const height = THREE.MathUtils.randFloatSpread(28);
    const baseScale = THREE.MathUtils.randFloat(8, 14) * detailMultiplier;
    sprite.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
    // set a small initial scale until texture arrives
    sprite.scale.set(baseScale * 0.5, baseScale * 0.5, 1);
    sprite.userData = {
      radius,
      angle,
      height,
      wobblePhase: Math.random() * Math.PI * 2,
      speed: THREE.MathUtils.randFloat(0.0008, 0.0025),
    };
    scene.add(sprite);
    photoSprites.push(sprite);

    // load texture and adjust sprite scale to preserve image aspect ratio
    textureLoader.load(source, (tex) => {
      try { tex.colorSpace = THREE.SRGBColorSpace; } catch (e) { /* compatibility */ }
      const img = tex.image;
      if (img && img.width && img.height) {
        const aspect = img.width / img.height;
        let sx = baseScale;
        let sy = baseScale;
        // make the longest side equal to baseScale and preserve aspect
        if (aspect >= 1) {
          sx = baseScale;
          sy = baseScale / aspect;
        } else {
          sy = baseScale;
          sx = baseScale * aspect;
        }
        sprite.scale.set(sx, sy, 1);
      } else {
        sprite.scale.set(baseScale, baseScale, 1);
      }
      sprite.material.map = tex;
      sprite.material.opacity = 1;
      sprite.material.needsUpdate = true;
    });
  }

  // If there are more photos than sprites, periodically swap textures to surface more images
  if (photoSources.length > photoSprites.length) {
    const SWAP_INTERVAL_MS = 2200; // adjust to taste
    setInterval(() => {
      // pick a random sprite to replace
      const i = Math.floor(Math.random() * photoSprites.length);
      const sprite = photoSprites[i];
      const src = photoSources[nextPhotoIndex % photoSources.length];
      nextPhotoIndex += 1;
      // load new texture and swap, disposing old texture to free memory
      textureLoader.load(src, (newTex) => {
        try { newTex.colorSpace = THREE.SRGBColorSpace; } catch (e) { /* compatibility */ }
        const oldMap = sprite.material.map;
        // try to preserve the sprite's visual base size when swapping by using the larger side
        const img = newTex.image;
        const base = Math.max(sprite.scale.x, sprite.scale.y) || 10;
        if (img && img.width && img.height) {
          const aspect = img.width / img.height;
          let sx = base;
          let sy = base;
          if (aspect >= 1) {
            sx = base;
            sy = base / aspect;
          } else {
            sy = base;
            sx = base * aspect;
          }
          sprite.scale.set(sx, sy, 1);
        }
        sprite.material.map = newTex;
        sprite.material.needsUpdate = true;
        // dispose old texture and material map if possible
        try { oldMap?.dispose?.(); } catch (e) { /* ignore */ }
      });
    }, SWAP_INTERVAL_MS);
  }
}

createPhotoSpritesFromManifest();

// (postprocessing removed)

const pulseButton = document.getElementById('pulse-btn');
let pulseStrength = 0;
pulseButton?.addEventListener('click', () => {
  pulseStrength = 1;
});

const clock = new THREE.Clock();
let elapsedTime = 0;
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  elapsedTime += delta;
  const pulseBoost = 1 + pulseStrength * 2.4;

  const heartbeat = 1 + Math.sin(elapsedTime * 1.4) * (0.07 + pulseStrength * 0.25);
  core.scale.set(heartbeat, heartbeat, heartbeat);
  core.rotation.y += 0.1 * delta * pulseBoost;

  const glowScaleFactor = 1 + Math.sin(elapsedTime * 1.3) * 0.18 + pulseStrength * 0.35;
  glow.rotation.z -= 0.03 * delta;
  glow.scale.set(glowBaseScale.x * glowScaleFactor, glowBaseScale.y * glowScaleFactor, 1);
  glow.material.opacity = THREE.MathUtils.clamp(0.55 + Math.sin(elapsedTime * 1.4) * 0.25 + pulseStrength * 0.25, 0.35, 1);
  
  rings.forEach((ring, idx) => {
    const data = ring.userData || {};
    const spinDir = data.spinDir ?? 1;
    const baseX = data.baseX ?? Math.PI / 2;
    const baseY = data.baseY ?? 0;
    const tiltAmp = data.tiltAmp ?? 0.1;
    const tiltSpeed = data.tiltSpeed ?? 0.4;
    const phase = data.phase ?? 0;
    ring.rotation.z += 0.045 * delta * (idx + 1) * pulseBoost * spinDir;
    ring.rotation.x = baseX + Math.sin(elapsedTime * tiltSpeed + phase) * tiltAmp;
    ring.rotation.y = baseY + Math.cos(elapsedTime * tiltSpeed * 0.8 + phase) * tiltAmp * 0.6;
  });

  starField.rotation.y += 0.002 * delta;

  const wobbleTime = performance.now() * 0.0002;
  photoSprites.forEach((sprite) => {
    sprite.userData.angle += sprite.userData.speed * pulseBoost;
    sprite.position.x = Math.cos(sprite.userData.angle) * sprite.userData.radius;
    sprite.position.z = Math.sin(sprite.userData.angle) * sprite.userData.radius;
    sprite.position.y = sprite.userData.height + Math.sin(sprite.userData.wobblePhase + wobbleTime) * 3;
  });

  pulseStrength = Math.max(0, pulseStrength - delta * 0.4);
  controls.autoRotateSpeed = 0.6 + pulseStrength * 1.5;
  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  const { innerWidth, innerHeight } = window;
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  
});

// Drag & drop images onto the canvas to add personal photos as sprites
// drag & drop removed

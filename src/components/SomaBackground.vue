<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { SOMA_PIECES } from '@/utils/utils';
import { SOLUTIONS, FLOATING_POSITIONS } from '@/utils/somaSolutions';
import { getSomaAnchors } from '@/composables/useSomaAnchors';

/**
 * Un único juego de piezas en un canvas fijo a pantalla completa (fondo).
 *
 *  - Sin ancla activa: las piezas flotan dispersas en el fondo.
 *  - Cuando un <SomaSpacer /> entra en su rango: las piezas viajan hasta ese
 *    espacio, se arman formando su figura y la siguen mientras se hace scroll.
 *  - Cuando el espacio sale del rango: se desarman y vuelven al fondo.
 */
const props = defineProps({
  viewSize:    { type: Number, default: 10 },   // "zoom" de la cámara (menor = figuras más grandes)
  idleOpacity: { type: Number, default: 0.5 }   // opacidad de las piezas cuando están en el fondo
});

const CUBE_SIZE = 1;
const CUBE_GAP = 0.02;
const TWO_PI = Math.PI * 2;

const ASSEMBLE_MS = 2000;
const DISASSEMBLE_MS = 1500;
const STAGGER_MS = 70;

const containerRef = ref(null);
const tweenGroup = new TWEEN.Group();

let scene, camera, renderer, cubeGroup;
let pieceGroups = [];
let rafId = null;
let lastTime = 0;
let resizeObserver = null;
let reduceMotion = false;

// Vectores de la cámara (plano de pantalla en coordenadas del mundo)
const camRight = new THREE.Vector3();
const camUp = new THREE.Vector3();

// Estado (no reactivo: solo lo usa el loop)
let state = 'floating';          // 'floating' | 'assembled'
let settled = true;              // true cuando terminaron los tweens de la transición
let currentAnchor = null;        // espacio al que estamos armados (o del que nos desarmamos)
let solution = null;

const anchorState = { weight: 0 };            // 0 = en el fondo, 1 = pegado al espacio vacío
const anchorOffset = new THREE.Vector3();     // dónde está el espacio vacío, en unidades del mundo
const anchorTarget = new THREE.Vector3();
const solutionCenters = new Map();

const disposables = [];

/* ───────────────────────── Escena ───────────────────────── */

function updateCamera(width, height) {
  const aspect = width / height;
  const d = props.viewSize;
  camera.left = -d * aspect;
  camera.right = d * aspect;
  camera.top = d;
  camera.bottom = -d;
  camera.updateProjectionMatrix();
}

function initScene() {
  const el = containerRef.value;
  const width = el.clientWidth;
  const height = el.clientHeight;

  scene = new THREE.Scene();

  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
  camera.position.set(15, 15, 15);
  camera.lookAt(0, 0, 0);
  updateCamera(width, height);
  camera.updateMatrixWorld(true);
  camera.matrixWorld.extractBasis(camRight, camUp, new THREE.Vector3());

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.opacity = String(props.idleOpacity);
  el.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));

  const dl1 = new THREE.DirectionalLight(0xffffff, 0.8);
  dl1.position.set(10, 20, 10);
  scene.add(dl1);

  const dl2 = new THREE.DirectionalLight(0xffffff, 0.4);
  dl2.position.set(-10, -20, -10);
  scene.add(dl2);

  cubeGroup = new THREE.Group();
  scene.add(cubeGroup);
}

function createPieces() {
  const boxGeo = new THREE.BoxGeometry(
    CUBE_SIZE - CUBE_GAP,
    CUBE_SIZE - CUBE_GAP,
    CUBE_SIZE - CUBE_GAP
  );
  const edgesGeo = new THREE.EdgesGeometry(boxGeo);
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x000000 });
  disposables.push(boxGeo, edgesGeo, edgeMat);

  Object.keys(SOMA_PIECES).forEach((key, index) => {
    const data = SOMA_PIECES[key];
    const fp = FLOATING_POSITIONS[index];

    const material = new THREE.MeshStandardMaterial({
      color: data.color,
      roughness: 0.3,
      metalness: 0.1
    });
    disposables.push(material);

    const group = new THREE.Group();

    data.cubes.forEach(cube => {
      const mesh = new THREE.Mesh(boxGeo, material);
      mesh.position.set(cube.x * CUBE_SIZE, cube.y * CUBE_SIZE, cube.z * CUBE_SIZE);
      mesh.add(new THREE.LineSegments(edgesGeo, edgeMat));
      group.add(mesh);
    });

    const center = new THREE.Box3().setFromObject(group).getCenter(new THREE.Vector3());
    group.children.forEach(child => child.position.sub(center));

    group.position.set(fp.x, fp.y, fp.z);
    group.rotation.set(fp.rx, fp.ry, fp.rz);
    group.userData = { key, floatingPos: { ...fp } };

    pieceGroups.push(group);
    cubeGroup.add(group);
  });
}

// Centro geométrico de una solución (misma lógica que en SomaCube.vue)
function getSolutionCenter(figure) {
  if (solutionCenters.has(figure)) return solutionCenters.get(figure);

  const sol = SOLUTIONS[figure];
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  Object.keys(sol).forEach(key => {
    const { pos, rot } = sol[key];
    const euler = new THREE.Euler(rot[0], rot[1], rot[2]);

    SOMA_PIECES[key].cubes.forEach(cube => {
      const v = new THREE.Vector3(cube.x, cube.y, cube.z).applyEuler(euler);
      const wx = pos[0] + v.x;
      const wy = pos[1] + v.y;
      const wz = pos[2] + v.z;

      minX = Math.min(minX, wx); maxX = Math.max(maxX, wx);
      minY = Math.min(minY, wy); maxY = Math.max(maxY, wy);
      minZ = Math.min(minZ, wz); maxZ = Math.max(maxZ, wz);
    });
  });

  const center = new THREE.Vector3(
    (minX + maxX) / 2,
    (minY + maxY) / 2,
    (minZ + maxZ) / 2
  );
  solutionCenters.set(figure, center);
  return center;
}

/* ───────────────────────── Transiciones ───────────────────────── */

const ms = value => (reduceMotion ? 1 : value);

function shortestAngle(from, to) {
  const wrapped = ((((from - to + Math.PI) % TWO_PI) + TWO_PI) % TWO_PI) - Math.PI;
  return to + wrapped;
}

function tweenTo(target, values, duration, delay, onDone) {
  new TWEEN.Tween(target, tweenGroup)
    .to(values, duration)
    .delay(delay)
    .easing(TWEEN.Easing.Cubic.InOut)
    .onComplete(onDone)
    .start();
}

function assemble(anchor) {
  const sol = SOLUTIONS[anchor.figure];
  if (!sol) {
    console.warn(`[SomaBackground] Figura desconocida: "${anchor.figure}"`);
    return;
  }

  solution = sol;
  currentAnchor = anchor;
  state = 'assembled';
  settled = false;
  tweenGroup.removeAll();   // interrumpe cualquier transición en curso

  const center = getSolutionCenter(anchor.figure);

  let pending = pieceGroups.length * 2 + 1;
  const done = () => { if (--pending === 0) settled = true; };

  // El grupo se "pega" poco a poco al espacio vacío
  tweenTo(anchorState, { weight: 1 }, ms(ASSEMBLE_MS), 0, done);

  pieceGroups.forEach((group, i) => {
    const t = solution[group.userData.key];
    const delay = reduceMotion ? 0 : i * STAGGER_MS;

    const finalPos = new THREE.Vector3(
      t.pos[0] - center.x,
      t.pos[1] - center.y,
      t.pos[2] - center.z
    ).multiplyScalar(CUBE_SIZE);

    group.rotation.set(
      shortestAngle(group.rotation.x, t.rot[0]),
      shortestAngle(group.rotation.y, t.rot[1]),
      shortestAngle(group.rotation.z, t.rot[2])
    );

    tweenTo(group.position, { x: finalPos.x, y: finalPos.y, z: finalPos.z }, ms(ASSEMBLE_MS), delay, done);
    tweenTo(group.rotation, { x: t.rot[0], y: t.rot[1], z: t.rot[2] }, ms(ASSEMBLE_MS), delay, done);
  });
}

function disassemble() {
  state = 'floating';
  settled = false;
  tweenGroup.removeAll();

  const targetY = Math.round(cubeGroup.rotation.y / TWO_PI) * TWO_PI;

  let pending = pieceGroups.length * 2 + 2;
  const done = () => { if (--pending === 0) settled = true; };

  // El grupo se despega del espacio vacío y vuelve al origen (fondo)
  tweenTo(anchorState, { weight: 0 }, ms(DISASSEMBLE_MS), 0, done);
  tweenTo(cubeGroup.rotation, { y: targetY }, ms(DISASSEMBLE_MS), 0, done);

  pieceGroups.forEach(group => {
    const fp = group.userData.floatingPos;

    group.rotation.set(
      shortestAngle(group.rotation.x, fp.rx),
      shortestAngle(group.rotation.y, fp.ry),
      shortestAngle(group.rotation.z, fp.rz)
    );

    tweenTo(group.position, { x: fp.x, y: fp.y, z: fp.z }, ms(DISASSEMBLE_MS), 0, done);
    tweenTo(group.rotation, { x: fp.rx, y: fp.ry, z: fp.rz }, ms(DISASSEMBLE_MS), 0, done);
  });
}

/* ───────────────────────── Scroll + render loop ───────────────────────── */

// Devuelve el espacio vacío cuyo progreso esté dentro de su rango (el más centrado si hay varios)
function findActiveAnchor() {
  const vh = window.innerHeight;
  let best = null;
  let bestDist = Infinity;

  for (const anchor of getSomaAnchors()) {
    const rect = anchor.el.getBoundingClientRect();
    const progress = (vh - rect.top) / (vh + rect.height);

    if (progress >= anchor.enterAt && progress <= anchor.leaveAt) {
      const dist = Math.abs(progress - 0.5);
      if (dist < bestDist) {
        best = anchor;
        bestDist = dist;
      }
    }
  }
  return best;
}

function evaluateScroll() {
  const active = findActiveAnchor();

  if (active) {
    if (state !== 'assembled' || currentAnchor !== active) assemble(active);
  } else if (state !== 'floating') {
    disassemble();
  }
}

// Convierte la posición en pantalla del espacio vacío a un desplazamiento en el mundo 3D.
// Con cámara ortográfica basta mover el grupo por el plano de pantalla (camRight / camUp).
function trackAnchor(delta) {
  const rect = currentAnchor.el.getBoundingClientRect();
  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;
  const unitsPerPixel = (2 * props.viewSize) / height;

  anchorTarget
    .set(0, 0, 0)
    .addScaledVector(camRight, (rect.left + rect.width / 2 - width / 2) * unitsPerPixel)
    .addScaledVector(camUp, -(rect.top + rect.height / 2 - height / 2) * unitsPerPixel);

  // Suavizado ligero para que no haya saltos al cambiar de espacio o al volver a armarse
  const k = reduceMotion ? 1 : 1 - Math.exp(-delta * 10);
  anchorOffset.lerp(anchorTarget, k);
}

function idleFloat(now, delta) {
  pieceGroups.forEach((group, i) => {
    group.rotation.x += 0.12 * delta * (i % 2 === 0 ? 1 : -1);
    group.rotation.y += 0.18 * delta;

    const targetY = group.userData.floatingPos.y + Math.sin(now * 0.001 + i) * 0.5;
    group.position.y += (targetY - group.position.y) * Math.min(1, delta * 4);
  });
}

function loop(now) {
  rafId = requestAnimationFrame(loop);

  const delta = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  evaluateScroll();

  // Mientras se está armado (o armándose) seguimos al espacio; al desarmarse queda congelado
  if (state === 'assembled' && currentAnchor) trackAnchor(delta);

  if (settled && !reduceMotion) {
    if (state === 'floating') idleFloat(now, delta);
    else cubeGroup.rotation.y += delta * 0.6;
  }

  tweenGroup.update();

  cubeGroup.position.copy(anchorOffset).multiplyScalar(anchorState.weight);

  const opacity = props.idleOpacity + (1 - props.idleOpacity) * anchorState.weight;
  renderer.domElement.style.opacity = String(opacity);

  renderer.render(scene, camera);
}

function handleResize() {
  const el = containerRef.value;
  if (!el || !renderer) return;
  const width = el.clientWidth;
  const height = el.clientHeight;
  if (!width || !height) return;

  updateCamera(width, height);
  renderer.setSize(width, height);
}

/* ───────────────────────── Ciclo de vida ───────────────────────── */

onMounted(() => {
  reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  initScene();
  createPieces();

  resizeObserver = new ResizeObserver(handleResize);
  resizeObserver.observe(containerRef.value);

  lastTime = performance.now();
  rafId = requestAnimationFrame(loop);
});

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
  resizeObserver?.disconnect();
  tweenGroup.removeAll();

  disposables.forEach(item => item.dispose());

  if (renderer) {
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  }
});
</script>

<template>
  <div ref="containerRef" class="soma-background" aria-hidden="true"></div>
</template>

<style scoped>
.soma-background {
  position: fixed;
  inset: 0;
  z-index: 0;            /* por debajo del <main class="z-10"> */
  overflow: hidden;
  pointer-events: none;
}
</style>
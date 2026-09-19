<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { SOMA_PIECES } from '@/utils/utils';
import { SOLUTIONS, FLOATING_POSITIONS } from '@/utils/somaSolutions';

/**
 * Espacio vacío con altura que dibuja una figura Soma.
 *
 * progress (0 → 1) mide cómo pasa el espacio por la pantalla:
 *   0    = el borde superior del espacio acaba de asomar por abajo
 *   0.5  = el espacio está centrado en la pantalla
 *   1    = el borde inferior del espacio está saliendo por arriba
 *
 *   progress < enterAt          → piezas dispersas flotando
 *   enterAt ≤ progress ≤ leaveAt → figura armada (y girando)
 *   progress > leaveAt          → piezas se separan de nuevo
 */
const props = defineProps({
  figure:   { type: String, required: true },      // 'camel' | 'cristal' | 'gordian' | ...
  height:   { type: String, default: '90vh' },     // altura del espacio vacío
  enterAt:  { type: Number, default: 0.3 },        // inicio del rango "armado"
  leaveAt:  { type: Number, default: 0.7 },        // fin del rango "armado"
  viewSize: { type: Number, default: 9 },          // "zoom" de la cámara (menor = figura más grande)
  bleed:    { type: String, default: '40vh' }      // cuánto se extiende el canvas por encima y debajo del espacio
});

const CUBE_SIZE = 1;
const CUBE_GAP = 0.02;
const TWO_PI = Math.PI * 2;

const ASSEMBLE_MS = 2000;
const DISASSEMBLE_MS = 1500;
const STAGGER_MS = 70;   // retraso escalonado entre piezas

const containerRef = ref(null);   // el espacio vacío (sirve para medir el scroll)
const stageRef = ref(null);       // el escenario del canvas (más alto que el espacio)
const tweenGroup = new TWEEN.Group();

let scene, camera, renderer, cubeGroup;
let pieceGroups = [];
let solution = null;
let solutionCenter = null;

let rafId = null;
let lastTime = 0;
let resizeObserver = null;
let visibilityObserver = null;
let reduceMotion = false;

// Estado (no reactivo: solo lo usa el loop de render)
let targetState = 'floating';   // 'floating' | 'assembled'
let settled = true;             // true cuando terminaron los tweens de la transición

const disposables = [];         // geometrías y materiales a liberar

/* ───────────────────────── Escena ───────────────────────── */

function updateCamera(width, height) {
  const aspect = width / height;
  // El escenario es más alto que el espacio vacío (bleed): escalamos la vista
  // para que la figura conserve el mismo tamaño en pantalla.
  const scale = height / containerRef.value.clientHeight;
  const d = props.viewSize * scale;
  camera.left = -d * aspect;
  camera.right = d * aspect;
  camera.top = d;
  camera.bottom = -d;
  camera.updateProjectionMatrix();
}

function initScene() {
  const el = stageRef.value;
  const width = el.clientWidth;
  const height = el.clientHeight;

  scene = new THREE.Scene(); // sin background: el canvas es transparente

  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
  camera.position.set(15, 15, 15);
  camera.lookAt(0, 0, 0);
  updateCamera(width, height);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);

  const canvas = renderer.domElement;
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.pointerEvents = 'none';
  el.appendChild(canvas);

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
  // Geometrías y material de líneas compartidos por todas las piezas
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

    // Centrar la pieza en su origen local
    const center = new THREE.Box3().setFromObject(group).getCenter(new THREE.Vector3());
    group.children.forEach(child => child.position.sub(center));

    group.position.set(fp.x, fp.y, fp.z);
    group.rotation.set(fp.rx, fp.ry, fp.rz);
    group.userData = { key, floatingPos: { ...fp } };

    pieceGroups.push(group);
    cubeGroup.add(group);
  });
}

// Centro geométrico de la solución (misma lógica que en SomaCube.vue)
function getSolutionCenter(sol) {
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

  return new THREE.Vector3(
    (minX + maxX) / 2,
    (minY + maxY) / 2,
    (minZ + maxZ) / 2
  );
}

/* ───────────────────────── Transiciones ───────────────────────── */

const ms = value => (reduceMotion ? 1 : value);

// Ajusta un ángulo (equivalente módulo 2π) para que el tween tome el camino corto
// y no dé vueltas de más por la rotación acumulada mientras flotaba.
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

function assemble() {
  if (!solution) return;

  targetState = 'assembled';
  settled = false;
  tweenGroup.removeAll();   // interrumpe cualquier transición en curso

  let pending = pieceGroups.length * 2;
  const done = () => { if (--pending === 0) settled = true; };

  pieceGroups.forEach((group, i) => {
    const t = solution[group.userData.key];
    const delay = reduceMotion ? 0 : i * STAGGER_MS;

    const finalPos = new THREE.Vector3(
      t.pos[0] - solutionCenter.x,
      t.pos[1] - solutionCenter.y,
      t.pos[2] - solutionCenter.z
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
  targetState = 'floating';
  settled = false;
  tweenGroup.removeAll();

  // El grupo vuelve al giro múltiplo de 2π más cercano
  const targetY = Math.round(cubeGroup.rotation.y / TWO_PI) * TWO_PI;

  let pending = pieceGroups.length * 2 + 1;
  const done = () => { if (--pending === 0) settled = true; };

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

// Se usa cuando el espacio sale de pantalla: deja todo disperso sin animar,
// así al volver a entrar las piezas ya están sueltas.
function snapToFloating() {
  tweenGroup.removeAll();
  targetState = 'floating';
  settled = true;
  if (!cubeGroup) return;

  cubeGroup.rotation.set(0, 0, 0);
  pieceGroups.forEach(group => {
    const fp = group.userData.floatingPos;
    group.position.set(fp.x, fp.y, fp.z);
    group.rotation.set(fp.rx, fp.ry, fp.rz);
  });
}

/* ───────────────────────── Scroll + render loop ───────────────────────── */

function evaluateScroll() {
  const rect = containerRef.value.getBoundingClientRect();
  const vh = window.innerHeight;
  const progress = (vh - rect.top) / (vh + rect.height);
  const inRange = progress >= props.enterAt && progress <= props.leaveAt;

  if (inRange && targetState !== 'assembled') assemble();
  else if (!inRange && targetState !== 'floating') disassemble();
}

function idleFloat(now, delta) {
  pieceGroups.forEach((group, i) => {
    group.rotation.x += 0.12 * delta * (i % 2 === 0 ? 1 : -1);
    group.rotation.y += 0.18 * delta;

    // Suavizado hacia la posición de flotación para evitar saltos al terminar de separarse
    const targetY = group.userData.floatingPos.y + Math.sin(now * 0.001 + i) * 0.5;
    group.position.y += (targetY - group.position.y) * Math.min(1, delta * 4);
  });
}

function loop(now) {
  rafId = requestAnimationFrame(loop);

  const delta = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  evaluateScroll();

  if (settled && !reduceMotion) {
    if (targetState === 'floating') idleFloat(now, delta);
    else cubeGroup.rotation.y += delta * 0.6;   // giro continuo de la figura armada
  }

  tweenGroup.update();
  renderer.render(scene, camera);
}

function startLoop() {
  if (rafId) return;
  lastTime = performance.now();
  rafId = requestAnimationFrame(loop);
}

function stopLoop() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
}

function handleResize() {
  const el = stageRef.value;
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

  solution = SOLUTIONS[props.figure];
  if (!solution) {
    console.warn(`[SomaFigure] Figura desconocida: "${props.figure}"`);
    return;
  }
  solutionCenter = getSolutionCenter(solution);

  initScene();
  createPieces();

  resizeObserver = new ResizeObserver(handleResize);
  resizeObserver.observe(stageRef.value);

  // Solo se renderiza mientras el espacio esté (casi) en pantalla
  visibilityObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        startLoop();
      } else {
        stopLoop();
        snapToFloating();
      }
    },
    { rootMargin: '150px 0px' }
  );
  visibilityObserver.observe(stageRef.value);
});

onBeforeUnmount(() => {
  stopLoop();
  resizeObserver?.disconnect();
  visibilityObserver?.disconnect();
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
  <div
    ref="containerRef"
    class="soma-spacer"
    :style="{ height }"
    aria-hidden="true"
  >
    <div ref="stageRef" class="soma-stage" :style="{ '--bleed': bleed }"></div>
  </div>
</template>

<style scoped>
/* Ya NO recorta (sin overflow: hidden) y queda por encima de las secciones vecinas */
.soma-spacer {
  position: relative;
  z-index: 5;
  width: 100%;
  pointer-events: none;
}

/* El canvas sobresale por arriba y por abajo del espacio.
   La máscara difumina las piezas en esas zonas y las deja nítidas dentro del espacio. */
.soma-stage {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(var(--bleed) * -1);
  bottom: calc(var(--bleed) * -1);
  overflow: hidden;
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0,
    #000 var(--bleed),
    #000 calc(100% - var(--bleed)),
    transparent 100%
  );
  mask-image: linear-gradient(
    to bottom,
    transparent 0,
    #000 var(--bleed),
    #000 calc(100% - var(--bleed)),
    transparent 100%
  );
}
</style>
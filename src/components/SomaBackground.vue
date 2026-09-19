<template>
  <div ref="containerRef" class="soma-bg-container">
    <div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink-900/10"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { SOMA_PIECES } from '@/utils/utils';

const props = defineProps({
  targetShape: { type: String, default: 'cube' },
  shouldAssemble: { type: Boolean, default: null } // null = modo "click" (como en el modal)
});

const containerRef = ref(null);
const isAnimating = ref(false);
const isAssembled = ref(false);
const tweenGroup = new TWEEN.Group();

let scene, camera, renderer, animationId;
let pieceGroups = [];
let cubeGroup;
let clock;

const CUBE_SIZE = 1;
const CUBE_GAP = 0.02;

// Fixed floating positions so they don't change on reload
const FLOATING_POSITIONS = [
  { x: -8, y: 3, z: -5, rx: 0.5, ry: 0.8, rz: 0.3 },
  { x: 8, y: -2, z: -4, rx: 1.2, ry: -0.5, rz: 0.7 },
  { x: -6, y: -4, z: 6, rx: -0.3, ry: 1.5, rz: -0.8 },
  { x: 7, y: 4, z: 5, rx: 0.9, ry: 0.2, rz: 1.1 },
  { x: 0, y: 8, z: -6, rx: -1.1, ry: 0.6, rz: 0.4 },
  { x: -7, y: 0, z: 0, rx: 0.7, ry: -1.2, rz: 0.9 },
  { x: 6, y: -6, z: 0, rx: -0.6, ry: 0.4, rz: -1.3 }
];

const SOLUTIONS = {
  cube: {
    V: { pos: [-0.5, 1, 0], rot: [0, 0, 0] },
    L: { pos: [-0.5, 2, 0.5], rot: [Math.PI / 2, 0, -Math.PI / 2] },
    T: { pos: [0, 0, 0], rot: [Math.PI / 2, 0, 0] },
    Z: { pos: [1, 1.5, 0.5], rot: [Math.PI / 2, 0, -Math.PI / 2] },
    A: { pos: [0.5, 1.5, 0], rot: [Math.PI / 2, 0, -Math.PI / 2] },
    B: { pos: [0.5, 0.5, 1], rot: [-Math.PI / 2, 0, Math.PI / 2] },
    P: { pos: [-0.5, 0.5, 1], rot: [0, Math.PI, 0] }
  },
  camel: {
    V: { pos: [-1, 0, -1], rot: [0, 0, Math.PI / 2] },
    L: { pos: [0, 3.5, 0], rot: [0, -Math.PI / 2, -Math.PI / 2] },
    T: { pos: [0, 2, -1.5], rot: [0, Math.PI / 2, 0] },
    Z: { pos: [0, 2.5, -3], rot: [0, 0, Math.PI / 2] },
    A: { pos: [0.5, 0, -1], rot: [0, 0, Math.PI / 2] },
    B: { pos: [-0.5, 0, -3], rot: [Math.PI / 2, 0, 0] },
    P: { pos: [0.5, 0, -3], rot: [0, 0, 0] }
  },
  cristal: {
    V: { pos: [0, 0, 0], rot: [0, -Math.PI / 2, 0] },
    L: { pos: [-0.5, 1.5, 0.5], rot: [0, Math.PI / 2, 0] },
    T: { pos: [1.5, 0.5, 0.5], rot: [0, Math.PI / 2, 0] },
    Z: { pos: [0, 3, -0.5], rot: [0, -Math.PI / 2, Math.PI / 2] },
    A: { pos: [1, 1.5, 0], rot: [0, 0, 0] },
    B: { pos: [0, 0.5, 1], rot: [0, Math.PI / 2, 0] },
    P: { pos: [0, 2.5, 0], rot: [0, Math.PI, 0] }
  },
  gordian: {
    V: { pos: [0.5, 1, 0], rot: [0, 0, 0] },
    L: { pos: [2.5, 1, 0.5], rot: [0, Math.PI, Math.PI / 2] },
    T: { pos: [0, 0, 0], rot: [-Math.PI / 2, 0, 0] },
    Z: { pos: [0.5, 1, 1.5], rot: [0, -Math.PI / 2, -Math.PI / 2] },
    A: { pos: [1.5, 0.5, 2], rot: [0, 0, 0] },
    B: { pos: [1.5, 0.5, -1], rot: [0, Math.PI / 2, 0] },
    P: { pos: [0.5, 2.5, 0], rot: [-Math.PI / 2, 0, 0] }
  }
};

function initScene() {
  const container = containerRef.value;
  if (!container) return;

  const width = container.clientWidth;
  const height = container.clientHeight;

  scene = new THREE.Scene();
  scene.background = null; 

  const aspect = width / height;
  const d = 10;
  camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 0.1, 1000);
  camera.position.set(15, 15, 15);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dl1 = new THREE.DirectionalLight(0xffffff, 0.8);
  dl1.position.set(10, 20, 10);
  scene.add(dl1);
  const dl2 = new THREE.DirectionalLight(0xffffff, 0.4);
  dl2.position.set(-10, -20, -10);
  scene.add(dl2);

  cubeGroup = new THREE.Group();
  scene.add(cubeGroup);
  clock = new THREE.Clock();
}

function createPiece(pieceKey, pieceData, floatingPos) {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: pieceData.color,
    roughness: 0.3,
    metalness: 0.1
  });

  pieceData.cubes.forEach(cube => {
    const geometry = new THREE.BoxGeometry(CUBE_SIZE - CUBE_GAP, CUBE_SIZE - CUBE_GAP, CUBE_SIZE - CUBE_GAP);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(cube.x * CUBE_SIZE, cube.y * CUBE_SIZE, cube.z * CUBE_SIZE);
    
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
    mesh.add(line);
    group.add(mesh);
  });

  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  group.children.forEach(child => child.position.sub(center));

  group.position.set(floatingPos.x, floatingPos.y, floatingPos.z);
  group.rotation.set(floatingPos.rx, floatingPos.ry, floatingPos.rz);

  group.userData = { key: pieceKey, floatingPos: { ...floatingPos } };
  return group;
}

function createAllPieces() {
  pieceGroups = [];
  const keys = Object.keys(SOMA_PIECES);
  keys.forEach((key, index) => {
    const piece = createPiece(key, SOMA_PIECES[key], FLOATING_POSITIONS[index]);
    pieceGroups.push(piece);
    cubeGroup.add(piece);
  });
}

function getSolutionCenter(solution) {
  const keys = Object.keys(solution);
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  keys.forEach(key => {
    const { pos, rot } = solution[key];
    const piece = SOMA_PIECES[key];
    piece.cubes.forEach(cube => {
      const euler = new THREE.Euler(rot[0], rot[1], rot[2]);
      const vector = new THREE.Vector3(cube.x, cube.y, cube.z).applyEuler(euler);
      const wx = pos[0] + vector.x;
      const wy = pos[1] + vector.y;
      const wz = pos[2] + vector.z;
      minX = Math.min(minX, wx); minY = Math.min(minY, wy); minZ = Math.min(minZ, wz);
      maxX = Math.max(maxX, wx); maxY = Math.max(maxY, wy); maxZ = Math.max(maxZ, wz);
    });
  });
  return new THREE.Vector3((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);
}

function assembleFigure(figureName, onDone) {
  const solution = SOLUTIONS[figureName];
  if (!solution) return;
  
  const center = getSolutionCenter(solution);
  const totalDuration = 1500;
  let completed = 0;
  const totalTweens = pieceGroups.length * 2;

  pieceGroups.forEach(group => {
    const key = group.userData.key;
    const target = solution[key];
    if (!target) return;

    const finalPos = new THREE.Vector3(
      target.pos[0] - center.x,
      target.pos[1] - center.y,
      target.pos[2] - center.z
    ).multiplyScalar(CUBE_SIZE);

    const posTween = new TWEEN.Tween(group.position)
      .to({ x: finalPos.x, y: finalPos.y, z: finalPos.z }, totalDuration)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onComplete(() => { if (++completed === totalTweens) { isAssembled.value = true; onDone?.(); } });

    const rotTween = new TWEEN.Tween(group.rotation)
      .to({ x: target.rot[0], y: target.rot[1], z: target.rot[2] }, totalDuration)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onComplete(() => { if (++completed === totalTweens) { isAssembled.value = true; onDone?.(); } });

    tweenGroup.add(posTween);
    tweenGroup.add(rotTween);
    posTween.start();
    rotTween.start();
  });
}

function disassembleFigure(onDone) {
  const totalDuration = 1200;
  let completed = 0;
  const totalTweens = pieceGroups.length * 2;

  new TWEEN.Tween(cubeGroup.rotation)
    .to({ x: 0, y: 0, z: 0 }, totalDuration)
    .easing(TWEEN.Easing.Cubic.InOut)
    .start();

  pieceGroups.forEach(group => {
    const fp = group.userData.floatingPos;
    
    const posTween = new TWEEN.Tween(group.position)
      .to({ x: fp.x, y: fp.y, z: fp.z }, totalDuration)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onComplete(() => { if (++completed === totalTweens) onDone?.(); });

    const rotTween = new TWEEN.Tween(group.rotation)
      .to({ x: fp.rx, y: fp.ry, z: fp.rz }, totalDuration)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onComplete(() => { if (++completed === totalTweens) onDone?.(); });

    tweenGroup.add(posTween);
    tweenGroup.add(rotTween);
    posTween.start();
    rotTween.start();
  });
}

function toggleAssembly() {
  if (isAnimating.value) return;
  isAnimating.value = true;

  if (isAssembled.value) {
    disassembleFigure(() => {
      isAssembled.value = false;
      isAnimating.value = false;
    });
  } else {
    assembleFigure(props.targetShape, () => {
      isAnimating.value = false;
    });
  }
}

function animate() {
  animationId = requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime() * 1000;

  if (!isAssembled.value && !isAnimating.value) {
    pieceGroups.forEach((group, index) => {
      group.rotation.x += 0.002 * (index % 2 === 0 ? 1 : -1);
      group.rotation.y += 0.003;
      const floatOffset = Math.sin(elapsed * 0.001 + index) * 0.5;
      group.position.y = group.userData.floatingPos.y + floatOffset;
    });
  }

  if (isAssembled.value) {
    cubeGroup.rotation.y += delta * 0.5;
  }

  tweenGroup.update();
  renderer.render(scene, camera);
}

function handleResize() {
  if (!containerRef.value || !camera || !renderer) return;
  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;
  const aspect = width / height;
  const d = 10;
  camera.left = -d * aspect;
  camera.right = d * aspect;
  camera.top = d;
  camera.bottom = -d;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

// Watch for shape changes to trigger assembly/disassembly
watch(() => props.targetShape, (newShape) => {
  if (isAssembled.value) {
    // If already assembled, smoothly transition to new shape
    isAnimating.value = true;
    disassembleFigure(() => {
      assembleFigure(newShape, () => { isAnimating.value = false; });
    });
  } else {
    // If scattered, just assemble into new shape
    isAnimating.value = true;
    assembleFigure(newShape, () => { isAnimating.value = false; });
  }
});

onMounted(() => {
  initScene();
  createAllPieces();
  animate();
  window.addEventListener('resize', handleResize);
  containerRef.value.addEventListener('click', toggleAssembly);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (containerRef.value) {
    containerRef.value.removeEventListener('click', toggleAssembly);
  }
  if (animationId) cancelAnimationFrame(animationId);
  if (renderer) {
    renderer.dispose();
    if (containerRef.value && renderer.domElement) {
      containerRef.value.removeChild(renderer.domElement);
    }
  }
});
</script>

<style scoped>
.soma-bg-container {
  position: fixed; /* Fixed to viewport */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0; /* Behind everything */
  pointer-events: auto; /* Allow clicking */
}
</style>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { SOMA_PIECES } from '@/utils/utils';

const containerRef = ref(null);
const isAnimating = ref(false);   // transición en curso → bloquea botones
const isAssembled = ref(false);   // cubo armado → piezas quietas
const tweenGroup = new TWEEN.Group();
let scene, camera, renderer, animationId;
let pieceGroups = [];
let cubeGroup;          // ← nuevo
let clock;

const CUBE_SIZE = 1;
const CUBE_GAP = 0.02;

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
    V: {
      pos: [-0.5, 1, 0],
      rot: [0, 0,0]
    },

    L: {
      pos: [-0.5, 2, 0.5],
      rot: [Math.PI / 2, 0, -Math.PI / 2]
    },

    T: {
      pos: [0, 0, 0],
      rot: [Math.PI / 2, 0, 0]
    },

    Z: {
      pos: [1, 1.5, 0.5],
      rot: [ Math.PI/2, 0, -Math.PI/2]
    },

    A: {
      pos: [0.5, 1.5, 0],
      rot: [Math.PI / 2, 0, -Math.PI / 2]
    },

    B: {
      pos: [0.5, 0.5, 1],
      rot: [-Math.PI / 2, 0, Math.PI / 2]
    },

    P: {
      pos: [-0.5, 0.5, 1],
      rot: [0, Math.PI , 0]
    }
  },
  camel: {
    V: {
      pos: [-1, 0, -1],
      rot: [0, 0,Math.PI / 2]
    },

    L: {
      pos: [0, 3.5, 0],
      rot: [0, -Math.PI / 2,  -Math.PI / 2]
    },

    T: {
      pos: [0, 2, -1.5],
      rot: [0, Math.PI / 2, 0]
    },

    Z: {
      pos: [0, 2.5, -3],
      rot: [0, 0, Math.PI / 2]
    },

    A: {
      pos: [0.5, 0, -1],
      rot: [0, 0, Math.PI / 2]
    },

    B: {
      pos: [-0.5, 0, -3],
      rot: [Math.PI / 2, 0, 0]
    },

    P: {
      pos: [0.5, 0, -3],
      rot: [0, 0 , 0]
    }
  },

  cristal: {
    V: {
      pos: [0, 0, 0],
      rot: [0, -Math.PI / 2, 0]
    },

    L: {
      pos: [-0.5, 1.5, 0.5],
      rot: [0, Math.PI/2 , 0]
    },

    T: {
      pos: [1.5, 0.5, 0.5],
      rot: [0, Math.PI / 2 , 0]
    },

    Z: {
      pos: [0, 3, -0.5],
      rot: [0, -Math.PI / 2, Math.PI / 2]
    },

    A: {
      pos: [1, 1.5, 0],
      rot: [0, 0, 0]
    },

    B: {
      pos: [0, 0.5, 1],
      rot: [0, Math.PI / 2, 0]
    },

    P: {
      pos: [0, 2.5, 0],
      rot: [0, Math.PI, 0]
    }
  },

  gordian: {
    V: {
      pos: [0.5, 1, 0],
      rot: [0, 0, 0]
    },

    L: {
      pos: [2.5, 1, 0.5],
      rot: [0, Math.PI , Math.PI / 2]
    },

    T: {
      pos: [0, 0, 0],
      rot: [-Math.PI / 2, 0 , 0]
    },

    Z: {
      pos: [0.5, 1, 1.5],
      rot: [0, -Math.PI / 2, -Math.PI / 2]
    },

    A: {
      pos: [1.5, 0.5, 2],
      rot: [0, 0, 0]
    },

    B: {
      pos: [1.5, 0.5, -1],
      rot: [0, Math.PI / 2, 0]
    },

    P: {
      pos: [0.5, 2.5, 0],
      rot: [-Math.PI / 2, 0, 0]
    }
  },
  scorpion: {
    V: {
      pos: [0.5, 3, -4],
      rot: [0, 0, -Math.PI / 2]
    },

    L: {
      pos: [0.5, -0.5, -1],
      rot: [-Math.PI / 2, 0, Math.PI ]
    },

    T: {
      pos: [0.5, 0.5, -4],
      rot: [Math.PI/2 , Math.PI / 2 , 0]
    },

    Z: {
      pos: [0.5, 0, -2.5],
      rot: [Math.PI / 2, Math.PI, Math.PI / 2]
    },

    A: {
      pos: [2, 0, 1],
      rot: [0, -Math.PI / 2, 0]
    },

    B: {
      pos: [-1, 0, 1],
      rot: [0, 0, 0]
    },

    P: {
      pos: [0, 0, 0],
      rot: [0, 0, 0]
    }
  },
  void: {
    V: {
      pos: [-3, 0, 0],
      rot: [0, 0, 0]
    },

    L: {
      pos: [3, 0, 0],
      rot: [0, 0, 0]
    },

    T: {
      pos: [0, 0, 0],
      rot: [0, 0 , 0]
    },

    Z: {
      pos: [-3, -3, 0],
      rot: [0, 0, 0]
    },

    A: {
      pos: [0, -3, 0],
      rot: [0, 0, 0]
    },

    B: {
      pos: [3, -3, 0],
      rot: [0, 0, 0]
    },

    P: {
      pos: [0, 0, 3],
      rot: [0, 0, 0]
    }
  }
};


function initScene() {
  const container = containerRef.value;

  const width = container.clientWidth;
  const height = container.clientHeight;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);

  const aspect = width / height;
  const d = 10;

  camera = new THREE.OrthographicCamera(
    -d * aspect,
    d * aspect,
    d,
    -d,
    0.1,
    1000
  );

  camera.position.set(15, 15, 15);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({
    antialias: true
  });

  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);

  container.appendChild(renderer.domElement);

  scene.add(
    new THREE.AmbientLight(0xffffff, 0.6)
  );

  const dl1 = new THREE.DirectionalLight(
    0xffffff,
    0.8
  );

  dl1.position.set(10, 20, 10);
  scene.add(dl1);

  const dl2 = new THREE.DirectionalLight(
    0xffffff,
    0.4
  );

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
    const geometry = new THREE.BoxGeometry(
      CUBE_SIZE - CUBE_GAP,
      CUBE_SIZE - CUBE_GAP,
      CUBE_SIZE - CUBE_GAP
    );

    const mesh = new THREE.Mesh(
      geometry,
      material
    );

    mesh.position.set(
      cube.x * CUBE_SIZE,
      cube.y * CUBE_SIZE,
      cube.z * CUBE_SIZE
    );

    const edges = new THREE.EdgesGeometry(
      geometry
    );

    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({
        color: 0x000000
      })
    );

    mesh.add(line);
    group.add(mesh);
  });

  // Centrar la pieza en su origen local
  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(
    new THREE.Vector3()
  );

  group.children.forEach(child => {
    child.position.sub(center);
  });

  // Posición y rotación iniciales
  group.position.set(
    floatingPos.x,
    floatingPos.y,
    floatingPos.z
  );

  group.rotation.set(
    floatingPos.rx,
    floatingPos.ry,
    floatingPos.rz
  );

  // Guardamos la información original
  group.userData = {
    key: pieceKey,
    floatingPos: { ...floatingPos }
  };

  return group;
}


function createAllPieces() {
  pieceGroups = [];

  const keys = Object.keys(SOMA_PIECES);

  keys.forEach((key, index) => {
    const piece = createPiece(
      key,
      SOMA_PIECES[key],
      FLOATING_POSITIONS[index]
    );

    pieceGroups.push(piece);

    // ✅ Las piezas van al grupo contenedor
    cubeGroup.add(piece);
  });
}

function animatePieces(elapsed) {
  // Cuando se está formando el cubo,
  // los Tween tienen el control de las piezas.
  if (isAnimating.value || isAssembled.value) return;

  pieceGroups.forEach((group, index) => {

    group.rotation.x +=
      0.002 * (index % 2 === 0 ? 1 : -1);

    group.rotation.y += 0.003;

    const floatOffset =
      Math.sin(
        elapsed * 0.001 + index
      ) * 0.5;

    group.position.y =
      group.userData.floatingPos.y +
      floatOffset;
  });
}


function animate() {
  animationId = requestAnimationFrame(animate);

  const delta = clock.getDelta();          // segundos desde el frame anterior
  const elapsed = clock.getElapsedTime() * 1000;

  animatePieces(elapsed);

  // Giro continuo del cubo armado 
  if (isAssembled.value) {
    cubeGroup.rotation.y += delta * 0.6;   // 0.6 rad/s
  }

  tweenGroup.update();

  renderer.render(scene, camera);
}

// Calcula el centro geométrico
// de la solución del cubo
function getSolutionCenter(solution) {

  const keys =
    Object.keys(solution);

  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;

  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  keys.forEach(key => {

    const { pos, rot } =
      solution[key];

    const piece =
      SOMA_PIECES[key];

    piece.cubes.forEach(cube => {

      const euler =
        new THREE.Euler(
          rot[0],
          rot[1],
          rot[2]
        );

      const vector =
        new THREE.Vector3(
          cube.x,
          cube.y,
          cube.z
        );

      vector.applyEuler(euler);

      const wx =
        pos[0] + vector.x;

      const wy =
        pos[1] + vector.y;

      const wz =
        pos[2] + vector.z;

      minX = Math.min(minX, wx);
      minY = Math.min(minY, wy);
      minZ = Math.min(minZ, wz);

      maxX = Math.max(maxX, wx);
      maxY = Math.max(maxY, wy);
      maxZ = Math.max(maxZ, wz);
    });
  });

  return new THREE.Vector3(
    (minX + maxX) / 2,
    (minY + maxY) / 2,
    (minZ + maxZ) / 2
  );
}

function assembleCube()          { assemble('cube'); }
function assembleCamel()         { assemble('camel'); }
function assembleCristal()       { assemble('cristal'); }
function assembleGordianKnot()   { assemble('gordian'); }
function assembleScorpion()      { assemble('scorpion'); }

function assembleFigure(figureName, onDone) {
  const solution = SOLUTIONS[figureName];
  const center = getSolutionCenter(solution);
  const totalDuration = 2000;

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

    const positionTween = new TWEEN.Tween(group.position)
      .to({ x: finalPos.x, y: finalPos.y, z: finalPos.z }, totalDuration)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onComplete(() => {
        if (++completed === totalTweens) {
          isAnimating.value = false;
          isAssembled.value = true;
          onDone?.();
        }
      });

    const rotationTween = new TWEEN.Tween(group.rotation)
      .to(
        { x: target.rot[0], y: target.rot[1], z: target.rot[2] },
        totalDuration
      )
      .easing(TWEEN.Easing.Cubic.InOut)
      .onComplete(() => {
        if (++completed === totalTweens) {
          isAnimating.value = false;
          isAssembled.value = true;
          onDone?.();
        }
      });

    tweenGroup.add(positionTween);
    tweenGroup.add(rotationTween);
    positionTween.start();
    rotationTween.start();
  });
}

function assemble(figureName) {
  if (isAnimating.value) return;   // transición en curso → ignorar

  if (isAssembled.value) {
    // Ya hay una figura armada → desarmar y luego armar la nueva
    isAnimating.value = true;
    isAssembled.value = false;
    tweenGroup.removeAll();

    resetPieces(() => {
      // Al terminar de separar, armar la nueva figura
      assembleFigure(figureName);
    });
  } else {
    // Nada armado → armar directamente
    isAnimating.value = true;
    isAssembled.value = false;
    tweenGroup.removeAll();

    assembleFigure(figureName);
  }
}

function resetPieces(onDone) {
  const totalDuration = 1500;

  const currentY = cubeGroup.rotation.y;
  const targetY = Math.round(currentY / (Math.PI * 2)) * Math.PI * 2;

  const groupRotTween = new TWEEN.Tween(cubeGroup.rotation)
    .to({ y: targetY }, totalDuration)
    .easing(TWEEN.Easing.Cubic.InOut);
  tweenGroup.add(groupRotTween);
  groupRotTween.start();

  let completed = 0;
  const totalTweens = pieceGroups.length * 2;

  pieceGroups.forEach(group => {
    const fp = group.userData.floatingPos;

    const positionTween = new TWEEN.Tween(group.position)
      .to({ x: fp.x, y: fp.y, z: fp.z }, totalDuration)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onComplete(() => {
        if (++completed === totalTweens) onDone?.();
      });

    const rotationTween = new TWEEN.Tween(group.rotation)
      .to({ x: fp.rx, y: fp.ry, z: fp.rz }, totalDuration)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onComplete(() => {
        if (++completed === totalTweens) onDone?.();
      });

    tweenGroup.add(positionTween);
    tweenGroup.add(rotationTween);
    positionTween.start();
    rotationTween.start();
  });
}

function resetOnly() {
  if (isAnimating.value || !isAssembled.value) return;
  isAnimating.value = true;
  isAssembled.value = false;
  tweenGroup.removeAll();
  resetPieces(() => { isAnimating.value = false; });
}

function handleResize() {

  if (
    !containerRef.value ||
    !camera ||
    !renderer
  ) {
    return;
  }

  const width =
    containerRef.value.clientWidth;

  const height =
    containerRef.value.clientHeight;

  const aspect =
    width / height;

  const d = 10;

  camera.left =
    -d * aspect;

  camera.right =
    d * aspect;

  camera.top = d;
  camera.bottom = -d;

  camera.updateProjectionMatrix();

  renderer.setSize(
    width,
    height
  );
}


onMounted(() => {

  initScene();

  createAllPieces();

  animate();

  window.addEventListener(
    'resize',
    handleResize
  );
});


onUnmounted(() => {

  window.removeEventListener(
    'resize',
    handleResize
  );

  if (animationId) {
    cancelAnimationFrame(
      animationId
    );
  }

  if (renderer) {

    renderer.dispose();

    if (
      containerRef.value &&
      renderer.domElement
    ) {
      containerRef.value.removeChild(
        renderer.domElement
      );
    }
  }
});
</script>

<template>
  <div ref="containerRef" class="soma-container">

    <div class="controls">
      <button
        @click="assembleCube"
        :disabled="isAnimating"       
      >
        Formar Cubo
      </button>

      <button
        @click="assembleCamel"
        :disabled="isAnimating"
      >
        Formar Camello
      </button>
      <button
        @click="assembleCristal"
        :disabled="isAnimating"
      >
        Formar Cristal
      </button>
      <button
        @click="assembleGordianKnot"
        :disabled="isAnimating"
      >
        Formar Nudo Gordiano
      </button>
      <button
        @click="assembleScorpion"
        :disabled="isAnimating"
      >
        Formar Escoprion
      </button>
      <button
        @click="resetOnly"
        :disabled="isAnimating || !isAssembled"
      >
        Reiniciar
      </button>
    </div>

  </div>
</template>

<style scoped>
.soma-container {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

.controls {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);

  display: flex;
  gap: 10px;

  z-index: 10;
}

.controls button {
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;

  border: none;
  border-radius: 8px;

  cursor: pointer;

  transition: all 0.3s ease;

  background:
    linear-gradient(
      135deg,
      #667eea 0%,
      #764ba2 100%
    );

  color: white;

  box-shadow:
    0 4px 15px
    rgba(0, 0, 0, 0.3);
}

.controls button:hover:not(:disabled) {
  transform: translateY(-2px);
}

.controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

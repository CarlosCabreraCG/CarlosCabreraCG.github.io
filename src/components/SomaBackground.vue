<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { SOMA_PIECES } from '@/utils/utils';
import { SOLUTIONS, FLOATING_POSITIONS } from '@/utils/somaSolutions';
import { getSomaAnchors } from '@/composables/useSomaAnchors';

const props = defineProps({
  viewSize: {
    type: Number,
    default: 10
  },
  idleOpacity: {
    type: Number,
    default: 0.5
  }
});

const CUBE_SIZE = 1;
const CUBE_GAP = 0.02;
const TWO_PI = Math.PI * 2;

const ASSEMBLE_MS = 2000;
const DISASSEMBLE_MS = 1500;
const STAGGER_MS = 70;

const containerRef = ref(null);

/*
 * IMPORTANTE:
 * Usamos un Group propio de TWEEN.
 */
const tweenGroup = new TWEEN.Group();

let scene;
let camera;
let renderer;
let cubeGroup;

let pieceGroups = [];

let rafId = null;
let lastTime = 0;
let resizeObserver = null;

/*
 * DESACTIVADO INTENCIONALMENTE.
 *
 * Antes tenías:
 *
 * reduceMotion = window.matchMedia(
 *   '(prefers-reduced-motion: reduce)'
 * ).matches;
 *
 * Eso podía convertir los 2000 ms en 1 ms.
 */
const reduceMotion = false;

// Cámara
const camRight = new THREE.Vector3();
const camUp = new THREE.Vector3();

// Estado
let state = 'floating';
let settled = true;
let currentAnchor = null;
let solution = null;

const anchorState = {
  weight: 0
};

const anchorOffset = new THREE.Vector3();
const anchorTarget = new THREE.Vector3();

const solutionCenters = new Map();

const disposables = [];


/* =========================================================
   ESCENA
========================================================= */

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

  if (!el) return;

  const width = el.clientWidth;
  const height = el.clientHeight;

  scene = new THREE.Scene();

  camera = new THREE.OrthographicCamera(
    -1,
    1,
    1,
    -1,
    0.1,
    1000
  );

  camera.position.set(15, 15, 15);
  camera.lookAt(0, 0, 0);

  updateCamera(width, height);

  camera.updateMatrixWorld(true);

  camera.matrixWorld.extractBasis(
    camRight,
    camUp,
    new THREE.Vector3()
  );

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
  );

  renderer.setSize(width, height);

  renderer.domElement.style.display = 'block';
  renderer.domElement.style.opacity =
    String(props.idleOpacity);

  el.appendChild(renderer.domElement);

  scene.add(
    new THREE.AmbientLight(
      0xffffff,
      0.6
    )
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
}


/* =========================================================
   PIEZAS
========================================================= */

function createPieces() {
  const boxGeo = new THREE.BoxGeometry(
    CUBE_SIZE - CUBE_GAP,
    CUBE_SIZE - CUBE_GAP,
    CUBE_SIZE - CUBE_GAP
  );

  const edgesGeo = new THREE.EdgesGeometry(
    boxGeo
  );

  const edgeMat = new THREE.LineBasicMaterial({
    color: 0x000000
  });

  disposables.push(
    boxGeo,
    edgesGeo,
    edgeMat
  );

  Object.keys(SOMA_PIECES).forEach(
    (key, index) => {
      const data = SOMA_PIECES[key];
      const fp = FLOATING_POSITIONS[index];

      const material =
        new THREE.MeshStandardMaterial({
          color: data.color,
          roughness: 0.3,
          metalness: 0.1
        });

      disposables.push(material);

      const group = new THREE.Group();

      data.cubes.forEach(cube => {
        const mesh = new THREE.Mesh(
          boxGeo,
          material
        );

        mesh.position.set(
          cube.x * CUBE_SIZE,
          cube.y * CUBE_SIZE,
          cube.z * CUBE_SIZE
        );

        mesh.add(
          new THREE.LineSegments(
            edgesGeo,
            edgeMat
          )
        );

        group.add(mesh);
      });

      /*
       * Centrar geométricamente la pieza.
       */
      const center =
        new THREE.Box3()
          .setFromObject(group)
          .getCenter(
            new THREE.Vector3()
          );

      group.children.forEach(
        child => {
          child.position.sub(center);
        }
      );

      /*
       * Posición inicial.
       */
      group.position.set(
        fp.x,
        fp.y,
        fp.z
      );

      group.rotation.set(
        fp.rx,
        fp.ry,
        fp.rz
      );

      group.userData = {
        key,
        floatingPos: {
          ...fp
        }
      };

      pieceGroups.push(group);

      cubeGroup.add(group);
    }
  );
}


/* =========================================================
   CENTRO DE LA SOLUCIÓN
========================================================= */

function getSolutionCenter(figure) {
  if (solutionCenters.has(figure)) {
    return solutionCenters.get(figure);
  }

  const sol = SOLUTIONS[figure];

  if (!sol) {
    return new THREE.Vector3();
  }

  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;

  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  Object.keys(sol).forEach(key => {
    const {
      pos,
      rot
    } = sol[key];

    const euler =
      new THREE.Euler(
        rot[0],
        rot[1],
        rot[2]
      );

    SOMA_PIECES[key].cubes.forEach(
      cube => {
        const v =
          new THREE.Vector3(
            cube.x,
            cube.y,
            cube.z
          ).applyEuler(euler);

        const wx =
          pos[0] + v.x;

        const wy =
          pos[1] + v.y;

        const wz =
          pos[2] + v.z;

        minX = Math.min(
          minX,
          wx
        );

        maxX = Math.max(
          maxX,
          wx
        );

        minY = Math.min(
          minY,
          wy
        );

        maxY = Math.max(
          maxY,
          wy
        );

        minZ = Math.min(
          minZ,
          wz
        );

        maxZ = Math.max(
          maxZ,
          wz
        );
      }
    );
  });

  const center =
    new THREE.Vector3(
      (minX + maxX) / 2,
      (minY + maxY) / 2,
      (minZ + maxZ) / 2
    );

  solutionCenters.set(
    figure,
    center
  );

  return center;
}


/* =========================================================
   UTILIDADES DE ANIMACIÓN
========================================================= */

function ms(value) {
  return reduceMotion
    ? 1
    : value;
}


function shortestAngle(from, to) {
  const wrapped =
    ((((from - to + Math.PI) %
      TWO_PI) + TWO_PI) %
      TWO_PI) - Math.PI;

  return to + wrapped;
}


/*
 * IMPORTANTE:
 * Esta implementación registra explícitamente
 * el Tween en tweenGroup, igual que el componente
 * que sí funciona.
 */
function tweenTo(
  target,
  values,
  duration,
  delay,
  onDone
) {
  const tween =
    new TWEEN.Tween(target)
      .to(values, duration)
      .delay(delay)
      .easing(
        TWEEN.Easing.Cubic.InOut
      )
      .onComplete(() => {
        onDone?.();
      });

  tweenGroup.add(tween);

  tween.start();
}


/* =========================================================
   ARMAR
========================================================= */

function assemble(anchor) {
  const sol =
    SOLUTIONS[anchor.figure];

  if (!sol) {
    console.warn(
      `[SomaBackground] Figura desconocida: "${anchor.figure}"`
    );

    return;
  }

  /*
   * Cancelar cualquier transición anterior.
   */
  tweenGroup.removeAll();

  solution = sol;
  currentAnchor = anchor;

  state = 'assembled';
  settled = false;

  const center =
    getSolutionCenter(
      anchor.figure
    );

  let pending =
    pieceGroups.length * 2 + 1;

  const done = () => {
    pending--;

    if (pending <= 0) {
      settled = true;
    }
  };


  /*
   * Mover el grupo hacia el anchor.
   */
  tweenTo(
    anchorState,
    {
      weight: 1
    },
    ms(ASSEMBLE_MS),
    0,
    done
  );


  /*
   * Animar cada pieza.
   */
  pieceGroups.forEach(
    (group, i) => {
      const t =
        solution[
          group.userData.key
        ];

      if (!t) return;

      const delay =
        reduceMotion
          ? 0
          : i * STAGGER_MS;


      /*
       * Posición final.
       */
      const finalPos =
        new THREE.Vector3(
          t.pos[0] - center.x,
          t.pos[1] - center.y,
          t.pos[2] - center.z
        ).multiplyScalar(
          CUBE_SIZE
        );


      /*
       * MUY IMPORTANTE:
       *
       * NO hacemos:
       *
       * group.rotation.set(...)
       *
       * porque eso coloca inmediatamente
       * la pieza en la posición final.
       *
       * Calculamos el destino y dejamos que
       * TWEEN haga todo el movimiento.
       */
      const finalRotation = {
        x: t.rot[0],
        y: t.rot[1],
        z: t.rot[2]
      };


      /*
       * Posición.
       */
      tweenTo(
        group.position,
        {
          x: finalPos.x,
          y: finalPos.y,
          z: finalPos.z
        },
        ms(ASSEMBLE_MS),
        delay,
        done
      );


      /*
       * Rotación.
       */
      tweenTo(
        group.rotation,
        finalRotation,
        ms(ASSEMBLE_MS),
        delay,
        done
      );
    }
  );
}


/* =========================================================
   DESARMAR
========================================================= */

function disassemble() {
  /*
   * Cancelar transición anterior.
   */
  tweenGroup.removeAll();

  state = 'floating';
  settled = false;

  const targetY =
    Math.round(
      cubeGroup.rotation.y /
      TWO_PI
    ) * TWO_PI;

  let pending =
    pieceGroups.length * 2 + 2;

  const done = () => {
    pending--;

    if (pending <= 0) {
      settled = true;
    }
  };


  /*
   * Anchor.
   */
  tweenTo(
    anchorState,
    {
      weight: 0
    },
    ms(DISASSEMBLE_MS),
    0,
    done
  );


  /*
   * Rotación del conjunto.
   */
  tweenTo(
    cubeGroup.rotation,
    {
      y: targetY
    },
    ms(DISASSEMBLE_MS),
    0,
    done
  );


  /*
   * Piezas.
   */
  pieceGroups.forEach(
    group => {
      const fp =
        group.userData.floatingPos;


      const finalRotation = {
        x: shortestAngle(
          group.rotation.x,
          fp.rx
        ),

        y: shortestAngle(
          group.rotation.y,
          fp.ry
        ),

        z: shortestAngle(
          group.rotation.z,
          fp.rz
        )
      };


      tweenTo(
        group.position,
        {
          x: fp.x,
          y: fp.y,
          z: fp.z
        },
        ms(DISASSEMBLE_MS),
        0,
        done
      );


      tweenTo(
        group.rotation,
        finalRotation,
        ms(DISASSEMBLE_MS),
        0,
        done
      );
    }
  );
}


/* =========================================================
   ANCHORS
========================================================= */

function findActiveAnchor() {
  const vh =
    window.innerHeight;

  let best = null;
  let bestDist = Infinity;

  const anchors =
    getSomaAnchors();

  for (const anchor of anchors) {
    const rect =
      anchor.el.getBoundingClientRect();

    const progress =
      (vh - rect.top) /
      (vh + rect.height);

    if (
      progress >= anchor.enterAt &&
      progress <= anchor.leaveAt
    ) {
      const dist =
        Math.abs(
          progress - 0.5
        );

      if (dist < bestDist) {
        best = anchor;
        bestDist = dist;
      }
    }
  }

  return best;
}


function evaluateScroll() {
  const active =
    findActiveAnchor();

  if (active) {

    /*
     * Comparar el elemento DOM y no
     * el objeto anchor.
     */
    if (
      state !== 'assembled' ||
      currentAnchor?.el !== active.el
    ) {
      assemble(active);
    }

  } else if (
    state !== 'floating'
  ) {
    disassemble();
  }
}


/* =========================================================
   SEGUIR EL ANCHOR
========================================================= */

function trackAnchor(delta) {
  if (!currentAnchor) return;

  const rect =
    currentAnchor.el
      .getBoundingClientRect();

  const width =
    containerRef.value.clientWidth;

  const height =
    containerRef.value.clientHeight;

  const unitsPerPixel =
    (2 * props.viewSize) /
    height;


  anchorTarget
    .set(0, 0, 0)

    .addScaledVector(
      camRight,
      (
        rect.left +
        rect.width / 2 -
        width / 2
      ) * unitsPerPixel
    )

    .addScaledVector(
      camUp,
      -(
        rect.top +
        rect.height / 2 -
        height / 2
      ) * unitsPerPixel
    );


  const k =
    reduceMotion
      ? 1
      : 1 -
        Math.exp(
          -delta * 10
        );

  anchorOffset.lerp(
    anchorTarget,
    k
  );
}


/* =========================================================
   FLOATING
========================================================= */

function idleFloat(
  now,
  delta
) {
  pieceGroups.forEach(
    (group, i) => {

      group.rotation.x +=
        0.12 *
        delta *
        (i % 2 === 0
          ? 1
          : -1);

      group.rotation.y +=
        0.18 *
        delta;


      const targetY =
        group.userData
          .floatingPos.y +
        Math.sin(
          now * 0.001 + i
        ) * 0.5;


      group.position.y +=
        (
          targetY -
          group.position.y
        ) *
        Math.min(
          1,
          delta * 4
        );
    }
  );
}


/* =========================================================
   LOOP
========================================================= */

function loop(now) {
  rafId =
    requestAnimationFrame(
      loop
    );


  const delta =
    Math.min(
      (now - lastTime) / 1000,
      0.05
    );

  lastTime = now;


  /*
   * Determinar anchor.
   */
  evaluateScroll();


  /*
   * Seguir el anchor.
   */
  if (
    state === 'assembled' &&
    currentAnchor
  ) {
    trackAnchor(delta);
  }


  /*
   * Animación idle.
   */
  if (
    settled &&
    !reduceMotion
  ) {
    if (
      state === 'floating'
    ) {
      idleFloat(
        now,
        delta
      );
    } else {
      cubeGroup.rotation.y +=
        delta * 0.6;
    }
  }


  /*
   * AQUÍ TWEEN AVANZA.
   */
  tweenGroup.update();


  /*
   * Posición del conjunto.
   */
  cubeGroup.position
    .copy(anchorOffset)
    .multiplyScalar(
      anchorState.weight
    );


  /*
   * Opacidad.
   */
  const opacity =
    props.idleOpacity +
    (
      1 - props.idleOpacity
    ) *
    anchorState.weight;

  renderer.domElement.style.opacity =
    String(opacity);


  /*
   * Render.
   */
  renderer.render(
    scene,
    camera
  );
}


/* =========================================================
   RESIZE
========================================================= */

function handleResize() {
  const el =
    containerRef.value;

  if (
    !el ||
    !renderer
  ) {
    return;
  }

  const width =
    el.clientWidth;

  const height =
    el.clientHeight;

  if (
    !width ||
    !height
  ) {
    return;
  }

  updateCamera(
    width,
    height
  );

  renderer.setSize(
    width,
    height
  );
}


/* =========================================================
   MOUNT
========================================================= */

onMounted(() => {

  initScene();

  createPieces();


  resizeObserver =
    new ResizeObserver(
      handleResize
    );

  resizeObserver.observe(
    containerRef.value
  );


  lastTime =
    performance.now();

  rafId =
    requestAnimationFrame(
      loop
    );
});


/* =========================================================
   UNMOUNT
========================================================= */

onBeforeUnmount(() => {

  if (rafId) {
    cancelAnimationFrame(
      rafId
    );
  }

  rafId = null;


  resizeObserver?.disconnect();


  tweenGroup.removeAll();


  disposables.forEach(
    item => item.dispose()
  );


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
    class="soma-background"
    aria-hidden="true"
  ></div>
</template>


<style scoped>
.soma-background {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}
</style>
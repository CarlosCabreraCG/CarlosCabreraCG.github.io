// Datos compartidos por todos los <SomaFigure />.
// Son exactamente los mismos valores que tenías en SomaCube.vue,
// solo que ahora viven fuera del componente y se exportan.

export const FLOATING_POSITIONS = [
  { x: -8, y: 3, z: -5, rx: 0.5, ry: 0.8, rz: 0.3 },
  { x: 8, y: -2, z: -4, rx: 1.2, ry: -0.5, rz: 0.7 },
  { x: -6, y: -4, z: 6, rx: -0.3, ry: 1.5, rz: -0.8 },
  { x: 7, y: 4, z: 5, rx: 0.9, ry: 0.2, rz: 1.1 },
  { x: 0, y: 8, z: -6, rx: -1.1, ry: 0.6, rz: 0.4 },
  { x: -7, y: 0, z: 0, rx: 0.7, ry: -1.2, rz: 0.9 },
  { x: 6, y: -6, z: 0, rx: -0.6, ry: 0.4, rz: -1.3 }
];

export const SOLUTIONS = {
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
  },

  scorpion: {
    V: { pos: [0.5, 3, -4], rot: [0, 0, -Math.PI / 2] },
    L: { pos: [0.5, -0.5, -1], rot: [-Math.PI / 2, 0, Math.PI] },
    T: { pos: [0.5, 0.5, -4], rot: [Math.PI / 2, Math.PI / 2, 0] },
    Z: { pos: [0.5, 0, -2.5], rot: [Math.PI / 2, Math.PI, Math.PI / 2] },
    A: { pos: [2, 0, 1], rot: [0, -Math.PI / 2, 0] },
    B: { pos: [-1, 0, 1], rot: [0, 0, 0] },
    P: { pos: [0, 0, 0], rot: [0, 0, 0] }
  },

  void: {
    V: { pos: [-3, 0, 0], rot: [0, 0, 0] },
    L: { pos: [3, 0, 0], rot: [0, 0, 0] },
    T: { pos: [0, 0, 0], rot: [0, 0, 0] },
    Z: { pos: [-3, -3, 0], rot: [0, 0, 0] },
    A: { pos: [0, -3, 0], rot: [0, 0, 0] },
    B: { pos: [3, -3, 0], rot: [0, 0, 0] },
    P: { pos: [0, 0, 3], rot: [0, 0, 0] }
  }
};
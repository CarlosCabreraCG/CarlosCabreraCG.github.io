// Registro de "anclas": los espacios vacíos (<SomaSpacer />) se registran aquí
// y el fondo (<SomaBackground />) los consulta en cada frame.
// No necesita ser reactivo: el fondo lo lee dentro de su loop de render.

const anchors = new Set();

/**
 * Registra un ancla { el, figure, enterAt, leaveAt }.
 * Devuelve una función para desregistrarla.
 */
export function registerSomaAnchor(anchor) {
  anchors.add(anchor);
  return () => anchors.delete(anchor);
}

export function getSomaAnchors() {
  return anchors;
}
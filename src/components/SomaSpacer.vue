<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { registerSomaAnchor } from '@/composables/useSomaAnchors';

/**
 * Espacio vacío. No dibuja nada: solo le dice a <SomaBackground /> dónde
 * y cuándo debe armarse una figura.
 *
 * progress (0 → 1) mide cómo pasa el espacio por la pantalla:
 *   0 = su borde superior asoma por abajo · 0.5 = centrado · 1 = sale por arriba
 * La figura se arma mientras progress esté entre enterAt y leaveAt.
 */
const props = defineProps({
  figure:  { type: String, required: true },   // 'camel' | 'cristal' | 'gordian' | ...
  height:  { type: String, default: '90vh' },
  enterAt: { type: Number, default: 0.3 },
  leaveAt: { type: Number, default: 0.7 }
});

const elRef = ref(null);
let unregister = null;

onMounted(() => {
  unregister = registerSomaAnchor({
    el: elRef.value,
    get figure()  { return props.figure; },
    get enterAt() { return props.enterAt; },
    get leaveAt() { return props.leaveAt; }
  });
});

onBeforeUnmount(() => unregister?.());
</script>

<template>
  <div
    ref="elRef"
    class="soma-spacer"
    :style="{ height }"
    aria-hidden="true"
  ></div>
</template>

<style scoped>
.soma-spacer {
  width: 100%;
  pointer-events: none;
}
</style>
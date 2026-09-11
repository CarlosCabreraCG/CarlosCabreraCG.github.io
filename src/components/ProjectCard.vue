<script setup>
import { useTilt } from '../composables/useTilt';
import Icon from './Icon.vue';

const props = defineProps({
  project: Object,
  index: Number
});

const { elementRef, handleMove, handleLeave } = useTilt(8);
</script>

<template>
  <div
    ref="elementRef"
    @mousemove="handleMove"
    @mouseleave="handleLeave"
    class="tilt-card glass glow-border rounded-3xl overflow-hidden group reveal"
    :style="{ transitionDelay: `${index * 100}ms` }"
  >
    <div class="relative h-56 overflow-hidden">
      <div :class="['w-full h-full bg-gradient-to-br', project.accent, 'opacity-80']">
        <div class="absolute inset-0 grid-bg opacity-30"></div>
      </div>
      
      <div class="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/40 to-transparent"></div>
      <div class="absolute top-4 right-4 flex gap-2">
        <a :href="project.github" class="w-9 h-9 rounded-xl glass flex items-center justify-center text-white hover:bg-white/10 transition-colors" aria-label="GitHub">
          <Icon name="github" class="w-4 h-4" />
        </a>
        <a :href="project.demo" class="w-9 h-9 rounded-xl glass flex items-center justify-center text-white hover:bg-white/10 transition-colors" aria-label="Demo">
          <Icon name="external" class="w-4 h-4" />
        </a>
      </div>
      <div class="absolute bottom-4 left-5 tilt-inner">
        <span class="text-xs font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 px-2 py-1 rounded-md">
          0{{ project.id }} / 03
        </span>
      </div>
    </div>

    <div class="p-6 tilt-inner">
      <div class="flex items-start justify-between mb-2">
        <h3 class="text-xl font-bold text-white group-hover:gradient-text transition-all">
          {{ project.title }}
        </h3>
        <Icon name="arrow" class="w-5 h-5 text-gray-500 group-hover:text-indigo-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
      </div>
      <p class="text-sm text-indigo-300 mb-3 font-mono">{{ project.tagline }}</p>
      <p class="text-sm text-gray-400 leading-relaxed mb-4">
        {{ project.description }}
      </p>

      <ul class="space-y-1.5 mb-5">
        <li v-for="h in project.highlights" :key="h" class="flex items-start gap-2 text-xs text-gray-400">
          <span class="mt-1 w-1 h-1 rounded-full bg-indigo-400 flex-shrink-0"></span>
          {{ h }}
        </li>
      </ul>

      <div class="flex flex-wrap gap-1.5">
        <span v-for="t in project.tech" :key="t" class="px-2.5 py-1 rounded-md text-xs font-mono bg-white/5 text-gray-300 border border-white/5">
          {{ t }}
        </span>
      </div>
    </div>
  </div>
</template>
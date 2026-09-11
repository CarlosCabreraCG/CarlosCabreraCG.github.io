<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import Icon from './Icon.vue';
import { NAV_LINKS } from '../data/projects';

const scrolled = ref(false);
const open = ref(false);

const onScroll = () => {
  scrolled.value = window.scrollY > 20;
};

onMounted(() => window.addEventListener('scroll', onScroll));
onUnmounted(() => window.removeEventListener('scroll', onScroll));
</script>

<template>
  <nav :class="['fixed top-0 left-0 right-0 z-50 transition-all duration-500', scrolled ? 'py-3' : 'py-5']">
    <div class="mx-auto max-w-7xl px-6 transition-all duration-500">
      <div :class="['flex items-center justify-between rounded-2xl px-5 py-3 transition-all duration-500', scrolled ? 'glass shadow-2xl shadow-black/40' : '']">
        <a href="#home" class="flex items-center gap-2 group">
          <div class="relative w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30 group-hover:rotate-12 transition-transform">
            CG
            <span class="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 blur-lg opacity-40 group-hover:opacity-70 transition-opacity"></span>
          </div>
          <span class="font-bold text-white text-lg hidden sm:inline">Carlos Cabrera</span>
        </a>

        <div class="hidden md:flex items-center gap-1">
          <a
            v-for="link in NAV_LINKS"
            :key="link.href"
            :href="link.href"
            class="relative px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors group"
          >
            {{ link.label }}
            <span class="absolute inset-x-4 bottom-1 h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
          </a>
          <a href="#contact" class="ml-3 px-4 py-2 rounded-xl btn-primary text-white text-sm font-medium">
            Let's talk
          </a>
        </div>

        <button
          class="md:hidden text-white p-2"
          @click="open = !open"
          aria-label="Menu"
        >
          <Icon :name="open ? 'close' : 'menu'" />
        </button>
      </div>

      <div :class="['md:hidden overflow-hidden mobile-menu', open ? 'max-h-80 opacity-100 mt-2' : 'max-h-0 opacity-0']">
        <div class="glass rounded-2xl p-4 flex flex-col gap-1">
          <a
            v-for="link in NAV_LINKS"
            :key="link.href"
            :href="link.href"
            @click="open = false"
            class="px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            {{ link.label }}
          </a>
          <a href="#contact" @click="open = false" class="mt-2 px-4 py-3 rounded-xl btn-primary text-white text-center font-medium">
            Let's talk
          </a>
        </div>
      </div>
    </div>
  </nav>
</template>
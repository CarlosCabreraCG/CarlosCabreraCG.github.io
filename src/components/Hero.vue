<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import Icon from './Icon.vue';

const roles = [ 
  "AWS - Azure",
  "Desarrollo de API REST", 
  "React + NestJS + PostgreSQL", 
  "Machine Learning + Python"];
const roleIdx = ref(0);
const text = ref("");
const deleting = ref(false);
let timeout;

const typeLoop = () => {
  const current = roles[roleIdx.value];
  if (!deleting.value && text.value.length < current.length) {
    timeout = setTimeout(() => {
      text.value = current.slice(0, text.value.length + 1);
      typeLoop();
    }, 80);
  } else if (!deleting.value && text.value.length === current.length) {
    timeout = setTimeout(() => {
      deleting.value = true;
      typeLoop();
    }, 1800);
  } else if (deleting.value && text.value.length > 0) {
    timeout = setTimeout(() => {
      text.value = current.slice(0, text.value.length - 1);
      typeLoop();
    }, 40);
  } else if (deleting.value && text.value.length === 0) {
    deleting.value = false;
    roleIdx.value = (roleIdx.value + 1) % roles.length;
    typeLoop();
  }
};

onMounted(() => typeLoop());
onBeforeUnmount(() => clearTimeout(timeout));
</script>

<template>
  <section id="home" class="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16">
    <div class="absolute inset-0 grid-bg"></div>
    <div class="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-3xl animate-blob"></div>
    <div class="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-fuchsia-600/20 rounded-full blur-3xl animate-blob" style="animation-delay: 4s"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-500/10 rounded-full blur-3xl"></div>

    <div class="relative z-10 max-w-6xl mx-auto px-6 text-center">
      <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-in">
        <span class="relative flex h-2 w-2">
          <span class="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
        </span>
        <span class="text-sm text-gray-300">Disponible para nuevos proyectos</span>
      </div>

      <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-6 animate-fade-up">
        <span class="block text-white">Desarrollador Web </span>
        <span class="block gradient-text">Full Stack</span>
      </h1>

      <div class="h-10 mb-8 flex items-center justify-center">
        <p class="text-lg sm:text-xl md:text-2xl text-gray-400 font-mono">
          <span class="text-indigo-400">&gt;</span> {{ text }}<span class="typing-cursor"></span>
        </p>
      </div>

      <p class="max-w-2xl mx-auto text-base sm:text-lg text-gray-400 mb-10 animate-fade-up" style="animation-delay: 0.2s">
        Diseño y despliego aplicaciones full-stack listas para producción —desde interfaces en React con precisión de 
        píxel hasta APIs escalables en NestJS— integrando flujos de trabajo y agentes IA en el desarollo.
      </p>

      <div class="flex flex-wrap items-center justify-center gap-4 animate-fade-up" style="animation-delay: 0.4s">
        <a href="#projects" class="group btn-primary px-7 py-3.5 rounded-xl text-white font-medium inline-flex items-center gap-2">
          Ver proyectos
          <Icon name="arrow" class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </a>
        <a href="#contact" class="group px-7 py-3.5 rounded-xl glass text-white font-medium inline-flex items-center gap-2 hover:border-indigo-400/50 transition-colors">
          <Icon name="mail" class="w-4 h-4" />
          Contáctame
        </a>
      </div>

      <div class="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto animate-fade-up" style="animation-delay: 0.6s">
        <div v-for="s in [{ k: '2+', v: 'Años de exp.' }, { k: '3+', v: 'Proyectos entregados' }, { k: '6+', v: 'Tecnologías en uso' }, { k: '3+', v: 'Años haciendo la tesis' }]" :key="s.v" class="glass rounded-2xl p-5 text-center hover:-translate-y-1 transition-transform">
          <div class="text-2xl md:text-3xl font-bold gradient-text">{{ s.k }}</div>
          <div class="text-xs md:text-sm text-gray-400 mt-1">{{ s.v }}</div>
        </div>
      </div>
    </div>

    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-500 animate-float">
      <span class="text-xs tracking-widest uppercase">Scroll</span>
      <div class="w-px h-10 bg-gradient-to-b from-gray-500 to-transparent"></div>
    </div>
  </section>
</template>
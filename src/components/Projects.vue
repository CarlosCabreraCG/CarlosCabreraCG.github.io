<script setup>
import { PROJECTS } from '../data/projects';
import ProjectCard from './ProjectCard.vue';
</script>

<template>
  <section id="projects" class="relative py-28">
    <div class="max-w-7xl mx-auto px-6">
      <div class="flex flex-col md:flex-row md:items-end md:justify-between mb-14 gap-6 reveal">
        <div>
          <span class="inline-block px-3 py-1 rounded-full text-xs font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 mb-4">
            // Trabajos destacados
          </span>
          <h2 class="text-4xl md:text-5xl font-bold text-white">
            Algunos <span class="gradient-text">proyectos</span>
          </h2>
        </div>
        <p class="text-gray-400 max-w-md">
          A sample of recent work across SaaS, AI agents and data platforms.
          Each project is production-ready and open to discussion.
        </p>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ProjectCard v-for="(p, i) in PROJECTS" :key="p.id" :project="p" :index="i" />
      </div>
    </div>
  </section>
</template>
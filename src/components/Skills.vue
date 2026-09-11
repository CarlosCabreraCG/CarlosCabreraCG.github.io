<script setup>
import { SKILLS } from '../data/skills';
import Icon from './Icon.vue';
</script>

<template>
  <section id="skills" class="relative py-28 overflow-hidden">
    <div class="max-w-7xl mx-auto px-6">
      <div class="text-center mb-16 reveal">
        <span class="inline-block px-3 py-1 rounded-full text-xs font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 mb-4">
          // TECH STACK
        </span>
        <h2 class="text-4xl md:text-5xl font-bold text-white mb-4">
          Tools I <span class="gradient-text">craft with</span>
        </h2>
        <p class="text-gray-400 max-w-2xl mx-auto">
          A focused, modern stack chosen for velocity, scalability and developer joy.
        </p>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 reveal">
        <div
          v-for="(skill, i) in SKILLS"
          :key="skill.name"
          class="skill-icon glass glow-border rounded-2xl p-6 flex flex-col items-center gap-3 cursor-default"
          :style="{ transitionDelay: `${i * 50}ms` }"
        >
          <div
            class="w-14 h-14 rounded-xl flex items-center justify-center transition-transform"
            :style="{
              background: `radial-gradient(circle at 30% 30%, ${skill.color}33, transparent 70%)`,
              color: skill.color,
            }"
          >
            <Icon :name="skill.icon" class="w-9 h-9" />
          </div>
          <div class="text-sm font-medium text-white">{{ skill.name }}</div>
          <div class="h-1 w-10 rounded-full" :style="{ background: `linear-gradient(90deg, ${skill.color}, transparent)` }"></div>
        </div>
      </div>

      <div class="mt-16 overflow-hidden reveal">
        <div class="flex gap-6 marquee-track whitespace-nowrap">
          <template v-for="_ in 2">
            <span v-for="t in ['Redux', 'Zustand', 'React Query', 'Prisma', 'TypeORM', 'FastAPI', 'PyTorch', 'LangChain', 'OpenAI', 'AWS', 'Vercel', 'CI/CD', 'Jest', 'Playwright']" :key="t + Math.random()" class="px-5 py-2 rounded-full glass text-sm text-gray-400">
              {{ t }}
            </span>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>
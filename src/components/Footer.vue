<template>
  <footer class="relative border-t border-white/5 py-10 mt-10">
    <div class="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center font-bold text-white text-sm">
          CG
        </div>
        <span class="text-sm text-gray-400">
          © {{ new Date().getFullYear() }} Carlos cabrera. Crafted with Vue + Tailwind + Three.js.
        </span>
      </div>
      <div class="flex items-center gap-5 text-sm text-gray-500">
        <a href="#home" class="hover:text-white transition-colors">Home</a>
        <a href="#skills" class="hover:text-white transition-colors">Skills</a>
        <a href="#projects" class="hover:text-white transition-colors">Projects</a>
        <a href="#contact" class="hover:text-white transition-colors">Contact</a>
      </div>
    </div>
  </footer>
</template>
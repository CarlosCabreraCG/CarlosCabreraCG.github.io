<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import { useScrollReveal } from './composables/useScrollReveal';
import Navbar from './components/Navbar.vue';
import Hero from './components/Hero.vue';
import Skills from './components/Skills.vue';
import Projects from './components/Projects.vue';
import Contact from './components/Contact.vue';
import Footer from './components/Footer.vue';
import SomaFigure from './components/SomaFigure.vue';
useScrollReveal();

// Scroll Progress Logic
const updateProgress = () => {
  const h = document.documentElement;
  const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
  const bar = document.getElementById('scrollProgress');
  if (bar) bar.style.width = scrolled + '%';
};

// Cursor Logic
let mx = 0, my = 0, rx = 0, ry = 0;
let animFrameId;

const initCursor = () => {
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (!dot || !ring) return;
  
  if (window.matchMedia('(pointer: coarse)').matches) {
    dot.style.display = 'none';
    ring.style.display = 'none';
    return;
  }

  const onMove = (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top = my + 'px';
  };

  const animate = () => {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';
    animFrameId = requestAnimationFrame(animate);
  };

  const onOver = (e) => {
    if (e.target.closest('a, button, input, textarea')) {
      ring.style.width = '54px';
      ring.style.height = '54px';
      ring.style.borderColor = 'rgba(139,92,246,0.9)';
      dot.style.transform = 'translate(-50%,-50%) scale(0.6)';
    } else {
      ring.style.width = '36px';
      ring.style.height = '36px';
      ring.style.borderColor = 'rgba(167,139,250,0.5)';
      dot.style.transform = 'translate(-50%,-50%) scale(1)';
    }
  };

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseover', onOver);
  animate();
};

onMounted(() => {
  window.addEventListener('scroll', updateProgress);
  initCursor();
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateProgress);
  cancelAnimationFrame(animFrameId);
});
</script>

<template>
  <div class="relative min-h-screen noise">
    <div class="scroll-progress" id="scrollProgress"></div>
    <div class="cursor-ring" id="cursorRing"></div>
    <div class="cursor-dot" id="cursorDot"></div>
    
    <Navbar />
    <main class="relative z-10">
      <Hero />

      <!-- Espacio vacío → Camello -->
      <SomaFigure bleed="50vh" figure="camel" height="80vh" :enter-at="0.25" :leave-at="0.75" :view-size="8"/>

      <Skills />

      <!-- Espacio vacío → Cristal -->
      <SomaFigure bleed="50vh" figure="cristal" height="80vh" :enter-at="0.25" :leave-at="0.75" :view-size="8"/>

      <Projects />

      <!-- Espacio vacío → Nudo gordiano -->
      <SomaFigure bleed="50vh" figure="gordian" height="80vh" :enter-at="0.25" :leave-at="0.75" :view-size="8"/>

      <Contact />
    </main>
    <Footer />
  </div>
</template>
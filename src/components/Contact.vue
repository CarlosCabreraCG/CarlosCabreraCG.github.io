<script setup>
import { ref } from 'vue';
import Icon from './Icon.vue';

const form = ref({ name: "", email: "", message: "" });
const status = ref(null); // 'sending' | 'sent' | null

const handleSubmit = (e) => {
  e.preventDefault();
  if (!form.value.name || !form.value.email || !form.value.message) return;
  status.value = 'sending';
  setTimeout(() => {
    status.value = 'sent';
    form.value = { name: "", email: "", message: "" };
    setTimeout(() => status.value = null, 4000);
  }, 1200);
};
</script>

<template>
  <section id="contact" class="relative py-28">
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl"></div>

    <div class="relative max-w-5xl mx-auto px-6">
      <div class="text-center mb-14 reveal">
        <span class="inline-block px-3 py-1 rounded-full text-xs font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 mb-4">
          // Contacto
        </span>
        <h2 class="text-4xl md:text-5xl font-bold text-white mb-4">
          Let's build <span class="gradient-text">something great</span>
        </h2>
        <p class="text-gray-400 max-w-xl mx-auto">
          ¿Tienes algún proyecto en mente, un puesto que cubrir o simplemente quieres charlar sobre IA y desarrollo web?
        </p>
      </div>

      <div class="grid md:grid-cols-5 gap-6 reveal">
        <div class="md:col-span-2 glass rounded-3xl p-7 flex flex-col gap-5">
          <div>
            <div class="text-xs font-mono text-indigo-300 mb-2">// CORREO</div>
            <a href="mailto:c.g.cabrera.gallardo@gmail.com" class="text-white hover:text-indigo-300 transition-colors flex items-center gap-3">
              <Icon name="mail" class="w-5 h-5" />
              c.g.cabrera.gallardo@gmail.com
            </a>
          </div>
          <div>
            <div class="text-xs font-mono text-indigo-300 mb-2">// HORARIO</div>
            <p class="text-white">Remote · UTC-5</p>
          </div>
          <div>
            <div class="text-xs font-mono text-indigo-300 mb-2">// REDES</div>
            <div class="flex gap-2">
              <a v-for="i in ['github', 'external']" :key="i" href="https://github.com/CarlosCabreraCG/" class="w-10 h-10 rounded-xl glass flex items-center justify-center text-gray-300 hover:text-white hover:border-indigo-400/50 transition-colors">
                <Icon :name="i" class="w-4 h-4" />
              </a>
            </div>
          </div>

          <div class="mt-auto pt-5 border-t border-white/5">
            <div class="flex items-center gap-2 text-xs text-gray-500 font-mono">
              <span class="relative flex h-2 w-2">
                <span class="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              O llama al +51 919038856 o enviando un whatsapp
            </div>
          </div>
        </div>

        <form @submit.prevent="handleSubmit" class="md:col-span-3 glass rounded-3xl p-7 space-y-5">
          <div class="grid sm:grid-cols-2 gap-5">
            <div>
              <label class="block text-xs font-mono text-gray-400 mb-2">NOMBRE</label>
              <input
                type="text"
                v-model="form.name"
                class="input-field w-full bg-ink-700/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none"
                placeholder="Juan perez"
                required
              />
            </div>
            <div>
              <label class="block text-xs font-mono text-gray-400 mb-2">EMAIL</label>
              <input
                type="email"
                v-model="form.email"
                class="input-field w-full bg-ink-700/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none"
                placeholder="juan@empresamillonaria.com"
                required
              />
            </div>
          </div>
          <div>
            <label class="block text-xs font-mono text-gray-400 mb-2">MNESAJE</label>
            <textarea
              rows="5"
              v-model="form.message"
              class="input-field w-full bg-ink-700/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none resize-none"
              placeholder="Tell me about your project, timeline and goals..."
              required
            ></textarea>
          </div>
          <div class="flex items-center justify-between gap-4 flex-wrap">
            <p class="text-xs text-gray-500">
              Se garantiza la  confidencialidad de toda la información laboral.
            </p>
            <button
              type="submit"
              :disabled="status === 'sending'"
              class="btn-primary px-6 py-3 rounded-xl text-white font-medium inline-flex items-center gap-2 disabled:opacity-60"
            >
              <template v-if="status === 'sending'">
                <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                Enviando, espera...
              </template>
              <template v-else-if="status === 'sent'">
                <Icon name="sparkle" class="w-4 h-4" />
                ¡Se envió!
              </template>
              <template v-else>
                Envia mensaje
                <Icon name="send" class="w-4 h-4" />
              </template>
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
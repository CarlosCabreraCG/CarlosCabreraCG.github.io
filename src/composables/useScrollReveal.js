import { onMounted, onBeforeUnmount } from 'vue';

export function useScrollReveal() {
  let observer;

  onMounted(() => {
    const els = document.querySelectorAll('.reveal');
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    
    els.forEach((el) => observer.observe(el));
  });

  onBeforeUnmount(() => {
    if (observer) observer.disconnect();
  });
}
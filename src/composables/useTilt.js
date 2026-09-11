import { ref } from 'vue'; // Note: useCallback isn't in Vue, just standard JS logic below

export function useTilt(intensity = 10) {
  const elementRef = ref(null);

  const handleMove = (e) => {
    const el = elementRef.value;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotY = ((x / rect.width) - 0.5) * intensity;
    const rotX = -((y / rect.height) - 0.5) * intensity;
    el.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02,1.02,1.02)`;
  };

  const handleLeave = () => {
    const el = elementRef.value;
    if (!el) return;
    el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)`;
  };

  return { elementRef, handleMove, handleLeave };
}
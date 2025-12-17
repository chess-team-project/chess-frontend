<template>
  <div class="timer-bubble" :class="{ active, danger: time < dangerThreshold }" :style="bubbleStyle">
    <div class="label">{{ label }}</div>
    <div class="bubble">
      {{ formatTime(time) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  time: number; // milliseconds
  label?: string;
  active?: boolean;
  dangerThreshold?: number; // milliseconds
  size?: number; // px
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  active: false,
  dangerThreshold: 10000,
  size: 100,
});

const bubbleStyle = computed(() => ({
  ['--bubble-size' as any]: props.size ? `${props.size}px` : '100px'
}));

const formatTime = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
</script>

<style scoped>
.timer-bubble {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  width: 120px;
}

.timer-bubble .label {
  font-size: 0.75rem;
  color: #444;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.timer-bubble .bubble {
  width: var(--bubble-size, 100px);
  height: var(--bubble-size, 100px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  background: #fff;
  border: 3px solid #ddd;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: all 0.25s ease;
  font-size: 1.1rem;
}

.timer-bubble.active .bubble {
  border-color: #0d6efd;
  box-shadow: 0 0 14px rgba(13,110,253,0.3);
  background: #e7f1ff;
}

.timer-bubble.danger .bubble {
  border-color: #dc3545;
  background: #fff0f1;
  color: #dc3545;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%,100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>

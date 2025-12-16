<template>
  <div class="timer-container">
    <!-- White Timer -->
    <div class="timer-card">
      <div class="timer-label">White</div>
      <div class="timer-circle" :class="{ 'active': isWhiteTurn, 'danger': whiteTime < 10000 }">
        <div class="timer-display">
          {{ formatTime(whiteTime) }}
        </div>
      </div>
    </div>

    <!-- Black Timer -->
    <div class="timer-card">
      <div class="timer-label">Black</div>
      <div class="timer-circle" :class="{ 'active': isBlackTurn, 'danger': blackTime < 10000 }">
        <div class="timer-display">
          {{ formatTime(blackTime) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  whiteTime: number; // milliseconds
  blackTime: number; // milliseconds
  currentTurn?: 'w' | 'b'; // 'w' for white, 'b' for black
}

const props = withDefaults(defineProps<Props>(), {
  whiteTime: 300000, // default 5 minutes
  blackTime: 300000, // default 5 minutes
  currentTurn: 'w',
});

const isWhiteTurn = computed(() => props.currentTurn === 'w');
const isBlackTurn = computed(() => props.currentTurn === 'b');

// Format milliseconds to MM:SS format
const formatTime = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
</script>

<style scoped>
.timer-container {
  display: flex;
  gap: 1rem;
  justify-content: center;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 0.5rem;
  min-height: 200px;
}

.timer-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.timer-label {
  font-weight: 600;
  font-size: 0.95rem;
  color: #333;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.timer-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.75rem;
  transition: all 0.3s ease;
  border: 3px solid #ddd;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.timer-circle.active {
  border-color: #007bff;
  box-shadow: 0 0 15px rgba(0, 123, 255, 0.4);
  background-color: #e7f1ff;
}

.timer-circle.danger {
  border-color: #dc3545;
  background-color: #ffe7eb;
}

.timer-circle.active.danger {
  box-shadow: 0 0 15px rgba(220, 53, 69, 0.5);
}

.timer-display {
  font-family: 'Monaco', 'Courier New', monospace;
  text-align: center;
  color: #333;
}

.timer-circle.danger .timer-display {
  color: #dc3545;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>

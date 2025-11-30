<template>
  <div class="row justify-content-center">
    <div class="col-lg-10">
      <div class="card shadow-sm">
        <div class="card-body">
          <h1 class="card-title h3 mb-4">Chessboard Test (FEN Rendering)</h1>

          <div class="mb-4">
            <label for="fen-input" class="form-label">
              <strong>FEN Position:</strong>
            </label>
            <div class="input-group mb-3">
              <input
                id="fen-input"
                v-model="fenInput"
                type="text"
                class="form-control"
                placeholder="Enter FEN notation"
                @input="updateFEN"
              />
              <button class="btn btn-outline-secondary" type="button" @click="resetToDefault">
                Reset to Default
              </button>
            </div>
            <div v-if="fenError" class="alert alert-danger mt-2">
              {{ fenError }}
            </div>
          </div>

          <div class="chessboard-container d-flex justify-content-center mb-4">
            <TheChessboard
              :key="`${currentFEN}-${orientation}`"
              :board-config="boardConfig"
              :reactive-config="true"
            />
          </div>

          <div class="mt-4">
            <div class="row">
              <div class="col-md-6">
                <p class="text-muted">
                  <strong>Current FEN:</strong> 
                  <code>{{ currentFEN }}</code>
                </p>
                <p class="text-muted">
                  <strong>Orientation:</strong> 
                  <select v-model="orientation" class="form-select d-inline-block w-auto ms-2">
                    <option value="white">White</option>
                    <option value="black">Black</option>
                  </select>
                </p>
              </div>
              <div class="col-md-6">
                <h5>Example FEN Positions:</h5>
                <div class="d-flex flex-column gap-2">
                  <button
                    v-for="example in exampleFENs"
                    :key="example.name"
                    class="btn btn-sm btn-outline-secondary text-start"
                    @click="loadExample(example)"
                  >
                    <strong>{{ example.name }}:</strong><br>
                    <small>{{ example.fen }}</small>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-4">
            <RouterLink class="btn btn-outline-primary" :to="{ name: 'Home' }">
              ← Back to Home
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { Chess } from 'chess.js';
import { TheChessboard } from 'vue3-chessboard';
import 'vue3-chessboard/style.css';

// Default starting position FEN
const DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const currentFEN = ref(DEFAULT_FEN);
const fenInput = ref(DEFAULT_FEN);
const fenError = ref('');
const orientation = ref<'white' | 'black'>('white');

const exampleFENs = [
  {
    name: 'Starting Position',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  },
  {
    name: 'Middle Game Example',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4'
  },
  {
    name: 'Endgame Example',
    fen: '8/8/8/8/8/4k3/4P3/4K3 w - - 0 1'
  },
  {
    name: 'Chess Puzzle',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3'
  }
];

// Board configuration as ref for reactive-config to work
const boardConfig = ref({
  fen: DEFAULT_FEN,
  orientation: 'white' as 'white' | 'black',
  coordinates: true,
  viewOnly: false,
});

// Helper function to update board config
const updateBoardConfig = () => {
  try {
    // Validate FEN
    const chess = new Chess(currentFEN.value);
    
    fenError.value = '';
    // Update properties directly to ensure reactivity
    boardConfig.value.fen = currentFEN.value;
    boardConfig.value.orientation = orientation.value;
  } catch (err) {
    fenError.value = `Invalid FEN: ${err instanceof Error ? err.message : 'Unknown error'}`;
    boardConfig.value.fen = DEFAULT_FEN;
    boardConfig.value.orientation = orientation.value;
  }
};

// Watch for changes in FEN and orientation to update board
watch([currentFEN, orientation], () => {
  updateBoardConfig();
}, { immediate: true });

const updateFEN = () => {
  currentFEN.value = fenInput.value.trim();
  // updateBoardConfig will be called by watch, but we can also call it directly
};

const resetToDefault = () => {
  currentFEN.value = DEFAULT_FEN;
  fenInput.value = DEFAULT_FEN;
  fenError.value = '';
  updateBoardConfig();
};

const loadExample = (example: { name: string; fen: string }) => {
  currentFEN.value = example.fen;
  fenInput.value = example.fen;
  fenError.value = '';
  updateBoardConfig();
};
</script>

<style scoped>
.chessboard-container {
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
}

code {
  background-color: #f8f9fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.9em;
  word-break: break-all;
}
</style>


<template>
  <div class="text-center py-5">
    <h1 class="display-4 mb-4">Welcome to Chess</h1>
    <p class="lead mb-5">
      Create a new game or join by key to start a match with a friend.
    </p>

    <div class="row justify-content-center g-4">
      <div class="col-md-4">
        <div class="card shadow-sm h-100">
          <div class="card-body d-flex flex-column">
            <h2 class="card-title">Create Game</h2>
            <p class="card-text flex-grow-1">
              Generate a unique key and share it so your opponent can join.
            </p>
            <RouterLink class="btn btn-primary" to="/lobby/create">
              Create Key
            </RouterLink>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card shadow-sm h-100">
          <div class="card-body d-flex flex-column">
            <h2 class="card-title">Join Game</h2>
            <p class="card-text flex-grow-1">
              Enter a key to join an existing game, or get one from a friend.
            </p>
            <RouterLink class="btn btn-outline-primary" to="/lobby/join">
              Enter Key
            </RouterLink>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card shadow-sm h-100 border-info">
          <div class="card-body d-flex flex-column">
            <h2 class="card-title">Test Chessboard</h2>
            <p class="card-text flex-grow-1">
              Test the chessboard component and render positions from FEN notation without connecting to a game.
            </p>
            <RouterLink class="btn btn-info" to="/test/chessboard">
              Test Board
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>


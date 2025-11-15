import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

import Home from '../views/Home.vue';
import CreateGame from '../components/CreateLobby.vue';
import JoinGame from '../components/JoinLobby.vue';
import GameBoard from '../components/GameBoard.vue';

const routes: RouteRecordRaw[] = [
     {
          path: '/',
          name: 'Home',
          component: Home,
     },
     {
          path: '/lobby',
          name: 'CreateGame',
          component: CreateGame,
     },
     {
          path: '/join',
          name: 'JoinGame',
          component: JoinGame,
     },
     {
          path: '/board',
          name: 'GameBoard',
          component: GameBoard,
     },
];

const router = createRouter({
     history: createWebHistory(),
     routes,
});

export default router;


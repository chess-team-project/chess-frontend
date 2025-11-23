import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

import Home from '../views/Home.vue';
import LobbyForm from '../components/Lobby.vue';
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
              component: LobbyForm,
              props: { mode: 'create' },
         },
         {
              path: '/join',
              name: 'JoinGame',
              component: LobbyForm,
              props: { mode: 'join' },
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


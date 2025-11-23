import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

import Home from "../views/Home.vue";
import Lobby from "../components/Lobby.vue";
import GameBoard from "../components/GameBoard.vue";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/lobby/create",
    name: "CreateGame",
    component: Lobby,
    props: { mode: "create" },
  },
  {
    path: "/lobby/join",
    name: "JoinGame",
    component: Lobby,
    props: { mode: "join" },
  },
  {
    path: "/board",
    name: "GameBoard",
    component: GameBoard,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

/**
 * Data Transfer Objects for communicating with the backend
 */

export interface CreateLobbyDto {
  name: string;
}

export interface JoinLobbyDto {
  roomId: string;
  name: string;
}

export interface GameJoinDto {
  roomId: string;
  playerName: string;
}

export interface Player {
  id: string;
  name: string;
}

/**
 * Socket.IO Event Interfaces
 * Mirrors backend socket event definitions
 */

import type { CreateLobbyDto, JoinLobbyDto, Player } from './dtos';

// Lobby Events
export interface S2CLobbyEvents {
  'lobby:created': (payload: {
    roomId: string;
    players: Player[];
    message: string;
  }) => void;
  'lobby:update': (payload: {
    roomId: string;
    players: Player[];
    message: string;
  }) => void;
  'lobby:error': (payload: { message: string }) => void;
  'game:start': (payload: {
    roomId: string;
    white: Player;
    black: Player;
  }) => void;
}

export interface C2SLobbyEvents {
  'lobby:create': (payload: CreateLobbyDto, ack?: () => void) => void;
  'lobby:join': (payload: JoinLobbyDto) => void;
}

// Game Events
type ChessMove = any;

export interface S2CGameEvents {
  'game:joined': (payload: { message: string }) => void;
  'game:opponentReady': (payload: { message: string }) => void;
  'game:moveMade': (payload: { move: ChessMove; playerName: string }) => void;
  'game:error': (payload: { message: string }) => void;
}

export interface C2SGameEvents {
  'game:join': (payload: { roomId: string; playerName: string }) => void;
  'game:move': (payload: {
    roomId: string;
    move: ChessMove;
    playerName: string;
  }) => void;
}

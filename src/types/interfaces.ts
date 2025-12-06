export interface S2CCommonEvents {
  'err': (payload: { message: string }) => void;
}
export interface S2CGameEvents extends S2CCommonEvents {
  'game:joined': (payload: { message: string }) => void;
  'game:opponentReady': (payload: { message: string }) => void;
  'game:update': (payload: GameSession) => void;
  'game:error': (payload: { message: string }) => void;
  'game:opponentDisconnected': (payload: { message: string }) => void;
}

export interface C2SGameEvents {
  'game:join': (payload: { roomId: string; playerName: string }) => void;
  'game:move': (payload: {
    roomId: string;
    /** Move string in algebraic squares format, e.g. 'e2e4' or 'e7e8q' */
    move: string;
    playerName: string;
  }) => void;
}

export interface GameSession {
  gameId: string;
  /** Optional: backend may include the assigned color for this client ('white'|'black') */
  playerColor?: 'white' | 'black';
  whitePlayer: {
    name: string;
    socketId: string | null;
    isCurrent: boolean;
  };
  blackPlayer: {
    name: string;
    socketId: string | null;
    isCurrent: boolean;
  };
  fen: string | null;
  legalMoves: string[] | null;
}


export interface S2CLobbyEvents extends S2CCommonEvents {
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
  'game:start': (payload: GameSession) => void;
  // Accept alternative/legacy event name if backend emits it
  'game:started'?: (payload: GameSession) => void;
}

export interface C2SLobbyEvents {
  'lobby:create': (payload: CreateLobbyDto) => void;
  'lobby:join': (payload: JoinLobbyDto) => void;
}

export interface Player {
  id: string;
  name: string;
}

export interface LobbyRoom {
  roomId: string;
  players: Player[];
  status: 'waiting' | 'ingame';
}

export interface CreateLobbyDto {
  name: string;
}

export interface JoinLobbyDto {
  roomId: string;
  name: string;
}

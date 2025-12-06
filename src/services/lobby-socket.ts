/**
 * Lobby Socket Service
 * Handles communication with the backend lobby namespace
 */

import { io, type Socket } from 'socket.io-client';
import type { C2SLobbyEvents, S2CLobbyEvents } from '@/types/interfaces';

class LobbySocketService {
  private socket: Socket<S2CLobbyEvents, C2SLobbyEvents> | null = null;
  private connected = false;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        
        this.socket = io(`${baseUrl}/lobby`, {
          transports: ['websocket'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
        });

        this.socket.on('connect', () => {
          this.connected = true;
          console.log('Connected to lobby socket');
          resolve();
        });

        this.socket.on('connect_error', (error: any) => {
          console.error('Lobby socket connection error:', error);
          reject(error);
        });

        this.socket.on('disconnect', () => {
          this.connected = false;
          console.log('Disconnected from lobby socket');
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  getSocket(): Socket<S2CLobbyEvents, C2SLobbyEvents> | null {
    return this.socket;
  }

  on<K extends keyof S2CLobbyEvents>(
    event: K,
    callback: S2CLobbyEvents[K]
  ): void {
    if (this.socket) {
      this.socket.on(event, callback as any);
    }
  }

  off<K extends keyof S2CLobbyEvents>(event: K): void {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  emit<K extends keyof C2SLobbyEvents>(
    event: K,
    ...args: Parameters<C2SLobbyEvents[K]>
  ): void {
    if (this.socket && this.connected) {
      this.socket.emit(event, ...args);
    } else {
      console.warn('Lobby socket not connected');
    }
  }
}

export const lobbySocketService = new LobbySocketService();

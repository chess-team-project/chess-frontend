/**
 * Game Socket Service
 * Handles communication with the backend game namespace
 */

import { io, type Socket } from 'socket.io-client';
import type { C2SGameEvents, S2CGameEvents } from '@/types/socket-events';

class GameSocketService {
  private socket: Socket<S2CGameEvents, C2SGameEvents> | null = null;
  private connected = false;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        
        this.socket = io(`${baseUrl}/game`, {
          transports: ['websocket'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
        });

        this.socket.on('connect', () => {
          this.connected = true;
          console.log('Connected to game socket');
          resolve();
        });

        this.socket.on('connect_error', (error: any) => {
          console.error('Game socket connection error:', error);
          reject(error);
        });

        this.socket.on('disconnect', () => {
          this.connected = false;
          console.log('Disconnected from game socket');
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

  getSocket(): Socket<S2CGameEvents, C2SGameEvents> | null {
    return this.socket;
  }

  on<K extends keyof S2CGameEvents>(
    event: K,
    callback: S2CGameEvents[K]
  ): void {
    if (this.socket) {
      this.socket.on(event, callback as any);
    }
  }

  off<K extends keyof S2CGameEvents>(event: K): void {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  emit<K extends keyof C2SGameEvents>(
    event: K,
    ...args: Parameters<C2SGameEvents[K]>
  ): void {
    if (this.socket && this.connected) {
      this.socket.emit(event, ...args);
    } else {
      console.warn('Game socket not connected');
    }
  }
}

export const gameSocketService = new GameSocketService();

import { create } from 'zustand';
import type { ClientMessage, ServerMessage } from './types';

interface GameState {
  token: string | null;
  user: any | null;
  setToken: (token: string | null) => void;
  setUser: (user: any | null) => void;
  logout: () => void;

  ws: WebSocket | null;
  isConnected: boolean;
  roomId: string | null;
  sessionId: string | null;
  color: 'w' | 'b' | null;
  players: { white: { username: string; rating: number }; black: { username: string; rating: number } } | null;
  
  fen: string;
  turn: 'w' | 'b';
  clock: { w: number, b: number };
  gameOverResult: string | null;
  chatMessages: {sender: string, text: string}[];
  rematchOffered: boolean;
  drawOfferReceived: boolean;
  matchmaking: boolean;
  createdRoomCode: string | null;
  
  connectWS: () => void;
  disconnectWS: () => void;
  sendMessage: (msg: ClientMessage) => void;
  
  // Game Actions
  findMatch: () => void;
  cancelFindMatch: () => void;
  sendMove: (from: string, to: string, promotion?: string) => void;
  resetGameState: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  token: localStorage.getItem('token'),
  user: null,
  setToken: (token) => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
    set({ token });
  },
  setUser: (user) => set({ user }),
  logout: () => {
    localStorage.removeItem('token');
    get().disconnectWS();
    set({ token: null, user: null });
  },

  ws: null,
  isConnected: false,
  roomId: sessionStorage.getItem('roomId'),
  sessionId: sessionStorage.getItem('sessionId'),
  color: null,
  players: null,
  
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  turn: 'w',
  clock: { w: 600000, b: 600000 },
  gameOverResult: null,
  chatMessages: [],
  rematchOffered: false,
  drawOfferReceived: false,
  matchmaking: false,
  createdRoomCode: null,
  
  connectWS: () => {
    const { token, ws, sessionId, roomId } = get();
    if (!token || (ws && ws.readyState !== WebSocket.CLOSED)) return;

    const wsUrl = (import.meta.env.VITE_WS_URL || 'ws://localhost:8080') + '?token=' + token;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      set({ ws: socket, isConnected: true });
      if (sessionId && roomId) {
        socket.send(JSON.stringify({ type: 'reconnect', roomId, sessionId, token }));
      }
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as ServerMessage;
        switch (msg.type) {
          case 'match_found':
            set({ 
              roomId: msg.roomId, 
              sessionId: msg.sessionId,
              color: msg.color === 'white' ? 'w' : 'b', 
              players: msg.players,
              matchmaking: false,
              gameOverResult: null,
              rematchOffered: false,
              drawOfferReceived: false,
              chatMessages: [] 
            });
            sessionStorage.setItem('roomId', msg.roomId);
            sessionStorage.setItem('sessionId', msg.sessionId);
            break;
          case 'room_created':
            set({ createdRoomCode: msg.roomCode });
            break;
          case 'room_joined':
            set({ 
              sessionId: msg.sessionId, 
              color: msg.color === 'white' ? 'w' : 'b',
              players: msg.players,
              gameOverResult: null 
            });
            sessionStorage.setItem('roomId', get().roomId!);
            sessionStorage.setItem('sessionId', msg.sessionId);
            break;
          case 'state':
            set({ fen: msg.fen, turn: msg.turn, clock: msg.clock });
            break;
          case 'game_over':
            set({ gameOverResult: msg.result });
            break;
          case 'chat':
            set((state) => ({ chatMessages: [...state.chatMessages, { sender: 'Opponent', text: msg.message }] }));
            break;
          case 'draw_offered':
            set({ drawOfferReceived: true });
            break;
          case 'rematch_offered':
            set({ rematchOffered: true });
            break;
          case 'error':
            alert(msg.message); // basic error handling for now
            break;
        }
      } catch (e) {
        console.error("Failed to parse WS message", e);
      }
    };

    socket.onclose = () => {
      set({ isConnected: false, ws: null });
      // auto reconnect in 3s
      setTimeout(() => {
        if (get().token) get().connectWS();
      }, 3000);
    };
  },

  disconnectWS: () => {
    const { ws } = get();
    if (ws) {
      ws.onclose = null; // disable auto-reconnect
      ws.close();
      set({ ws: null, isConnected: false });
    }
  },

  sendMessage: (msg) => {
    const { ws } = get();
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  },
  
  findMatch: () => {
    set({ matchmaking: true });
    get().sendMessage({ type: 'find_match' });
  },
  
  cancelFindMatch: () => {
    set({ matchmaking: false });
    get().sendMessage({ type: 'cancel_find_match' });
  },

  sendMove: (from, to, promotion) => {
    get().sendMessage({ type: 'move', from, to, promotion });
  },

  resetGameState: () => {
    set({
      roomId: null,
      sessionId: null,
      color: null,
      players: null,
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      turn: 'w',
      clock: { w: 600000, b: 600000 },
      gameOverResult: null,
      rematchOffered: false,
      drawOfferReceived: false,
      chatMessages: []
    });
    sessionStorage.removeItem('roomId');
    sessionStorage.removeItem('sessionId');
  }
}));

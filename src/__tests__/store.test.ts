import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '../store';

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

beforeEach(() => {
  useGameStore.setState({
    token: null, user: null, ws: null, isConnected: false,
    roomId: null, sessionId: null, color: null,
    fen: INITIAL_FEN,
    turn: 'w', clock: { w: 600000, b: 600000 },
    gameOverResult: null, chatMessages: [], rematchOffered: false, matchmaking: false,
  });
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
});

describe('Store — initial state', () => {
  it('token is null by default', () => {
    expect(useGameStore.getState().token).toBeNull();
  });

  it('isConnected is false by default', () => {
    expect(useGameStore.getState().isConnected).toBe(false);
  });

  it('fen is starting position', () => {
    expect(useGameStore.getState().fen).toBe(INITIAL_FEN);
  });
});

describe('Store — setToken', () => {
  it('stores token in state and localStorage', () => {
    useGameStore.getState().setToken('abc');
    expect(useGameStore.getState().token).toBe('abc');
    expect(localStorage.getItem('token')).toBe('abc');
  });

  it('removes token from localStorage when set to null', () => {
    localStorage.setItem('token', 'old');
    useGameStore.getState().setToken(null);
    expect(useGameStore.getState().token).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });
});

describe('Store — logout', () => {
  it('clears token and user from state and removes token from localStorage', () => {
    useGameStore.setState({ token: 'test', user: { name: 'test' } });
    localStorage.setItem('token', 'test');
    useGameStore.getState().logout();
    expect(useGameStore.getState().token).toBeNull();
    expect(useGameStore.getState().user).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });
});

describe('Store — findMatch', () => {
  it('sets matchmaking=true and calls sendMessage with find_match', () => {
    // Set up a mock WS so sendMessage actually sends
    const mockSend = vi.fn();
    useGameStore.setState({
      ws: { readyState: WebSocket.OPEN, send: mockSend } as any,
      isConnected: true,
    });

    useGameStore.getState().findMatch();

    expect(useGameStore.getState().matchmaking).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(JSON.stringify({ type: 'find_match' }));
  });
});

describe('Store — cancelFindMatch', () => {
  it('sets matchmaking=false and calls sendMessage with cancel_find_match', () => {
    const mockSend = vi.fn();
    useGameStore.setState({
      ws: { readyState: WebSocket.OPEN, send: mockSend } as any,
      isConnected: true,
      matchmaking: true,
    });

    useGameStore.getState().cancelFindMatch();

    expect(useGameStore.getState().matchmaking).toBe(false);
    expect(mockSend).toHaveBeenCalledWith(JSON.stringify({ type: 'cancel_find_match' }));
  });
});

describe('Store — sendMove', () => {
  it('calls sendMessage with correct move payload', () => {
    const mockSend = vi.fn();
    useGameStore.setState({
      ws: { readyState: WebSocket.OPEN, send: mockSend } as any,
      isConnected: true,
    });

    useGameStore.getState().sendMove('e2', 'e4');

    expect(mockSend).toHaveBeenCalledWith(
      JSON.stringify({ type: 'move', from: 'e2', to: 'e4', promotion: undefined })
    );
  });

  it('includes promotion when provided', () => {
    const mockSend = vi.fn();
    useGameStore.setState({
      ws: { readyState: WebSocket.OPEN, send: mockSend } as any,
      isConnected: true,
    });

    useGameStore.getState().sendMove('e7', 'e8', 'q');

    expect(mockSend).toHaveBeenCalledWith(
      JSON.stringify({ type: 'move', from: 'e7', to: 'e8', promotion: 'q' })
    );
  });
});

describe('Store — resetGameState', () => {
  it('resets fen, turn, clock, gameOverResult, rematchOffered, chatMessages', () => {
    useGameStore.setState({
      fen: 'some/fen',
      turn: 'b',
      clock: { w: 100, b: 200 },
      gameOverResult: 'White wins',
      rematchOffered: true,
      chatMessages: [{ sender: 'You', text: 'gg' }],
    });

    useGameStore.getState().resetGameState();

    const state = useGameStore.getState();
    expect(state.fen).toBe(INITIAL_FEN);
    expect(state.turn).toBe('w');
    expect(state.clock).toEqual({ w: 600000, b: 600000 });
    expect(state.gameOverResult).toBeNull();
    expect(state.rematchOffered).toBe(false);
    expect(state.chatMessages).toEqual([]);
  });
});

describe('Store — sendMessage', () => {
  it('sends JSON-stringified message when WS is open', () => {
    const mockSend = vi.fn();
    useGameStore.setState({
      ws: { readyState: WebSocket.OPEN, send: mockSend } as any,
    });

    useGameStore.getState().sendMessage({ type: 'find_match' });

    expect(mockSend).toHaveBeenCalledWith(JSON.stringify({ type: 'find_match' }));
  });

  it('does nothing when ws is null (no error)', () => {
    useGameStore.setState({ ws: null });
    expect(() => {
      useGameStore.getState().sendMessage({ type: 'find_match' });
    }).not.toThrow();
  });
});

describe('Store — connectWS', () => {
  it('does nothing when token is null', () => {
    useGameStore.setState({ token: null });
    useGameStore.getState().connectWS();
    expect(useGameStore.getState().ws).toBeNull();
  });
});

describe('Store — disconnectWS', () => {
  it('closes WS, sets isConnected=false, sets ws=null', () => {
    const mockClose = vi.fn();
    useGameStore.setState({
      ws: { readyState: WebSocket.OPEN, close: mockClose, onclose: null } as any,
      isConnected: true,
    });

    useGameStore.getState().disconnectWS();

    expect(mockClose).toHaveBeenCalled();
    expect(useGameStore.getState().isConnected).toBe(false);
    expect(useGameStore.getState().ws).toBeNull();
  });
});

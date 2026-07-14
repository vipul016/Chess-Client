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

/**
 * Helper: call connectWS, wait for onopen, then return the internal WS instance.
 */
async function connectAndGetWs() {
  useGameStore.getState().connectWS();
  // Wait for the setTimeout in MockWebSocket constructor to fire onopen
  await vi.waitFor(() => {
    expect(useGameStore.getState().isConnected).toBe(true);
  });
  return useGameStore.getState().ws!;
}

describe('Store WS Messages — match_found', () => {
  it('sets roomId, sessionId, color (white→w), clears matchmaking', async () => {
    useGameStore.setState({ token: 'tok', matchmaking: true });
    const ws = await connectAndGetWs();

    ws.onmessage?.({ data: JSON.stringify({
      type: 'match_found', roomId: 'room1', sessionId: 'sess1', color: 'white',
    })} as any);

    const state = useGameStore.getState();
    expect(state.roomId).toBe('room1');
    expect(state.sessionId).toBe('sess1');
    expect(state.color).toBe('w');
    expect(state.matchmaking).toBe(false);
  });

  it('saves roomId and sessionId to sessionStorage', async () => {
    useGameStore.setState({ token: 'tok' });
    const ws = await connectAndGetWs();

    ws.onmessage?.({ data: JSON.stringify({
      type: 'match_found', roomId: 'room2', sessionId: 'sess2', color: 'black',
    })} as any);

    expect(sessionStorage.getItem('roomId')).toBe('room2');
    expect(sessionStorage.getItem('sessionId')).toBe('sess2');
  });

  it('maps color "black" to "b"', async () => {
    useGameStore.setState({ token: 'tok' });
    const ws = await connectAndGetWs();

    ws.onmessage?.({ data: JSON.stringify({
      type: 'match_found', roomId: 'r', sessionId: 's', color: 'black',
    })} as any);

    expect(useGameStore.getState().color).toBe('b');
  });
});

describe('Store WS Messages — room_joined', () => {
  it('sets sessionId and color', async () => {
    useGameStore.setState({ token: 'tok', roomId: 'existing-room' });
    const ws = await connectAndGetWs();

    ws.onmessage?.({ data: JSON.stringify({
      type: 'room_joined', sessionId: 'sess-join', color: 'white',
    })} as any);

    const state = useGameStore.getState();
    expect(state.sessionId).toBe('sess-join');
    expect(state.color).toBe('w');
  });
});

describe('Store WS Messages — state', () => {
  it('updates fen, turn, clock', async () => {
    useGameStore.setState({ token: 'tok' });
    const ws = await connectAndGetWs();

    ws.onmessage?.({ data: JSON.stringify({
      type: 'state', fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
      turn: 'b', clock: { w: 595000, b: 600000 },
    })} as any);

    const state = useGameStore.getState();
    expect(state.fen).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');
    expect(state.turn).toBe('b');
    expect(state.clock).toEqual({ w: 595000, b: 600000 });
  });
});

describe('Store WS Messages — game_over', () => {
  it('sets gameOverResult string', async () => {
    useGameStore.setState({ token: 'tok' });
    const ws = await connectAndGetWs();

    ws.onmessage?.({ data: JSON.stringify({
      type: 'game_over', result: 'White wins by checkmate',
    })} as any);

    expect(useGameStore.getState().gameOverResult).toBe('White wins by checkmate');
  });
});

describe('Store WS Messages — chat', () => {
  it('appends message with sender="Opponent"', async () => {
    useGameStore.setState({ token: 'tok' });
    const ws = await connectAndGetWs();

    ws.onmessage?.({ data: JSON.stringify({
      type: 'chat', message: 'hello!',
    })} as any);

    const msgs = useGameStore.getState().chatMessages;
    expect(msgs).toHaveLength(1);
    expect(msgs[0]).toEqual({ sender: 'Opponent', text: 'hello!' });
  });

  it('accumulates multiple chat messages', async () => {
    useGameStore.setState({ token: 'tok' });
    const ws = await connectAndGetWs();

    ws.onmessage?.({ data: JSON.stringify({ type: 'chat', message: 'msg1' })} as any);
    ws.onmessage?.({ data: JSON.stringify({ type: 'chat', message: 'msg2' })} as any);
    ws.onmessage?.({ data: JSON.stringify({ type: 'chat', message: 'msg3' })} as any);

    const msgs = useGameStore.getState().chatMessages;
    expect(msgs).toHaveLength(3);
    expect(msgs[0].text).toBe('msg1');
    expect(msgs[1].text).toBe('msg2');
    expect(msgs[2].text).toBe('msg3');
  });
});

describe('Store WS Messages — rematch_offered', () => {
  it('sets rematchOffered=true', async () => {
    useGameStore.setState({ token: 'tok' });
    const ws = await connectAndGetWs();

    ws.onmessage?.({ data: JSON.stringify({ type: 'rematch_offered' })} as any);

    expect(useGameStore.getState().rematchOffered).toBe(true);
  });
});

describe('Store WS Messages — error', () => {
  it('triggers alert() with message', async () => {
    useGameStore.setState({ token: 'tok' });
    const ws = await connectAndGetWs();

    ws.onmessage?.({ data: JSON.stringify({ type: 'error', message: 'Room full' })} as any);

    expect(globalThis.alert).toHaveBeenCalledWith('Room full');
  });
});

describe('Store WS Messages — room_created', () => {
  it('triggers alert with room code', async () => {
    useGameStore.setState({ token: 'tok' });
    const ws = await connectAndGetWs();

    ws.onmessage?.({ data: JSON.stringify({ type: 'room_created', roomCode: 'ABC123' })} as any);

    expect(globalThis.alert).toHaveBeenCalledWith(
      expect.stringContaining('ABC123')
    );
  });
});

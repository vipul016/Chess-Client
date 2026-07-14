import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from '../../pages/Login';
import { useGameStore } from '../../store';

// Mock the api module
vi.mock('../../api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import { api } from '../../api';

beforeEach(() => {
  useGameStore.setState({
    token: null, user: null, ws: null, isConnected: false,
    roomId: null, sessionId: null, color: null,
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    turn: 'w', clock: { w: 600000, b: 600000 },
    gameOverResult: null, chatMessages: [], rematchOffered: false, matchmaking: false,
  });
  localStorage.clear();
  vi.clearAllMocks();
});

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

/** Helper to get form fields by their label text (using the wrapping label pattern) */
const getInputByLabel = (labelText: RegExp) => {
  const label = screen.getByText(labelText);
  // The input is a sibling of the label within the same div
  const container = label.closest('div')!;
  return container.querySelector('input')!;
};

describe('Login Page — rendering', () => {
  it('renders username input field', () => {
    renderLogin();
    const input = getInputByLabel(/username/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
  });

  it('renders password input field', () => {
    renderLogin();
    const input = getInputByLabel(/password/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'password');
  });

  it('renders login button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('renders "Sign up" link pointing to /signup', () => {
    renderLogin();
    const signupLink = screen.getByRole('link', { name: /sign up/i });
    expect(signupLink).toBeInTheDocument();
    expect(signupLink).toHaveAttribute('href', '/signup');
  });
});

describe('Login Page — form submission', () => {
  it('successful login: calls api.post, stores token, navigates to /lobby', async () => {
    const user = userEvent.setup();
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { token: 'jwt-token-123' },
    });

    renderLogin();

    const usernameInput = getInputByLabel(/username/i);
    const passwordInput = getInputByLabel(/password/i);

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        username: 'testuser',
        password: 'password123',
      });
    });

    expect(useGameStore.getState().token).toBe('jwt-token-123');
    expect(mockNavigate).toHaveBeenCalledWith('/lobby');
  });

  it('failed login: displays error message from server', async () => {
    const user = userEvent.setup();
    (api.post as ReturnType<typeof vi.fn>).mockRejectedValue({
      response: { data: { error: 'Invalid credentials' } },
    });

    renderLogin();

    const usernameInput = getInputByLabel(/username/i);
    const passwordInput = getInputByLabel(/password/i);

    await user.type(usernameInput, 'bad');
    await user.type(passwordInput, 'wrong');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});

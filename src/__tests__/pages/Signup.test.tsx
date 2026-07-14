import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Signup from '../../pages/Signup';
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

const renderSignup = () =>
  render(
    <MemoryRouter>
      <Signup />
    </MemoryRouter>
  );

/** Helper to get form fields by their label text (using the wrapping label pattern) */
const getInputByLabel = (labelText: RegExp) => {
  const label = screen.getByText(labelText);
  const container = label.closest('div')!;
  return container.querySelector('input')!;
};

describe('Signup Page — rendering', () => {
  it('renders username and password inputs', () => {
    renderSignup();
    const usernameInput = getInputByLabel(/username/i);
    const passwordInput = getInputByLabel(/password/i);
    expect(usernameInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
  });

  it('renders Sign Up button', () => {
    renderSignup();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('renders link to login page', () => {
    renderSignup();
    const loginLink = screen.getByRole('link', { name: /log in/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});

describe('Signup Page — client-side validation', () => {
  it('short username (2 chars) shows client-side error without hitting API', async () => {
    const user = userEvent.setup();
    renderSignup();

    const usernameInput = getInputByLabel(/username/i);
    const passwordInput = getInputByLabel(/password/i);

    await user.type(usernameInput, 'ab');
    await user.type(passwordInput, 'validpassword');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/username must be between 3 and 20 characters/i)).toBeInTheDocument();
    });

    expect(api.post).not.toHaveBeenCalled();
  });

  it('short password (5 chars) shows client-side error without hitting API', async () => {
    const user = userEvent.setup();
    renderSignup();

    const usernameInput = getInputByLabel(/username/i);
    const passwordInput = getInputByLabel(/password/i);

    await user.type(usernameInput, 'validuser');
    await user.type(passwordInput, '12345');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });

    expect(api.post).not.toHaveBeenCalled();
  });
});

describe('Signup Page — form submission', () => {
  it('successful signup: calls api.post, stores token, navigates to /lobby', async () => {
    const user = userEvent.setup();
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { token: 'new-jwt-token' },
    });

    renderSignup();

    const usernameInput = getInputByLabel(/username/i);
    const passwordInput = getInputByLabel(/password/i);

    await user.type(usernameInput, 'newuser');
    await user.type(passwordInput, 'password123');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/signup', {
        username: 'newuser',
        password: 'password123',
      });
    });

    expect(useGameStore.getState().token).toBe('new-jwt-token');
    expect(mockNavigate).toHaveBeenCalledWith('/lobby');
  });

  it('server error is displayed', async () => {
    const user = userEvent.setup();
    (api.post as ReturnType<typeof vi.fn>).mockRejectedValue({
      response: { data: { error: 'Username already taken' } },
    });

    renderSignup();

    const usernameInput = getInputByLabel(/username/i);
    const passwordInput = getInputByLabel(/password/i);

    await user.type(usernameInput, 'existinguser');
    await user.type(passwordInput, 'password123');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText('Username already taken')).toBeInTheDocument();
    });
  });
});

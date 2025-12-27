import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';

// Mock the useAuth hook
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: {} }),
  };
});

import { useAuth } from '../../contexts/AuthContext';

describe('LoginPage', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      login: mockLogin,
    });
  });

  const renderLoginPage = () => {
    return render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
  };

  it('should render login form', () => {
    renderLoginPage();

    expect(screen.getByRole('heading', { name: /connexion/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/nom d'utilisateur/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
  });

  it('should handle successful login for formateur', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({
      user: { id: 1, username: 'testuser', user_type: 'formateur' },
    });

    renderLoginPage();

    await user.type(screen.getByLabelText(/nom d'utilisateur/i), 'testuser');
    await user.type(screen.getByLabelText(/mot de passe/i), 'password123');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/formateur');
    });
  });

  it('should handle successful login for apprenant', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({
      user: { id: 1, username: 'testuser', user_type: 'apprenant' },
    });

    renderLoginPage();

    await user.type(screen.getByLabelText(/nom d'utilisateur/i), 'testuser');
    await user.type(screen.getByLabelText(/mot de passe/i), 'password123');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/apprenant');
    });
  });

  it('should display error message on login failure', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue({
      response: { data: { detail: 'Identifiants invalides' } },
    });

    renderLoginPage();

    await user.type(screen.getByLabelText(/nom d'utilisateur/i), 'wronguser');
    await user.type(screen.getByLabelText(/mot de passe/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(screen.getByText(/identifiants invalides/i)).toBeInTheDocument();
    });
  });

  it('should disable submit button while loading', async () => {
    const user = userEvent.setup();
    mockLogin.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderLoginPage();

    await user.type(screen.getByLabelText(/nom d'utilisateur/i), 'testuser');
    await user.type(screen.getByLabelText(/mot de passe/i), 'password123');
    
    const submitButton = screen.getByRole('button', { name: /se connecter/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /connexion\.\.\./i })).toBeDisabled();
    });
  });
});

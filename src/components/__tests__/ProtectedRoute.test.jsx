import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';

// Mock the useAuth hook
vi.mock('../../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../../contexts/AuthContext');
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

// Mock userService
vi.mock('../../api/users', () => ({
  userService: {
    getMe: vi.fn(),
  },
}));

import { useAuth } from '../../contexts/AuthContext';

describe('ProtectedRoute', () => {
  const TestComponent = () => <div>Protected Content</div>;

  const renderWithRouter = (component) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  it('should show loading spinner when loading', () => {
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: true,
    });

    renderWithRouter(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render children when authenticated', () => {
    useAuth.mockReturnValue({
      user: { id: 1, username: 'testuser', user_type: 'apprenant' },
      isAuthenticated: true,
      loading: false,
    });

    renderWithRouter(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should render children when authenticated with correct user type', () => {
    useAuth.mockReturnValue({
      user: { id: 1, username: 'testuser', user_type: 'formateur' },
      isAuthenticated: true,
      loading: false,
    });

    renderWithRouter(
      <ProtectedRoute requiredUserType="formateur">
        <TestComponent />
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should not render children when user type does not match', () => {
    useAuth.mockReturnValue({
      user: { id: 1, username: 'testuser', user_type: 'apprenant' },
      isAuthenticated: true,
      loading: false,
    });

    renderWithRouter(
      <ProtectedRoute requiredUserType="formateur">
        <TestComponent />
      </ProtectedRoute>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});

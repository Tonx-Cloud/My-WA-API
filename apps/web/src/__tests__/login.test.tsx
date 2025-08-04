import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginPageContent from '@/app/login/LoginPageContent';
import { useAuth } from '@/hooks/useAuthNextAuth';

// Mock das dependÃªncias
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/hooks/useAuthNextAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/hooks/useStableCallback', () => ({
  useStableCallback: (fn: any) => fn,
}));

// Mock do console para capturar warnings
const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

describe('LoginPageContent Component', () => {
  const mockPush = jest.fn();
  const mockLogin = jest.fn();
  const mockLoginWithGoogle = jest.fn();
  const mockGet = jest.fn();

  beforeEach(() => {
    // Setup mocks
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (useSearchParams as jest.Mock).mockReturnValue({
      get: mockGet,
    });
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      loginWithGoogle: mockLoginWithGoogle,
      loading: false,
      isAuthenticated: false,
    });

    // Reset mocks
    jest.clearAllMocks();
    mockGet.mockReturnValue(null);
    consoleSpy.mockClear();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  it('should render login form with all required elements', async () => {
    await act(async () => {
      render(<LoginPageContent />);
    });

    // Verificar elementos bÃ¡sicos
    expect(screen.getByRole('heading', { name: /fazer login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('should render Google login button with proper accessibility', async () => {
    await act(async () => {
      render(<LoginPageContent />);
    });

    // Verificar botÃ£o do Google com acessibilidade aprimorada
    const googleButton = screen.getByRole('button', {
      name: /continuar com google.*fazer login usando sua conta do google/i,
    });

    expect(googleButton).toBeInTheDocument();
    expect(googleButton).toHaveAttribute('aria-label');

    // Verificar texto visÃ­vel
    expect(screen.getByText('Continuar com Google')).toBeInTheDocument();

    // Verificar SVG tem aria-hidden
    const svgIcon = googleButton.querySelector('svg');
    expect(svgIcon).toHaveAttribute('aria-hidden', 'true');
  });

  it('should handle password visibility toggle with accessibility', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<LoginPageContent />);
    });

    const passwordInput = screen.getByLabelText(/senha/i);
    const toggleButton = screen.getByRole('button', { name: /mostrar senha/i });

    // Inicialmente, senha deve estar oculta
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(toggleButton).toHaveAttribute('aria-label', 'Mostrar senha');

    // Clicar para mostrar senha
    await act(async () => {
      await user.click(toggleButton);
    });

    await waitFor(() => {
      expect(passwordInput).toHaveAttribute('type', 'text');
      expect(screen.getByRole('button', { name: /ocultar senha/i })).toBeInTheDocument();
    });

    // Clicar novamente para ocultar
    const hideButton = screen.getByRole('button', { name: /ocultar senha/i });
    await act(async () => {
      await user.click(hideButton);
    });

    await waitFor(() => {
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(screen.getByRole('button', { name: /mostrar senha/i })).toBeInTheDocument();
    });
  });

  it('should handle form submission with proper async patterns', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ success: true });

    await act(async () => {
      render(<LoginPageContent />);
    });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/senha/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });

    // Preencher formulÃ¡rio
    await act(async () => {
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
    });

    // Submeter formulÃ¡rio
    await act(async () => {
      await user.click(submitButton);
    });

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('should handle Google login click', async () => {
    const user = userEvent.setup();
    mockLoginWithGoogle.mockResolvedValue({ success: true });

    await act(async () => {
      render(<LoginPageContent />);
    });

    const googleButton = screen.getByRole('button', {
      name: /continuar com google.*fazer login usando sua conta do google/i,
    });

    await act(async () => {
      await user.click(googleButton);
    });

    await waitFor(() => {
      expect(mockLoginWithGoogle).toHaveBeenCalled();
    });
  });

  it('should display URL error messages correctly', async () => {
    mockGet.mockImplementation(param => {
      if (param === 'error') return 'CredentialsSignin';
      return null;
    });

    await act(async () => {
      render(<LoginPageContent />);
    });

    await waitFor(() => {
      expect(screen.getByText('Credenciais invÃ¡lidas')).toBeInTheDocument();
    });
  });

  it('should redirect authenticated users', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      loginWithGoogle: mockLoginWithGoogle,
      loading: false,
      isAuthenticated: true,
    });

    await act(async () => {
      render(<LoginPageContent />);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should redirect to custom URL from searchParams', async () => {
    mockGet.mockImplementation(param => {
      if (param === 'from') return '/custom-route';
      return null;
    });
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      loginWithGoogle: mockLoginWithGoogle,
      loading: false,
      isAuthenticated: true,
    });

    await act(async () => {
      render(<LoginPageContent />);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/custom-route');
    });
  });

  it('should handle loading states correctly', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      loginWithGoogle: mockLoginWithGoogle,
      loading: true,
      isAuthenticated: false,
    });

    await act(async () => {
      render(<LoginPageContent />);
    });

    const submitButton = screen.getByRole('button', { name: /entrando/i });
    const googleButton = screen.getByRole('button', {
      name: /continuar com google.*fazer login usando sua conta do google/i,
    });

    expect(submitButton).toBeDisabled();
    expect(googleButton).toBeDisabled();
  });

  it('should have proper accessibility attributes', async () => {
    await act(async () => {
      render(<LoginPageContent />);
    });

    // Verificar labels dos inputs
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/senha/i);

    expect(emailInput).toHaveAttribute('required');
    expect(passwordInput).toHaveAttribute('required');
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Verificar autocomplete
    expect(emailInput).toHaveAttribute('autoComplete', 'email');
    expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
  });

  it('should handle keyboard navigation properly', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<LoginPageContent />);
    });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/senha/i);
    const toggleButton = screen.getByRole('button', { name: /mostrar senha/i });
    const submitButton = screen.getByRole('button', { name: /entrar/i });

    // Verificar navegaÃ§Ã£o por Tab
    await act(async () => {
      await user.tab();
    });
    expect(emailInput).toHaveFocus();

    await act(async () => {
      await user.tab();
    });
    expect(passwordInput).toHaveFocus();

    await act(async () => {
      await user.tab();
    });
    expect(toggleButton).toHaveFocus();

    await act(async () => {
      await user.tab();
    });
    expect(submitButton).toHaveFocus();
  });

  it('should handle different OAuth error types', async () => {
    const errorCases = [
      { error: 'OAuthSignin', message: 'Erro ao iniciar autenticaÃ§Ã£o com Google' },
      { error: 'OAuthCallback', message: 'Erro no callback do Google' },
      { error: 'OAuthCreateAccount', message: 'Erro ao criar conta com Google' },
      {
        error: 'OAuthAccountNotLinked',
        message: 'Conta nÃ£o vinculada. Use o mesmo mÃ©todo de login anterior.',
      },
      { error: 'UnknownError', message: 'Erro na autenticaÃ§Ã£o' },
    ];

    for (const { error, message } of errorCases) {
      mockGet.mockImplementation(param => {
        if (param === 'error') return error;
        return null;
      });

      const { unmount } = render(<LoginPageContent />);

      await waitFor(() => {
        expect(screen.getByText(message)).toBeInTheDocument();
      });

      unmount();
    }
  });
});

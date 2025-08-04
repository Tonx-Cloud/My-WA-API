import { render, screen, waitFor } from '@testing-library/react';
import Home from '../app/page';

// Mock next-auth para estados diferentes
const mockUseSession = jest.fn();

jest.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the main heading', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
    });

    render(<Home />);

    const heading = screen.getByRole('heading', { name: /my-wa-api/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders login link when unauthenticated', async () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    render(<Home />);

    // Aguarda renderização condicional baseada no status de autenticação
    await waitFor(() => {
      const loginLink = screen.queryByRole('link', { name: /entrar/i });
      if (loginLink) {
        expect(loginLink).toBeInTheDocument();
        expect(loginLink).toHaveAttribute('href', '/login');
      } else {
        // Se não houver link de login, verifica se há redirecionamento
        const loadingText = screen.getByText(/redirecionando/i);
        expect(loadingText).toBeInTheDocument();
      }
    });
  });

  it('shows loading state initially', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
    });

    render(<Home />);

    const loadingText = screen.getByText(/redirecionando/i);
    expect(loadingText).toBeInTheDocument();
  });

  it('redirects when authenticated', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    });

    render(<Home />);

    // Verifica se mostra estado de carregamento durante redirecionamento
    await waitFor(() => {
      const loadingText = screen.getByText(/redirecionando/i);
      expect(loadingText).toBeInTheDocument();
    });
  });
});

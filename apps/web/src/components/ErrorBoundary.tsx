'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error | undefined;
  errorInfo?: ErrorInfo | undefined;
  errorId?: string | undefined;
}

export class ReactErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Atualiza o state para mostrar a UI de fallback
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log detalhado do erro React #130
    console.group('🚨 React Error Boundary - Erro Capturado');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();

    // Usar nosso logger customizado
    logger.reactError(
      error,
      {
        componentStack: errorInfo.componentStack || undefined,
        errorBoundary: 'ReactErrorBoundary',
        errorInfo,
      },
      {
        boundaryLocation: 'Root Error Boundary',
        errorId: this.state.errorId,
      }
    );

    // Chamar callback personalizado se fornecido
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Atualizar state com errorInfo
    this.setState({ errorInfo });
  }

  private handleResetError = () => {
    logger.info('User reset error boundary', {
      type: 'error_boundary_reset',
      errorId: this.state.errorId,
    });

    this.setState({
      hasError: false,
    });
  };

  private readonly handleReportError = () => {
    logger.info('User reported error', {
      type: 'error_boundary_report',
      errorId: this.state.errorId,
      userReported: true,
    });

    // Aqui você pode implementar um sistema de report de bugs
    alert('Erro reportado para a equipe de desenvolvimento. Obrigado!');
  };

  override render() {
    if (this.state.hasError) {
      // UI de fallback customizada
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI de fallback padrão com debugging info
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h2 className="mt-6 text-2xl font-extrabold text-gray-900">Ops! Algo deu errado</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Encontramos um erro inesperado na aplicação
                </p>

                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-4 text-left">
                    <details className="bg-red-50 border border-red-200 rounded p-3">
                      <summary className="text-sm font-medium text-red-800 cursor-pointer">
                        Detalhes do Erro (Dev Mode)
                      </summary>
                      <div className="mt-2 text-xs text-red-700">
                        <p>
                          <strong>ID do Erro:</strong> {this.state.errorId}
                        </p>
                        <p>
                          <strong>Mensagem:</strong> {this.state.error?.message}
                        </p>
                        <p>
                          <strong>Tipo:</strong> {this.state.error?.name}
                        </p>
                        {this.state.errorInfo?.componentStack && (
                          <div className="mt-2">
                            <strong>Component Stack:</strong>
                            <pre className="whitespace-pre-wrap text-xs bg-white p-2 rounded border mt-1">
                              {this.state.errorInfo.componentStack}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={this.handleResetError}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Tentar Novamente
                </button>

                <button
                  onClick={this.handleReportError}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Reportar Erro
                </button>

                <button
                  onClick={() => (window.location.href = '/')}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Voltar ao Início
                </button>
              </div>

              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  Se o problema persistir, entre em contato com o suporte
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component para facilitar o uso
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WithErrorBoundaryComponent = (props: P) => (
    <ReactErrorBoundary fallback={fallback}>
      <WrappedComponent {...props} />
    </ReactErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryComponent;
}

export default ReactErrorBoundary;

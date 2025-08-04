'use client';

import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

interface ComponentDebuggerProps {
  componentName: string;
  enabled?: boolean;
  showInProduction?: boolean;
}

export function ComponentDebugger({
  componentName,
  enabled = true,
  showInProduction = false,
}: ComponentDebuggerProps) {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (!enabled) return;
    if (!isDevelopment && !showInProduction) return;

    // Coletar informações de debug do componente
    const info = {
      componentName,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      performance: {
        memory: (performance as any).memory
          ? {
              used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
              total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024),
              limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024),
            }
          : null,
      },
    };

    setDebugInfo(info);
    logger.componentDebug(componentName, info);

    // Detectar possíveis problemas que causam React Error #130
    const checkForCommonIssues = () => {
      const issues = [];

      // Verificar se existem elementos DOM órfãos
      const orphanElements = document.querySelectorAll('[data-reactroot]');
      if (orphanElements.length > 1) {
        issues.push('Multiple React roots detected');
      }

      // Verificar erros de console
      const originalError = console.error;
      console.error = (...args) => {
        if (
          args.some(
            arg =>
              typeof arg === 'string' &&
              (arg.includes('Minified React error') || arg.includes('Error #130'))
          )
        ) {
          issues.push(`Console error detected: ${args.join(' ')}`);
        }
        originalError.apply(console, args);
      };

      // Verificar eventos não tratados
      window.addEventListener('unhandledrejection', event => {
        issues.push(`Unhandled promise rejection: ${event.reason}`);
        logger.error(`Unhandled promise rejection in ${componentName}`, {
          type: 'unhandled_rejection',
          reason: event.reason,
          componentName,
        });
      });

      window.addEventListener('error', event => {
        issues.push(`Global error: ${event.message}`);
        logger.error(`Global error in ${componentName}`, {
          type: 'global_error',
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          componentName,
        });
      });

      if (issues.length > 0) {
        logger.warn(`Potential React #130 issues detected in ${componentName}`, {
          type: 'react_130_detection',
          issues,
          componentName,
        });
      }
    };

    const timer = setTimeout(checkForCommonIssues, 1000);
    return () => clearTimeout(timer);
  }, [componentName, enabled, isDevelopment, showInProduction]);

  // Não renderizar nada em produção a menos que explicitamente habilitado
  if (!isDevelopment && !showInProduction) {
    return null;
  }

  if (!enabled || !debugInfo) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <details className="bg-black bg-opacity-80 text-white text-xs p-3 rounded-lg">
        <summary className="cursor-pointer font-mono">🔍 Debug: {componentName}</summary>
        <div className="mt-2 space-y-1">
          <div>
            <strong>Timestamp:</strong> {debugInfo.timestamp}
          </div>
          <div>
            <strong>URL:</strong> {debugInfo.url}
          </div>
          <div>
            <strong>Viewport:</strong> {debugInfo.viewport.width}x{debugInfo.viewport.height}
          </div>
          {debugInfo.performance.memory && (
            <div>
              <strong>Memory:</strong> {debugInfo.performance.memory.used}MB /{' '}
              {debugInfo.performance.memory.total}MB
            </div>
          )}
          <div className="pt-2 border-t border-gray-600">
            <button
              onClick={() => logger.info(`Manual debug trigger for ${componentName}`, debugInfo)}
              className="text-blue-300 hover:text-blue-100 underline"
            >
              Log Debug Info
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}

// Hook personalizado para debugging de componentes
export function useComponentDebug(componentName: string, props?: any, state?: any) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (!isDevelopment) return;

    logger.componentDebug(componentName, props, state);

    // Verificar se props contém objetos que podem causar React #130
    if (props) {
      Object.entries(props).forEach(([key, value]) => {
        if (
          value &&
          typeof value === 'object' &&
          !Array.isArray(value) &&
          typeof value !== 'function'
        ) {
          // Verificar se o objeto tem métodos de renderização que podem ser problemáticos
          if ('render' in value || 'component' in value) {
            logger.warn(`Potentially problematic prop detected in ${componentName}`, {
              type: 'suspicious_prop',
              componentName,
              propKey: key,
              propType: typeof value,
              hasRender: 'render' in value,
              hasComponent: 'component' in value,
            });
          }
        }
      });
    }
  }, [componentName, props, state, isDevelopment]);

  return {
    logError: (error: Error, context?: any) => {
      logger.reactError(
        error,
        {
          componentStack: `in ${componentName}`,
          errorBoundary: 'useComponentDebug',
        },
        {
          ...context,
          componentName,
          props,
          state,
        }
      );
    },
    logInfo: (message: string, context?: any) => {
      logger.info(`[${componentName}] ${message}`, {
        ...context,
        componentName,
        props,
        state,
      });
    },
    logWarn: (message: string, context?: any) => {
      logger.warn(`[${componentName}] ${message}`, {
        ...context,
        componentName,
        props,
        state,
      });
    },
  };
}

export default ComponentDebugger;

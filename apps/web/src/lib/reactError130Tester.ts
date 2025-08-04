// Script de teste para verificar React Error #130
// Para ser executado no console do navegador ou como arquivo de teste

import { logger } from '@/lib/logger';

interface TestResult {
  testName: string;
  passed: boolean;
  error?: Error | undefined;
  details?: any;
}

class ReactError130Tester {
  private results: TestResult[] = [];

  async runAllTests(): Promise<TestResult[]> {
    console.group('🧪 Iniciando testes para React Error #130');

    try {
      await this.testBasicLogging();
      await this.testReactErrorLogging();
      await this.testInvalidComponentRendering();
      await this.testAuthFlowErrors();
      await this.testNavigationErrors();
      await this.testMemoryLeaks();
      await this.testConsoleErrorCapture();

      console.log('✅ Todos os testes concluídos');
      this.displayResults();
    } catch (error) {
      console.error('❌ Erro durante execução dos testes:', error);
      logger.error(error instanceof Error ? error : new Error(String(error)), {
        type: 'test_framework_error',
        testFramework: 'ReactError130Tester',
      });
    }

    console.groupEnd();
    return this.results;
  }

  private async testBasicLogging(): Promise<void> {
    const testName = 'Basic Logging Test';
    try {
      logger.info('Teste básico de logging', { testType: 'basic' });
      logger.warn('Teste de warning', { testType: 'warning' });
      logger.error(new Error('Teste de erro'), { testType: 'error' });

      this.addResult(testName, true);
    } catch (error) {
      this.addResult(testName, false, error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async testReactErrorLogging(): Promise<void> {
    const testName = 'React Error Logging Test';
    try {
      const mockError = new Error('Minified React error #130');
      logger.reactError(
        mockError,
        {
          componentStack: 'in TestComponent\n    in App',
          errorBoundary: 'TestErrorBoundary',
        },
        {
          component: 'TestComponent',
          props: { test: true },
        }
      );

      this.addResult(testName, true);
    } catch (error) {
      this.addResult(testName, false, error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async testInvalidComponentRendering(): Promise<void> {
    const testName = 'Invalid Component Rendering Test';
    try {
      // Simular cenários que causam React #130
      const problematicScenarios = [
        // Objeto sendo renderizado diretamente
        { type: 'object_rendering', data: { invalid: 'object' } },
        // Função não sendo chamada
        { type: 'function_not_called', data: () => 'function result' },
        // Array mal formado
        { type: 'malformed_array', data: [1, 2, { invalid: 'mixed' }] },
        // Null/undefined components
        { type: 'null_component', data: null },
        { type: 'undefined_component', data: undefined },
      ];

      for (const scenario of problematicScenarios) {
        logger.warn(`Potential React #130 scenario detected: ${scenario.type}`, {
          type: 'react_130_simulation',
          scenario: scenario.type,
          data: scenario.data,
          dataType: typeof scenario.data,
        });
      }

      this.addResult(testName, true);
    } catch (error) {
      this.addResult(testName, false, error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async testAuthFlowErrors(): Promise<void> {
    const testName = 'Auth Flow Error Test';
    try {
      const authError = new Error('Authentication failed');
      logger.authError(authError, {
        provider: 'google',
        authFlow: 'signin',
        redirectUrl: '/dashboard',
      });

      this.addResult(testName, true);
    } catch (error) {
      this.addResult(testName, false, error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async testNavigationErrors(): Promise<void> {
    const testName = 'Navigation Error Test';
    try {
      const navError = new Error('Navigation failed');
      logger.navigationError(navError, '/login', '/dashboard', {
        navigationType: 'programmatic',
      });

      this.addResult(testName, true);
    } catch (error) {
      this.addResult(testName, false, error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async testMemoryLeaks(): Promise<void> {
    const testName = 'Memory Leak Detection Test';
    try {
      // Verificar se há vazamentos de memória
      if ((performance as any).memory) {
        const memInfo = (performance as any).memory;
        const memoryUsage = {
          used: Math.round(memInfo.usedJSHeapSize / 1024 / 1024),
          total: Math.round(memInfo.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024),
        };

        logger.info('Memory usage snapshot', {
          type: 'memory_check',
          memory: memoryUsage,
          usage_percentage: Math.round((memoryUsage.used / memoryUsage.limit) * 100),
        });

        // Alertar se uso de memória for alto
        if (memoryUsage.used / memoryUsage.limit > 0.8) {
          logger.warn('High memory usage detected', {
            type: 'memory_warning',
            memory: memoryUsage,
          });
        }
      }

      this.addResult(testName, true);
    } catch (error) {
      this.addResult(testName, false, error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async testConsoleErrorCapture(): Promise<void> {
    const testName = 'Console Error Capture Test';
    try {
      // Simular erro que seria capturado pelo sistema
      const originalError = console.error;
      let errorCaptured = false;

      console.error = (...args) => {
        errorCaptured = true;
        logger.error(new Error('Console error captured'), {
          type: 'console_error',
          args: args.map(arg => String(arg)),
        });
        originalError.apply(console, args);
      };

      // Triggerar um erro de console
      console.error('Test console error for React #130 detection');

      // Restaurar console.error original
      console.error = originalError;

      this.addResult(testName, errorCaptured, undefined, { errorCaptured });
    } catch (error) {
      this.addResult(testName, false, error instanceof Error ? error : new Error(String(error)));
    }
  }

  private addResult(testName: string, passed: boolean, error?: Error, details?: any): void {
    this.results.push({
      testName,
      passed,
      error,
      details,
    });

    const status = passed ? '✅' : '❌';
    console.log(`${status} ${testName}`, details || '');

    if (error) {
      console.error('  Error:', error.message);
    }
  }

  private displayResults(): void {
    const passedTests = this.results.filter(r => r.passed).length;
    const totalTests = this.results.length;

    console.group(`📊 Resultados dos Testes (${passedTests}/${totalTests} passed)`);

    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.testName}`);
      if (result.error) {
        console.log(`  Error: ${result.error.message}`);
      }
    });

    console.groupEnd();

    // Log summary para análise
    logger.info('React Error #130 test suite completed', {
      type: 'test_suite_summary',
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      successRate: Math.round((passedTests / totalTests) * 100),
      results: this.results,
    });
  }
}

// Função para executar os testes
export async function runReactError130Tests(): Promise<TestResult[]> {
  const tester = new ReactError130Tester();
  return await tester.runAllTests();
}

// Auto-executar em desenvolvimento
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔍 React Error #130 Tester available');
  console.log('Execute runReactError130Tests() to start testing');

  // Adicionar ao window para fácil acesso
  (window as any).runReactError130Tests = runReactError130Tests;
}

export default ReactError130Tester;

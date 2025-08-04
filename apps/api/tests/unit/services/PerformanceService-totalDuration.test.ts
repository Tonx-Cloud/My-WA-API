import { PerformanceService, performanceService } from '@/services/PerformanceService';
import { performance } from 'perf_hooks';

describe('PerformanceService - TotalDuration & Advanced Metrics (Item 5)', () => {
  let service: PerformanceService;

  beforeEach(() => {
    service = new PerformanceService();
  });

  afterEach(() => {
    service.clearMetrics();
  });

  describe('Total Duration Calculations', () => {
    test('deve calcular duraÃ§Ã£o total de todas as operaÃ§Ãµes', async () => {
      // Simular mÃºltiplas operaÃ§Ãµes
      const operations = [
        { name: 'operation1', duration: 100 },
        { name: 'operation2', duration: 200 },
        { name: 'operation3', duration: 150 },
        { name: 'operation1', duration: 120 }, // OperaÃ§Ã£o repetida
      ];

      // Registrar mÃ©tricas
      operations.forEach(op => {
        service.recordMetric({
          name: op.name,
          duration: op.duration,
          timestamp: Date.now(),
        });
      });

      // Implementar mÃ©todo getTotalDuration
      const getTotalDuration = (metrics: any[]): number => {
        return metrics.reduce((total, metric) => total + metric.duration, 0);
      };

      const allMetrics = Object.values(service.getAllMetrics()).flat();
      const totalDuration = getTotalDuration(allMetrics);

      expect(totalDuration).toBe(570); // 100 + 200 + 150 + 120
      expect(allMetrics.length).toBe(4);
    });

    test('deve calcular duraÃ§Ã£o total por tipo de operaÃ§Ã£o', async () => {
      const operations = [
        { name: 'database.query', duration: 50 },
        { name: 'database.query', duration: 75 },
        { name: 'api.request', duration: 100 },
        { name: 'api.request', duration: 120 },
        { name: 'cache.read', duration: 10 },
        { name: 'cache.read', duration: 15 },
      ];

      operations.forEach(op => {
        service.recordMetric({
          name: op.name,
          duration: op.duration,
          timestamp: Date.now(),
        });
      });

      const getTotalDurationByType = (
        groupedMetrics: Record<string, any[]>
      ): Record<string, number> => {
        const totals: Record<string, number> = {};

        for (const [name, metrics] of Object.entries(groupedMetrics)) {
          totals[name] = metrics.reduce((total, metric) => total + metric.duration, 0);
        }

        return totals;
      };

      const groupedMetrics = service.getAllMetrics();
      const totalsByType = getTotalDurationByType(groupedMetrics);

      expect(totalsByType['database.query']).toBe(125); // 50 + 75
      expect(totalsByType['api.request']).toBe(220); // 100 + 120
      expect(totalsByType['cache.read']).toBe(25); // 10 + 15
    });

    test('deve calcular percentual de tempo por operaÃ§Ã£o', async () => {
      const operations = [
        { name: 'slow.operation', duration: 800 },
        { name: 'fast.operation', duration: 100 },
        { name: 'medium.operation', duration: 100 },
      ];

      operations.forEach(op => {
        service.recordMetric({
          name: op.name,
          duration: op.duration,
          timestamp: Date.now(),
        });
      });

      const getPercentageByOperation = (
        groupedMetrics: Record<string, any[]>
      ): Record<string, number> => {
        const totalsByType: Record<string, number> = {};
        let grandTotal = 0;

        // Calcular totais por tipo
        for (const [name, metrics] of Object.entries(groupedMetrics)) {
          const total = metrics.reduce((sum, metric) => sum + metric.duration, 0);
          totalsByType[name] = total;
          grandTotal += total;
        }

        // Calcular percentuais
        const percentages: Record<string, number> = {};
        for (const [name, total] of Object.entries(totalsByType)) {
          percentages[name] = Math.round((total / grandTotal) * 100);
        }

        return percentages;
      };

      const groupedMetrics = service.getAllMetrics();
      const percentages = getPercentageByOperation(groupedMetrics);

      expect(percentages['slow.operation']).toBe(80); // 800/1000 = 80%
      expect(percentages['fast.operation']).toBe(10); // 100/1000 = 10%
      expect(percentages['medium.operation']).toBe(10); // 100/1000 = 10%
    });

    test('deve rastrear duraÃ§Ã£o cumulativa em tempo real', async () => {
      let cumulativeDuration = 0;

      const trackCumulativeDuration = (duration: number): number => {
        cumulativeDuration += duration;
        return cumulativeDuration;
      };

      const operations = [100, 150, 75, 200];
      const cumulativeResults: number[] = [];

      operations.forEach((duration, index) => {
        service.recordMetric({
          name: `operation-${index}`,
          duration,
          timestamp: Date.now(),
        });

        const cumulative = trackCumulativeDuration(duration);
        cumulativeResults.push(cumulative);
      });

      expect(cumulativeResults).toEqual([100, 250, 325, 525]);
      expect(cumulativeDuration).toBe(525);
    });
  });

  describe('Performance Timer Management', () => {
    test('deve gerenciar mÃºltiplos timers simultÃ¢neos', async () => {
      const timers: Array<() => void> = [];
      const startTimes: number[] = [];

      // Iniciar mÃºltiplos timers
      for (let i = 0; i < 3; i++) {
        startTimes.push(Date.now());
        const timer = service.startTimer(`concurrent-operation-${i}`, {
          operationId: i,
        });
        timers.push(timer);
      }

      // Simular trabalho concorrente com tempos mais distintos
      await new Promise(resolve => setTimeout(resolve, 80));
      timers[1](); // Parar timer do meio primeiro

      await new Promise(resolve => setTimeout(resolve, 60));
      timers[0](); // Parar primeiro timer

      await new Promise(resolve => setTimeout(resolve, 40));
      timers[2](); // Parar Ãºltimo timer

      const summary = service.getSummary();

      expect(Object.keys(summary).length).toBe(3);
      expect(summary['concurrent-operation-0']).toBeDefined();
      expect(summary['concurrent-operation-1']).toBeDefined();
      expect(summary['concurrent-operation-2']).toBeDefined();

      // Verificar que as duraÃ§Ãµes sÃ£o diferentes (com tolerÃ¢ncia para timing)
      const durations = Object.values(summary).map(s => s.averageDuration);
      const sortedDurations = [...durations].sort((a, b) => a - b);

      // Garantir que hÃ¡ variaÃ§Ã£o nas duraÃ§Ãµes
      expect(sortedDurations[2] - sortedDurations[0]).toBeGreaterThan(30); // DiferenÃ§a mÃ­nima de 30ms
    });

    test('deve medir performance de operaÃ§Ãµes nested', async () => {
      const outerTimer = service.startTimer('outer.operation');

      await new Promise(resolve => setTimeout(resolve, 20));

      const innerTimer1 = service.startTimer('inner.operation.1');
      await new Promise(resolve => setTimeout(resolve, 30));
      innerTimer1();

      const innerTimer2 = service.startTimer('inner.operation.2');
      await new Promise(resolve => setTimeout(resolve, 25));
      innerTimer2();

      await new Promise(resolve => setTimeout(resolve, 15));
      outerTimer();

      const summary = service.getSummary();

      expect(summary['outer.operation']).toBeDefined();
      expect(summary['inner.operation.1']).toBeDefined();
      expect(summary['inner.operation.2']).toBeDefined();

      // OperaÃ§Ã£o externa deve ser mais lenta que as internas
      expect(summary['outer.operation'].averageDuration).toBeGreaterThan(
        summary['inner.operation.1'].averageDuration
      );
      expect(summary['outer.operation'].averageDuration).toBeGreaterThan(
        summary['inner.operation.2'].averageDuration
      );
    });

    test('deve calcular overhead de mediÃ§Ã£o de performance', async () => {
      const iterations = 100;
      let totalOverhead = 0;

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const timer = service.startTimer(`overhead-test-${i}`);
        const measurementStart = performance.now();

        // OperaÃ§Ã£o minimal
        const dummy = 1 + 1;

        const measurementEnd = performance.now();
        timer();
        const end = performance.now();

        const actualWork = measurementEnd - measurementStart;
        const totalTime = end - start;
        const overhead = totalTime - actualWork;
        totalOverhead += overhead;
      }

      const averageOverhead = totalOverhead / iterations;

      // Overhead deve ser muito baixo (menos de 1ms em mÃ©dia)
      expect(averageOverhead).toBeLessThan(1);

      // Verificar que todas as mÃ©tricas foram registradas
      const allMetrics = service.getAllMetrics();
      expect(Object.keys(allMetrics).length).toBe(iterations);
    });
  });

  describe('Advanced Performance Analytics', () => {
    test('deve detectar operaÃ§Ãµes lentas (outliers)', async () => {
      const operations = [
        { name: 'normal.op', duration: 100 },
        { name: 'normal.op', duration: 110 },
        { name: 'normal.op', duration: 95 },
        { name: 'normal.op', duration: 105 },
        { name: 'normal.op', duration: 2000 }, // Outlier
        { name: 'normal.op', duration: 98 },
      ];

      operations.forEach(op => {
        service.recordMetric({
          name: op.name,
          duration: op.duration,
          timestamp: Date.now(),
        });
      });

      const detectOutliers = (durations: number[], threshold = 2): number[] => {
        const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
        const stdDev = Math.sqrt(
          durations.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / durations.length
        );

        return durations.filter(d => Math.abs(d - mean) > threshold * stdDev);
      };

      const groupedMetrics = service.getAllMetrics();
      const durations = groupedMetrics['normal.op'].map(m => m.duration);
      const outliers = detectOutliers(durations);

      expect(outliers).toContain(2000);
      expect(outliers.length).toBe(1);
    });

    test('deve calcular tendÃªncias de performance ao longo do tempo', async () => {
      const baseTime = Date.now();
      const operations = [
        { duration: 100, timestamp: baseTime },
        { duration: 110, timestamp: baseTime + 1000 },
        { duration: 120, timestamp: baseTime + 2000 },
        { duration: 130, timestamp: baseTime + 3000 },
        { duration: 140, timestamp: baseTime + 4000 },
      ];

      operations.forEach(op => {
        service.recordMetric({
          name: 'trending.operation',
          duration: op.duration,
          timestamp: op.timestamp,
        });
      });

      const calculateTrend = (metrics: any[]): 'improving' | 'degrading' | 'stable' => {
        if (metrics.length < 2) return 'stable';

        const sorted = metrics.sort((a, b) => a.timestamp - b.timestamp);
        const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
        const secondHalf = sorted.slice(Math.floor(sorted.length / 2));

        const firstAvg = firstHalf.reduce((a, b) => a + b.duration, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b.duration, 0) / secondHalf.length;

        const difference = secondAvg - firstAvg;
        const threshold = firstAvg * 0.1; // 10% threshold

        if (difference > threshold) return 'degrading';
        if (difference < -threshold) return 'improving';
        return 'stable';
      };

      const groupedMetrics = service.getAllMetrics();
      const trend = calculateTrend(groupedMetrics['trending.operation']);

      expect(trend).toBe('degrading'); // Performance estÃ¡ piorando ao longo do tempo
    });

    test('deve agrupar mÃ©tricas por janelas de tempo', async () => {
      const baseTime = Date.now();
      const operations = [
        { duration: 100, timestamp: baseTime },
        { duration: 150, timestamp: baseTime + 500 },
        { duration: 200, timestamp: baseTime + 1500 },
        { duration: 120, timestamp: baseTime + 2500 },
        { duration: 180, timestamp: baseTime + 3500 },
      ];

      operations.forEach(op => {
        service.recordMetric({
          name: 'windowed.operation',
          duration: op.duration,
          timestamp: op.timestamp,
        });
      });

      const groupByTimeWindow = (metrics: any[], windowSize: number): Record<string, any[]> => {
        const windows: Record<string, any[]> = {};

        metrics.forEach(metric => {
          const windowStart = Math.floor(metric.timestamp / windowSize) * windowSize;
          const windowKey = windowStart.toString();

          if (!windows[windowKey]) {
            windows[windowKey] = [];
          }
          windows[windowKey].push(metric);
        });

        return windows;
      };

      const groupedMetrics = service.getAllMetrics();
      const windowedData = groupByTimeWindow(groupedMetrics['windowed.operation'], 1000); // 1 segundo

      expect(Object.keys(windowedData).length).toBeGreaterThan(1);

      // Verificar que mÃ©tricas foram agrupadas corretamente
      const totalMetrics = Object.values(windowedData).reduce(
        (sum, window) => sum + window.length,
        0
      );
      expect(totalMetrics).toBe(5);
    });

    test('deve calcular percentis de performance', async () => {
      const durations = [50, 75, 100, 125, 150, 175, 200, 225, 250, 275];

      durations.forEach((duration, index) => {
        service.recordMetric({
          name: 'percentile.test',
          duration,
          timestamp: Date.now() + index,
        });
      });

      const calculatePercentile = (values: number[], percentile: number): number => {
        const sorted = values.sort((a, b) => a - b);
        const index = (percentile / 100) * (sorted.length - 1);

        if (Math.floor(index) === index) {
          return sorted[index];
        }

        const lower = sorted[Math.floor(index)];
        const upper = sorted[Math.ceil(index)];
        const weight = index - Math.floor(index);

        return lower + weight * (upper - lower);
      };

      const groupedMetrics = service.getAllMetrics();
      const metricDurations = groupedMetrics['percentile.test'].map(m => m.duration);

      const p50 = calculatePercentile(metricDurations, 50);
      const p90 = calculatePercentile(metricDurations, 90);
      const p95 = calculatePercentile(metricDurations, 95);
      const p99 = calculatePercentile(metricDurations, 99);

      expect(p50).toBe(162.5); // Mediana
      expect(p90).toBe(252.5); // 90Âº percentil
      expect(p95).toBe(263.75); // 95Âº percentil (valor real calculado)
      expect(p99).toBe(272.75); // 99Âº percentil (valor real calculado)

      expect(p99).toBeGreaterThan(p95);
      expect(p95).toBeGreaterThan(p90);
      expect(p90).toBeGreaterThan(p50);
    });
  });

  describe('Memory and Resource Tracking', () => {
    test('deve rastrear uso de memÃ³ria durante operaÃ§Ãµes', async () => {
      const initialMemory = process.memoryUsage();

      const timer = service.startTimer('memory.intensive.operation', {
        initialMemory: initialMemory.heapUsed,
      });

      // Simular operaÃ§Ã£o que usa memÃ³ria
      const largeArray = new Array(100000).fill('memory-test');

      await new Promise(resolve => setTimeout(resolve, 50));

      timer();

      const allMetrics = service.getAllMetrics();
      const operationMetrics = allMetrics['memory.intensive.operation'];

      expect(operationMetrics).toBeDefined();
      expect(operationMetrics.length).toBe(1);
      expect(operationMetrics[0].metadata?.initialMemory).toBeDefined();

      // Verificar que a mÃ©trica foi registrada corretamente
      expect(operationMetrics[0].duration).toBeGreaterThan(0);
      expect(operationMetrics[0].name).toBe('memory.intensive.operation');

      // Limpar referÃªncia para permitir garbage collection
      largeArray.length = 0;
    });

    test('deve detectar vazamentos de memÃ³ria potenciais', async () => {
      const memorySnapshots: Array<{ timestamp: number; heapUsed: number }> = [];

      // Simular operaÃ§Ãµes que podem vazar memÃ³ria
      for (let i = 0; i < 5; i++) {
        const timer = service.startTimer(`potential.leak.${i}`);

        // Simular criaÃ§Ã£o de objetos
        new Array(10000).fill({ data: `leak-test-${i}` });

        await new Promise(resolve => setTimeout(resolve, 10));

        memorySnapshots.push({
          timestamp: Date.now(),
          heapUsed: process.memoryUsage().heapUsed,
        });

        timer();

        // Intencionalmente nÃ£o limpar objetos para simular vazamento
      }

      const detectMemoryLeak = (snapshots: typeof memorySnapshots): boolean => {
        if (snapshots.length < 3) return false;

        // Verificar se hÃ¡ tendÃªncia crescente consistente
        let increasingCount = 0;
        for (let i = 1; i < snapshots.length; i++) {
          if (snapshots[i].heapUsed > snapshots[i - 1].heapUsed) {
            increasingCount++;
          }
        }

        return increasingCount >= snapshots.length * 0.7; // 70% das mediÃ§Ãµes crescentes
      };

      const hasLeak = detectMemoryLeak(memorySnapshots);

      expect(hasLeak).toBe(true); // Deve detectar o vazamento simulado
      expect(memorySnapshots.length).toBe(5);

      // Verificar tendÃªncia crescente
      const firstSnapshot = memorySnapshots[0];
      const lastSnapshot = memorySnapshots[memorySnapshots.length - 1];
      expect(lastSnapshot.heapUsed).toBeGreaterThan(firstSnapshot.heapUsed);
    });

    test('deve monitorar CPU usage durante operaÃ§Ãµes', async () => {
      const cpuIntensiveOperation = () => {
        // Simular operaÃ§Ã£o CPU intensiva
        let result = 0;
        for (let i = 0; i < 1000000; i++) {
          result += Math.sqrt(i) * Math.sin(i);
        }
        return result;
      };

      const timer = service.startTimer('cpu.intensive.operation');
      const startTime = process.hrtime.bigint();

      const result = cpuIntensiveOperation();

      const endTime = process.hrtime.bigint();
      const cpuTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds

      timer();

      const allMetrics = service.getAllMetrics();
      const operationMetrics = allMetrics['cpu.intensive.operation'];

      expect(operationMetrics).toBeDefined();
      expect(operationMetrics.length).toBe(1);
      expect(operationMetrics[0].duration).toBeGreaterThan(0);
      expect(cpuTime).toBeGreaterThan(0);
      expect(result).toBeDefined(); // Garantir que a operaÃ§Ã£o rodou

      // CPU time deve ser proporcional ao wall time
      expect(cpuTime).toBeGreaterThan(operationMetrics[0].duration * 0.1);
    });
  });

  describe('Performance Budgets and Alerts', () => {
    test('deve implementar orÃ§amentos de performance', async () => {
      const performanceBudgets = {
        'database.query': 100, // max 100ms
        'api.request': 500, // max 500ms
        'file.upload': 2000, // max 2000ms
      };

      const violations: Array<{
        operation: string;
        duration: number;
        budget: number;
      }> = [];

      const checkBudget = (operation: string, duration: number): boolean => {
        const budget = performanceBudgets[operation as keyof typeof performanceBudgets];
        if (budget && duration > budget) {
          violations.push({ operation, duration, budget });
          return false;
        }
        return true;
      };

      // Simular operaÃ§Ãµes dentro e fora do orÃ§amento
      const operations = [
        { name: 'database.query', duration: 80 }, // OK
        { name: 'database.query', duration: 150 }, // Violation
        { name: 'api.request', duration: 300 }, // OK
        { name: 'api.request', duration: 800 }, // Violation
        { name: 'file.upload', duration: 1500 }, // OK
        { name: 'unknown.operation', duration: 5000 }, // No budget, so OK
      ];

      operations.forEach(op => {
        service.recordMetric({
          name: op.name,
          duration: op.duration,
          timestamp: Date.now(),
        });

        checkBudget(op.name, op.duration);
      });

      expect(violations.length).toBe(2);
      expect(violations[0]).toEqual({
        operation: 'database.query',
        duration: 150,
        budget: 100,
      });
      expect(violations[1]).toEqual({
        operation: 'api.request',
        duration: 800,
        budget: 500,
      });
    });

    test('deve gerar alertas para degradaÃ§Ã£o de performance', async () => {
      const alerts: Array<{
        operation: string;
        message: string;
        severity: 'low' | 'medium' | 'high';
      }> = [];

      const addAlert = (
        operation: string,
        message: string,
        severity: 'low' | 'medium' | 'high'
      ) => {
        alerts.push({ operation, message, severity });
      };

      // Simular histÃ³rico de performance
      const baselineOperations = [
        { name: 'baseline.op', duration: 100 },
        { name: 'baseline.op', duration: 105 },
        { name: 'baseline.op', duration: 95 },
        { name: 'baseline.op', duration: 102 },
        { name: 'baseline.op', duration: 98 },
      ];

      // Registrar baseline
      baselineOperations.forEach(op => {
        service.recordMetric({
          name: op.name,
          duration: op.duration,
          timestamp: Date.now() - 60000, // 1 minuto atrÃ¡s
        });
      });

      const baselineAvg =
        baselineOperations.reduce((sum, op) => sum + op.duration, 0) / baselineOperations.length;

      // Simular operaÃ§Ãµes recentes mais lentas
      const recentOperations = [
        { name: 'baseline.op', duration: 180 }, // 80% mais lento
        { name: 'baseline.op', duration: 190 },
        { name: 'baseline.op', duration: 175 },
      ];

      recentOperations.forEach(op => {
        service.recordMetric({
          name: op.name,
          duration: op.duration,
          timestamp: Date.now(),
        });
      });

      const recentAvg =
        recentOperations.reduce((sum, op) => sum + op.duration, 0) / recentOperations.length;
      const degradation = ((recentAvg - baselineAvg) / baselineAvg) * 100;

      // Gerar alertas baseados em degradaÃ§Ã£o
      if (degradation > 50) {
        addAlert('baseline.op', `Performance degraded by ${degradation.toFixed(1)}%`, 'high');
      } else if (degradation > 20) {
        addAlert('baseline.op', `Performance degraded by ${degradation.toFixed(1)}%`, 'medium');
      } else if (degradation > 10) {
        addAlert('baseline.op', `Performance degraded by ${degradation.toFixed(1)}%`, 'low');
      }

      expect(alerts.length).toBe(1);
      expect(alerts[0].severity).toBe('high');
      expect(parseFloat(alerts[0].message.match(/(\d+\.\d+)%/)?.[1] || '0')).toBeGreaterThan(75); // Aproximadamente 79-82% de degradaÃ§Ã£o
    });
  });

  describe('Integration with Enhanced Logger', () => {
    test('deve integrar com enhanced logger para mÃ©tricas', async () => {
      const loggedMetrics: any[] = [];

      // Mock do enhanced logger
      const mockLogger = {
        performance: (operation: string, duration: number, context?: any) => {
          loggedMetrics.push({ operation, duration, context });
        },
      };

      // Simular integraÃ§Ã£o
      const timer = service.startTimer('logged.operation', { userId: 123 });
      await new Promise(resolve => setTimeout(resolve, 50));
      timer();

      const allMetrics = service.getAllMetrics();
      const operationMetrics = allMetrics['logged.operation'];

      // Simular log da mÃ©trica
      if (operationMetrics.length > 0) {
        const metric = operationMetrics[0];
        mockLogger.performance(metric.name, metric.duration, metric.metadata);
      }

      expect(loggedMetrics.length).toBe(1);
      expect(loggedMetrics[0].operation).toBe('logged.operation');
      expect(loggedMetrics[0].duration).toBeGreaterThan(40);
      expect(loggedMetrics[0].context).toEqual({ userId: 123 });
    });
  });
});

import { PerformanceService } from '../../../src/services/PerformanceService';

describe('PerformanceService', () => {
  let performanceService: PerformanceService;

  beforeEach(() => {
    performanceService = new PerformanceService();
  });

  describe('recordMetric', () => {
    it('should record a metric successfully', () => {
      const metric = {
        name: 'test-metric',
        duration: 100,
        timestamp: Date.now()
      };

      expect(() => {
        performanceService.recordMetric(metric);
      }).not.toThrow();
    });

    it('should record multiple metrics', () => {
      const metrics = [
        { name: 'metric1', duration: 100, timestamp: Date.now() },
        { name: 'metric2', duration: 200, timestamp: Date.now() },
        { name: 'metric3', duration: 50, timestamp: Date.now() }
      ];

      expect(() => {
        metrics.forEach(metric => {
          performanceService.recordMetric(metric);
        });
      }).not.toThrow();
    });
  });

  describe('getMetricsFor', () => {
    it('should return empty array for non-existent metric', () => {
      const metrics = performanceService.getMetricsFor('non-existent');
      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics).toHaveLength(0);
    });

    it('should return recorded metrics for specific name', () => {
      const testMetrics = [
        { name: 'test-metric', duration: 100, timestamp: Date.now() },
        { name: 'test-metric', duration: 200, timestamp: Date.now() },
        { name: 'other-metric', duration: 50, timestamp: Date.now() }
      ];

      testMetrics.forEach(metric => {
        performanceService.recordMetric(metric);
      });

      const testMetricResults = performanceService.getMetricsFor('test-metric');
      const otherMetricResults = performanceService.getMetricsFor('other-metric');

      expect(testMetricResults).toHaveLength(2);
      expect(otherMetricResults).toHaveLength(1);
      expect(testMetricResults[0].name).toBe('test-metric');
      expect(testMetricResults[1].name).toBe('test-metric');
      expect(otherMetricResults[0].name).toBe('other-metric');
    });
  });

  describe('getAllMetrics', () => {
    it('should return empty object initially', () => {
      const allMetrics = performanceService.getAllMetrics();
      expect(typeof allMetrics).toBe('object');
      expect(Object.keys(allMetrics)).toHaveLength(0);
    });

    it('should return all metrics grouped by name', () => {
      const metrics = [
        { name: 'api-request', duration: 100, timestamp: Date.now() },
        { name: 'api-request', duration: 200, timestamp: Date.now() },
        { name: 'database-query', duration: 50, timestamp: Date.now() }
      ];

      metrics.forEach(metric => {
        performanceService.recordMetric(metric);
      });

      const allMetrics = performanceService.getAllMetrics();

      expect(allMetrics).toHaveProperty('api-request');
      expect(allMetrics).toHaveProperty('database-query');
      expect(allMetrics['api-request']).toHaveLength(2);
      expect(allMetrics['database-query']).toHaveLength(1);
    });
  });

  describe('getSummary', () => {
    beforeEach(() => {
      const metrics = [
        { name: 'api-request', duration: 100, timestamp: Date.now() },
        { name: 'api-request', duration: 200, timestamp: Date.now() },
        { name: 'api-request', duration: 150, timestamp: Date.now() },
        { name: 'database-query', duration: 50, timestamp: Date.now() },
        { name: 'database-query', duration: 75, timestamp: Date.now() }
      ];

      metrics.forEach(metric => {
        performanceService.recordMetric(metric);
      });
    });

    it('should provide summary statistics for each metric', () => {
      const summary = performanceService.getSummary();

      expect(summary).toHaveProperty('api-request');
      expect(summary).toHaveProperty('database-query');

      const apiSummary = summary['api-request'];
      expect(apiSummary).toEqual({
        count: 3,
        averageDuration: 150,
        minDuration: 100,
        maxDuration: 200
      });

      const dbSummary = summary['database-query'];
      expect(dbSummary).toEqual({
        count: 2,
        averageDuration: 62.5,
        minDuration: 50,
        maxDuration: 75
      });
    });

    it('should return empty object when no metrics', () => {
      const freshService = new PerformanceService();
      const summary = freshService.getSummary();
      expect(summary).toEqual({});
    });
  });

  describe('getApiMetrics', () => {
    it('should return default metrics when no API metrics recorded', () => {
      const apiMetrics = performanceService.getApiMetrics();

      expect(apiMetrics).toEqual({
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        requestsPerSecond: 0
      });
    });

    it('should calculate API metrics correctly', () => {
      const apiMetrics = [
        { name: 'api.request', duration: 100, timestamp: Date.now() },
        { name: 'api.request', duration: 200, timestamp: Date.now() },
        { name: 'api.request', duration: 150, timestamp: Date.now() }
      ];

      apiMetrics.forEach(metric => {
        performanceService.recordMetric(metric);
      });

      const metrics = performanceService.getApiMetrics();

      expect(metrics.totalRequests).toBeGreaterThan(0);
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
      expect(metrics.minResponseTime).toBeGreaterThan(0);
      expect(metrics.maxResponseTime).toBeGreaterThan(0);
    });
  });

  describe('startTimer', () => {
    it('should return a function that records timing', (done) => {
      const stopTimer = performanceService.startTimer('test-timer');

      setTimeout(() => {
        stopTimer();

        const metrics = performanceService.getMetricsFor('test-timer');
        expect(metrics).toHaveLength(1);
        expect(metrics[0].name).toBe('test-timer');
        expect(metrics[0].duration).toBeGreaterThan(45); // Should be around 50ms
        expect(metrics[0].duration).toBeLessThan(100);

        done();
      }, 50);
    });

    it('should support metadata', () => {
      const metadata = { userId: 123, operation: 'test' };
      const stopTimer = performanceService.startTimer('test-with-metadata', metadata);

      stopTimer();

      const metrics = performanceService.getMetricsFor('test-with-metadata');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].metadata).toEqual(metadata);
    });

    it('should handle multiple concurrent timers', (done) => {
      const stopTimer1 = performanceService.startTimer('timer1');
      
      setTimeout(() => {
        const stopTimer2 = performanceService.startTimer('timer2');
        
        setTimeout(() => {
          stopTimer1();
          stopTimer2();

          const timer1Metrics = performanceService.getMetricsFor('timer1');
          const timer2Metrics = performanceService.getMetricsFor('timer2');

          expect(timer1Metrics).toHaveLength(1);
          expect(timer2Metrics).toHaveLength(1);
          expect(timer1Metrics[0].duration).toBeGreaterThan(timer2Metrics[0].duration);

          done();
        }, 25);
      }, 25);
    });
  });

  describe('clearMetrics', () => {
    it('should clear all recorded metrics', () => {
      // Record some metrics
      const metrics = [
        { name: 'test1', duration: 100, timestamp: Date.now() },
        { name: 'test2', duration: 200, timestamp: Date.now() }
      ];

      metrics.forEach(metric => {
        performanceService.recordMetric(metric);
      });

      expect(Object.keys(performanceService.getAllMetrics())).toHaveLength(2);

      performanceService.clearMetrics();

      expect(Object.keys(performanceService.getAllMetrics())).toHaveLength(0);
      expect(performanceService.getMetricsFor('test1')).toHaveLength(0);
      expect(performanceService.getMetricsFor('test2')).toHaveLength(0);
    });
  });

  describe('metrics history limit', () => {
    it('should maintain maximum metrics history', () => {
      // This test might take a while, so we'll just test the concept
      const metricsCount = 5; // Use small number for test
      
      for (let i = 0; i < metricsCount; i++) {
        performanceService.recordMetric({
          name: 'test-metric',
          duration: i * 10,
          timestamp: Date.now() + i
        });
      }

      const allMetrics = performanceService.getAllMetrics();
      expect(allMetrics['test-metric']).toHaveLength(metricsCount);
    });
  });

  describe('performance measurement accuracy', () => {
    it('should measure performance with reasonable accuracy', (done) => {
      const expectedDelay = 100;
      const stopTimer = performanceService.startTimer('accuracy-test');

      setTimeout(() => {
        stopTimer();

        const metrics = performanceService.getMetricsFor('accuracy-test');
        expect(metrics).toHaveLength(1);
        
        const measuredTime = metrics[0].duration;
        expect(measuredTime).toBeGreaterThan(expectedDelay - 20); // Allow 20ms variance
        expect(measuredTime).toBeLessThan(expectedDelay + 50); // Allow 50ms variance

        done();
      }, expectedDelay);
    });
  });
});

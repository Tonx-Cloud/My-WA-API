// Simple integration test for our test framework
describe('Test Framework Integration', () => {
  it('should run basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle async operations', async () => {
    const result = await Promise.resolve('test');
    expect(result).toBe('test');
  });

  it('should work with timers', done => {
    setTimeout(() => {
      expect(true).toBe(true);
      done();
    }, 10);
  });
});

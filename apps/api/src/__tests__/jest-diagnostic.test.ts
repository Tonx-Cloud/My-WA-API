/**
 * Diagnostic Test - Testing Jest Mock Functionality
 */

describe('Jest Mock Diagnostic', () => {
  test('should verify jest.fn() works correctly', () => {
    const mockFn = jest.fn().mockReturnValue('test-value');

    const result = mockFn('test-arg');

    expect(result).toBe('test-value');
    expect(mockFn).toHaveBeenCalledWith('test-arg');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('should verify jest.fn().mockResolvedValue works correctly', async () => {
    const mockAsyncFn = jest.fn().mockResolvedValue({ success: true, data: 'test' });

    const result = await mockAsyncFn('async-arg');

    expect(result).toEqual({ success: true, data: 'test' });
    expect(mockAsyncFn).toHaveBeenCalledWith('async-arg');
    expect(mockAsyncFn).toHaveBeenCalledTimes(1);
  });

  test('should verify object with mocked methods works', async () => {
    const mockObject = {
      simpleMethod: jest.fn().mockReturnValue('simple-result'),
      asyncMethod: jest.fn().mockResolvedValue({ async: true }),
      complexMethod: jest.fn().mockImplementation(input => ({ processed: input })),
    };

    const simple = mockObject.simpleMethod();
    const async = await mockObject.asyncMethod();
    const complex = mockObject.complexMethod('test-input');

    expect(simple).toBe('simple-result');
    expect(async).toEqual({ async: true });
    expect(complex).toEqual({ processed: 'test-input' });

    expect(mockObject.simpleMethod).toHaveBeenCalledTimes(1);
    expect(mockObject.asyncMethod).toHaveBeenCalledTimes(1);
    expect(mockObject.complexMethod).toHaveBeenCalledWith('test-input');
  });
});

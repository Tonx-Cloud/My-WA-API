import { BaseService, ServiceResponse, PaginationOptions } from '../../../src/services/BaseService';

// Test implementation of BaseService
class TestService extends BaseService {
  public testCreateSuccessResponse<T>(data: T, message?: string): ServiceResponse<T> {
    return this.createSuccessResponse(data, message);
  }

  public testCreateErrorResponse<T>(error: string, code: string): ServiceResponse<T> {
    return this.createErrorResponse(error, code);
  }

  public testHandleError<T>(error: any, operation: string): ServiceResponse<T> {
    return this.handleError(error, operation);
  }

  public testValidatePagination(options: PaginationOptions) {
    return this.validatePagination(options);
  }
}

describe('BaseService', () => {
  let service: TestService;

  beforeEach(() => {
    service = new TestService();
  });

  describe('createSuccessResponse', () => {
    it('should create a success response with data', () => {
      const data = { id: 1, name: 'Test' };
      const response = service.testCreateSuccessResponse(data);

      expect(response).toEqual({
        success: true,
        data,
        message: undefined,
        code: undefined,
        error: undefined,
      });
    });

    it('should create a success response with data and message', () => {
      const data = { id: 1, name: 'Test' };
      const message = 'Operation successful';
      const response = service.testCreateSuccessResponse(data, message);

      expect(response).toEqual({
        success: true,
        data,
        message,
        code: undefined,
        error: undefined,
      });
    });
  });

  describe('createErrorResponse', () => {
    it('should create an error response', () => {
      const error = 'Something went wrong';
      const code = 'ERROR_CODE';
      const response = service.testCreateErrorResponse<any>(error, code);

      expect(response).toEqual({
        success: false,
        data: undefined,
        message: undefined,
        code,
        error,
      });
    });
  });

  describe('handleError', () => {
    it('should handle Error objects', () => {
      const error = new Error('Test error');
      const operation = 'testOperation';
      const response = service.testHandleError<any>(error, operation);

      expect(response.success).toBe(false);
      expect(response.error).toBe('Test error');
      expect(response.code).toBe('INTERNAL_ERROR');
    });

    it('should handle string errors', () => {
      const error = 'String error';
      const operation = 'testOperation';
      const response = service.testHandleError<any>(error, operation);

      expect(response.success).toBe(false);
      expect(response.error).toBe('String error');
      expect(response.code).toBe('INTERNAL_ERROR');
    });

    it('should handle unknown errors', () => {
      const error = { someProperty: 'value' };
      const operation = 'testOperation';
      const response = service.testHandleError<any>(error, operation);

      expect(response.success).toBe(false);
      expect(response.error).toBe('Erro interno do servidor');
      expect(response.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('validatePagination', () => {
    it('should return default values for minimal options', () => {
      const result = service.testValidatePagination({ page: 1, limit: 50 });

      expect(result).toEqual({
        page: 1,
        limit: 50,
        offset: 0,
      });
    });

    it('should handle valid pagination options', () => {
      const options: PaginationOptions = {
        page: 2,
        limit: 25,
      };
      const result = service.testValidatePagination(options);

      expect(result).toEqual({
        page: 2,
        limit: 25,
        offset: 25, // (page - 1) * limit = (2 - 1) * 25 = 25
      });
    });

    it('should handle negative page numbers', () => {
      const options: PaginationOptions = {
        page: -1,
        limit: 25,
      };
      const result = service.testValidatePagination(options);

      expect(result).toEqual({
        page: 1,
        limit: 25,
        offset: 0,
      });
    });

    it('should handle zero page numbers', () => {
      const options: PaginationOptions = {
        page: 0,
        limit: 25,
      };
      const result = service.testValidatePagination(options);

      expect(result).toEqual({
        page: 1,
        limit: 25,
        offset: 0,
      });
    });

    it('should enforce maximum limit', () => {
      const options: PaginationOptions = {
        page: 1,
        limit: 200, // Above maximum
      };
      const result = service.testValidatePagination(options);

      expect(result).toEqual({
        page: 1,
        limit: 100, // Capped at maximum
        offset: 0,
      });
    });

    it('should enforce minimum limit', () => {
      const options: PaginationOptions = {
        page: 1,
        limit: 0, // Below minimum
      };
      const result = service.testValidatePagination(options);

      expect(result).toEqual({
        page: 1,
        limit: 1, // Set to minimum
        offset: 0,
      });
    });
  });
});

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AnyZodObject, ZodError } from 'zod';
import logger from '../config/logger';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      logger.warn('Validation error', {
        path: req.path,
        method: req.method,
        errors,
        body: req.body,
      });

      return res.status(400).json({
        success: false,
        message: 'Dados invÃ¡lidos',
        errors,
      });
    }

    req.body = value;
    next();
  };
};

export const validateParams = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.params);

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      logger.warn('Parameter validation error', {
        path: req.path,
        method: req.method,
        errors,
        params: req.params,
      });

      return res.status(400).json({
        success: false,
        message: 'ParÃ¢metros invÃ¡lidos',
        errors,
      });
    }

    req.params = value;
    next();
  };
};

// Zod-based validation middleware
export const validateRequestZod = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        logger.warn('Zod validation failed:', validationErrors);

        res.status(400).json({
          error: 'Dados invÃ¡lidos',
          details: validationErrors,
        });
        return;
      }

      logger.error('Unexpected validation error:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
      });
    }
  };
};

export const validateParamsZod = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        logger.warn('Parameter validation failed:', validationErrors);

        res.status(400).json({
          error: 'ParÃ¢metros invÃ¡lidos',
          details: validationErrors,
        });
        return;
      }

      logger.error('Unexpected parameter validation error:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
      });
    }
  };
};

export const validateQueryZod = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await schema.parseAsync({
        query: req.query,
      });

      // Replace req.query with parsed and transformed values
      req.query = result.query;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        logger.warn('Query validation failed:', validationErrors);

        res.status(400).json({
          error: 'ParÃ¢metros de consulta invÃ¡lidos',
          details: validationErrors,
        });
        return;
      }

      logger.error('Unexpected query validation error:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
      });
    }
  };
};

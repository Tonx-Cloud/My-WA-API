import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'
import logger from '../config/logger'

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    })

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))

      logger.warn('Validation error', {
        path: req.path,
        method: req.method,
        errors,
        body: req.body
      })

      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors
      })
    }

    req.body = value
    next()
  }
}

export const validateParams = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.params)

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))

      logger.warn('Parameter validation error', {
        path: req.path,
        method: req.method,
        errors,
        params: req.params
      })

      return res.status(400).json({
        success: false,
        message: 'Parâmetros inválidos',
        errors
      })
    }

    req.params = value
    next()
  }
}

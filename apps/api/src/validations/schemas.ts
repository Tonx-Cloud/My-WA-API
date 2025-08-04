import Joi from 'joi';

export const createInstanceSchema = Joi.object({
  name: Joi.string().min(1).max(100).required().messages({
    'string.empty': 'Nome é obrigatório',
    'string.min': 'Nome deve ter pelo menos 1 caractere',
    'string.max': 'Nome deve ter no máximo 100 caracteres',
    'any.required': 'Nome é obrigatório',
  }),

  description: Joi.string().max(500).optional().allow('').messages({
    'string.max': 'Descrição deve ter no máximo 500 caracteres',
  }),
});

export const updateInstanceSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional().messages({
    'string.empty': 'Nome não pode estar vazio',
    'string.min': 'Nome deve ter pelo menos 1 caractere',
    'string.max': 'Nome deve ter no máximo 100 caracteres',
  }),

  description: Joi.string().max(500).optional().allow('').messages({
    'string.max': 'Descrição deve ter no máximo 500 caracteres',
  }),

  status: Joi.string()
    .valid('active', 'inactive', 'connecting', 'disconnected')
    .optional()
    .messages({
      'any.only': 'Status deve ser active, inactive, connecting ou disconnected',
    }),
});

export const sendMessageSchema = Joi.object({
  to: Joi.string()
    .pattern(/^[0-9]+@(c\.us|g\.us)$/)
    .required()
    .messages({
      'string.pattern.base':
        'Número de destino deve estar no formato correto (ex: 5511999999999@c.us)',
      'any.required': 'Número de destino é obrigatório',
    }),

  message: Joi.string().min(1).max(4096).required().messages({
    'string.empty': 'Mensagem é obrigatória',
    'string.min': 'Mensagem deve ter pelo menos 1 caractere',
    'string.max': 'Mensagem deve ter no máximo 4096 caracteres',
    'any.required': 'Mensagem é obrigatória',
  }),

  media: Joi.object({
    mimetype: Joi.string().required(),
    data: Joi.string().required(),
    filename: Joi.string().optional(),
  }).optional(),
});

export const validateInstanceId = Joi.string().uuid().required().messages({
  'string.guid': 'ID da instância deve ser um UUID válido',
  'any.required': 'ID da instância é obrigatório',
});

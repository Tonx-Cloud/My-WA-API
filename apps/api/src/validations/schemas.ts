import Joi from 'joi';

export const createInstanceSchema = Joi.object({
  name: Joi.string().min(1).max(100).required().messages({
    'string.empty': 'Nome Ã© obrigatÃ³rio',
    'string.min': 'Nome deve ter pelo menos 1 caractere',
    'string.max': 'Nome deve ter no mÃ¡ximo 100 caracteres',
    'any.required': 'Nome Ã© obrigatÃ³rio',
  }),

  description: Joi.string().max(500).optional().allow('').messages({
    'string.max': 'DescriÃ§Ã£o deve ter no mÃ¡ximo 500 caracteres',
  }),
});

export const updateInstanceSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional().messages({
    'string.empty': 'Nome nÃ£o pode estar vazio',
    'string.min': 'Nome deve ter pelo menos 1 caractere',
    'string.max': 'Nome deve ter no mÃ¡ximo 100 caracteres',
  }),

  description: Joi.string().max(500).optional().allow('').messages({
    'string.max': 'DescriÃ§Ã£o deve ter no mÃ¡ximo 500 caracteres',
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
        'NÃºmero de destino deve estar no formato correto (ex: 5511999999999@c.us)',
      'any.required': 'NÃºmero de destino Ã© obrigatÃ³rio',
    }),

  message: Joi.string().min(1).max(4096).required().messages({
    'string.empty': 'Mensagem Ã© obrigatÃ³ria',
    'string.min': 'Mensagem deve ter pelo menos 1 caractere',
    'string.max': 'Mensagem deve ter no mÃ¡ximo 4096 caracteres',
    'any.required': 'Mensagem Ã© obrigatÃ³ria',
  }),

  media: Joi.object({
    mimetype: Joi.string().required(),
    data: Joi.string().required(),
    filename: Joi.string().optional(),
  }).optional(),
});

export const validateInstanceId = Joi.string().uuid().required().messages({
  'string.guid': 'ID da instÃ¢ncia deve ser um UUID vÃ¡lido',
  'any.required': 'ID da instÃ¢ncia Ã© obrigatÃ³rio',
});

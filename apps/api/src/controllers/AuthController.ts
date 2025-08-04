import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { UserModel, CreateUserData } from '../models/User';
import logger from '../config/logger';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({
          error: 'Email, senha e nome são obrigatórios'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          error: 'Senha deve ter pelo menos 6 caracteres'
        });
      }

      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          error: 'Email já está em uso'
        });
      }

      const userData: CreateUserData = {
        email,
        password,
        name
      };

      const user = await UserModel.create(userData);

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      logger.info(`Usuário registrado: ${email}`);

      res.status(201).json({
        message: 'Usuário criado com sucesso',
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        token
      });
    } catch (error) {
      logger.error('Erro no registro:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: 'Email e senha são obrigatórios'
        });
      }

      const user = await UserModel.validatePassword(email, password);
      if (!user) {
        return res.status(401).json({
          error: 'Credenciais inválidas'
        });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      logger.info(`Login realizado: ${email}`);

      res.json({
        message: 'Login realizado com sucesso',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url
        },
        token
      });
    } catch (error) {
      logger.error('Erro no login:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  static async oauth(req: Request, res: Response) {
    try {
      const { provider, provider_id, email, name, avatar_url } = req.body;

      if (!provider || !provider_id || !email || !name) {
        return res.status(400).json({
          error: 'Provider, provider_id, email e name são obrigatórios'
        });
      }

      let user = await UserModel.findByEmail(email);
      
      if (!user) {
        const userData: CreateUserData = {
          email,
          password: '',
          name,
          provider,
          provider_id,
          avatar_url
        };

        user = await UserModel.create(userData);
        logger.info(`Novo usuário OAuth criado: ${email} via ${provider}`);
      } else {
        if (!user.provider || user.provider !== provider) {
          await UserModel.updateProvider(user.id!, provider, provider_id, avatar_url);
          user = await UserModel.findByEmail(email);
        }
        logger.info(`Login OAuth realizado: ${email} via ${provider}`);
      }

      const token = jwt.sign(
        { userId: user!.id, email: user!.email },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Autenticação OAuth realizada com sucesso',
        user: {
          id: user!.id,
          email: user!.email,
          name: user!.name,
          avatar_url: user!.avatar_url,
          provider: user!.provider
        },
        token
      });
    } catch (error) {
      logger.error('Erro na autenticação OAuth:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          error: 'Email é obrigatório'
        });
        return;
      }

      const user = await UserModel.findByEmail(email);
      
      if (!user) {
        logger.info(`Tentativa de recuperação para email não cadastrado: ${email}`);
        res.json({
          message: 'Se o email existir em nossa base, você receberá instruções para redefinir sua senha.'
        });
        return;
      }

      logger.info(`Solicitação de recuperação de senha para: ${email}`);

      res.json({
        message: 'Se o email existir em nossa base, você receberá instruções para redefinir sua senha.'
      });

    } catch (error) {
      logger.error('Erro na recuperação de senha:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  static async me(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'Token inválido'
        });
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'Usuário não encontrado'
        });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
          provider: user.provider,
          created_at: user.created_at
        }
      });
    } catch (error) {
      logger.error('Erro ao obter dados do usuário:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  static async updateProfile(req: Request, res: Response) {
    try {
      const { name, userId } = req.body;

      if (!name || !userId) {
        return res.status(400).json({
          error: 'Nome e ID do usuário são obrigatórios'
        });
      }

      const user = await UserModel.findById(parseInt(userId));
      if (!user) {
        return res.status(404).json({
          error: 'Usuário não encontrado'
        });
      }

      await UserModel.updateProfile(parseInt(userId), { name });

      logger.info(`Perfil atualizado para usuário ID: ${userId}`);

      res.json({
        message: 'Perfil atualizado com sucesso',
        user: {
          id: user.id,
          email: user.email,
          name: name,
          avatar_url: user.avatar_url
        }
      });
    } catch (error) {
      logger.error('Erro ao atualizar perfil:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // Google OAuth Routes
  static async googleAuth(req: Request, res: Response) {
    passport.authenticate('google', {
      scope: ['profile', 'email']
    })(req, res);
  }

  static async googleCallback(req: Request, res: Response) {
    passport.authenticate('google', { session: false }, (err: any, user: any) => {
      if (err) {
        logger.error('Erro na autenticação Google:', err);
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=auth_error`);
      }

      if (!user) {
        logger.warn('Autenticação Google falhou - usuário não encontrado');
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=auth_failed`);
      }

      try {
        // Gerar JWT token
        const token = jwt.sign(
          { userId: user.id, email: user.email },
          process.env.JWT_SECRET || 'fallback-secret',
          { expiresIn: '24h' }
        );

        // Redirecionar para página de callback OAuth específica
        const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/oauth/callback?token=${token}`;

        logger.info(`Redirecionando usuário Google OAuth: ${user.email} para ${redirectUrl}`);
        
        return res.redirect(redirectUrl);
      } catch (error) {
        logger.error('Erro ao gerar token JWT:', error);
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=token_error`);
      }
    })(req, res);
  }
}

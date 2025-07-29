import { getDatabase } from '../config/database';
import bcrypt from 'bcryptjs';
import logger from '../config/logger';

export interface User {
  id?: number;
  email: string;
  password?: string;
  name: string;
  provider?: string;
  provider_id?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  provider?: string;
  provider_id?: string;
  avatar_url?: string;
}

export class UserModel {
  static async create(userData: CreateUserData): Promise<User> {
    const db = getDatabase();
    
    try {
      let hashedPassword = '';
      
      // Só hash da senha se não for vazia (OAuth users têm senha vazia)
      if (userData.password && userData.password.trim() !== '') {
        hashedPassword = await bcrypt.hash(userData.password, 12);
      }
      
      const result = await db.run(
        `INSERT INTO users (email, password, name, provider, provider_id, avatar_url) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userData.email,
          hashedPassword,
          userData.name,
          userData.provider || 'local',
          userData.provider_id || null,
          userData.avatar_url || null
        ]
      );

      const user = await this.findById(result.lastID);
      if (!user) {
        throw new Error('Erro ao criar usuário');
      }

      logger.info(`Usuário criado: ${user.email}`);
      return user;
    } catch (error) {
      logger.error('Erro ao criar usuário:', error);
      throw error;
    }
  }

  static async findById(id: number): Promise<User | null> {
    const db = getDatabase();
    
    try {
      const user = await db.get(
        'SELECT id, email, name, provider, provider_id, avatar_url, created_at, updated_at FROM users WHERE id = ?',
        [id]
      );
      return user || null;
    } catch (error) {
      logger.error('Erro ao buscar usuário por ID:', error);
      throw error;
    }
  }

  static async findByEmail(email: string): Promise<User | null> {
    const db = getDatabase();
    
    try {
      const user = await db.get(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      return user || null;
    } catch (error) {
      logger.error('Erro ao buscar usuário por email:', error);
      throw error;
    }
  }

  static async findByProvider(provider: string, providerId: string): Promise<User | null> {
    const db = getDatabase();
    
    try {
      const user = await db.get(
        'SELECT id, email, name, provider, provider_id, avatar_url, created_at, updated_at FROM users WHERE provider = ? AND provider_id = ?',
        [provider, providerId]
      );
      return user || null;
    } catch (error) {
      logger.error('Erro ao buscar usuário por provider:', error);
      throw error;
    }
  }

  static async validatePassword(email: string, password: string): Promise<User | null> {
    const db = getDatabase();
    
    try {
      const user = await db.get(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (!user) {
        return null;
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return null;
      }

      // Retornar usuário sem a senha
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      logger.error('Erro ao validar senha:', error);
      throw error;
    }
  }

  static async update(id: number, updateData: Partial<User>): Promise<User | null> {
    const db = getDatabase();
    
    try {
      const fields = [];
      const values = [];

      for (const [key, value] of Object.entries(updateData)) {
        if (key !== 'id' && key !== 'password' && value !== undefined) {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (updateData.password) {
        const hashedPassword = await bcrypt.hash(updateData.password, 12);
        fields.push('password = ?');
        values.push(hashedPassword);
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      await db.run(
        `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      return await this.findById(id);
    } catch (error) {
      logger.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  }

  static async delete(id: number): Promise<boolean> {
    const db = getDatabase();
    
    try {
      const result = await db.run('DELETE FROM users WHERE id = ?', [id]);
      return result.changes > 0;
    } catch (error) {
      logger.error('Erro ao deletar usuário:', error);
      throw error;
    }
  }

  static async list(limit: number = 50, offset: number = 0): Promise<User[]> {
    const db = getDatabase();
    
    try {
      const users = await db.all(
        'SELECT id, email, name, provider, provider_id, avatar_url, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
      return users;
    } catch (error) {
      logger.error('Erro ao listar usuários:', error);
      throw error;
    }
  }

  static async updateProvider(userId: number, provider: string, providerId: string, avatarUrl?: string): Promise<void> {
    const db = getDatabase();
    
    try {
      await db.run(
        'UPDATE users SET provider = ?, provider_id = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [provider, providerId, avatarUrl || null, userId]
      );
      logger.info(`Provider atualizado para usuário ${userId}: ${provider}`);
    } catch (error) {
      logger.error('Erro ao atualizar provider do usuário:', error);
      throw error;
    }
  }

  static async updateProfile(userId: number, profileData: { name?: string; avatar_url?: string }): Promise<void> {
    const db = getDatabase();
    
    try {
      const { name, avatar_url } = profileData;
      
      // Construir query dinamicamente baseado nos campos fornecidos
      const updates: string[] = [];
      const values: any[] = [];
      
      if (name !== undefined) {
        updates.push('name = ?');
        values.push(name);
      }
      
      if (avatar_url !== undefined) {
        updates.push('avatar_url = ?');
        values.push(avatar_url);
      }
      
      if (updates.length === 0) {
        throw new Error('Nenhum campo para atualizar foi fornecido');
      }
      
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(userId);
      
      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
      
      await db.run(query, values);
      logger.info(`Perfil atualizado para usuário ${userId}`);
    } catch (error) {
      logger.error('Erro ao atualizar perfil do usuário:', error);
      throw error;
    }
  }
}

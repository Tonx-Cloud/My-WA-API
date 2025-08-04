import { getDatabase } from '../config/database';
import logger from '../config/logger';

export interface WhatsAppInstance {
  id: string;
  user_id: number;
  name: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  qr_code?: string;
  phone_number?: string;
  session_data?: string;
  webhook_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateInstanceData {
  id: string;
  user_id: number;
  name: string;
  webhook_url?: string;
}

export class WhatsAppInstanceModel {
  static async create(instanceData: CreateInstanceData): Promise<WhatsAppInstance> {
    const db = getDatabase();

    try {
      await db.run(
        `INSERT INTO whatsapp_instances (id, user_id, name, webhook_url)
         VALUES (?, ?, ?, ?)`,
        [instanceData.id, instanceData.user_id, instanceData.name, instanceData.webhook_url || null]
      );

      const instance = await this.findById(instanceData.id);
      if (!instance) {
        throw new Error('Erro ao criar instância');
      }

      logger.info(`Instância criada: ${instance.id}`);
      return instance;
    } catch (error) {
      logger.error('Erro ao criar instância:', error);
      throw error;
    }
  }

  static async findById(id: string): Promise<WhatsAppInstance | null> {
    const db = getDatabase();

    try {
      const instance = await db.get('SELECT * FROM whatsapp_instances WHERE id = ?', [id]);
      return instance || null;
    } catch (error) {
      logger.error('Erro ao buscar instância por ID:', error);
      throw error;
    }
  }

  static async findByUserId(userId: number): Promise<WhatsAppInstance[]> {
    const db = getDatabase();

    try {
      const instances = await db.all(
        'SELECT * FROM whatsapp_instances WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );
      return instances;
    } catch (error) {
      logger.error('Erro ao buscar instâncias por usuário:', error);
      throw error;
    }
  }

  static async updateStatus(
    id: string,
    status: WhatsAppInstance['status'],
    qrCode?: string
  ): Promise<WhatsAppInstance | null> {
    const db = getDatabase();

    try {
      await db.run(
        'UPDATE whatsapp_instances SET status = ?, qr_code = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, qrCode || null, id]
      );

      return await this.findById(id);
    } catch (error) {
      logger.error('Erro ao atualizar status da instância:', error);
      throw error;
    }
  }

  static async updatePhoneNumber(
    id: string,
    phoneNumber: string
  ): Promise<WhatsAppInstance | null> {
    const db = getDatabase();

    try {
      await db.run(
        'UPDATE whatsapp_instances SET phone_number = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [phoneNumber, id]
      );

      return await this.findById(id);
    } catch (error) {
      logger.error('Erro ao atualizar número de telefone da instância:', error);
      throw error;
    }
  }

  static async updateSessionData(id: string, sessionData: string): Promise<void> {
    const db = getDatabase();

    try {
      await db.run(
        'UPDATE whatsapp_instances SET session_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [sessionData, id]
      );
    } catch (error) {
      logger.error('Erro ao atualizar dados de sessão da instância:', error);
      throw error;
    }
  }

  static async update(
    id: string,
    updateData: Partial<WhatsAppInstance>
  ): Promise<WhatsAppInstance | null> {
    const db = getDatabase();

    try {
      const fields = [];
      const values = [];

      for (const [key, value] of Object.entries(updateData)) {
        if (key !== 'id' && key !== 'user_id' && value !== undefined) {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      await db.run(`UPDATE whatsapp_instances SET ${fields.join(', ')} WHERE id = ?`, values);

      return await this.findById(id);
    } catch (error) {
      logger.error('Erro ao atualizar instância:', error);
      throw error;
    }
  }

  static async delete(id: string): Promise<boolean> {
    const db = getDatabase();

    try {
      const result = await db.run('DELETE FROM whatsapp_instances WHERE id = ?', [id]);
      return result.changes > 0;
    } catch (error) {
      logger.error('Erro ao deletar instância:', error);
      throw error;
    }
  }

  static async list(limit: number = 50, offset: number = 0): Promise<WhatsAppInstance[]> {
    const db = getDatabase();

    try {
      const instances = await db.all(
        'SELECT * FROM whatsapp_instances ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
      return instances;
    } catch (error) {
      logger.error('Erro ao listar instâncias:', error);
      throw error;
    }
  }

  static async getConnectedInstances(): Promise<WhatsAppInstance[]> {
    const db = getDatabase();

    try {
      const instances = await db.all(
        'SELECT * FROM whatsapp_instances WHERE status = "connected" ORDER BY created_at DESC'
      );
      return instances;
    } catch (error) {
      logger.error('Erro ao buscar instâncias conectadas:', error);
      throw error;
    }
  }
}

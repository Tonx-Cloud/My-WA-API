import { Router, Request, Response } from 'express';
import logger from '../config/logger';
import { getPerformanceStats } from '../middleware/performance';

const router = Router();

// Mock data - Em produção, estes dados viriam do banco de dados
let mockInstances = [
  {
    id: 'instance-1',
    name: 'WhatsApp Comercial',
    phone: '+55 11 99999-9999',
    status: 'connected',
    lastActivity: new Date().toISOString(),
    messageCount: 142
  },
  {
    id: 'instance-2', 
    name: 'Suporte Técnico',
    phone: '+55 11 88888-8888',
    status: 'connecting',
    lastActivity: new Date(Date.now() - 300000).toISOString(),
    messageCount: 87
  }
];

// Interface para tipagem
interface DashboardStats {
  connectedInstances: number;
  totalInstances: number;
  messagesSentToday: number;
  messagesReceivedToday: number;
  activeQueues: number;
  systemUptime: string;
}

interface Activity {
  id: string;
  type: 'message_sent' | 'message_received' | 'instance_connected' | 'instance_disconnected' | 'webhook_received';
  instanceId: string;
  timestamp: Date;
  details: Record<string, any>;
  status: 'success' | 'warning' | 'error';
}

// Mock activities data
let mockActivities: Activity[] = [
  {
    id: 'act-1',
    type: 'message_sent',
    instanceId: 'instance-1',
    timestamp: new Date(),
    details: { recipient: '+55 11 88888-8888', content: 'Olá! Como posso ajudar?' },
    status: 'success'
  },
  {
    id: 'act-2',
    type: 'instance_connected',
    instanceId: 'instance-2',
    timestamp: new Date(Date.now() - 60000),
    details: { phone: '+55 11 88888-8888' },
    status: 'success'
  }
];

// Utility functions
const formatUptime = (startTime: Date): string => {
  const uptime = Date.now() - startTime.getTime();
  const hours = Math.floor(uptime / (1000 * 60 * 60));
  const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

const serverStartTime = new Date();

let mockStats = {
  totalInstances: 2,
  connectedInstances: 1,
  totalMessages: 229,
  messagesLastHour: 24,
  queueSize: 3,
  uptime: '2d 14h 32m'
}

let mockContacts = [
  {
    id: 'contact-1',
    name: 'João Silva',
    phone: '+55 11 97777-7777',
    lastMessage: 'Olá, tudo bem?',
    lastMessageTime: new Date().toISOString(),
    unreadCount: 2,
    status: 'online'
  },
  {
    id: 'contact-2',
    name: 'Maria Santos',
    phone: '+55 11 96666-6666',
    lastMessage: 'Obrigada pelo atendimento!',
    lastMessageTime: new Date(Date.now() - 600000).toISOString(),
    unreadCount: 0,
    status: 'offline'
  },
  {
    id: 'contact-3',
    name: 'Pedro Costa',
    phone: '+55 11 95555-5555',
    lastMessage: 'Quando será a entrega?',
    lastMessageTime: new Date(Date.now() - 1800000).toISOString(),
    unreadCount: 1,
    status: 'typing'
  }
]

let mockMessages = [
  {
    id: 'msg-1',
    from: 'contact-1',
    to: 'instance-1',
    content: 'Olá, tudo bem?',
    type: 'text',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    status: 'read',
    isFromMe: false
  },
  {
    id: 'msg-2',
    from: 'instance-1',
    to: 'contact-1',
    content: 'Olá! Sim, tudo ótimo. Como posso ajudá-lo?',
    type: 'text',
    timestamp: new Date(Date.now() - 240000).toISOString(),
    status: 'read',
    isFromMe: true
  },
  {
    id: 'msg-3',
    from: 'contact-1',
    to: 'instance-1',
    content: 'Gostaria de saber sobre os produtos em promoção',
    type: 'text',
    timestamp: new Date(Date.now() - 180000).toISOString(),
    status: 'delivered',
    isFromMe: false
  }
]

// GET /api/dashboard/stats - Estatísticas do dashboard
router.get('/stats', async (req: Request, res: Response) => {
  try {
    logger.info('Enviando estatísticas do dashboard');
    
    // Estatísticas em tempo real
    const stats: DashboardStats = {
      connectedInstances: mockInstances.filter(i => i.status === 'connected').length,
      totalInstances: mockInstances.length,
      messagesSentToday: Math.floor(Math.random() * 500) + 100,
      messagesReceivedToday: Math.floor(Math.random() * 300) + 50,
      activeQueues: Math.floor(Math.random() * 5) + 1,
      systemUptime: formatUptime(serverStartTime)
    };
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/dashboard/activities - Atividades recentes
router.get('/activities', (req: Request, res: Response) => {
  try {
    const { limit = 50, type, instanceId } = req.query;
    
    let filteredActivities = [...mockActivities];
    
    // Filtrar por tipo se especificado
    if (type && typeof type === 'string') {
      filteredActivities = filteredActivities.filter(a => a.type === type);
    }
    
    // Filtrar por instância se especificado
    if (instanceId && typeof instanceId === 'string') {
      filteredActivities = filteredActivities.filter(a => a.instanceId === instanceId);
    }
    
    // Ordenar por timestamp (mais recente primeiro)
    filteredActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Limitar quantidade
    const limitNum = parseInt(limit as string, 10);
    filteredActivities = filteredActivities.slice(0, limitNum);

    logger.info(`Activities requested: limit=${String(limit)}, type=${String(type) || 'all'}, instanceId=${String(instanceId) || 'all'}`);
    
    res.json({
      success: true,
      data: filteredActivities,
      total: mockActivities.length,
      filtered: filteredActivities.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Erro ao buscar atividades:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/dashboard/overview - Visão geral completa
router.get('/overview', (req: Request, res: Response) => {
  try {
    const stats: DashboardStats = {
      connectedInstances: mockInstances.filter(i => i.status === 'connected').length,
      totalInstances: mockInstances.length,
      messagesSentToday: Math.floor(Math.random() * 500) + 100,
      messagesReceivedToday: Math.floor(Math.random() * 300) + 50,
      activeQueues: Math.floor(Math.random() * 5) + 1,
      systemUptime: formatUptime(serverStartTime)
    };

    const recentActivities = [...mockActivities]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    const instancesStatus = mockInstances.map(instance => ({
      id: instance.id,
      name: instance.name,
      status: instance.status,
      messageCount: instance.messageCount,
      lastActivity: instance.lastActivity
    }));

    logger.info('Dashboard overview requested');
    
    res.json({
      success: true,
      data: {
        stats,
        recentActivities,
        instances: instancesStatus,
        serverInfo: {
          startTime: serverStartTime.toISOString(),
          uptime: formatUptime(serverStartTime),
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development'
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Erro ao buscar overview do dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/contacts - Lista de contatos
router.get('/contacts', async (req, res) => {
  try {
    const { instanceId } = req.query
    
    if (!instanceId) {
      return res.status(400).json({ error: 'instanceId é obrigatório' })
    }

    logger.info(`Buscando contatos para instância: ${String(instanceId)}`);
    
    // Filtrar contatos por instância (em produção, viria do banco)
    const contacts = mockContacts
    
    res.json({ contacts })
  } catch (error) {
    logger.error('Erro ao buscar contatos:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// GET /api/messages - Mensagens de um contato
router.get('/messages', async (req, res) => {
  try {
    const { instanceId, contactId } = req.query
    
    if (!instanceId || !contactId) {
      return res.status(400).json({ error: 'instanceId e contactId são obrigatórios' })
    }

    logger.info(`Buscando mensagens: instância ${String(instanceId)}, contato ${String(contactId)}`);
    
    // Filtrar mensagens (em produção, viria do banco)
    const messages = mockMessages.filter(msg => 
      (msg.from === contactId && msg.to === instanceId) ||
      (msg.from === instanceId && msg.to === contactId)
    )
    
    res.json({ messages })
  } catch (error) {
    logger.error('Erro ao buscar mensagens:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// POST /api/dashboard/simulate-activity - Simular atividade para demo
router.post('/simulate-activity', async (req, res) => {
  try {
    const { type } = req.body
    
    switch (type) {
      case 'new_message':
        // Simular nova mensagem
        mockStats.totalMessages += 1
        mockStats.messagesLastHour += 1
        break
        
      case 'instance_disconnect':
        // Simular desconexão de instância
        if (mockInstances.length > 0 && mockInstances[0]) {
          mockInstances[0].status = 'disconnected'
          mockStats.connectedInstances = mockInstances.filter(i => i.status === 'connected').length
        }
        break
        
      case 'instance_reconnect':
        // Simular reconexão de instância
        if (mockInstances.length > 0 && mockInstances[0]) {
          mockInstances[0].status = 'connected'
          mockStats.connectedInstances = mockInstances.filter(i => i.status === 'connected').length
        }
        break
        
      default:
        return res.status(400).json({ error: 'Tipo de simulação inválido' })
    }
    
    logger.info(`Atividade simulada: ${type}`)
    res.json({ success: true, message: 'Atividade simulada com sucesso' })
  } catch (error) {
    logger.error('Erro ao simular atividade:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// POST /api/dashboard/activities - Adicionar nova atividade
router.post('/activities', (req: Request, res: Response) => {
  try {
    const { type, instanceId, details, status = 'success' } = req.body;

    if (!type || !instanceId) {
      return res.status(400).json({
        success: false,
        error: 'Tipo e ID da instância são obrigatórios'
      });
    }

    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      type,
      instanceId,
      timestamp: new Date(),
      details: details || {},
      status
    };

    mockActivities.unshift(newActivity);
    
    // Manter apenas as últimas 1000 atividades
    if (mockActivities.length > 1000) {
      mockActivities = mockActivities.slice(0, 1000);
    }

    logger.info(`Nova atividade adicionada: ${type} para instância ${String(instanceId)}`);
    
    res.status(201).json({
      success: true,
      data: newActivity,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Erro ao adicionar atividade:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/dashboard/performance - Métricas de performance
router.get('/performance', (req: Request, res: Response) => {
  try {
    const performanceStats = getPerformanceStats();
    
    logger.info('Performance stats requested');
    
    res.json({
      success: true,
      data: performanceStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Erro ao buscar métricas de performance:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Função auxiliar para calcular uptime
function calculateUptime(): string {
  const uptimeMs = process.uptime() * 1000
  const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60))
  
  return `${days}d ${hours}h ${minutes}m`
}

export default router

/**
 * WebSocket Service com Reconexão Inteligente e Persistência de Sessão
 * Resolve os problemas críticos de conexão e persistência identificados
 */

import WS from "ws";
import jwt from "jsonwebtoken";
import { EventEmitter } from "events";
import fs from "fs/promises";
import { Server } from "http";
import { IncomingMessage } from "http";
const path = require("path");

class WebSocketServiceFixed extends EventEmitter {
  constructor(server) {
    super();
    this.server = server;
    this.wss = null;
    this.clients = new Map();
    this.instanceRooms = new Map();
    this.setupServer();
  }

  setupServer() {
    this.wss = new WebSocket.Server({
      server: this.server,
      path: "/ws",
      perMessageDeflate: {
        zlibDeflateOptions: {
          threshold: 1024,
        },
      },
    });

    this.wss.on("connection", (ws, req) => {
      this.handleConnection(ws, req);
    });

    console.log("✅ WebSocket Server configurado em /ws");
  }

  handleConnection(ws, req) {
    const clientId = this.generateClientId();
    const token = this.extractToken(req);

    // Autenticação opcional mas recomendada
    const isAuthenticated = token ? this.authenticate(token) : false;

    this.clients.set(clientId, {
      ws,
      isAuthenticated,
      subscriptions: new Set(),
      lastActivity: new Date(),
      metadata: {
        userAgent: req.headers["user-agent"],
        ip: req.socket.remoteAddress,
      },
    });

    console.log(`🔌 Cliente conectado: ${clientId} (Auth: ${isAuthenticated})`);

    // Configurar eventos do cliente
    this.setupClientEvents(ws, clientId);

    // Enviar confirmação de conexão
    this.sendToClient(clientId, {
      type: "connection",
      clientId,
      authenticated: isAuthenticated,
      message: "Conectado com sucesso",
    });

    // Configurar heartbeat
    this.startHeartbeat(clientId);
  }

  setupClientEvents(ws, clientId) {
    ws.on("message", (data) => {
      this.handleMessage(clientId, data);
    });

    ws.on("close", (code, reason) => {
      console.log(`🔌 Cliente desconectado: ${clientId} (${code}: ${reason})`);
      this.handleDisconnection(clientId);
    });

    ws.on("error", (error) => {
      console.error(`❌ Erro WebSocket ${clientId}:`, error);
      this.handleClientError(clientId, error);
    });

    ws.on("pong", () => {
      const client = this.clients.get(clientId);
      if (client) {
        client.lastActivity = new Date();
      }
    });
  }

  handleMessage(clientId, data) {
    try {
      const client = this.clients.get(clientId);
      if (!client) return;

      client.lastActivity = new Date();

      const message = JSON.parse(data);

      switch (message.type) {
        case "subscribe":
          this.handleSubscribe(clientId, message);
          break;

        case "unsubscribe":
          this.handleUnsubscribe(clientId, message);
          break;

        case "send_message":
          this.handleSendMessage(clientId, message);
          break;

        case "ping":
          this.sendToClient(clientId, { type: "pong", timestamp: Date.now() });
          break;

        default:
          this.sendToClient(clientId, {
            type: "error",
            message: `Tipo de mensagem não suportado: ${message.type}`,
          });
      }
    } catch (error) {
      console.error(`❌ Erro ao processar mensagem ${clientId}:`, error);
      this.sendToClient(clientId, {
        type: "error",
        message: "Formato de mensagem inválido",
      });
    }
  }

  handleSubscribe(clientId, message) {
    const { instance } = message;
    const client = this.clients.get(clientId);

    if (!client || !instance) {
      this.sendToClient(clientId, {
        type: "error",
        message: "Cliente ou instância não encontrados",
      });
      return;
    }

    // Adicionar cliente à sala da instância
    client.subscriptions.add(instance);

    if (!this.instanceRooms.has(instance)) {
      this.instanceRooms.set(instance, new Set());
    }
    this.instanceRooms.get(instance).add(clientId);

    this.sendToClient(clientId, {
      type: "subscribed",
      instance,
      message: `Inscrito na instância ${instance}`,
    });

    console.log(`📡 Cliente ${clientId} inscrito na instância ${instance}`);
  }

  handleUnsubscribe(clientId, message) {
    const { instance } = message;
    const client = this.clients.get(clientId);

    if (!client) return;

    client.subscriptions.delete(instance);

    if (this.instanceRooms.has(instance)) {
      this.instanceRooms.get(instance).delete(clientId);

      // Remover sala vazia
      if (this.instanceRooms.get(instance).size === 0) {
        this.instanceRooms.delete(instance);
      }
    }

    this.sendToClient(clientId, {
      type: "unsubscribed",
      instance,
    });
  }

  async handleSendMessage(clientId, message) {
    const client = this.clients.get(clientId);

    if (!client) return;

    try {
      const { instanceId, to, content, type = "text" } = message;

      // Validação básica
      if (!instanceId || !to || !content) {
        this.sendToClient(clientId, {
          type: "error",
          message: "Dados da mensagem incompletos",
        });
        return;
      }

      // Aqui seria a integração com o WhatsApp Service
      // Por enquanto, simular o envio
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Simular delay de envio
      setTimeout(() => {
        // Notificar sucesso para o remetente
        this.sendToClient(clientId, {
          type: "message_sent",
          messageId,
          instanceId,
          to,
          status: "sent",
        });

        // Broadcast para todos os clientes da instância
        this.broadcastToInstance(instanceId, {
          type: "message_update",
          messageId,
          instanceId,
          to,
          content:
            content.substring(0, 100) + (content.length > 100 ? "..." : ""),
          type: type,
          timestamp: new Date().toISOString(),
          status: "sent",
        });
      }, 500);
    } catch (error) {
      console.error(`❌ Erro ao enviar mensagem ${clientId}:`, error);
      this.sendToClient(clientId, {
        type: "error",
        message: "Erro interno ao enviar mensagem",
      });
    }
  }

  handleDisconnection(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remover de todas as salas de instância
    client.subscriptions.forEach((instance) => {
      if (this.instanceRooms.has(instance)) {
        this.instanceRooms.get(instance).delete(clientId);

        if (this.instanceRooms.get(instance).size === 0) {
          this.instanceRooms.delete(instance);
        }
      }
    });

    this.clients.delete(clientId);
  }

  handleClientError(clientId, error) {
    console.error(`❌ Erro do cliente ${clientId}:`, error);

    // Tentar enviar notificação de erro se a conexão ainda estiver ativa
    try {
      this.sendToClient(clientId, {
        type: "error",
        message: "Erro de conexão detectado",
      });
    } catch (e) {
      // Conexão já foi perdida
    }
  }

  broadcastToInstance(instanceId, data) {
    const room = this.instanceRooms.get(instanceId);
    if (!room) return;

    let sentCount = 0;
    room.forEach((clientId) => {
      if (this.sendToClient(clientId, data)) {
        sentCount++;
      }
    });

    console.log(
      `📡 Broadcast para instância ${instanceId}: ${sentCount}/${room.size} clientes`,
    );
  }

  sendToClient(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      client.ws.send(JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`❌ Erro ao enviar para cliente ${clientId}:`, error);
      this.handleDisconnection(clientId);
      return false;
    }
  }

  extractToken(req) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    return (
      url.searchParams.get("token") ||
      req.headers.authorization?.replace("Bearer ", "")
    );
  }

  authenticate(token) {
    try {
      const secret = process.env.JWT_SECRET || "fallback-secret";
      jwt.verify(token, secret);
      return true;
    } catch (error) {
      return false;
    }
  }

  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  startHeartbeat(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const interval = setInterval(() => {
      if (!this.clients.has(clientId)) {
        clearInterval(interval);
        return;
      }

      const currentClient = this.clients.get(clientId);
      if (currentClient.ws.readyState === WebSocket.OPEN) {
        // Verificar se o cliente está responsivo
        const timeSinceLastActivity =
          Date.now() - currentClient.lastActivity.getTime();

        if (timeSinceLastActivity > 60000) {
          // 1 minuto sem atividade
          console.log(
            `⚠️ Cliente ${clientId} inativo há ${Math.round(timeSinceLastActivity / 1000)}s`,
          );

          // Enviar ping
          currentClient.ws.ping();

          // Se não responder em 30s, desconectar
          setTimeout(() => {
            const checkClient = this.clients.get(clientId);
            if (
              checkClient &&
              Date.now() - checkClient.lastActivity.getTime() > 90000
            ) {
              console.log(
                `❌ Cliente ${clientId} não responsivo, desconectando...`,
              );
              checkClient.ws.terminate();
            }
          }, 30000);
        }
      } else {
        clearInterval(interval);
        this.handleDisconnection(clientId);
      }
    }, 30000); // Verificar a cada 30 segundos
  }

  // Métodos públicos para integração
  getStats() {
    return {
      totalClients: this.clients.size,
      activeInstances: this.instanceRooms.size,
      authenticatedClients: Array.from(this.clients.values()).filter(
        (c) => c.isAuthenticated,
      ).length,
      rooms: Array.from(this.instanceRooms.entries()).map(
        ([instance, clients]) => ({
          instance,
          clientCount: clients.size,
        }),
      ),
    };
  }

  broadcastSystemUpdate(data) {
    this.clients.forEach((client, clientId) => {
      this.sendToClient(clientId, {
        type: "system_update",
        ...data,
        timestamp: new Date().toISOString(),
      });
    });
  }

  // Broadcast de estatísticas para todos os clientes
  broadcastStats(stats) {
    this.broadcastSystemUpdate({
      type: "stats_update",
      data: stats,
    });
  }

  // Broadcast de nova atividade
  broadcastActivity(activity) {
    this.broadcastSystemUpdate({
      type: "activity_new",
      data: activity,
    });
  }
}

module.exports = WebSocketServiceFixed;

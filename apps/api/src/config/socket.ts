import { Server } from 'socket.io';

class SocketManager {
  private static instance: SocketManager;
  private io: Server | null = null;

  private constructor() {}

  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  setIO(io: Server): void {
    this.io = io;
  }

  getIO(): Server | null {
    return this.io;
  }

  emit(event: string, data: any): void {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  static emitToInstance(instanceId: string, event: string, data: any): void {
    const manager = SocketManager.getInstance();
    if (manager.io) {
      // Emit para um namespace específico da instância
      manager.io.to(`instance-${instanceId}`).emit(event, data);
      // Também emit global para compatibilidade
      manager.io.emit(`${instanceId}:${event}`, data);
    }
  }

  static joinInstanceRoom(socketId: string, instanceId: string): void {
    const manager = SocketManager.getInstance();
    if (manager.io) {
      const socket = manager.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.join(`instance-${instanceId}`);
      }
    }
  }

  static leaveInstanceRoom(socketId: string, instanceId: string): void {
    const manager = SocketManager.getInstance();
    if (manager.io) {
      const socket = manager.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.leave(`instance-${instanceId}`);
      }
    }
  }
}

export default SocketManager;

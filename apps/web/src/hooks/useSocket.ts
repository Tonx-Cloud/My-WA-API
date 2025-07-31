import { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

interface UseSocketOptions {
  autoConnect?: boolean
  serverPath?: string
}

interface SocketState {
  connected: boolean
  lastUpdate: Date | null
  error: string | null
}

interface RealtimeData {
  stats: any
  instances: any[]
  recentActivities: any[]
  messages: any[]
}

export function useSocket(options: UseSocketOptions = {}) {
  const { autoConnect = true, serverPath = 'http://localhost:3000' } = options
  
  const [socketState, setSocketState] = useState<SocketState>({
    connected: false,
    lastUpdate: null,
    error: null
  })
  
  const [realtimeData, setRealtimeData] = useState<RealtimeData>({
    stats: null,
    instances: [],
    recentActivities: [],
    messages: []
  })

  const socketRef = useRef<Socket | null>(null)

  // Conectar ao socket
  useEffect(() => {
    if (!autoConnect) return

    const socket = io(serverPath, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    socketRef.current = socket

    // Eventos de conexão
    socket.on('connect', () => {
      console.log('✅ Socket conectado:', socket.id)
      setSocketState({
        connected: true,
        error: null,
        lastUpdate: new Date()
      })
    })

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket desconectado:', reason)
      setSocketState(prev => ({
        ...prev,
        connected: false,
        error: `Desconectado: ${reason}`
      }))
    })

    socket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão socket:', error)
      setSocketState(prev => ({
        ...prev,
        connected: false,
        error: `Erro de conexão: ${error.message}`
      }))
    })

    // Eventos de dados em tempo real
    socket.on('dashboard:stats_update', (data) => {
      setRealtimeData(prev => ({ ...prev, stats: data }))
      setSocketState(prev => ({ ...prev, lastUpdate: new Date() }))
    })

    socket.on('dashboard:instance_update', (data) => {
      setRealtimeData(prev => {
        const instances = [...prev.instances]
        const index = instances.findIndex(i => i.id === data.id)
        
        if (index >= 0) {
          instances[index] = { ...instances[index], ...data }
        } else {
          instances.push(data)
        }
        
        return { ...prev, instances }
      })
      setSocketState(prev => ({ ...prev, lastUpdate: new Date() }))
    })

    socket.on('dashboard:activity_update', (data) => {
      setRealtimeData(prev => ({
        ...prev,
        recentActivities: [data, ...prev.recentActivities.slice(0, 9)]
      }))
      setSocketState(prev => ({ ...prev, lastUpdate: new Date() }))
    })

    socket.on('dashboard:message_update', (data) => {
      setRealtimeData(prev => ({
        ...prev,
        messages: [data, ...prev.messages.slice(0, 49)]
      }))
      setSocketState(prev => ({ ...prev, lastUpdate: new Date() }))
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [autoConnect, serverPath])

  // Funções para interagir com o socket
  const joinInstanceRoom = (instanceId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_instance', instanceId)
    }
  }

  const leaveInstanceRoom = (instanceId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_instance', instanceId)
    }
  }

  const requestStatsUpdate = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('dashboard:request_stats')
    }
  }

  const sendMessage = (instanceId: string, to: string, content: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket não conectado'))
        return
      }

      const timeout = setTimeout(() => {
        reject(new Error('Timeout ao enviar mensagem'))
      }, 30000)

      socketRef.current.emit('message:send', {
        instanceId,
        to,
        content,
        timestamp: new Date()
      }, (response: any) => {
        clearTimeout(timeout)
        if (response?.success) {
          resolve(response)
        } else {
          reject(new Error(response?.error || 'Erro ao enviar mensagem'))
        }
      })
    })
  }

  return {
    // Estado
    socketState,
    realtimeData,
    
    // Ações
    joinInstanceRoom,
    leaveInstanceRoom,
    requestStatsUpdate,
    sendMessage,
    
    // Utilitários
    isConnected: socketState.connected,
    lastUpdate: socketState.lastUpdate,
    timeSinceLastUpdate: socketState.lastUpdate 
      ? Math.floor((Date.now() - socketState.lastUpdate.getTime()) / 1000)
      : null
  }
}

export default useSocket

'use client'

import { useState, useEffect } from 'react'
import { PaperAirplaneIcon, ClockIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import MessageSender from '@/components/dashboard/MessageSender'

interface Message {
  id: string
  instanceId: string
  to: string
  content: string
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'pending'
  sentAt: Date
  mock?: boolean
}

interface MessageResponse {
  success: boolean
  messageId?: string
  error?: string
  instanceId?: string
  to?: string
  content?: string
  status?: 'sent' | 'delivered' | 'read' | 'failed' | 'pending'
  sentAt?: Date
  mock?: boolean
}

interface Instance {
  id: string
  name: string
  phoneNumber?: string
  status: 'connecting' | 'connected' | 'disconnected' | 'qr_pending'
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [instances, setInstances] = useState<Instance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInstances()
    fetchMessages()
  }, [])

  const fetchInstances = async () => {
    try {
      const response = await fetch('/api/instances', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setInstances(data.instances || [])
      }
    } catch (error) {
      console.error('Erro ao buscar instâncias:', error)
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMessageSent = (response: MessageResponse) => {
    if (response.success && response.instanceId && response.to && response.content) {
      const messageData: Message = {
        id: response.messageId || `msg_${Date.now()}`,
        instanceId: response.instanceId,
        to: response.to,
        content: response.content,
        status: response.status || 'sent',
        sentAt: response.sentAt || new Date(),
        mock: response.mock || false
      }
      setMessages(prev => [messageData, ...prev])
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />
      case 'delivered':
        return <CheckIcon className="h-4 w-4 text-green-500" />
      case 'read':
        return <CheckIcon className="h-4 w-4 text-blue-500" />
      case 'failed':
        return <XMarkIcon className="h-4 w-4 text-red-500" />
      default:
        return <ClockIcon className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent':
        return 'Enviada'
      case 'delivered':
        return 'Entregue'
      case 'read':
        return 'Lida'
      case 'failed':
        return 'Falhou'
      default:
        return 'Pendente'
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mensagens</h1>
      </div>

      {/* Message Sender Component */}
      <MessageSender 
        instances={instances} 
        onMessageSent={handleMessageSent}
      />

      {/* Messages History */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Histórico de Mensagens</h2>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">Carregando mensagens...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <PaperAirplaneIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma mensagem enviada ainda</p>
              <p className="text-sm text-gray-500">Use o formulário acima para enviar sua primeira mensagem</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          Para: {message.to}
                        </span>
                        {message.mock && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Simulado
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 mb-2">{message.content}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Instância: {instances.find(i => i.id === message.instanceId)?.name || 'Desconhecida'}</span>
                        <span>{formatDate(message.sentAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {getStatusIcon(message.status)}
                      <span className="text-sm text-gray-600">{getStatusText(message.status)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

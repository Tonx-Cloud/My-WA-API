'use client'

import { useState, useEffect } from 'react'
import { QrCodeIcon, ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { io, Socket } from 'socket.io-client'

interface QRCodeGeneratorProps {
  instanceId?: string
  onConnectionSuccess?: (instanceId: string) => void
}

interface InstanceStatus {
  id: string
  status: 'initializing' | 'qr_ready' | 'authenticated' | 'ready' | 'disconnected' | 'destroyed'
  qr?: string
  clientInfo?: any
  lastSeen?: Date
}

export default function QRCodeGenerator({ instanceId, onConnectionSuccess }: QRCodeGeneratorProps) {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)
  const [status, setStatus] = useState<string>('disconnected')
  const [error, setError] = useState<string | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [currentInstanceId, setCurrentInstanceId] = useState<string>(instanceId || `instance-${Date.now()}`)

  useEffect(() => {
    // Inicializar Socket.IO
    const newSocket = io('http://localhost:3000')
    setSocket(newSocket)

    // Juntar-se à sala da instância
    newSocket.emit('join_instance', currentInstanceId)

    // Listeners para eventos da instância
    newSocket.on(`${currentInstanceId}:qr_received`, (data: { qr: string }) => {
      console.log('QR received:', data)
      setQrCode(data.qr)
      setStatus('qr_ready')
      setLoading(false)
    })

    newSocket.on(`${currentInstanceId}:authenticated`, () => {
      console.log('Instance authenticated')
      setStatus('authenticated')
      setQrCode(null)
    })

    newSocket.on(`${currentInstanceId}:ready`, (data: { clientInfo: any }) => {
      console.log('Instance ready:', data)
      setStatus('ready')
      setConnected(true)
      setLoading(false)
      if (onConnectionSuccess) {
        onConnectionSuccess(currentInstanceId)
      }
    })

    newSocket.on(`${currentInstanceId}:auth_failure`, (data: { message: string }) => {
      console.log('Auth failure:', data)
      setError(`Falha na autenticação: ${data.message}`)
      setStatus('disconnected')
      setLoading(false)
    })

    newSocket.on(`${currentInstanceId}:disconnected`, (data: { reason: string }) => {
      console.log('Instance disconnected:', data)
      setStatus('disconnected')
      setConnected(false)
      setQrCode(null)
    })

    newSocket.on(`${currentInstanceId}:loading_screen`, (data: { percent: number, message: string }) => {
      console.log('Loading:', data)
      setStatus(`loading: ${data.percent}% - ${data.message}`)
    })

    return () => {
      newSocket.emit('leave_instance', currentInstanceId)
      newSocket.close()
    }
  }, [currentInstanceId, onConnectionSuccess])

  const generateQRCode = async () => {
    try {
      setLoading(true)
      setError(null)
      setConnected(false)
      setQrCode(null)
      setStatus('initializing')
      
      // Criar instância no backend
      const response = await fetch(`http://localhost:3000/api/instances-v2/create/${currentInstanceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar instância')
      }

      console.log('Instance created:', result.data)
      setStatus(result.data.status)
      
    } catch (error) {
      console.error('Error generating QR code:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
      setLoading(false)
      setStatus('disconnected')
    }
  }

  const refreshQR = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`http://localhost:3000/api/instances-v2/qr/${currentInstanceId}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao atualizar QR code')
      }

      console.log('QR refresh requested')
      
    } catch (error) {
      console.error('Error refreshing QR code:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
      setLoading(false)
    }
  }

  const getStatusDisplay = () => {
    switch (status) {
      case 'initializing':
        return 'Inicializando...'
      case 'qr_ready':
        return 'QR Code pronto - Escaneie com seu WhatsApp'
      case 'authenticated':
        return 'Autenticado! Finalizando conexão...'
      case 'ready':
        return 'Conectado com sucesso!'
      case 'disconnected':
        return 'Desconectado'
      case 'destroyed':
        return 'Instância removida'
      default:
        if (status.startsWith('loading:')) {
          return status.replace('loading:', 'Carregando:')
        }
        return status
    }
  }

  const instructionSteps = [
    {
      number: 1,
      text: 'Abra o WhatsApp no seu telefone'
    },
    {
      number: 2,
      text: 'Toque em Mais opções ou Configurações e selecione Aparelhos conectados'
    },
    {
      number: 3,
      text: 'Toque em Conectar um aparelho'
    },
    {
      number: 4,
      text: 'Aponte seu telefone para esta tela para capturar o código'
    }
  ]

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {instanceId ? `Reconectar Instância ${instanceId}` : 'Conectar Nova Instância'}
        </h3>
        {connected && (
          <div className="flex items-center text-green-600">
            <CheckCircleIcon className="h-5 w-5 mr-1" />
            <span className="text-sm font-medium">Conectado</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code */}
        <div className="text-center">
          <div className="bg-gray-100 w-64 h-64 mx-auto rounded-lg flex items-center justify-center mb-4 border-2 border-dashed border-gray-300">
            {loading ? (
              <div className="text-center">
                <ArrowPathIcon className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin" />
                <p className="text-sm text-gray-500">Gerando QR Code...</p>
              </div>
            ) : qrCode ? (
              <img 
                src={qrCode} 
                alt="QR Code WhatsApp" 
                className="w-full h-full object-contain rounded-lg"
              />
            ) : (
              <div className="text-center">
                <QrCodeIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  {connected ? 'Conectado com sucesso!' : 'Clique em "Gerar QR Code" para começar'}
                </p>
              </div>
            )}
          </div>

          {/* Status Display */}
          <div className="mb-4">
            <p className={`text-sm font-medium ${
              status === 'ready' ? 'text-green-600' : 
              status === 'disconnected' ? 'text-red-600' : 
              'text-blue-600'
            }`}>
              {getStatusDisplay()}
            </p>
            {error && (
              <p className="text-sm text-red-600 mt-2">{error}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {!connected && (
              <button
                onClick={generateQRCode}
                disabled={loading}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Gerando...' : 'Gerar QR Code'}
              </button>
            )}
            
            {qrCode && !connected && (
              <button
                onClick={refreshQR}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Atualizar QR Code
              </button>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Como conectar:</h4>
          <div className="space-y-3">
            {instructionSteps.map((step, index) => (
              <div key={step.number} className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                  {step.number}
                </div>
                <p className="text-sm text-gray-700">{step.text}</p>
              </div>
            ))}
          </div>

          {/* Connection Progress */}
          {status !== 'disconnected' && status !== 'ready' && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h5 className="text-sm font-medium text-blue-900 mb-2">Status da Conexão:</h5>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    status === 'initializing' ? 'bg-yellow-500' : 
                    status === 'qr_ready' ? 'bg-blue-500' :
                    status === 'authenticated' ? 'bg-green-500' :
                    'bg-gray-300'
                  }`}></div>
                  <span className="text-sm text-blue-800">{getStatusDisplay()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {connected && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                <h5 className="text-sm font-medium text-green-900">Conexão Estabelecida!</h5>
              </div>
              <p className="text-sm text-green-800 mt-1">
                Sua instância do WhatsApp está conectada e pronta para enviar mensagens.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { QrCodeIcon, ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { io, Socket } from 'socket.io-client';
import Image from 'next/image';

interface QRCodeGeneratorProps {
  instanceId?: string;
  onConnectionSuccess?: (instanceId: string) => void;
}

interface InstanceStatus {
  id: string;
  status: 'initializing' | 'qr_ready' | 'authenticated' | 'ready' | 'disconnected' | 'destroyed';
  qr?: string;
  clientInfo?: any;
  lastSeen?: Date;
}

export default function QRCodeGenerator({ instanceId, onConnectionSuccess }: QRCodeGeneratorProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<string>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentInstanceId, setCurrentInstanceId] = useState<string>(
    instanceId || `instance-${Date.now()}`
  );
  const [connectionSteps, setConnectionSteps] = useState(0);

  useEffect(() => {
    // Inicializar Socket.IO
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    // Juntar-se Ã  sala da instÃ¢ncia
    newSocket.emit('join_instance', currentInstanceId);

    // Listeners para eventos da instÃ¢ncia
    newSocket.on(`${currentInstanceId}:qr_received`, (data: { qr: string }) => {
      console.log('QR received:', data);
      setQrCode(data.qr);
      setStatus('qr_ready');
      setLoading(false);
    });

    newSocket.on(`${currentInstanceId}:authenticated`, () => {
      console.log('Instance authenticated');
      setStatus('authenticated');
      setQrCode(null);
    });

    newSocket.on(`${currentInstanceId}:ready`, (data: { clientInfo: any }) => {
      console.log('Instance ready:', data);
      setStatus('ready');
      setConnected(true);
      setLoading(false);
      if (onConnectionSuccess) {
        onConnectionSuccess(currentInstanceId);
      }
    });

    newSocket.on(`${currentInstanceId}:auth_failure`, (data: { message: string }) => {
      console.log('Auth failure:', data);
      setError(`Falha na autenticaÃ§Ã£o: ${data.message}`);
      setStatus('disconnected');
      setLoading(false);
    });

    newSocket.on(`${currentInstanceId}:disconnected`, (data: { reason: string }) => {
      console.log('Instance disconnected:', data);
      setStatus('disconnected');
      setConnected(false);
      setQrCode(null);
    });

    newSocket.on(
      `${currentInstanceId}:loading_screen`,
      (data: { percent: number; message: string }) => {
        console.log('Loading:', data);
        setStatus(`loading: ${data.percent}% - ${data.message}`);
      }
    );

    return () => {
      newSocket.emit('leave_instance', currentInstanceId);
      newSocket.close();
    };
  }, [currentInstanceId, onConnectionSuccess]);

  const generateQRCode = async () => {
    try {
      setLoading(true);
      setError(null);
      setConnected(false);
      setQrCode(null);
      setStatus('initializing');

      // Criar instÃ¢ncia no backend
      const response = await fetch(
        `http://localhost:3000/api/instances-v2/create/${currentInstanceId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar instÃ¢ncia');
      }

      console.log('Instance created:', result.data);
      setStatus(result.data.status);
    } catch (error) {
      console.error('Error generating QR code:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      setLoading(false);
      setStatus('disconnected');
    }
  };

  const refreshQR = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://localhost:3000/api/instances-v2/qr/${currentInstanceId}/refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao atualizar QR code');
      }

      console.log('QR refresh requested');
    } catch (error) {
      console.error('Error refreshing QR code:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      setLoading(false);
    }
  };

  const getStatusDisplay = () => {
    switch (status) {
      case 'initializing':
        return 'Inicializando...';
      case 'qr_ready':
        return 'QR Code pronto - Escaneie com seu WhatsApp';
      case 'authenticated':
        return 'Autenticado! Finalizando conexÃ£o...';
      case 'ready':
        return 'Conectado com sucesso!';
      case 'disconnected':
        return 'Desconectado';
      case 'destroyed':
        return 'InstÃ¢ncia removida';
      default:
        if (status.startsWith('loading:')) {
          return status.replace('loading:', 'Carregando:');
        }
        return status;
    }
  };

  const instructionSteps = [
    {
      number: 1,
      text: 'Abra o WhatsApp no seu telefone',
    },
    {
      number: 2,
      text: 'Toque em Mais opÃ§Ãµes ou ConfiguraÃ§Ãµes e selecione Aparelhos conectados',
    },
    {
      number: 3,
      text: 'Toque em Conectar um aparelho',
    },
    {
      number: 4,
      text: 'Aponte seu telefone para esta tela para capturar o cÃ³digo',
    },
  ];

  const connectionStatusMessages = [
    'Aguardando escaneamento...',
    'QR Code escaneado!',
    'Verificando autenticaÃ§Ã£o...',
    'Conectando ao WhatsApp...',
    'ConexÃ£o estabelecida!',
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {instanceId ? `Reconectar InstÃ¢ncia ${instanceId}` : 'Conectar Nova InstÃ¢ncia'}
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
                <p className="text-gray-500 text-sm">Gerando QR Code...</p>
              </div>
            ) : qrCode ? (
              <Image
                src={qrCode}
                alt="QR Code"
                className="w-full h-full object-contain"
                width={300}
                height={300}
                unoptimized
              />
            ) : (
              <div className="text-center">
                <QrCodeIcon className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">QR Code serÃ¡ gerado aqui</p>
              </div>
            )}
          </div>

          {/* Status da conexÃ£o */}
          {qrCode && !connected && (
            <div className="mb-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-blue-700 text-sm font-medium">
                  {connectionStatusMessages[connectionSteps] || connectionStatusMessages[0]}
                </p>
                <div className="mt-2 bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                    style={{
                      width: `${(connectionSteps / (connectionStatusMessages.length - 1)) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={generateQRCode}
            disabled={loading || connected}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 px-6 rounded-lg transition-colors flex items-center justify-center mx-auto"
          >
            {loading ? (
              <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <QrCodeIcon className="h-5 w-5 mr-2" />
            )}
            {connected ? 'Conectado' : loading ? 'Gerando...' : 'Gerar QR Code'}
          </button>
        </div>

        {/* InstruÃ§Ãµes */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Como conectar:</h4>
          <ol className="space-y-3">
            {instructionSteps.map(step => (
              <li key={step.number} className="flex items-start space-x-3">
                <span className="bg-blue-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                  {step.number}
                </span>
                <span className="text-sm text-gray-600 leading-relaxed">{step.text}</span>
              </li>
            ))}
          </ol>

          {/* Dicas adicionais */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h5 className="font-medium text-yellow-800 mb-2">ðŸ’¡ Dicas importantes:</h5>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>â€¢ Certifique-se de que seu telefone estÃ¡ conectado Ã  internet</li>
              <li>â€¢ O QR Code expira em 20 segundos, gere um novo se necessÃ¡rio</li>
              <li>â€¢ Mantenha o WhatsApp Web/Desktop fechado em outros dispositivos</li>
            </ul>
          </div>

          {connected && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <h5 className="font-medium text-green-800 mb-2">âœ… ConexÃ£o estabelecida!</h5>
              <p className="text-sm text-green-700">
                Sua instÃ¢ncia estÃ¡ agora conectada e pronta para enviar mensagens.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface Instance {
  id: string;
  name: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'qr_pending';
  phone?: string;
}

interface MessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface MessageSenderProps {
  instances?: Instance[];
}

export const MessageSenderOptimized: React.FC<MessageSenderProps> = ({
  instances: propInstances,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [instances, setInstances] = useState<Instance[]>(propInstances || []);
  const [selectedInstance, setSelectedInstance] = useState<string>('');
  const [recipient, setRecipient] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'text' | 'image' | 'document' | 'audio'>('text');
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  useEffect(() => {
    // Conectar ao socket.io
    const newSocket = io(process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000');
    setSocket(newSocket);

    // Carregar instÃ¢ncias se nÃ£o foram passadas como props
    if (!propInstances) {
      loadInstances();
    }

    // Listeners de notificaÃ§Ãµes em tempo real
    newSocket.on('message_sent', (data: { instanceId: string; messageId: string; to: string }) => {
      if (data.instanceId === selectedInstance) {
        showNotification('success', `Mensagem enviada com sucesso para ${data.to}`);
      }
    });

    newSocket.on('message_failed', (data: { instanceId: string; error: string; to: string }) => {
      if (data.instanceId === selectedInstance) {
        showNotification('error', `Falha ao enviar mensagem para ${data.to}: ${data.error}`);
      }
    });

    return () => {
      newSocket.close();
    };
  }, [selectedInstance, propInstances]);

  const loadInstances = async () => {
    try {
      const response = await fetch(
        `${process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000'}/api/instances`
      );
      if (response.ok) {
        const data = await response.json();
        setInstances(data.instances || []);
      }
    } catch (error) {
      console.error('Erro ao carregar instÃ¢ncias:', error);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!selectedInstance) {
      errors['instance'] = 'Selecione uma instÃ¢ncia WhatsApp';
    }

    if (!recipient.trim()) {
      errors['recipient'] = 'Digite o nÃºmero do destinatÃ¡rio';
    } else if (!/^\+?[\d\s()-]+$/.test(recipient.trim())) {
      errors['recipient'] =
        'Formato de nÃºmero invÃ¡lido (use apenas nÃºmeros, +, espaÃ§os, parÃªnteses e hÃ­fens)';
    }

    if (!message.trim()) {
      errors['message'] = 'Digite a mensagem';
    } else if (message.length > 4096) {
      errors['message'] = 'Mensagem muito longa (mÃ¡ximo 4096 caracteres)';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const sendMessage = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000'}/api/messages/send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instanceId: selectedInstance,
            to: recipient.trim(),
            message: message.trim(),
            type: messageType,
          }),
        }
      );

      const result: MessageResponse = await response.json();

      if (result.success) {
        showNotification('success', 'Mensagem enviada com sucesso!');
        // Limpar formulÃ¡rio
        setRecipient('');
        setMessage('');
        setValidationErrors({});
      } else {
        showNotification('error', result.error || 'Erro ao enviar mensagem');
      }
    } catch (error) {
      showNotification('error', 'Erro de conexÃ£o. Tente novamente.');
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const formatPhoneNumber = (value: string): string => {
    // Remove tudo que nÃ£o Ã© nÃºmero
    const numbers = value.replace(/\D/g, '');

    // Aplica formataÃ§Ã£o brasileira se o nÃºmero for brasileiro
    if (numbers.startsWith('55') && numbers.length >= 12) {
      return numbers.replace(/^(\d{2})(\d{2})(\d{5})(\d{4})$/, '+$1 ($2) $3-$4');
    } else if (numbers.length >= 10) {
      return `+${numbers}`;
    }

    return value;
  };

  const getInstanceColor = (status: string): string => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800';
      case 'qr_pending':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  const getInstanceIcon = (status: string): string => {
    switch (status) {
      case 'connected':
        return 'ðŸŸ¢';
      case 'connecting':
        return 'ðŸŸ¡';
      case 'qr_pending':
        return 'ðŸ”µ';
      default:
        return 'ðŸ”´';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Enviar Mensagem</h2>
        <p className="text-gray-600">Envie mensagens instantaneamente via WhatsApp</p>
      </div>

      {/* NotificaÃ§Ã£o */}
      {notification && (
        <div
          className={`mb-6 p-4 rounded-lg border ${
            notification.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : notification.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <div className="flex items-center">
            <span className="mr-2">
              {notification.type === 'success'
                ? 'âœ…'
                : notification.type === 'error'
                  ? 'âŒ'
                  : 'â„¹ï¸'}
            </span>
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-auto text-xl leading-none hover:opacity-70"
            >
              Ã—
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* SeleÃ§Ã£o de InstÃ¢ncia */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            InstÃ¢ncia WhatsApp *
          </label>
          <select
            value={selectedInstance}
            onChange={e => setSelectedInstance(e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors['instance'] ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
          >
            <option value="">Selecione uma instÃ¢ncia...</option>
            {instances.map(instance => (
              <option key={instance.id} value={instance.id}>
                {instance.name} ({instance.phone || 'NÃ£o conectado'})
              </option>
            ))}
          </select>
          {validationErrors['instance'] && (
            <p className="mt-1 text-sm text-red-600">{validationErrors['instance']}</p>
          )}

          {/* Status da instÃ¢ncia selecionada */}
          {selectedInstance && (
            <div className="mt-2">
              {(() => {
                const instance = instances.find(i => i.id === selectedInstance);
                if (!instance) return null;

                return (
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getInstanceColor(instance.status)}`}
                    >
                      {getInstanceIcon(instance.status)} {instance.status}
                    </span>
                    {instance.status !== 'connected' && (
                      <span className="text-sm text-amber-600">
                        âš ï¸ InstÃ¢ncia nÃ£o estÃ¡ conectada
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* NÃºmero do DestinatÃ¡rio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            NÃºmero do DestinatÃ¡rio *
          </label>
          <input
            type="text"
            value={recipient}
            onChange={e => setRecipient(formatPhoneNumber(e.target.value))}
            placeholder="+55 (11) 99999-9999"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors['recipient'] ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {validationErrors['recipient'] && (
            <p className="mt-1 text-sm text-red-600">{validationErrors['recipient']}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Digite o nÃºmero com cÃ³digo do paÃ­s (ex: +55 para Brasil)
          </p>
        </div>

        {/* Tipo de Mensagem */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Mensagem</label>
          <div className="flex space-x-4">
            {[
              { value: 'text', label: 'Texto', icon: 'ðŸ’¬' },
              { value: 'image', label: 'Imagem', icon: 'ðŸ–¼ï¸' },
              { value: 'document', label: 'Documento', icon: 'ðŸ“„' },
              { value: 'audio', label: 'Ãudio', icon: 'ðŸŽµ' },
            ].map(type => (
              <label key={type.value} className="flex items-center">
                <input
                  type="radio"
                  name="messageType"
                  value={type.value}
                  checked={messageType === type.value}
                  onChange={e => setMessageType(e.target.value as any)}
                  className="sr-only"
                  disabled={isLoading}
                />
                <div
                  className={`px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                    messageType === type.value
                      ? 'bg-blue-100 border-blue-300 text-blue-800'
                      : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{type.icon}</span>
                  {type.label}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* ConteÃºdo da Mensagem */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {messageType === 'text' ? 'Mensagem *' : 'URL do Arquivo *'}
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder={
              messageType === 'text'
                ? 'Digite sua mensagem aqui...'
                : 'https://exemplo.com/arquivo.' +
                  (messageType === 'image' ? 'jpg' : messageType === 'document' ? 'pdf' : 'mp3')
            }
            rows={4}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
              validationErrors['message'] ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {validationErrors['message'] && (
            <p className="mt-1 text-sm text-red-600">{validationErrors['message']}</p>
          )}
          <div className="mt-1 flex justify-between text-sm text-gray-500">
            <span>
              {messageType === 'text'
                ? 'MÃ¡ximo 4096 caracteres'
                : 'Informe a URL completa do arquivo'}
            </span>
            <span>{message.length}/4096</span>
          </div>
        </div>

        {/* BotÃ£o de Envio */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">* Campos obrigatÃ³rios</div>
          <button
            onClick={sendMessage}
            disabled={isLoading || !selectedInstance || !recipient.trim() || !message.trim()}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              isLoading || !selectedInstance || !recipient.trim() || !message.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Enviando...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>ðŸ“¤</span>
                <span>Enviar Mensagem</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageSenderOptimized;

'use client';

import React, { useState, useEffect } from 'react';
import {
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import useSocket from '../../hooks/useSocket';

interface Instance {
  id: string;
  name: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'qr_pending';
  phone?: string;
  phoneNumber?: string;
}

interface MessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  instanceId?: string;
  to?: string;
  content?: string;
  status?: 'sent' | 'delivered' | 'read' | 'failed' | 'pending';
  sentAt?: Date;
}

interface ValidationErrors {
  recipient?: string;
  message?: string;
  instance?: string;
  submit?: string;
}

interface EnhancedMessageSenderProps {
  instances?: Instance[];
  onMessageSent?: (response: MessageResponse) => void;
  showRealtime?: boolean;
}

// Componentes externos
const StatusIndicator = ({
  status,
  lastResponse,
}: {
  status: 'idle' | 'sending' | 'success' | 'error';
  lastResponse: MessageResponse | null;
}) => {
  switch (status) {
    case 'sending':
      return (
        <div className="flex items-center space-x-2 text-blue-600">
          <ClockIcon className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Enviando...</span>
        </div>
      );
    case 'success':
      return (
        <div className="flex items-center space-x-2 text-green-600">
          <CheckCircleIcon className="w-5 h-5" />
          <span className="text-sm font-medium">
            {lastResponse?.messageId
              ? `Enviado! ID: ${lastResponse.messageId}`
              : 'Enviado com sucesso!'}
          </span>
        </div>
      );
    case 'error':
      return (
        <div className="flex items-center space-x-2 text-red-600">
          <XCircleIcon className="w-5 h-5" />
          <span className="text-sm font-medium">Erro no envio</span>
        </div>
      );
    default:
      return null;
  }
};

const ErrorMessage = ({ error }: { error?: string }) => {
  if (!error) return null;
  return (
    <div className="flex items-center space-x-2 text-red-600 text-sm mt-1">
      <ExclamationTriangleIcon className="w-4 h-4" />
      <span>{error}</span>
    </div>
  );
};

export default function EnhancedMessageSender({
  instances: propInstances = [],
  onMessageSent,
  showRealtime = true,
}: EnhancedMessageSenderProps) {
  // Estados do formulário
  const [selectedInstance, setSelectedInstance] = useState<string>('');
  const [recipient, setRecipient] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'sending' | 'success' | 'error'>(
    'idle'
  );
  const [lastResponse, setLastResponse] = useState<MessageResponse | null>(null);

  // Socket para tempo real
  const { realtimeData, sendMessage, isConnected } = useSocket({
    autoConnect: showRealtime,
  });

  // Usar instâncias em tempo real se disponíveis
  const instances =
    showRealtime && realtimeData.instances.length > 0 ? realtimeData.instances : propInstances;

  // Limpar erros quando os campos mudam
  useEffect(() => {
    if (errors.recipient && recipient) {
      setErrors(prev => ({ ...prev, recipient: '' }));
    }
  }, [recipient, errors.recipient]);

  useEffect(() => {
    if (errors.message && message) {
      setErrors(prev => ({ ...prev, message: '' }));
    }
  }, [message, errors.message]);

  useEffect(() => {
    if (errors.instance && selectedInstance) {
      setErrors(prev => ({ ...prev, instance: '' }));
    }
  }, [selectedInstance, errors.instance]);

  // Validação em tempo real do telefone
  const validatePhoneNumber = (phone: string): boolean => {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 15;
  };

  // Formatação do telefone brasileiro
  const formatPhoneNumber = (phone: string): string => {
    const clean = phone.replace(/\D/g, '');

    if (clean.length <= 10) {
      return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (clean.length === 11) {
      return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }

    return phone;
  };

  // Validação completa do formulário
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!selectedInstance) {
      newErrors.instance = 'Selecione uma instância';
    }

    if (!recipient.trim()) {
      newErrors.recipient = 'Digite o número do destinatário';
    } else if (!validatePhoneNumber(recipient)) {
      newErrors.recipient = 'Número de telefone inválido';
    }

    if (!message.trim()) {
      newErrors.message = 'Digite o conteúdo da mensagem';
    } else if (message.trim().length > 4000) {
      newErrors.message = 'Mensagem muito longa (máximo 4000 caracteres)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Enviar mensagem
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setSubmitStatus('error');
      return;
    }

    setIsLoading(true);
    setSubmitStatus('sending');
    setErrors({});

    try {
      let response: MessageResponse;

      if (showRealtime && isConnected) {
        response = await sendMessage(selectedInstance, recipient, message.trim());
      } else {
        const apiResponse = await fetch('/api/messages/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instanceId: selectedInstance,
            to: recipient,
            content: message.trim(),
          }),
        });

        if (!apiResponse.ok) {
          throw new Error(`Erro HTTP: ${apiResponse.status}`);
        }

        response = await apiResponse.json();
      }

      if (response.success) {
        setSubmitStatus('success');
        setLastResponse(response);

        setRecipient('');
        setMessage('');

        if (onMessageSent) {
          onMessageSent(response);
        }

        setTimeout(() => {
          setSubmitStatus('idle');
          setLastResponse(null);
        }, 3000);
      } else {
        throw new Error(response.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setSubmitStatus('error');
      setErrors({
        submit: error instanceof Error ? error.message : 'Erro ao enviar mensagem',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const connectedInstances = instances.filter(i => i.status === 'connected');

  return (
    <div className="bg-white rounded-lg shadow-lg border p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-blue-500 p-2 rounded-lg">
          <PaperAirplaneIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Enviar Mensagem</h3>
          <p className="text-sm text-gray-500">
            {showRealtime && isConnected ? 'Modo tempo real ativo' : 'Modo API tradicional'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seleção de instância */}
        <div>
          <label htmlFor="instance" className="block text-sm font-medium text-gray-700 mb-2">
            Instância WhatsApp
          </label>
          <select
            id="instance"
            value={selectedInstance}
            onChange={e => setSelectedInstance(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.instance ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={isLoading}
          >
            <option value="">Selecione uma instância</option>
            {connectedInstances.map(instance => (
              <option key={instance.id} value={instance.id}>
                {instance.name} {instance.phone && `(${instance.phone})`}
              </option>
            ))}
          </select>
          <ErrorMessage error={errors.instance || ''} />
        </div>

        {/* Número do destinatário */}
        <div>
          <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-2">
            Número do Destinatário
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <PhoneIcon
                className={`h-5 w-5 ${errors.recipient ? 'text-red-400' : 'text-gray-400'}`}
              />
            </div>
            <input
              type="tel"
              id="recipient"
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              onBlur={e => setRecipient(formatPhoneNumber(e.target.value))}
              placeholder="(11) 99999-9999"
              className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.recipient ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={isLoading}
            />
          </div>
          <ErrorMessage error={errors.instance || ''} />
        </div>

        {/* Número do destinatário */}
        <div>
          <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-2">
            Número do Destinatário
          </label>
          <input
            type="tel"
            id="recipient"
            value={recipient}
            onChange={e => setRecipient(e.target.value)}
            placeholder="+55 11 99999-9999"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <ErrorMessage error={errors.recipient || ''} />
        </div>

        {/* Conteúdo da mensagem */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Mensagem
          </label>
          <textarea
            id="message"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Digite sua mensagem aqui..."
            rows={4}
            maxLength={4000}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
              errors.message ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          <div className="flex justify-between items-center mt-1">
            <ErrorMessage error={errors.message || ''} />
            <span className={`text-xs ${message.length > 3800 ? 'text-red-500' : 'text-gray-500'}`}>
              {message.length}/4000
            </span>
          </div>
        </div>

        {/* Erro de submissão */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <ErrorMessage error={errors.submit || ''} />
          </div>
        )}

        {/* Status do envio */}
        {submitStatus !== 'idle' && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <StatusIndicator status={submitStatus} lastResponse={lastResponse} />
          </div>
        )}

        {/* Botão de envio */}
        <button
          type="submit"
          disabled={isLoading || connectedInstances.length === 0}
          className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
            isLoading || connectedInstances.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          }`}
        >
          {isLoading ? (
            <>
              <ClockIcon className="w-5 h-5 animate-spin" />
              <span>Enviando...</span>
            </>
          ) : (
            <>
              <PaperAirplaneIcon className="w-5 h-5" />
              <span>Enviar Mensagem</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

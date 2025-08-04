'use client';

import React, { useState, useMemo, useCallback } from 'react';

import {
  ExclamationTriangleIcon,
  UserIcon,
  UsersIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

interface Instance {
  id: string;
  name: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'qr_pending';
  phone?: string;
  phoneNumber?: string; // Adicionado para compatibilidade
}

interface MessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  // Additional fields for the callback
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
  massRecipients?: string;
  massMessage?: string;
  submit?: string; // Adicionado para erros de submissÃ£o
}

interface MessageSenderProps {
  readonly instances?: Instance[];
  readonly onMessageSent?: (response: MessageResponse) => void;
}

// Componente ErrorMessage extraÃ­do
const ErrorMessage = ({ error }: { error?: string | undefined }) => {
  if (!error) return null;
  return (
    <div className="flex items-center p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
      {error}
    </div>
  );
};

export default function MessageSender({ instances, onMessageSent }: MessageSenderProps) {
  const [selectedInstance, setSelectedInstance] = useState('');
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [massRecipients, setMassRecipients] = useState('');
  const [massMessage, setMassMessage] = useState('');
  const [useDelay, setUseDelay] = useState(true);
  const [activeTab, setActiveTab] = useState<'individual' | 'mass'>('individual');
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const connectedInstances = useMemo(
    () => instances?.filter(i => i.status === 'connected') || [],
    [instances]
  );

  const validatePhoneNumber = useCallback((phone: string): boolean => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
  }, []);

  const validateFields = useCallback(() => {
    const newErrors: ValidationErrors = {};

    if (activeTab === 'individual') {
      if (!selectedInstance) newErrors.instance = 'Selecione uma instÃ¢ncia';
      if (!recipient) {
        newErrors.recipient = 'NÃºmero Ã© obrigatÃ³rio';
      } else if (!validatePhoneNumber(recipient)) {
        newErrors.recipient = 'Formato de nÃºmero invÃ¡lido';
      }
      if (!message.trim()) newErrors.message = 'Mensagem Ã© obrigatÃ³ria';
    } else {
      if (!selectedInstance) newErrors.instance = 'Selecione uma instÃ¢ncia';
      const recipients = massRecipients.split('\n').filter(r => r.trim());
      if (recipients.length === 0) {
        newErrors.massRecipients = 'Adicione pelo menos um nÃºmero';
      } else {
        const invalidNumbers = recipients.filter(num => !validatePhoneNumber(num.trim()));
        if (invalidNumbers.length > 0) {
          newErrors.massRecipients = `${invalidNumbers.length} nÃºmero(s) invÃ¡lido(s)`;
        }
      }
      if (!massMessage.trim()) newErrors.massMessage = 'Mensagem Ã© obrigatÃ³ria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [
    activeTab,
    selectedInstance,
    recipient,
    message,
    massRecipients,
    massMessage,
    validatePhoneNumber,
  ]);

  const handleSendIndividual = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateFields()) return;

      setSending(true);
      setErrors({});

      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            instanceId: selectedInstance,
            to: recipient,
            content: message,
            type: 'individual',
          }),
        });

        const data = await response.json();

        if (response.ok) {
          const successMsg = 'Mensagem enviada com sucesso!';

          if (onMessageSent) {
            onMessageSent({
              success: true,
              messageId: data.messageId || `msg_${Date.now()}`,
            });
          }

          setRecipient('');
          setMessage('');
          alert(successMsg);
        } else {
          throw new Error(data.error || 'Erro ao enviar mensagem');
        }
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        setErrors({ submit: 'Erro ao enviar mensagem. Tente novamente.' });
      } finally {
        setSending(false);
      }
    },
    [selectedInstance, recipient, message, validateFields, onMessageSent]
  );

  const handleSendMass = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateFields()) return;

      const recipients = massRecipients.split('\n').filter(r => r.trim());

      setSending(true);
      setErrors({});

      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            instanceId: selectedInstance,
            recipients,
            content: massMessage,
            type: 'mass',
            useDelay,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          const successMsg = `Enviando para ${recipients.length} contatos...`;

          if (onMessageSent) {
            recipients.forEach((recipient, index) => {
              onMessageSent({
                success: true,
                messageId: `${data.messageId || 'msg'}_${Date.now()}_${index}`,
                instanceId: selectedInstance,
                to: recipient.trim(),
                content: massMessage,
                status: 'sent',
                sentAt: new Date(),
              });
            });
          }

          setMassRecipients('');
          setMassMessage('');
          alert(successMsg);
        } else {
          throw new Error(data.error || 'Erro ao enviar mensagens');
        }
      } catch (error) {
        console.error('Erro ao enviar mensagens:', error);
        setErrors({ submit: 'Erro ao enviar mensagens. Tente novamente.' });
      } finally {
        setSending(false);
      }
    },
    [selectedInstance, massRecipients, massMessage, useDelay, validateFields, onMessageSent]
  );

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Enviar Mensagens</h2>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('individual')}
            className={`flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'individual'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <UserIcon className="h-4 w-4 mr-1" />
            Individual
          </button>
          <button
            onClick={() => setActiveTab('mass')}
            className={`flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'mass'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <UsersIcon className="h-4 w-4 mr-1" />
            Em Massa
          </button>
        </div>
      </div>

      {connectedInstances.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <UsersIcon className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-600">Nenhuma instÃ¢ncia conectada</p>
          <p className="text-sm text-gray-500">Conecte uma instÃ¢ncia para enviar mensagens</p>
        </div>
      ) : (
        <>
          {activeTab === 'individual' && (
            <form onSubmit={handleSendIndividual} className="space-y-4">
              <div>
                <label
                  htmlFor="individual-instance"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  InstÃ¢ncia
                </label>
                <select
                  id="individual-instance"
                  value={selectedInstance}
                  onChange={e => setSelectedInstance(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.instance ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Selecione uma instÃ¢ncia</option>
                  {connectedInstances.map(instance => (
                    <option key={instance.id} value={instance.id}>
                      {instance.name} {instance.phoneNumber && `(${instance.phoneNumber})`}
                    </option>
                  ))}
                </select>
                <ErrorMessage error={errors.instance} />
              </div>

              <div>
                <label
                  htmlFor="individual-recipient"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  NÃºmero do destinatÃ¡rio
                </label>
                <input
                  id="individual-recipient"
                  type="text"
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  placeholder="+55 11 99999-9999"
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.recipient ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
                <ErrorMessage error={errors.recipient} />
              </div>

              <div>
                <label
                  htmlFor="individual-message"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Mensagem
                </label>
                <textarea
                  id="individual-message"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Digite sua mensagem aqui..."
                  rows={4}
                  maxLength={1000}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    errors.message ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
                <div className="flex justify-between items-center mt-1">
                  <ErrorMessage error={errors.message} />
                  <p className="text-xs text-gray-500">{message.length}/1000 caracteres</p>
                </div>
              </div>

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <ErrorMessage error={errors.submit} />
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedInstance || !recipient || !message || sending}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando mensagem...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                    Enviar Mensagem
                  </>
                )}
              </button>
            </form>
          )}

          {activeTab === 'mass' && (
            <form onSubmit={handleSendMass} className="space-y-4">
              <div>
                <label
                  htmlFor="mass-instance"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  InstÃ¢ncia
                </label>
                <select
                  id="mass-instance"
                  value={selectedInstance}
                  onChange={e => setSelectedInstance(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.instance ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Selecione uma instÃ¢ncia</option>
                  {connectedInstances.map(instance => (
                    <option key={instance.id} value={instance.id}>
                      {instance.name} {instance.phoneNumber && `(${instance.phoneNumber})`}
                    </option>
                  ))}
                </select>
                <ErrorMessage error={errors.instance} />
              </div>

              <div>
                <label
                  htmlFor="mass-recipients"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  NÃºmeros dos destinatÃ¡rios (um por linha)
                </label>
                <textarea
                  id="mass-recipients"
                  value={massRecipients}
                  onChange={e => setMassRecipients(e.target.value)}
                  placeholder="+55 11 99999-9999&#10;+55 11 88888-8888&#10;+55 11 77777-7777"
                  rows={6}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm ${
                    errors.massRecipients ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
                <div className="flex justify-between items-center mt-1">
                  <ErrorMessage error={errors.massRecipients} />
                  <p className="text-xs text-gray-500">
                    {massRecipients.split('\n').filter(r => r.trim()).length} contatos
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="mass-message"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Mensagem
                </label>
                <textarea
                  id="mass-message"
                  value={massMessage}
                  onChange={e => setMassMessage(e.target.value)}
                  placeholder="Digite sua mensagem aqui..."
                  rows={4}
                  maxLength={1000}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    errors.massMessage ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
                <div className="flex justify-between items-center mt-1">
                  <ErrorMessage error={errors.massMessage} />
                  <p className="text-xs text-gray-500">{massMessage.length}/1000 caracteres</p>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="delay"
                  checked={useDelay}
                  onChange={e => setUseDelay(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="delay" className="text-sm text-gray-700 ml-2">
                  Intervalo entre envios (5 segundos)
                </label>
              </div>

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <ErrorMessage error={errors.submit} />
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedInstance || !massRecipients.trim() || !massMessage || sending}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando para {massRecipients.split('\n').filter(r => r.trim()).length}{' '}
                    contatos...
                  </>
                ) : (
                  <>
                    <UsersIcon className="h-5 w-5 mr-2" />
                    Enviar em Massa ({massRecipients.split('\n').filter(r => r.trim()).length}{' '}
                    contatos)
                  </>
                )}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}

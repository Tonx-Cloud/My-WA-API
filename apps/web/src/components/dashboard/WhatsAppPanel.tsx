'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface Contact {
  id: string;
  name: string;
  phone: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  avatar?: string;
  status: 'online' | 'offline' | 'typing';
}

interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  type: 'text' | 'image' | 'document' | 'audio';
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  isFromMe: boolean;
}

interface Instance {
  id: string;
  name: string;
  phone?: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'qr_pending';
}

interface WhatsAppPanelProps {
  instances?: Instance[];
}

export const WhatsAppPanel: React.FC<WhatsAppPanelProps> = ({ instances: propInstances }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [instances, setInstances] = useState<Instance[]>(propInstances || []);
  const [selectedInstance, setSelectedInstance] = useState<string>('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Conectar ao socket.io
    const newSocket = io(process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000');
    setSocket(newSocket);

    // Listeners de eventos em tempo real
    newSocket.on('message_received', (data: Message) => {
      if (data.to === selectedInstance) {
        setMessages(prev => [...prev, data]);
        updateContactLastMessage(data.from, data.content, data.timestamp);
        scrollToBottom();
      }
    });

    newSocket.on(
      'contact_status_update',
      (data: { contactId: string; status: 'online' | 'offline' | 'typing' }) => {
        setContacts(prev =>
          prev.map(contact =>
            contact.id === data.contactId ? { ...contact, status: data.status } : contact
          )
        );
      }
    );

    // Carregar dados iniciais
    loadInstances();

    return () => {
      newSocket.close();
    };
  }, [selectedInstance]);

  useEffect(() => {
    if (selectedInstance) {
      loadContacts();
    }
  }, [selectedInstance]);

  useEffect(() => {
    if (selectedContact) {
      loadMessages();
    }
  }, [selectedContact]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadInstances = async () => {
    try {
      const response = await fetch(
        `${process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000'}/api/instances`
      );
      if (response.ok) {
        const data = await response.json();
        setInstances(data.instances || []);
        if (data.instances && data.instances.length > 0) {
          setSelectedInstance(data.instances[0].id);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar instÃ¢ncias:', error);
    }
  };

  const loadContacts = async () => {
    try {
      const response = await fetch(
        `${process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000'}/api/contacts?instanceId=${selectedInstance}`
      );
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
    }
  };

  const loadMessages = async () => {
    if (!selectedContact) return;

    try {
      const response = await fetch(
        `${process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000'}/api/messages?instanceId=${selectedInstance}&contactId=${selectedContact.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  const updateContactLastMessage = (contactId: string, content: string, timestamp: string) => {
    setContacts(prev =>
      prev.map(contact =>
        contact.id === contactId
          ? {
              ...contact,
              lastMessage: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
              lastMessageTime: timestamp,
              unreadCount: contact.id === selectedContact?.id ? 0 : contact.unreadCount + 1,
            }
          : contact
      )
    );
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedContact || !selectedInstance) return;

    setIsLoading(true);

    const tempMessage: Message = {
      id: Date.now().toString(),
      from: selectedInstance,
      to: selectedContact.id,
      content: newMessage.trim(),
      type: 'text',
      timestamp: new Date().toISOString(),
      status: 'sending',
      isFromMe: true,
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    scrollToBottom();

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
            to: selectedContact.phone,
            message: newMessage.trim(),
            type: 'text',
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === tempMessage.id ? { ...msg, id: result.messageId, status: 'sent' } : msg
          )
        );
        updateContactLastMessage(selectedContact.id, newMessage.trim(), new Date().toISOString());
      } else {
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContacts = contacts.filter(
    contact =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm)
  );

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 24) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'sending':
        return 'ðŸ•’';
      case 'sent':
        return 'âœ“';
      case 'delivered':
        return 'âœ“âœ“';
      case 'read':
        return 'âœ“âœ“';
      default:
        return '';
    }
  };

  const getInstanceStatusColor = (status: string): string => {
    switch (status) {
      case 'connected':
        return 'text-green-600';
      case 'connecting':
        return 'text-yellow-600';
      case 'qr_pending':
        return 'text-blue-600';
      default:
        return 'text-red-600';
    }
  };

  return (
    <div className="flex h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Sidebar - Lista de InstÃ¢ncias e Contatos */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        {/* Header do Sidebar */}
        <div className="bg-gray-50 p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">WhatsApp</h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Online</span>
            </div>
          </div>

          {/* SeleÃ§Ã£o de InstÃ¢ncia */}
          <select
            value={selectedInstance}
            onChange={e => setSelectedInstance(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
          >
            <option value="">Selecione uma instÃ¢ncia...</option>
            {instances.map(instance => (
              <option key={instance.id} value={instance.id}>
                {instance.name} ({instance.phone || 'Sem nÃºmero'})
              </option>
            ))}
          </select>

          {selectedInstance && (
            <div className="mt-2 text-xs">
              <span className="text-gray-600">Status: </span>
              <span
                className={`font-medium ${getInstanceStatusColor(instances.find(i => i.id === selectedInstance)?.status || '')}`}
              >
                {instances.find(i => i.id === selectedInstance)?.status || 'Desconhecido'}
              </span>
            </div>
          )}
        </div>

        {/* Busca de Contatos */}
        <div className="p-3 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar contatos..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">ðŸ”</div>
          </div>
        </div>

        {/* Lista de Contatos */}
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <div className="text-4xl mb-2">ðŸ“±</div>
              <p>Nenhum contato encontrado</p>
            </div>
          ) : (
            filteredContacts.map(contact => (
              <div
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedContact?.id === contact.id ? 'bg-green-50 border-green-200' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      {contact.avatar ? (
                        <img
                          src={contact.avatar}
                          alt={contact.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xl">ðŸ‘¤</span>
                      )}
                    </div>
                    {contact.status === 'online' && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 truncate">{contact.name}</h3>
                      {contact.lastMessageTime && (
                        <span className="text-xs text-gray-500">
                          {formatTime(contact.lastMessageTime)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate">
                        {contact.status === 'typing' ? (
                          <span className="text-green-600 italic">digitando...</span>
                        ) : (
                          contact.lastMessage || 'Nenhuma mensagem'
                        )}
                      </p>
                      {contact.unreadCount > 0 && (
                        <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {contact.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Ãrea Principal - Chat */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            {/* Header do Chat */}
            <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                {selectedContact.avatar ? (
                  <img
                    src={selectedContact.avatar}
                    alt={selectedContact.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-lg">ðŸ‘¤</span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{selectedContact.name}</h3>
                <p className="text-sm text-gray-600">
                  {selectedContact.status === 'online'
                    ? 'online'
                    : selectedContact.status === 'typing'
                      ? 'digitando...'
                      : 'offline'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-full">ðŸ“ž</button>
                <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-full">ðŸŽ¥</button>
                <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-full">â‹®</button>
              </div>
            </div>

            {/* Ãrea de Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">ðŸ’¬</div>
                    <p className="text-gray-500">Nenhuma mensagem ainda</p>
                    <p className="text-sm text-gray-400">
                      Envie uma mensagem para comeÃ§ar a conversa
                    </p>
                  </div>
                ) : (
                  messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.isFromMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.isFromMe
                            ? 'bg-green-500 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div
                          className={`flex items-center justify-end space-x-1 mt-1 ${
                            message.isFromMe ? 'text-green-100' : 'text-gray-500'
                          }`}
                        >
                          <span className="text-xs">{formatTime(message.timestamp)}</span>
                          {message.isFromMe && (
                            <span className="text-xs">{getStatusIcon(message.status)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input de Nova Mensagem */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center space-x-3">
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">ðŸ˜Š</button>
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">ðŸ“Ž</button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Digite uma mensagem..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && sendMessage()}
                    className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    disabled={isLoading}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || isLoading}
                  className={`p-2 rounded-full transition-colors ${
                    newMessage.trim() && !isLoading
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span className="text-lg">â–¶ï¸</span>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Tela de Boas-vindas */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="text-6xl mb-4">ðŸ’¬</div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">WhatsApp Web</h2>
              <p className="text-gray-600 mb-4">Selecione um contato para comeÃ§ar a conversar</p>
              <div className="text-sm text-gray-500">
                <p>âœ“ Envie e receba mensagens em tempo real</p>
                <p>âœ“ Gerencie mÃºltiplas instÃ¢ncias WhatsApp</p>
                <p>âœ“ Interface intuitiva e familiar</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppPanel;

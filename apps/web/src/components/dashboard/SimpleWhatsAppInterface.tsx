'use client';

import React, { useState } from 'react';
import { ChatBubbleLeftRightIcon, UserIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface SimpleContact {
  id: string;
  name: string;
  phone: string;
  lastMessage?: string;
  isOnline?: boolean;
}

export default function SimpleWhatsAppInterface() {
  const [selectedContact, setSelectedContact] = useState<SimpleContact | null>(null);
  const [message, setMessage] = useState('');

  const contacts: SimpleContact[] = [
    {
      id: '1',
      name: 'João Silva',
      phone: '+55 11 99999-9999',
      lastMessage: 'Olá! Como está?',
      isOnline: true,
    },
    {
      id: '2',
      name: 'Maria Santos',
      phone: '+55 11 88888-8888',
      lastMessage: 'Obrigada pelo contato',
      isOnline: false,
    },
  ];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedContact) return;

    console.log('Enviando mensagem:', {
      to: selectedContact.phone,
      message: message.trim(),
    });
    setMessage('');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="bg-green-500 p-2 rounded-lg">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Interface WhatsApp Web</h3>
            <p className="text-sm text-gray-500">Selecione um contato para conversar</p>
          </div>
        </div>
      </div>

      <div className="flex h-[400px]">
        {/* Lista de contatos */}
        <div className="w-1/3 border-r border-gray-200">
          <div className="p-4 space-y-2">
            {contacts.map(contact => (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={`w-full p-3 text-left rounded-lg transition-colors ${
                  selectedContact?.id === contact.id
                    ? 'bg-green-50 border border-green-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-gray-600" />
                    </div>
                    {contact.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{contact.name}</h4>
                    <p className="text-xs text-gray-500 truncate">
                      {contact.lastMessage || contact.phone}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Área do chat */}
        <div className="flex-1 flex flex-col">
          {selectedContact ? (
            <>
              {/* Header do chat */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{selectedContact.name}</h4>
                    <p className="text-xs text-gray-500">
                      {selectedContact.isOnline ? 'online' : selectedContact.phone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Área de mensagens */}
              <div className="flex-1 bg-gray-50 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Histórico de conversas</p>
                  <p className="text-xs">Funcionalidade em desenvolvimento</p>
                </div>
              </div>

              {/* Input de mensagem */}
              <div className="p-4 border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <input
                    type="text"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Digite uma mensagem..."
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    type="submit"
                    disabled={!message.trim()}
                    className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:bg-gray-300 transition-colors"
                    aria-label="Enviar mensagem"
                  >
                    <PaperAirplaneIcon className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ChatBubbleLeftRightIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">WhatsApp Web</h4>
                <p className="text-sm text-gray-500">
                  Selecione um contato para iniciar uma conversa
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import EnhancedStatsCards from './EnhancedStatsCards';
import EnhancedMessageSender from './EnhancedMessageSender';
import EnhancedRecentActivity from './EnhancedRecentActivity';
import QRCodeGenerator from './QRCodeGenerator';
import SimpleWhatsAppInterface from './SimpleWhatsAppInterface';
import AutomationBuilder from './AutomationBuilder';
import AdvancedMetrics from './AdvancedMetrics';

interface EnhancedDashboardProps {
  /** Se deve usar dados em tempo real via Socket.IO */
  enableRealtime?: boolean;
  /** ConfiguraÃ§Ãµes de layout */
  layout?: 'grid' | 'single-column';
  /** ConfiguraÃ§Ãµes especÃ­ficas para cada componente */
  settings?: {
    statsCards?: {
      autoRefresh?: boolean;
      refreshInterval?: number;
    };
    messageSender?: {
      enableValidation?: boolean;
      showTemplates?: boolean;
    };
    recentActivity?: {
      maxItems?: number;
      showFilters?: boolean;
    };
    qrGenerator?: {
      autoRefresh?: boolean;
      showInstanceSelector?: boolean;
    };
  };
}

export default function EnhancedDashboard({
  enableRealtime = true,
  layout = 'grid',
  settings = {},
}: EnhancedDashboardProps) {
  const { statsCards = {}, messageSender = {}, recentActivity = {}, qrGenerator = {} } = settings;

  if (layout === 'single-column') {
    return (
      <div className="space-y-6">
        {/* Cards de estatÃ­sticas */}
        <div className="w-full">
          <EnhancedStatsCards showRealtime={enableRealtime} />
        </div>

        {/* Grid de ferramentas principais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Envio de mensagens */}
          <div className="order-1">
            <EnhancedMessageSender />
          </div>

          {/* QR Code */}
          <div className="order-2">
            <QRCodeGenerator />
          </div>
        </div>

        {/* Atividades recentes */}
        <div className="w-full">
          <EnhancedRecentActivity
            showRealtime={enableRealtime}
            maxItems={recentActivity.maxItems || 10}
            autoRefresh={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de estatÃ­sticas - sempre no topo */}
      <div className="w-full">
        <EnhancedStatsCards showRealtime={enableRealtime} />
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna esquerda - Ferramentas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Grid de ferramentas */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Envio de mensagens */}
            <div className="order-1">
              <EnhancedMessageSender />
            </div>

            {/* QR Code */}
            <div className="order-2">
              <QRCodeGenerator />
            </div>
          </div>

          {/* Atividades recentes - largura total */}
          <div className="w-full">
            <EnhancedRecentActivity
              showRealtime={enableRealtime}
              maxItems={recentActivity.maxItems || 8}
              autoRefresh={true}
            />
          </div>

          {/* Interface WhatsApp Web */}
          <div className="w-full">
            <SimpleWhatsAppInterface />
          </div>

          {/* AutomaÃ§Ãµes Inteligentes */}
          <div className="w-full">
            <AutomationBuilder />
          </div>
        </div>

        {/* Coluna direita - Painel lateral (para futuros componentes) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Placeholder para componentes futuros */}
          <div className="bg-white rounded-lg shadow-lg border p-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">EspaÃ§o reservado</h3>
              <p className="text-sm text-gray-500">Novos recursos serÃ£o adicionados aqui</p>
            </div>
          </div>

          {/* MÃ©tricas AvanÃ§adas */}
          <div className="lg:col-span-3">
            <AdvancedMetrics />
          </div>

          {/* Status de conexÃ£o em tempo real */}
          {enableRealtime && (
            <div className="bg-white rounded-lg shadow-lg border p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Status da ConexÃ£o</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Socket.IO</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 font-medium">Conectado</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">AtualizaÃ§Ãµes</span>
                  <span className="text-xs text-gray-600">Tempo real</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import {
  SwatchIcon,
  SparklesIcon,
  CubeIcon,
  PaintBrushIcon,
  RectangleGroupIcon,
  UserCircleIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

import { Button, Card, Badge, Avatar, StatusIndicator, LoadingSpinner, StatCard } from '../ui';

interface DesignSystemShowcaseProps {
  className?: string;
}

export default function DesignSystemShowcase({ className }: DesignSystemShowcaseProps) {
  const [loading, setLoading] = useState(false);

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className={`space-y-8 p-6 ${className}`}>
      {/* Cabeçalho */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🎨 Design System WhatsApp</h1>
        <p className="text-lg text-gray-600">
          Demonstração completa dos componentes e padrões visuais
        </p>
      </div>

      {/* Paleta de Cores */}
      <Card variant="elevated" padding="lg">
        <div className="flex items-center mb-6">
          <SwatchIcon className="w-6 h-6 text-whatsapp-500 mr-3" />
          <h2 className="text-2xl font-semibold text-gray-900">Paleta de Cores</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* WhatsApp Green */}
          <div className="text-center">
            <div className="w-16 h-16 bg-whatsapp-500 rounded-lg mx-auto mb-2 shadow-lg"></div>
            <p className="text-sm font-medium">WhatsApp Green</p>
            <p className="text-xs text-gray-500">#25D366</p>
          </div>

          {/* WhatsApp Dark */}
          <div className="text-center">
            <div className="w-16 h-16 bg-whatsapp-dark-900 rounded-lg mx-auto mb-2 shadow-lg"></div>
            <p className="text-sm font-medium">WhatsApp Dark</p>
            <p className="text-xs text-gray-500">#075E54</p>
          </div>

          {/* WhatsApp Blue */}
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-lg mx-auto mb-2 shadow-lg"></div>
            <p className="text-sm font-medium">WhatsApp Blue</p>
            <p className="text-xs text-gray-500">#34B7F1</p>
          </div>

          {/* Chat Background */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-2 shadow-lg border-2 border-gray-300"></div>
            <p className="text-sm font-medium">Chat Background</p>
            <p className="text-xs text-gray-500">#ECE5DD</p>
          </div>
        </div>
      </Card>

      {/* Botões */}
      <Card variant="elevated" padding="lg">
        <div className="flex items-center mb-6">
          <CubeIcon className="w-6 h-6 text-whatsapp-500 mr-3" />
          <h2 className="text-2xl font-semibold text-gray-900">Botões</h2>
        </div>

        <div className="space-y-4">
          {/* Tamanhos */}
          <div>
            <h3 className="text-lg font-medium mb-3">Tamanhos</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" size="sm">
                Small
              </Button>
              <Button variant="primary" size="md">
                Medium
              </Button>
              <Button variant="primary" size="lg">
                Large
              </Button>
              <Button variant="primary" size="xl">
                Extra Large
              </Button>
            </div>
          </div>

          {/* Variantes */}
          <div>
            <h3 className="text-lg font-medium mb-3">Variantes</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="success">Success</Button>
              <Button variant="warning">Warning</Button>
            </div>
          </div>

          {/* Estados */}
          <div>
            <h3 className="text-lg font-medium mb-3">Estados</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" disabled>
                Disabled
              </Button>
              <Button variant="primary" loading={loading} onClick={handleLoadingDemo}>
                {loading ? 'Loading...' : 'Click to Load'}
              </Button>
              <Button variant="primary" icon={<SparklesIcon className="w-4 h-4" />}>
                With Icon
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Badges e Status */}
      <Card variant="elevated" padding="lg">
        <div className="flex items-center mb-6">
          <BellIcon className="w-6 h-6 text-whatsapp-500 mr-3" />
          <h2 className="text-2xl font-semibold text-gray-900">Badges e Status</h2>
        </div>

        <div className="space-y-4">
          {/* Badges */}
          <div>
            <h3 className="text-lg font-medium mb-3">Badges</h3>
            <div className="flex flex-wrap gap-3">
              <Badge variant="default">Default</Badge>
              <Badge variant="primary">Primary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="error">Error</Badge>
              <Badge variant="online" pulse>
                Online
              </Badge>
            </div>
          </div>

          {/* Status Indicators */}
          <div>
            <h3 className="text-lg font-medium mb-3">Status Indicators</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <StatusIndicator status="connected" showLabel label="Conectado" />
                <StatusIndicator status="connecting" showLabel label="Conectando..." pulse />
                <StatusIndicator status="disconnected" showLabel label="Desconectado" />
                <StatusIndicator status="error" showLabel label="Erro de Conexão" />
              </div>
            </div>
          </div>

          {/* Loading Spinners */}
          <div>
            <h3 className="text-lg font-medium mb-3">Loading Spinners</h3>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <LoadingSpinner size="sm" color="primary" />
                <p className="text-xs mt-1">Small</p>
              </div>
              <div className="text-center">
                <LoadingSpinner size="md" color="secondary" />
                <p className="text-xs mt-1">Medium</p>
              </div>
              <div className="text-center">
                <LoadingSpinner size="lg" color="primary" />
                <p className="text-xs mt-1">Large</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Avatares */}
      <Card variant="elevated" padding="lg">
        <div className="flex items-center mb-6">
          <UserCircleIcon className="w-6 h-6 text-whatsapp-500 mr-3" />
          <h2 className="text-2xl font-semibold text-gray-900">Avatares</h2>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-3">Tamanhos</h3>
            <div className="flex items-center space-x-4">
              <Avatar size="xs" fallback="XS" />
              <Avatar size="sm" fallback="SM" />
              <Avatar size="md" fallback="MD" />
              <Avatar size="lg" fallback="LG" />
              <Avatar size="xl" fallback="XL" />
              <Avatar size="2xl" fallback="2XL" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Estados</h3>
            <div className="flex items-center space-x-4">
              <Avatar size="lg" fallback="OF" />
              <Avatar size="lg" fallback="ON" online />
              <Avatar size="lg" src="https://via.placeholder.com/100" alt="User" />
              <Avatar size="lg" src="https://via.placeholder.com/100" alt="User" online />
            </div>
          </div>
        </div>
      </Card>

      {/* Cards */}
      <Card variant="elevated" padding="lg">
        <div className="flex items-center mb-6">
          <RectangleGroupIcon className="w-6 h-6 text-whatsapp-500 mr-3" />
          <h2 className="text-2xl font-semibold text-gray-900">Cards</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card variant="default" padding="md">
            <h3 className="font-semibold mb-2">Card Padrão</h3>
            <p className="text-sm text-gray-600">Este é um card com estilo padrão.</p>
          </Card>

          <Card variant="outlined" padding="md">
            <h3 className="font-semibold mb-2">Card Outlined</h3>
            <p className="text-sm text-gray-600">Card com borda mais pronunciada.</p>
          </Card>

          <Card variant="whatsapp" padding="md">
            <h3 className="font-semibold mb-2">Card WhatsApp</h3>
            <p className="text-sm text-gray-600">Card com tema WhatsApp.</p>
          </Card>
        </div>
      </Card>

      {/* Stat Cards */}
      <Card variant="elevated" padding="lg">
        <div className="flex items-center mb-6">
          <PaintBrushIcon className="w-6 h-6 text-whatsapp-500 mr-3" />
          <h2 className="text-2xl font-semibold text-gray-900">Stat Cards</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Mensagens Enviadas"
            value="1,234"
            description="Hoje"
            icon={<ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />}
            color="bg-whatsapp-500"
            trend={{
              value: 12,
              isPositive: true,
              label: 'vs. ontem',
            }}
            realtime={true}
          />

          <StatCard
            title="Taxa de Sucesso"
            value="98.5%"
            description="Últimas 24h"
            icon={<CheckCircleIcon className="w-6 h-6 text-white" />}
            color="bg-green-500"
            trend={{
              value: 2,
              isPositive: true,
              label: 'vs. semana',
            }}
          />

          <StatCard
            title="Tempo de Resposta"
            value="1.2s"
            description="Média"
            icon={<InformationCircleIcon className="w-6 h-6 text-white" />}
            color="bg-blue-500"
            trend={{
              value: 5,
              isPositive: false,
              label: 'vs. meta',
            }}
          />

          <StatCard
            title="Erros"
            value="3"
            description="Últimas 24h"
            icon={<ExclamationTriangleIcon className="w-6 h-6 text-white" />}
            color="bg-red-500"
            loading={loading}
          />
        </div>
      </Card>

      {/* Notificações */}
      <Card variant="elevated" padding="lg">
        <div className="flex items-center mb-6">
          <BellIcon className="w-6 h-6 text-whatsapp-500 mr-3" />
          <h2 className="text-2xl font-semibold text-gray-900">Notificações</h2>
        </div>

        <div className="space-y-4">
          {/* Sucesso */}
          <Card variant="outlined" className="border-green-200 bg-green-50">
            <div className="flex items-start space-x-3">
              <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-green-800">Sucesso</h4>
                <p className="text-sm text-green-700">Mensagem enviada com sucesso!</p>
              </div>
            </div>
          </Card>

          {/* Aviso */}
          <Card variant="outlined" className="border-yellow-200 bg-yellow-50">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Atenção</h4>
                <p className="text-sm text-yellow-700">
                  Algumas funcionalidades podem estar lentas.
                </p>
              </div>
            </div>
          </Card>

          {/* Erro */}
          <Card variant="outlined" className="border-red-200 bg-red-50">
            <div className="flex items-start space-x-3">
              <XCircleIcon className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Erro</h4>
                <p className="text-sm text-red-700">Falha na conexão. Tente novamente.</p>
              </div>
            </div>
          </Card>

          {/* Info */}
          <Card variant="outlined" className="border-blue-200 bg-blue-50">
            <div className="flex items-start space-x-3">
              <InformationCircleIcon className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">Informação</h4>
                <p className="text-sm text-blue-700">Nova versão disponível para download.</p>
              </div>
            </div>
          </Card>
        </div>
      </Card>

      {/* Rodapé */}
      <Card variant="whatsapp" padding="lg" className="text-center">
        <SparklesIcon className="w-8 h-8 text-whatsapp-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Design System Completo!</h3>
        <p className="text-gray-600">
          Todos os componentes seguem as diretrizes visuais do WhatsApp para máxima consistência.
        </p>
        <div className="mt-4">
          <Button variant="primary" size="lg">
            Implementar no Projeto
          </Button>
        </div>
      </Card>
    </div>
  );
}

'use client';

import { useState, ChangeEvent, useEffect } from 'react';
import {
  CogIcon,
  BellIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
// Corrige erro de tipagem dos Heroicons
const CheckCircleIconAny = CheckCircleIcon as any;
const ExclamationTriangleIconAny = ExclamationTriangleIcon as any;
const CogIconAny = CogIcon as any;
const BellIconAny = BellIcon as any;
const GlobeAltIconAny = GlobeAltIcon as any;
const ShieldCheckIconAny = ShieldCheckIcon as any;
const UserIconAny = UserIcon as any;
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { useDashboardStore } from '@/stores/dashboard-new';

export default function SettingsPage() {
  const { systemConfig, setSystemConfig } = useDashboardStore();
  const [activeTab, setActiveTab] = useState('general');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: 'admin',
    email: 'admin@my-wa-api.com',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSaveSettings = async () => {
    setSaveStatus('saving');

    try {
      // Simular salvamento das configuraÃ§Ãµes
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Aqui vocÃª faria a chamada real para a API
      // await fetch('/api/settings', {
      //   method: 'PUT',
      //   body: JSON.stringify({ systemConfig, formData })
      // });

      setSaveStatus('saved');
    } catch (error) {
      console.error('Erro ao salvar configuraÃ§Ãµes:', error);
      setSaveStatus('error');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveSettings();
  };

  // Auto-save functionality
  useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => setSaveStatus('idle'), 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [saveStatus]);

  const tabs = [
    { id: 'general', name: 'Geral', icon: CogIconAny },
    { id: 'notifications', name: 'NotificaÃ§Ãµes', icon: BellIconAny },
    { id: 'language', name: 'Idioma', icon: GlobeAltIconAny },
    { id: 'security', name: 'SeguranÃ§a', icon: ShieldCheckIconAny },
    { id: 'account', name: 'Conta', icon: UserIconAny },
  ];

  const handleConfigChange = (key: string, value: any) => {
    setSystemConfig({
      ...systemConfig,
      [key]: value,
    });
    setSaveStatus('saving');
    // Simular save
    setTimeout(() => setSaveStatus('saved'), 1000);
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setSystemConfig({
      ...systemConfig,
      notifications: {
        ...systemConfig.notifications,
        [key]: value,
      },
    });
    setSaveStatus('saving');
    setTimeout(() => setSaveStatus('saved'), 1000);
  };

  const handleOAuthChange = (provider: string, key: string, value: any) => {
    setSystemConfig({
      ...systemConfig,
      oauth: {
        ...systemConfig.oauth,
        [provider]: {
          ...systemConfig.oauth[provider as keyof typeof systemConfig.oauth],
          [key]: value,
        },
      },
    });
    setSaveStatus('saving');
    setTimeout(() => setSaveStatus('saved'), 1000);
  };

  const handleFormDataChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const SaveStatusIndicator = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <div className="flex items-center text-yellow-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
            Salvando...
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center text-green-600">
            {/* Corrige erro de tipagem do Heroicons */}
            <CheckCircleIconAny className="h-4 w-4 mr-2" />
            Salvo com sucesso
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center text-red-600">
            <ExclamationTriangleIconAny className="h-4 w-4 mr-2" />
            Erro ao salvar
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* CabeÃ§alho com status */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ConfiguraÃ§Ãµes</h1>
          <p className="text-gray-600">Gerencie as configuraÃ§Ãµes do sistema</p>
        </div>
        <SaveStatusIndicator />
      </div>

      <div className="flex">
        {/* NavegaÃ§Ã£o lateral */}
        <div className="w-64 bg-white shadow rounded-lg mr-6">
          <nav className="p-4 space-y-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {Icon && <Icon className="h-5 w-5 mr-3" />}
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ConteÃºdo principal */}
        <form onSubmit={handleFormSubmit} className="flex-1 bg-white shadow rounded-lg p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900">ConfiguraÃ§Ãµes Gerais</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tema</label>
                <select
                  value={systemConfig.theme}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    handleConfigChange('theme', e.target.value)
                  }
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  aria-label="Selecionar tema"
                >
                  <option value="light">Claro</option>
                  <option value="dark">Escuro</option>
                  <option value="system">Sistema</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Idioma PadrÃ£o
                </label>
                <select
                  value={systemConfig.language}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    handleConfigChange('language', e.target.value)
                  }
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  aria-label="Selecionar idioma"
                >
                  <option value="pt">PortuguÃªs</option>
                  <option value="en">English</option>
                  <option value="es">EspaÃ±ol</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900">NotificaÃ§Ãµes</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">NotificaÃ§Ãµes por Email</h3>
                    <p className="text-sm text-gray-500">Receber alertas por email</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={systemConfig.notifications.email}
                    onChange={e => handleNotificationChange('email', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    aria-label="Ativar notificaÃ§Ãµes por email"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">NotificaÃ§Ãµes Push</h3>
                    <p className="text-sm text-gray-500">Receber notificaÃ§Ãµes no navegador</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={systemConfig.notifications.push}
                    onChange={e => handleNotificationChange('push', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    aria-label="Ativar notificaÃ§Ãµes push"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Webhook</h3>
                    <p className="text-sm text-gray-500">Enviar notificaÃ§Ãµes via webhook</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={systemConfig.notifications.webhook}
                    onChange={e => handleNotificationChange('webhook', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    aria-label="Ativar notificaÃ§Ãµes via webhook"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'language' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900">ConfiguraÃ§Ãµes de Idioma</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Idioma da Interface
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'pt', label: 'PortuguÃªs (Brasil)' },
                    { value: 'en', label: 'English (US)' },
                    { value: 'es', label: 'EspaÃ±ol' },
                  ].map(lang => (
                    <label key={lang.value} className="flex items-center">
                      <input
                        type="radio"
                        name="language"
                        value={lang.value}
                        checked={systemConfig.language === lang.value}
                        onChange={e => handleConfigChange('language', e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-900">{lang.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900">ConfiguraÃ§Ãµes de SeguranÃ§a</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Login com Google</h3>
                    <p className="text-sm text-gray-500">
                      Permitir autenticaÃ§Ã£o via Google OAuth
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={systemConfig.oauth.google.enabled}
                    onChange={e => handleOAuthChange('google', 'enabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    aria-label="Ativar login com Google"
                  />
                </div>

                {systemConfig.oauth.google.enabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Google Client ID
                    </label>
                    <input
                      type="text"
                      autoComplete="off"
                      value={systemConfig.oauth.google.clientId || ''}
                      onChange={e => handleOAuthChange('google', 'clientId', e.target.value)}
                      placeholder="Digite o Client ID do Google"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900">ConfiguraÃ§Ãµes da Conta</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome de UsuÃ¡rio
                  </label>
                  <input
                    type="text"
                    autoComplete="username"
                    defaultValue="admin"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="userEmail"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email
                  </label>
                  <input
                    id="userEmail"
                    type="email"
                    autoComplete="email"
                    defaultValue="admin@my-wa-api.com"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Digite seu email"
                  />
                </div>

                <div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Alterar Senha
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* BotÃµes de aÃ§Ã£o */}
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saveStatus === 'saving'}
              className="bg-blue-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveStatus === 'saving' ? 'Salvando...' : 'Salvar AlteraÃ§Ãµes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

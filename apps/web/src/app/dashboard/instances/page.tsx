// Corrige erro de tipagem dos Heroicons
const ArrowPathIconAny = ArrowPathIcon as any;
const PlusIconAny = PlusIcon as any;
const QrCodeIconAny = QrCodeIcon as any;
const TrashIconAny = TrashIcon as any;
const XMarkIconAny = XMarkIcon as any;
'use client';

import { useState, useEffect } from 'react';
import {
  PlusIcon,
  QrCodeIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { ArrowPathIcon } from '@heroicons/react/24/solid';
import QRCodeGeneratorNew from '@/components/dashboard/QRCodeGeneratorNew';

interface InstanceStats {
  id: string;
  name: string;
  status: 'connected' | 'connecting' | 'disconnected';
  phoneNumber?: string;
  messagesSent: number;
  messagesReceived: number;
  lastActivity: Date;
}

interface QRModalData {
  instanceId: string;
  qrCode: string;
  isOpen: boolean;
  isMock?: boolean;
}

export default function InstancesPage() {
  const [instances, setInstances] = useState<InstanceStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [qrModal, setQrModal] = useState<QRModalData>({
    instanceId: '',
    qrCode: '',
    isOpen: false,
    isMock: false,
  });
  const [newInstanceModal, setNewInstanceModal] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [successModal, setSuccessModal] = useState({ isOpen: false, countdown: 0 });

  useEffect(() => {
    fetchInstances();

    // Configurar refresh automÃ¡tico a cada 5 segundos
    const interval = setInterval(() => {
      fetchInstances(true); // true indica que Ã© um refresh
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchInstances = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);

    try {
      const response = await fetch('/api/instances', {
        cache: 'no-store', // Sempre buscar dados frescos
      });
      if (response.ok) {
        const data = await response.json();
        setInstances(data);
      } else {
        console.error('Failed to fetch instances');
        setInstances([]); // Em caso de erro, limpar a lista
      }
    } catch (error) {
      console.error('Erro ao carregar instÃ¢ncias:', error);
      setInstances([]); // Em caso de erro, limpar a lista
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const createInstance = async () => {
    if (!newInstanceName.trim()) return;

    try {
      const response = await fetch('/api/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newInstanceName }),
      });

      if (response.ok) {
        const newInstance = await response.json();
        const instanceId = newInstance.id || `inst_${Date.now()}`;

        setNewInstanceName('');
        setNewInstanceModal(false);

        // Abrir modal de QR code IMEDIATAMENTE
        generateQRCode(instanceId);

        // NÃƒO atualizar a lista ainda - sÃ³ apÃ³s conexÃ£o bem-sucedida
      }
    } catch (error) {
      console.error('Erro ao criar instÃ¢ncia:', error);
    }
  };

  const showSuccessAndClose = () => {
    setSuccessModal({ isOpen: true, countdown: 5 });

    // Iniciar countdown
    const countdownInterval = setInterval(() => {
      setSuccessModal(prev => {
        if (prev.countdown <= 1) {
          clearInterval(countdownInterval);
          // Fechar modals
          setSuccessModal({ isOpen: false, countdown: 0 });
          setQrModal({ instanceId: '', qrCode: '', isOpen: false });
          return { isOpen: false, countdown: 0 };
        }
        return { ...prev, countdown: prev.countdown - 1 };
      });
    }, 1000);
  };

  const generateQRCode = async (instanceId: string) => {
    // Simplesmente abrir o modal com o novo componente
    setQrModal({ instanceId, qrCode: '', isOpen: true, isMock: false });
  };

  const connectInstance = async (instanceId: string) => {
    generateQRCode(instanceId);
  };

  const disconnectInstance = async (instanceId: string) => {
    try {
      const response = await fetch(`/api/instances/${instanceId}/disconnect`, {
        method: 'POST',
      });

      if (response.ok) {
        // Atualizar a lista imediatamente apÃ³s desconectar
        await fetchInstances();
      } else {
        console.error('Failed to disconnect instance');
      }
    } catch (error) {
      console.error('Erro ao desconectar instÃ¢ncia:', error);
    }
  };

  const deleteInstance = async (instanceId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta instÃ¢ncia?')) return;

    try {
      const response = await fetch(`/api/instances/${instanceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setInstances(instances.filter(inst => inst.id !== instanceId));
      }
    } catch (error) {
      console.error('Erro ao excluir instÃ¢ncia:', error);
    }
  };

  const getStatusColor = (status: InstanceStats['status']) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800';
      case 'disconnected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: InstanceStats['status']) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando';
      case 'disconnected':
        return 'Desconectado';
      default:
        return 'Desconhecido';
    }
  };

  const formatLastActivity = (lastActivity: Date) => {
    const now = new Date();
    const activity = new Date(lastActivity);
    const diffMs = now.getTime() - activity.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Agora';
    if (diffMinutes < 60) return `${diffMinutes}min atrÃ¡s`;
    if (diffHours < 24) return `${diffHours}h atrÃ¡s`;
    if (diffDays < 7) return `${diffDays}d atrÃ¡s`;

    return activity.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Instancias WhatsApp</h1>
          <div className="flex items-center space-x-2">
            <p className="text-gray-600">Gerencie suas conexoes de automacao</p>
            {refreshing && (
              <div className="flex items-center text-sm text-blue-600">
                <ArrowPathIconAny className="h-4 w-4 mr-1 animate-spin" />
                Atualizando...
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => setNewInstanceModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIconAny className="h-5 w-5 mr-2" />
          Nova Instancia
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {instances.map(instance => (
          <div key={instance.id} className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {instance.name || `InstÃ¢ncia ${instance.id}`}
              </h3>
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(instance.status)}`}
              >
                <div
                  className={`w-2 h-2 rounded-full mr-1 ${
                    instance.status === 'connected'
                      ? 'bg-green-500 animate-pulse'
                      : instance.status === 'connecting'
                        ? 'bg-yellow-500 animate-pulse'
                        : 'bg-red-500'
                  }`}
                ></div>
                {getStatusText(instance.status)}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ID:</span>
                <span className="font-medium font-mono text-xs">{instance.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Numero:</span>
                <span className="font-medium">{instance.phoneNumber || 'NÃ£o conectado'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Mensagens hoje:</span>
                <span className="font-medium">
                  <span className="text-green-600">â†‘{instance.messagesSent}</span>
                  {' / '}
                  <span className="text-blue-600">â†“{instance.messagesReceived}</span>
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Ultima atividade:</span>
                <span className="font-medium">{formatLastActivity(instance.lastActivity)}</span>
              </div>
            </div>

            <div className="flex space-x-2">
              {instance.status === 'disconnected' ? (
                <button
                  onClick={() => connectInstance(instance.id)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center"
                >
                  <QrCodeIconAny className="h-4 w-4 mr-2" />
                  Gerar QR Code
                </button>
              ) : (
                <button
                  onClick={() => disconnectInstance(instance.id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg text-sm transition-colors"
                >
                  Desconectar
                </button>
              )}
              <button
                onClick={() => deleteInstance(instance.id)}
                className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                aria-label="Excluir instÃ¢ncia"
                title="Excluir instÃ¢ncia"
              >
                <TrashIconAny className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}

        {instances.length === 0 && (
          <div className="col-span-3 text-center py-12">
            <QrCodeIconAny className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma instÃ¢ncia</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comece criando uma nova instÃ¢ncia WhatsApp.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setNewInstanceModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIconAny className="h-5 w-5 mr-2" />
                Nova InstÃ¢ncia
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal para criar nova instÃ¢ncia */}
      {newInstanceModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Nova InstÃ¢ncia</h3>
                <button
                  onClick={() => setNewInstanceModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  title="Fechar modal"
                  aria-label="Fechar modal"
                >
                  <XMarkIconAny className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="instanceName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Nome da InstÃ¢ncia
                </label>
                <input
                  type="text"
                  id="instanceName"
                  value={newInstanceName}
                  onChange={e => setNewInstanceName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
                  placeholder="Ex: Vendas, Suporte, Marketing..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setNewInstanceModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={createInstance}
                  disabled={!newInstanceName.trim()}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Criar InstÃ¢ncia
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para QR Code */}
      {qrModal.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Conectar WhatsApp</h3>
                <button
                  onClick={() => setQrModal({ instanceId: '', qrCode: '', isOpen: false })}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                  title="Fechar modal QR Code"
                  aria-label="Fechar modal QR Code"
                >
                  <XMarkIconAny className="h-6 w-6" />
                </button>
              </div>

              <div>
                <QRCodeGeneratorNew
                  instanceId={qrModal.instanceId}
                  onConnectionSuccess={() => {
                    // Atualizar lista APENAS apÃ³s conexÃ£o bem-sucedida
                    fetchInstances();
                    // Mostrar modal de sucesso
                    showSuccessAndClose();
                  }}
                  onAutoClose={() => {
                    setQrModal({ instanceId: '', qrCode: '', isOpen: false });
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Sucesso */}
      {successModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md mx-4 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              ðŸŽ‰ ConexÃ£o Estabelecida com Sucesso!
            </h3>
            <p className="text-gray-600 mb-4">
              Sua instÃ¢ncia do WhatsApp foi conectada e estÃ¡ pronta para enviar mensagens.
            </p>
            <div className="text-sm text-gray-500 mb-4">
              Fechando automaticamente em {successModal.countdown} segundos...
            </div>
            <button
              onClick={() => {
                setSuccessModal({ isOpen: false, countdown: 0 });
                setQrModal({ instanceId: '', qrCode: '', isOpen: false });
              }}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Fechar Agora
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

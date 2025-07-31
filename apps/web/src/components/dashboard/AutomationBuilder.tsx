'use client'

import React, { useState } from 'react'
import { 
  PlusIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  ClockIcon,
  BoltIcon,
  CogIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

interface AutomationRule {
  id: string
  name: string
  description: string
  trigger: {
    type: 'keyword' | 'time' | 'webhook' | 'new_contact'
    value: string
    conditions?: string[]
  }
  actions: {
    type: 'send_message' | 'add_tag' | 'webhook' | 'delay' | 'transfer'
    value: string
    delay?: number
  }[]
  isActive: boolean
  stats: {
    triggered: number
    completed: number
    errors: number
  }
  createdAt: Date
}

interface AutomationBuilderProps {
  rules?: AutomationRule[]
  onRuleCreate?: (rule: Omit<AutomationRule, 'id' | 'stats' | 'createdAt'>) => void
  onRuleToggle?: (ruleId: string, isActive: boolean) => void
  onRuleDelete?: (ruleId: string) => void
}

export default function AutomationBuilder({
  rules: propRules = [],
  onRuleCreate,
  onRuleToggle,
  onRuleDelete
}: AutomationBuilderProps) {
  const [showBuilder, setShowBuilder] = useState(false)
  const [expandedRule, setExpandedRule] = useState<string | null>(null)

  // Mock data para demonstração
  const mockRules: AutomationRule[] = [
    {
      id: '1',
      name: 'Boas-vindas Automático',
      description: 'Envia mensagem de boas-vindas para novos contatos',
      trigger: {
        type: 'new_contact',
        value: 'new_contact',
        conditions: []
      },
      actions: [
        {
          type: 'send_message',
          value: 'Olá! Bem-vindo(a)! Como posso ajudá-lo(a) hoje?'
        },
        {
          type: 'add_tag',
          value: 'novo_contato'
        }
      ],
      isActive: true,
      stats: { triggered: 45, completed: 43, errors: 2 },
      createdAt: new Date('2024-01-15')
    },
    {
      id: '2',
      name: 'Resposta Preços',
      description: 'Responde automaticamente quando perguntam sobre preços',
      trigger: {
        type: 'keyword',
        value: 'preço',
        conditions: ['precos', 'valor', 'custo', 'quanto custa']
      },
      actions: [
        {
          type: 'send_message',
          value: 'Nossos preços variam conforme o serviço. Gostaria de uma proposta personalizada?'
        },
        {
          type: 'add_tag',
          value: 'interessado_preco'
        }
      ],
      isActive: true,
      stats: { triggered: 89, completed: 87, errors: 2 },
      createdAt: new Date('2024-01-20')
    },
    {
      id: '3',
      name: 'Horário Comercial',
      description: 'Informa horário de funcionamento fora do expediente',
      trigger: {
        type: 'time',
        value: '18:00-08:00',
        conditions: []
      },
      actions: [
        {
          type: 'send_message',
          value: 'Nosso horário de atendimento é das 8h às 18h. Retornaremos em breve!'
        }
      ],
      isActive: false,
      stats: { triggered: 23, completed: 23, errors: 0 },
      createdAt: new Date('2024-01-10')
    }
  ]

  const rules = propRules.length > 0 ? propRules : mockRules

  const getTriggerLabel = (trigger: AutomationRule['trigger']): string => {
    switch (trigger.type) {
      case 'keyword':
        return `Palavra-chave: "${trigger.value}"`
      case 'time':
        return `Horário: ${trigger.value}`
      case 'webhook':
        return `Webhook: ${trigger.value}`
      case 'new_contact':
        return 'Novo contato'
      default:
        return trigger.value
    }
  }

  const getActionLabel = (action: AutomationRule['actions'][0]): string => {
    switch (action.type) {
      case 'send_message':
        return `Enviar: "${action.value.substring(0, 30)}..."`
      case 'add_tag':
        return `Adicionar tag: ${action.value}`
      case 'webhook':
        return `Chamar webhook: ${action.value}`
      case 'delay':
        return `Aguardar ${action.delay}s`
      case 'transfer':
        return `Transferir para: ${action.value}`
      default:
        return action.value
    }
  }

  const handleToggleRule = (ruleId: string, isActive: boolean) => {
    onRuleToggle?.(ruleId, isActive)
  }

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Tem certeza que deseja excluir esta automação?')) {
      onRuleDelete?.(ruleId)
    }
  }

  const getSuccessRate = (stats: AutomationRule['stats']): number => {
    if (stats.triggered === 0) return 0
    return Math.round((stats.completed / stats.triggered) * 100)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-500 p-2 rounded-lg">
              <BoltIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Automações Inteligentes
              </h3>
              <p className="text-sm text-gray-500">
                Configure respostas automáticas e fluxos de trabalho
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowBuilder(!showBuilder)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Nova Automação</span>
          </button>
        </div>
      </div>

      {/* Estatísticas gerais */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {rules.filter(r => r.isActive).length}
            </div>
            <div className="text-sm text-gray-600">Ativas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {rules.reduce((acc, r) => acc + r.stats.triggered, 0)}
            </div>
            <div className="text-sm text-gray-600">Acionamentos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {rules.reduce((acc, r) => acc + r.stats.completed, 0)}
            </div>
            <div className="text-sm text-gray-600">Executadas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(
                (rules.reduce((acc, r) => acc + r.stats.completed, 0) / 
                 Math.max(rules.reduce((acc, r) => acc + r.stats.triggered, 0), 1)) * 100
              )}%
            </div>
            <div className="text-sm text-gray-600">Taxa de Sucesso</div>
          </div>
        </div>
      </div>

      {/* Lista de automações */}
      <div className="p-6">
        {rules.length === 0 ? (
          <div className="text-center py-8">
            <BoltIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma automação configurada
            </h4>
            <p className="text-gray-500 mb-4">
              Crie sua primeira automação para começar a responder automaticamente
            </p>
            <button
              onClick={() => setShowBuilder(true)}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              Criar Primeira Automação
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Header da regra */}
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => setExpandedRule(
                          expandedRule === rule.id ? null : rule.id
                        )}
                        className="text-gray-500 hover:text-gray-700"
                        aria-label="Expandir detalhes"
                      >
                        {expandedRule === rule.id ? (
                          <ChevronDownIcon className="w-5 h-5" />
                        ) : (
                          <ChevronRightIcon className="w-5 h-5" />
                        )}
                      </button>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-lg font-medium text-gray-900">
                            {rule.name}
                          </h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            rule.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {rule.isActive ? 'Ativa' : 'Pausada'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {rule.description}
                        </p>
                      </div>
                    </div>

                    {/* Estatísticas e controles */}
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {rule.stats.triggered}
                        </div>
                        <div className="text-xs text-gray-500">Disparos</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm font-medium text-green-600">
                          {getSuccessRate(rule.stats)}%
                        </div>
                        <div className="text-xs text-gray-500">Sucesso</div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleRule(rule.id, !rule.isActive)}
                          className={`p-2 rounded-lg transition-colors ${
                            rule.isActive
                              ? 'text-orange-600 hover:bg-orange-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          aria-label={rule.isActive ? 'Pausar automação' : 'Ativar automação'}
                        >
                          {rule.isActive ? (
                            <PauseIcon className="w-5 h-5" />
                          ) : (
                            <PlayIcon className="w-5 h-5" />
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Excluir automação"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detalhes expandidos */}
                {expandedRule === rule.id && (
                  <div className="p-4 space-y-4">
                    {/* Gatilho */}
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">
                        Gatilho (Quando executar)
                      </h5>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <ClockIcon className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-800">
                            {getTriggerLabel(rule.trigger)}
                          </span>
                        </div>
                        {rule.trigger.conditions && rule.trigger.conditions.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs text-blue-600 mb-1">
                              Palavras relacionadas:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {rule.trigger.conditions.map((condition) => (
                                <span 
                                  key={`${rule.id}-condition-${condition}`}
                                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                                >
                                  {condition}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">
                        Ações (O que fazer)
                      </h5>
                      <div className="space-y-2">
                        {rule.actions.map((action, idx) => (
                          <div
                            key={`${rule.id}-action-${idx}-${action.type}`}
                            className="bg-green-50 border border-green-200 rounded-lg p-3"
                          >
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                {idx + 1}
                              </div>
                              <span className="text-sm text-green-800">
                                {getActionLabel(action)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Estatísticas detalhadas */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">
                          {rule.stats.triggered}
                        </div>
                        <div className="text-xs text-gray-500">Acionamentos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {rule.stats.completed}
                        </div>
                        <div className="text-xs text-gray-500">Executadas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">
                          {rule.stats.errors}
                        </div>
                        <div className="text-xs text-gray-500">Erros</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Builder simples (placeholder) */}
      {showBuilder && (
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="text-center py-8">
            <CogIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Construtor de Automações
            </h4>
            <p className="text-gray-500 mb-4">
              Funcionalidade avançada em desenvolvimento
            </p>
            <button
              onClick={() => setShowBuilder(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000'

// Mock data for development
const mockInstances = [
  {
    id: 'inst_001',
    name: 'Vendas Principal',
    status: 'connected',
    phoneNumber: '+55 11 99999-9999',
    messagesSent: 523,
    messagesReceived: 789,
    lastActivity: new Date().toISOString()
  },
  {
    id: 'inst_002',
    name: 'Suporte Técnico',
    status: 'connecting',
    messagesSent: 234,
    messagesReceived: 456,
    lastActivity: new Date(Date.now() - 3600000).toISOString()
  }
]

export async function GET() {
  try {
    // Tentar conectar com o novo backend primeiro
    const response = await fetch(`${API_BASE_URL}/api/instances-v2/all`, {
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5 segundo timeout
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        // Converter formato da nova API para o formato esperado pelo frontend
        const instances = result.data.map((instance: any) => ({
          id: instance.id,
          name: `Instância ${instance.id}`,
          status: instance.status === 'ready' ? 'connected' : 
                 instance.status === 'qr_ready' ? 'connecting' : 
                 instance.status === 'authenticated' ? 'connecting' : 
                 instance.status === 'loading' ? 'connecting' : 'disconnected',
          phoneNumber: instance.clientInfo?.wid ? 
                      instance.clientInfo.wid.split('@')[0].replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 $2 $3-$4') : 
                      'Não conectado',
          messagesSent: 0, // TODO: implementar contadores de mensagens
          messagesReceived: 0, // TODO: implementar contadores de mensagens
          lastActivity: instance.lastSeen || new Date().toISOString(),
          qrCode: instance.qr || null,
          clientInfo: instance.clientInfo
        }))
        return NextResponse.json(instances)
      }
    }
    
    // Se falhar, usar dados mock
    console.warn('Backend API não disponível, usando dados mock')
    return NextResponse.json(mockInstances)
  } catch (error) {
    console.warn('Error connecting to backend, using mock data:', error)
    return NextResponse.json(mockInstances)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Gerar um ID único para a instância
    const instanceId = `inst_${Date.now()}`
    
    // Tentar conectar com o backend primeiro
    try {
      const response = await fetch(`${API_BASE_URL}/api/instances-v2/create/${instanceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: body.name }),
        signal: AbortSignal.timeout(10000),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          const newInstance = {
            id: instanceId,
            name: body.name || `Instância ${instanceId}`,
            status: 'connecting',
            phoneNumber: 'Não conectado',
            messagesSent: 0,
            messagesReceived: 0,
            lastActivity: new Date().toISOString()
          }
          return NextResponse.json(newInstance, { status: 201 })
        }
      }
    } catch (backendError) {
      console.warn('Backend API não disponível para criação:', backendError)
    }
    
    // Se falhar, simular criação local
    const newInstance = {
      id: instanceId,
      name: body.name || 'Nova Instância',
      status: 'connecting',
      messagesSent: 0,
      messagesReceived: 0,
      lastActivity: new Date().toISOString()
    }
    
    return NextResponse.json(newInstance, { status: 201 })
  } catch (error) {
    console.error('Error creating instance:', error)
    return NextResponse.json(
      { error: 'Failed to create instance' }, 
      { status: 500 }
    )
  }
}

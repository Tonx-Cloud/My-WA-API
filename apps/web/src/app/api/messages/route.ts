import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000'

export async function GET(request: NextRequest) {
  try {
    // Attempt to connect to backend API with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const response = await fetch(`${API_BASE_URL}/api/messages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || '',
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }

      const data = await response.json()
      
      return NextResponse.json(data)
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  } catch (error) {
    console.error('Error fetching messages from backend, using mock data:', error)
    
    // Return mock messages data as fallback
    const mockMessages = [
      {
        id: 'msg_001',
        instanceId: 'inst_001',
        to: '+55 11 99999-8888',
        content: 'Olá! Como posso ajudá-lo hoje?',
        status: 'delivered',
        sentAt: new Date(Date.now() - 3600000).toISOString(),
        deliveredAt: new Date(Date.now() - 3300000).toISOString()
      },
      {
        id: 'msg_002',
        instanceId: 'inst_001',
        to: '+55 11 77777-6666',
        content: 'Seu pedido foi confirmado e está sendo preparado.',
        status: 'read',
        sentAt: new Date(Date.now() - 7200000).toISOString(),
        deliveredAt: new Date(Date.now() - 7000000).toISOString(),
        readAt: new Date(Date.now() - 6800000).toISOString()
      },
      {
        id: 'msg_003',
        instanceId: 'inst_002',
        to: '+55 11 55555-4444',
        content: 'Promoção especial! Não perca esta oportunidade.',
        status: 'failed',
        sentAt: new Date(Date.now() - 10800000).toISOString(),
        error: 'Número não encontrado'
      },
      {
        id: 'msg_004',
        instanceId: 'inst_001',
        to: '+55 11 33333-2222',
        content: 'Obrigado por entrar em contato! Responderemos em breve.',
        status: 'sent',
        sentAt: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: 'msg_005',
        instanceId: 'inst_002',
        to: '+55 11 44444-5555',
        content: 'Sua consulta foi agendada para amanhã às 14h.',
        status: 'read',
        sentAt: new Date(Date.now() - 14400000).toISOString(),
        deliveredAt: new Date(Date.now() - 14200000).toISOString(),
        readAt: new Date(Date.now() - 13800000).toISOString()
      }
    ]
    
    return NextResponse.json({
      messages: mockMessages,
      status: 'mock_data',
      message: 'Using mock data - backend API unavailable'
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Attempt to connect to backend API with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const response = await fetch(`${API_BASE_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || '',
        },
        body: JSON.stringify(body),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      
      return NextResponse.json(data)
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  } catch (error) {
    console.error('Error sending message via backend, using mock response:', error)
    
    // Return mock success response as fallback
    return NextResponse.json({
      success: true,
      messageId: `msg_mock_${Date.now()}`,
      status: 'sent',
      message: 'Mensagem enviada com sucesso (simulado)',
      mock: true
    })
  }
}


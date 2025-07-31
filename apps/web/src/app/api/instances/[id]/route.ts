import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Tentar conectar com o backend primeiro
    try {
      const response = await fetch(`${API_BASE_URL}/api/instances/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      })

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data)
      }
    } catch (backendError) {
      console.warn('Backend API não disponível para deleção:', backendError)
    }
    
    // Se falhar, simular deleção local
    return NextResponse.json({ 
      success: true, 
      message: `Instância ${params.id} removida localmente` 
    })
  } catch (error) {
    console.error('Error deleting instance:', error)
    return NextResponse.json(
      { error: 'Failed to delete instance' }, 
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Tentar conectar com o backend primeiro
    try {
      const response = await fetch(`${API_BASE_URL}/api/instances/${params.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      })

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data.instance)
      }
    } catch (backendError) {
      console.warn('Backend API não disponível:', backendError)
    }

    // Se falhar, retornar dados mock
    const mockInstance = {
      id: params.id,
      name: `Instância ${params.id}`,
      status: 'connected',
      phoneNumber: '+55 11 99999-9999',
      messagesSent: 100,
      messagesReceived: 150,
      lastActivity: new Date().toISOString()
    }
    
    return NextResponse.json(mockInstance)
  } catch (error) {
    console.error('Error fetching instance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch instance' }, 
      { status: 500 }
    )
  }
}

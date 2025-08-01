import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const instanceId = params.id
    
    // Tentar obter QR code do backend
    const response = await fetch(`${BACKEND_URL}/api/instances-v2/qr/${instanceId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data?.qr) {
        return NextResponse.json({ 
          success: true, 
          qrCode: result.data.qr,
          status: 'generated'
        })
      }
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'QR code not available',
      status: 'pending' 
    }, { status: 404 })
    
  } catch (error) {
    console.error('Error getting QR code:', error)
    return NextResponse.json(
      { error: 'Failed to get QR code' }, 
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Attempt to connect to backend API with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      // Primeiro, tentar criar a instância
      const createResponse = await fetch(`${BACKEND_URL}/api/instances-v2/create/${params.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      })

      if (!createResponse.ok) {
        throw new Error('Failed to create instance')
      }

      // Depois, obter o QR code
      const qrResponse = await fetch(`${BACKEND_URL}/api/instances-v2/qr/${params.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (qrResponse.ok) {
        const data = await qrResponse.json()
        if (data.success && data.data?.qr) {
          return NextResponse.json({
            qrCode: data.data.qr,
            status: 'generated'
          })
        }
      }
      
      // Se não tiver QR ainda, retornar status
      return NextResponse.json({
        qrCode: null,
        status: 'generating'
      })
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  } catch (error) {
    console.error('Error generating QR code from backend:', error)
    
    return NextResponse.json(
      { 
        error: 'Backend API unavailable', 
        message: 'Unable to generate QR code. Please check if the API service is running.',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 503 }
    )
  }
}

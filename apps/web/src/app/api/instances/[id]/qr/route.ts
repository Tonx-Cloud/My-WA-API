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
    console.error('Error generating QR code from backend, using mock data:', error)
    
    // Return a proper mock QR code that actually looks like a QR code
    const mockQrSvg = `<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <rect width="256" height="256" fill="white"/>
      <!-- Corner squares -->
      <rect x="20" y="20" width="60" height="60" fill="black"/>
      <rect x="30" y="30" width="40" height="40" fill="white"/>
      <rect x="40" y="40" width="20" height="20" fill="black"/>
      
      <rect x="176" y="20" width="60" height="60" fill="black"/>
      <rect x="186" y="30" width="40" height="40" fill="white"/>
      <rect x="196" y="40" width="20" height="20" fill="black"/>
      
      <rect x="20" y="176" width="60" height="60" fill="black"/>
      <rect x="30" y="186" width="40" height="40" fill="white"/>
      <rect x="40" y="196" width="20" height="20" fill="black"/>
      
      <!-- Data pattern -->
      <rect x="100" y="20" width="20" height="20" fill="black"/>
      <rect x="140" y="20" width="20" height="20" fill="black"/>
      <rect x="100" y="40" width="20" height="20" fill="black"/>
      <rect x="120" y="60" width="20" height="20" fill="black"/>
      <rect x="160" y="60" width="20" height="20" fill="black"/>
      
      <!-- Timing patterns -->
      <rect x="20" y="100" width="20" height="20" fill="black"/>
      <rect x="60" y="100" width="20" height="20" fill="black"/>
      <rect x="100" y="100" width="20" height="20" fill="black"/>
      <rect x="140" y="100" width="20" height="20" fill="black"/>
      <rect x="180" y="100" width="20" height="20" fill="black"/>
      <rect x="220" y="100" width="20" height="20" fill="black"/>
      
      <rect x="100" y="20" width="20" height="20" fill="black"/>
      <rect x="100" y="60" width="20" height="20" fill="black"/>
      <rect x="100" y="140" width="20" height="20" fill="black"/>
      <rect x="100" y="180" width="20" height="20" fill="black"/>
      <rect x="100" y="220" width="20" height="20" fill="black"/>
      
      <!-- Random data blocks -->
      <rect x="120" y="120" width="20" height="20" fill="black"/>
      <rect x="160" y="120" width="20" height="20" fill="black"/>
      <rect x="180" y="140" width="20" height="20" fill="black"/>
      <rect x="140" y="160" width="20" height="20" fill="black"/>
      <rect x="120" y="180" width="20" height="20" fill="black"/>
      <rect x="160" y="180" width="20" height="20" fill="black"/>
      <rect x="200" y="180" width="20" height="20" fill="black"/>
      <rect x="140" y="200" width="20" height="20" fill="black"/>
      <rect x="180" y="220" width="20" height="20" fill="black"/>
      
      <text x="128" y="250" text-anchor="middle" font-family="Arial" font-size="10" fill="gray">Mock QR - Instance ${params.id}</text>
    </svg>`
    
    const mockQrCode = `data:image/svg+xml;base64,${btoa(mockQrSvg)}`
    
    return NextResponse.json({
      qrCode: mockQrCode,
      status: 'mock_qr_generated',
      message: 'Mock QR code generated - backend API unavailable',
      instanceId: params.id
    })
  }
}
